import { postEvent } from "./api";
import { adaptEvent } from "./eventAdapter";
import { mockMatchFlow } from "./mockEvents";
import { initOverwolfListeners } from "./overwolf";
const MOCK_MODE = window.ISU_RL_MOCK_MODE === true || window.ISU_RL_MOCK_MODE === "true";
function emitToDebug(raw, normalized) {
    window.dispatchEvent(new CustomEvent("isu-debug-event", {
        detail: { raw, normalized },
    }));
}
async function handleRawEvent(raw) {
    console.log("[ISU RL API] raw event", raw);
    const normalized = adaptEvent(raw);
    emitToDebug(raw, normalized);
    if (!normalized)
        return;
    try {
        await postEvent(normalized);
        console.log("[ISU RL API] event forwarded", normalized);
    }
    catch (error) {
        console.error("[ISU RL API] failed to forward event", error);
    }
}
function runMockMode() {
    console.log("[ISU RL API] running in MOCK MODE");
    const events = Array.from(mockMatchFlow());
    let idx = 0;
    setInterval(async () => {
        const event = events[idx % events.length];
        idx += 1;
        await handleRawEvent({ name: event.event_type, data: event.payload });
    }, 2000);
}
function start() {
    if (MOCK_MODE) {
        runMockMode();
    }
    else {
        initOverwolfListeners((event) => {
            void handleRawEvent(event);
        });
    }
}
start();
