import { AppUser } from "@/lib/types";

export const users: AppUser[] = [
  {
    id: "user-superadmin",
    companyId: null,
    name: "Rafael (Plataforma)",
    email: "admin@plataforma.com",
    password: "senha123",
    role: "super_admin",
  },
  {
    id: "user-paonosso-owner",
    companyId: "company-paonosso",
    name: "Marcos Andrade",
    email: "contato@paonosso.com.br",
    password: "senha123",
    role: "owner",
  },
  {
    id: "user-rotacerta-owner",
    companyId: "company-rotacerta",
    name: "Fernanda Lima",
    email: "financeiro@rotacerta.com.br",
    password: "senha123",
    role: "owner",
  },
  {
    id: "user-rotacerta-member",
    companyId: "company-rotacerta",
    name: "João Pedro Souza",
    email: "joao@rotacerta.com.br",
    password: "senha123",
    role: "member",
  },
  {
    id: "user-boavista-owner",
    companyId: "company-boavista",
    name: "Carla Nogueira",
    email: "contato@boavista.com.br",
    password: "senha123",
    role: "owner",
  },
];
