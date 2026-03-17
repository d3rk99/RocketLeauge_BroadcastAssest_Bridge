export const deepMerge = <T extends Record<string, any>>(base: T, patch: Partial<T>): T => {
  const out = { ...base } as T;
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k]) out[k] = deepMerge(out[k], v);
    else out[k] = v as T[Extract<keyof T, string>];
  }
  return out;
};
