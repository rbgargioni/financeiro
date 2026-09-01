import { getStore, mutateStore, delay } from "./store";
import { AppUser } from "../types";

export async function listUsersByCompany(companyId: string): Promise<AppUser[]> {
  return delay(getStore().users.filter((u) => u.companyId === companyId));
}

export async function getUserByEmail(email: string): Promise<AppUser | undefined> {
  const normalized = email.trim().toLowerCase();
  return delay(getStore().users.find((u) => u.email.toLowerCase() === normalized));
}

export async function getUserById(id: string): Promise<AppUser | undefined> {
  return delay(getStore().users.find((u) => u.id === id));
}

export async function createUser(input: Omit<AppUser, "id">): Promise<AppUser> {
  const user: AppUser = { ...input, id: `user-${Date.now()}-${Math.round(Math.random() * 1000)}` };
  mutateStore((store) => {
    store.users.push(user);
  });
  return delay(user);
}
