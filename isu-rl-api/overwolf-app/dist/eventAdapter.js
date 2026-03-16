/**
 * Assumptions:
 * - Rocket League game_event payloads vary by Overwolf version/game state.
 * - We map only a safe subset for v1. Unknown fields are passed through in `raw`.
 * - Adjust mappings below after collecting real payload samples.
 */
export function adaptEvent(raw) {
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
