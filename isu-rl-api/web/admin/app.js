const qs = (id) => document.getElementById(id);
const stateEl = qs("state-json");
const statusEl = qs("status");

let socket;

function base() {
  return qs("base").value.trim();
}

function headers() {
  return {
    "Content-Type": "application/json",
    "x-api-key": qs("api-key").value.trim(),
  };
}

async function send(path, body = {}) {
  const res = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function refresh() {
  const res = await fetch(`${base()}/state/current`);
  const state = await res.json();
  stateEl.textContent = JSON.stringify(state, null, 2);
}

function connect() {
  const wsUrl = base().replace("http", "ws") + "/ws";
  socket = new WebSocket(wsUrl);
  statusEl.textContent = "Connecting...";

  socket.onopen = () => (statusEl.textContent = "Connected");
  socket.onclose = () => {
    statusEl.textContent = "Disconnected (retrying)";
    setTimeout(connect, 1200);
  };
  socket.onmessage = (evt) => {
    stateEl.textContent = JSON.stringify(JSON.parse(evt.data), null, 2);
  };
}

qs("set-teams").onclick = async () => {
  await send("/admin/set-teams", {
    blue_team_name: qs("blue-team").value || "Blue",
    orange_team_name: qs("orange-team").value || "Orange",
    best_of: Number(qs("best-of").value || 5),
  });
};

qs("mode-auto").onclick = async () => send("/admin/mode", { auto_mode: true });
qs("mode-manual").onclick = async () => send("/admin/mode", { auto_mode: false });
qs("reset").onclick = async () => send("/admin/reset", {});

qs("save-score").onclick = async () => {
  await send("/admin/manual-score", {
    blue_score: qs("blue-score").value === "" ? undefined : Number(qs("blue-score").value),
    orange_score: qs("orange-score").value === "" ? undefined : Number(qs("orange-score").value),
    blue_series_wins: qs("blue-series").value === "" ? undefined : Number(qs("blue-series").value),
    orange_series_wins: qs("orange-series").value === "" ? undefined : Number(qs("orange-series").value),
  });
};

refresh().catch(console.error);
connect();
