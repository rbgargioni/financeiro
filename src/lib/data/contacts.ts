import { getStore, mutateStore, delay } from "./store";
import { Contact } from "../types";

export async function listContacts(companyId: string): Promise<Contact[]> {
  return delay(getStore().contacts.filter((c) => c.companyId === companyId));
}

export async function createContact(input: Omit<Contact, "id">): Promise<Contact> {
  const contact: Contact = { ...input, id: `contact-${Date.now()}-${Math.round(Math.random() * 1000)}` };
  mutateStore((store) => {
    store.contacts.push(contact);
  });
  return delay(contact);
}

export async function deleteContact(id: string): Promise<void> {
  mutateStore((store) => {
    store.contacts = store.contacts.filter((c) => c.id !== id);
  });
  return delay(undefined);
}
