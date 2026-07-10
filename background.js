// Brauo service worker: talks to the Deepgram API so content scripts never hit CORS.

const API = "https://api.deepgram.com";

async function getSettings() {
  return chrome.storage.sync.get({ apiKey: "", model: "aura-2-celeste-es", speed: "1" });
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const STEP = 0x8000;
  for (let i = 0; i < bytes.length; i += STEP) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + STEP));
  }
  return btoa(bin);
}

async function speak(text, modelOverride) {
  const { apiKey, model } = await getSettings();
  if (!apiKey) throw new Error("NO_KEY");
  const voice = modelOverride || model;
  const res = await fetch(`${API}/v1/speak?model=${encodeURIComponent(voice)}`, {
    method: "POST",
    headers: { "Authorization": "Token " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Deepgram ${res.status}: ${detail.slice(0, 300)}`);
  }
  return toBase64(await res.arrayBuffer());
}

async function fetchCatalog() {
  const { apiKey } = await getSettings();
  if (!apiKey) throw new Error("NO_KEY");
  const res = await fetch(`${API}/v1/models`, {
    headers: { "Authorization": "Token " + apiKey }
  });
  if (!res.ok) throw new Error(`Deepgram ${res.status}`);
  const data = await res.json();
  const voices = (data.tts || []).map((v) => ({
    model: v.canonical_name,
    name: (v.metadata && v.metadata.display_name) || v.name,
    lang: (v.languages && v.languages[0]) || "?",
    langs: v.languages || [],
    accent: (v.metadata && v.metadata.accent) || "",
    sample: (v.metadata && v.metadata.sample) || ""
  }));
  await chrome.storage.local.set({ catalog: voices, catalogFetchedAt: new Date().toISOString() });
  return voices;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || !msg.type) return;
  if (msg.type === "tts") {
    speak(msg.text, msg.model)
      .then((b64) => sendResponse({ ok: true, b64 }))
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (msg.type === "catalog") {
    fetchCatalog()
      .then((voices) => sendResponse({ ok: true, voices }))
      .catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (msg.type === "openOptions") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return false;
  }
});
