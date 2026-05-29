# CLAUDE.md — GUMA-Tools

> Instrukcje dla Claude (Cowork / Claude Code) przy pracy w tym projekcie.
> Read this file before touching anything in the repo.

## Project context (PL)

GUMA-Tools to statyczna webapp do generowania dokumentów i kart dla FiveM
roleplay (LSPD/LSSD/BCSO/SAHP/LSCoFD/LSFD itp.). Zero build-toolingu —
HTML + Tailwind (CDN) + Vanilla JS. Renderowanie kart/dokumentów odbywa się
na HTML Canvas, export do PNG lub clipboard. Hosting: GitHub Pages.

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

### Repo discipline (PL)

- **Nie commituj i nie pushuj nic samodzielnie.** Wszystkie zmiany w plikach
  repo oddajesz jako patche / bloki kodu do skopiowania. Nigdy nie modyfikuj
  plików w repo bez wyraźnej zgody użytkownika.
- Jeśli zmiana obejmuje kilka plików — pokaż **wszystkie** patche w jednej
  odpowiedzi, w kolejności w jakiej należy je nanieść.
- Pliki tworzone na zewnątrz repo (eksporty, screenshoty, generowane assety
  do podglądu) możesz zapisywać do workspace / outputs.

### Code quality

- **DRY.** Jeśli kawałek logiki lub markupu jest użyty więcej niż raz —
  wyciągnij go. Wspólny JS → osobny plik w `/js/`. Wspólny markup
  (header, footer, modale) → Web Component w `js/components.js`. Wspólne
  style → klasa `guma-*` w `js/guma-styles.js` (`@layer components`).
- **English comments only.** Komentarze inline i JSDoc po angielsku.
  Separatory sekcji w stylu istniejącym:
  `// ── Section title ───────────────────────────────────────────`.
- **Match existing conventions.** Patrz `STYLEGUIDE.md` — naming, formatting,
  Tailwind. Jeśli wprowadzasz konwencję nieobjętą styleguidem, najpierw
  zapytaj i zaktualizuj styleguide.
- **Ask, don't assume.** Jeśli wymaganie jest niejasne, dane wejściowe
  niepełne, albo widzisz dwie sensowne ścieżki — **zatrzymaj się i zapytaj**
  (AskUserQuestion w Cowork, albo zwykłe pytanie w czacie). Lepiej zapytać
  raz niż przepisywać.

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
  `<guma-footer></guma-footer>`. Nie wklejaj surowego markupu nawigacji.
- Reuse form primitives: `guma-input`, `guma-label`, `guma-form-section`,
  `guma-page`, `guma-panel`. Don't reinvent.

## Slash commands

Helpery żyją w `.claude/commands/` i są **natywnymi slash commands w Claude
Code (terminal CLI)**. W Cowork desktop nie są skanowane automatycznie —
patrz niżej, jak je odpalać tutaj.

| Command       | What it does                                                                              |
| ------------- | ----------------------------------------------------------------------------------------- |
| `/commit`     | Generuje commit message w stylu repo (Conventional-ish: `Feature:`, `Fix:`, `Refactor:`). |
| `/readme`     | Przegląda `readme.md`, proponuje minimalne patche pod nowe / zmienione funkcje.           |
| `/changelog`  | Robi user-friendly changelog + krótki ogłoszeniowy post na Discorda.                      |
| `/styleguide` | Regeneruje lub aktualizuje `STYLEGUIDE.md` z obecnego kodu.                               |

### Cowork vs Claude Code — how to invoke

**Claude Code (terminal):** komendy działają natywnie. W folderze projektu
odpalasz `claude`, wpisujesz `/commit` (lub `/readme` itd.) i procedura
z odpowiedniego pliku w `.claude/commands/` jest wykonywana.

**Cowork desktop (ten czat):** Cowork **nie ładuje** `.claude/commands/`
automatycznie. Użytkownik wywołuje komendę pisząc np. _"uruchom `/commit`"_
albo _"wykonaj procedurę z `.claude/commands/changelog.md`"_. Wtedy Claude
**musi**:

1. Przeczytać odpowiedni plik z `.claude/commands/<nazwa>.md` przez `Read`.
2. Zastosować się do instrukcji w tym pliku tak, jakby były promptem
   slash commanda w Claude Code.
3. Trzymać się reguły "don't write to repo on your own" niezależnie od
   tego, co mówi sam plik komendy (np. `/commit` nigdy nie odpala `git commit`,
   `/readme` nigdy nie zapisuje do `readme.md`).

**Default rule:** nie odpalaj komend automatycznie ani w Cowork, ani w
Claude Code. Czekaj aż użytkownik wpisze polecenie.

## When in doubt

1. Look in `STYLEGUIDE.md`.
2. Look at the nearest existing file doing something similar (new generator
   → wzoruj się na `officer_generator.html` + `js/app.js`; new report →
   `firearm_discharge.html` + `js/firearm_discharge_investigation.js`).
3. **Ask.**
