// js/guma-clipboard.js
// Shared "copy the canvas as a PNG" path for every generator and report.
"use strict";

/**
 * The async Clipboard API is only exposed in a secure context: HTTPS,
 * localhost or 127.0.0.1. A self-hosted build served over plain HTTP (e.g.
 * http://guma.home) gets `navigator.clipboard === undefined`, so every copy
 * button used to blow up with a raw TypeError. This module feature-detects
 * up front and reports the real reason instead.
 */
window.GumaClipboard = (function () {
  const INSECURE_MSG =
    "Copying to the clipboard only works over HTTPS (or on localhost). " +
    "This page is served over plain HTTP - use Download instead.";
  const UNSUPPORTED_MSG = "This browser cannot copy images to the clipboard. Use Download instead.";
  const RENDER_MSG = "Could not render the image for copying.";

  /**
   * Why copying is impossible right now.
   * @returns {string|null} a user-facing reason, or null when copying is available
   */
  function unavailableReason() {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard || !navigator.clipboard.write) {
      return window.isSecureContext === false ? INSECURE_MSG : UNSUPPORTED_MSG;
    }
    return null;
  }

  /** @returns {boolean} true when image copying is supported in this context */
  function isAvailable() {
    return unavailableReason() === null;
  }

  /**
   * Copies a canvas to the clipboard as a PNG, alerting on any failure.
   * @param {HTMLCanvasElement} canvas
   * @returns {Promise<boolean>} true only when the image reached the clipboard
   */
  async function copyCanvas(canvas) {
    const reason = unavailableReason();
    if (reason) {
      alert(reason);
      return false;
    }

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) {
      alert(RENDER_MSG);
      return false;
    }

    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return true;
    } catch (err) {
      alert("Could not copy to clipboard: " + err);
      return false;
    }
  }

  // Buttons currently showing a flash, with the markup to put back. Reading
  // innerHTML on every call would capture the flash label itself, so a second
  // click inside the window used to restore "Copied!" as the button's
  // permanent text - icon and all gone.
  const flashing = new WeakMap();

  /**
   * Temporary "Copied!" state on the button that triggered the copy.
   * Safe to call again while a previous flash is still showing.
   * @param {HTMLElement|null} btn
   * @param {string} [label]
   * @param {number} [ms]
   */
  function flash(btn, label = "Copied!", ms = 2000) {
    if (!btn) return;
    let state = flashing.get(btn);
    if (state) {
      clearTimeout(state.timer);
    } else {
      state = { html: btn.innerHTML, timer: null };
      flashing.set(btn, state);
    }
    btn.textContent = label;
    state.timer = setTimeout(() => {
      btn.innerHTML = state.html;
      flashing.delete(btn);
    }, ms);
  }

  return { isAvailable, unavailableReason, copyCanvas, flash };
})();
