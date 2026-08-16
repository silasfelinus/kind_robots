// /utils/scripts/verifySerendipityVoiceActionGuard.test.ts
//
// Regression test for checkSerendipityVoiceActionGuard() in
// verifySerendipityVoiceActionGuard.ts (alexa-integration/t-015). Exercises
// the real check against synthetic applyCommand()-shaped fixtures covering:
// the pre-fix shape (no action guard at all), the fixed shape (the guard
// sits between the 'clear' handling and resolveEffectId()), a misplaced-
// guard regression (the check exists but after resolveEffectId() has
// already run, too late to stop the animationStore lookup from proceeding
// on an unsupported action), and a missing-function fixture.
import assert from 'node:assert/strict'

import { checkSerendipityVoiceActionGuard } from './verifySerendipityVoiceActionGuard.js'

function fixture(opts: { actionGuard: string }): string {
  return `
    function applyCommand(command: VoiceBusCommand): void {
      if (command.target === 'theme') {
        applyThemeCommand(command)
        return
      }

      if (command.target === 'art') {
        applyArtCommand(command)
        return
      }

      if (command.target !== 'animation') {
        pushLocalMessage('system', \`Ignored unsupported command target: \${command.target}\`)
        return
      }

      if (command.action === 'clear') {
        animationStore.clearScreenEffects()
        lastAppliedText.value = 'Cleared all animations'
        pushLocalMessage('system', 'Applied: cleared all animations.')
        void postAck('Serendipity view: cleared all animations.')
        return
      }

      ${opts.actionGuard}

      const effectId = resolveEffectId(command)
      if (!effectId) {
        return
      }

      const active = animationStore.isScreenEffectActive(effectId)
      if (command.action === 'on' && !active) animationStore.toggleScreenEffect(effectId)
      else if (command.action === 'off' && active) animationStore.toggleScreenEffect(effectId)
      else if (command.action === 'toggle') animationStore.toggleScreenEffect(effectId)

      if (command.action !== 'off') {
        animationStore.setSurfacePlacement(normalizeRegion(command.surface), 'front')
      }
    }
  `
}

const ACTION_GUARD = `if (
        command.action !== 'on' &&
        command.action !== 'off' &&
        command.action !== 'toggle'
      ) {
        pushLocalMessage('system', \`Ignored unsupported animation action: \${command.action}\`)
        return
      }`

const FIXED = fixture({ actionGuard: ACTION_GUARD })

// Pre-fix: no action guard at all -- a command with action 'set' or 'draft'
// targeting 'animation' falls through to a false "applied" message.
const BUGGY = fixture({ actionGuard: '' })

// Misplaced regression: the guard exists, but after resolveEffectId() and
// the animationStore lookups have already run instead of before them.
const GUARD_TOO_LATE = `
    function applyCommand(command: VoiceBusCommand): void {
      if (command.target !== 'animation') {
        pushLocalMessage('system', \`Ignored unsupported command target: \${command.target}\`)
        return
      }

      if (command.action === 'clear') {
        animationStore.clearScreenEffects()
        return
      }

      const effectId = resolveEffectId(command)
      if (!effectId) {
        return
      }

      ${ACTION_GUARD}

      const active = animationStore.isScreenEffectActive(effectId)
      if (command.action === 'on' && !active) animationStore.toggleScreenEffect(effectId)
    }
  `

function run(): void {
  const fixedErrors = checkSerendipityVoiceActionGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkSerendipityVoiceActionGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    1,
    `expected the pre-fix fixture (no action guard) to fail once, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(/no longer rejects command\.action values/.test(buggyErrors[0]!))

  const tooLateErrors = checkSerendipityVoiceActionGuard(GUARD_TOO_LATE)
  assert.equal(
    tooLateErrors.length,
    1,
    `expected a guard placed after resolveEffectId() to fail once, got: ${JSON.stringify(tooLateErrors)}`,
  )
  assert.ok(/not between/.test(tooLateErrors[0]!))

  const missingFnErrors = checkSerendipityVoiceActionGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 1)
  assert.ok(/Could not find a function named/.test(missingFnErrors[0]!))

  console.log(
    'Serendipity Voice action guard self-test passed: buggy fixture fails, ' +
      'fixed fixture passes, a too-late-guard fixture fails, missing-' +
      'function fixture fails clearly.',
  )
}

run()
