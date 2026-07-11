const BRAUO_CLOUD_API = "https://api.brauo.com";
const BRAUO_DEEPGRAM_DEFAULT_VOICE = "aura-2-celeste-es";
const BRAUO_CLOUD_DEFAULT_VOICE = "brauo-luna-es";
const BRAUO_MAX_CHARS = { deepgram: 1800, cloud: 1800 };

function brauoNormalizeConfig(sync, local) {
  const deepgram = sync.deepgram || {
    apiKey: sync.apiKey,
    voice: sync.model
  };

  return {
    mode: sync.mode === "cloud" ? "cloud" : "deepgram",
    speed: sync.speed || "1",
    deepgram: {
      apiKey: deepgram.apiKey || "",
      voice: deepgram.voice || BRAUO_DEEPGRAM_DEFAULT_VOICE
    },
    cloud: {
      apiKey: local.cloudApiKey || "",
      voice: (sync.cloud && sync.cloud.voice) || BRAUO_CLOUD_DEFAULT_VOICE,
      baseUrl: local.cloudBaseUrl || BRAUO_CLOUD_API
    }
  };
}

function brauoLangLabel(lang) {
  try {
    const base = (lang || "").split("-")[0];
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    const name = dn.of(base) || lang;
    const region = lang.includes("-") ? ` (${lang.split("-")[1]})` : "";
    return name.charAt(0).toUpperCase() + name.slice(1) + region;
  } catch (_) { return lang; }
}

function brauoRenderVoiceOptions(sel, voiceList, selected, opts) {
  const groups = new Map();
  for (const v of voiceList) {
    const key = brauoLangLabel(v.lang);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  }
  sel.innerHTML = "";
  for (const [label, voices] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const og = document.createElement("optgroup");
    og.label = label;
    for (const v of voices.sort((a, b) => a.name.localeCompare(b.name))) {
      const opt = document.createElement("option");
      opt.value = v.model;
      opt.textContent = opts && opts.withAccent && v.accent ? `${v.name} - ${v.accent}` : v.name;
      og.appendChild(opt);
    }
    sel.appendChild(og);
  }
  if (selected && ![...sel.options].some((o) => o.value === selected)) {
    const opt = document.createElement("option");
    opt.value = selected;
    opt.textContent = selected;
    sel.appendChild(opt);
  }
  if (selected) sel.value = selected;
}
