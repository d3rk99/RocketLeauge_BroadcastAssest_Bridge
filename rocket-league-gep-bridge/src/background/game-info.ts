import type { BridgeState } from './types/state';
import { normalizeGameInfo } from './normalizers/game-info-normalizer';

export const applyGameInfo = (incoming: Record<string, unknown>, prev: BridgeState) => ({
  game: normalizeGameInfo(incoming, prev.game)
});
