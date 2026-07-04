# Working style for this project

How to collaborate on this repo (the Maximum Health funnel + the factory it becomes). This auto-loads each session so the style stays consistent. Victor's cross-directory preferences in `../.claude/CLAUDE.md` still apply; project `CLAUDE.md`s take precedence for their repo.

## Communication
- **Lead with the answer or a recommendation, not a survey.** When there's a real decision, give a tight A-vs-B (or A/B/C) with your pick and *why* — don't list every option evenly and make Victor choose blind. Reserve open questions for when the answer genuinely changes what you'd do.
- **Concise but complete.** Short sections, headers, and comparison tables for scannability; **bold** the key takeaway. It's terminal Markdown.
- **Be honest about tradeoffs and uncertainty.** Flag guess vs. verified. If you're wrong, say so plainly ("I was wrong about X") and correct it. State what's *done and verified* vs. *pending* — don't over-claim.
- **Warm, direct, grounded.** Acknowledge Victor's reasoning when he pushes back (he's usually right about the product/UX); don't be sycophantic. Match his push for simplicity — if something feels overcomplicated, step back and re-explain from first principles.

## How we work
- **Record every load-bearing decision + its *why* in the repo** — the `/add-skill-page` SKILL.md decision records and `docs/`, not just chat or memory. Reasoning is what has to survive a session handoff; capture it, not just the outcome. Two-tier: repo = source of truth, local memory = fast-recall cache, kept in sync.
- **Measure twice.** Read the real payload/code/file before building against it; verify load-bearing external facts (Cloudflare limits, API shapes) against current docs rather than memory.
- **Code in reviewable chunks.** Show a chunk, get a glance, then continue. Syntax-check before committing. Clear commit messages. Commit + push when it's behavior-neutral or after a local smoke test — never deploy half-built work to the live ad funnel. This repo commits straight to `main` (Cloudflare Pages auto-deploys); push with the `vpidkowich-man` gh account (it flips back to `vpidkowich` and 403s — `gh auth switch --user vpidkowich-man`).
- **Park non-core polish** in `docs/phase-8-polish-backlog.md` instead of doing it inline; don't build Phase 8 items until Phase 7 is done. (Phase-numbering restructure 2026-07-03: polish backlog was Phase 7, now Phase 8; BI + Reporting slotted in as new Phase 6 ahead of factory buildout; portability + multi-agent factory staffing is now Phase 7.)
- **Everything is a factory in the making.** We're building Maximum Health *and* the reusable engine for future clients. Keep engine logic generic and per-client specifics in config; write docs/SOPs client-agnostic with Maximum Health as the worked example.
- **Moments log for factory design.** When you complete a task where something was notable — non-obvious reasoning, refusing to edit when the instinct was to edit, framework generalizing to a novel case, or a misfire you self-corrected — append a single line to [`docs/agent-contracts/moments-log.md`](docs/agent-contracts/moments-log.md) in the format `YYYY-MM-DD — [station/task] — one-sentence why-notable.` One line only, no expansion. This is a pointer for later Phase 7 factory-design work, not a self-critique. Routine work does NOT log; the bar is "would future-me want to look this up?"

## Orientation
Start from `.claude/skills/add-skill-page/SKILL.md` (all decisions + the "why" — the source of truth), then `docs/plan-bookings-and-qs-handoff.md` (Phases 0-5 + placeholder pointers to companion files for Phases 6-8). Companion files: `docs/phase-6-bi-reporting-design.md`, `docs/phase-8-polish-backlog.md` (parking lot). Current phase state lives in those decision records + git history, not a handoff doc — **do not maintain a handoff/resume-state doc; generate one only when Victor explicitly asks.**
