const statusEl = document.getElementById('status')!;
const eventsEl = document.getElementById('events')!;
const stateEl = document.getElementById('state')!;

const update = async () => {
  const [health, state, events] = await Promise.all([
    fetch('http://127.0.0.1:31985/health').then((r) => r.json()).catch(() => ({ ok: false })),
    fetch('http://127.0.0.1:31985/state').then((r) => r.json()).catch(() => ({})),
    fetch('http://127.0.0.1:31985/events/recent').then((r) => r.json()).catch(() => ([]))
  ]);

  statusEl.textContent = `Connected: ${health.connected ?? false} | Match Active: ${state.match?.active ?? false} | Format: ${state.series?.format ?? 'n/a'}`;
  eventsEl.textContent = JSON.stringify(events, null, 2);
  stateEl.textContent = JSON.stringify(state, null, 2);
};

const post = (url: string, body: unknown = {}) => fetch(`http://127.0.0.1:31985${url}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(update);

document.querySelectorAll('button[data-action]').forEach((b) => {
  b.addEventListener('click', () => {
    const a = b.getAttribute('data-action');
    if (a === 'bo3') post('/series/format', { format: 'bo3' });
    if (a === 'bo5') post('/series/format', { format: 'bo5' });
    if (a === 'bo7') post('/series/format', { format: 'bo7' });
    if (a === 'reset-series') post('/series/reset');
    if (a === 'clear') post('/debug/clear');
    if (a === 'export') fetch('http://127.0.0.1:31985/state').then((r) => r.text()).then((s) => navigator.clipboard.writeText(s));
  });
});

setInterval(update, 1000);
update();
