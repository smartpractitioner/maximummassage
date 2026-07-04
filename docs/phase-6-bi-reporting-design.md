# Phase 6 — BI + Reporting design stage (factory reporting layer)

> **Sequencing:** Slot in after Phase 5 (rollout) and **before Phase 7 (portability + multi-agent factory staffing)**. This phase was moved ahead of factory buildout on 2026-07-03 because knowing what the reporting layer needs to output actually shapes what "stations" the factory needs — design BI first, then design the factory around delivering it. Was originally Phase 7 (behind portability); promoted to Phase 6 in the same restructure.
>
> **Note on numbering:** As of 2026-07-03 restructure — Phase 6 (was portability) is now Phase 7 (portability + multi-agent factory staffing). Phase 7 (was BI) is now Phase 6 (this file). Phase 8 (polish backlog) unchanged. Historical references to "Phase 6 = portability" pre-2026-07-03 now refer to Phase 7; "Phase 7 = polish" pre-2026-07-03 refers to Phase 8.
>
> **Do not start execution before consulting Victor.** Victor has additional documentation about laying out this reporting that must be brought in and merged with the design captured below. This phase begins with a **gathering stage** where his additional docs join what's already here, then a digest + sort + plan phase, then execution. See "Execution workflow" section at the end.

---

## Why this phase exists

Reporting for every client answers the same core question the ad funnel is designed to prove: **"Is our system generating positive ROI for you, and where do we go next?"** If we can't answer that cleanly, monthly, per-client, without our team burning hours on data assembly, then the factory isn't complete — reporting is the visible output of everything the factory produced.

Current state: the Maximum Health report exists and Victor considers it 80-90% complete as a starting artifact — but it was intuitive/ad-hoc rather than designed. This phase turns that starting artifact into a factory-grade, per-client-repeatable reporting layer with defined questions, automated data sources, standard presentation, and hands-off monthly deployment.

**Success criterion for this phase:** any new client onboarded post-launch gets a monthly report that requires zero manual data assembly by our team and answers a defined set of questions the client cares about.

---

## The design framework (four layers)

The design conversation is structured backwards from the questions, not forwards from the data we happen to have.

### Layer 1 — Questions we're answering

Not "what data do we have" but "what does the client need to know each month." Rough categories worth capturing:

- **ROI story:** ad spend → bookings → first-visit revenue → repeat-visit LTV → net profit vs. spend
- **Ad performance:** by keyword/campaign/skill — where's money working, where's it wasted, what to scale up/kill
- **Patient cohort attribution:** who came in from which ad, how much are they worth over time (the patient-level cohort join we designed for Phase 6 reporting)
- **Utilization health:** per-therapist fill rate, cap approach warnings, bench time, opportunity to add more coverage
- **Funnel health:** landing page → quiz → grid → detail → booking → show conversion rates + drop-off points
- **Actionable recommendations:** what should the client + we do next month based on this data

**Rule to enforce during design:** every chart and every table in the report must trace back to one specific question. If you can't answer "which question does this section answer?" — cut the section.

### Layer 2 — Data sources per question

For each question, what data feeds it, from where, and how often. This is the automation surface. Rough matrix:

| Data | Source | API-accessible? | Per-client automatable? |
|---|---|---|---|
| Ad spend, clicks, impressions, keywords | Google Ads | ✅ Full API | ✅ One service account per client account |
| Landing page traffic, funnel completion | GA4 | ✅ Full API | ✅ One service account per property |
| Our booking + lead + quiz rows | Our backend (Sheets today, D1 Phase 6) | ✅ Direct DB read | ✅ Native |
| Cal.com/PractiCal booking metadata | Our backend | ✅ Same as above | ✅ Native |
| **Patient LTV, revenue, repeat visits** (Jane) | **ClinicSync Pro or PatientSync** | ❓ **Depends on Justin's answer** | ❓ Same question as 8.2 (former 7.2 direct-booker enforcement) |
| Show rate, no-show rate | Jane | ❓ Same as above | ❓ Same as above |

**The Jane data question is the same question we're asking Justin about for 8.2 direct-booker enforcement.** Same integration, same conversation. If PatientSync can bidirectionally read patient data, it feeds both the enforcement automation AND the reporting layer. Two features from one data-flow build. Coordinate the two design conversations together, not as separate asks to Justin.

### Layer 3 — Presentation

How the report gets in front of the client. Options to weigh during the design conversation:

- **Static PDF emailed monthly** — simplest, familiar, no login. Fine if the report is the only touchpoint.
- **Client portal at their client-slug URL** — same infrastructure the factory already deploys per client (Cloudflare Pages). Login required (Cloudflare Access or similar). Interactive drilldowns possible.
- **Both** — PDF as the "at a glance" artifact, portal for anyone who wants to dig in.

Once presentation format is chosen, use the **dataviz skill** for the visualization work so we get a coherent chart language across the whole report instead of one-off styling choices per chart.

### Layer 4 — Deployment as factory output

Each new client gets, as part of onboarding:
- Their Google Ads + GA4 credentials wired into the reporting pipeline
- A per-client report generation job (Cloudflare Cron Trigger, runs monthly)
- Their branded PDF/portal template auto-populated
- Zero manual data assembly per month by our team

---

## The automation levers, ranked by ease

1. **Google Ads + GA4** — fully API-driven, cleanest to automate. Service account per client. This is the easiest 60% of the report to fully automate.
2. **Our own backend data** — trivially accessible. This is another 20% for free once the pipeline exists.
3. **Jane data via ClinicSync Pro / PatientSync** — the hard 20%. Depends on Justin's answer to the bidirectional-capture question (already outstanding). If yes → fully automated. If no → falls to a manual monthly Jane export the client uploads, OR a client-facing "connect your Jane" flow that ClinicSync Pro can maintain.
4. **Client involvement** — avoid unless there's literally no other option. Clients get twitchy about doing work for their own reports.

---

## Reference: what Victor said when this phase was scoped

Victor's own framing when he directed this phase to be created (2026-07-03), captured to preserve the intent:

> "Right now I feel like I just kind of slapped a report together but I feel like we need a stage to actually look at this and figure out what we want to have in here for every client going forward and how to deploy that including what are the inputs we need. How can we get those every month with as little of our team's involvement as possible including possibly even leveraging the client and their involvement but that's probably not a good idea instead we needed some more automation maybe ClinicSync Pro will have details like we need to know what reports we want to pull and basically what answers we want to derive what questions we want to ask about the data and then how we can use the data to come up with ways to present it and answer those specific questions. I think what I have right now for maximum health is a good start and we should take what we've built there and use that as a good starting point and refine it from there I think we've got maybe 80 or 90% of it complete there."

This is the seed of the phase. Anyone picking it up should read this quote to ground themselves in Victor's intent before designing anything.

---

## Execution workflow

This phase is NOT "read the doc and start building." It's a multi-stage design pass that Victor is explicit about. In order:

### Stage 1 — Gathering (starts here)

**Consult Victor before doing anything else.** Victor has additional documentation about laying out this reporting that he wants brought into this phase. His words from the phase kickoff (2026-07-03):

> "I want you to also bring up a point in this phase to come and consult me because I believe I have other documentation about laying out this reporting that I would like to then move into this phase and incorporate into the details that you've already provided here with me so we basically can go into a gathering mode of all the details and then we can digest it and sift it sort it from what you gave me and what I will bring into that conversation when we get there and then we can go and create a plan and then execute on that plan."

The gathering stage produces one consolidated "reporting design brief" that merges:
- The current Maximum Health report (as a starting artifact — reverse-engineer what questions each section answers, note what's missing)
- Victor's separately-held documentation about reporting layout (he brings this in — must consult)
- The four-layer framework already captured in this doc
- Any specific ROI-model / cost-analysis / cohort-attribution notes from the SKILL.md decision records

### Stage 2 — Digest + sort

- Consolidate the gathered material into a single design brief
- For every "candidate question" from the gathered material, answer: is it Layer 1 (question), Layer 2 (data source), Layer 3 (presentation), Layer 4 (deployment)?
- Sift: keep the questions that meaningfully answer "am I getting ROI?" or "where should we go next?" — cut vanity metrics
- Sort: prioritize by client value, not by data-availability. If a question matters but the data isn't available yet, that's an integration item, not a reason to drop the question

### Stage 3 — Design a plan

Produces a concrete implementation spec:
- Final list of questions per section of the report
- Final data-source map (with automation status + integration owner per source)
- Final presentation format decision (PDF, portal, both)
- Standardized chart set + design language (invokes dataviz skill)
- Deployment pipeline (Cloudflare Cron jobs, per-client credential handling, per-client branding)
- Onboarding SOP for spinning up reporting for a new client
- Factory playbook additions

### Stage 4 — Execute

Build the pipeline, wire the first non-Maximum-Health client's reporting as validation, refine, then bake into the `/onboard-new-client` flow.

---

## What Victor needs to bring to Stage 1 (the gathering)

When Victor is ready to kick off this phase, the consultation should surface:

- **The current Maximum Health report:** URL or file path — needs to be inventoried section-by-section as the starting artifact
- **Which sections he feels confident about vs. which feel weak** — anchors the design conversation
- **The 3-5 questions he most wants the report to answer per month for a clinic client** — the North Star for the question layer
- **His other reporting documentation** (the material referenced in his kickoff quote above) — the additional inputs that he wants integrated with what's already here
- **Any client feedback he's gotten so far on the MH report** — validates or invalidates candidate questions

---

## Files this phase will eventually touch

- New `workers/reporting/` service — per-client monthly report generation
- New Cron Triggers on Cloudflare for scheduled monthly runs
- New per-client config bindings: `GOOGLE_ADS_CUSTOMER_ID`, `GA4_PROPERTY_ID`, `REPORT_RECIPIENTS`, `BRAND_ACCENT_HEX`, etc.
- New SOP `docs/sop-client-reporting-setup.md` — factory playbook for spinning up reporting for a new client
- Extended `.claude/skills/add-skill-page/SKILL.md` (or a new `/deploy-client-reporting` skill) — the reasoning-rich design decisions from Stages 1-3 above
- Extended `/onboard-new-client` playbook (when it exists) — reporting setup becomes a required step per client
- Possibly a new front-end app for the client portal, if that presentation format is chosen
