"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockMatchFlow = mockMatchFlow;
function* mockMatchFlow() {
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
