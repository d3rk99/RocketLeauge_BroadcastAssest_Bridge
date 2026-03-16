const diagnosticsOutput = document.getElementById("diagnostics");
const eventsOutput = document.getElementById("events");
const DIAGNOSTICS_KEY = "isu-rl-diagnostics";

function renderDiagnostics() {
  try {
    const raw = localStorage.getItem(DIAGNOSTICS_KEY);
    if (!raw) {
      diagnosticsOutput.textContent = "No diagnostics written yet.";
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      diagnosticsOutput.textContent = "No diagnostics written yet.";
      return;
    }

    const text = parsed
      .map((entry) => {
        const line = `[${entry.ts}] ${String(entry.level).toUpperCase()} ${entry.message}`;
        if (entry.details === undefined) return line;
        return `${line}\n${JSON.stringify(entry.details, null, 2)}`;
      })
      .reverse()
      .join("\n\n");

    diagnosticsOutput.textContent = text;
  } catch (error) {
    diagnosticsOutput.textContent = `Failed to read diagnostics: ${String(error)}`;
  }
}

window.addEventListener("isu-debug-event", (evt) => {
  const text = JSON.stringify(evt.detail, null, 2);
  eventsOutput.textContent = `${new Date().toISOString()}\n${text}\n\n${eventsOutput.textContent}`;
});

window.addEventListener("storage", (evt) => {
  if (evt.key === DIAGNOSTICS_KEY) {
    renderDiagnostics();
  }
});

setInterval(renderDiagnostics, 1000);
renderDiagnostics();
