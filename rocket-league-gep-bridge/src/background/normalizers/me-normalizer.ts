import { asNumber, asString } from '../utils/guards';
import type { BridgeState } from '../types/state';

export const normalizeMe = (raw: Record<string, unknown>, prev: BridgeState['me']): BridgeState['me'] => ({
  name: asString(raw.name) ?? prev.name,
  steamId: asString(raw.steam_id) ?? prev.steamId,
  team: raw.team === 1 ? 'blue' : raw.team === 2 ? 'orange' : prev.team,
  score: raw.score != null ? asNumber(raw.score, 0) : prev.score,
  goals: raw.goals != null ? asNumber(raw.goals, 0) : prev.goals
});
