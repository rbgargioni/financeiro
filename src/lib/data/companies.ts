import { collection, doc, getDoc, getDocs, updateDoc, addDoc, DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { Company, SubscriptionStatus } from "../types";

const companiesRef = collection(db, "companies");

function toCompany(id: string, data: DocumentData): Company {
  return {
    id,
    name: data.name,
    cnpj: data.cnpj,
    segment: data.segment,
    planId: data.planId,
    subscriptionStatus: data.subscriptionStatus,
    trialEndsAt: data.trialEndsAt,
    createdAt: data.createdAt,
  };
}

export async function listCompanies(): Promise<Company[]> {
  const snap = await getDocs(companiesRef);
  return snap.docs.map((d) => toCompany(d.id, d.data()));
}

export async function getCompany(companyId: string): Promise<Company | undefined> {
  const snap = await getDoc(doc(db, "companies", companyId));
  return snap.exists() ? toCompany(snap.id, snap.data()) : undefined;
}

export async function updateCompanyStatus(companyId: string, status: SubscriptionStatus): Promise<void> {
  await updateDoc(doc(db, "companies", companyId), { subscriptionStatus: status });
}

export async function updateCompanyPlan(companyId: string, planId: string): Promise<void> {
  await updateDoc(doc(db, "companies", companyId), { planId });
}

export async function createCompany(input: Omit<Company, "id">): Promise<Company> {
  const ref = await addDoc(companiesRef, input);
  return { id: ref.id, ...input };
}
