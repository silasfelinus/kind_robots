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

const [
  bootCover,
  startupCoverCss,
  kindLoader,
  loadingMessages,
  startupAnimation,
  startupLaunch,
  app,
] = await Promise.all([
  readFile('server/plugins/00-startup-composition-shell.ts', 'utf8'),
  readFile('assets/css/startup-cover.css', 'utf8'),
  readFile('components/admin/kind-loader.vue', 'utf8'),
  readFile('components/admin/loading-messages.vue', 'utf8'),
  readFile('components/screenfx/startup-animation.vue', 'utf8'),
  readFile('utils/startupLaunch.ts', 'utf8'),
  readFile('app.vue', 'utf8'),
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

// Black, effect, and foreground must be separate sibling layers. If the
// z-50 loader paints black, it hides the z-49 Screen FX along with the site.
assert.ok(
  /\.loading-overlay\s*\{[^}]*background:\s*transparent/.test(loadingMessages) &&
    app.includes('fixed inset-0 z-48 bg-black') &&
    app.includes('fixed inset-0 z-50'),
  'Startup must stack a z-48 black base, z-49 Screen FX, and transparent z-50 loader foreground.',
)

/*
 * Pause & explore is allowed to outlive the loader itself. Store initialization
 * and the app can finish underneath, but the selected startup effect must stay
 * on an opaque screensaver surface until the user resumes or exits. Otherwise
 * the control tray survives while the effect turns into a translucent overlay
 * on top of the real site.
 */
assert.ok(
  startupAnimation.includes("'startup-animation__stage--immersive': startupStore.immersive") &&
    startupAnimation.includes('() => startupStore.immersive') &&
    startupAnimation.includes('if (visible || immersive)'),
  'Immersive mode must keep the startup effect alive independently of the loader/swarm lifecycle.',
)

assert.ok(
  /\.startup-animation__stage--immersive\s*\{[^}]*background:\s*#000[^}]*opacity:\s*1/s.test(
    startupAnimation,
  ),
  'Immersive mode must own an opaque black screensaver backdrop so the live site cannot bleed through.',
)

/*
 * The intro visual is a real <img> with its own animation->logo fallback.
 * Never paint additional WebPs behind it in CSS: those backgrounds bypass the
 * radial mask and look like a second square logo load.
 */
assert.ok(
  !startupCoverCss.includes('background-image:') &&
    !startupCoverCss.includes("url('/images/startup-animations/launch-04.webp')") &&
    !startupCoverCss.includes("url('/images/kindlogo_new.webp')"),
  'The Vue intro frame must not paint duplicate startup WebPs behind the actual masked visual.',
)

assert.ok(
  bootCover.includes('grid-template-rows: minmax(3.75rem, auto) minmax(0, 1fr) 8rem') &&
    bootCover.includes('ellipse 50% 47% at 52% 49%') &&
    loadingMessages.includes('ellipse 50% 47% at 52% 49%'),
  'The server boot cameo must align with the Vue intro geometry and haze mask so their handoff reads as one logo.',
)

assert.ok(
  /\.loading-heading,\s*\.loading-status\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;/s.test(
    loadingMessages,
  ) &&
    /\.loading-logo-frame\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s.test(
      loadingMessages,
    ),
  'Startup heading, spinner, and rotating message must paint above the positioned launch media.',
)

assert.ok(
  startupLaunch.includes('export function markAppReady') &&
    kindLoader.includes('markAppReady()'),
  'The app must signal readiness so the boot cover can retire early.',
)

console.log(
  'Startup contract passed: server cover is JS-free, Vue owns the intro, immersive mode stays opaque, and the logo is single-layered.',
)
