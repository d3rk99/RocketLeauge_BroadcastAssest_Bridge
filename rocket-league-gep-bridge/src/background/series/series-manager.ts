import type { BridgeState, TeamSide } from '../types/state';
import { getNodeRequire } from '../utils/runtime-interop';

const SERIES_KEY = 'rl-gep-bridge/series';
const SERIES_PATH = 'config/series.json';
const mapTarget = (format: string) => (format === 'bo3' ? 2 : format === 'bo7' ? 4 : 3);

type NodeFs = {
  readFileSync: (path: string, encoding: string) => string;
  writeFileSync: (path: string, contents: string, encoding?: string) => void;
};

const loadNodeFs = (): NodeFs | undefined => {
  const req = getNodeRequire();
  if (!req) return undefined;
  try {
    return req('node:fs') as NodeFs;
  } catch {
    try {
      return req('fs') as NodeFs;
    } catch {
      return undefined;
    }
  }
};

export class SeriesManager {
  load(): Partial<BridgeState['series']> {
    const fs = loadNodeFs();
    if (fs) {
      try {
        return JSON.parse(fs.readFileSync(SERIES_PATH, 'utf-8'));
      } catch {
        return {};
      }
    }

    try {
      const raw = window.localStorage.getItem(SERIES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  save(series: BridgeState['series']) {
    const serialized = JSON.stringify(series, null, 2);
    const fs = loadNodeFs();
    if (fs) {
      fs.writeFileSync(SERIES_PATH, serialized, 'utf-8');
      return;
    }

    window.localStorage.setItem(SERIES_KEY, serialized);
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
