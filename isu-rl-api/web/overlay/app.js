const API_BASE = new URLSearchParams(location.search).get("base") || "http://localhost:8000";

const els = {
  blueName: document.getElementById("blue-name"),
  orangeName: document.getElementById("orange-name"),
  blueScore: document.getElementById("blue-score"),
  orangeScore: document.getElementById("orange-score"),
  blueSeries: document.getElementById("blue-series"),
  orangeSeries: document.getElementById("orange-series"),
  seriesInfo: document.getElementById("series-info"),
  clock: document.getElementById("clock"),
  overtime: document.getElementById("overtime"),
};

let prevBlueScore = null;
let prevOrangeScore = null;

function flash(el) {
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 280);
}

function render(state) {
  els.blueName.textContent = state.blue_team_name;
  els.orangeName.textContent = state.orange_team_name;

  if (prevBlueScore !== null && prevBlueScore !== state.blue_score) flash(els.blueScore);
  if (prevOrangeScore !== null && prevOrangeScore !== state.orange_score) flash(els.orangeScore);
  prevBlueScore = state.blue_score;
  prevOrangeScore = state.orange_score;

  els.blueScore.textContent = String(state.blue_score);
  els.orangeScore.textContent = String(state.orange_score);
  els.blueSeries.textContent = `Series: ${state.blue_series_wins}`;
  els.orangeSeries.textContent = `Series: ${state.orange_series_wins}`;
  els.seriesInfo.textContent = `Game ${state.game_number} / BO${state.best_of}`;
  els.clock.textContent = state.clock;
  els.overtime.classList.toggle("hidden", !state.overtime);
}

async function loadInitial() {
  const res = await fetch(`${API_BASE}/state/current`);
  const state = await res.json();
  render(state);
}

function connectWs() {
  const wsUrl = API_BASE.replace("http", "ws") + "/ws";
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (evt) => {
    const state = JSON.parse(evt.data);
    render(state);
  };

  socket.onclose = () => {
    setTimeout(connectWs, 1200);
  };
}

loadInitial().catch(console.error);
connectWs();
