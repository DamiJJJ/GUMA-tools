"use strict";

// ── Clearable radio groups for the report forms ──────────────────────────────
// A native radio cannot be unchecked by clicking it again, but a paper form's
// "pick one" boxes can always be left blank. makeClearable() remembers the
// state at pointerdown on the label, and if the click lands on an already
// selected radio, clears it and fires change so the preview redraws.
//
// Idempotent per input, so it can be re-run on a freshly appended row.
// Classic global script, no ES modules.

(function () {
  function makeClearable(root) {
    root.querySelectorAll('input[type="radio"]').forEach((input) => {
      if (input.dataset.gumaClearable) return;
      input.dataset.gumaClearable = "1";
      const label = input.closest("label");
      (label || input).addEventListener("pointerdown", () => {
        input.dataset.was = input.checked ? "1" : "";
      });
      input.addEventListener("click", () => {
        if (input.dataset.was === "1") {
          input.checked = false;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        input.dataset.was = "";
      });
    });
  }

  window.GumaRadio = { makeClearable };
})();
