import type { BridgeState } from '../types/state';
import { logger } from '../utils/logger';

const STATE_KEY = 'rl-gep-bridge/latest-state';

export const persistState = (state: BridgeState) => {
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (err) {
    logger.warn('state persist failed', err);
  }
};

export const loadPersistedState = (): Partial<BridgeState> => {
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
