import { getStrategy, strategies } from "@/methodology/types";
export const MethodologyService = { list: () => Object.values(strategies), get: (id: string) => getStrategy(id), rules: (id: string) => getStrategy(id).rules, metrics: (id: string) => getStrategy(id).metrics };
