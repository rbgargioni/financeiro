import { getStore, delay } from "./store";
import { Plan } from "../types";

export async function listPlans(): Promise<Plan[]> {
  return delay([...getStore().plans]);
}

export async function getPlan(planId: string): Promise<Plan | undefined> {
  return delay(getStore().plans.find((p) => p.id === planId));
}
