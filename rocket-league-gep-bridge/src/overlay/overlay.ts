const ids = {
  blueName: document.getElementById('blue-name')!,
  orangeName: document.getElementById('orange-name')!,
  blueScore: document.getElementById('blue-score')!,
  orangeScore: document.getElementById('orange-score')!,
  blueSeries: document.getElementById('blue-series')!,
  orangeSeries: document.getElementById('orange-series')!,
  format: document.getElementById('format')!,
  overtime: document.getElementById('overtime')!,
  status: document.getElementById('status')!
};

const fallback = { blueName: 'Blue', orangeName: 'Orange', blueScore: 0, orangeScore: 0, blueSeriesWins: 0, orangeSeriesWins: 0, overtime: false, format: 'BO5' };

const render = (s: any) => {
  ids.blueName.textContent = s.blueName;
  ids.orangeName.textContent = s.orangeName;
  ids.blueScore.textContent = String(s.blueScore);
  ids.orangeScore.textContent = String(s.orangeScore);
  ids.blueSeries.textContent = `W:${s.blueSeriesWins}`;
  ids.orangeSeries.textContent = `W:${s.orangeSeriesWins}`;
  ids.format.textContent = String(s.format).toUpperCase();
  ids.overtime.toggleAttribute('hidden', !s.overtime);
  ids.status.toggleAttribute('hidden', true);
};

const poll = async () => {
  try {
    const data = await fetch('http://127.0.0.1:31985/scoreboard').then((r) => r.json());
    render(data);
  } catch {
    render(fallback);
    ids.status.toggleAttribute('hidden', false);
  }
};

setInterval(poll, 500);
poll();
