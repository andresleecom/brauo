// Brauo options page.
const $ = (id) => document.getElementById(id);
let catalog = null;
let previewAudio = null;

function voices() {
  return catalog && catalog.length ? catalog : BRAUO_FALLBACK_VOICES;
}

function renderVoices(selected) {
  const sel = $("voice");
  brauoRenderVoiceOptions(sel, voices(), selected, { withAccent: true });
  $("voiceCount").textContent = `${voices().length} voices available` + (catalog ? " (live catalog)" : " (bundled list - load the live catalog for all voices)");
}

function setStatus(msg, isError) {
  const el = $("status");
  el.textContent = msg;
  el.className = isError ? "error" : "";
}

$("toggleKey").addEventListener("click", () => {
  const inp = $("apiKey");
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  $("toggleKey").textContent = show ? "Hide" : "Show";
});

$("refresh").addEventListener("click", async () => {
  const apiKey = $("apiKey").value.trim();
  if (!apiKey) return setStatus("Enter your API key first.", true);
  await chrome.storage.sync.set({ apiKey });
  setStatus("Loading voices…");
  chrome.runtime.sendMessage({ type: "catalog" }, (resp) => {
    if (!resp || !resp.ok) return setStatus("Could not load voices: " + (resp ? resp.error : "no response"), true);
    catalog = resp.voices;
    renderVoices($("voice").value);
    setStatus(`Loaded ${catalog.length} voices from Deepgram.`);
  });
});

$("preview").addEventListener("click", () => {
  const model = $("voice").value;
  const v = voices().find((x) => x.model === model);
  if (previewAudio) { previewAudio.pause(); previewAudio = null; }
  if (v && v.sample) {
    previewAudio = new Audio(v.sample);
    previewAudio.play().catch(() => setStatus("Could not play the sample.", true));
    return;
  }
  const apiKey = $("apiKey").value.trim();
  if (!apiKey) return setStatus("Enter your API key to preview this voice.", true);
  chrome.storage.sync.set({ apiKey }, () => {
    setStatus("Generating preview…");
    chrome.runtime.sendMessage({ type: "tts", model, text: "Hi! This is how I sound. I can read any page for you." }, (resp) => {
      if (!resp || !resp.ok) return setStatus("Preview failed: " + (resp ? resp.error : "no response"), true);
      previewAudio = new Audio("data:audio/mp3;base64," + resp.b64);
      previewAudio.play();
      setStatus("");
    });
  });
});

$("save").addEventListener("click", () => {
  chrome.storage.sync.set({
    apiKey: $("apiKey").value.trim(),
    model: $("voice").value,
    speed: $("speed").value
  }, () => setStatus("Saved ✓"));
});

chrome.storage.sync.get(BRAUO_SETTINGS_DEFAULTS, (s) => {
  $("apiKey").value = s.apiKey;
  $("speed").value = s.speed;
  chrome.storage.local.get({ catalog: null }, (l) => {
    catalog = l.catalog;
    renderVoices(s.model);
  });
});
