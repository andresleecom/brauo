// Brauo content script.
// A floating bubble toggles "reading mode": hover highlights a block, click starts
// reading from it and auto-advances to the end of the document, prefetching audio.
(() => {
  if (window.__brauo) return;
  window.__brauo = true;

  const BLOCKS = "p, h1, h2, h3, h4, h5, h6, li, blockquote, figcaption, tr, dd, dt, pre";
  const MAX_CHARS = 1800; // Deepgram limit is 2000 per request

  let settings = { apiKey: "", model: "aura-2-celeste-es", speed: "1" };
  let catalog = null;

  let readingMode = false;
  let blocks = [];
  let idx = -1;
  let playing = false;
  let paused = false;
  let session = 0;
  let audio = null;
  let resolveCurrent = null;
  let hoverEl = null;
  let currentEl = null;
  const cache = new Map();

  // ---------- UI ----------
  const bar = document.createElement("div");
  bar.id = "brauo-bar";
  bar.innerHTML = `
    <button id="brauo-bubble" title="Brauo — read this page aloud">🔊</button>
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

  const setStatus = (t) => { statusEl.textContent = t; };

  function langLabel(lang) {
    try {
      const base = (lang || "").split("-")[0];
      const dn = new Intl.DisplayNames(["en"], { type: "language" });
      const name = dn.of(base) || lang;
      const region = lang.includes("-") ? ` (${lang.split("-")[1]})` : "";
      return name.charAt(0).toUpperCase() + name.slice(1) + region;
    } catch (_) { return lang; }
  }

  function renderVoices() {
    const voices = (catalog && catalog.length ? catalog : BRAUO_FALLBACK_VOICES);
    const groups = new Map();
    for (const v of voices) {
      const key = langLabel(v.lang);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(v);
    }
    voiceSel.innerHTML = "";
    for (const [label, vs] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const og = document.createElement("optgroup");
      og.label = label;
      for (const v of vs.sort((a, b) => a.name.localeCompare(b.name))) {
        const opt = document.createElement("option");
        opt.value = v.model;
        opt.textContent = v.name;
        og.appendChild(opt);
      }
      voiceSel.appendChild(og);
    }
    if (![...voiceSel.options].some((o) => o.value === settings.model)) {
      const opt = document.createElement("option");
      opt.value = settings.model;
      opt.textContent = settings.model;
      voiceSel.appendChild(opt);
    }
    voiceSel.value = settings.model;
  }

  bubble.addEventListener("click", () => {
    readingMode = true;
    bubble.style.display = "none";
    controls.style.display = "flex";
    collectBlocks();
    if (!settings.apiKey) setStatus("Set your Deepgram API key in Options ⚙");
    else setStatus(`Ready — ${blocks.length} blocks. Click where you want to start.`);
  });

  btnClose.addEventListener("click", () => {
    stopAll();
    readingMode = false;
    controls.style.display = "none";
    bubble.style.display = "block";
    setHover(null);
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
    settings.model = voiceSel.value;
    chrome.storage.sync.set({ model: settings.model });
    cache.clear();
    setStatus("Voice: " + voiceSel.selectedOptions[0].textContent);
  });

  // ---------- Settings ----------
  chrome.storage.sync.get({ apiKey: "", model: "aura-2-celeste-es", speed: "1" }, (s) => {
    settings = s;
    speedSel.value = s.speed;
    chrome.storage.local.get({ catalog: null }, (l) => {
      catalog = l.catalog;
      renderVoices();
    });
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync") {
      if (changes.apiKey) settings.apiKey = changes.apiKey.newValue;
      if (changes.model && changes.model.newValue !== settings.model) {
        settings.model = changes.model.newValue;
        cache.clear();
        renderVoices();
      }
    }
    if (area === "local" && changes.catalog) {
      catalog = changes.catalog.newValue;
      renderVoices();
    }
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
    if (t.length <= MAX_CHARS) return [t];
    const parts = [];
    let rest = t;
    while (rest.length > MAX_CHARS) {
      let cut = rest.lastIndexOf(". ", MAX_CHARS);
      if (cut < MAX_CHARS * 0.5) cut = rest.lastIndexOf(" ", MAX_CHARS);
      if (cut <= 0) cut = MAX_CHARS;
      parts.push(rest.slice(0, cut + 1).trim());
      rest = rest.slice(cut + 1);
    }
    if (rest.trim()) parts.push(rest.trim());
    return parts;
  }

  // ---------- TTS ----------
  function ttsChunk(text) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "tts", text, model: settings.model }, (resp) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!resp || !resp.ok) {
          const err = resp ? resp.error : "no response from service worker";
          return reject(new Error(err === "NO_KEY" ? "Set your Deepgram API key in Options ⚙" : err));
        }
        resolve(resp.b64);
      });
    });
  }

  function getBlockAudio(i) {
    if (!cache.has(i)) {
      const t = textOf(blocks[i]);
      cache.set(i, Promise.all(chunkText(t).map(ttsChunk)));
      if (cache.size > 24) {
        for (const k of cache.keys()) { if (k !== i && k !== i + 1) { cache.delete(k); break; } }
      }
    }
    return cache.get(i);
  }

  function playB64(b64) {
    return new Promise((resolve) => {
      resolveCurrent = resolve;
      audio = new Audio("data:audio/mp3;base64," + b64);
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
        setStatus(`Generating audio ${idx + 1} / ${blocks.length}…`);
        parts = await getBlockAudio(idx);
      } catch (e) {
        setStatus(e.message);
        playing = false;
        break;
      }
      if (!playing || session !== mySession) break;
      if (idx + 1 < blocks.length) getBlockAudio(idx + 1).catch(() => {});
      setStatus(`Reading ${idx + 1} / ${blocks.length}`);
      for (const b64 of parts) {
        if (!playing || session !== mySession) break;
        await playB64(b64);
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
