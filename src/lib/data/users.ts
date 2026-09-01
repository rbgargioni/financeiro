import { collection, doc, getDoc, getDocs, query, where, setDoc, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { AppUser } from "../types";

const usersRef = collection(db, "users");

function toUser(id: string, data: DocumentData): AppUser {
  return {
    id,
    companyId: data.companyId ?? null,
    name: data.name,
    email: data.email,
    role: data.role,
  };
}

export async function listUsersByCompany(companyId: string): Promise<AppUser[]> {
  const snap = await getDocs(query(usersRef, where("companyId", "==", companyId)));
  return snap.docs.map((d) => toUser(d.id, d.data()));
}

export async function getUserById(uid: string): Promise<AppUser | undefined> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? toUser(snap.id, snap.data()) : undefined;
}

/** Writes the Firestore profile doc for a uid that already exists in Firebase Auth. */
export async function createUserProfile(uid: string, input: Omit<AppUser, "id">): Promise<AppUser> {
  await setDoc(doc(db, "users", uid), input);
  return { id: uid, ...input };
}
