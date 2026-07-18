import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')

  if (!source.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(path, source.replace(target, replacement), 'utf8')
}

replaceExact(
  'stores/cartStore.ts',
  `  async function checkout(userId: number): Promise<CartCheckoutResult> {`,
  `  async function checkout(): Promise<CartCheckoutResult> {`,
  'cart checkout signature',
)

replaceExact(
  'stores/cartStore.ts',
  `            body: JSON.stringify({ userId, cart: cartPayload }),`,
  `            body: JSON.stringify({ cart: cartPayload }),`,
  'cart checkout identity payload',
)

replaceExact(
  'stores/cartStore.ts',
  `  async function subscribe(userId: number): Promise<CartCheckoutResult> {`,
  `  async function subscribe(): Promise<CartCheckoutResult> {`,
  'cart subscription signature',
)

replaceExact(
  'stores/cartStore.ts',
  `          {
            method: 'POST',
            body: JSON.stringify({ userId }),
            headers: { 'Content-Type': 'application/json' },
          },`,
  `          {
            method: 'POST',
          },`,
  'cart subscription identity payload',
)

replaceExact(
  'components/giftshop/shopping-cart.vue',
  `  cartStore.checkout(userStore.userId)`,
  `  cartStore.checkout()`,
  'shopping cart checkout call',
)

replaceExact(
  'components/giftshop/subscription-manager.vue',
  `    await cartStore.subscribe(userStore.user.id)`,
  `    await cartStore.subscribe()`,
  'subscription manager call',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `Resolved since this audit: achievement scores use authenticated identity and monotonic validation; definition mutations require admins; record reads/writes are owner-scoped, derive identity from auth, and whitelist confirmation updates.`,
  `Resolved since this audit: achievement scores use authenticated identity and monotonic validation; definition mutations require admins; record reads/writes are owner-scoped; Stripe checkout and subscription derive billing identity from authentication and reject caller-supplied user IDs. Component mutation routes now require admins and use explicit update contracts.`,
  'security resolution note',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `| \`server/api/components/[id].delete.ts:21\`             | no auth import at all                                                                    |
| \`server/api/components/[id].patch.ts:128\`             | unauth update                                                                            |
| \`server/api/components/index.post.ts:89\`              | unauth upsert                                                                            |
| \`server/api/components/name/[name].patch.ts:76\`       | unauth + raw body update                                                                 |
| \`server/api/stripe/checkout.post.ts:30\`               | unauth; userId from body → attaches/overwrites Stripe customer, opens checkout as victim |
| \`server/api/stripe/subscribe.post.ts:26\`              | same for subscriptions                                                                   |
`,
  ``,
  'resolved Component and Stripe security rows',
)

replaceExact(
  'docs/notes/backend-sweep-2026-07-05.md',
  `- \`server/api/prompts/[id].patch.ts:60\`
- \`server/api/icons/[id].patch.ts:56\`
- \`server/api/reactions/[id].patch.ts:61-63\`
- \`server/api/reactions/chat/[id].patch.ts:40-42\`
- \`server/api/reactions/component/[id].patch.ts:41-43\`
- plus the unauthenticated achievements/components ones above`,
  `Resolved since this audit: Prompt, SmartIcon, Reaction, Achievement, and Component mutations now use explicit field whitelists. The specialized Reaction PATCH routes and duplicate Component-by-name route were removed.`,
  'resolved mass-assignment list',
)

replaceExact(
  'docs/architecture/thin-resource-api-audit.md',
  `| Achievement records | GET exposed every user's awards; POST accepted caller identity; PATCH was unauthenticated raw model input | Reads are self-scoped except for admins, POST derives owner/username from auth, duplicate awards are idempotent, and PATCH permits only owner/admin confirmation |`,
  `| Achievement records | GET exposed every user's awards; POST accepted caller identity; PATCH was unauthenticated raw model input | Reads are self-scoped except for admins, POST derives owner/username from auth, duplicate awards are idempotent, and PATCH permits only owner/admin confirmation |
| Stripe checkout | One-time checkout trusted a body user ID and loosely shaped cart entries before creating Stripe customers and sessions | Checkout derives billing identity from authentication, validates trusted catalog IDs and bounded quantities before Stripe calls, and UI/store callers no longer pass user IDs |`,
  'Stripe checkout audit row',
)
