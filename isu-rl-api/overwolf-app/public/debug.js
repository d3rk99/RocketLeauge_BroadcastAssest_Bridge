const output = document.getElementById("diagnostics");
const DIAGNOSTICS_KEY = "isu-rl-diagnostics";

function renderDiagnostics() {
  if (!output) return;

  try {
    const raw = localStorage.getItem(DIAGNOSTICS_KEY);
    if (!raw) {
      output.textContent = "No diagnostics written yet.";
      return;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      output.textContent = "No diagnostics written yet.";
      return;
    }

    output.textContent = parsed
      .map((entry) => {
        const line = `[${entry.ts}] ${String(entry.level)} ${entry.message}`;
        if (entry.data === undefined) return line;
        return `${line}\n${JSON.stringify(entry.data, null, 2)}`;
      })
      .reverse()
      .join("\n\n");
  } catch (error) {
    output.textContent = `Failed to parse diagnostics: ${String(error)}`;
  }
}

setInterval(renderDiagnostics, 1000);
renderDiagnostics();
