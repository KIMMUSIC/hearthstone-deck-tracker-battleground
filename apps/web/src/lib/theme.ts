export const placementColors: Record<number, string> = {
  1: 'text-[#FFD700]',
  2: 'text-[#C0C0C0]',
  3: 'text-[#CD7F32]',
  4: 'text-success',
  5: 'text-danger',
  6: 'text-[#DC2626]',
  7: 'text-[#B91C1C]',
  8: 'text-[#991B1B]',
};

export const placementBgColors: Record<number, string> = {
  1: 'bg-[#FFD700]/20 border-[#FFD700]/40',
  2: 'bg-[#C0C0C0]/20 border-[#C0C0C0]/40',
  3: 'bg-[#CD7F32]/20 border-[#CD7F32]/40',
  4: 'bg-success/20 border-success/40',
  5: 'bg-danger/20 border-danger/40',
  6: 'bg-[#DC2626]/20 border-[#DC2626]/40',
  7: 'bg-[#B91C1C]/20 border-[#B91C1C]/40',
  8: 'bg-[#991B1B]/20 border-[#991B1B]/40',
};

export function getMmrDeltaColor(delta: number): string {
  if (delta > 0) return 'text-success';
  if (delta < 0) return 'text-danger';
  return 'text-text-secondary';
}

export function getTierColor(avgPlacement: number): string {
  if (avgPlacement <= 3.5) return 'text-[#FFD700]'; // S tier
  if (avgPlacement <= 4.0) return 'text-success';    // A tier
  if (avgPlacement <= 4.5) return 'text-accent';     // B tier
  if (avgPlacement <= 5.0) return 'text-[#F97316]';  // C tier
  return 'text-danger';                               // D tier
}

export function getTierLabel(avgPlacement: number): string {
  if (avgPlacement <= 3.5) return 'S';
  if (avgPlacement <= 4.0) return 'A';
  if (avgPlacement <= 4.5) return 'B';
  if (avgPlacement <= 5.0) return 'C';
  return 'D';
}

export const raceColors: Record<string, string> = {
  BEAST: '#8B4513',
  DEMON: '#9333EA',
  DRAGON: '#DC2626',
  ELEMENTAL: '#0EA5E9',
  MECH: '#6B7280',
  MURLOC: '#22D3EE',
  NAGA: '#059669',
  PIRATE: '#F59E0B',
  QUILBOAR: '#EC4899',
  UNDEAD: '#6366F1',
};
