import { overwolf } from './types/overwolf';
import { logger } from './utils/logger';

const FEATURES = ['stats', 'match', 'roster', 'me', 'match_info', 'game_info', 'training', 'gep_internal'];

export const registerFeaturesWithRetry = (attempt = 1, maxAttempts = 8): Promise<{ ok: boolean; features: string[]; attempt: number }> =>
  new Promise((resolve) => {
    overwolf.games.events.setRequiredFeatures(FEATURES, (result: any) => {
      if (result?.success) return resolve({ ok: true, features: FEATURES, attempt });
      if (attempt >= maxAttempts) return resolve({ ok: false, features: FEATURES, attempt });
      const wait = attempt * 1000;
      logger.warn(`setRequiredFeatures failed, retrying in ${wait}ms`, result);
      setTimeout(() => resolve(registerFeaturesWithRetry(attempt + 1, maxAttempts)), wait);
    });
  });

export const getInitialInfo = (): Promise<any> => new Promise((resolve) => overwolf.games.events.getInfo((r: any) => resolve(r)));
