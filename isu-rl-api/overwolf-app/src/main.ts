declare const overwolf: any;

type LogLevel = "INFO" | "WARN" | "ERROR";

type DiagnosticEntry = {
  ts: string;
  level: LogLevel;
  message: string;
  data?: unknown;
};

const DIAGNOSTICS_KEY = "isu-rl-diagnostics";
const MAX_DIAGNOSTICS = 200;

function writeDiagnostic(entry: DiagnosticEntry): void {
  try {
    const currentRaw = window.localStorage.getItem(DIAGNOSTICS_KEY);
    const current = currentRaw ? JSON.parse(currentRaw) : [];
    const next = [...(Array.isArray(current) ? current : []), entry].slice(-MAX_DIAGNOSTICS);
    window.localStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify(next));
  } catch {
    // Keep logging non-fatal.
  }
}

function log(level: LogLevel, message: string, data?: unknown): void {
  const prefix = `[ISU RL API][${level}]`;
  if (data === undefined) {
    console.log(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`, data);
  }

  writeDiagnostic({
    ts: new Date().toISOString(),
    level,
    message,
    data,
  });
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

function hasOverwolfEventsApi(): boolean {
  try {
    return (
      typeof overwolf !== "undefined" &&
      Boolean(overwolf.games) &&
      Boolean(overwolf.games.events) &&
      Boolean(overwolf.games.events.onNewEvents) &&
      typeof overwolf.games.events.onNewEvents.addListener === "function"
    );
  } catch {
    return false;
  }
}

function start(): void {
  setupRuntimeDiagnostics();

  log("INFO", "ISU RL API background started");
  log("INFO", "Overwolf availability", { available: typeof overwolf !== "undefined" });

  if (!hasOverwolfEventsApi()) {
    log("WARN", "Overwolf games events API is unavailable in this context");
    return;
  }

  log("INFO", "Registering game events listener");
  overwolf.games.events.onNewEvents.addListener((events: unknown) => {
    log("INFO", "Game events", events);
  });
}

try {
  start();
} catch (error) {
  log("ERROR", "Fatal startup error", error);
}
