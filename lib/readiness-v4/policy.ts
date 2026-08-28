import { z } from "zod";
import type { ReadinessPolicy } from "./types";

const ratio = z.number().min(0).max(1);

export const readinessPolicySchema = z
  .object({
    formulaKey: z.literal("mastery-evidence-v4"),
    priorStrength: z.number().positive(),
    priorMastery: ratio,
    evidenceTarget: z.number().positive(),
    evidenceExponent: z.number().positive().max(1),
    blueprintWeightMode: z.enum(["point", "count", "controlled-fallback"]),
    preparingThreshold: ratio,
    nearReadyThreshold: ratio,
    readyThreshold: ratio,
    strongReadyThreshold: ratio,
    overallEvidenceGate: ratio,
    advancedShareGate: ratio,
    advancedEvidenceGate: ratio,
    criticalTopicThreshold: ratio,
    criticalMasteryGate: ratio,
    criticalEvidenceGate: ratio,
  })
  .superRefine((policy, ctx) => {
    const ordered =
      policy.preparingThreshold < policy.nearReadyThreshold &&
      policy.nearReadyThreshold < policy.readyThreshold &&
      policy.readyThreshold < policy.strongReadyThreshold;
    if (!ordered) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preparingThreshold"],
        message: "Status thresholds must be strictly increasing",
      });
    }
  });

export const DEFAULT_MATH_READINESS_POLICY_V1: ReadinessPolicy = {
  formulaKey: "mastery-evidence-v4",
  priorStrength: 4,
  priorMastery: 0.5,
  evidenceTarget: 40,
  evidenceExponent: 0.5,
  blueprintWeightMode: "controlled-fallback",
  preparingThreshold: 0.5,
  nearReadyThreshold: 0.65,
  readyThreshold: 0.75,
  strongReadyThreshold: 0.85,
  overallEvidenceGate: 0.85,
  advancedShareGate: 0.2,
  advancedEvidenceGate: 0.6,
  criticalTopicThreshold: 0.05,
  criticalMasteryGate: 0.55,
  criticalEvidenceGate: 0.5,
};

export function validateReadinessPolicy(input: unknown): ReadinessPolicy {
  return readinessPolicySchema.parse(input);
}

export function readinessPolicyWarnings(policy: ReadinessPolicy): string[] {
  const warnings: string[] = [];
  if (policy.criticalMasteryGate > policy.strongReadyThreshold) {
    warnings.push("CRITICAL_MASTERY_ABOVE_STRONG_READY");
  }
  if (policy.overallEvidenceGate < policy.criticalEvidenceGate) {
    warnings.push("OVERALL_EVIDENCE_BELOW_CRITICAL_EVIDENCE");
  }
  return warnings;
}
