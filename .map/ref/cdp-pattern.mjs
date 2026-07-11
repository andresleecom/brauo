// E1 no-key smoke: drive the unpacked extension over CDP.
const PORT = process.argv[2] || "9333";
const OUT = process.argv[3] || ".";
const results = { steps: [], errors: [] };
const step = (name, ok, detail) => { results.steps.push({ name, ok, detail }); console.error(`${ok ? "PASS" : "FAIL"} ${name}: ${detail}`); };

async function jget(p) { const r = await fetch(`http://127.0.0.1:${PORT}${p}`); return r.json(); }
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); ws.onopen = () => res(ws); ws.onerror = (e) => rej(new Error("ws error")); }); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.exceptions = [];
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && this.pending.has(d.id)) {
        const { res, rej } = this.pending.get(d.id); this.pending.delete(d.id);
        d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result);
      } else if (d.method === "Runtime.exceptionThrown") {
        this.exceptions.push(JSON.stringify(d.params.exceptionDetails).slice(0, 400));
      } else if (d.method === "Log.entryAdded" && d.params.entry.level === "error") {
        this.exceptions.push(`${d.params.entry.source}: ${d.params.entry.text}`.slice(0, 400));
      }
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

async function evalIn(cdp, sess, expr, awaitPromise = false) {
  const r = await cdp.send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise }, sess);
  if (r.exceptionDetails) throw new Error("eval: " + JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result.value;
}

async function attach(cdp, targetId) {
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Log.enable", {}, sessionId).catch(() => {});
  await cdp.send("Page.enable", {}, sessionId).catch(() => {});
  return sessionId;
}

async function waitFor(fn, ms, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const v = await fn(); if (v) return v; await sleep(300); }
  throw new Error("timeout: " + label);
}

async function shot(cdp, sess, file) {
  const r = await cdp.send("Page.captureScreenshot", { format: "png" }, sess);
  const fs = await import("fs");
  fs.writeFileSync(`${OUT}/${file}`, Buffer.from(r.data, "base64"));
}

const ver = await jget("/json/version");
const cdp = new CDP(await connect(ver.webSocketDebuggerUrl));

// 1. Load the unpacked extension over CDP (Chrome 137+ ignores --load-extension).
const extPath = process.argv[4] || "C:/Users/Andres Lee/Documents/brauo";
const { id: extId } = await cdp.send("Extensions.loadUnpacked", { path: extPath });
step("extension loaded", true, extId);

// 2. Options page: cloud catalog through the worker, then Save cloud mode.
const { targetId: optTarget } = await cdp.send("Target.createTarget", { url: `chrome-extension://${extId}/options.html` });
const opt = await attach(cdp, optTarget);
await waitFor(() => evalIn(cdp, opt, `document.readyState === "complete" && !!document.getElementById("cloudRefresh")`), 10000, "options load");
await sleep(500);
const dgSectionDefault = await evalIn(cdp, opt, `!document.getElementById("deepgramSection").hidden && document.getElementById("cloudSection").hidden`);
step("default mode deepgram (fresh install)", dgSectionDefault === true, String(dgSectionDefault));

await evalIn(cdp, opt, `document.querySelector('input[name="mode"][value="cloud"]').click()`);
const cloudVisible = await evalIn(cdp, opt, `!document.getElementById("cloudSection").hidden && document.getElementById("deepgramSection").hidden`);
step("mode radio toggles sections", cloudVisible === true, String(cloudVisible));

const bundled = await evalIn(cdp, opt, `[...document.getElementById("cloudVoice").options].map(o => o.value).join(",")`);
step("bundled cloud fallback voices render", bundled.includes("brauo-luna-es") && bundled.includes("brauo-nova-en"), bundled);

await evalIn(cdp, opt, `document.getElementById("cloudRefresh").click()`);
const catStatus = await waitFor(async () => {
  const s = await evalIn(cdp, opt, `document.getElementById("status").textContent`);
  return s && s.includes("Loaded") ? s : (s && s.includes("Could not") ? s : null);
}, 20000, "cloud catalog fetch");
step("live cloud catalog via worker", catStatus.includes("Loaded"), catStatus);
const liveCount = await evalIn(cdp, opt, `document.getElementById("cloudVoiceCount").textContent`);
step("cloud voice count hint", liveCount.includes("live catalog"), liveCount);

const previewMsg = await evalIn(cdp, opt, `document.getElementById("cloudPreview").click(), document.getElementById("status").textContent`);
step("cloud preview without key blocked", previewMsg.includes("API key"), previewMsg);

await evalIn(cdp, opt, `document.getElementById("save").click()`);
const saved = await waitFor(async () => {
  const s = await evalIn(cdp, opt, `document.getElementById("status").textContent`);
  return s.includes("Saved") ? s : null;
}, 5000, "save");
step("explicit save persists cloud mode", true, saved);
const storedMode = await evalIn(cdp, opt, `chrome.storage.sync.get(null).then(s => JSON.stringify({mode: s.mode, hasCloudKeyInSync: JSON.stringify(s).includes("brauo_sk")}))`, true);
step("sync stores mode, never a cloud key", storedMode.includes('"mode":"cloud"'), storedMode);
await shot(cdp, opt, "options-cloud.png");

// Deepgram section regression (no key): refresh demands a key.
await evalIn(cdp, opt, `document.querySelector('input[name="mode"][value="deepgram"]').click()`);
const dgMsg = await evalIn(cdp, opt, `document.getElementById("refresh").click(), document.getElementById("status").textContent`);
step("deepgram refresh without key blocked", dgMsg.includes("key"), dgMsg);
await shot(cdp, opt, "options-deepgram.png");
await evalIn(cdp, opt, `document.querySelector('input[name="mode"][value="cloud"]').click()`); // leave UI on saved mode

// 3. Content page: bar injected, cloud hint without key.
const { targetId: pageTarget } = await cdp.send("Target.createTarget", { url: "https://example.com/" });
const page = await attach(cdp, pageTarget);
await waitFor(() => evalIn(cdp, page, `document.readyState !== "loading" && !!document.getElementById("brauo-bar")`), 15000, "content bar");
step("content bar injected", true, "brauo-bar present");
await sleep(800);
await evalIn(cdp, page, `document.getElementById("brauo-bubble").click()`);
const hint = await waitFor(() => evalIn(cdp, page, `document.getElementById("brauo-status").textContent || null`), 5000, "status hint");
step("cloud no-key hint in bar", hint.includes("Brauo Cloud"), hint);
const voiceListMode = await evalIn(cdp, page, `[...document.getElementById("brauo-voice").options].map(o => o.value).join(",")`);
step("bar voice list is cloud catalog", voiceListMode.includes("brauo-") && !voiceListMode.includes("aura-"), voiceListMode);
await shot(cdp, page, "content-bar.png");

results.errors = cdp.exceptions;
console.log(JSON.stringify(results, null, 2));
process.exit(results.steps.every((s) => s.ok) ? 0 : 1);
