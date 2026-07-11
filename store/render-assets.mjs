import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PORT = 9377;
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const STORE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(STORE);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "brauo-assets-"));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];

async function jget(route) {
  const response = await fetch(`http://127.0.0.1:${PORT}${route}`);
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  return response.json();
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
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (!data.id || !this.pending.has(data.id)) return;
      const { resolve, reject } = this.pending.get(data.id);
      this.pending.delete(data.id);
      data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result);
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

async function evaluate(cdp, sessionId, expression, awaitPromise = false) {
  const response = await cdp.send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise
  }, sessionId);
  if (response.exceptionDetails) {
    throw new Error(`evaluate: ${JSON.stringify(response.exceptionDetails).slice(0, 400)}`);
  }
  return response.result.value;
}

async function attach(cdp, targetId) {
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Page.enable", {}, sessionId);
  return sessionId;
}

async function waitFor(fn, timeout, label) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const value = await fn().catch(() => false);
    if (value) return value;
    await sleep(250);
  }
  throw new Error(`timeout: ${label}`);
}

async function openPage(cdp, url, width, height) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const sessionId = await attach(cdp, targetId);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: false
  }, sessionId);
  await cdp.send("Page.navigate", { url }, sessionId);
  await waitFor(
    () => evaluate(cdp, sessionId, `document.readyState === "complete"`),
    20000,
    url
  );
  return sessionId;
}

function verify(file, width, height) {
  const png = fs.readFileSync(file);
  const actualWidth = png.length >= 24 ? png.readUInt32BE(16) : 0;
  const actualHeight = png.length >= 24 ? png.readUInt32BE(20) : 0;
  const ok = actualWidth === width && actualHeight === height;
  console.log(`${ok ? "PASS" : "FAIL"} ${path.relative(ROOT, file)}: ${actualWidth}x${actualHeight}`);
  results.push(ok);
}

function writeDataUrl(file, dataUrl, width, height) {
  fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  verify(file, width, height);
}

async function screenshot(cdp, sessionId, file, width, height) {
  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "png", fromSurface: true, captureBeyondViewport: false
  }, sessionId);
  fs.writeFileSync(file, Buffer.from(data, "base64"));
  verify(file, width, height);
}

const chrome = spawn(CHROME, [
  "--headless=new",
  "--enable-unsafe-extension-debugging",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "about:blank"
], { stdio: "ignore" });

try {
  const version = await waitFor(() => jget("/json/version"), 20000, "Chrome startup");
  const cdp = new CDP(await connect(version.webSocketDebuggerUrl));

  const blank = await openPage(cdp, "about:blank", 32, 32);
  const icon = fs.readFileSync(path.join(ROOT, "icons", "icon128.png")).toString("base64");
  const iconData = await evaluate(cdp, blank, `(async () => {
    const image = new Image();
    image.src = "data:image/png;base64,${icon}";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, 32, 32);
    return canvas.toDataURL("image/png");
  })()`, true);
  writeDataUrl(path.join(ROOT, "icons", "icon32.png"), iconData, 32, 32);

  const promo = await openPage(cdp, pathToFileURL(path.join(STORE, "promo-tile.html")).href, 440, 280);
  await waitFor(() => evaluate(cdp, promo, `document.fonts.ready.then(() => [...document.images].every(i => i.complete))`, true), 5000, "promo assets");
  await screenshot(cdp, promo, path.join(STORE, "promo-440x280.png"), 440, 280);

  const extensionPath = ROOT.replaceAll("\\", "/");
  const { id: extensionId } = await cdp.send("Extensions.loadUnpacked", { path: extensionPath });
  const options = await openPage(cdp, `chrome-extension://${extensionId}/options.html`, 1280, 800);
  await waitFor(() => evaluate(cdp, options, `!!document.querySelector('input[name="mode"][value="cloud"]')`), 10000, "options UI");
  await evaluate(cdp, options, `document.querySelector('input[name="mode"][value="cloud"]').click()`);
  await waitFor(() => evaluate(cdp, options, `!document.getElementById("cloudSection").hidden`), 5000, "cloud section");
  await sleep(300);
  await screenshot(cdp, options, path.join(STORE, "screenshot-options-1280x800.png"), 1280, 800);

  await evaluate(cdp, options, `document.getElementById("save").click()`);
  await waitFor(() => evaluate(cdp, options, `document.getElementById("status").textContent.includes("Saved")`), 5000, "options save");

  const reading = await openPage(cdp, "https://en.wikipedia.org/wiki/Speech_synthesis", 1280, 800);
  await waitFor(() => evaluate(cdp, reading, `!!document.getElementById("brauo-bar")`), 20000, "Brauo bar");
  await evaluate(cdp, reading, `document.getElementById("brauo-bubble").click()`);
  await sleep(300);
  await evaluate(cdp, reading, `(() => {
    document.querySelectorAll("#siteNotice, #centralNotice, .frb, [id^='frb-'], .fundraising-banner")
      .forEach((element) => element.remove());
    const paragraph = [...document.querySelectorAll("#mw-content-text p")]
      .find((element) => element.textContent.trim().length > 200);
    if (!paragraph) throw new Error("No long content paragraph found");
    document.querySelectorAll(".brauo-current").forEach((element) => element.classList.remove("brauo-current"));
    paragraph.classList.add("brauo-current");
    paragraph.scrollIntoView({ block: "center", behavior: "instant" });
    document.getElementById("brauo-status").textContent = "Reading 3 / 42";
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
  await Promise.race([
    new Promise((resolve) => chrome.once("exit", resolve)),
    sleep(3000)
  ]);
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
