import { UserRole } from "@/lib/types";

/**
 * Seed-only shape: `password` is used to create the real Firebase Auth account
 * (scripts/seed.ts), it isn't part of the app's AppUser/Firestore profile shape.
 */
export interface SeedUser {
  companyId: string | null;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const users: SeedUser[] = [
  {
    companyId: null,
    name: "Rafael (Plataforma)",
    email: "admin@plataforma.com",
    password: "senha123",
    role: "super_admin",
  },
  {
    companyId: "company-paonosso",
    name: "Marcos Andrade",
    email: "contato@paonosso.com.br",
    password: "senha123",
    role: "owner",
  },
  {
    companyId: "company-rotacerta",
    name: "Fernanda Lima",
    email: "financeiro@rotacerta.com.br",
    password: "senha123",
    role: "owner",
  },
  {
    companyId: "company-rotacerta",
    name: "João Pedro Souza",
    email: "joao@rotacerta.com.br",
    password: "senha123",
    role: "member",
  },
  {
    companyId: "company-boavista",
    name: "Carla Nogueira",
    email: "contato@boavista.com.br",
    password: "senha123",
    role: "owner",
  },
];
