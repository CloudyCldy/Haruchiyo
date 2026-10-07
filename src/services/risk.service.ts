/** SB-07: severidad = impacto (1..4) x probabilidad (1..3) => rango 1..12. Funciones puras. */
export const PROBABILITY_VALUES = ["LOW", "MEDIUM", "HIGH"] as const;
export const IMPACT_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export function riskSeverity(probability: string, impact: string) {
  return (IMPACT_VALUES.indexOf(impact as any) + 1) * (PROBABILITY_VALUES.indexOf(probability as any) + 1);
}
export function riskLevel(severity: number) { return severity >= 9 ? "CRITICAL" : severity >= 6 ? "HIGH" : severity >= 3 ? "MEDIUM" : "LOW"; }

/** Resumen para el Risk Center (SB-07-ST063). */
export function summarizeRisks(risks: any[]) {
  const active = risks.filter(r => ["OPEN", "ACCEPTED"].includes(r.status ?? "OPEN"));
  const byLevel = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<string, number>;
  for (const r of active) byLevel[riskLevel(r.severity ?? 0)]++;
  return {
    total: risks.length,
    active: active.length,
    byLevel,
    byStatus: risks.reduce((acc: Record<string, number>, r) => { const k = r.status ?? "OPEN"; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {}),
    withoutMitigation: active.filter(r => !r.mitigation).length,
    withoutOwner: active.filter(r => !r.ownerId).length,
    exposure: active.reduce((s, r) => s + (r.severity ?? 0), 0),
    top: [...active].sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0)).slice(0, 5).map(r => ({ id: r.id, title: r.title, severity: r.severity, level: riskLevel(r.severity ?? 0), mitigated: Boolean(r.mitigation) })),
  };
}