export type UserRole = "super_admin" | "owner" | "admin" | "member";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxTransactionsPerMonth: number;
  features: string[];
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  planId: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string; // ISO date
  createdAt: string; // ISO date
}

export interface AppUser {
  id: string; // Firebase Auth uid
  companyId: string | null; // null only for super_admin
  name: string;
  email: string;
  role: UserRole;
}

export type TransactionType = "receivable" | "payable";
export type TransactionStatus = "pending" | "paid" | "overdue";

export interface Transaction {
  id: string;
  companyId: string;
  type: TransactionType;
  description: string;
  amount: number;
  dueDate: string; // ISO date
  paidAt: string | null; // ISO date
  status: TransactionStatus;
  categoryId: string;
  contactId: string;
  recurrenceId?: string | null; // shared by every occurrence generated from the same recurring launch
}

export type CategoryType = "receivable" | "payable";

export interface Category {
  id: string;
  companyId: string;
  name: string;
  type: CategoryType;
}

export type ContactType = "client" | "supplier";

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  type: ContactType;
  document: string;
  email: string;
  phone: string;
}

export interface Product {
  id: string;
  companyId: string;
  sku: string;
  name: string;
  category: string;
  unit: string; // "un", "kg", "cx", etc.
  quantity: number; // current stock, kept in sync by StockMovements
  unitCost: number;
  unitPrice: number;
  minStock: number;
}

export type StockMovementType = "in" | "out";

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  date: string; // ISO date
}
