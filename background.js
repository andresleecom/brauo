importScripts("shared.js");

// Brauo service worker: talks to TTS providers so content scripts never hit CORS.

const DEEPGRAM_API = "https://api.deepgram.com";

async function migrateStorage() {
  const sync = await chrome.storage.sync.get(null);
  if (!("apiKey" in sync) && !("model" in sync)) return;
  await chrome.storage.sync.set({
    mode: sync.mode || "deepgram",
    deepgram: sync.deepgram || {
      apiKey: sync.apiKey || "",
      voice: sync.model || BRAUO_DEEPGRAM_DEFAULT_VOICE
    },
    cloud: sync.cloud || { voice: BRAUO_CLOUD_DEFAULT_VOICE }
  });
  await chrome.storage.sync.remove(["apiKey", "model"]);
}

const storageMigration = migrateStorage();

async function getConfig() {
  await storageMigration;
  return brauoNormalizeConfig(
    await chrome.storage.sync.get(null),
    await chrome.storage.local.get({ cloudApiKey: "", cloudBaseUrl: "" })
  );
}

function brauoError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function fetchWithRetry(url, init, attempts = 3) {
  let lastResponse;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let retryResponse;
    try {
      const response = await fetch(url, init);
      lastResponse = response;
      if (response.status !== 429 && response.status < 500) return response;
      retryResponse = response;
    } catch (_) {
      // Network failures are retried below.
    }

    if (attempt < attempts - 1) {
      const retryAfter = retryResponse && retryResponse.headers.get("Retry-After");
      const retryAfterSeconds = retryAfter === null ? NaN : Number(retryAfter);
      const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
        ? Math.min(retryAfterSeconds, 10) * 1000
        : 700 * (2 ** attempt) + Math.random() * 300;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (lastResponse) return lastResponse;
  throw brauoError("network", "Could not reach the voice service. Check your connection.");
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

const DeepgramProvider = {
  async speak(text, voice, cfg) {
    if (!cfg.deepgram.apiKey) {
      throw brauoError("NO_KEY", "Set your Deepgram API key in Options");
    }
    const res = await fetchWithRetry(`${DEEPGRAM_API}/v1/speak?model=${encodeURIComponent(voice)}`, {
      method: "POST",
      headers: {
        "Authorization": "Token " + cfg.deepgram.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw brauoError(`http_${res.status}`, `Deepgram ${res.status}: ${detail.slice(0, 300)}`);
    }
    const contentType = res.headers.get("Content-Type") || "";
    return {
      b64: toBase64(await res.arrayBuffer()),
      mime: contentType.startsWith("audio/") ? contentType : "audio/mp3"
    };
  },

  async listVoices(cfg) {
    if (!cfg.deepgram.apiKey) {
      throw brauoError("NO_KEY", "Set your Deepgram API key in Options");
    }
    const res = await fetchWithRetry(`${DEEPGRAM_API}/v1/models`, {
      headers: { "Authorization": "Token " + cfg.deepgram.apiKey }
    });
    if (!res.ok) throw brauoError(`http_${res.status}`, `Deepgram ${res.status}`);
    const data = await res.json();
    return (data.tts || []).map((v) => ({
      model: v.canonical_name,
      name: (v.metadata && v.metadata.display_name) || v.name,
      lang: (v.languages && v.languages[0]) || "?",
      langs: v.languages || [],
      accent: (v.metadata && v.metadata.accent) || "",
      sample: (v.metadata && v.metadata.sample) || ""
    }));
  }
};

const BRAUO_CLOUD_ERROR_MESSAGES = {
  invalid_key: "Your Brauo Cloud API key was rejected. Check it in Options.",
  quota_exceeded: "You have reached your Brauo Cloud usage limit.",
  voice_not_found: "That voice is not available. Pick another voice in Options.",
  text_too_long: "This block is too long to synthesize."
};

const BrauoCloudProvider = {
  async speak(text, voice, cfg) {
    if (!cfg.cloud.apiKey) {
      throw brauoError("NO_KEY", "Set your Brauo Cloud API key in Options");
    }
    const baseUrl = cfg.cloud.baseUrl.replace(/\/$/, "");
    const res = await fetchWithRetry(`${baseUrl}/v1/speak`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + cfg.cloud.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, voice, format: "mp3", cache: true })
    });
    if (!res.ok) throw await BrauoCloudProvider.responseError(res);
    const contentType = res.headers.get("Content-Type") || "";
    const cache = res.headers.get("X-Brauo-Cache");
    const result = {
      b64: toBase64(await res.arrayBuffer()),
      mime: contentType.startsWith("audio/") ? contentType : "audio/mp3"
    };
    if (cache) result.cache = cache;
    return result;
  },

  async listVoices(cfg) {
    const baseUrl = cfg.cloud.baseUrl.replace(/\/$/, "");
    const res = await fetchWithRetry(`${baseUrl}/v1/voices`);
    if (!res.ok) throw await BrauoCloudProvider.responseError(res);
    const data = await res.json();
    return (data.voices || []).map((v) => ({
      model: v.id,
      name: v.display_name || v.id,
      lang: v.language || "?"
    }));
  },

  async responseError(res) {
    const data = await res.json().catch(() => null);
    const envelope = data && data.error;
    const code = (envelope && envelope.code) || `http_${res.status}`;
    const message = BRAUO_CLOUD_ERROR_MESSAGES[code]
      || (res.status === 429 && "The voice service is busy. Try again in a moment.")
      || (res.status >= 500 && "The voice service had a temporary problem. Try again.")
      || (envelope && envelope.message)
      || `Request failed (${res.status}).`;
    return brauoError(
      code,
      message
    );
  }
};

const PROVIDERS = { deepgram: DeepgramProvider, cloud: BrauoCloudProvider };

function withRequestOverrides(cfg, mode, msg) {
  const overridden = {
    ...cfg,
    deepgram: { ...cfg.deepgram },
    cloud: { ...cfg.cloud }
  };
  if (msg.key !== undefined) overridden[mode].apiKey = msg.key;
  if (mode === "cloud" && msg.baseUrl !== undefined) overridden.cloud.baseUrl = msg.baseUrl;
  return overridden;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || !msg.type) return;
  if (msg.type === "tts") {
    getConfig()
      .then(async (cfg) => {
        const mode = msg.mode || cfg.mode;
        const provider = PROVIDERS[mode];
        if (!provider) throw brauoError("invalid_provider", `Unknown provider: ${mode}`);
        const requestCfg = withRequestOverrides(cfg, mode, msg);
        const voice = msg.voice || msg.model || requestCfg[mode].voice;
        const { b64, mime, cache } = await provider.speak(msg.text, voice, requestCfg);
        return { ok: true, b64, mime, cache };
      })
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, code: e.code || "error", error: e.message }));
    return true;
  }
  if (msg.type === "catalog") {
    getConfig()
      .then(async (cfg) => {
        const mode = msg.mode || cfg.mode;
        const provider = PROVIDERS[mode];
        if (!provider) throw brauoError("invalid_provider", `Unknown provider: ${mode}`);
        const requestCfg = withRequestOverrides(cfg, mode, msg);
        const voices = await provider.listVoices(requestCfg);
        const fetchedAt = new Date().toISOString();
        await chrome.storage.local.set(mode === "cloud"
          ? { cloudCatalog: voices, cloudCatalogFetchedAt: fetchedAt }
          : { catalog: voices, catalogFetchedAt: fetchedAt });
        return { ok: true, voices };
      })
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, code: e.code || "error", error: e.message }));
    return true;
  }
  if (msg.type === "openOptions") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return false;
  }
});
