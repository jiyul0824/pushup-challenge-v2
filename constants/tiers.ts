export type TierVisualId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master";

export type TierInfo = {
  id: TierVisualId;
  label: string;
  goal: number;
  color: string;
};

export const TIERS: readonly TierInfo[] = [
  { id: "bronze", label: "브론즈", goal: 5, color: "#CD7F32" },
  { id: "silver", label: "실버", goal: 15, color: "#B0B0B0" },
  { id: "gold", label: "골드", goal: 25, color: "#DAA520" },
  { id: "platinum", label: "플래티넘", goal: 30, color: "#20B2AA" },
  { id: "diamond", label: "다이아", goal: 40, color: "#44CCFF" },
  { id: "master", label: "마스터", goal: 60, color: "#9B30FF" },
] as const;

export function getTierById(id: TierVisualId): TierInfo {
  const t = TIERS.find((x) => x.id === id);
  if (!t) return TIERS[0];
  return t;
}
