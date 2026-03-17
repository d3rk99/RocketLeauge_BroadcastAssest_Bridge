import { writeFileSync } from 'node:fs';
import type { BridgeState } from '../types/state';
import { logger } from '../utils/logger';

export const persistState = (state: BridgeState, path = 'data/latest-state.json') => {
  try { writeFileSync(path, JSON.stringify(state, null, 2), 'utf-8'); }
  catch (err) { logger.warn('state persist failed', err); }
};
