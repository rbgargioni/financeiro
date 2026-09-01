import { collection, doc, getDocs, addDoc, deleteDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { Contact } from "../types";

const contactsRef = collection(db, "contacts");

function toContact(id: string, data: DocumentData): Contact {
  return {
    id,
    companyId: data.companyId,
    name: data.name,
    type: data.type,
    document: data.document,
    email: data.email,
    phone: data.phone,
  };
}

export async function listContacts(companyId: string): Promise<Contact[]> {
  const snap = await getDocs(query(contactsRef, where("companyId", "==", companyId)));
  return snap.docs.map((d) => toContact(d.id, d.data()));
}

export async function createContact(input: Omit<Contact, "id">): Promise<Contact> {
  const ref = await addDoc(contactsRef, input);
  return { id: ref.id, ...input };
}

export async function deleteContact(id: string): Promise<void> {
  await deleteDoc(doc(db, "contacts", id));
}
