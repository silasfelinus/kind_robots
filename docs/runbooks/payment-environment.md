# Payment environment configuration

kind_robots deploys as a self-hosted Docker Compose stack, not a PaaS.
`docker-compose.yml` gives both the `migrate` and `kind-robots` services
`env_file: ${KIND_ROBOTS_ENV_FILE:-.env}`, so every runtime secret — payment
secrets included — comes from a single `.env` file that lives beside
`docker-compose.yml` on the host. `.env*` is gitignored; nothing in it ever
reaches the repo. A committed template with placeholder values lives at
[`.env.example`](../../.env.example) — copy it to `.env` on the host and fill
in real values.

Deploying is `docker compose pull && docker compose up -d` (or, on the
production host, the two-step Force-Update path documented in
[migration-credential-boundary.md](./migration-credential-boundary.md) —
either way, both paths read the same `.env`).

## An inconsistency worth knowing about

Every other integration's secret (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
`GITHUB_TOKEN`, `BREVO_API_KEY`, …) is wired through `nuxt.config.ts`'s
`runtimeConfig` block, which reads `process.env` once at startup and exposes
the result via `useRuntimeConfig()`. **Stripe and Printful are not.** Every
Stripe route and `server/utils/podVendorClient.ts` reads
`process.env.STRIPE_*` / `process.env.PRINTFUL_*` directly, at request time,
with no entry in `runtimeConfig` at all.

This works — Nitro server routes can read `process.env` directly — but it
means these five variables are undiscoverable from `nuxt.config.ts` and were,
until this document, tribal knowledge recoverable only by grepping
`process.env.STRIPE` / `process.env.PRINTFUL`. This doc and `.env.example`
are the fix for the *discoverability* gap. The `runtimeConfig` inconsistency
itself is left as-is — refactoring Stripe/Printful onto `runtimeConfig` is a
separate, larger change or refactor task, not a doc-provisioning one, and is
out of scope here.

## Payment variables

### `STRIPE_SECRET_KEY`

- **For:** Stripe API secret key. Constructs the `Stripe` client used to
  create Checkout Sessions, look up sessions, create/cancel subscriptions,
  and verify webhook signatures.
- **Read by:** every route under `server/api/stripe/` and both routes under
  `server/api/store/` that create a Checkout Session:
  - `server/api/stripe/checkout.post.ts`
  - `server/api/stripe/subscribe.post.ts`
  - `server/api/stripe/webhook.post.ts`
  - `server/api/stripe/checkout-status.get.ts`
  - `server/api/stripe/cancel-subscription.post.ts`
  - `server/api/stripe/topup.post.ts`
  - `server/api/store/pod-checkout.post.ts` (orphaned/unreachable route, see
    its file header — kept for a possible future POD SKU flow)
  - `server/api/store/product-checkout.post.ts`
- **Missing-value behavior:** every one of the routes above guards this in a
  local `getStripeClient()` helper and fails closed with a structured error
  before ever calling the Stripe SDK — no bare non-null assertion, no raw
  Stripe SDK error surfaces to the caller. Two equivalent shapes exist:
  - `subscribe.post.ts` throws a plain `Error` with a `.statusCode = 500`
    property attached.
  - Every other route (`checkout.post.ts`, `webhook.post.ts`,
    `checkout-status.get.ts`, `cancel-subscription.post.ts`, `topup.post.ts`,
    `pod-checkout.post.ts`, `product-checkout.post.ts`) throws h3's
    `createError({ statusCode: 500, message: 'Stripe secret key is not
    configured' })`.

  Both shapes are caught by each route's own top-level `try/catch`, passed
  through `server/utils/error.ts`'s `errorHandler()`, and returned to the
  caller as a structured `{ success: false, message, statusCode: 500 }`
  response (webhook's outer catch defaults the fallback status to 400, but
  since `createError` always sets `statusCode: 500` here, that fallback is
  never actually hit for this particular failure). **No gap found**:
  digital-storefront/t-039 fixed `subscribe.post.ts`'s previous bare
  `process.env.STRIPE_SECRET_KEY!` non-null assertion specifically so it would
  match this pattern, and as of this audit every other Stripe/store route
  already matched it independently — there was nothing left to fix.

### `STRIPE_WEBHOOK_SECRET`

- **For:** verifies the `Stripe-Signature` header on inbound webhook
  deliveries (`stripe.webhooks.constructEvent`), so `webhook.post.ts` only
  acts on events that genuinely came from Stripe.
- **Read by:** `server/api/stripe/webhook.post.ts` only.
- **Missing-value behavior:** guarded explicitly before signature
  verification — `createError({ statusCode: 500, message: 'Stripe webhook
  secret is not configured' })`, caught by the route's own `try/catch` and
  returned as a structured `{ success: false, message }` response. No gap.

### `STRIPE_PRICE_ID`

- **For:** the Stripe Price ID for the paid membership subscription line
  item.
- **Read by:** `server/api/stripe/subscribe.post.ts` only, via a
  `getSubscriptionPriceId()` helper.
- **Missing-value behavior:** guarded and fails closed the same way as
  `STRIPE_SECRET_KEY` above (`Error` with `.statusCode = 500`, structured
  response). This guard is itself the digital-storefront/t-039 fix — the
  route used to pass a bare `process.env.STRIPE_PRICE_ID!` straight into
  `line_items`, which let an unset value fall through as the literal string
  `"undefined"` to Stripe's API and come back as an opaque `No such price:
  'undefined'` error instead of the app's own structured 500. No further gap.

### `PRINTFUL_API_KEY`

- **For:** Printful Private Token / OAuth2 Bearer token, authenticating
  print-on-demand order submission to Printful's Sync-Order API.
- **Read by:** `server/utils/podVendorClient.ts` (`isConfigured()`,
  `submitPodOrder()`, `isPodVendorConfigured()`).
- **Missing-value behavior:** **not an error path — a deliberate no-op.**
  No Printful account/API key has been provisioned yet
  (digital-storefront/t-015, still `needs-human`). `isPodVendorConfigured()`
  returns `false` when unset, and callers (the webhook's PrintJob creation)
  use that to skip attempting submission entirely rather than throwing on
  every checkout. If a caller invokes `submitPodOrder()` directly without
  checking first, it throws `PodVendorNotConfiguredError` (a clear, typed
  error, not a raw fetch failure) — see the doc comment at the top of
  `podVendorClient.ts`.

### `PRINTFUL_STORE_ID`

- **For:** the Printful store id passed as the `X-PF-Store-Id` header on the
  Sync-Order create call.
- **Read by:** `server/utils/podVendorClient.ts` (`submitPodOrder()`) only.
- **Missing-value behavior:** soft — if unset, the `X-PF-Store-Id` header is
  simply omitted (`...(storeId ? { 'X-PF-Store-Id': storeId } : {})`) and the
  request proceeds. Only matters once `PRINTFUL_API_KEY` is also set and a
  real submission is attempted; Printful's own API would reject/misroute the
  request without it, not this codebase.

## Related, non-payment-secret variable worth flagging: `BASE_URL`

Every Stripe route that creates a Checkout Session builds its
`success_url`/`cancel_url` from `process.env.BASE_URL` directly (e.g.
`` `${process.env.BASE_URL}/sanctuary?subscription=success` ``) — see
`checkout.post.ts`, `subscribe.post.ts`, `topup.post.ts`,
`pod-checkout.post.ts`, `product-checkout.post.ts`. This is a **different**
env var from `APP_BASE_URL`, which is the one wired through
`runtimeConfig.public.appBaseUrl` and used everywhere else in the app
(email links, narrator/export scripts, etc. — see
`utils/scripts/verifyAppBaseUrl.ts`). `BASE_URL` has no guard and no
`runtimeConfig` entry: if unset, the redirect URLs Stripe receives become the
literal string `"undefined/sanctuary?subscription=success"`, which Stripe's
API will reject as an invalid URL, surfacing as a generic Stripe SDK error
caught by the route's existing `try/catch` rather than the codebase's own
structured "not configured" guard. It is included in `.env.example` for that
reason, but reconciling it with `APP_BASE_URL` (either by reusing
`APP_BASE_URL` in the Stripe routes or by giving `BASE_URL` its own explicit
guard) is left for a future task — out of scope here.

## Where the values themselves come from

Real values are Silas's — Stripe dashboard (API keys, webhook signing
secret, price id) and, once provisioned, a Printful account. No real value
for any of the above has ever been in this repo; do not add one. Set them in
the `.env` file on the deploy host only.
