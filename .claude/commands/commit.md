---
description: Generate a commit message in this repo's style.
---

Read the current diff using `git status` and `git diff` (both staged and unstaged).
Group changes by concern. Produce **one** commit message that matches the existing
repo style — check `git log --oneline -20` for tone reference. The repo uses
prefixes like `Feature:`, `Fix:`, `Refactor:`, `fix:`, `feature:` — sentence
case, no period at end of subject.

Output format:

```
<Prefix>: <imperative summary, max ~72 chars>

<Optional body, wrapped at 72 chars, explaining the *why* if non-obvious>
```

Rules:

- Subject in English, present-imperative ("add", "fix", "rework"), not past tense.
- Don't invent changes the diff doesn't show.
- If the diff spans multiple unrelated concerns, propose **two or more**
  commit messages and a split plan — don't merge unrelated work into one.
- **Don't run `git commit` yourself.** Just print the message(s) in a code block.
