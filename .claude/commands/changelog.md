---
description: User-friendly changelog entry + Discord announcement.
---

Goal: turn a batch of commits plus the finished Vikunja tasks for the
release into something a non-technical user / Discord member can read.

Steps:

1. Ask the user which range to summarize if not obvious - last tag, last N
   commits, or a date range. Default: commits since the previous
   "Update readme" / "Readme update for X" / version-bump commit.
2. Determine the **release version**. `GUMA_VERSION` in `js/components.js`
   is bumped at the start of each cycle, so it already holds the version
   being released (e.g. `1.10`). Confirm with the user if unsure.
3. Read commits in range: `git log --pretty=format:"%h %s" <range>`.
4. Read finished tasks from Vikunja (see **Vikunja tasks** below).
5. Merge both sources into one list. A task and a commit describing the same
   change become **one** entry - the task title/description usually explains
   the user-facing "why" better, the commit tells you what actually shipped.
   Tasks without a matching commit still go in (the work may have landed in a
   commit with a vague subject); commits without a task go in as usual.
6. Categorize entries into:
   - **New** (`Feature:` / `feature:`, tasks for things the app didn't have)
   - **Improved** (`Refactor:` / UX-changing tweaks, tasks improving existing
     features)
   - **Fixed** (`Fix:` / `fix:`, bug tasks)
   - **Other** (chore, docs, internal - usually skipped in Discord post)
7. Rewrite each entry into **user-language**: drop file names, drop refactor
   jargon, focus on what changed for the person using the app.
8. Before the two output blocks, print a short list of tasks that carry the
   release label but are **not done** - so the user can decide whether to
   finish them or move them to the next version. They don't go into the
   changelog.

### Vikunja tasks

Tasks and ideas for the project live in a self-hosted Vikunja (v2.x) on the
home network. Each task is tagged with a **label named after the version**
it ships in (`1.9`, `1.10`, ...).

Connection comes from environment variables (set in the gitignored
`.claude/settings.local.json` under `env`, never in tracked files):

- `VIKUNJA_URL` - base URL, e.g. `http://192.168.1.115:8090`
- `VIKUNJA_TOKEN` - API token (Vikunja -> Settings -> API Tokens, read access
  to tasks, labels and projects is enough)

If either variable is missing or the server doesn't answer, tell the user and
fall back to a commits-only changelog - don't stop.

Never print the token, never write it to any file, and only use `GET`
requests - this command does not modify Vikunja.

1. Find the label id - the filter needs the id, and `s=` is a substring
   search (`1.1` also matches `1.10`), so pick the label whose `title` is
   **exactly** the release version:

   ```bash
   curl -s -H "Authorization: Bearer $VIKUNJA_TOKEN" \
     "$VIKUNJA_URL/api/v1/labels?s=<version>"
   ```

2. Fetch done tasks with that label (`per_page` is capped at 50 - keep
   increasing `page` until a page comes back with fewer than 50 items):

   ```bash
   curl -s -G -H "Authorization: Bearer $VIKUNJA_TOKEN" \
     "$VIKUNJA_URL/api/v1/tasks" \
     --data-urlencode "filter=done = true && labels in <labelId>" \
     --data-urlencode "per_page=50" --data-urlencode "page=1"
   ```

   Use `title`, `description` (HTML - strip tags) and `labels` of each task.
   Task titles are often in Polish - translate for the English changelog.
   Other labels help with categorization: `Bug` -> Fixed, `Generator` /
   `Report / Form` on a new item -> usually New. Labels are shared across
   all Vikunja projects, so keep only tasks from the project titled
   `GUMA Tools` (check `project_id` against `GET /api/v1/projects`).

3. Same request with `done = false` gives the "not done yet" list for step 8.

Output **two** artifacts:

### 1. Changelog block (for `readme.md` or a separate CHANGELOG)

**Always in English**, regardless of the language used in the chat or in the
Discord announcement.

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
