// Brauo content script.
// A floating bubble toggles "reading mode": hover highlights a block, click starts
// reading from it and auto-advances to the end of the document, prefetching audio.
(() => {
  if (window.__brauo) return;
  window.__brauo = true;

  const BLOCKS = "p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, tr, dd, dt, pre";

  let cfg = brauoNormalizeConfig({}, {});
  let lastSync = {};
  let lastLocal = { cloudApiKey: "", cloudBaseUrl: "", cloudCatalog: null, cloudPlan: null };
  let cloudCatalog = null;
  let cloudPlan = null;

  let readingMode = false;
  let blocks = [];
  let idx = -1;
  let playing = false;
  let paused = false;
  let session = 0;
  let audio = null;
  let previewAudio = null;
  let resolveCurrent = null;
  let hoverEl = null;
  let currentEl = null;
  const cache = new Map();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function cacheKey(text, voice) {
    const value = voice + "\0" + text;
    let hash = 0x811c9dc5;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return voice + ":" + (hash >>> 0).toString(16).padStart(8, "0") + ":" + text.length;
  }

  // ---------- UI ----------
  const bar = document.createElement("div");
  bar.id = "brauo-bar";
  bar.innerHTML = `
    <button id="brauo-bubble" title="Brauo: read this page aloud"><svg width="22" height="22" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M16 17 L30 32 L16 47" stroke="#9ccbe8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 17 L48 32 L34 47" stroke="#eef2f8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <div id="brauo-controls" style="display:none">
      <button id="brauo-play" title="Pause / Resume">⏸</button>
      <button id="brauo-stop" title="Stop">⏹</button>
      <select id="brauo-voice" title="Voice"></select>
      <select id="brauo-speed" title="Speed">
        <option value="1">1×</option>
        <option value="1.25">1.25×</option>
        <option value="1.5">1.5×</option>
        <option value="1.75">1.75×</option>
        <option value="2">2×</option>
      </select>
      <span id="brauo-spinner"></span>
      <span id="brauo-status">Click a paragraph to start</span>
      <button id="brauo-gear" title="Options">⚙</button>
      <button id="brauo-close" title="Exit reading mode">✕</button>
    </div>`;
  document.documentElement.appendChild(bar);

  const bubble = bar.querySelector("#brauo-bubble");
  const controls = bar.querySelector("#brauo-controls");
  const btnPlay = bar.querySelector("#brauo-play");
  const btnStop = bar.querySelector("#brauo-stop");
  const btnGear = bar.querySelector("#brauo-gear");
  const btnClose = bar.querySelector("#brauo-close");
  const voiceSel = bar.querySelector("#brauo-voice");
  const speedSel = bar.querySelector("#brauo-speed");
  const statusEl = bar.querySelector("#brauo-status");
  const spinner = bar.querySelector("#brauo-spinner");

  const setStatus = (t, loading = false) => {
    statusEl.textContent = t;
    spinner.style.display = loading ? "inline-block" : "none";
  };
  const activeVoice = () => cfg.cloud.voice;

  function renderVoices() {
    const all = cloudCatalog && cloudCatalog.length ? cloudCatalog : BRAUO_CLOUD_FALLBACK_VOICES;
    const resolved = brauoResolveVoiceForPlan(all, cloudPlan, activeVoice());
    if (resolved !== cfg.cloud.voice) {
      cfg = { ...cfg, cloud: { ...cfg.cloud, voice: resolved } };
      chrome.storage.sync.set({ cloud: { voice: resolved } });
    }
    brauoRenderVoiceOptions(voiceSel, brauoVoicesForPlan(all, cloudPlan), resolved);
  }

  function previewVoice(voice) {
    if (previewAudio) { try { previewAudio.pause(); } catch (_) {} previewAudio = null; }
    setStatus("Preview…", true);
    chrome.runtime.sendMessage({ type: "tts", text: BRAUO_PREVIEW_SAMPLE, voice }, (resp) => {
      if (chrome.runtime.lastError || !resp || !resp.ok) {
        setStatus("Preview failed: " + ((resp && resp.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || "no response"));
        return;
      }
      previewAudio = new Audio("data:" + (resp.mime || "audio/mp3") + ";base64," + resp.b64);
      previewAudio.playbackRate = parseFloat(speedSel.value);
      previewAudio.play().catch(() => {});
      const opt = voiceSel.selectedOptions[0];
      setStatus("Voice: " + (opt ? opt.textContent : voice));
    });
  }

  function enterReadingMode() {
    readingMode = true;
    bubble.style.display = "none";
    controls.style.display = "flex";
    collectBlocks();
    if (!cfg.cloud.apiKey) {
      setStatus("Set your Brauo API key in Options ⚙");
    } else {
      setStatus(`Ready: ${blocks.length} blocks. Click where you want to start.`);
    }
  }

  function exitReadingMode() {
    stopAll();
    readingMode = false;
    controls.style.display = "none";
    bubble.style.display = "block";
    setHover(null);
  }

  bubble.addEventListener("click", enterReadingMode);
  btnClose.addEventListener("click", exitReadingMode);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "brauo-activate") {
      if (readingMode) exitReadingMode();
      else enterReadingMode();
    }
  });

  btnGear.addEventListener("click", () => chrome.runtime.sendMessage({ type: "openOptions" }));
  btnStop.addEventListener("click", () => { stopAll(); setStatus("Stopped. Click a paragraph to read."); });

  btnPlay.addEventListener("click", () => {
    if (!playing) {
      if (blocks.length === 0) collectBlocks();
      playFrom(idx >= 0 ? idx : 0);
      return;
    }
    if (paused) {
      paused = false; btnPlay.textContent = "⏸";
      if (audio) audio.play().catch(() => {});
      setStatus(`Reading ${idx + 1} / ${blocks.length}`);
    } else {
      paused = true; btnPlay.textContent = "▶";
      if (audio) audio.pause();
      setStatus("Paused");
    }
  });

  speedSel.addEventListener("change", () => {
    if (audio) audio.playbackRate = parseFloat(speedSel.value);
    chrome.storage.sync.set({ speed: speedSel.value });
  });

  voiceSel.addEventListener("change", () => {
    const voice = voiceSel.value;
    cfg = { ...cfg, cloud: { ...cfg.cloud, voice } };
    chrome.storage.sync.set({ cloud: { voice } });
    if (playing) {
      // Apply the new voice to upcoming blocks WITHOUT re-reading (and re-charging) the
      // current one: drop the stale-voice prefetch so the next block is synthesized in the
      // new voice; the current block finishes in the previous voice.
      cache.clear();
      setStatus(`Reading ${idx + 1} / ${blocks.length} · new voice from the next block`);
    } else {
      // Idle: a short, cheap sample so voices can be compared on identical text.
      previewVoice(voice);
    }
  });

  // ---------- Settings ----------
  Promise.all([
    chrome.storage.sync.get(null),
    chrome.storage.local.get({ cloudApiKey: "", cloudBaseUrl: "", cloudCatalog: null, cloudPlan: null })
  ]).then(([sync, local]) => {
    lastSync = sync;
    lastLocal = local;
    cloudCatalog = local.cloudCatalog;
    cloudPlan = local.cloudPlan;
    cfg = brauoNormalizeConfig(lastSync, lastLocal);
    speedSel.value = cfg.speed;
    renderVoices();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" && area !== "local") return;
    const previousVoice = activeVoice();
    const snapshot = area === "sync" ? lastSync : lastLocal;
    for (const [key, change] of Object.entries(changes)) {
      if (change.newValue === undefined) delete snapshot[key];
      else snapshot[key] = change.newValue;
    }
    if (area === "local") {
      cloudCatalog = lastLocal.cloudCatalog || null;
      cloudPlan = lastLocal.cloudPlan || null;
    }
    cfg = brauoNormalizeConfig(lastSync, lastLocal);
    speedSel.value = cfg.speed;
    const cloudCatalogChanged = area === "local" && changes.cloudCatalog;
    const cloudPlanChanged = area === "local" && changes.cloudPlan;
    if (previousVoice !== activeVoice() || cloudCatalogChanged || cloudPlanChanged) renderVoices();
  });

  // ---------- Blocks ----------
  function textOf(el) {
    if (el.tagName === "TR") {
      return Array.from(el.cells).map((c) => c.innerText.replace(/\s+/g, " ").trim()).filter(Boolean).join(", ");
    }
    return (el.innerText || "").replace(/\s+/g, " ").trim();
  }

  function collectBlocks() {
    const all = Array.from(document.querySelectorAll(BLOCKS));
    blocks = all.filter((el) => {
      if (el.closest("#brauo-bar")) return false;
      if (el.tagName !== "TR") {
        if (el.closest("tr")) return false; // cell content is read per row
        const p = el.parentElement && el.parentElement.closest(BLOCKS);
        if (p && p.tagName !== "TR") return false; // nested block: read with its parent
      }
      return textOf(el).length > 0;
    });
  }

  function chunkText(t) {
    const maxChars = BRAUO_MAX_CHARS;
    if (t.length <= maxChars) return [t];
    const parts = [];
    let rest = t;
    while (rest.length > maxChars) {
      let cut = rest.lastIndexOf(". ", maxChars);
      if (cut < maxChars * 0.5) cut = rest.lastIndexOf(" ", maxChars);
      if (cut <= 0) cut = maxChars;
      parts.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1);
    }
    if (rest.trim()) parts.push(rest.trim());
    return parts;
  }

  // ---------- TTS ----------
  const FATAL_CODES = ["NO_KEY", "invalid_key", "quota_exceeded", "voice_not_found", "text_too_long", "invalid_provider"];
  const isFatal = (e) => !!(e && FATAL_CODES.includes(e.code));

  function ttsChunk(text) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "tts", text, voice: activeVoice() }, (resp) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!resp || !resp.ok) {
          const err = new Error(resp ? resp.error : "no response from service worker");
          if (resp && resp.code) err.code = resp.code;
          return reject(err);
        }
        resolve({ b64: resp.b64, mime: resp.mime });
      });
    });
  }

  function getBlockAudio(i) {
    const t = textOf(blocks[i]);
    const voice = activeVoice();
    const key = cacheKey(t, voice);
    if (!cache.has(key)) {
      const p = Promise.all(chunkText(t).map(ttsChunk));
      cache.set(key, p);
      p.catch(() => { if (cache.get(key) === p) cache.delete(key); });
      if (cache.size > 24) {
        const nextKey = blocks[i + 1] ? cacheKey(textOf(blocks[i + 1]), voice) : null;
        for (const k of cache.keys()) { if (k !== key && k !== nextKey) { cache.delete(k); break; } }
      }
    }
    return cache.get(key);
  }

  function playPart(part) {
    return new Promise((resolve) => {
      resolveCurrent = resolve;
      audio = new Audio("data:" + (part.mime || "audio/mp3") + ";base64," + part.b64);
      audio.playbackRate = parseFloat(speedSel.value);
      audio.onended = () => { resolveCurrent = null; resolve(); };
      audio.onerror = () => { resolveCurrent = null; resolve(); };
      audio.play().catch(() => { resolveCurrent = null; resolve(); });
    });
  }

  function stopAll() {
    playing = false;
    paused = false;
    btnPlay.textContent = "⏸";
    if (audio) { try { audio.pause(); audio.src = ""; } catch (_) {} audio = null; }
    if (previewAudio) { try { previewAudio.pause(); } catch (_) {} previewAudio = null; }
    if (resolveCurrent) { const r = resolveCurrent; resolveCurrent = null; r(); }
    clearCurrent();
  }

  async function playFrom(i) {
    stopAll();
    const mySession = ++session;
    idx = i;
    playing = true;
    paused = false;
    btnPlay.textContent = "⏸";
    while (playing && session === mySession && idx < blocks.length) {
      const el = blocks[idx];
      markCurrent(el);
      let parts;
      try {
        setStatus(`Generating audio ${idx + 1} / ${blocks.length}…`, true);
        parts = await getBlockAudio(idx);
      } catch (e) {
        if (isFatal(e)) {
          setStatus(e.message);
          playing = false;
          btnPlay.textContent = "▶";
          break;
        }
        let recovered = false;
        for (let attempt = 1; attempt <= 3 && playing && session === mySession; attempt += 1) {
          setStatus(
            navigator.onLine
              ? `Connection interrupted. Reconnecting… (${attempt}/3)`
              : "You appear to be offline. Waiting to reconnect…",
            true
          );
          await sleep(1000 * attempt);
          if (!playing || session !== mySession) break;
          try { parts = await getBlockAudio(idx); recovered = true; break; } catch (_) { /* keep trying */ }
        }
        if (!recovered) {
          if (session === mySession) {
            playing = false;
            btnPlay.textContent = "▶";
            setStatus(
              navigator.onLine
                ? "Connection interrupted. Press ▶ to resume."
                : "You appear to be offline. Press ▶ to resume when you're back."
            );
          }
          break;
        }
      }
      if (!playing || session !== mySession) break;
      if (idx + 1 < blocks.length) getBlockAudio(idx + 1).catch(() => {});
      setStatus(`Reading ${idx + 1} / ${blocks.length}`);
      for (const part of parts) {
        if (!playing || session !== mySession) break;
        await playPart(part);
      }
      if (!playing || session !== mySession) break;
      idx++;
    }
    if (session === mySession && idx >= blocks.length && blocks.length > 0) {
      playing = false;
      clearCurrent();
      setStatus("End of document 🎉");
    }
  }

  // ---------- Highlighting ----------
  function setHover(el) {
    if (hoverEl === el) return;
    if (hoverEl) hoverEl.classList.remove("brauo-hover");
    hoverEl = el;
    if (hoverEl) hoverEl.classList.add("brauo-hover");
  }
  function markCurrent(el) {
    clearCurrent();
    currentEl = el;
    el.classList.add("brauo-current");
    try { el.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (_) {}
  }
  function clearCurrent() {
    if (currentEl) { currentEl.classList.remove("brauo-current"); currentEl = null; }
  }

  document.addEventListener("mouseover", (e) => {
    if (!readingMode) return;
    const b = e.target.closest && e.target.closest(BLOCKS);
    if (!b || b.closest("#brauo-bar")) { setHover(null); return; }
    setHover(b.tagName === "TD" || b.tagName === "TH" ? b.closest("tr") : b);
  });

  document.addEventListener("click", (e) => {
    if (!readingMode) return;
    if (e.target.closest("#brauo-bar")) return;
    if (e.target.closest("a, button, input, select, textarea, [contenteditable='true']")) return;
    let b = e.target.closest && e.target.closest(BLOCKS);
    if (!b) return;
    if (b.tagName === "TD" || b.tagName === "TH") b = b.closest("tr");
    collectBlocks();
    const i = blocks.indexOf(b);
    if (i >= 0) { e.preventDefault(); playFrom(i); }
  }, true);
})();
