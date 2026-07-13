import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Regenerates the store graphics and the extension icons from source:
// icons/icon.svg (the comilla mark) and store/promo-tile.html, plus live
// screenshots of the options page and the branded reading bar.

const PORT = 9391;
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const STORE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(STORE);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "brauo-assets-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

async function jget(route) {
  const res = await fetch(`http://127.0.0.1:${PORT}${route}`);
  if (!res.ok) throw new Error(`${route}: HTTP ${res.status}`);
  return res.json();
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error("WebSocket connection failed"));
  });
}
class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (!d.id || !this.pending.has(d.id)) return;
      const { resolve, reject } = this.pending.get(d.id);
      this.pending.delete(d.id);
      d.error ? reject(new Error(JSON.stringify(d.error))) : resolve(d.result);
    };
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}
async function evaluate(cdp, s, expression, awaitPromise = false) {
  const r = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise }, s);
  if (r.exceptionDetails) throw new Error(`evaluate: ${JSON.stringify(r.exceptionDetails).slice(0, 400)}`);
  return r.result.value;
}
async function attach(cdp, targetId) {
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Page.enable", {}, sessionId);
  return sessionId;
}
async function waitFor(fn, timeout, label) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const v = await fn().catch(() => false);
    if (v) return v;
    await sleep(250);
  }
  throw new Error(`timeout: ${label}`);
}
async function openPage(cdp, url, w, h) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const s = await attach(cdp, targetId);
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false }, s);
  await cdp.send("Page.navigate", { url }, s);
  await waitFor(() => evaluate(cdp, s, `document.readyState === "complete"`), 20000, url);
  return s;
}
function verify(file, w, h) {
  const png = fs.readFileSync(file);
  const aw = png.length >= 24 ? png.readUInt32BE(16) : 0;
  const ah = png.length >= 24 ? png.readUInt32BE(20) : 0;
  const ok = aw === w && ah === h;
  console.log(`${ok ? "PASS" : "FAIL"} ${path.relative(ROOT, file)}: ${aw}x${ah}`);
  results.push(ok);
}
function writeDataUrl(file, dataUrl, w, h) {
  fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  verify(file, w, h);
}
async function screenshot(cdp, s, file, w, h) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false }, s);
  fs.writeFileSync(file, Buffer.from(data, "base64"));
  verify(file, w, h);
}

const chrome = spawn(CHROME, [
  "--headless=new", "--enable-unsafe-extension-debugging",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "about:blank",
], { stdio: "ignore" });

try {
  const version = await waitFor(() => jget("/json/version"), 20000, "Chrome startup");
  const cdp = new CDP(await connect(version.webSocketDebuggerUrl));

  // 1) Rasterize icons/icon.svg (the comilla mark) to the four PNG sizes.
  const svg = fs.readFileSync(path.join(ROOT, "icons", "icon.svg")).toString("base64");
  const blank = await openPage(cdp, "about:blank", 200, 200);
  for (const size of [16, 32, 48, 128]) {
    const dataUrl = await evaluate(cdp, blank, `(async () => {
      const img = new Image();
      img.src = "data:image/svg+xml;base64,${svg}";
      await img.decode();
      const c = document.createElement("canvas");
      c.width = c.height = ${size};
      const ctx = c.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, ${size}, ${size});
      return c.toDataURL("image/png");
    })()`, true);
    writeDataUrl(path.join(ROOT, "icons", `icon${size}.png`), dataUrl, size, size);
  }

  // 2) Promo tile (loads icon128.png through its relative path).
  const promo = await openPage(cdp, pathToFileURL(path.join(STORE, "promo-tile.html")).href, 440, 280);
  await waitFor(() => evaluate(cdp, promo, `document.fonts.ready.then(() => [...document.images].every(i => i.complete && i.naturalWidth > 0))`, true), 8000, "promo assets");
  await screenshot(cdp, promo, path.join(STORE, "promo-440x280.png"), 440, 280);

  // 3) Options page (brand theme) from the loaded extension.
  const extensionPath = ROOT.replaceAll("\\", "/");
  const { id: extensionId } = await cdp.send("Extensions.loadUnpacked", { path: extensionPath });
  const options = await openPage(cdp, `chrome-extension://${extensionId}/options.html`, 1280, 800);
  await waitFor(() => evaluate(cdp, options, `!!document.getElementById("cloudSection")`), 10000, "options UI");
  await sleep(300);
  await screenshot(cdp, options, path.join(STORE, "screenshot-options-1280x800.png"), 1280, 800);

  // 4) Reading screenshot: the reader activates from the toolbar (activeTab) and
  // does not auto-inject, so for the still image we inject the reading-state bar
  // markup styled by content.css directly into a page.
  const css = fs.readFileSync(path.join(ROOT, "content.css")).toString("utf8");
  const reading = await openPage(cdp, "https://en.wikipedia.org/wiki/Speech_synthesis", 1280, 800);
  await evaluate(cdp, reading, `(() => {
    const CSS = ${JSON.stringify(css)};
    document.querySelectorAll("#siteNotice, #centralNotice, .frb, [id^='frb-'], .fundraising-banner").forEach((e) => e.remove());
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    const bar = document.createElement("div");
    bar.id = "brauo-bar";
    bar.innerHTML = '<div id="brauo-controls" style="display:flex">'
      + '<button id="brauo-play">\\u23F8</button>'
      + '<button id="brauo-stop">\\u23F9</button>'
      + '<select id="brauo-voice"><option>Luna</option></select>'
      + '<select id="brauo-speed"><option>1\\u00D7</option></select>'
      + '<span id="brauo-status">Reading 3 / 42</span>'
      + '<button id="brauo-gear">\\u2699</button>'
      + '<button id="brauo-close">\\u2715</button>'
      + '</div>';
    document.documentElement.appendChild(bar);
    const p = [...document.querySelectorAll("#mw-content-text p")].find((e) => e.textContent.trim().length > 200);
    if (!p) throw new Error("No long content paragraph found");
    p.classList.add("brauo-current");
    p.scrollIntoView({ block: "center", behavior: "instant" });
  })()`);
  await sleep(300);
  await screenshot(cdp, reading, path.join(STORE, "screenshot-reading-1280x800.png"), 1280, 800);

  cdp.ws.close();
  if (results.some((ok) => !ok)) process.exitCode = 1;
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  chrome.kill();
  await Promise.race([new Promise((r) => chrome.once("exit", r)), sleep(3000)]);
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
