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
| 3.4 | Page-speed pass | 🔄 **iterative QA loop with Victor** (not done until he approves). **Target = GREEN metrics, not just "improved"** (launch-time page-experience assessment sticks). **CLS: the earlier "0" was a false signal from cold runs — fast runs showed 0.107; fixed systemically with computed metric-matched fallback fonts (`size-adjust`), pending re-measure.** Earlier: Mulish-800 preload + carousel-position cache. Hero mobile webp 37KB→20KB (780→640w). Forced reflow → one-time init only. **Remaining is LCP ~7.8s = Slow-4G LAB throttle, NOT cold-edge** (proven: runs vary 60–80 = TTFB variance, LCP magnitude is throttle-bound). Verified conclusion: **don't pay Argo/Cache Reserve** — they fix origin/eviction, irrelevant to a static Pages site. Free field-data lever: **cache-warmer Worker (cron) — ✅ deployed & smoke-tested (HIT confirmed)**. Minify/unused-JS = diagnostics, PSI says they *don't* affect the score. Loop: Victor re-runs PSI → approve. |
| 3.6 | Lessons capture → SKILL.md | ✅ Part B gotchas recorded (E.164, dual cal-api-version, webhook uid-dedupe, SVG flags, Ads-conversion timing, 502-debug, page-speed) |

*(3.5 was done ahead of 3.4 on purpose — speed is best measured after the new calendar JS landed.)*

## Google Ads Launch Gate — prerequisites (ALL required)

| Requirement | Status |
|---|---|
| Prenatal Phase 3 complete (3.1–3.6) | 🔄 3.5/3.6 done; **3.4 in the QA optimization loop** (working the full PSI list, Victor approves before done) |
| Prenatal Phase 4 E2E | 🔄 booking/attribution/GA4/Ads-tag/sheet/Jane all verified; gated on double-booking fix + Ads-conversion confirms day-1 |
| Lymphatic — full treatment + E2E | ⬜ |
| Deep tissue — full treatment + E2E | ⬜ |
| Therapeutic — new build + splitter cutover + E2E | ⬜ |
| Legal sign-off (client) | ✅ |
| No external dependency blocking | 🔄 lawyer cut · Jane sync live, but **double-booking dedup pending Justin** (ClinicSync at-least-once webhook) |

**Not gating** (can trail launch): Phase 6 BI · Phase 7 factory/PractiCal · Phase 8 polish.
