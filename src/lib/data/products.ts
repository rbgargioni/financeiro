import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";

const productsRef = collection(db, "products");

function toProduct(id: string, data: DocumentData): Product {
  return {
    id,
    companyId: data.companyId,
    sku: data.sku,
    name: data.name,
    category: data.category,
    unit: data.unit,
    quantity: data.quantity,
    unitCost: data.unitCost,
    unitPrice: data.unitPrice,
    minStock: data.minStock,
  };
}

export async function listProducts(companyId: string): Promise<Product[]> {
  const snap = await getDocs(query(productsRef, where("companyId", "==", companyId)));
  return snap.docs.map((d) => toProduct(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createProduct(input: Omit<Product, "id">): Promise<Product> {
  const ref = await addDoc(productsRef, input);
  return { id: ref.id, ...input };
}

export async function updateProduct(id: string, input: Partial<Omit<Product, "id" | "companyId">>): Promise<void> {
  await updateDoc(doc(db, "products", id), input);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

export async function adjustProductQuantity(id: string, delta: number): Promise<void> {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);
  const current = snap.data()?.quantity ?? 0;
  await updateDoc(ref, { quantity: current + delta });
}
