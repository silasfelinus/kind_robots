import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

/*
 * The startup contract, after the pre-hydration launch screen was removed.
 *
 * History this guards against: the launch experience used to be rendered twice
 * — once by a server plugin before hydration (animated background, loading
 * messages, an interactive control tray, a click bridge with an action queue,
 * lifecycle tracing, a JS watchdog) and once by Vue — with a handoff between
 * them. Every startup failure we chased lived in that seam:
 *
 *   - the pre-hydration tray responded to :hover but not to clicks, because
 *     its buttons forwarded to a Vue component that had not mounted;
 *   - 'explore' disarmed every watchdog, making the screen unrecoverable;
 *   - the watchdog fired at 9s, tore down the classes every safety net was
 *     gated on, and then a late hydration started a second sequence that
 *     nothing could end.
 *
 * The invariant now is simple and checkable: the server contributes a cover
 * that needs no JavaScript to go away, and Vue owns the intro outright.
 */

const [bootCover, kindLoader, loadingMessages, startupAnimation, startupLaunch] =
  await Promise.all([
    readFile('server/plugins/00-startup-composition-shell.ts', 'utf8'),
    readFile('components/admin/kind-loader.vue', 'utf8'),
    readFile('components/admin/loading-messages.vue', 'utf8'),
    readFile('components/screenfx/startup-animation.vue', 'utf8'),
    readFile('utils/startupLaunch.ts', 'utf8'),
  ])

/*
 * The single most important property: the cover must release itself with no JS
 * whatsoever. A CSS animation cannot be starved by a busy main thread, blocked
 * hydration, or a chunk that failed to load — which is exactly how the old
 * shell managed to trap users behind a screen it could no longer remove.
 */
assert.ok(
  bootCover.includes('@keyframes kr-boot-cover-release') &&
    /animation: kr-boot-cover-release \S+ ease \S+ forwards/.test(bootCover),
  'The boot cover must release itself through a CSS animation, so no JS failure can trap the user behind it.',
)

assert.ok(
  bootCover.includes('html.kr-app-ready .kr-boot-cover'),
  'The boot cover must also retire early once the app signals it has mounted.',
)

assert.ok(
  !bootCover.includes('<script'),
  'The boot cover must contribute no JavaScript. Every trap we shipped came from ' +
    'pre-hydration script coordinating with the app.',
)

// No pre-hydration launch experience may come back.
for (const [needle, why] of [
  ['kr-prehydrate', 'a second, pre-hydration copy of the launch screen'],
  ['data-kr-startup-action', 'pre-hydration controls that need Vue to function'],
  ['__KR_STARTUP_ACTION_QUEUE__', 'an action queue bridging pre-hydration clicks into Vue'],
  ['__KR_STARTUP_BRIDGE_READY__', 'a hydration bridge handshake'],
  ['WATCHDOG_MS', 'a JS watchdog racing the app'],
]) {
  assert.ok(
    !bootCover.includes(needle),
    `The server must not reintroduce ${why} (found "${needle}").`,
  )
}

assert.ok(
  !startupAnimation.includes('__KR_STARTUP_BRIDGE_READY__') &&
    !startupAnimation.includes('kr-startup-handoff'),
  'The startup animation must not participate in a pre-hydration handoff.',
)

/*
 * The intro is time-driven. Store readiness and media loads may pull the fade
 * in; nothing may hold it open. Gating on those is what made the fade never run.
 */
assert.ok(
  loadingMessages.includes('capFadeTimeoutId = setTimeout(') &&
    loadingMessages.includes('INTRO_MAX_MS - elapsed()'),
  'The intro must fade on an unconditional time cap.',
)

assert.ok(
  !/if \(!props\.storesReady\) return/.test(loadingMessages) &&
    !/if \(!introVisualSettled\.value\) return/.test(loadingMessages),
  'The fade must not be gated on store readiness or the intro image loading; both are unbounded.',
)

assert.ok(
  loadingMessages.includes('sequenceStartedAt = performance.now()'),
  'The intro must time itself from mount, not from navigation start — the app can ' +
    'hydrate many seconds after navigation.',
)

const immersiveWatch = loadingMessages.slice(
  loadingMessages.indexOf('() => startupStore.immersive'),
  loadingMessages.indexOf('() => startupStore.exitRequest'),
)

assert.ok(
  immersiveWatch.includes('clearFadeTimers()') && immersiveWatch.includes('doFade()'),
  'Explore mode must hold the intro open indefinitely, and leaving it must fade straight into the site.',
)

const exitWatch = loadingMessages.slice(
  loadingMessages.indexOf('() => startupStore.exitRequest'),
  loadingMessages.indexOf('onMounted('),
)

assert.ok(
  exitWatch.includes('doFade()'),
  'Close and Resume must dismiss the intro without waiting for stores or media.',
)

// The intro owns its own backdrop now that the server no longer paints one.
assert.ok(
  /\.loading-overlay\s*\{[^}]*background:\s*#000/.test(loadingMessages),
  'The intro overlay must paint its own opaque backdrop.',
)

assert.ok(
  startupLaunch.includes('export function markAppReady') &&
    kindLoader.includes('markAppReady()'),
  'The app must signal readiness so the boot cover can retire early.',
)

console.log('Startup contract passed: server cover is JS-free, Vue owns the intro.')
