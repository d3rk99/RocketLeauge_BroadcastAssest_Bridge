import { deepMerge } from './utils/deep-merge';
import { now } from './utils/time';
import { defaultState, type BridgeState } from './types/state';
import type { Subscriber } from './types/api';
import { persistState } from './transport/file-persist';

export class StateStore {
  private state: BridgeState = defaultState();
  private subs = new Set<Subscriber>();

  getState = () => this.state;

  patchState = (patch: Partial<BridgeState>) => {
    this.state = deepMerge(this.state, patch);
    this.state.app.lastUpdate = now();
    persistState(this.state);
    this.subs.forEach((s) => s(this.state));
  };

  subscribe = (fn: Subscriber) => { this.subs.add(fn); return () => this.subs.delete(fn); };
  resetMatchState = () => this.patchState({ match: defaultState().match, players: [], me: defaultState().me, teams: defaultState().teams, events: defaultState().events });
  resetAllState = () => { this.state = defaultState(); persistState(this.state); this.subs.forEach((s) => s(this.state)); };
}
