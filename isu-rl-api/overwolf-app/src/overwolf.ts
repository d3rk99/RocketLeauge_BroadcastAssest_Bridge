import { RawOverwolfEvent } from "./eventAdapter";

declare const overwolf: any;

// Keep this list minimal for v1. After payload capture, replace with exact RL-supported event features.
const REQUIRED_FEATURES = ["game_info", "match_info", "match", "roster", "scoreboard"];
const RL_CLASS_ID = 10826; // Rocket League

export function initOverwolfListeners(onEvent: (event: RawOverwolfEvent) => void): void {
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

  // Request features for current game session if already running.
  overwolf.games.getRunningGameInfo((result: any) => {
    if (result?.success && result?.classId === RL_CLASS_ID && result?.isRunning) {
      requestRequiredFeatures();
    }
  });

  // Re-request when Rocket League launches.
  overwolf.games.onGameInfoUpdated.addListener((gameInfoUpdate: any) => {
    const gameInfo = gameInfoUpdate?.gameInfo;
    if (gameInfo?.classId !== RL_CLASS_ID) return;

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
