---
description: Re-generate or update STYLEGUIDE.md based on current code.
---

Goal: keep `STYLEGUIDE.md` honest. Either build it from scratch or update
it to reflect new conventions introduced since the last write.

Steps:

1. Ask the user: full regenerate or incremental update?
2. Scan:
   - `index.html` + all `*_generator.html` / `*_report.html` for HTML conventions.
   - `js/tailwind-config.js` for design tokens.
   - `js/guma-styles.js` for `@layer` rules and `guma-*` component classes.
   - `js/components.js` for Web Component patterns.
   - 2–3 page-specific JS files for JS conventions (indent, quotes, function
     naming, comment dividers).
3. Update / produce sections: Tech Stack, File Layout, HTML conventions,
   Tailwind & design tokens, CSS layer rules, JS conventions, Naming,
   Comments, Theming (light/dark), Adding a new generator (checklist),
   Things to avoid.
4. Where conventions disagree between files, **surface the conflict** instead
   of silently picking one. Ask which way to go.
5. Output as a patch (or full file content if regenerating).
   **Don't write to `STYLEGUIDE.md` directly.**
