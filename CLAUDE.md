# CLAUDE.md — GUMA-Tools

> Instructions for Claude (Cowork / Claude Code) when working in this project.
> Read this file before touching anything in the repo.

## Project context

GUMA-Tools is a static webapp for generating documents and cards for FiveM
roleplay (LSPD/LSSD/BCSO/SAHP/LSCoFD/LSFD, etc.). Zero build tooling —
HTML + Tailwind (CDN) + Vanilla JS. Cards/documents are rendered on an
HTML Canvas and exported to PNG or the clipboard. Hosting: GitHub Pages.

## Hard constraints — do not break

- **Tailwind CSS only.** No static `.css` files, no `<style>` blocks in HTML.
  All custom styling goes through `@layer base/components/utilities` rules
  injected at runtime by `js/guma-styles.js`.
- **Vanilla JS only.** No bundlers, no npm runtime deps, no ES module
  `import` / `export`. Every script is a global `<script src="js/...">`.
- **No new CDN scripts** without asking. Tailwind is already vendored at
  `js/tailwind.js`.
- **Static hosting.** Every page must work on GitHub Pages without a server.
- **Two themes.** Dark (default) + light, switched via `html.dark` class.
  Design tokens: `guma-*` for dark, `guma-l-*` for light. Every new visual
  must be verified in **both** modes.

## Working rules

### Repo discipline

- **Do not commit or push anything on your own.** Commits and pushes are done
  by the user (or when they explicitly ask for them).
- **Make changes to repo files yourself** (Edit/Write), and when you finish
  **briefly describe what you changed and where** — file by file, without
  pasting full diffs.
- Files created outside the repo (exports, screenshots, generated preview
  assets) may be saved to the workspace / outputs.

### Code quality

- **DRY.** If a piece of logic or markup is used more than once — extract it.
  Shared JS → a separate file in `/js/`. Shared markup (header, footer,
  modals) → a Web Component in `js/components.js`. Shared styles → a `guma-*`
  class in `js/guma-styles.js` (`@layer components`).
- **English comments only.** Inline comments and JSDoc in English. Section
  separators in the existing style:
  `// ── Section title ───────────────────────────────────────────`.
- **Match existing conventions.** See `STYLEGUIDE.md` — naming, formatting,
  Tailwind. If you introduce a convention not covered by the styleguide, ask
  first and update the styleguide.
- **Ask, don't assume.** If a requirement is unclear, the input is
  incomplete, or you see two reasonable paths — **stop and ask**
  (AskUserQuestion in Cowork, or a plain question in chat). Better to ask
  once than to rewrite.

### Frontend specifics

- Each generator/report = its own HTML file at root + its own JS file in
  `/js/`. Naming pair example: `firearm_discharge.html` ↔
  `js/firearm_discharge_investigation.js`.
- Required `<head>` script order on every page:
  1. `js/theme-init.js` (anti-FOUC, sets `html.dark` before paint)
  2. `js/tailwind.js`
  3. `js/tailwind-config.js`
  4. `js/guma-styles.js`
- Page body uses one of the accent classes when needed: `theme-navy`
  (default), `theme-navy-soft`, `theme-red`.
- Header + footer come from Web Components: `<guma-header></guma-header>`,
  `<guma-footer></guma-footer>`. Do not paste raw navigation markup.
- Reuse form primitives: `guma-input`, `guma-label`, `guma-form-section`,
  `guma-page`, `guma-panel`. Don't reinvent.

### Showcase screenshots

- **After every new feature** (a new generator / report, or a significant
  change to the output's appearance) generate a sample file with **filled-in
  demo data** and save it to `assets/screenshots/`. Used for showcasing the
  app (README, Discord, website).
- File name = the generator page name, with a `.png` extension (e.g.
  `prehospital_care_report.html` → `assets/screenshots/prehospital_care_report.png`).
- The file is the rendered output (canvas → PNG), not a screenshot of the
  whole page. Use realistic, consistent sample data (no "lorem ipsum", no
  empty fields).
- **Sample data must be American / Los Santos (GTA), never Polish.** The app
  is set in the LA/LAPD/Los Santos universe — use American person names,
  LA/Los Santos street & area names (Vespucci Blvd, Vinewood, Del Perro,
  Mission Row), US date/number formats, and the project's own agencies
  (LSPD/LSSD/BCSO/SAHP/LSFD/LSCoFD).

## Slash commands

Helpers live in `.claude/commands/` and are **native slash commands in Claude
Code (terminal CLI)**. In Cowork desktop they are not scanned automatically —
see below for how to run them here.

| Command       | What it does                                                                              |
| ------------- | ----------------------------------------------------------------------------------------- |
| `/commit`     | Generates a commit message in the repo style (Conventional-ish: `Feature:`, `Fix:`, `Refactor:`). |
| `/readme`     | Reviews `readme.md`, proposes minimal patches for new / changed features.                 |
| `/changelog`  | Produces a user-friendly changelog + a short announcement post for Discord.               |
| `/styleguide` | Regenerates or updates `STYLEGUIDE.md` from the current code.                              |
| `/screenshot` | Renders a generator with demo data and updates its showcase PNG in `assets/screenshots/`. |

### Cowork vs Claude Code — how to invoke

**Claude Code (terminal):** commands work natively. In the project folder you
run `claude`, type `/commit` (or `/readme`, etc.) and the procedure from the
matching file in `.claude/commands/` is executed.

**Cowork desktop (this chat):** Cowork **does not load** `.claude/commands/`
automatically. The user invokes a command by writing e.g. _"run `/commit`"_
or _"execute the procedure from `.claude/commands/changelog.md`"_. Then Claude
**must**:

1. Read the matching file from `.claude/commands/<name>.md` via `Read`.
2. Follow the instructions in that file as if they were the prompt of a
   slash command in Claude Code.
3. Stick to the "no commits/pushes on your own" rule regardless of what the
   command file itself says (e.g. `/commit` only generates the commit message
   text, never runs `git commit`).

**Default rule:** do not run commands automatically, in Cowork or in Claude
Code. Wait until the user types the command.

## When in doubt

1. Look in `STYLEGUIDE.md`.
2. Look at the nearest existing file doing something similar (new generator
   → model it on `officer_generator.html` + `js/app.js`; new report →
   `firearm_discharge.html` + `js/firearm_discharge_investigation.js`).
3. **Ask.**
