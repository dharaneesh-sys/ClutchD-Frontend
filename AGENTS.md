<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:persistent-memory -->
## Persistent Memory — Auto-Load Instructions

At the **start of every session**, read ALL files from `~/.config/opencode/memory/` as your persistent memory context:

- `CURRENT_CONTEXT.md` — Active project, task state, open questions
- `LEARNINGS.md` — Technical solutions, gotchas, patterns discovered
- `DECISIONS.md` — Architecture decisions with rationale
- `USER_PREFS.md` — User preferences, workflow habits, coding style
- `CONVERSATION_LOG.md` — Session history, key decisions, files changed

**Follow `USER_PREFS.md` preferences automatically** unless the user explicitly overrides you this session.

At **end of session**, append a summary to `CONVERSATION_LOG.md` (date, summary, key decisions, files changed).
<!-- END:persistent-memory -->
