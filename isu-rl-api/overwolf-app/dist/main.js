function log(level, message, data) {
    const prefix = `[ISU RL API][${level}]`;
    if (data === undefined) {
        console.log(`${prefix} ${message}`);
        return;
    }
    console.log(`${prefix} ${message}`, data);
}
function setupRuntimeDiagnostics() {
    window.addEventListener("error", (event) => {
        log("ERROR", "Runtime error", {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        });
    });
    window.addEventListener("unhandledrejection", (event) => {
        log("ERROR", "Unhandled promise rejection", event.reason);
    });
}
function start() {
    var _a, _b, _c;
    setupRuntimeDiagnostics();
    log("INFO", "ISU RL API background started");
    log("INFO", "Overwolf availability", { available: typeof overwolf !== "undefined" });
    if (typeof overwolf !== "undefined" && ((_c = (_b = (_a = overwolf === null || overwolf === void 0 ? void 0 : overwolf.games) === null || _a === void 0 ? void 0 : _a.events) === null || _b === void 0 ? void 0 : _b.onNewEvents) === null || _c === void 0 ? void 0 : _c.addListener)) {
        log("INFO", "Registering game events listener");
        overwolf.games.events.onNewEvents.addListener((events) => {
            log("INFO", "Game events", events);
        });
    }
    else {
        log("WARN", "Overwolf games events API is unavailable in this context");
    }
}
start();
