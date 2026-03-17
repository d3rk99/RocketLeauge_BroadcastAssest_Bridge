import type { BridgeState } from '../types/state';
import { logger } from '../utils/logger';
import { getNodeRequire } from '../utils/runtime-interop';

const STATE_KEY = 'rl-gep-bridge/latest-state';
const STATE_PATH = 'data/latest-state.json';

type NodeFs = { writeFileSync: (path: string, contents: string, encoding?: string) => void };

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

export const persistState = (state: BridgeState) => {
  const serialized = JSON.stringify(state, null, 2);

  try {
    const fs = loadNodeFs();
    if (fs) {
      fs.writeFileSync(STATE_PATH, serialized, 'utf-8');
      return;
    }
  } catch (err) {
    logger.warn('state file persist failed', err);
  }

  try {
    window.localStorage.setItem(STATE_KEY, serialized);
  } catch (err) {
    logger.warn('state localStorage persist failed', err);
  }
};
