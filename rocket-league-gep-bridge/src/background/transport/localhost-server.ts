import type { BridgeState } from '../types/state';
import type { ScoreboardView } from '../types/api';
import { logger } from '../utils/logger';

/**
 * Overwolf windows do not have access to Node's `http` module.
 * This class is intentionally a no-op until a browser-compatible transport is added.
 */
export class LocalhostServer {
  constructor(private getState: () => BridgeState, private command: (route: string, body: any) => any, private port = 31985) {}

  start() {
    logger.warn(`HTTP localhost server is disabled in Overwolf runtime (requested port ${this.port}).`);
  }

  execute(route: string, body: any = {}) {
    return this.command(route, body);
  }

  getSnapshot() {
    const state = this.getState();
    return {
      health: { ok: true, connected: state.app.connected },
      state,
      scoreboard: this.scoreboard(state),
      events: state.raw.events.slice(-20)
    };
  }

  private scoreboard(s: BridgeState): ScoreboardView {
    return {
      blueName: s.teams.blue.name,
      orangeName: s.teams.orange.name,
      blueScore: s.teams.blue.score,
      orangeScore: s.teams.orange.score,
      blueSeriesWins: s.series.blueWins,
      orangeSeriesWins: s.series.orangeWins,
      overtime: s.match.overtime,
      matchActive: s.match.active,
      currentGameNumber: s.series.currentGameNumber,
      format: s.series.format
    };
  }
}
