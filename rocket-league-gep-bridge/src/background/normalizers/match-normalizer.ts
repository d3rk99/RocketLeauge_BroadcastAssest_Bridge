import { asBool, asString } from '../utils/guards';
import type { BridgeState } from '../types/state';

export const normalizeMatch = (raw: Record<string, unknown>, prev: BridgeState['match']): BridgeState['match'] => ({
  active: asBool(raw.active, prev.active),
  phase: asString(raw.phase) ?? prev.phase,
  matchType: asString(raw.match_type) ?? prev.matchType,
  gameMode: asString(raw.game_mode) ?? prev.gameMode,
  isRanked: raw.is_ranked == null ? prev.isRanked : asBool(raw.is_ranked),
  arena: asString(raw.arena) ?? prev.arena,
  server: asString(raw.server) ?? prev.server,
  mutators: asString(raw.mutators) ?? prev.mutators,
  overtime: raw.overtime == null ? prev.overtime : asBool(raw.overtime),
  winner: raw.winner_team === 1 ? 'blue' : raw.winner_team === 2 ? 'orange' : prev.winner
});
