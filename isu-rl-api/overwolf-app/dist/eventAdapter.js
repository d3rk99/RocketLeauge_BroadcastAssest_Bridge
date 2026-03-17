"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptEvent = adaptEvent;
/**
 * Assumptions:
 * - Rocket League game_event payloads vary by Overwolf version/game state.
 * - We map only a safe subset for v1. Unknown fields are passed through in `raw`.
 * - Adjust mappings below after collecting real payload samples.
 */
function adaptEvent(raw) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const eventName = raw.name;
    const data = (_a = raw.data) !== null && _a !== void 0 ? _a : {};
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
                blue_score: Number((_c = (_b = data.blue_score) !== null && _b !== void 0 ? _b : data.blueScore) !== null && _c !== void 0 ? _c : 0),
                orange_score: Number((_e = (_d = data.orange_score) !== null && _d !== void 0 ? _d : data.orangeScore) !== null && _e !== void 0 ? _e : 0),
                clock: String((_f = data.clock) !== null && _f !== void 0 ? _f : "5:00"),
                overtime: Boolean((_g = data.overtime) !== null && _g !== void 0 ? _g : false),
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
                clock: String((_h = data.clock) !== null && _h !== void 0 ? _h : "0:00"),
                overtime: Boolean((_j = data.overtime) !== null && _j !== void 0 ? _j : false),
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
                blue_score: Number((_k = data.blue_score) !== null && _k !== void 0 ? _k : 0),
                orange_score: Number((_l = data.orange_score) !== null && _l !== void 0 ? _l : 0),
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
            status: String((_m = data.status) !== null && _m !== void 0 ? _m : "live"),
            raw: data,
        },
    };
}
