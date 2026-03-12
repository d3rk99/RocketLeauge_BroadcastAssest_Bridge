import { RawOverwolfEvent } from "./eventAdapter";

declare const overwolf: any;

const REQUIRED_FEATURES = ["game_info", "match_info", "match"];
const RL_CLASS_ID = 10826; // Rocket League

export function initOverwolfListeners(onEvent: (event: RawOverwolfEvent) => void): void {
  if (typeof overwolf === "undefined" || !overwolf.games?.events) {
    console.warn("[ISU RL API] Overwolf runtime not available, skipping live listeners.");
    return;
  }

  overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, (res: any) => {
    console.log("[ISU RL API] setRequiredFeatures", res);
  });

  overwolf.games.events.onInfoUpdates2.addListener((info: any) => {
    onEvent({ name: "status_update", data: info?.info ?? info });
  });

  overwolf.games.events.onNewEvents.addListener((events: any) => {
    const list = events?.events ?? [];
    list.forEach((evt: any) => {
      // Real payload names should be verified with runtime logs in debug window.
      onEvent({
        name: evt.name,
        data: evt.data ? safeJsonParse(evt.data) : {},
      });
    });
  });

  overwolf.games.onGameInfoUpdated.addListener((gameInfo: any) => {
    if (gameInfo?.gameInfo?.classId === RL_CLASS_ID && gameInfo?.runningChanged) {
      if (gameInfo.gameInfo.isRunning) {
        onEvent({ name: "match_start", data: {} });
      } else {
        onEvent({ name: "match_end", data: {} });
      }
    }
  });
}

function safeJsonParse(value: string): Record<string, any> {
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}
