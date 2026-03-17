export const asNumber = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const asBool = (v: unknown, fallback = false): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return ['true', '1', 'yes'].includes(v.toLowerCase());
  if (typeof v === 'number') return v > 0;
  return fallback;
};

export const asString = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
