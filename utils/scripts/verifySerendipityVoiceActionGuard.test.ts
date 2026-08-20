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

import {
  checkSerendipityVoiceActionGuard,
  checkSerendipityVoiceArtAckGuard,
  checkSerendipityVoiceErrorReportingGuard,
  checkSerendipityVoiceRedundantOnSurfacePlacementGuard,
  checkSerendipityVoiceToggleOffSurfacePlacementGuard,
} from './verifySerendipityVoiceActionGuard.js'

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

// --- Fixtures for checkSerendipityVoiceErrorReportingGuard() (t-021) ---
// Distinct from the fixtures above: these exercise the "the command reached
// the right function, but the requested effect/theme doesn't exist"
// no-match branches, not the target/action-mismatch guards.

function errorReportingFixture(opts: {
  noMatchBranch: string
  successPostAck: string
  themeFailureBranch: string
}): string {
  return `
    function applyCommand(command: VoiceBusCommand): void {
      const effectId = resolveEffectId(command)
      ${opts.noMatchBranch}

      const active = animationStore.isScreenEffectActive(effectId)
      if (command.action === 'on' && !active) animationStore.toggleScreenEffect(effectId)

      void postAck(\`Serendipity view: \${effectId} is now on.\`)
    }

    function applyThemeCommand(command: VoiceBusCommand): void {
      const theme = (command.theme ?? '').trim()

      void themeStore.setActiveTheme(theme).then((result) => {
        if (result.success) {
          lastAppliedText.value = \`theme → \${theme}\`
          pushLocalMessage('system', \`Applied: theme set to \${theme}.\`)
          ${opts.successPostAck}
        } ${opts.themeFailureBranch}
      })
    }
  `
}

const NO_MATCH_FIXED = `if (!effectId) {
        const message = \`Could not match animation "\${command.effect ?? command.effectId ?? 'unknown'}".\`
        lastError.value = message
        pushLocalMessage('system', message)
        return
      }`

const NO_MATCH_MISSING_RETURN = `if (!effectId) {
        const message = \`Could not match animation "\${command.effect ?? command.effectId ?? 'unknown'}".\`
        lastError.value = message
        pushLocalMessage('system', message)
      }`

const NO_MATCH_MISSING_LASTERROR = `if (!effectId) {
        const message = \`Could not match animation "\${command.effect ?? command.effectId ?? 'unknown'}".\`
        pushLocalMessage('system', message)
        return
      }`

const NO_MATCH_FALSE_ACK = `if (!effectId) {
        const message = \`Could not match animation "\${command.effect ?? command.effectId ?? 'unknown'}".\`
        lastError.value = message
        pushLocalMessage('system', message)
        void postAck('Serendipity view: effect is now on.')
        return
      }`

const SUCCESS_POSTACK = `void postAck(\`Serendipity view: theme is now \${theme}.\`)`

const THEME_FAILURE_FIXED = `else {
          const message = result.message ?? \`Unknown theme "\${theme}".\`
          lastError.value = message
          pushLocalMessage('system', message)
        }`

const THEME_FAILURE_MISSING_LASTERROR = `else {
          const message = result.message ?? \`Unknown theme "\${theme}".\`
          pushLocalMessage('system', message)
        }`

const THEME_FAILURE_FALSE_ACK = `else {
          const message = result.message ?? \`Unknown theme "\${theme}".\`
          lastError.value = message
          pushLocalMessage('system', message)
          void postAck(\`Serendipity view: theme is now \${theme}.\`)
        }`

const FIXED_ERROR_REPORTING = errorReportingFixture({
  noMatchBranch: NO_MATCH_FIXED,
  successPostAck: SUCCESS_POSTACK,
  themeFailureBranch: THEME_FAILURE_FIXED,
})

const NO_MATCH_MISSING_RETURN_FIXTURE = errorReportingFixture({
  noMatchBranch: NO_MATCH_MISSING_RETURN,
  successPostAck: SUCCESS_POSTACK,
  themeFailureBranch: THEME_FAILURE_FIXED,
})

const NO_MATCH_MISSING_LASTERROR_FIXTURE = errorReportingFixture({
  noMatchBranch: NO_MATCH_MISSING_LASTERROR,
  successPostAck: SUCCESS_POSTACK,
  themeFailureBranch: THEME_FAILURE_FIXED,
})

const NO_MATCH_FALSE_ACK_FIXTURE = errorReportingFixture({
  noMatchBranch: NO_MATCH_FALSE_ACK,
  successPostAck: SUCCESS_POSTACK,
  themeFailureBranch: THEME_FAILURE_FIXED,
})

const THEME_MISSING_ELSE_FIXTURE = errorReportingFixture({
  noMatchBranch: NO_MATCH_FIXED,
  successPostAck: SUCCESS_POSTACK,
  themeFailureBranch: '',
})

const THEME_MISSING_LASTERROR_FIXTURE = errorReportingFixture({
  noMatchBranch: NO_MATCH_FIXED,
  successPostAck: SUCCESS_POSTACK,
  themeFailureBranch: THEME_FAILURE_MISSING_LASTERROR,
})

const THEME_FALSE_ACK_FIXTURE = errorReportingFixture({
  noMatchBranch: NO_MATCH_FIXED,
  successPostAck: '',
  themeFailureBranch: THEME_FAILURE_FALSE_ACK,
})

function runErrorReportingSelfTest(): void {
  const fixedErrors = checkSerendipityVoiceErrorReportingGuard(
    FIXED_ERROR_REPORTING,
  )
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed error-reporting fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const missingReturnErrors = checkSerendipityVoiceErrorReportingGuard(
    NO_MATCH_MISSING_RETURN_FIXTURE,
  )
  assert.equal(missingReturnErrors.length, 1)
  assert.ok(/no longer returns/.test(missingReturnErrors[0]!))

  const missingLastErrorErrors = checkSerendipityVoiceErrorReportingGuard(
    NO_MATCH_MISSING_LASTERROR_FIXTURE,
  )
  assert.equal(missingLastErrorErrors.length, 1)
  assert.ok(/no longer sets lastError\.value/.test(missingLastErrorErrors[0]!))

  const falseAckErrors = checkSerendipityVoiceErrorReportingGuard(
    NO_MATCH_FALSE_ACK_FIXTURE,
  )
  assert.equal(falseAckErrors.length, 1)
  assert.ok(/calls postAck\(\)/.test(falseAckErrors[0]!))

  const missingElseErrors = checkSerendipityVoiceErrorReportingGuard(
    THEME_MISSING_ELSE_FIXTURE,
  )
  assert.equal(missingElseErrors.length, 1)
  assert.ok(/no longer has an `else` branch/.test(missingElseErrors[0]!))

  const themeMissingLastErrorErrors = checkSerendipityVoiceErrorReportingGuard(
    THEME_MISSING_LASTERROR_FIXTURE,
  )
  assert.equal(themeMissingLastErrorErrors.length, 1)
  assert.ok(
    /failure branch no longer sets lastError\.value/.test(
      themeMissingLastErrorErrors[0]!,
    ),
  )

  const themeFalseAckErrors = checkSerendipityVoiceErrorReportingGuard(
    THEME_FALSE_ACK_FIXTURE,
  )
  assert.equal(themeFalseAckErrors.length, 1)
  assert.ok(
    /calls postAck\(\) outside the `if \(result\.success\)` branch/.test(
      themeFalseAckErrors[0]!,
    ),
  )

  const missingFnErrors = checkSerendipityVoiceErrorReportingGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 2)
  assert.ok(
    missingFnErrors.every((e) => /Could not find a function named/.test(e)),
  )

  console.log(
    'Serendipity Voice error-reporting guard self-test passed: the ' +
      'unmatched-effect and unknown-theme no-match branches still fail ' +
      'correctly (report + early return / no false ack) across all tested ' +
      'regressions, and the fixed fixture passes clean.',
  )
}

// --- Fixtures for checkSerendipityVoiceArtAckGuard() (t-015, 2026-08-18) ---
// Distinct from all fixtures above: this exercises the "success path never
// acknowledges" gap on applyArtCommand(), not action/target mismatches or
// false-success no-match branches.

function artAckFixture(successAck: string): string {
  return `
    function applyArtCommand(command: VoiceBusCommand): void {
      if (command.action !== 'draft') {
        pushLocalMessage('system', \`Ignored unsupported art action: \${command.action}\`)
        return
      }

      const request = { id: command.id, prompt: command.prompt ?? command.spokenText, at: command.at }
      artRequests.value.push(request)
      lastAppliedText.value = \`art draft: \${request.prompt}\`
      pushLocalMessage('system', \`Art draft received: \${request.prompt}\`)
      ${successAck}
    }
  `
}

const ART_ACK_FIXED = artAckFixture(
  'void postAck(`Serendipity view: art draft received for "${request.prompt}".`)',
)
const ART_ACK_MISSING = artAckFixture('')

function runArtAckSelfTest(): void {
  const fixedErrors = checkSerendipityVoiceArtAckGuard(ART_ACK_FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed art-ack fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const missingErrors = checkSerendipityVoiceArtAckGuard(ART_ACK_MISSING)
  assert.equal(missingErrors.length, 1)
  assert.ok(/no longer calls postAck\(\)/.test(missingErrors[0]!))

  const missingFnErrors = checkSerendipityVoiceArtAckGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 1)
  assert.ok(/Could not find a function named/.test(missingFnErrors[0]!))

  console.log(
    'Serendipity Voice art-ack guard self-test passed: a successful art ' +
      'draft that never calls postAck() fails, the fixed fixture passes, ' +
      'and a missing-function fixture fails clearly.',
  )
}

// --- Fixtures for checkSerendipityVoiceToggleOffSurfacePlacementGuard()
// (t-015, 2026-08-19 cycle) ---
// Distinct from every fixture above: this exercises the surface-placement
// gate that follows the on/off/toggle branch, not action/target mismatches,
// false no-match successes, or a missing acknowledgement.

function togglePlacementFixture(opts: {
  toggleBranch: string
  placementGate: string
}): string {
  return `
    function applyCommand(command: VoiceBusCommand): void {
      if (command.target !== 'animation') {
        pushLocalMessage('system', \`Ignored unsupported command target: \${command.target}\`)
        return
      }

      const effectId = resolveEffectId(command)
      if (!effectId) {
        return
      }

      const active = animationStore.isScreenEffectActive(effectId)
      if (command.action === 'on' && !active) animationStore.toggleScreenEffect(effectId)
      else if (command.action === 'off' && active) animationStore.toggleScreenEffect(effectId)
      ${opts.toggleBranch}

      ${opts.placementGate}
    }
  `
}

const TOGGLE_BRANCH_FIXED = `else if (command.action === 'toggle')
        animationStore.toggleScreenEffect(effectId)`

// Pre-fix (alexa-integration/t-015's original 2026-08-18 cycle shape): gates
// setSurfacePlacement() on the literal action string, so a 'toggle' that
// flips an active effect off still forces its fx region to front placement.
const PLACEMENT_GATE_BUGGY_LITERAL_OFF = `if (command.action !== 'off') {
        animationStore.setSurfacePlacement(normalizeRegion(command.surface), 'front')
      }`

// Fixed: gates on the effect's actual resulting state instead.
const PLACEMENT_GATE_FIXED = `const isNowActive = animationStore.isScreenEffectActive(effectId)
      if (isNowActive) {
        animationStore.setSurfacePlacement(normalizeRegion(command.surface), 'front')
      }`

// Hypothetical future regression: the re-check is dropped entirely and
// setSurfacePlacement() runs unconditionally -- no literal-action check
// either, just a different way to reintroduce the same false-front-placement
// bug (and worse, for the literal 'off' case too).
const PLACEMENT_GATE_UNCONDITIONAL = `animationStore.setSurfacePlacement(normalizeRegion(command.surface), 'front')`

const TOGGLE_PLACEMENT_FIXED = togglePlacementFixture({
  toggleBranch: TOGGLE_BRANCH_FIXED,
  placementGate: PLACEMENT_GATE_FIXED,
})

const TOGGLE_PLACEMENT_BUGGY = togglePlacementFixture({
  toggleBranch: TOGGLE_BRANCH_FIXED,
  placementGate: PLACEMENT_GATE_BUGGY_LITERAL_OFF,
})

const TOGGLE_PLACEMENT_UNCONDITIONAL = togglePlacementFixture({
  toggleBranch: TOGGLE_BRANCH_FIXED,
  placementGate: PLACEMENT_GATE_UNCONDITIONAL,
})

function runToggleOffSurfacePlacementSelfTest(): void {
  const fixedErrors = checkSerendipityVoiceToggleOffSurfacePlacementGuard(
    TOGGLE_PLACEMENT_FIXED,
  )
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed toggle-placement fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkSerendipityVoiceToggleOffSurfacePlacementGuard(
    TOGGLE_PLACEMENT_BUGGY,
  )
  assert.equal(
    buggyErrors.length,
    2,
    `expected the literal-'off' buggy fixture to fail twice (buggy gate + missing recheck), got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /still gates setSurfacePlacement/.test(e)))
  assert.ok(buggyErrors.some((e) => /no longer re-checks/.test(e)))

  const unconditionalErrors =
    checkSerendipityVoiceToggleOffSurfacePlacementGuard(
      TOGGLE_PLACEMENT_UNCONDITIONAL,
    )
  assert.equal(
    unconditionalErrors.length,
    1,
    `expected the unconditional-placement fixture to fail once, got: ${JSON.stringify(unconditionalErrors)}`,
  )
  assert.ok(/no longer re-checks/.test(unconditionalErrors[0]!))

  const missingFnErrors = checkSerendipityVoiceToggleOffSurfacePlacementGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 1)
  assert.ok(/Could not find a function named/.test(missingFnErrors[0]!))

  console.log(
    'Serendipity Voice toggle-off surface-placement guard self-test ' +
      'passed: the literal-action buggy fixture fails on both the gate and ' +
      'the missing recheck, an unconditional-placement regression fails on ' +
      'the missing recheck, the fixed fixture passes, and a ' +
      'missing-function fixture fails clearly.',
  )
}

// --- Fixtures for checkSerendipityVoiceRedundantOnSurfacePlacementGuard()
// (t-015, 2026-08-20 cycle) ---
// Distinct from the toggle-off fixtures above: those exercise the gate's
// *condition* (literal action string vs. resulting state); these exercise
// whether the gate also requires an actual state *transition*, not just a
// resulting state that happens to already hold.

function redundantOnPlacementFixture(opts: {
  toggleBranches: string
  placementGate: string
}): string {
  return `
    function applyCommand(command: VoiceBusCommand): void {
      if (command.target !== 'animation') {
        pushLocalMessage('system', \`Ignored unsupported command target: \${command.target}\`)
        return
      }

      const effectId = resolveEffectId(command)
      if (!effectId) {
        return
      }

      const active = animationStore.isScreenEffectActive(effectId)
      let stateChanged = false
      ${opts.toggleBranches}

      const isNowActive = animationStore.isScreenEffectActive(effectId)
      ${opts.placementGate}
    }
  `
}

// Fixed: every on/off/toggle branch tracks whether it actually toggled the
// effect, and the placement gate requires both that transition and the
// resulting active state.
const TOGGLE_BRANCHES_STATE_TRACKED = `if (command.action === 'on' && !active) {
        animationStore.toggleScreenEffect(effectId)
        stateChanged = true
      } else if (command.action === 'off' && active) {
        animationStore.toggleScreenEffect(effectId)
        stateChanged = true
      } else if (command.action === 'toggle') {
        animationStore.toggleScreenEffect(effectId)
        stateChanged = true
      }`

const PLACEMENT_GATE_STATE_CHANGE_FIXED = `if (stateChanged && isNowActive) {
        animationStore.setSurfacePlacement(normalizeRegion(command.surface), 'front')
      }`

// Pre-fix (t-020's shape, before this t-015 2026-08-20 extension): no branch
// tracks a transition at all, and the gate keys only off the resulting
// active state -- so a redundant "turn X on" while X is already active (and
// manually placed 'behind' via screen-fx.vue's Coverage Zones panel) still
// forces the region to 'front' even though nothing changed.
const TOGGLE_BRANCHES_NO_TRACKING = `if (command.action === 'on' && !active) animationStore.toggleScreenEffect(effectId)
      else if (command.action === 'off' && active) animationStore.toggleScreenEffect(effectId)
      else if (command.action === 'toggle') animationStore.toggleScreenEffect(effectId)`

const PLACEMENT_GATE_ISNOWACTIVE_ONLY = `if (isNowActive) {
        animationStore.setSurfacePlacement(normalizeRegion(command.surface), 'front')
      }`

const REDUNDANT_ON_PLACEMENT_FIXED = redundantOnPlacementFixture({
  toggleBranches: TOGGLE_BRANCHES_STATE_TRACKED,
  placementGate: PLACEMENT_GATE_STATE_CHANGE_FIXED,
})

const REDUNDANT_ON_PLACEMENT_BUGGY = redundantOnPlacementFixture({
  toggleBranches: TOGGLE_BRANCHES_NO_TRACKING,
  placementGate: PLACEMENT_GATE_ISNOWACTIVE_ONLY,
})

// Partial regression: stateChanged is tracked (so the tracking check
// passes), but the gate was never updated to actually use it -- a plausible
// half-applied edit that would silently reintroduce the same bug.
const REDUNDANT_ON_PLACEMENT_PARTIAL_REGRESSION = redundantOnPlacementFixture({
  toggleBranches: TOGGLE_BRANCHES_STATE_TRACKED,
  placementGate: PLACEMENT_GATE_ISNOWACTIVE_ONLY,
})

function runRedundantOnSurfacePlacementSelfTest(): void {
  const fixedErrors = checkSerendipityVoiceRedundantOnSurfacePlacementGuard(
    REDUNDANT_ON_PLACEMENT_FIXED,
  )
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed redundant-on fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const buggyErrors = checkSerendipityVoiceRedundantOnSurfacePlacementGuard(
    REDUNDANT_ON_PLACEMENT_BUGGY,
  )
  assert.equal(
    buggyErrors.length,
    2,
    `expected the untracked pre-fix fixture to fail twice (no tracking + no gate use), got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => /no longer sets a `stateChanged = true`/.test(e)),
  )
  assert.ok(
    buggyErrors.some((e) => /no longer gates setSurfacePlacement/.test(e)),
  )

  const partialErrors = checkSerendipityVoiceRedundantOnSurfacePlacementGuard(
    REDUNDANT_ON_PLACEMENT_PARTIAL_REGRESSION,
  )
  assert.equal(
    partialErrors.length,
    1,
    `expected the tracked-but-unused fixture to fail once, got: ${JSON.stringify(partialErrors)}`,
  )
  assert.ok(/no longer gates setSurfacePlacement/.test(partialErrors[0]!))

  const missingFnErrors = checkSerendipityVoiceRedundantOnSurfacePlacementGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 1)
  assert.ok(/Could not find a function named/.test(missingFnErrors[0]!))

  console.log(
    'Serendipity Voice redundant-on surface-placement guard self-test ' +
      'passed: the untracked pre-fix fixture fails on both the missing ' +
      'tracking and the missing gate use, a tracked-but-unused-gate partial ' +
      'regression fails once, the fixed fixture passes, and a ' +
      'missing-function fixture fails clearly.',
  )
}

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
runErrorReportingSelfTest()
runArtAckSelfTest()
runToggleOffSurfacePlacementSelfTest()
runRedundantOnSurfacePlacementSelfTest()
