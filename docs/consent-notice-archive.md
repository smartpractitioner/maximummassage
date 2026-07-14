# Consent notice archive

> **Purpose.** The canonical, immutable record of the **exact consent-notice wording** shown at quiz Q1 for each `consent_version` value written to the `quiz_<skill>` rows. When the notice text or the linked privacy policy changes, **bump the version, add a new section here, and never edit a past section** — a historical consent record must be reconstructable from its `consent_version` alone.
>
> **How the version is recorded:** the client-side quiz stamps `consent_version` + `consent_timestamp` (the timestamp of quiz submission, taken as the affirmative act of answering Q1) onto the `quiz_<skill>` row in Sheet 2. See Decision 9 (revised 2026-07-03) in `.claude/skills/add-skill-page/SKILL.md`.
>
> **Consent model:** informed **implied** consent under Alberta PIPA (non-regulated massage therapy) — notice above Q1 + the affirmative act of answering. No checkbox, no cookie banner for AB-only traffic. See [`sop-privacy-consent-alberta.md`](sop-privacy-consent-alberta.md).

---

## `v3.1-2026-07` — ACTIVE (shipped 2026-07-14)

**Effective:** 2026-07-14. Small wording polish on v3.0 ("It's" → "It is"; the link now reads "Read how we use your info **here**"). **No change to what is collected, stored, or done with it.** Version bumped anyway: v3.0 was live (briefly) and any row stamped with it must remain reconstructable from this archive alone — the bar is "was this exact wording shown?", not "was the change important?".

**Notice text shown above quiz Q1** (`{{FLOW_NOUN}}` resolved per skill):

> Just so you know: your answers are only used to match you with the right {{FLOW_NOUN}}, and they're stored securely. It is not a medical assessment. **Read how we use your info here.**

- Link target `/privacy-policy/`. Rendered in the shaded-blue `.native-quiz__consent` panel.

---

## `v3.0-2026-07` — SUPERSEDED (live only briefly on 2026-07-14)

**Effective:** 2026-07-14. Reworded for warmth at Victor's request — the previous wording read like a legal notice bolted onto the quiz. **No change to what is collected, how it is stored, or what it is used for**; all four compliance elements are retained (purpose, storage, not-a-medical-assessment, privacy-policy link). Version bumped because the *exact wording shown* changed, and a consent record must be reconstructable from its version alone.

**Notice text shown above quiz Q1** (`{{FLOW_NOUN}}` resolved per skill — "prenatal therapist", "lymphatic drainage therapist", "deep tissue therapist", "therapeutic massage therapist"):

> Just so you know: your answers are only used to match you with the right {{FLOW_NOUN}}, and they're stored securely. It's not a medical assessment. **Read how we use your info.**

- **"Read how we use your info"** links to `/privacy-policy/`.
- **Linked privacy policy:** `public/privacy-policy/index.html`, Last Updated 2026-07-07 (v2.0).
- **Linked terms:** `public/terms/index.html`, Last Updated 2026-07-07 (v2.0).
- **Presentation change (same date):** the notice is now rendered in a shaded-blue panel (`.native-quiz__consent`) rather than plain fine print — more likely to actually be read, which *strengthens* the informed-consent position.

---

## `v2.0-2026-07` — SUPERSEDED (was live 2026-07-08 → 2026-07-14)

**Effective:** 2026-07-07 → superseded by `v3.0-2026-07` on 2026-07-14.

> **This version WAS live and DID capture consent.** Any `quiz_<skill>` row stamped `v2.0-2026-07` was shown exactly the wording below. Superseded because the wording was reworded for warmth (same four compliance elements, no change in what we collect or do with it) — not because anything about it was wrong.

**Notice text shown above quiz Q1** (`{{FLOW_NOUN}}` resolved per skill — "prenatal therapist", "lymphatic drainage therapist", "deep tissue therapist", "therapeutic massage therapist"):

> Your answers match you to a {{FLOW_NOUN}} and are stored securely.
> Not a medical assessment. **How we use your info.**

- **"How we use your info"** links to `/privacy-policy/`.
- **Linked privacy policy:** `public/privacy-policy/index.html`, reconciled version, Last Updated 2026-07-07 (two-sheet + `user_id` architecture-agnostic language).
- **Linked terms:** `public/terms/index.html`, Last Updated 2026-07-07.

**Why v2.0 (not v1.0) is the first shipped version:** the notice wording was reconciled together with the privacy policy + terms in the 2026-07-03 refactor. Because the linked policy text changed, the version was bumped to v2.0 before the notice ever appeared in production. See v1.0 below.

---

## `v1.0-2026-07` — SUPERSEDED (never shown in production)

**Status:** internal draft identifier, superseded by `v2.0-2026-07` during the same 2026-07-03/07 privacy refactor, **before any consent was captured** (the quiz consent notice was not yet on the live pages, and the booking funnel was not live).

**Draft notice text** (identical wording to v2.0):

> Your answers match you to a {{FLOW_NOUN}} and are stored securely.
> Not a medical assessment. **How we use your info.**

**Why superseded:** v1.0 was paired with the pre-reconciliation privacy policy, which still carried the stale Landingi/Tally-era claim that quiz answers are "never exported to spreadsheets" — inaccurate under the two-sheet architecture. The policy was reconciled (architecture-agnostic language) and the version bumped to v2.0 before launch. No `quiz_<skill>` rows were ever stamped `v1.0-2026-07`.
