import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { Transaction } from "../types";

const transactionsRef = collection(db, "transactions");

function toTransaction(id: string, data: DocumentData): Transaction {
  return {
    id,
    companyId: data.companyId,
    type: data.type,
    description: data.description,
    amount: data.amount,
    dueDate: data.dueDate,
    paidAt: data.paidAt ?? null,
    status: data.status,
    categoryId: data.categoryId,
    contactId: data.contactId,
    recurrenceId: data.recurrenceId ?? null,
  };
}

export async function listTransactions(companyId: string): Promise<Transaction[]> {
  const snap = await getDocs(query(transactionsRef, where("companyId", "==", companyId)));
  return snap.docs
    .map((d) => toTransaction(d.id, d.data()))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export async function createTransaction(input: Omit<Transaction, "id">): Promise<Transaction> {
  const ref = await addDoc(transactionsRef, input);
  return { id: ref.id, ...input };
}

export async function markTransactionPaid(id: string): Promise<void> {
  await updateDoc(doc(db, "transactions", id), { status: "paid", paidAt: new Date().toISOString() });
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, "transactions", id));
}
