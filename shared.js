// Brauo shared constants and helpers, loaded by the service worker, the content script, and the options page.
const BRAUO_CLOUD_API = "https://api.brauo.com";
const BRAUO_CLOUD_DEFAULT_VOICE = "brauo-luna-es";
const BRAUO_PREVIEW_SAMPLE = "This is how I sound.";
const BRAUO_MAX_CHARS = 1800; // the service rejects requests near 2000 chars

function brauoNormalizeConfig(sync, local) {
  return {
    speed: sync.speed || "1",
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

function brauoVoicesForPlan(voices, plan) {
  if (String(plan || "").toLowerCase() === "free") {
    return voices.filter((v) => v.tier === "free");
  }
  return voices;
}

function brauoResolveVoiceForPlan(voices, plan, selected) {
  if (String(plan || "").toLowerCase() !== "free") return selected;
  const allowed = brauoVoicesForPlan(voices, plan);
  if (allowed.some((v) => v.model === selected)) return selected;
  if (!allowed.length) return selected;
  // Snap to a free voice, preferring the current voice's language so a Spanish
  // reader is not moved to another language just because it was first in the list.
  const base = (lang) => String(lang || "").split("-")[0].toLowerCase();
  const current = voices.find((v) => v.model === selected);
  const sameLang = current && allowed.find((v) => base(v.lang) === base(current.lang));
  return (sameLang || allowed[0]).model;
}
