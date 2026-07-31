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
] = await Promise.all([
  readFile('components/screenfx/startup-animation.vue', 'utf8'),
  readFile('plugins/startup-composition.client.ts', 'utf8'),
  readFile('server/plugins/startup-loader-shell.ts', 'utf8'),
  readFile('server/plugins/00-startup-composition-shell.ts', 'utf8'),
  readFile('components/admin/loading-messages.vue', 'utf8'),
  readFile('stores/startupAnimationStore.ts', 'utf8'),
  readFile('server/api/startup/trace.post.ts', 'utf8'),
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
  !startupShell.includes('kr-prehydrate-controls') &&
    !startupShell.includes('data-kr-startup-action'),
  'The server shell must not render a fake control panel that can become an untappable ghost.',
)

assert.ok(
  compositionShell.includes('__KR_STARTUP_SHELL_WATCHDOG__') &&
    compositionShell.includes('const WATCHDOG_MS = 9000'),
  'The server-rendered startup cover must have a hydration-independent hard stop.',
)

assert.ok(
  compositionShell.includes("sessionStorage.removeItem(FORCE_KEY)") &&
    compositionShell.includes("sessionStorage.removeItem(STARTED_AT_KEY)"),
  'The hard stop must clear sticky forced-startup session state.',
)

assert.ok(
  compositionShell.includes('__KR_STARTUP_USER_EXPLORE__ === true') &&
    !compositionShell.includes(
      "if (document.querySelector('.startup-animation__controls--active'))",
    ),
  'Only an explicit user explore action may preserve startup; invisible DOM state must not suppress the hard stop.',
)

assert.ok(
  compositionShell.includes("fetch('/api/startup/trace'") &&
    compositionShell.includes("record('shell:snapshot'") &&
    traceEndpoint.includes("console.info(`[startup-trace]"),
  'Mobile startup must report structured lifecycle snapshots to production runtime logs.',
)

assert.ok(
  loadingMessages.includes('const HARD_EXIT_MS = 9000') &&
    loadingMessages.includes('startHardExitWatchdog()'),
  'The hydrated loading overlay must have its own hard exit deadline.',
)

const exitRequestWatch = loadingMessages.slice(
  loadingMessages.indexOf('() => startupStore.exitRequest'),
  loadingMessages.indexOf('onMounted(async'),
)

assert.ok(
  exitRequestWatch.includes('exitRequested.value = true') &&
    exitRequestWatch.includes('doFade()'),
  'Close and Resume requests must dismiss the overlay without waiting for stores or media.',
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

console.log('Startup trace and hard-stop contract passed.')
