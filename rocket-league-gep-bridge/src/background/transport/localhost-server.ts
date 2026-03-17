import http from 'node:http';
import type { BridgeState } from '../types/state';
import type { ScoreboardView } from '../types/api';
import { logger } from '../utils/logger';

export class LocalhostServer {
  private server?: http.Server;
  constructor(private getState: () => BridgeState, private command: (route: string, body: any) => any, private port = 31985) {}

  start() {
    this.server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

      const url = req.url ?? '/';
      if (req.method === 'GET' && url === '/health') return this.json(res, { ok: true, connected: this.getState().app.connected });
      if (req.method === 'GET' && url === '/state') return this.json(res, this.getState());
      if (req.method === 'GET' && url === '/scoreboard') return this.json(res, this.scoreboard(this.getState()));
      if (req.method === 'GET' && url === '/events/recent') return this.json(res, this.getState().raw.events.slice(-20));

      if (req.method === 'POST') {
        let raw = '';
        req.on('data', (c) => raw += c);
        req.on('end', () => {
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
    this.server.on('error', (e) => logger.error('HTTP server error', e));
  }

  private scoreboard(s: BridgeState): ScoreboardView {
    return {
      blueName: s.teams.blue.name, orangeName: s.teams.orange.name, blueScore: s.teams.blue.score, orangeScore: s.teams.orange.score,
      blueSeriesWins: s.series.blueWins, orangeSeriesWins: s.series.orangeWins, overtime: s.match.overtime, matchActive: s.match.active,
      currentGameNumber: s.series.currentGameNumber, format: s.series.format
    };
  }

  private json(res: http.ServerResponse, body: unknown, code = 200) {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  }
}
