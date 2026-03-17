import type { BridgeState } from '../types/state';
import { logger } from '../utils/logger';

export class WebsocketServer {
  start(): void { logger.info('WebSocket transport scaffolded (enable via Overwolf local websocket when available).'); }
  broadcast(_state: BridgeState): void {}
}
