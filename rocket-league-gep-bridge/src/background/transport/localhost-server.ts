import type { BridgeState } from '../types/state';
import type { ScoreboardView } from '../types/api';
import { logger } from '../utils/logger';
import { getNodeRequire } from '../utils/runtime-interop';

type NodeHttp = {
  createServer: (handler: (req: any, res: any) => void) => {
    listen: (port: number, host: string, cb: () => void) => void;
    on: (event: string, cb: (err: unknown) => void) => void;
  };
};

export class LocalhostServer {
  private server?: { listen: (port: number, host: string, cb: () => void) => void; on: (event: string, cb: (err: unknown) => void) => void };

  constructor(private getState: () => BridgeState, private command: (route: string, body: any) => any, private port = 31985) {}

  start() {
    const req = getNodeRequire();
    if (!req) {
      logger.warn('Node runtime not available; localhost HTTP API is disabled.');
      return;
    }

    const http = this.loadHttp(req);
    if (!http) {
      logger.warn('node:http module unavailable; localhost HTTP API is disabled.');
      return;
    }

    this.server = http.createServer((incomingReq: any, res: any) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (incomingReq.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

      const url = incomingReq.url ?? '/';
      if (incomingReq.method === 'GET' && url === '/health') return this.json(res, { ok: true, connected: this.getState().app.connected });
      if (incomingReq.method === 'GET' && url === '/state') return this.json(res, this.getState());
      if (incomingReq.method === 'GET' && url === '/scoreboard') return this.json(res, this.scoreboard(this.getState()));
      if (incomingReq.method === 'GET' && url === '/events/recent') return this.json(res, this.getState().raw.events.slice(-20));

      if (incomingReq.method === 'POST') {
        let raw = '';
        incomingReq.on('data', (c: string) => raw += c);
        incomingReq.on('end', () => {
          let body = {};
          try { body = raw ? JSON.parse(raw) : {}; } catch { return this.json(res, { error: 'invalid json' }, 400); }
          const result = this.command(url, body);
          return this.json(res, result);
        });
        return;
      }
      this.json(res, { error: 'not found' }, 404);
    });

    this.server.listen(this.port, '127.0.0.1', () => logger.info(`HTTP server listening http://127.0.0.1:${this.port}`));
    this.server.on('error', (e: unknown) => logger.error('HTTP server error', e));
  }

  private loadHttp(req: (id: string) => any): NodeHttp | undefined {
    try {
      return req('node:http') as NodeHttp;
    } catch {
      try {
        return req('http') as NodeHttp;
      } catch {
        return undefined;
      }
    }
  }

  private scoreboard(s: BridgeState): ScoreboardView {
    return {
      blueName: s.teams.blue.name,
      orangeName: s.teams.orange.name,
      blueScore: s.teams.blue.score,
      orangeScore: s.teams.orange.score,
      blueSeriesWins: s.series.blueWins,
      orangeSeriesWins: s.series.orangeWins,
      overtime: s.match.overtime,
      matchActive: s.match.active,
      currentGameNumber: s.series.currentGameNumber,
      format: s.series.format
    };
  }

  private json(res: any, body: unknown, code = 200) {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  }
}
