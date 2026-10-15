export const PASSING_SCORE = 70;
export const SECONDS_PER_QUESTION = 90;
export const TIMER_WARNING_SECONDS = 300;

// Distinct per-domain accent colors (the seeded DB colors are near-identical teals).
const DOMAIN_COLORS: Record<number, string> = {
  1: "#5FC3D4",
  2: "#818CF8",
  3: "#F59E0B",
  4: "#34D399",
  5: "#F472B6",
  6: "#60A5FA",
  7: "#FB923C",
  8: "#A78BFA",
};

export const CUSTOM_QUIZ_COLOR = "#2DD4BF";

export function domainColor(id: number | null | undefined): string {
  return (id != null && DOMAIN_COLORS[id]) || "#5FC3D4";
}
