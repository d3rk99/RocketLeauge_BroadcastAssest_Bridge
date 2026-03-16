declare const overwolf: any;

type RawOverwolfEvent = {
  name: string;
  data?: Record<string, any>;
};

type NormalizedEvent = {
  event_type: string;
  match_id: string;
  timestamp: string;
  payload: {
    blue_score?: number;
    orange_score?: number;
    clock?: string;
    overtime?: boolean;
    winner?: "blue" | "orange" | null;
    status?: string;
    [key: string]: any;
  };
};

const API_BASE = (window as any).ISU_RL_API_BASE || "http://localhost:8000";
const API_KEY = (window as any).ISU_RL_API_KEY || "dev-api-key";
const MOCK_MODE = (window as any).ISU_RL_MOCK_MODE === true || (window as any).ISU_RL_MOCK_MODE === "true";

// Keep this list minimal for v1. After payload capture, replace with exact RL-supported event features.
const REQUIRED_FEATURES = ["game_info", "match_info", "match", "roster", "scoreboard"];
const RL_NAME_HINTS = ["rocket league", "rocketleague"];

function emitToDebug(raw: RawOverwolfEvent, normalized: any): void {
  window.dispatchEvent(
    new CustomEvent("isu-debug-event", {
      detail: { raw, normalized },
    }),
  );
}

async function postEvent(event: NormalizedEvent, retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Ingest failed with status ${response.status}`);
      }
      return;
    } catch (error) {
      console.warn(`[ISU RL API] ingest attempt ${attempt} failed`, error);
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
}

function adaptEvent(raw: RawOverwolfEvent): NormalizedEvent | null {
  const eventName = raw.name;
  const data = raw.data ?? {};

  if (eventName === "match_start") {
    return {
      event_type: "match_start",
      match_id: "active",
      timestamp: new Date().toISOString(),
      payload: {
        clock: "5:00",
        overtime: false,
        status: "live",
      },
    };
  }

  if (eventName === "goal") {
    return {
      event_type: "goal",
      match_id: "active",
      timestamp: new Date().toISOString(),
      payload: {
        blue_score: Number(data.blue_score ?? data.blueScore ?? 0),
        orange_score: Number(data.orange_score ?? data.orangeScore ?? 0),
        clock: String(data.clock ?? "5:00"),
        overtime: Boolean(data.overtime ?? false),
        status: "goal_pause",
      },
    };
  }

  if (eventName === "clock_update") {
    return {
      event_type: "clock_update",
      match_id: "active",
      timestamp: new Date().toISOString(),
      payload: {
        clock: String(data.clock ?? "0:00"),
        overtime: Boolean(data.overtime ?? false),
        status: data.overtime ? "overtime" : "live",
      },
    };
  }

  if (eventName === "match_end") {
    return {
      event_type: "match_end",
      match_id: "active",
      timestamp: new Date().toISOString(),
      payload: {
        blue_score: Number(data.blue_score ?? 0),
        orange_score: Number(data.orange_score ?? 0),
        winner: data.winner === "orange" ? "orange" : "blue",
        status: "postgame",
      },
    };
  }

  return {
    event_type: "status_update",
    match_id: "active",
    timestamp: new Date().toISOString(),
    payload: {
      status: String(data.status ?? "live"),
      raw: data,
    },
  };
}

function* mockMatchFlow(): Generator<NormalizedEvent> {
  yield {
    event_type: "match_start",
    match_id: "active",
    timestamp: new Date().toISOString(),
    payload: { clock: "5:00", overtime: false, status: "live" },
  };

  yield {
    event_type: "clock_update",
    match_id: "active",
    timestamp: new Date().toISOString(),
    payload: { clock: "4:31", overtime: false, status: "live" },
  };

  yield {
    event_type: "goal",
    match_id: "active",
    timestamp: new Date().toISOString(),
    payload: { blue_score: 1, orange_score: 0, clock: "4:31", overtime: false, status: "goal_pause" },
  };

  yield {
    event_type: "clock_update",
    match_id: "active",
    timestamp: new Date().toISOString(),
    payload: { clock: "0:00", overtime: true, status: "overtime" },
  };

  yield {
    event_type: "goal",
    match_id: "active",
    timestamp: new Date().toISOString(),
    payload: { blue_score: 2, orange_score: 1, clock: "0:10", overtime: true, status: "goal_pause" },
  };

  yield {
    event_type: "match_end",
    match_id: "active",
    timestamp: new Date().toISOString(),
    payload: { blue_score: 2, orange_score: 1, overtime: true, winner: "blue", status: "postgame" },
  };
}

function initOverwolfListeners(onEvent: (event: RawOverwolfEvent) => void): void {
  if (typeof overwolf === "undefined" || !overwolf.games?.events) {
    console.warn("[ISU RL API] Overwolf runtime not available, skipping live listeners.");
    return;
  }

  // Register listeners first (sample-app pattern), then request features.
  overwolf.games.events.onInfoUpdates2.addListener((info: any) => {
    onEvent({ name: "status_update", data: info?.info ?? info });
  });

  overwolf.games.events.onNewEvents.addListener((events: any) => {
    const list = events?.events ?? [];
    list.forEach((evt: any) => {
      onEvent({
        name: String(evt.name ?? "unknown"),
        data: parseEventData(evt.data),
      });
    });
  });

  if (overwolf.games.events.onError?.addListener) {
    overwolf.games.events.onError.addListener((error: any) => {
      console.error("[ISU RL API] games.events error", error);
    });
  }

  // Request features for current game session if Rocket League is already running.
  overwolf.games.getRunningGameInfo((result: any) => {
    if (result?.success && result?.isRunning && isRocketLeagueGame(result)) {
      requestRequiredFeatures();
    }
  });

  // Re-request when Rocket League launches.
  overwolf.games.onGameInfoUpdated.addListener((gameInfoUpdate: any) => {
    const gameInfo = gameInfoUpdate?.gameInfo;
    if (!isRocketLeagueGame(gameInfo)) return;

    if (gameInfoUpdate?.runningChanged && gameInfo?.isRunning) {
      requestRequiredFeatures();
      onEvent({ name: "match_start", data: {} });
      return;
    }

    if (gameInfoUpdate?.runningChanged && !gameInfo?.isRunning) {
      onEvent({ name: "match_end", data: {} });
    }
  });
}

function requestRequiredFeatures(): void {
  overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, (res: any) => {
    console.log("[ISU RL API] setRequiredFeatures", res);

    // Helpful bootstrap debug payload (mirrors events-sample-app diagnostics).
    overwolf.games.events.getInfo((info: any) => {
      console.log("[ISU RL API] games.events.getInfo", info);
    });
  });
}

function isRocketLeagueGame(gameInfo: any): boolean {
  if (!gameInfo || typeof gameInfo !== "object") return false;

  const candidates = [
    gameInfo.title,
    gameInfo.displayName,
    gameInfo.name,
    gameInfo.gameName,
    gameInfo.shortTitle,
    gameInfo.processName,
    gameInfo.processPath,
    gameInfo.executables?.join?.(" "),
  ]
    .filter((value) => typeof value === "string")
    .map((value) => String(value).toLowerCase());

  return RL_NAME_HINTS.some((hint) => candidates.some((value) => value.includes(hint)));
}

function parseEventData(value: unknown): Record<string, any> {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { raw: value };
    }
  }

  if (value && typeof value === "object") {
    return value as Record<string, any>;
  }

  return {};
}

async function handleRawEvent(raw: RawOverwolfEvent): Promise<void> {
  console.log("[ISU RL API] raw event", raw);
  const normalized = adaptEvent(raw);
  emitToDebug(raw, normalized);
  if (!normalized) return;

  try {
    await postEvent(normalized);
    console.log("[ISU RL API] event forwarded", normalized);
  } catch (error) {
    console.error("[ISU RL API] failed to forward event", error);
  }
}

function runMockMode(): void {
  console.log("[ISU RL API] running in MOCK MODE");
  const events = Array.from(mockMatchFlow());
  let idx = 0;

  setInterval(async () => {
    const event = events[idx % events.length];
    idx += 1;
    await handleRawEvent({ name: event.event_type, data: event.payload });
  }, 2000);
}

function start(): void {
  if (MOCK_MODE) {
    runMockMode();
  } else {
    initOverwolfListeners((event) => {
      void handleRawEvent(event);
    });
  }
}

start();
