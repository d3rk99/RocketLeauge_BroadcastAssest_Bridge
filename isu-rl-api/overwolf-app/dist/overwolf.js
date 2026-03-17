"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initOverwolfListeners = initOverwolfListeners;
// Keep this list minimal for v1. After payload capture, replace with exact RL-supported event features.
const REQUIRED_FEATURES = ["game_info", "match_info", "match", "roster", "scoreboard"];
const RL_NAME_HINTS = ["rocket league", "rocketleague"];
function initOverwolfListeners(onEvent) {
    var _a, _b;
    if (typeof overwolf === "undefined" || !((_a = overwolf.games) === null || _a === void 0 ? void 0 : _a.events)) {
        console.warn("[ISU RL API] Overwolf runtime not available, skipping live listeners.");
        return;
    }
    // Register listeners first (sample-app pattern), then request features.
    overwolf.games.events.onInfoUpdates2.addListener((info) => {
        var _a;
        onEvent({ name: "status_update", data: (_a = info === null || info === void 0 ? void 0 : info.info) !== null && _a !== void 0 ? _a : info });
    });
    overwolf.games.events.onNewEvents.addListener((events) => {
        var _a;
        const list = (_a = events === null || events === void 0 ? void 0 : events.events) !== null && _a !== void 0 ? _a : [];
        list.forEach((evt) => {
            var _a;
            onEvent({
                name: String((_a = evt.name) !== null && _a !== void 0 ? _a : "unknown"),
                data: parseEventData(evt.data),
            });
        });
    });
    if ((_b = overwolf.games.events.onError) === null || _b === void 0 ? void 0 : _b.addListener) {
        overwolf.games.events.onError.addListener((error) => {
            console.error("[ISU RL API] games.events error", error);
        });
    }
    // Request features for current game session if Rocket League is already running.
    overwolf.games.getRunningGameInfo((result) => {
        if ((result === null || result === void 0 ? void 0 : result.success) && (result === null || result === void 0 ? void 0 : result.isRunning) && isRocketLeagueGame(result)) {
            requestRequiredFeatures();
        }
    });
    // Re-request when Rocket League launches.
    overwolf.games.onGameInfoUpdated.addListener((gameInfoUpdate) => {
        const gameInfo = gameInfoUpdate === null || gameInfoUpdate === void 0 ? void 0 : gameInfoUpdate.gameInfo;
        if (!isRocketLeagueGame(gameInfo))
            return;
        if ((gameInfoUpdate === null || gameInfoUpdate === void 0 ? void 0 : gameInfoUpdate.runningChanged) && (gameInfo === null || gameInfo === void 0 ? void 0 : gameInfo.isRunning)) {
            requestRequiredFeatures();
            onEvent({ name: "match_start", data: {} });
            return;
        }
        if ((gameInfoUpdate === null || gameInfoUpdate === void 0 ? void 0 : gameInfoUpdate.runningChanged) && !(gameInfo === null || gameInfo === void 0 ? void 0 : gameInfo.isRunning)) {
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
    var _a, _b;
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
        (_b = (_a = gameInfo.executables) === null || _a === void 0 ? void 0 : _a.join) === null || _b === void 0 ? void 0 : _b.call(_a, " "),
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
