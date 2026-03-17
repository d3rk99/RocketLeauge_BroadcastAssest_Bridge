import { asNumber } from '../utils/guards';

export const normalizeStats = (raw: Record<string, unknown>) => ({
  blueScore: asNumber(raw.blue_score, 0),
  orangeScore: asNumber(raw.orange_score, 0)
});
