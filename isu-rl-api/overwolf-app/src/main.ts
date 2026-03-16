declare const overwolf: any;

type LogLevel = "INFO" | "WARN" | "ERROR";

function log(level: LogLevel, message: string, data?: unknown): void {
  const prefix = `[ISU RL API][${level}]`;
  if (data === undefined) {
    console.log(`${prefix} ${message}`);
    return;
  }
  console.log(`${prefix} ${message}`, data);
}

function setupRuntimeDiagnostics(): void {
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

function start(): void {
  setupRuntimeDiagnostics();

  log("INFO", "ISU RL API background started");
  log("INFO", "Overwolf availability", { available: typeof overwolf !== "undefined" });

  if (typeof overwolf !== "undefined" && overwolf?.games?.events?.onNewEvents?.addListener) {
    log("INFO", "Registering game events listener");

    overwolf.games.events.onNewEvents.addListener((events: unknown) => {
      log("INFO", "Game events", events);
    });
  } else {
    log("WARN", "Overwolf games events API is unavailable in this context");
  }
}

start();
