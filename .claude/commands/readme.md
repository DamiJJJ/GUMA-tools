---
description: Update readme.md to reflect recent changes.
---

Goal: keep `readme.md` accurate without rewriting it from scratch.

Steps:

1. Read `readme.md` end-to-end.
2. Look at recent commits (`git log --oneline -20`) and the current diff
   (`git diff` + `git diff --staged`) to find what changed since the last
   readme touch.
3. For each change that the user-facing readme should reflect, propose a
   **minimal patch** (old block → new block). Don't rewrite whole sections
   unless explicitly asked.
4. Special cases:
   - New generator / report → add a row to the **Available Generators**
     table, and a Features sub-section in the same order as existing ones.
   - Removed/renamed file → update every mention.
   - Tech-stack change → update the **Tech Stack** section.
5. Keep tone consistent with the existing readme: concise bullet points,
   `**Bold**` for feature names, em-dashes, no marketing fluff.
6. Output as one or more code-fenced patches the user can copy-paste.
   **Don't write to `readme.md` directly.**
