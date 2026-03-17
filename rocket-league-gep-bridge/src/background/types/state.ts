export type TeamSide = 'blue' | 'orange';

export interface BridgeState {
  app: { name: string; version: string; connected: boolean; lastUpdate: number; source: string };
  game: { title: string; isRunning: boolean; isInFocus: boolean; gameId: number };
  match: {
    active: boolean; phase: string; matchType: string | null; gameMode: string | null; isRanked: boolean | null;
    arena: string | null; server: string | null; mutators: string | null; overtime: boolean; winner: TeamSide | null;
  };
  teams: { blue: { id: 1; name: string; score: number }; orange: { id: 2; name: string; score: number } };
  players: Array<Record<string, unknown>>;
  me: { name: string | null; steamId: string | null; team: TeamSide | null; score: number | null; goals: number | null };
  series: { enabled: boolean; format: 'bo3'|'bo5'|'bo7'; targetWins: number; blueWins: number; orangeWins: number; currentGameNumber: number; gameFinished: boolean };
  events: { lastGoalBy: string | null; lastGoalTeam: TeamSide | null; lastEvent: string | null };
  raw: { info: Record<string, unknown>; events: Array<Record<string, unknown>> };
}

export const defaultState = (): BridgeState => ({
  app: { name: 'RL GEP Bridge', version: '0.1.0', connected: false, lastUpdate: Date.now(), source: 'overwolf-gep' },
  game: { title: 'Rocket League', isRunning: false, isInFocus: false, gameId: 10826 },
  match: { active: false, phase: 'idle', matchType: null, gameMode: null, isRanked: null, arena: null, server: null, mutators: null, overtime: false, winner: null },
  teams: { blue: { id: 1, name: 'Blue', score: 0 }, orange: { id: 2, name: 'Orange', score: 0 } },
  players: [],
  me: { name: null, steamId: null, team: null, score: null, goals: null },
  series: { enabled: true, format: 'bo5', targetWins: 3, blueWins: 0, orangeWins: 0, currentGameNumber: 1, gameFinished: false },
  events: { lastGoalBy: null, lastGoalTeam: null, lastEvent: null },
  raw: { info: {}, events: [] }
});
