import type { BridgeState, TeamSide } from '../types/state';

const SERIES_KEY = 'rl-gep-bridge/series';
const mapTarget = (format: string) => (format === 'bo3' ? 2 : format === 'bo7' ? 4 : 3);

export class SeriesManager {
  load(): Partial<BridgeState['series']> {
    try {
      const raw = window.localStorage.getItem(SERIES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  save(series: BridgeState['series']) {
    window.localStorage.setItem(SERIES_KEY, JSON.stringify(series));
  }

  setFormat(state: BridgeState, format: 'bo3' | 'bo5' | 'bo7') {
    state.series.format = format;
    state.series.targetWins = mapTarget(format);
    this.save(state.series);
  }

  reset(state: BridgeState) {
    state.series.blueWins = 0;
    state.series.orangeWins = 0;
    state.series.currentGameNumber = 1;
    state.series.gameFinished = false;
    this.save(state.series);
  }

  awardWin(state: BridgeState, team: TeamSide) {
    if (team === 'blue') state.series.blueWins += 1;
    else state.series.orangeWins += 1;
    state.series.currentGameNumber += 1;
    state.series.gameFinished = true;
    this.save(state.series);
  }
}
