# Handoff to worker session — Backend platform choice + portability wedge decision record

Please add this as a new decision record to `.claude/skills/add-skill-page/SKILL.md`, following the same pattern as the existing Decision 2 (Two data channels), Decision 4 (Count-only conversion), and the Path A decision you added most recently. Suggested title: **"Backend platform choice + the mhBackend portability wedge (why 1.6 exists)."**

The content to capture is below. Rewrite in the SKILL.md's voice if it flows better; keep the substance.

---

## Backend platform choice + the mhBackend portability wedge (why 1.6 exists)

Two decisions in one because they're inseparable: the choice of backend runtime for factory-scale, and the client-side abstraction that lets us migrate to that runtime without touching front-end code.

### Decision — Cloudflare Workers is the factory backend, Apps Script is the transitional path

**Phase 1 uses Apps Script.** It's already there, it works, migrating during the core build would introduce regression risk. Ship Maximum Health on it.

**Phase 7 (was Phase 6 pre-2026-07-03 restructure) migrates to Cloudflare Workers.** Apps Script does not scale to factory operations. The blocker is deployment: every code change requires a manual Script Editor → Save → Deploy → Manage Deployments → New Version dance, per client. Ten clients = ten manual redeploys every bug fix. That's not a factory.

**Why Workers wins the factory comparison:**

- **Cost:** free tier handles 100K requests/day per Worker. Our expected volume (bookings + availability polls + lead captures per clinic) sits comfortably in free tier per client, likely forever. Paid tier ($5/mo) is 10M requests/mo if we ever need it.
- **Reliability:** 99.99% SLA, global edge network, sub-50ms cold starts (V8 isolates, not containers).
- **Deployment:** `wrangler deploy` per client, wired into CI. Any code change auto-deploys to every client's Worker in parallel. Zero manual clicks.
- **Automation:** first-class CLI + API. Scripting per-client deploys via GitHub Actions is trivial.
- **Same house as Pages:** we're already on Cloudflare Pages for hosting. DNS, WAF, CDN, Worker, KV all in one dashboard. No new vendor.
- **Storage options:** Cloudflare KV for `bookings_count` (fast reads on every page load), D1 (SQLite) or a service-account-authenticated Google Sheets write for `bookings_<skill>` rows if the operator wants to keep viewing them in Sheets.

**Why NOT trigger.dev:** it's a background job orchestrator (durable execution, retries, complex workflows). We don't need that for HTTP endpoints. Workers do lead capture, booking writes, and availability queries natively, faster, and free. If we ever need scheduled durable workflows, Cloudflare Cron Triggers + Workers likely cover the case at zero additional cost.

**HARD RULE: Apps Script is pilot-only. Once Workers is built, every client uses Workers.**

The abstraction wedge (Phase 1.6) technically allows different clients to run different alternators (Apps Script or Workers) at the same time. That flexibility exists for the migration window, not as an ongoing operating mode. Do NOT ship "some clients on Apps Script, some on Workers" as a steady state. Reasons:

- Uniform runtime = uniform debugging. Two backends = two mental models, two failure modes, two sets of ops runbooks. Doubles the surface area a factory operator has to hold in their head.
- Apps Script's manual redeploy dance defeats every factory-scale advantage. Keeping it around as an option means retaining a pathway that violates the factory model.
- The migration cost from Apps Script → Workers is single-config-flip cheap (thanks to 1.6). There's no case for "leaving small clients on Apps Script to save $5/month" — Workers is free at their scale too (see Cost analysis below).

**The rule in one line:** Apps Script is the transition path for the pilot client (Maximum Health). Every client onboarded post-Workers-launch starts on Workers directly. Every existing Apps Script client gets migrated to Workers on a schedule.

### Decision — The mhBackend abstraction layer (Phase 1.6) is the migration wedge

Step 1.6 introduces a tiny client-side wrapper at `public/js/mh-backend.js` that becomes the **only** way the front-end talks to the backend:

```js
window.mhBackend = {
  post(action, payload) { /* fetch ENDPOINT, POST */ },
  get(action, params)   { /* fetch ENDPOINT?action=…&…params */ }
};
// ENDPOINT comes from a single config var: window.MH_BACKEND_URL
```

All existing call sites (`submitLeadForm`, `postQuizSubmission`, confirmation-page `notify` / `update_contact`, plus the new `booking_confirmed` and `available_therapists`) route through `mhBackend`. The Apps Script Web App URL is the value of `MH_BACKEND_URL` for now.

**Why this matters (the strategic value for the factory):**

When we migrate Apps Script → Cloudflare Workers in Phase 7, we point `MH_BACKEND_URL` at the new Worker and the action contracts (`lead`, `quiz`, `notify`, `update_contact`, `booking_confirmed`, `available_therapists`) stay identical. **Zero front-end rework on migration day — just one config value flips.**

Same pattern the picker-config layer already uses for page → skill resolution: single-config-knob portability. The factory benefits directly — each new client's front-end code is unchanged; only their `MH_BACKEND_URL` differs.

**Why this is worth doing now instead of at migration time:** if we skip 1.6 and let call sites hit the Apps Script URL directly, the Phase 7 migration turns into a code-touching operation across every front-end file that talks to the backend. Multiplied across every client already deployed. That's expensive and risky. Doing the abstraction now costs an hour of Phase 1 work and saves days of Phase 7 work — plus makes future backend swaps (any provider, any reason) similarly cheap.

### The per-client deployment model this unlocks

Once Workers is the backend:

- **One Worker per client.** Same code base, different config (`wrangler.toml` binds per-client env vars: Google Sheets id, Cal.com account tokens, brand tokens, therapist roster path, etc.).
- **Front-end code identical across all clients.** Only `MH_BACKEND_URL` (and other single-config-knob values from the Phase 7 client-config extraction) differ.
- **Deploy new client in minutes, not days.** Clone the client-config skeleton, fill in the knobs, `wrangler deploy`. First page live same day.
- **Code change propagates to all clients in one CI run.** Fix a bug in the backend → GitHub Actions deploys to every client's Worker in parallel. Deploy target list is a config file, not a set of manual steps.

This is the entire premise of the factory. Step 1.6 is what makes it cheap.

### The Cloudflare stack at end-of-project (Phase 7+)

Full inventory of Cloudflare products the factory uses per client:

**Already in place from Phases 0-5 (before the Workers migration):**
- **Cloudflare Pages** — hosts the landing pages
- **Cloudflare DNS** — domain nameserver
- **Cloudflare CDN + edge network** — comes with Pages
- **Cloudflare WAF** — where the paid-ads-only crawler block lives
- **Cloudflare Pages Functions** — server-side GA4 tracking, edge splitter

**Added by Phase 7:**
- **Cloudflare Workers** — the backend runtime (replaces Apps Script)
- **Cloudflare KV** — key-value store for `bookings_count` (read on every picker load; sub-millisecond edge reads matter here)
- **Cloudflare D1** — SQLite, *optional*. Only if we move `bookings_<skill>` rows off Google Sheets entirely (see the Sheets vs. KV/D1 trade-off below)
- **Cloudflare Cron Triggers** — free bundled Workers feature. Runs scheduled jobs (monthly cohort reports, sheet-to-Jane reconciliation, direct-booker leakage sweeps)

**Optional / evaluate later:**
- **Cloudflare Access** — zero-trust auth for the factory GUI (Phase 8.6), if that GUI ships
- **Cloudflare R2** — object storage. Not needed for this project.
- **Cloudflare Zaraz** — server-side tag manager alternative to GTM. Not needed since GTM is committed.

### Storage model — D1 from day one, KV for counters, Sheets as an export view (not the source of truth)

**Hard rule: no phased migration. D1 is the row-store from client one.**

The tempting path is "Sheets for a few clients, migrate to D1 at scale." Rejected because:

- Client acquisition is the primary growth driver post-launch. Retooling infrastructure while onboarding new clinics AND rewiring existing ones is exactly the trap we're building the factory to avoid.
- The migration cost isn't linear — every existing client on Sheets needs a data move, revalidation, and a config flip. Multiply across N clients running live traffic and it becomes a real operational hazard.
- Building D1 support now is a one-time cost. Building D1 support later after Sheets is entrenched is a per-client cost.
- 5-client "breakage point" is too close to the launch trajectory. We can't sensibly aim for "5 clients before we hit the wall" when we're pushing for volume.

The mapping we launch with:

| Data | Home | Why |
|---|---|---|
| `bookings_count` (monthly cap counter per therapist) | **Cloudflare KV** | Read-heavy — every picker load fetches it. Sub-millisecond edge reads matter. |
| `bookings_<skill>` / `leads_<skill>` / `quiz_<skill>` rows | **Cloudflare D1** | SQL queries, structured schema, no API-quota pain, clean cross-client reporting at any scale. |
| Audit log (`direct_booker_auto_cancels`, etc.) | **D1** | Same runtime as the row store, joinable with bookings/leads for false-positive detection. |
| Cohort attribution join with Jane | **D1** | Import Jane patient export as a D1 table monthly, run the join in SQL, output the report. Much cleaner than sheet VLOOKUPs at N clients. |

**Preserving operator (Tracy/team) sheet-view without giving up D1 as the source of truth:**

- **Nightly Cron export from D1 → Google Sheets.** A Cloudflare Cron Trigger runs a Worker that reads the current month's `bookings_<skill>`, `leads_<skill>`, and a pre-joined cohort-attribution report from D1, and writes them to a client's Google Sheet via service-account. The operator opens the sheet in the morning, gets the sheet-familiar view of yesterday's + month-to-date data. Zero training cost, no dashboard to build in the short term.
- **Optional lightweight admin UI later** — if the sheet export ever hits its own limits (large row counts, cross-client queries the operator can't do in a sheet), build a small internal UI that queries D1 directly. Not urgent; the sheet mirror covers the pilot need.
- **Real-time views (if needed)** — the operator can hit the export Worker with a URL param to force a fresh export before their next look. Rare.

Result: Tracy still opens a Sheet to look at data. But the sheet is a downstream export, not a primary store. Every client scales identically. No migration debt.

**Ad-hoc analysis the operator loses vs. Sheets-primary:**

Ad-hoc analysis (pivot tables, formulas, one-off joins) still works on the exported sheet — she can pivot, filter, and VLOOKUP against Jane exports as before. She's just doing it against yesterday's snapshot, not live data. For a monthly ROI review workflow, that's fine. Real-time is a "run the export now" click away.

**Implementation implication for Phase 7.3:** the Worker's action contract for `booking_confirmed` writes to D1 directly. The Sheets export is a separate Cron-triggered Worker that reads D1 and writes to Sheets. Two Workers, one purpose each. Sheets access is read-only from the operator's side — the Worker owns writes.

### Cost analysis — at what point does Cloudflare start costing real money?

Cloudflare's pricing structure for our workload (many small clients, edge-served, low per-client volume) is favorable at every scale we're likely to hit.

**Free tier limits per Cloudflare account:**

| Product | Free tier | Paid tier ($5/mo per account, bundled) |
|---|---|---|
| Pages | Unlimited requests, 500 builds/mo/repo | Same |
| DNS | Free | Free |
| WAF (basic rules) | Free | Free |
| Workers | 100,000 requests/day per Worker | 10M requests/mo bundled + $0.30/M after |
| KV | 100K reads/day, 1K writes/day, 1GB storage | 10M reads/mo bundled, 1M writes/mo bundled |
| D1 | 100K rows read/day, 100K written/day, 5GB storage | Higher limits |
| Cron Triggers | Free (bundled with Workers) | Free |
| Pages Functions | Counts toward Workers billing | Same |

**Critical detail:** the $5/month paid tier is **per Cloudflare account, not per Worker or per client**. Ten clients running under one account = still $5/month total once we cross the free-tier threshold.

**Realistic per-client volume (based on Maximum Health estimates):**

- Landing page visits: ~500/day
- Lead form submissions: ~10-30/day
- Bookings: ~5-30/day
- `available_therapists` reads (fires on every picker load): ~500/day
- `bookings_count` writes: ~5-30/day
- Storage for `bookings_<skill>` rows: <1MB per year

Well within free tier for a single client, indefinitely.

**Factory scale estimates:**

| Clinics running | Est. Worker requests/month | Est. cost |
|---|---|---|
| 1 (Maximum Health today) | ~15,000 | $0 |
| 5 | ~75,000 | $0 |
| 10 | ~150,000 | $0-$5 |
| 20 | ~300,000 | $5 |
| 100 | ~1.5M | $5 |
| 300+ | ~5M+ | $5 (still under bundled 10M/mo) |

**When you'd actually pay more than $5/month:**

- **>10M Worker requests/month aggregate.** Requires ~600+ active clinics at current per-client volume. Not a near-term concern.
- **Cloudflare Access seats** (~$3/user/month) — only relevant if Phase 8.6 GUI ships and team members need scoped access to the admin.
- **KV/D1 usage beyond bundled** — implausible at our scale for years.

**Comparison to alternatives (single client volume):**

- Apps Script: $0 but manual redeploy labor per client is the hidden cost
- AWS Lambda equivalent: ~$1-3/month + more complex setup + cold-start latency
- trigger.dev: $20-500+/month
- Heroku / Render / Fly.io: $7-25+/month per app

Cloudflare wins on cost for our workload shape because Workers pricing rewards edge-served, low-per-client-volume, many-worker deployments. Which is exactly the factory model.

### Cloudflare account model — one central account we own, with per-client scoped tokens

**Recommended pattern: one central Cloudflare account, owned by us. Each client is one zone (domain) + one Worker under that account. Isolation between clients enforced by scoped API tokens, not by account boundaries.**

**Why central-account-we-own wins for this business model:**

- **The infrastructure is our IP, not the client's.** Clients pay a recurring fee to access the factory-built system; they don't buy the infrastructure. Framing the Cloudflare account as "theirs" or asking them to delegate to us contradicts the ownership model and puts our proprietary setup partially under their control.
- **Single ops surface at any scale.** One login, one billing, one API. Managing 10 or 100 clients through one dashboard is exponentially simpler than managing 10 or 100 separate accounts.
- **No per-client Cloudflare account creation ritual** at onboarding — one less manual step in the factory pipeline.
- **Cross-client reporting** (e.g. aggregate usage, cost allocation, uptime across all clinics) is trivial when everything is under one account.

**Blast radius isolation — solved with scoped tokens + per-client zones, not accounts:**

The one legitimate concern about single-account is blast radius: a compromise or misconfiguration affecting all clients simultaneously. Mitigated by:

- **Per-client zones (domains).** Each client has their own zone (`clinic-1.example.com`, `clinic-2.example.com`, or their own domain under our account's zone list). Cloudflare's rate limits, WAF rules, and analytics apply per zone. A misconfiguration on one zone doesn't propagate.
- **Per-client scoped API tokens.** Wrangler + CI use tokens scoped to a single Worker + a single zone. A leaked token only exposes that client's Worker, not the whole account.
- **Master account 2FA is hardware-backed** (YubiKey or equivalent). The only path to affecting all clients is compromising the master credentials — which requires physical access to the 2FA device.
- **Very limited master-account usage.** Deploys use scoped tokens. Master login is reserved for account-level admin (billing, adding new team members, top-level zone creation). Audited manually.
- **Cloudflare's audit log** records every account-level action. Reviewed periodically for anomalies.

This gets ~90% of the blast-radius isolation of multi-account without any of the operational overhead. The remaining ~10% (a compromised master account taking everyone down) is a threat model that hardware 2FA + audit logging address at a level appropriate for our data (booking records, not medical records; PII exists but nothing regulated).

**Compliance / audit posture:** central account. Cloudflare provides audit logs, zone-level analytics, and role-based access control (RBAC) for team members within one account. If a compliance requirement ever demands per-client account isolation (unlikely for our data), reevaluate then.

**How we operate against the central account:**

- One Cloudflare account, owned by our team (root email under our control, hardware 2FA on the master login)
- Each client gets a zone (their domain, or a subdomain under our zone list depending on setup)
- Each client gets a Worker (`<client-slug>-backend`) with scoped bindings (their KV namespace, their D1 database)
- GitHub Actions holds a matrix of `(client_id, worker_name, scoped_api_token)` — each token scoped to just that client's Worker + KV + D1
- Deploy pipeline: change → CI → per-client scoped token → `wrangler deploy` for each client's Worker in parallel
- Team member access via Cloudflare RBAC (read-only for junior operators, deploy-capable for senior devs, master admin locked to founding team)

**When we'd reconsider (revisit at scale):**

- **>50 clinics** — multi-account tooling starts to look more attractive purely for org-chart hygiene. Cloudflare Business/Enterprise tiers offer sub-account management.
- **HIPAA / regulated data** — if a client type requires per-account data isolation for compliance, break them out.
- **Client explicitly asks to own their infrastructure** — accommodate on a per-request basis; make it a paid one-off setup fee since it violates the standard factory model.

For the current + near-term scale (up to ~50 clinics), central-account-we-own is the right shape.

---

## Once folded in

Commit with the `skill` prefix matching the existing convention (e.g. `skill: record backend platform choice + mhBackend portability wedge rationale`). This handoff file can be deleted afterward or left as a bridge record — your call.
