// Vitalis design tokens — shared color, spacing and status palette.
// Import this anywhere a component needs consistent styling.

export const T = {
  canvas: "#F7F8F5",
  canvasAlt: "#EEF1EC",
  card: "#FFFFFF",
  ink: "#111F1D",
  inkSoft: "#3E514C",
  muted: "#73827D",
  border: "#DFE6E1",
  borderStrong: "#C6D3CC",

  primary: "#0F6B5C",
  primaryDeep: "#093B35",
  primaryTint: "#E4F1ED",

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
