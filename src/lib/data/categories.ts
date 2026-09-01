import { getStore, mutateStore, delay } from "./store";
import { Category } from "../types";

export async function listCategories(companyId: string): Promise<Category[]> {
  return delay(getStore().categories.filter((c) => c.companyId === companyId));
}

export async function createCategory(input: Omit<Category, "id">): Promise<Category> {
  const category: Category = { ...input, id: `cat-${Date.now()}-${Math.round(Math.random() * 1000)}` };
  mutateStore((store) => {
    store.categories.push(category);
  });
  return delay(category);
}

export async function deleteCategory(id: string): Promise<void> {
  mutateStore((store) => {
    store.categories = store.categories.filter((c) => c.id !== id);
  });
  return delay(undefined);
}
