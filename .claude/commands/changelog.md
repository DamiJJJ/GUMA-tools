---
description: User-friendly changelog entry + Discord announcement.
---

Goal: turn a batch of commits into something a non-technical user / Discord
member can read.

Steps:

1. Ask the user which range to summarize if not obvious — last tag, last N
   commits, or a date range. Default: commits since the previous
   "Update readme" / version-bump commit.
2. Read commits in range: `git log --pretty=format:"%h %s" <range>`.
3. Categorize entries into:
   - **New** (`Feature:` / `feature:`)
   - **Improved** (`Refactor:` / UX-changing tweaks)
   - **Fixed** (`Fix:` / `fix:`)
   - **Other** (chore, docs, internal — usually skipped in Discord post)
4. Rewrite each commit subject into **user-language**: drop file names,
   drop refactor jargon, focus on what changed for the person using the app.

Output **two** artifacts:

### 1. Changelog block (for `readme.md` or a separate CHANGELOG)

```
## vX.Y — YYYY-MM-DD

### New
- ...

### Improved
- ...

### Fixed
- ...
```

### 2. Discord announcement

Max 2 short paragraphs. Light emoji use is OK (🆕 ✨ 🐛 🛠️). Start with a
one-line headline. End with a CTA link to the live site
(`https://damijjj.github.io/GUMA-tools/`). Ask whether the channel is PL
or EN if unsure — default PL.

Print both blocks in code fences. **Don't post anywhere automatically.**
