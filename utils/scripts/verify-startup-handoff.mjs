import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [startupComponent, startupPlugin, startupShell] = await Promise.all([
  readFile('components/screenfx/startup-animation.vue', 'utf8'),
  readFile('plugins/startup-composition.client.ts', 'utf8'),
  readFile('server/plugins/startup-loader-shell.ts', 'utf8'),
])

assert.ok(
  startupComponent.includes('v-if="showControls"') &&
    startupComponent.includes('ref="controlsElement"'),
  'Hydrated startup controls must render independently and expose a mounted element ref.',
)

assert.ok(
  startupComponent.includes("currentEffectLabel.value || 'Preparing animation…'"),
  'The control tray must never present a blank animation-name slot.',
)

const handoffGuard = startupComponent.slice(
  startupComponent.indexOf('async function syncControlsHandoff'),
  startupComponent.indexOf('function handleEffectReady'),
)

for (const requiredGuard of [
  'showControls.value',
  'resolvedEffectId.value',
  'currentComponent.value',
  'currentEffectLabel.value',
  'controlsElement.value',
  'markControlsReady()',
]) {
  assert.ok(
    handoffGuard.includes(requiredGuard),
    `Hydrated handoff is missing required readiness guard: ${requiredGuard}`,
  )
}

assert.ok(
  !/onMounted\([\s\S]*?markControlsReady\(\)/.test(startupComponent),
  'Controls must not be declared ready merely because the component mounted.',
)

assert.ok(
  !/setTimeout\([\s\S]*?remove\(['"]kr-startup-handoff['"]\)/.test(
    startupShell,
  ),
  'The server-rendered control must not disappear on an unconditional timer.',
)

assert.ok(
  startupComponent.includes('__KR_STARTUP_BRIDGE_READY__ = true') &&
    startupComponent.includes('__KR_STARTUP_BRIDGE_READY__ = false'),
  'The hydrated component must explicitly publish and clear bridge-listener readiness.',
)

assert.ok(
  startupShell.includes('if (window.__KR_STARTUP_BRIDGE_READY__)'),
  'Server control clicks must dispatch as soon as the Vue event bridge is listening.',
)

assert.ok(
  !startupShell.includes(
    "if (root.classList.contains('kr-startup-controls-ready'))",
  ),
  'Click dispatch must not wait for the visual control-panel handoff.',
)

assert.ok(
  startupPlugin.includes(
    'startupStore.immersive && hasUsableImmersiveControls()',
  ),
  'Immersive mode may suppress emergency exit only when hydrated controls are usable.',
)

assert.ok(
  startupPlugin.includes(
    "document.querySelector('.startup-animation__controls')",
  ),
  'The emergency guard must verify that the hydrated controls exist in the DOM.',
)

console.log('Startup handoff contract passed.')
