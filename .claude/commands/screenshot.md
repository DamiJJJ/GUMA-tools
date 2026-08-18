---
description: Render a generator with demo data and update its showcase PNG in assets/screenshots/.
---

Goal: produce (or refresh) the showcase image for a generator — the rendered
canvas output filled with realistic demo data — and save it to
`assets/screenshots/<page>.png`. This is the `assets/screenshots/` rule from
`CLAUDE.md`, automated.

`$ARGUMENTS` = the target page (basename or file), e.g. `prehospital_care_report`
or `officer_generator.html`.

Steps:

1. **Resolve the target page.**
   - If `$ARGUMENTS` is given, map it to the matching `*.html` at repo root.
   - If empty, infer it from the working tree: the most recently changed
     `*_generator.html` / `*_report.html` in `git status` / `git diff`. If it's
     still ambiguous, ask which page.

2. **Inspect the page.** Read the `.html` and its paired `js/` file to find:
   - the **canvas id** (usually `docCanvas`; card generators may differ — grep
     for `<canvas` / `getElementById(...Canvas...)`),
   - the **form field ids** (inputs, selects, checkboxes) and any faction
     switcher, so you can author demo data.

3. **Author realistic demo data.** Write a `FILL` snippet (plain JS statements)
   that sets representative, believable values — real-looking names, dates,
   times, plausible checkbox selections — **not** "lorem ipsum" and **not**
   all-empty. Cover the visually meaningful fields so the showcase looks
   complete. Set `<input>`/`<select>` `.value`, toggle `.checked`, and for
   dynamic-row generators add a couple of rows first. End the snippet with the
   page's redraw call if you know it (e.g. `refreshPreview()`), though the
   capture script also triggers common redraws.
   - **Use American / Los Santos (GTA) data, never Polish.** The app is set in
     the LA/LAPD/Los Santos universe: American person names (e.g. "Michael R.
     Callahan"), LA/Los Santos street & area names (Vespucci Blvd, Vinewood,
     Del Perro, Mission Row), US date/number formats, and the project's own
     agencies (LSPD/LSSD/BCSO/SAHP/LSFD/LSCoFD). No Polish names, streets, or
     phrasing.

4. **Run the capture.** Write the script below to the scratchpad as
   `shot-capture.js` and your demo data to `fill.js`, then run it. It starts a
   local static server (canvas export needs http, not `file://`), launches
   headless Chrome, fills the page, and writes the canvas PNG. Default output
   is `assets/screenshots/<page>.png`.

   ```bash
   SITE_ROOT="$(pwd)" PAGE="<page>.html" CANVAS_ID="docCanvas" \
     FILL_FILE="<scratchpad>/fill.js" node "<scratchpad>/shot-capture.js"
   ```

5. **Verify.** Read the produced PNG (view it) — confirm the demo data rendered,
   nothing is clipped, and it resembles the current output. If the capture
   reports JS errors or `NO_CANVAS`, fix the `CANVAS_ID` / `FILL` and re-run.

6. Report the saved path. **Don't commit or push.**

### Capture script (`shot-capture.js`)

Self-contained: static server + headless Chrome over CDP (Node's global
`WebSocket`/`fetch`, no npm deps). Config via env: `SITE_ROOT`, `PAGE`,
`CANVAS_ID`, `OUT` (optional; defaults to `assets/screenshots/<page>.png`),
`FILL_FILE` (JS run in-page before capture), `CHROME_BIN` (optional override).

```js
"use strict";
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const { spawn } = require("child_process");

const SITE_ROOT = process.env.SITE_ROOT || process.cwd();
const PAGE = process.env.PAGE;
const CANVAS_ID = process.env.CANVAS_ID || "docCanvas";
const OUT = process.env.OUT || path.join(SITE_ROOT, "assets/screenshots", PAGE.replace(/\.html$/, ".png"));
const FILL = process.env.FILL_FILE ? fs.readFileSync(process.env.FILL_FILE, "utf8") : "";
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

function findChrome() {
  return [process.env.CHROME_BIN,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ].filter(Boolean).find((p) => { try { fs.accessSync(p); return true; } catch { return false; } });
}
function freePort() {
  return new Promise((res, rej) => { const s = net.createServer();
    s.on("error", rej); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
}

(async () => {
  if (!PAGE) { console.error("Set PAGE=<page>.html"); process.exit(1); }
  const chrome = findChrome();
  if (!chrome) { console.error("No Chrome/Chromium found. Set CHROME_BIN."); process.exit(1); }
  const httpPort = await freePort();
  const dbgPort = await freePort();

  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    fs.readFile(path.join(SITE_ROOT, p), (err, data) => {
      if (err) { res.writeHead(404); res.end("404"); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(httpPort, r));

  const udd = fs.mkdtempSync(path.join(os.tmpdir(), "guma-shot-"));
  const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run",
    "--no-default-browser-check", `--remote-debugging-port=${dbgPort}`,
    `--user-data-dir=${udd}`, "about:blank"], { stdio: "ignore" });

  const DBG = `http://127.0.0.1:${dbgPort}`;
  let ver = null;
  for (let i = 0; i < 60; i++) { try { ver = await fetch(`${DBG}/json/version`); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  if (!ver) { console.error("Chrome devtools did not come up"); proc.kill(); server.close(); process.exit(1); }

  const nt = await fetch(`${DBG}/json/new?about:blank`, { method: "PUT" }).then((r) => r.json());
  const ws = new WebSocket(nt.webSocketDebuggerUrl);
  let id = 0; const pend = new Map(); const errors = [];
  const send = (m, p = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.error ? { __e: m.error } : m.result); pend.delete(m.id); return; }
    if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "exception");
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/${PAGE}` });
  await new Promise((r) => setTimeout(r, 3500)); // let page scripts load + first render

  const expr = "(() => {\n" + FILL + "\n" +
    "try { ['refreshPreview','drawForm','updatePreview','generateCard','render','redraw','draw'].forEach(function(fn){ try { if (typeof window[fn]==='function') window[fn](); } catch(e){} }); } catch(e){}\n" +
    "const c = document.getElementById(" + JSON.stringify(CANVAS_ID) + ");\n" +
    "if (!c) return 'NO_CANVAS';\n" +
    "return c.toDataURL('image/png');\n})()";
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  const val = r && r.result && r.result.value;

  if (!val || val === "NO_CANVAS" || typeof val !== "string" || !val.startsWith("data:image/png")) {
    console.error("Capture failed:", val, "| errors:", errors.length ? errors : "none");
    ws.close(); proc.kill(); server.close(); process.exit(1);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(val.split(",")[1], "base64"));
  console.log("Saved " + OUT + (errors.length ? " (page warnings: " + errors.join("; ") + ")" : ""));
  ws.close(); proc.kill(); server.close();
  try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
  process.exit(0);
})().catch((e) => { console.error("FAIL", e); process.exit(1); });
```

Notes:

- Use realistic sample data — this image is shown in the README / Discord /
  site. No empty forms, no placeholder gibberish. Data must be **American /
  Los Santos (GTA)** — never Polish (see step 3).
- File name mirrors the page: `officer_generator.html` →
  `assets/screenshots/officer_generator.png`. Keep it stable across reruns so
  the showcase link doesn't change.
- A local **http** server is required (not `file://`): card generators draw
  faction badges/photos onto the canvas, and `file://` would taint it and make
  `toDataURL` throw.
- The Tailwind-CDN console warning is harmless; real page errors are surfaced
  by the script — fix those before trusting the output.
