import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { Invoice, InvoiceTaxes } from "../types";

const invoicesRef = collection(db, "invoices");

function toInvoice(id: string, data: DocumentData): Invoice {
  return {
    id,
    companyId: data.companyId,
    direction: data.direction,
    accessKey: data.accessKey,
    number: data.number,
    series: data.series,
    issueDate: data.issueDate,
    issuerCnpj: data.issuerCnpj,
    issuerName: data.issuerName,
    recipientCnpj: data.recipientCnpj,
    recipientName: data.recipientName,
    productsValue: data.productsValue,
    discountValue: data.discountValue,
    freightValue: data.freightValue,
    taxes: data.taxes,
    totalValue: data.totalValue,
    items: data.items ?? [],
    importedAt: data.importedAt,
    transactionId: data.transactionId ?? null,
  };
}

export async function listInvoices(companyId: string): Promise<Invoice[]> {
  const snap = await getDocs(query(invoicesRef, where("companyId", "==", companyId)));
  return snap.docs
    .map((d) => toInvoice(d.id, d.data()))
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
}

export async function createInvoice(input: Omit<Invoice, "id">): Promise<Invoice> {
  const ref = await addDoc(invoicesRef, input);
  return { id: ref.id, ...input };
}

export async function updateInvoiceValues(id: string, totalValue: number, taxes: InvoiceTaxes): Promise<void> {
  await updateDoc(doc(db, "invoices", id), { totalValue, taxes });
}

export async function deleteInvoice(id: string): Promise<void> {
  await deleteDoc(doc(db, "invoices", id));
}
