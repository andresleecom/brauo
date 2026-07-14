// Brauo options page.
const $ = (id) => document.getElementById(id);
let cloudCatalog = null;
let cloudPlan = null;
let previewAudio = null;

function cloudVoices() {
  return cloudCatalog && cloudCatalog.length ? cloudCatalog : BRAUO_CLOUD_FALLBACK_VOICES;
}

function renderCloudVoices(selected) {
  const all = cloudVoices();
  const shown = brauoVoicesForPlan(all, cloudPlan);
  const resolved = brauoResolveVoiceForPlan(all, cloudPlan, selected);
  brauoRenderVoiceOptions($("cloudVoice"), shown, resolved);
  $("cloudVoiceCount").textContent = `${shown.length} voices available` +
    (cloudCatalog && cloudCatalog.length ? " (live catalog)" : " (bundled list)");
  $("cloudUpgrade").style.display = String(cloudPlan || "").toLowerCase() === "free" ? "block" : "none";
}

function setStatus(msg, isError) {
  const el = $("status");
  el.textContent = msg;
  el.className = isError ? "error" : "";
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

$("cloudToggleKey").addEventListener("click", () => togglePassword("cloudKey", "cloudToggleKey"));

$("cloudRefresh").addEventListener("click", async () => {
  const baseUrl = $("cloudBaseUrl").value.trim() || undefined;
  setStatus("Loading voices…");
  try {
    const resp = await sendMessage({ type: "catalog", baseUrl });
    if (!resp || !resp.ok) throw new Error(resp ? resp.error : "no response");
    cloudCatalog = resp.voices;
    renderCloudVoices($("cloudVoice").value);
    setStatus(`Loaded ${cloudCatalog.length} voices.`);
  } catch (e) {
    setStatus("Could not load voices: " + e.message, true);
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
  try {
    await Promise.all([
      chrome.storage.sync.set({
        speed: $("speed").value,
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
  chrome.storage.local.get({ cloudApiKey: "", cloudBaseUrl: "", cloudCatalog: null, cloudPlan: null })
]).then(([sync, local]) => {
  const cfg = brauoNormalizeConfig(sync, local);
  cloudCatalog = local.cloudCatalog;
  cloudPlan = local.cloudPlan;
  $("cloudKey").value = local.cloudApiKey || "";
  $("cloudBaseUrl").value = local.cloudBaseUrl || "";
  $("speed").value = cfg.speed;
  renderCloudVoices(cfg.cloud.voice);
}).catch((e) => setStatus("Could not load settings: " + e.message, true));
