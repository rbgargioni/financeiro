import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
} from "firebase/auth";
import { auth, firebaseApp } from "../firebase";
import { createUserProfile, getUserById } from "./users";
import { createCompany } from "./companies";
import { AppUser, UserRole } from "../types";

export async function login(email: string, password: string): Promise<AppUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserById(credential.user.uid);
  if (!profile) {
    throw new Error("Usuário autenticado, mas sem perfil cadastrado. Fale com o suporte.");
  }
  return profile;
}

export function logout() {
  return firebaseSignOut(auth);
}

/**
 * Firebase's client SDK signs in as whichever account you just created on the
 * auth instance you used — so creating an account on behalf of someone else
 * (a teammate, or a new company from the admin panel) must happen on a
 * throwaway secondary app instance, or it hijacks the current session.
 */
async function withSecondaryAuth<T>(fn: (secondaryAuth: Auth) => Promise<T>): Promise<T> {
  const secondaryApp: FirebaseApp = initializeApp(firebaseApp.options, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    return await fn(secondaryAuth);
  } finally {
    await firebaseSignOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp);
  }
}

export interface SignUpInput {
  companyName: string;
  cnpj: string;
  segment: string;
  ownerName: string;
  email: string;
  password: string;
  trialDays?: number;
}

async function createCompanyAndOwner(targetAuth: Auth, input: SignUpInput): Promise<AppUser> {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + (input.trialDays ?? 7));

  const credential = await createUserWithEmailAndPassword(targetAuth, input.email, input.password);

  const company = await createCompany({
    name: input.companyName,
    cnpj: input.cnpj,
    segment: input.segment || "Outros",
    planId: "plan-starter",
    subscriptionStatus: "trialing",
    trialEndsAt: trialEndsAt.toISOString(),
    createdAt: new Date().toISOString(),
  });

  return createUserProfile(credential.user.uid, {
    companyId: company.id,
    name: input.ownerName,
    email: input.email,
    role: "owner",
  });
}

/** Public self-service signup (landing page "Teste grátis"). */
export async function signUpCompany(input: SignUpInput): Promise<AppUser> {
  return createCompanyAndOwner(auth, input);
}

/** Same flow, run from an already-authenticated super-admin session without hijacking it. */
export async function createCompanyAsAdmin(input: SignUpInput): Promise<AppUser> {
  return withSecondaryAuth((secondaryAuth) => createCompanyAndOwner(secondaryAuth, input));
}

export interface CreateCompanyUserInput {
  companyId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/** Adds a teammate to an existing company from an owner/admin session. */
export async function createCompanyUser(input: CreateCompanyUserInput): Promise<AppUser> {
  return withSecondaryAuth(async (secondaryAuth) => {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, input.email, input.password);
    return createUserProfile(credential.user.uid, {
      companyId: input.companyId,
      name: input.name,
      email: input.email,
      role: input.role,
    });
  });
}
