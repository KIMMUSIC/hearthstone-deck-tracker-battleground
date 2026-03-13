export const MMR_BRACKETS = [
  { label: '0-4000', min: 0, max: 4000 },
  { label: '4000-6000', min: 4000, max: 6000 },
  { label: '6000-8000', min: 6000, max: 8000 },
  { label: '8000+', min: 8000, max: Infinity },
] as const;

export type MmrBracketLabel = (typeof MMR_BRACKETS)[number]['label'];

export function getMmrBracketFilter(bracket?: string) {
  if (!bracket) return {};
  const found = MMR_BRACKETS.find((b) => b.label === bracket);
  if (!found) return {};
  const filter: Record<string, number> = {};
  filter.gte = found.min;
  if (found.max !== Infinity) filter.lt = found.max;
  return { mmrBefore: filter };
}
