import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { BankAccount } from "../types";

const bankAccountsRef = collection(db, "bankAccounts");

function toBankAccount(id: string, data: DocumentData): BankAccount {
  return {
    id,
    companyId: data.companyId,
    name: data.name,
    bank: data.bank ?? "",
    agency: data.agency ?? "",
    accountNumber: data.accountNumber ?? "",
    active: data.active ?? true,
  };
}

export async function listBankAccounts(companyId: string): Promise<BankAccount[]> {
  const snap = await getDocs(query(bankAccountsRef, where("companyId", "==", companyId)));
  return snap.docs.map((d) => toBankAccount(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createBankAccount(input: Omit<BankAccount, "id">): Promise<BankAccount> {
  const ref = await addDoc(bankAccountsRef, input);
  return { id: ref.id, ...input };
}

export async function updateBankAccount(
  id: string,
  patch: Partial<Pick<BankAccount, "name" | "bank" | "agency" | "accountNumber" | "active">>
): Promise<void> {
  await updateDoc(doc(db, "bankAccounts", id), patch);
}

export async function deleteBankAccount(id: string): Promise<void> {
  await deleteDoc(doc(db, "bankAccounts", id));
}
