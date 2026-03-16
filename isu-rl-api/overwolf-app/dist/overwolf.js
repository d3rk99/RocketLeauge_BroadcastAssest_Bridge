// Keep this list minimal for v1. After payload capture, replace with exact RL-supported event features.
const REQUIRED_FEATURES = ["game_info", "match_info", "match", "roster", "scoreboard"];
const RL_NAME_HINTS = ["rocket league", "rocketleague"];
export function initOverwolfListeners(onEvent) {
    if (typeof overwolf === "undefined" || !overwolf.games?.events) {
        console.warn("[ISU RL API] Overwolf runtime not available, skipping live listeners.");
        return;
    }
    // Register listeners first (sample-app pattern), then request features.
    overwolf.games.events.onInfoUpdates2.addListener((info) => {
        onEvent({ name: "status_update", data: info?.info ?? info });
    });
    overwolf.games.events.onNewEvents.addListener((events) => {
        const list = events?.events ?? [];
        list.forEach((evt) => {
            onEvent({
                name: String(evt.name ?? "unknown"),
                data: parseEventData(evt.data),
            });
        });
    });
    if (overwolf.games.events.onError?.addListener) {
        overwolf.games.events.onError.addListener((error) => {
            console.error("[ISU RL API] games.events error", error);
        });
    }
    // Request features for current game session if Rocket League is already running.
    overwolf.games.getRunningGameInfo((result) => {
        if (result?.success && result?.isRunning && isRocketLeagueGame(result)) {
            requestRequiredFeatures();
        }
    });
    // Re-request when Rocket League launches.
    overwolf.games.onGameInfoUpdated.addListener((gameInfoUpdate) => {
        const gameInfo = gameInfoUpdate?.gameInfo;
        if (!isRocketLeagueGame(gameInfo))
            return;
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
function requestRequiredFeatures() {
    overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, (res) => {
        console.log("[ISU RL API] setRequiredFeatures", res);
        // Helpful bootstrap debug payload (mirrors events-sample-app diagnostics).
        overwolf.games.events.getInfo((info) => {
            console.log("[ISU RL API] games.events.getInfo", info);
        });
    });
}
function isRocketLeagueGame(gameInfo) {
    if (!gameInfo || typeof gameInfo !== "object")
        return false;
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
function parseEventData(value) {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch {
            return { raw: value };
        }
    }
    if (value && typeof value === "object") {
        return value;
    }
    return {};
}
