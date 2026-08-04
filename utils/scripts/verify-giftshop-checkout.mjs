// /utils/scripts/verify-giftshop-checkout.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

async function source(path) {
  return readFile(resolve(root, path), 'utf8')
}

const [
  cartPage,
  cartTab,
  cartButton,
  notificationBell,
  givingPage,
  giftshop,
  legacyCart,
  shoppingCart,
  checkoutRoute,
  statusRoute,
  successPage,
  cancelPage,
] = await Promise.all([
  source('content/cart.md'),
  source('content/channels/sanctuary/cart.md'),
  source('components/navigation/cart-button.vue'),
  source('components/navigation/notification-bell.vue'),
  source('components/pages/giving-page.vue'),
  source('components/giftshop/giftshop-interact.vue'),
  source('components/giftshop/cart-interact.vue'),
  source('components/giftshop/shopping-cart.vue'),
  source('server/api/stripe/checkout.post.ts'),
  source('server/api/stripe/checkout-status.get.ts'),
  source('components/giftshop/checkout-success.vue'),
  source('components/giftshop/checkout-cancel.vue'),
])

assert.match(cartPage, /^tabKey: cart$/m, 'cart page must resolve to the cart tab')
assert.match(cartPage, /^:shopping-cart$/m, 'cart page must mount the real cart')
assert.match(cartTab, /^route: \/cart$/m, 'Sanctuary must expose /cart as a tab')

assert.match(cartButton, /v-if="cartStore\.hasItems"/, 'cart control must appear when items exist')
assert.match(cartButton, /router\.push\('\/cart'\)/, 'cart control must open /cart')
assert.match(notificationBell, /<cart-button\s*\/>/, 'dashboard header must mount the cart control')

assert.match(givingPage, /Add \$1 donation to cart/, 'giving page must offer the $1 add-on')
assert.match(givingPage, /View cart/, 'giving page must reveal a cart action after adding')
assert.match(givingPage, /recorded[\s\S]*AMF remittance/, 'giving copy must describe separate remittance honestly')
assert.doesNotMatch(givingPage, /routes 100% to AMF/, 'giving page must not claim an automatic transfer')

assert.match(giftshop, /router\.push\('\/cart'\)/, 'giftshop cart actions must use /cart')
assert.doesNotMatch(giftshop, /setDashboardTab\?\.\('giftshop', 'cart'\)/, 'giftshop must not target an unregistered dashboard tab')
assert.match(legacyCart, /^\s*<shopping-cart\s*\/>/m, 'legacy cart mount must delegate to the real cart')
assert.doesNotMatch(legacyCart, /Pretend|alert\(/, 'no fake checkout may remain')

assert.match(shoppingCart, /await cartStore\.checkout\(\)/, 'cart review must invoke real Stripe checkout')
assert.match(shoppingCart, /cartStore\.loading/, 'checkout UI must expose loading state')
assert.doesNotMatch(shoppingCart, /alert\(/, 'cart review must not use browser-alert checkout flow')

assert.match(checkoutRoute, /session_id=\{CHECKOUT_SESSION_ID\}/, 'Stripe success URL must carry its session ID')
assert.match(statusRoute, /requireApiUser\(event\)/, 'checkout verification must require authentication')
assert.match(statusRoute, /sessionUserId !== user\.id/, 'checkout verification must enforce session ownership')
assert.match(statusRoute, /session\.payment_status === 'paid'/, 'checkout verification must read Stripe payment status')

const paidGuard = successPage.indexOf('if (!result.data.paid)')
const clearCart = successPage.indexOf('cartStore.clearCart()')
assert.ok(paidGuard >= 0 && clearCart > paidGuard, 'the local cart may clear only after the paid guard')
assert.match(cancelPage, /Your cart is still here/, 'cancellation must explicitly preserve the cart')

console.log('✅ Giftshop checkout contract passed: visible cart, real Stripe redirect, verified return, preserved cancellation.')
