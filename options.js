// Brauo options page.
const $ = (id) => document.getElementById(id);
let catalog = null;
let cloudCatalog = null;
let previewAudio = null;

function deepgramVoices() {
  return catalog && catalog.length ? catalog : BRAUO_FALLBACK_VOICES;
}

function cloudVoices() {
  return cloudCatalog && cloudCatalog.length ? cloudCatalog : BRAUO_CLOUD_FALLBACK_VOICES;
}

function renderDeepgramVoices(selected) {
  const voices = deepgramVoices();
  brauoRenderVoiceOptions($("voice"), voices, selected, { withAccent: true });
  $("voiceCount").textContent = `${voices.length} voices available` +
    (catalog && catalog.length ? " (live catalog)" : " (bundled list - load the live catalog for all voices)");
}

function renderCloudVoices(selected) {
  const voices = cloudVoices();
  brauoRenderVoiceOptions($("cloudVoice"), voices, selected);
  $("cloudVoiceCount").textContent = `${voices.length} voices available` +
    (cloudCatalog && cloudCatalog.length ? " (live catalog)" : " (bundled list)");
}

function setStatus(msg, isError) {
  const el = $("status");
  el.textContent = msg;
  el.className = isError ? "error" : "";
}

function toggleSections() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  $("cloudSection").hidden = mode !== "cloud";
  $("deepgramSection").hidden = mode !== "deepgram";
}

function togglePassword(inputId, buttonId) {
  const input = $(inputId);
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  $(buttonId).textContent = show ? "Hide" : "Show";
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(response);
    });
  });
}

function stopPreview() {
  if (!previewAudio) return;
  previewAudio.pause();
  previewAudio = null;
}

function playUrl(url) {
  stopPreview();
  previewAudio = new Audio(url);
  return previewAudio.play();
}

function playResponse(resp) {
  return playUrl("data:" + (resp.mime || "audio/mp3") + ";base64," + resp.b64);
}

$("toggleKey").addEventListener("click", () => togglePassword("apiKey", "toggleKey"));
$("cloudToggleKey").addEventListener("click", () => togglePassword("cloudKey", "cloudToggleKey"));
document.querySelectorAll('input[name="mode"]').forEach((radio) => radio.addEventListener("change", toggleSections));

$("refresh").addEventListener("click", async () => {
  const key = $("apiKey").value.trim();
  if (!key) return setStatus("Enter your API key first.", true);
  setStatus("Loading voices…");
  try {
    const resp = await sendMessage({ type: "catalog", mode: "deepgram", key });
    if (!resp || !resp.ok) throw new Error(resp ? resp.error : "no response");
    catalog = resp.voices;
    renderDeepgramVoices($("voice").value);
    setStatus(`Loaded ${catalog.length} voices from Deepgram.`);
  } catch (e) {
    setStatus("Could not load voices: " + e.message, true);
  }
});

$("cloudRefresh").addEventListener("click", async () => {
  const baseUrl = $("cloudBaseUrl").value.trim() || undefined;
  setStatus("Loading voices…");
  try {
    const resp = await sendMessage({ type: "catalog", mode: "cloud", baseUrl });
    if (!resp || !resp.ok) throw new Error(resp ? resp.error : "no response");
    cloudCatalog = resp.voices;
    renderCloudVoices($("cloudVoice").value);
    setStatus(`Loaded ${cloudCatalog.length} voices.`);
  } catch (e) {
    setStatus("Could not load voices: " + e.message, true);
  }
});

$("preview").addEventListener("click", async () => {
  const voice = $("voice").value;
  const selected = deepgramVoices().find((item) => item.model === voice);
  stopPreview();
  if (selected && selected.sample) {
    try {
      await playUrl(selected.sample);
      setStatus("");
    } catch (_) {
      setStatus("Could not play the sample.", true);
    }
    return;
  }
  const key = $("apiKey").value.trim();
  if (!key) return setStatus("Enter your API key to preview this voice.", true);
  setStatus("Generating preview…");
  try {
    const resp = await sendMessage({
      type: "tts",
      mode: "deepgram",
      voice,
      key,
      text: "Hi! This is how I sound. I can read any page for you."
    });
    if (!resp || !resp.ok) throw new Error(resp ? resp.error : "no response");
    await playResponse(resp);
    setStatus("");
  } catch (e) {
    setStatus("Preview failed: " + e.message, true);
  }
});

$("cloudPreview").addEventListener("click", async () => {
  const key = $("cloudKey").value.trim();
  if (!key) return setStatus("Enter your API key to preview voices.", true);
  stopPreview();
  setStatus("Generating preview…");
  try {
    const resp = await sendMessage({
      type: "tts",
      mode: "cloud",
      voice: $("cloudVoice").value,
      key,
      baseUrl: $("cloudBaseUrl").value.trim() || undefined,
      text: "Hi! This is how I sound. I can read any page for you."
    });
    if (!resp || !resp.ok) throw new Error(resp ? resp.error : "no response");
    await playResponse(resp);
    setStatus("");
  } catch (e) {
    setStatus("Preview failed: " + e.message, true);
  }
});

$("save").addEventListener("click", async () => {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  try {
    await Promise.all([
      chrome.storage.sync.set({
        mode,
        speed: $("speed").value,
        deepgram: { apiKey: $("apiKey").value.trim(), voice: $("voice").value },
        cloud: { voice: $("cloudVoice").value }
      }),
      chrome.storage.local.set({
        cloudApiKey: $("cloudKey").value.trim(),
        cloudBaseUrl: $("cloudBaseUrl").value.trim()
      })
    ]);
    setStatus("Saved ✓");
  } catch (e) {
    setStatus("Could not save: " + e.message, true);
  }
});

Promise.all([
  chrome.storage.sync.get(null),
  chrome.storage.local.get({ cloudApiKey: "", cloudBaseUrl: "", catalog: null, cloudCatalog: null })
]).then(([sync, local]) => {
  const cfg = brauoNormalizeConfig(sync, local);
  catalog = local.catalog;
  cloudCatalog = local.cloudCatalog;
  $("apiKey").value = cfg.deepgram.apiKey;
  $("cloudKey").value = local.cloudApiKey || "";
  $("cloudBaseUrl").value = local.cloudBaseUrl || "";
  $("speed").value = cfg.speed;
  document.querySelector(`input[name="mode"][value="${cfg.mode}"]`).checked = true;
  renderDeepgramVoices(cfg.deepgram.voice);
  renderCloudVoices(cfg.cloud.voice);
  toggleSections();
}).catch((e) => setStatus("Could not load settings: " + e.message, true));
