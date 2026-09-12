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
- `.opencode-memory.json` — Memory index metadata

**Follow `USER_PREFS.md` preferences automatically** unless the user explicitly overrides you this session.

### Real-Time Decision Capture

**When a key decision is made** — immediately append to `~/.config/opencode/memory/DECISIONS.md`.
Don't wait. Don't batch. If it affects how future sessions should behave, save it now.

Only save when user **explicitly confirms** ("good", "looks good", "approved", etc.)
or **moves to the next topic** without rejecting it. If user pushes back, don't save.

**When user states a preference or workflow rule** — immediately append to
`~/.config/opencode/memory/USER_PREFS.md`.

**When you discover a non-obvious technical insight** — immediately append to
`~/.config/opencode/memory/LEARNINGS.md`. Skip obvious/factual stuff.

**At end of session** — append a one-liner to `CONVERSATION_LOG.md`:
Date + what got done. That's it.

## Knowledge Graph (Cross-Session Memory)

At **session start**, load the knowledge graph via `memory_read_graph` to
understand entities, relations, and observations from prior sessions.

Use `memory_create_entities` / `memory_add_observations` / `memory_search_nodes`
to persist cross-session context beyond the file-based memory.

## Sandbox & Automation Tools

### Docker Sandbox (`~/.omo/sandbox/run.sh`)
Isolated command execution via Docker. Use for:
- Testing code in a clean environment
- Running untrusted commands safely
- Ephemeral container (auto-removed)

`bash ~/.omo/sandbox/run.sh --image node:22-slim "node --version"`

### Worktrees (`~/.omo/sandbox/worktree.sh`)
Isolated workspaces for parallel agent tasks:
`bash ~/.omo/sandbox/worktree.sh create my-task`
`bash ~/.omo/sandbox/worktree.sh exec my-task npm test`

### Task Runner (`~/.omo/sandbox/task-runner.sh`)
Define and run repeatable automation tasks:
`bash ~/.omo/sandbox/task-runner.sh add build-android "cd ClutchD-App && npx cap sync android && npx cap open android"`
`bash ~/.omo/sandbox/task-runner.sh run build-android`
<!-- BEGIN:council-mode -->
## Council Mode — Multi-Perspective Deliberation

For **complex, ambiguous, or high-stakes tasks** (architecture decisions, security-critical
changes, hard bugs, production incidents) — JARVIS will invoke a "council" of parallel
sub-agents to propose independent solutions, then synthesize the best approach.

### How It Works
```
1. DEFINE — Concrete goal with success criteria
2. DIVERSIFY — 3 parallel agents: ultrabrain (logic), deep (research), artistry (creative)
3. DELIBERATE — Review proposals for conflicts & consensus
4. DECIDE — Oracle synthesizes the best approach (or hybrid)
5. DELIVER — Execute chosen approach
```

### Triggers (JARVIS decides)
- Architecture design with tradeoffs
- Security-critical changes
- Hard-to-reproduce bugs
- Ambiguous/exploratory requirements
- Any task where a single approach risks blind spots

### Skip When
- Trivial fixes (typos, single-file changes, known patterns)
- Simple research questions
- Clear solution paths
<!-- END:council-mode -->

<!-- BEGIN:deep-research -->
## Deep Research — Multi-Step Autonomous Research

Use `/deep-research <topic>` to launch structured multi-step research:
1. Searches the web from multiple angles
2. Reads top sources in parallel via `freeweb_parallel_browse`
3. Digs deeper when answers are partial
4. Synthesizes into a structured cited report

Options: `/deep-research <topic> --deep` for extra iteration with follow-up searches.

Backed by:
- Skill: `skill(name="deep-research")` for the workflow instructions
- Script: `~/.omo/sandbox/deep-research.sh` for report scaffolding
<!-- END:deep-research -->

<!-- BEGIN:cron-scheduler -->
## Cron Scheduler — Scheduled Task Automation

Use `/cron` to manage scheduled automation tasks. Commands:
- `/cron list` — list all scheduled tasks
- `/cron add <name> '<cron-schedule>' '<command>'` — add a task
- `/cron remove <name>` — remove a task
- `/cron log <name>` — view run history

Schedule format (standard cron 5-field): `min hour day month weekday`
Example: `/cron add nightly-build '0 2 * * *' 'cd ~/ClutchD-App && npm run build'`

Backed by `~/.omo/sandbox/cron-scheduler.sh` which syncs to system crontab.
Task logs stored in `~/.omo/sandbox/cron-logs/`.
<!-- END:cron-scheduler -->

<!-- BEGIN:project-knowledge-base -->
# PROJECT KNOWLEDGE BASE — ClutchD-App

**Generated:** 2026-07-16

## OVERVIEW
Next.js 16 mobile-first web + Capacitor Android app for fleet/garage marketplace management. Includes maps (Leaflet), real-time chat, payments (Stripe/Razorpay), i18n (next-intl), push notifications, and offline support.

## STRUCTURE
```
src/
├── app/            # Next.js App Router (pages, API routes, auth)
├── components/     # UI components by domain (admin, auth, fleet, garage, marketplace, etc.)
├── hooks/          # Custom React hooks
├── lib/            # Core logic (API client, auth, chat, i18n, payments, offline, validation)
├── services/       # Service layer (currently 1 file — logic lives in lib/)
└── store/          # Zustand state stores (13 stores: auth, cart, chat, fleet, etc.)
e2e/                # Playwright end-to-end tests
android/            # Capacitor Android native project
```

## WHERE TO LOOK
| Task | Location |
|------|----------|
| Page routes | `src/app/` |
| UI components | `src/components/{domain}/` |
| State management | `src/store/` |
| API client & business logic | `src/lib/` |
| Auth flow | `src/lib/auth/` + `src/components/auth/` |
| Validation schemas | `src/lib/validators.js` (Zod) |
| i18n strings | `src/lib/i18n/` |
| E2E tests | `e2e/` |
| Unit tests | `src/store/__tests__/` + `src/__tests__/` |

## CONVENTIONS
- **JSX not TSX** — all components use `.jsx` files (TypeScript in devDeps but not active)
- **Zustand** for state, not Redux or Context
- **Zod** for validation schemas
- **next-intl** for i18n (not next-i18next)
- **Tailwind CSS 4** for styling
- **Capacitor** for Android, not React Native or Expo

## COMMANDS
```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright e2e
npx cap sync android # Sync Capacitor Android
```
<!-- END:project-knowledge-base -->

<!-- BEGIN:persistent-memory -->
