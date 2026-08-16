// /utils/scripts/verifySerendipityVoiceActionGuard.test.ts
//
// Regression test for checkSerendipityVoiceActionGuard() in
// verifySerendipityVoiceActionGuard.ts (alexa-integration/t-015, extended by
// t-020). Exercises the real check against synthetic fixtures for all three
// target functions -- applyCommand() (animation), applyThemeCommand()
// (theme), and applyArtCommand() (art) -- covering: the fixed shape (guard
// present, correctly placed), a missing-guard regression, a misplaced-guard
// regression (guard exists but after the state mutation it's meant to
// prevent), and a missing-function fixture.
import assert from 'node:assert/strict'

import { checkSerendipityVoiceActionGuard } from './verifySerendipityVoiceActionGuard.js'

const ANIMATION_ACTION_GUARD = `if (
        command.action !== 'on' &&
        command.action !== 'off' &&
        command.action !== 'toggle'
      ) {
        pushLocalMessage('system', \`Ignored unsupported animation action: \${command.action}\`)
        return
      }`

const THEME_ACTION_GUARD = `if (command.action !== 'set') {
        pushLocalMessage('system', \`Ignored unsupported theme action: \${command.action}\`)
        return
      }`

const ART_ACTION_GUARD = `if (command.action !== 'draft') {
        pushLocalMessage('system', \`Ignored unsupported art action: \${command.action}\`)
        return
      }`

function fixture(opts: {
  animationGuard: string
  themeGuard: string
  artGuard: string
}): string {
  return `
    function applyThemeCommand(command: VoiceBusCommand): void {
      ${opts.themeGuard}

      const theme = (command.theme ?? '').trim()
      if (!theme) {
        return
      }

      void themeStore.setActiveTheme(theme).then((result) => {
        if (result.success) {
          pushLocalMessage('system', \`Applied: theme set to \${theme}.\`)
        }
      })
    }

    function applyArtCommand(command: VoiceBusCommand): void {
      ${opts.artGuard}

      const request = { id: command.id, prompt: command.prompt ?? command.spokenText, at: command.at }
      artRequests.value.push(request)
      pushLocalMessage('system', \`Art draft received: \${request.prompt}\`)
    }

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

      ${opts.animationGuard}

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

const FIXED = fixture({
  animationGuard: ANIMATION_ACTION_GUARD,
  themeGuard: THEME_ACTION_GUARD,
  artGuard: ART_ACTION_GUARD,
})

// Pre-fix: no action guard at all on any of the three functions.
const ALL_BUGGY = fixture({ animationGuard: '', themeGuard: '', artGuard: '' })

// Only the animation guard (t-015's original fix) is present -- t-020's gap:
// theme/art never got the equivalent treatment.
const THEME_ART_BUGGY = fixture({
  animationGuard: ANIMATION_ACTION_GUARD,
  themeGuard: '',
  artGuard: '',
})

// Misplaced regression: applyThemeCommand()'s guard exists, but after
// setActiveTheme() has already been called instead of before it.
const THEME_GUARD_TOO_LATE = `
    function applyThemeCommand(command: VoiceBusCommand): void {
      const theme = (command.theme ?? '').trim()
      void themeStore.setActiveTheme(theme).then((result) => {
        if (result.success) {
          pushLocalMessage('system', \`Applied: theme set to \${theme}.\`)
        }
      })

      ${THEME_ACTION_GUARD}
    }

    function applyArtCommand(command: VoiceBusCommand): void {
      ${ART_ACTION_GUARD}
      const request = { id: command.id, prompt: command.prompt ?? command.spokenText, at: command.at }
      artRequests.value.push(request)
    }

    function applyCommand(command: VoiceBusCommand): void {
      if (command.target !== 'animation') {
        pushLocalMessage('system', \`Ignored unsupported command target: \${command.target}\`)
        return
      }

      if (command.action === 'clear') {
        animationStore.clearScreenEffects()
        return
      }

      ${ANIMATION_ACTION_GUARD}

      const effectId = resolveEffectId(command)
    }
  `

function run(): void {
  const fixedErrors = checkSerendipityVoiceActionGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const allBuggyErrors = checkSerendipityVoiceActionGuard(ALL_BUGGY)
  assert.equal(
    allBuggyErrors.length,
    3,
    `expected all three pre-fix fixtures to fail once each, got: ${JSON.stringify(allBuggyErrors)}`,
  )

  const themeArtBuggyErrors = checkSerendipityVoiceActionGuard(THEME_ART_BUGGY)
  assert.equal(
    themeArtBuggyErrors.length,
    2,
    `expected only the theme/art fixtures to fail, got: ${JSON.stringify(themeArtBuggyErrors)}`,
  )
  assert.ok(
    themeArtBuggyErrors.every((e) =>
      /applyThemeCommand|applyArtCommand/.test(e),
    ),
  )

  const themeTooLateErrors =
    checkSerendipityVoiceActionGuard(THEME_GUARD_TOO_LATE)
  assert.equal(
    themeTooLateErrors.length,
    1,
    `expected the misplaced theme guard to fail once, got: ${JSON.stringify(themeTooLateErrors)}`,
  )
  assert.ok(/not before/.test(themeTooLateErrors[0]!))

  const missingFnErrors = checkSerendipityVoiceActionGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 3)
  assert.ok(
    missingFnErrors.every((e) => /Could not find a function named/.test(e)),
  )

  console.log(
    'Serendipity Voice action guard self-test passed: buggy fixtures fail, ' +
      'the fixed fixture passes, a misplaced-guard fixture fails, and a ' +
      'missing-function fixture fails clearly for all three target ' +
      'functions.',
  )
}

run()
