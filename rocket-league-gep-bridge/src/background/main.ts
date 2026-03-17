import { StateStore } from './state-store';
import { logger } from './utils/logger';
import { registerFeaturesWithRetry, getInitialInfo } from './overwolf-bootstrap';
import { applyEvent, applyInfoUpdate } from './game-events';
import { applyGameInfo } from './game-info';
import { LocalhostServer } from './transport/localhost-server';
import { WebsocketServer } from './transport/websocket-server';
import { SeriesManager } from './series/series-manager';
import { overwolf } from './types/overwolf';

const store = new StateStore();
const series = new SeriesManager();
const ws = new WebsocketServer();

Object.assign(store.getState().series, series.load());

const command = (route: string, body: any) => {
  const state = store.getState();
  if (route === '/series/reset') series.reset(state);
  else if (route === '/series/format') series.setFormat(state, body.format ?? 'bo5');
  else if (route === '/series/win' && (body.team === 'blue' || body.team === 'orange')) series.awardWin(state, body.team);
  else if (route === '/series/manual-score') { state.series.blueWins = Number(body.blueWins ?? state.series.blueWins); state.series.orangeWins = Number(body.orangeWins ?? state.series.orangeWins); }
  else if (route === '/series/set-names') { state.teams.blue.name = body.blueName ?? state.teams.blue.name; state.teams.orange.name = body.orangeName ?? state.teams.orange.name; }
  else if (route === '/debug/clear') store.resetMatchState();
  else if (route === '/series/next-game') state.series.currentGameNumber += 1;
  store.patchState({ ...state });
  return { ok: true, route, state: store.getState().series };
};

new LocalhostServer(store.getState, command).start();
ws.start();
store.subscribe((s) => ws.broadcast(s));


const openDebugWindow = () => {
  try {
    overwolf.windows.obtainDeclaredWindow('debug', (result: any) => {
      const id = result?.window?.id;
      if (typeof id !== 'number') {
        logger.warn('Debug window could not be obtained', result);
        return;
      }

      overwolf.windows.restore(id, (restoreResult: any) => {
        if (restoreResult?.success) return;
        overwolf.windows.show(id, (showResult: any) => {
          if (!showResult?.success) logger.warn('Failed to open debug window', showResult);
        });
      });
    });
  } catch (err) {
    logger.warn('Failed to open debug window on startup', err);
  }
};

const start = async () => {
  logger.info('Booting RL bridge...');
  openDebugWindow();
  const features = await registerFeaturesWithRetry();
  store.patchState({ app: { ...store.getState().app, connected: features.ok } });

  const initial = await getInitialInfo();
  if (initial?.res) store.patchState(applyGameInfo(initial.res, store.getState()));

  overwolf.games.events.onInfoUpdates2.addListener((event: any) => {
    const current = store.getState();
    const patch = applyInfoUpdate(event.feature, event.info ?? {}, current);
    store.patchState(patch);
  });

  overwolf.games.events.onNewEvents.addListener((events: any) => {
    for (const e of events?.events ?? []) {
      store.patchState(applyEvent(e.name, e.data ?? {}, store.getState()));
    }
  });

  overwolf.games.onGameInfoUpdated.addListener((g: any) => {
    const incoming = { running: g?.gameInfo?.isRunning, focused: g?.gameInfo?.isInFocus, game_id: g?.gameInfo?.id };
    store.patchState(applyGameInfo(incoming, store.getState()));
  });
};

start().catch((err) => logger.error('Bridge failed to start', err));
