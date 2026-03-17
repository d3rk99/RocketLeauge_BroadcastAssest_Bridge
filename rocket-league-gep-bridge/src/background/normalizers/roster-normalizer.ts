import { parseMaybeJson } from '../utils/safe-json';

export const normalizeRoster = (raw: unknown): Array<Record<string, unknown>> => {
  const parsed = parseMaybeJson<Array<Record<string, unknown>>>(raw, []);
  return Array.isArray(parsed) ? parsed : [];
};
