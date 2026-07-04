# SOP — Image sourcing for skill pages (factory-general)

> **Purpose.** When a skill page needs a new or replacement image (new page build, or an audience-mismatched image flagged during Phase 3 review), follow this process to source, evaluate, and convert an appropriate one. Per-client-repeatable.
>
> **Split of labor.** Worker automates search + surface + convert. User makes the final pick. This split is intentional — the user drives selection because image "fit" is a taste + brand judgment call that's per-client.
>
> **Sources used.** Free stock libraries: **Pexels** and **Pixabay**. Both allow commercial use without attribution. Do NOT source from paid libraries (Getty, Shutterstock, Adobe Stock) — cost + licensing complexity aren't warranted for skill-page hero imagery.

---

## When to invoke this SOP

- **Phase 3.1 (visual + social proof alignment):** any image flagged as audience-mismatched or off-brand
- **Phase 5 rollout (per-page image sourcing):** every new skill-page build needs at least a hero image
- **Ad-hoc replacement:** any time a user feedback item during Phase 3.3 or Phase 5 review points at an image issue

---

## Prerequisites

- **Modality context:** what skill page is this image for? (e.g. prenatal, lymphatic, deep tissue, therapeutic)
- **Audience context:** who are the primary visitors to this page? (e.g. pregnant/postpartum women for prenatal; post-op/edema patients for lymphatic; active adults with injuries for deep tissue)
- **Placement context:** hero image, benefits section, "what a session looks like" step, testimonial background, etc. — different placements call for different image styles
- **Brand context:** the client's overall aesthetic — warm/clinical, saturated/muted, staged/candid. Colors + tone should feel consistent with the rest of the page

---

## Process (five steps)

### Step 1 — Worker searches Pexels + Pixabay

Search queries should target the modality intent + audience combo. Examples:
- Prenatal hero → search terms: "prenatal massage," "pregnancy massage," "pregnant woman relaxing," "prenatal wellness"
- Lymphatic hero → search terms: "lymphatic drainage massage," "gentle massage," "post-surgery recovery massage"
- Deep tissue hero → search terms: "deep tissue massage," "sports massage recovery," "back massage active adult"
- Therapeutic (core anchor) → search terms: "therapeutic massage," "relaxing massage session," "massage therapy" — broader intent, wider net

**Avoid images that:**
- Show a demographic mismatched to the audience (e.g. men for prenatal)
- Show a modality mismatched to the skill (e.g. hot stones on a lymphatic page, medical/clinical staging on a warm-relaxation page)
- Look overly staged / stocky (the worst case of "stock image energy")
- Have obvious licensing watermarks or attribution requirements

### Step 2 — Worker surfaces 3-5 candidates with thumbnails

Present candidate images to the user with:
- Thumbnail preview (or direct URL to view)
- Search-term match
- Brief note on why this candidate is a good fit (audience match, modality match, feel)
- Any flags on why it MIGHT not be a fit (helps user weigh the tradeoffs)

Format:
```
Candidate 1: [thumbnail URL / preview]
  Search: "prenatal massage"
  Fit: Pregnant woman, warm lighting, side-lying position — matches modality + audience
  Flag: Slightly staged; face partially visible (could be a plus or a con)

Candidate 2: [thumbnail URL / preview]
  ...
```

Aim for 3-5, not more. More options = decision paralysis; fewer = insufficient range for a taste call.

### Step 3 — User picks

User selects one from the surfaced set. If none feel right → user gives feedback ("more candid, less staged" / "warmer color palette" / "different pose") and worker returns to Step 1 with the refined criteria.

### Step 4 — User downloads to a known path

User downloads the picked image to a local path (e.g. `C:\tmp\image-source.jpg` or the project's `public/images/` folder). User tells worker the path.

### Step 5 — Worker runs ffmpeg conversion to webp

Convert to web-optimized webp with the standard config:

```
ffmpeg -i input.jpg -c:v libwebp -quality 80 -resize 800:0 output.webp
```

Parameters:
- `-c:v libwebp` — encode as webp
- `-quality 80` — good visual quality with meaningful file size reduction
- `-resize 800:0` — width 800px, height auto-scaled (preserves aspect ratio). Adjust the 800 based on placement — hero images may want 1600, thumbnails 400, etc.

Worker places the output in the correct project location and updates the page's HTML to reference it.

---

## Notes / gotchas

- **Hero images generally want larger dimensions** than 800px — hero typically wants 1600-2400px width for retina rendering. Adjust the `-resize` argument accordingly.
- **Aspect ratios matter for layout.** Some placements need portrait, some landscape. Confirm the placement's aspect ratio before conversion.
- **Multiple sizes for responsive rendering.** If the page uses `srcset` for multiple resolutions, convert to multiple sizes (e.g. 400w, 800w, 1600w). Rerun the ffmpeg command with different `-resize` values.
- **Preserve the source file** at a known path so future conversions (different sizes, different quality settings) don't require re-sourcing.
- **License notes:** Pexels + Pixabay images are free for commercial use without attribution required. If you ever source from a library that requires attribution, capture the attribution string alongside the image in the project's licensing record.

---

## Failure modes to avoid

- **Worker forcing an image choice** — user drives selection. If the worker "picks the best" without user input, we lose the taste + brand fit that the user is optimizing for.
- **Skipping the audience-match check** — the whole point of Phase 3.1 is to catch mismatches. Don't source without confirming audience alignment.
- **Reusing an image across skill pages** without checking modality fit — Charlotte's photo works everywhere; a stock prenatal massage image does NOT belong on the lymphatic page.
- **Using original (non-webp) formats in production** — always convert. Bandwidth savings + faster LCP.
