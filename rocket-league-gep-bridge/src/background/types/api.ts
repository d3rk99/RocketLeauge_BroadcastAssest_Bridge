import type { BridgeState } from './state';

export interface ScoreboardView {
  blueName: string; orangeName: string; blueScore: number; orangeScore: number;
  blueSeriesWins: number; orangeSeriesWins: number; overtime: boolean; matchActive: boolean;
  currentGameNumber: number; format: string;
}

export type Subscriber = (state: BridgeState) => void;
