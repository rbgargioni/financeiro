import { companies as seedCompanies } from "../mock-data/companies";
import { users as seedUsers } from "../mock-data/users";
import { transactions as seedTransactions } from "../mock-data/transactions";
import { categories as seedCategories } from "../mock-data/categories";
import { contacts as seedContacts } from "../mock-data/contacts";
import { plans as seedPlans } from "../mock-data/plans";
import { Company, AppUser, Transaction, Category, Contact, Plan } from "../types";

const STORAGE_KEY = "financeiro_mock_store_v1";

export interface Store {
  companies: Company[];
  users: AppUser[];
  transactions: Transaction[];
  categories: Category[];
  contacts: Contact[];
  plans: Plan[];
}

function seedStore(): Store {
  return {
    companies: JSON.parse(JSON.stringify(seedCompanies)),
    users: JSON.parse(JSON.stringify(seedUsers)),
    transactions: JSON.parse(JSON.stringify(seedTransactions)),
    categories: JSON.parse(JSON.stringify(seedCategories)),
    contacts: JSON.parse(JSON.stringify(seedContacts)),
    plans: JSON.parse(JSON.stringify(seedPlans)),
  };
}

let memoryStore: Store | null = null;

function persistStore() {
  if (!memoryStore || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

function loadStore(): Store {
  if (memoryStore) return memoryStore;
  if (typeof window === "undefined") {
    memoryStore = seedStore();
    return memoryStore;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryStore = JSON.parse(raw) as Store;
      return memoryStore;
    }
  } catch {
    // ignore corrupted storage, fall back to seed
  }
  memoryStore = seedStore();
  persistStore();
  return memoryStore;
}

export function getStore(): Store {
  return loadStore();
}

export function mutateStore(mutator: (store: Store) => void) {
  const store = loadStore();
  mutator(store);
  persistStore();
}

export function resetStore() {
  memoryStore = seedStore();
  persistStore();
}

export function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
