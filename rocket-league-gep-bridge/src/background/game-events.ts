import { normalizeMatch } from './normalizers/match-normalizer';
import { normalizeMe } from './normalizers/me-normalizer';
import { normalizeRoster } from './normalizers/roster-normalizer';
import { normalizeStats } from './normalizers/stats-normalizer';
import type { BridgeState } from './types/state';

export const applyInfoUpdate = (feature: string, info: Record<string, unknown>, state: BridgeState): Partial<BridgeState> => {
  if (feature === 'match' || feature === 'match_info') return { match: normalizeMatch(info, state.match), raw: { ...state.raw, info } };
  if (feature === 'me') return { me: normalizeMe(info, state.me), raw: { ...state.raw, info } };
  if (feature === 'roster') return { players: normalizeRoster(info.players), raw: { ...state.raw, info } };
  if (feature === 'stats') {
    const s = normalizeStats(info);
    return { teams: { ...state.teams, blue: { ...state.teams.blue, score: s.blueScore }, orange: { ...state.teams.orange, score: s.orangeScore } }, raw: { ...state.raw, info } };
  }
  return { raw: { ...state.raw, info } };
};

export const applyEvent = (name: string, data: Record<string, unknown>, state: BridgeState): Partial<BridgeState> => ({
  events: {
    lastEvent: name,
    lastGoalBy: name.toLowerCase().includes('goal') ? String(data.player ?? state.events.lastGoalBy) : state.events.lastGoalBy,
    lastGoalTeam: name.toLowerCase().includes('goal') ? (data.team === 1 ? 'blue' : data.team === 2 ? 'orange' : state.events.lastGoalTeam) : state.events.lastGoalTeam
  },
  raw: { ...state.raw, events: [...state.raw.events.slice(-99), { name, data, at: Date.now() }] }
});
