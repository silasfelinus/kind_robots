# Mandarin Tutor — mobile domain boundary (mandarin-tutor/t-012)

Milestone m4 asks for a portable API/domain boundary for catalog, sets, media, and
learner progress, plus an evaluation of PWA vs. native iOS/Android packaging, "without
forking curriculum logic or media identities." This audits what already exists against
that bar rather than proposing a new architecture — the boundary turns out to already be
in good shape, with one concrete gap.

## The domain surface today

Every Mandarin Tutor feature is a plain JSON REST endpoint under `/api/mandarin/*`. None
of it is page-rendering logic — `pages/play/mandarin.vue` and `mandarinTutorStore` are a
client of this surface, not part of it.

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/mandarin` | none | Full starter catalog (cards, sets) |
| `GET /api/mandarin/art-manifest` | none | Illustration-prompt coverage manifest |
| `POST /api/mandarin/audio` | user | Resolve/create durable pronunciation audio for a `cardKey` |
| `GET /api/mandarin/audio/:id` | none (long-cache) | Serve immutable audio bytes by asset id |
| `POST /api/mandarin/pronunciation` | user | Transcribe a learner's recorded attempt |
| `GET /api/mandarin/requests` | user | List the learner's requested (non-catalog) words |
| `POST /api/mandarin/requests` | user | Generate a new requested-word card |
| `POST /api/mandarin/requests/:id/art` | user | Queue/attach Krea 2 art for a requested card |
| `GET /api/mandarin/study/progress` | user | Due count, retention, per-card SRS state (t-015) |
| `POST /api/mandarin/study/rate` | user | Persist a Study-mode self-rating into SM-2-lite state |

"user" above means `requireApiUser` (`server/utils/authGuard.ts`), not a
session-cookie-only guard.

## Auth is already portable — this was the open question, and it's answered

`requireApiUser` resolves a caller from, in order: a JWT bearer token
(`Authorization: Bearer <jwt>`), a beta-admin token, or a user API key
(`X-API-Key` / bearer). None of the three depend on a browser cookie jar. A native
client (or a PWA running detached from the origin's cookie store) authenticates the
exact same way a web session does today — issue or store a JWT/API key and send it as a
header. There is no mobile-specific auth to design; the existing guard already covers it.

## Media identity is already shared and durable, not client-generated

Pronunciation audio is not synthesized per-client. `POST /api/mandarin/audio` derives a
deterministic SHA-256 identity from Hanzi + pinyin + provider + pinned model + voice +
format + recipe version, and creates the `MandarinAudioAsset` row once; `GET
/api/mandarin/audio/:id` serves the same immutable bytes to every subsequent caller, web
or native. A native client hitting the same endpoint reuses the identical clip — there is
no per-platform re-synthesis and nothing to fork. The only client-local audio is the
learner's own microphone recording during pronunciation practice, which is intentionally
never persisted (durable/private-by-design, not a portability gap).

## Curriculum and scheduling logic is 100% server-side

`getMandarinCatalog()`, the SRS scheduler (`server/utils/mandarinSrs.ts`,
pure-function, self-tested), tone-shape analysis inputs, and requested-card generation
all run in `server/`. A client — web, PWA, or native — is a thin renderer over this
surface: pick a card, show it, POST a rating, GET the next due set. A native rewrite has
no reason to reimplement any of this, which is exactly the "without forking curriculum
logic" constraint the task states.

## The one real gap: two pieces of learner state are still browser-local only

`mandarinTutorStore` persists `customSets` (user-created study-set membership/names) and
`artJobs` (queued illustration job IDs) to `localStorage` only — see the store's own
comment: *"durable SRS scheduling and mastery-history persistence is deliberately
deferred to a follow-up task"* (t-015 closed the SRS half; the custom-set half was never
picked back up). `studyDiagnostics`/SRS state (t-015) and requested cards
(`GET /api/mandarin/requests`) are already server-side and portable; **a learner's custom
decks and queued-art bookkeeping are not** — they would show up empty on a second device,
a reinstalled PWA, or a native client, even though everything else in this table follows
the learner.

This is the actual blocker for "portable learning state" (m4's own milestone title), not
auth, not media, not curriculum. Filed as follow-up **mandarin-tutor/t-016**: give
`customSets`/`artJobs` the same authenticated-backend treatment `MandarinCardProgress`
already got in t-015 (a `MandarinCustomSet`-shaped table keyed on `userId`, additive
migration, `GET`/`POST` under `/api/mandarin/sets`), and treat `localStorage` as
first-load cache/offline fallback rather than the record of truth.

## PWA evaluation

Kind Robots already ships `@vite-pwa/nuxt` site-wide (`nuxt.config.ts`): an installable
manifest, `registerType: 'autoUpdate'`, and a workbox config. `/play/mandarin` gets
install/update entitlement for free today — no Mandarin-specific PWA work is needed to
make it installable. Two caveats carried over from the existing site-wide policy, not
specific to this task: the precache is deliberately install-chrome-only (icons/manifest),
not route JS, so installing doesn't mean an offline app; and Study mode's own features
(pronunciation transcription, audio synthesis, SRS calls) are inherently online regardless
of caching. Net: PWA install is already available and costs nothing further to ship;
offline Study mode is out of scope for this task and not implied by "prepare the domain
for mobile clients."

## Native packaging evaluation

Given the boundary above — plain JSON REST, header-token auth, zero client-side
curriculum logic, shared durable media — the lowest-fork-risk native path is a thin
shell (Capacitor-style WebView, or a native UI that calls the same `/api/mandarin/*`
endpoints directly) rather than a parallel Swift/Kotlin reimplementation of the study
loop. Either shell option talks to the identical endpoints this doc describes, so
"native" is a packaging/UI decision, not a backend redesign. A from-scratch native
rewrite (separate SwiftUI/Kotlin apps duplicating catalog rendering, SRS math, and tone
analysis) is the one option that *would* fork curriculum logic against the task's own
constraint, and isn't recommended unless there's a specific app-store-presence reason to
justify the duplicated maintenance — the same tradeoff already reasoned through for
`conductor-app`/`humboldt-scoop-cms`'s native shells.

## Recommendation

1. **This task** — domain boundary audited and documented above; no forked logic or
   media found, auth already portable.
2. **mandarin-tutor/t-016** (filed) — move `customSets`/`artJobs` off `localStorage`-only
   into the authenticated backend, closing the one real portability gap before shipping
   any native or multi-device client.
3. **Packaging** — PWA install works today at zero additional cost; defer a native
   shell decision until there's a concrete app-store-listing driver, then reuse this
   same API surface rather than rebuilding it.
