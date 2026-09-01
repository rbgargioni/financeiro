import { collection, doc, getDocs, addDoc, deleteDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { Category } from "../types";

const categoriesRef = collection(db, "categories");

function toCategory(id: string, data: DocumentData): Category {
  return { id, companyId: data.companyId, name: data.name, type: data.type };
}

export async function listCategories(companyId: string): Promise<Category[]> {
  const snap = await getDocs(query(categoriesRef, where("companyId", "==", companyId)));
  return snap.docs.map((d) => toCategory(d.id, d.data()));
}

export async function createCategory(input: Omit<Category, "id">): Promise<Category> {
  const ref = await addDoc(categoriesRef, input);
  return { id: ref.id, ...input };
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "categories", id));
}
