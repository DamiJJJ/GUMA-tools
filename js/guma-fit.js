"use strict";

// ── Fit-to-cell text helpers for the report generators ───────────────────────
// A report is a document of record: an ellipsis silently drops information
// somebody typed, so no printed value may end in one. Two mechanisms together
// guarantee that, and neither is sufficient alone:
//
//   1. The value shrinks (fitFont) and, where the cell has room for more than
//      one line, wraps (fitBlock / wrapLines) down to a floor.
//   2. Every text input is capped (applyCaps) at what its column can carry, so
//      the floor is never actually reached.
//
// The cap TABLES stay per page - they encode one document's column widths and
// mean nothing on another. Only the lookup and the applier are shared.
//
// Classic global script, no ES modules: everything hangs off window.GumaFit so
// nothing collides with a page script's top-level scope.

(function () {
  /** Default font builder: plain Arial at the size being tried. */
  const arial = (px) => px + "px Arial";

  /**
   * Largest size from basePx down to minPx (0.5px steps) at which text fits
   * maxW on one line. These columns are narrow by design and half a point of
   * font size is usually the whole difference. Leaves ctx.font set to the size
   * it returns, so the caller paints exactly what was measured.
   *
   * @param {(px: number) => string} [font] builds the font string for a size;
   *   pass one for bold or a non-Arial family.
   */
  function fitFont(ctx, text, maxW, basePx, minPx, font) {
    const mk = font || arial;
    let px = basePx;
    ctx.font = mk(px);
    while (px > minPx && ctx.measureText(text).width > maxW) {
      px = Math.max(minPx, px - 0.5);
      ctx.font = mk(px);
    }
    return px;
  }

  /**
   * Greedy word wrap into at most maxLines lines, hard-breaking a word too long
   * to stand on its own line. Measures with the current ctx.font. Returns the
   * lines it produced; more than maxLines means the text does not fit at this
   * size.
   */
  function wrapLines(ctx, text, maxW, maxLines) {
    const out = [];
    let line = "";
    const push = () => {
      if (line) out.push(line);
      line = "";
    };
    String(text)
      .split(/\s+/)
      .forEach((word) => {
        let w = word;
        // A single word wider than the cell is broken by character rather than
        // pushed out of the box.
        while (ctx.measureText(w).width > maxW) {
          let cut = w.length - 1;
          while (cut > 1 && ctx.measureText(w.slice(0, cut)).width > maxW) cut--;
          const head = w.slice(0, cut);
          if (line) push();
          out.push(head);
          w = w.slice(cut);
          if (out.length > maxLines) return;
        }
        const test = line ? line + " " + w : w;
        if (line && ctx.measureText(test).width > maxW) {
          push();
          line = w;
        } else {
          line = test;
        }
      });
    push();
    return out.length ? out : [""];
  }

  /**
   * Largest size from basePx down to minPx at which text fits the cell in at
   * most `lines` lines. Returns { px, lines }, so the caller paints exactly what
   * was measured.
   */
  function fitBlock(ctx, text, maxW, lines, basePx, minPx, font) {
    const mk = font || arial;
    let px = basePx;
    for (;;) {
      ctx.font = mk(px);
      const wrapped = wrapLines(ctx, text, maxW, lines);
      if (wrapped.length <= lines || px <= minPx) return { px, lines: wrapped.slice(0, lines) };
      px = Math.max(minPx, px - 0.5);
    }
  }

  /**
   * One font size per column, measured across every row in the table. Per cell,
   * two adjacent rows would print the same column at different sizes, which
   * reads as a rendering bug rather than as a fitted table.
   *
   * @param {Array<Array<string>>} rows  row-major cell values
   * @param {number[]} widths            available width per column
   * @returns {number[]} the size to paint each column at
   */
  function colFonts(ctx, rows, widths, basePx, minPx, font) {
    return widths.map((w, i) =>
      rows.reduce(
        // basePx starts at the size the column has survived so far: fitFont can
        // only ever shrink, so there is no point re-trying from the top.
        (px, r) => Math.min(px, fitFont(ctx, r[i] == null ? "" : String(r[i]), w, px, minPx, font)),
        basePx,
      ),
    );
  }

  // `maxLength` is INERT on these input types - the browser accepts any length
  // and silently ignores the attribute. `min`/`max` on a number input are only
  // checked at form validation, which these pages never run, so nothing stops
  // someone typing a six-digit age. They get a live clamp instead, so a cap
  // means the same thing on every input a document prints.
  const NO_MAXLENGTH = new Set(["number", "range", "color"]);

  /**
   * A cap may only ever tighten. The tables encode what a COLUMN can print,
   * while the markup may carry a stricter semantic limit on the same field (a
   * DL state is 2 characters, a DL class 3). Overwriting maxLength with the
   * column figure would quietly widen those. Idempotent, so re-running
   * applyCaps on a rebuilt row is a no-op.
   */
  function tighten(el, n) {
    el.maxLength = el.maxLength > 0 ? Math.min(el.maxLength, n) : n;
  }

  /** Clamp an input whose type ignores maxLength. Idempotent. */
  function clampLength(el, n) {
    if (el.dataset.gumaCap === String(n)) return; // applyCaps re-runs on rebuilt rows
    el.dataset.gumaCap = String(n);
    el.addEventListener("input", () => {
      if (el.value.length > n) el.value = el.value.slice(0, n);
    });
  }

  /**
   * Cap inputs addressed by CSS selector rather than by id. The card generators
   * and the personnel file collect their row fields by class inside a `.pf-row`
   * / `.employment-row` container, so there is no id to key on.
   *
   * @param {Object<string, number>} map selector -> character limit
   */
  function applyCapsBySelector(root, map) {
    Object.keys(map).forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => {
        if (el.tagName === "INPUT" && NO_MAXLENGTH.has(el.type)) clampLength(el, map[sel]);
        else tighten(el, map[sel]);
      });
    });
  }

  /**
   * Cap for an input id against a table keyed by exact page-level id or by
   * row-field suffix (the longest matching suffix wins, so `phone_r` beats `r`).
   *
   * `variants` lets one suffix mean different things in different row families -
   * a firearm civilian `name` is one line under a label while an officer `name`
   * wraps over two. The first variant whose prefix the id carries wins.
   *
   * @param {Array<{prefix: string, table: Object}>} [variants]
   * @returns {number|null} null when the id has no cap at all.
   */
  function capFor(id, table, variants) {
    if (!id) return null;
    if (table[id] != null) return table[id];
    let best = null;
    Object.keys(table).forEach((k) => {
      if (id.endsWith("_" + k) && (best === null || k.length > best.length)) best = k;
    });
    if (best === null) return null;
    const v = (variants || []).find((vv) => id.startsWith(vv.prefix));
    return v && v.table[best] != null ? v.table[best] : table[best];
  }

  /**
   * Apply the caps to every text input under a root - the page at init, or a
   * freshly appended dynamic row. canvas-edit.js copies maxLength onto its
   * editor, so typing over the document obeys the same limit as the form.
   */
  function applyCaps(root, table, variants) {
    root.querySelectorAll("input").forEach((el) => {
      if (el.type !== "text" && !NO_MAXLENGTH.has(el.type)) return;
      const cap = capFor(el.id, table, variants);
      if (cap == null) return;
      if (NO_MAXLENGTH.has(el.type)) clampLength(el, cap);
      else tighten(el, cap);
    });
  }

  window.GumaFit = { fitFont, fitBlock, wrapLines, colFonts, capFor, applyCaps, applyCapsBySelector };
})();
