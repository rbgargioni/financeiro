import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
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

export interface SignUpInput {
  companyName: string;
  cnpj: string;
  segment: string;
  ownerName: string;
  email: string;
  password: string;
}

export async function signUpCompany(input: SignUpInput): Promise<AppUser> {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);

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

export interface CreateCompanyUserInput {
  companyId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Creates a teammate's Firebase Auth account + profile from inside an owner/admin
 * session. Firebase's client SDK signs in as whichever account you just created on
 * the auth instance you used, so a throwaway secondary app instance is used here to
 * avoid hijacking the current user's session.
 */
export async function createCompanyUser(input: CreateCompanyUserInput): Promise<AppUser> {
  const secondaryApp = initializeApp(firebaseApp.options, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, input.email, input.password);
    return await createUserProfile(credential.user.uid, {
      companyId: input.companyId,
      name: input.name,
      email: input.email,
      role: input.role,
    });
  } finally {
    await firebaseSignOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp);
  }
}
