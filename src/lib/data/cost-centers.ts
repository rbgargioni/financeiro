import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { CostCenter } from "../types";

const costCentersRef = collection(db, "costCenters");

function toCostCenter(id: string, data: DocumentData): CostCenter {
  return {
    id,
    companyId: data.companyId,
    name: data.name,
    description: data.description ?? "",
    active: data.active ?? true,
  };
}

export async function listCostCenters(companyId: string): Promise<CostCenter[]> {
  const snap = await getDocs(query(costCentersRef, where("companyId", "==", companyId)));
  return snap.docs.map((d) => toCostCenter(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCostCenter(input: Omit<CostCenter, "id">): Promise<CostCenter> {
  const ref = await addDoc(costCentersRef, input);
  return { id: ref.id, ...input };
}

export async function updateCostCenter(
  id: string,
  patch: Partial<Pick<CostCenter, "name" | "description" | "active">>
): Promise<void> {
  await updateDoc(doc(db, "costCenters", id), patch);
}

export async function deleteCostCenter(id: string): Promise<void> {
  await deleteDoc(doc(db, "costCenters", id));
}
