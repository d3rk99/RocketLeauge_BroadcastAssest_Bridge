const output = document.getElementById("output");

window.addEventListener("isu-debug-event", (evt) => {
  const text = JSON.stringify(evt.detail, null, 2);
  output.textContent = `${new Date().toISOString()}\n${text}\n\n${output.textContent}`;
});
