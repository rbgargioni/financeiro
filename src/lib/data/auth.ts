import { getStore, delay } from "./store";
import { createCompany } from "./companies";
import { createUser, getUserByEmail } from "./users";
import { AppUser } from "../types";

export async function login(email: string, password: string): Promise<AppUser | null> {
  const user = getStore().users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  return delay(user ?? null);
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
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("Já existe uma conta cadastrada com este e-mail.");
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  const company = await createCompany({
    name: input.companyName,
    cnpj: input.cnpj,
    segment: input.segment || "Outros",
    planId: "plan-starter",
    subscriptionStatus: "trialing",
    trialEndsAt: trialEndsAt.toISOString(),
    createdAt: new Date().toISOString(),
  });

  const user = await createUser({
    companyId: company.id,
    name: input.ownerName,
    email: input.email,
    password: input.password,
    role: "owner",
  });

  return user;
}
