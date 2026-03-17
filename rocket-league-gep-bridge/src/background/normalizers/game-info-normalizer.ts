import { asBool, asNumber } from '../utils/guards';
import type { BridgeState } from '../types/state';

export const normalizeGameInfo = (raw: Record<string, unknown>, prev: BridgeState['game']): BridgeState['game'] => ({
  ...prev,
  isRunning: raw.running == null ? prev.isRunning : asBool(raw.running),
  isInFocus: raw.focused == null ? prev.isInFocus : asBool(raw.focused),
  gameId: raw.game_id == null ? prev.gameId : asNumber(raw.game_id, prev.gameId)
});
