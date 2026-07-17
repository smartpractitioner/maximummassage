# Project status — Maximum Health funnel

> **What this is:** the shared, at-a-glance progress board for everyone on this project — Victor and every agent session. It's the fast answer to "where are we?"
>
> **What this is NOT:** a handoff / resume-state doc. We deliberately don't keep one of those (heavyweight, always-updated context dumps that drift). This board holds **only status** — done / in-progress / next. All *reasoning, decisions, and detail* live in [`docs/plan-bookings-and-qs-handoff.md`](docs/plan-bookings-and-qs-handoff.md), [`.claude/skills/add-skill-page/SKILL.md`](.claude/skills/add-skill-page/SKILL.md), and git history. This file points at them; it never duplicates them.
>
> **Keeping it honest — every agent, no exceptions:** when you **start or complete** a phase step, flip its line here **in the same commit as the work**. It's one line; that's part of "done." A status board that drifts is worse than none, so the cost of keeping it true is paid by whoever moves the work, not by a separate maintenance pass. Don't add a hand-typed "last updated" date — `git log`/`git blame` is the timestamp.

**Legend:** ✅ done · 🔄 in progress · ⬜ not started

---

## Macro phases

| Phase | What it is | Status |
|---|---|---|
| 0 | Session retrospective | ✅ |
| 1 | Booking flow (Cal.com, conversions, Slack) | ✅ |
| 2 | Copy + keyword theming (prenatal) | ✅ |
| **3** | **Prenatal iteration (canonical template)** | 🔄 |
| 4 | End-to-end test on prenatal | ⬜ |
| 5 | Rollout: lymphatic, deep tissue, therapeutic | ⬜ |
| 6.5 | Legal + consent (client sign-off model) | ✅ satisfied (MH) |
| 🚦 | **Google Ads Launch Gate** | ⬜ pending full page coverage |
| 6 | BI + reporting | ⬜ post-launch |
| 7 | Factory portability + PractiCal engine swap | ⬜ post-launch |
| 8 | Polish backlog | ⬜ post-launch (lighter — 8.10/8.11 pulled forward, 8.3 moot) |

## Phase 3 — prenatal (canonical template)

| Step | What it is | Status |
|---|---|---|
| 3.0 | Two-sheet + `user_id` firewall | ✅ (verified E2E) |
| 3.1 | Image review + alignment | ✅ |
| 3.2 | Social proof alignment | ✅ |
| 3.3 | User review + iteration | ✅ |
| 3.5 | Booking + quiz experience upgrade | ✅ Part A ✅ · Part B ✅ live + Jane sync + attribution confirmed |
| 3.4 | Page-speed pass | ⬜ **← next** (run now the custom calendar's in) |
| 3.6 | Lessons capture → SKILL.md | ⬜ |

*(3.5 was done ahead of 3.4 on purpose — speed is best measured after the new calendar JS landed.)*

## Google Ads Launch Gate — prerequisites (ALL required)

| Requirement | Status |
|---|---|
| Prenatal Phase 3 complete (3.1–3.6) | 🔄 only 3.4 + 3.6 left |
| Prenatal Phase 4 E2E | ⬜ |
| Lymphatic — full treatment + E2E | ⬜ |
| Deep tissue — full treatment + E2E | ⬜ |
| Therapeutic — new build + splitter cutover + E2E | ⬜ |
| Legal sign-off (client) | ✅ |
| No external dependency blocking | ✅ lawyer cut · Jane sync confirmed live |

**Not gating** (can trail launch): Phase 6 BI · Phase 7 factory/PractiCal · Phase 8 polish.
