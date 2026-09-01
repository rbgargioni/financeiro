import { getStore, mutateStore, delay } from "./store";
import { Company, SubscriptionStatus } from "../types";

export async function listCompanies(): Promise<Company[]> {
  return delay([...getStore().companies]);
}

export async function getCompany(companyId: string): Promise<Company | undefined> {
  return delay(getStore().companies.find((c) => c.id === companyId));
}

export async function updateCompanyStatus(
  companyId: string,
  status: SubscriptionStatus
): Promise<void> {
  mutateStore((store) => {
    const company = store.companies.find((c) => c.id === companyId);
    if (company) company.subscriptionStatus = status;
  });
  return delay(undefined);
}

export async function updateCompanyPlan(companyId: string, planId: string): Promise<void> {
  mutateStore((store) => {
    const company = store.companies.find((c) => c.id === companyId);
    if (company) company.planId = planId;
  });
  return delay(undefined);
}

export async function createCompany(input: Omit<Company, "id">): Promise<Company> {
  const company: Company = { ...input, id: `company-${Date.now()}-${Math.round(Math.random() * 1000)}` };
  mutateStore((store) => {
    store.companies.push(company);
  });
  return delay(company);
}
