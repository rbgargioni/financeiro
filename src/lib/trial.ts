import { Company, SubscriptionStatus } from "./types";

/**
 * The seed data can mark a company as "expired" directly, but a company
 * seeded as "trialing" also needs to flip to expired once trialEndsAt has
 * passed, without any manual action. This derives the real-time status.
 */
export function getEffectiveStatus(company: Company): SubscriptionStatus {
  if (company.subscriptionStatus !== "trialing") {
    return company.subscriptionStatus;
  }
  const trialEndsAt = new Date(company.trialEndsAt).getTime();
  return Date.now() > trialEndsAt ? "expired" : "trialing";
}

export function daysRemaining(company: Company): number {
  const trialEndsAt = new Date(company.trialEndsAt).getTime();
  const diffMs = trialEndsAt - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Em teste grátis",
  active: "Ativo",
  past_due: "Pagamento pendente",
  canceled: "Cancelado",
  expired: "Teste expirado",
};
