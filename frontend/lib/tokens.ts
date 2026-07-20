// Vitalis design tokens — shared color, spacing and status palette.
// Import this anywhere a component needs consistent styling.

export const T = {
  canvas: "#F6FBF8",
  canvasAlt: "#E7F3ED",
  card: "#FFFFFF",
  ink: "#1F2937",
  inkSoft: "#475569",
  muted: "#64748B",
  border: "#D8E5DD",
  borderStrong: "#C5D8CC",

  primary: "#0F766E",
  primaryDeep: "#115E59",
  primaryTint: "#E7F3ED",

  low: "#4269A6",
  lowTint: "#E9EFF7",
  high: "#A66D1D",
  highTint: "#FBF0DE",
  critical: "#B23A2B",
  criticalTint: "#FBE7E2",

  gold: "#B8943D",
  coral: "#B85F4A",
  coralTint: "#F8E9E4",
} as const;

export type StatusKey = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export const STATUS_STYLE: Record<StatusKey, { bg: string; fg: string; label: string }> = {
  LOW: { bg: T.lowTint, fg: T.low, label: "Low" },
  NORMAL: { bg: T.primaryTint, fg: T.primary, label: "Normal" },
  HIGH: { bg: T.highTint, fg: T.high, label: "High" },
  CRITICAL: { bg: T.criticalTint, fg: T.critical, label: "Critical" },
};
