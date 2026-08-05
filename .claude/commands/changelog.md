---
description: User-friendly changelog entry + Discord announcement.
---

Goal: turn a batch of commits into something a non-technical user / Discord
member can read.

Steps:

1. Ask the user which range to summarize if not obvious - last tag, last N
   commits, or a date range. Default: commits since the previous
   "Update readme" / version-bump commit.
2. Read commits in range: `git log --pretty=format:"%h %s" <range>`.
3. Categorize entries into:
   - **New** (`Feature:` / `feature:`)
   - **Improved** (`Refactor:` / UX-changing tweaks)
   - **Fixed** (`Fix:` / `fix:`)
   - **Other** (chore, docs, internal - usually skipped in Discord post)
4. Rewrite each commit subject into **user-language**: drop file names,
   drop refactor jargon, focus on what changed for the person using the app.

Output **two** artifacts:

### 1. Changelog block (for `readme.md` or a separate CHANGELOG)

```
## vX.Y - YYYY-MM-DD

### New
- ...

### Improved
- ...

### Fixed
- ...
```

### 2. Discord announcement

Ask whether the channel is PL or EN if unsure - default PL.

Fixed structure, always in this order:

1. **Headline** - one line with the version number, e.g.
   `🚀 **GUMA Tools v1.7 jest już online!**`
2. **Highlight** - pick the single biggest / coolest feature of the release
   and give it its own block: a bolded `⭐` line naming it, then 2-3 sentences
   explaining what problem it solves for the user and where it works. This is
   the part people actually read - don't make it a bullet.
3. **✨ Nowości** - features that did not exist in the app before.
4. **🔧 Ulepszenia** - existing features that got better (UX reworks,
   performance, layout, wording).
5. **🛠 Poprawki błędów** - fixed bugs.
6. **CTA** - `👉 https://damijjj.github.io/GUMA-tools/`

Rules for the announcement:

- Use `•` bullets inside the three categories, one short line each.
- Skip a category entirely if it has no entries.
- Don't repeat the highlighted feature as a bullet in Nowości.
- Keep bullets in user-language, no file names, no commit prefixes.
- Emoji only in the headline, the highlight line, the category headers and
  the CTA - occasional inline emoji is fine, but don't sprinkle.
- Internal / chore / docs commits don't go into the Discord post at all.

Print both blocks in code fences. **Don't post anywhere automatically.**
