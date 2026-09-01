import { collection, doc, getDocs, addDoc, deleteDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { StockMovement } from "../types";
import { adjustProductQuantity } from "./products";

const movementsRef = collection(db, "stockMovements");

function toMovement(id: string, data: DocumentData): StockMovement {
  return {
    id,
    companyId: data.companyId,
    productId: data.productId,
    type: data.type,
    quantity: data.quantity,
    reason: data.reason,
    date: data.date,
  };
}

export async function listStockMovements(companyId: string): Promise<StockMovement[]> {
  const snap = await getDocs(query(movementsRef, where("companyId", "==", companyId)));
  return snap.docs
    .map((d) => toMovement(d.id, d.data()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Records a stock movement and keeps the product's current quantity in sync. */
export async function createStockMovement(input: Omit<StockMovement, "id">): Promise<StockMovement> {
  const ref = await addDoc(movementsRef, input);
  const delta = input.type === "in" ? input.quantity : -input.quantity;
  await adjustProductQuantity(input.productId, delta);
  return { id: ref.id, ...input };
}

/** Deletes a movement and reverses its effect on the product's quantity. */
export async function deleteStockMovement(movement: StockMovement): Promise<void> {
  await deleteDoc(doc(db, "stockMovements", movement.id));
  const delta = movement.type === "in" ? -movement.quantity : movement.quantity;
  await adjustProductQuantity(movement.productId, delta);
}
