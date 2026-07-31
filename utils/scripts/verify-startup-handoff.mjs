import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [
  startupComponent,
  startupPlugin,
  startupShell,
  compositionShell,
  loadingMessages,
  startupStore,
  traceEndpoint,
  appShell,
  startupLaunch,
  kindLoader,
] = await Promise.all([
  readFile('components/screenfx/startup-animation.vue', 'utf8'),
  readFile('plugins/startup-composition.client.ts', 'utf8'),
  readFile('server/plugins/startup-loader-shell.ts', 'utf8'),
  readFile('server/plugins/00-startup-composition-shell.ts', 'utf8'),
  readFile('components/admin/loading-messages.vue', 'utf8'),
  readFile('stores/startupAnimationStore.ts', 'utf8'),
  readFile('server/api/startup/trace.post.ts', 'utf8'),
  readFile('app.vue', 'utf8'),
  readFile('utils/startupLaunch.ts', 'utf8'),
  readFile('components/admin/kind-loader.vue', 'utf8'),
])

assert.ok(
  startupComponent.includes('v-if="showControls"') &&
    startupComponent.includes('ref="controlsElement"'),
  'Hydrated startup controls must render from the real Vue component.',
)

assert.ok(
  startupComponent.includes("currentEffectLabel.value || 'Preparing animation…'"),
  'The hydrated control tray must never present a blank animation name.',
)

assert.ok(
  startupShell.includes('kr-prehydrate-controls') &&
    startupShell.includes('data-kr-startup-action="explore"') &&
    startupShell.includes('data-kr-startup-action="exit"'),
  'The server shell must render visible controls before Vue hydration.',
)

assert.ok(
  compositionShell.includes('__KR_STARTUP_ACTION_QUEUE__') &&
    compositionShell.includes("const BRIDGE_EVENT = 'kr-startup-action'") &&
    compositionShell.includes('forwardBridgeAction(action)'),
  'Pre-hydration controls must bridge queued actions into the real Vue controls.',
)

assert.ok(
  compositionShell.includes('__KR_STARTUP_SHELL_WATCHDOG__') &&
    /const WATCHDOG_MS = \d+/.test(compositionShell),
  'The server-rendered startup cover must have a hydration-independent JS hard stop.',
)

assert.ok(
  compositionShell.includes('@keyframes kr-startup-css-hard-stop') &&
    /kr-startup-css-hard-stop \d+ms ease \d+ms forwards !important/.test(
      compositionShell,
    ) &&
    compositionShell.includes('@keyframes kr-startup-css-root-release'),
  'The startup cover must also release through CSS when the main JS thread is blocked.',
)

/*
 * The regression this guards against: every emergency deadline must sit
 * strictly after the graceful fade's worst case. When the shell watchdog was
 * 9000ms and the intro could not fade until ~25 network-bound store
 * initialisations settled, the watchdog always won — so the launch screen was
 * only ever hard-cut and the fade genuinely never ran.
 */
const readNumber = (source, pattern, label) => {
  const match = source.match(pattern)
  if (!match) {
    assert.fail(`Could not read ${label} — the startup timing contract moved.`)
  }

  return Number(match[1])
}

const introMaxMs = readNumber(
  loadingMessages,
  /const INTRO_MAX_MS = (\d+)/,
  'INTRO_MAX_MS',
)
const overlayFadeMs = readNumber(
  loadingMessages,
  /const OVERLAY_FADE_MS = (\d+)/,
  'OVERLAY_FADE_MS',
)
const gracefulWorstCaseMs = introMaxMs + overlayFadeMs

const shellWatchdogMs = readNumber(
  compositionShell,
  /const WATCHDOG_MS = (\d+)/,
  'shell WATCHDOG_MS',
)
const cssHardStopMs = readNumber(
  compositionShell,
  /kr-startup-css-hard-stop \d+ms ease (\d+)ms forwards/,
  'CSS hard-stop delay',
)
const appFailsafeMs = readNumber(
  appShell,
  /showLoader\.value = false\s*\n\s*failsafeTimeoutId = null\s*\n\s*\}, (\d+)\)/,
  'app.vue loader failsafe',
)

for (const [label, deadline] of [
  ['shell JS watchdog', shellWatchdogMs],
  ['CSS hard stop', cssHardStopMs],
  ['app.vue loader failsafe', appFailsafeMs],
]) {
  assert.ok(
    deadline > gracefulWorstCaseMs,
    `${label} (${deadline}ms) must fire after the graceful fade completes ` +
      `(${gracefulWorstCaseMs}ms). An emergency exit that pre-empts the normal ` +
      `fade turns every slow load into a hard cut.`,
  )
}

assert.ok(
  compositionShell.includes('.kr-boot-curtain') &&
    compositionShell.includes('.kr-shell.bg-black'),
  'The compositor hard stop must release both the boot curtain and black app shell.',
)

assert.ok(
  compositionShell.includes("sessionStorage.removeItem(FORCE_KEY)") &&
    compositionShell.includes("sessionStorage.removeItem(STARTED_AT_KEY)"),
  'The JS hard stop must clear sticky forced-startup session state.',
)

/*
 * A late hydration must never raise a second launch screen. When the shell's
 * watchdog fires it removes the very classes every safety net is gated on, so
 * a startup sequence started after that point runs with no watchdog and no CSS
 * hard stop — it simply never ends. Observed directly: shell:watchdog-fire at
 * 9.3s, shell:exit-cleanup at 10.0s, then client:app-mounted at 13.8s followed
 * by client:loader-observed starting the whole sequence over again.
 */
assert.ok(
  compositionShell.includes('window.__KR_STARTUP_ABANDONED__ = true'),
  'The shell must record that it abandoned startup before tearing it down.',
)

assert.ok(
  startupLaunch.includes('export function startupWasAbandoned') &&
    kindLoader.includes('startupWasAbandoned()'),
  'kind-loader must skip the startup sequence when the shell already abandoned it.',
)

/*
 * The pre-hydration control tray must be able to finish the sequence entirely
 * on its own. It is the only tray on screen until Vue mounts, and on a page
 * that never hydrates it was previously a trap: 'explore' disarmed every
 * watchdog and 'resume' only forwarded to a component that never arrived, so
 * the launch screen responded to hover and nothing else, forever.
 */
assert.ok(
  compositionShell.includes('const bridgeAlive = ()') &&
    compositionShell.includes("if (!bridgeAlive()) beginShellExit('control-resume')"),
  'Resume on the pre-hydration controls must dismiss the launch screen itself ' +
    'when the hydrated controls never arrive.',
)

assert.ok(
  /__KR_STARTUP_USER_EXPLORE__ === true && bridgeAlive\(\)/.test(compositionShell),
  'Explore mode may only suppress the hard stop while the hydrated controls ' +
    'are alive to end it.',
)

assert.ok(
  compositionShell.includes('__KR_STARTUP_USER_EXPLORE__ === true') &&
    compositionShell.includes('kr-startup-user-explore') &&
    !compositionShell.includes(
      "if (document.querySelector('.startup-animation__controls--active'))",
    ),
  'Only an explicit user explore action may preserve startup; invisible DOM state must not suppress the hard stop.',
)

assert.ok(
  compositionShell.includes("fetch('/api/startup/trace'") &&
    compositionShell.includes("record('shell:snapshot'") &&
    compositionShell.includes('prehydrateControls: Boolean') &&
    traceEndpoint.includes("console.info(`[startup-trace]"),
  'Mobile startup must report structured lifecycle snapshots and server-control presence.',
)

/*
 * The intro must be time-driven. Store readiness and media load events may pull
 * the fade in, never hold it open — that gating is what broke the sequence.
 */
assert.ok(
  loadingMessages.includes('capFadeTimeoutId = setTimeout(') &&
    loadingMessages.includes('INTRO_MAX_MS - elapsed()'),
  'The hydrated loading overlay must fade on an unconditional time cap.',
)

assert.ok(
  !/if \(!props\.storesReady\) return/.test(loadingMessages) &&
    !/if \(!introVisualSettled\.value\) return/.test(loadingMessages),
  'The fade must not be gated on store readiness or the intro image loading; ' +
    'both are unbounded and can never be allowed to block the sequence.',
)

assert.ok(
  loadingMessages.includes("classList.add(FADING_CLASS)"),
  'Fading must set the root startup class so every startup surface fades together.',
)

const exitRequestWatch = loadingMessages.slice(
  loadingMessages.indexOf('() => startupStore.exitRequest'),
  loadingMessages.indexOf('onMounted('),
)

assert.ok(
  exitRequestWatch.includes('doFade()'),
  'Close and Resume requests must dismiss the overlay without waiting for stores or media.',
)

const immersiveWatch = loadingMessages.slice(
  loadingMessages.indexOf('() => startupStore.immersive'),
  loadingMessages.indexOf('() => startupStore.exitRequest'),
)

assert.ok(
  immersiveWatch.includes('clearFadeTimers()') &&
    immersiveWatch.includes('doFade()'),
  'Explore mode must hold the launch screen open indefinitely, and leaving it ' +
    'must fade straight into the site.',
)

assert.ok(
  compositionShell.includes('.loading-status') &&
    compositionShell.includes('padding-bottom: 6rem !important'),
  'Mobile startup layout must reserve space above the control tray for loading messages.',
)

assert.ok(
  startupPlugin.includes("nuxtApp.hook('app:mounted'") &&
    startupPlugin.includes('CLIENT_EMERGENCY_AFTER_MOUNT_MS') &&
    !startupPlugin.includes('EMERGENCY_EXIT_AT_MS - elapsedSinceNavigation'),
  'The client emergency exit must start after mount instead of firing into unmounted listeners on slow devices.',
)

assert.ok(
  startupPlugin.includes("'.kr-prehydrate-loader, .kr-startup-black-base, .loading-overlay, .loader-root'") &&
    startupPlugin.includes('removeStartupNodes()'),
  'Client cleanup must remove startup DOM nodes, not only CSS classes.',
)

const resetBody = startupStore.slice(
  startupStore.indexOf('function reset()'),
  startupStore.indexOf('return {'),
)

assert.ok(
  !resetBody.includes('exitRequest.value = 0'),
  'Startup remounts must not erase an already-issued exit request.',
)

console.log('Startup controls, telemetry, and hard-stop contract passed.')