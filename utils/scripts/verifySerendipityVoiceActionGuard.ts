// /utils/scripts/verifySerendipityVoiceActionGuard.ts
//
// Regression guard (alexa-integration/t-015, extended by t-020). Every
// applyCommand()-dispatched function in stores/serendipityVoiceStore.ts
// shares the same VoiceBusCommand.action union ('on' | 'off' | 'toggle' |
// 'clear' | 'set' | 'draft'), but only a subset of those actions are
// meaningful for any given target:
//   - applyCommand() (target 'animation'): only 'on' | 'off' | 'toggle'
//     ('clear' is handled earlier and returns; 'set' | 'draft' are theme/
//     art-only)
//   - applyThemeCommand() (target 'theme'): only 'set'
//   - applyArtCommand() (target 'art'): only 'draft'
// Before t-015's fix, target === 'animation' had no equivalent guard: a
// command with action 'set' or 'draft' would resolve an effect id, skip
// every on/off/toggle branch (so no effect state actually changed), then
// still fall through to the unconditional setSurfacePlacement() call and
// the verb ternary's default of "on" -- reporting a false "Applied:
// <effect> on." to the message feed and the voice ack even though nothing
// toggled. t-020 found the identical gap on the other two targets:
// applyThemeCommand() and applyArtCommand() never checked command.action at
// all, so a mis-targeted on/off/toggle/clear command reaching either of
// them would still report a false "Applied: theme set to X." or "Art draft
// received." even though the action made no sense for that target.
//
// Fixed by rejecting any out-of-scope action with the same "ignored, not
// applied" shape already used for unsupported targets, before any of the
// three functions mutates state or reports success.
//
// This asserts the textual shape of each fix stays in place: each target
// function in TARGET_FUNCTIONS contains a guard rejecting action values
// outside its allowed set, placed before the function's real work runs,
// that pushes a message and returns rather than falling through --
// deliberately scoped to these three functions/bugs, mirroring this
// project's other narrow textual guards over a general-purpose static
// analyzer.
//
// Extended (alexa-integration/t-021) with a second, related contract:
// checkSerendipityVoiceErrorReportingGuard() below. t-015/t-020 covered
// action/target *mismatches* (a command that should never have reached this
// function). This extension covers the two "the command reached the right
// function, but the requested effect/theme doesn't exist" branches, which
// are a distinct failure mode with their own false-success risk:
//   - applyCommand(): resolveEffectId() returning null for an unmatched
//     spoken effect name (e.g. "turn on qwerty").
//   - applyThemeCommand(): themeStore.setActiveTheme() resolving with
//     result.success === false for an unknown theme name.
// Both branches were read fresh against the live store and are currently
// correct (early `return` after the no-match report; a proper if/success
// else/failure split with postAck() gated inside the success arm only) --
// this guard exists so a future edit that quietly drops the early return,
// the lastError/pushLocalMessage report, or the postAck() gating cannot
// reintroduce a false "Applied"/"is now X" acknowledgement the way t-015's
// and t-020's bugs did for the mismatched-action case.
//
// Extended again (alexa-integration/t-015, 2026-08-18 cycle) with a third,
// distinct contract: checkSerendipityVoiceArtAckGuard() below. The two
// contracts above are both about *false* acknowledgements. This one is the
// opposite gap: a *missing* one. Every other successful command target
// (clear, animation on/off/toggle, theme set) calls postAck() so the voice
// side gets a spoken confirmation; applyArtCommand()'s success path pushed
// the draft and a local feed message but never called postAck() at all, so
// a spoken "generate art of X" request that fully succeeded still got no
// acknowledgement back through the relay. Fixed by calling postAck() the
// same way the other three success paths do; this guard keeps a future edit
// from silently dropping that call again.
//
// Extended a fourth time (alexa-integration/t-015, 2026-08-19 cycle) with
// checkSerendipityVoiceToggleOffSurfacePlacementGuard() below -- a kaizen
// lead filed by the prior cycle. applyCommand()'s animation branch gated its
// setSurfacePlacement(region, 'front') call on `command.action !== 'off'`,
// i.e. the literal spoken action string, not on whether the effect actually
// ended up active. A 'toggle' command that flipped an already-active effect
// off ends up exactly as inactive as a literal 'off' does, but the literal
// check let it fall through and still force that fx region to front
// placement -- bringing a now-empty region to the front for no reason,
// something the literal-'off' path never did. Fixed by re-checking
// isScreenEffectActive(effectId) *after* the on/off/toggle branch runs and
// gating setSurfacePlacement() on that resulting boolean instead of the
// action string, so 'toggle'-to-off is treated the same as literal 'off'.
//
// Extended a fifth time (alexa-integration/t-015, 2026-08-20 cycle) with
// checkSerendipityVoiceRedundantOnSurfacePlacementGuard() below -- the
// t-021 cycle's own kaizen lead, left as an open question rather than a
// confirmed bug: "applyCommand()'s 'on' branch always runs
// setSurfacePlacement(region, 'front') regardless of whether the effect was
// already active and already placed 'behind' from an earlier command...
// worth confirming this is intentional... vs. investigating whether a
// 'behind'-placement command path exists that this would fight against."
// It does: components/screenfx/screen-fx.vue's "Coverage zones" panel lets a
// user manually set any region's placement to 'behind' via
// animationStore.setSurfacePlacement() directly, independent of voice
// commands. Confirmed the bug: gating setSurfacePlacement() on the effect's
// resulting active state alone (isNowActive, the t-020 fix above) still
// forced 'front' on a redundant "turn X on" while X was already active --
// the command caused no actual state transition, so it had no reason to
// touch placement at all. Fixed by tracking whether the on/off/toggle
// branch actually toggled the effect (stateChanged) and requiring both
// stateChanged and isNowActive before calling setSurfacePlacement(), so an
// idempotent repeat of an already-applied action no longer clobbers a
// user's manual 'behind' placement for that region.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/serendipityVoiceStore.ts')

function extractFunctionSource(content: string, name: string): string | null {
  const signature = new RegExp(
    `^\\s*(?:async\\s+)?function ${name}\\([^)]*\\)[^{]*\\{`,
    'm',
  )
  const match = signature.exec(content)
  if (!match) return null

  const braceOpen = match.index + match[0].length - 1
  let depth = 0
  let i = braceOpen
  for (; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) break
    }
  }
  if (depth !== 0) return null
  return content.slice(braceOpen, i + 1)
}

type TargetFunction = {
  name: string
  // A regex matching the guard that must appear in this function's body,
  // rejecting every action value outside the ones meaningful for this
  // target.
  guardPattern: RegExp
  // Human-readable description of what the guard protects, used in error
  // messages.
  falseSuccessDescription: string
  // Anchors the guard must fall between (both optional). `mustAppearAfter`
  // is a pattern the guard must appear after; `mustAppearBefore` is a
  // pattern the guard must appear before. Used to catch a guard that
  // exists but runs too late to prevent the false-success fall-through.
  mustAppearAfter?: RegExp
  mustAppearBefore?: RegExp
}

const TARGET_FUNCTIONS: TargetFunction[] = [
  {
    name: 'applyCommand',
    guardPattern:
      /command\.action\s*!==\s*'on'\s*&&\s*command\.action\s*!==\s*'off'\s*&&\s*command\.action\s*!==\s*'toggle'/,
    falseSuccessDescription:
      'applyCommand() no longer rejects command.action values outside ' +
      "'on' / 'off' / 'toggle' before applying an animation command -- " +
      "without it, a command with action 'set' or 'draft' targeting " +
      "'animation' resolves an effect id, skips every on/off/toggle " +
      'branch (so nothing actually changes), then still falls through to ' +
      'setSurfacePlacement() and a default "on" verb, reporting a false ' +
      '"Applied: <effect> on." to the feed and the voice ack even though ' +
      'no effect state changed.',
    mustAppearAfter: /command\.action\s*===\s*'clear'/,
    mustAppearBefore: /resolveEffectId\(command\)/,
  },
  {
    name: 'applyThemeCommand',
    guardPattern: /command\.action\s*!==\s*'set'/,
    falseSuccessDescription:
      'applyThemeCommand() no longer rejects command.action values other ' +
      "than 'set' -- without it, a mis-targeted on/off/toggle/clear " +
      'command carrying a stale/leftover command.theme value still falls ' +
      'through to setActiveTheme() and can report a false "Applied: theme ' +
      'set to X." even though the action made no sense for this target.',
    mustAppearBefore: /setActiveTheme\(theme\)/,
  },
  {
    name: 'applyArtCommand',
    guardPattern: /command\.action\s*!==\s*'draft'/,
    falseSuccessDescription:
      'applyArtCommand() no longer rejects command.action values other ' +
      "than 'draft' -- without it, a mis-targeted on/off/toggle/clear/set " +
      'command still pushes a spurious entry onto artRequests and reports ' +
      'a false "Art draft received." even though the action made no sense ' +
      'for this target.',
    mustAppearBefore: /artRequests\.value\.push\(request\)/,
  },
]

// Checks the fix's exact shape against the full source text of a file
// containing these function names. Exported so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real store.
export function checkSerendipityVoiceActionGuard(content: string): string[] {
  const errors: string[] = []

  for (const target of TARGET_FUNCTIONS) {
    const body = extractFunctionSource(content, target.name)
    if (!body) {
      errors.push(
        `Could not find a function named ${target.name}() -- has it been ` +
          'renamed, removed, or restructured? If so, this guard (and the ' +
          'false-success-on-mismatched-action bug it protects against) ' +
          'needs to move with it.',
      )
      continue
    }

    const guardMatch = body.match(target.guardPattern)

    if (target.mustAppearAfter) {
      const anchorIndex = body.search(target.mustAppearAfter)
      if (anchorIndex === -1) {
        errors.push(
          `${target.name}() no longer contains the expected anchor ` +
            `pattern (${target.mustAppearAfter}) -- has its dispatch shape ` +
            'changed? This guard assumes that structure to locate the ' +
            'action-mismatch check.',
        )
      }
    }

    if (target.mustAppearBefore) {
      const anchorIndex = body.search(target.mustAppearBefore)
      if (anchorIndex === -1) {
        errors.push(
          `${target.name}() no longer contains the expected anchor ` +
            `pattern (${target.mustAppearBefore}) -- has its dispatch ` +
            'shape changed? This guard assumes that structure to locate ' +
            'the action-mismatch check.',
        )
      }
    }

    if (!guardMatch) {
      errors.push(target.falseSuccessDescription)
      continue
    }

    const afterIndex = target.mustAppearAfter
      ? body.search(target.mustAppearAfter)
      : -1
    const beforeIndex = target.mustAppearBefore
      ? body.search(target.mustAppearBefore)
      : -1

    if (
      target.mustAppearAfter &&
      afterIndex !== -1 &&
      !(guardMatch.index! > afterIndex)
    ) {
      errors.push(
        `${target.name}() contains the action-mismatch guard, but not ` +
          `after the expected anchor (${target.mustAppearAfter}) -- it ` +
          'must run after that point so the guard actually has the ' +
          'context it needs.',
      )
    }

    if (
      target.mustAppearBefore &&
      beforeIndex !== -1 &&
      !(guardMatch.index! < beforeIndex)
    ) {
      errors.push(
        `${target.name}() contains the action-mismatch guard, but not ` +
          `before the expected anchor (${target.mustAppearBefore}) -- it ` +
          'must run before any state mutation or success report, so a ' +
          'mismatched action never has a chance to fall through to a ' +
          'false "applied" message.',
      )
    }
  }

  return errors
}

// Searches `text` for `pattern` starting at `fromIndex`, returning an index
// relative to the start of `text` (not `fromIndex`) so callers can compare
// it directly against other absolute-in-`text` indices. -1 if `fromIndex`
// is itself -1 (the anchor it depends on was never found) or no match.
function searchAfter(text: string, pattern: RegExp, fromIndex: number): number {
  if (fromIndex < 0) return -1
  const relative = text.slice(fromIndex).search(pattern)
  return relative === -1 ? -1 : relative + fromIndex
}

// Checks the "requested effect/theme doesn't exist" no-match branches of
// applyCommand() and applyThemeCommand() -- see the file-header addendum
// above (alexa-integration/t-021) for what these protect against.
export function checkSerendipityVoiceErrorReportingGuard(
  content: string,
): string[] {
  const errors: string[] = []

  // --- applyCommand(): resolveEffectId() returning null ---
  const commandBody = extractFunctionSource(content, 'applyCommand')
  if (!commandBody) {
    errors.push(
      'Could not find a function named applyCommand() -- has it been ' +
        'renamed, removed, or restructured? If so, this guard (and the ' +
        'unmatched-effect error-reporting contract it protects) needs to ' +
        'move with it.',
    )
  } else {
    const resolveIndex = commandBody.search(
      /const effectId = resolveEffectId\(command\)/,
    )
    if (resolveIndex === -1) {
      errors.push(
        'applyCommand() no longer resolves `const effectId = ' +
          'resolveEffectId(command)` -- has the animation-resolution shape ' +
          'changed? This guard assumes that structure to locate the ' +
          'no-match branch.',
      )
    } else {
      const guardIndex = searchAfter(
        commandBody,
        /if\s*\(\s*!effectId\s*\)\s*\{/,
        resolveIndex,
      )
      const activeIndex = searchAfter(
        commandBody,
        /animationStore\.isScreenEffectActive\(effectId\)/,
        resolveIndex,
      )

      if (guardIndex === -1) {
        errors.push(
          'applyCommand() no longer contains `if (!effectId) { ... }` ' +
            'right after resolving the effect id -- without it, a spoken ' +
            'effect resolveEffectId() cannot match falls through with ' +
            'effectId === null into isScreenEffectActive()/' +
            'toggleScreenEffect() instead of reporting "Could not match ' +
            'animation ...".',
        )
      } else if (activeIndex !== -1 && guardIndex >= activeIndex) {
        errors.push(
          "applyCommand()'s `if (!effectId)` guard runs after " +
            'isScreenEffectActive(effectId) instead of before it -- it ' +
            'must gate the null-effectId case before that value is used.',
        )
      } else {
        const returnIndex = searchAfter(commandBody, /\breturn\b/, guardIndex)
        const lastErrorIndex = searchAfter(
          commandBody,
          /lastError\.value\s*=/,
          guardIndex,
        )
        const pushMessageIndex = searchAfter(
          commandBody,
          /pushLocalMessage\(/,
          guardIndex,
        )
        const boundary = activeIndex === -1 ? commandBody.length : activeIndex

        if (returnIndex === -1 || returnIndex >= boundary) {
          errors.push(
            "applyCommand()'s no-match branch no longer returns before " +
              'isScreenEffectActive(effectId) runs -- without an early ' +
              'return, a null effectId would still fall through to the ' +
              'toggle/placement/ack logic below it.',
          )
        }
        if (lastErrorIndex === -1 || lastErrorIndex >= boundary) {
          errors.push(
            "applyCommand()'s no-match branch no longer sets " +
              'lastError.value -- a spoken effect that cannot be matched ' +
              'would report nothing to lastError, silently hiding the ' +
              'failure from any UI that surfaces it.',
          )
        }
        if (pushMessageIndex === -1 || pushMessageIndex >= boundary) {
          errors.push(
            "applyCommand()'s no-match branch no longer calls " +
              'pushLocalMessage() -- a spoken effect that cannot be ' +
              'matched would report nothing to the message feed.',
          )
        }
        const postAckIndex = searchAfter(commandBody, /postAck\(/, guardIndex)
        if (postAckIndex !== -1 && postAckIndex < boundary) {
          errors.push(
            "applyCommand()'s no-match branch calls postAck() -- a " +
              'spoken effect that could not be matched must not send a ' +
              'false "effect is now on/off" acknowledgement back to the ' +
              'voice assistant.',
          )
        }
      }
    }
  }

  // --- applyThemeCommand(): setActiveTheme() resolving with success: false ---
  const themeBody = extractFunctionSource(content, 'applyThemeCommand')
  if (!themeBody) {
    errors.push(
      'Could not find a function named applyThemeCommand() -- has it been ' +
        'renamed, removed, or restructured? If so, this guard (and the ' +
        'unknown-theme error-reporting contract it protects) needs to move ' +
        'with it.',
    )
  } else {
    const thenIndex = themeBody.search(
      /setActiveTheme\(theme\)\.then\(\s*\(result\)\s*=>\s*\{/,
    )
    if (thenIndex === -1) {
      errors.push(
        'applyThemeCommand() no longer calls ' +
          'themeStore.setActiveTheme(theme).then((result) => { ... }) -- ' +
          'has the theme-application shape changed? This guard assumes ' +
          'that structure to locate the success/failure branches.',
      )
    } else {
      const successIndex = searchAfter(
        themeBody,
        /if\s*\(\s*result\.success\s*\)\s*\{/,
        thenIndex,
      )
      if (successIndex === -1) {
        errors.push(
          'applyThemeCommand() no longer branches on ' +
            '`if (result.success)` -- without it, a failed ' +
            'setActiveTheme() call (unknown theme) has no distinct ' +
            'success/failure path to report through.',
        )
      } else {
        const elseIndex = searchAfter(themeBody, /\}\s*else\s*\{/, successIndex)
        if (elseIndex === -1) {
          errors.push(
            'applyThemeCommand() no longer has an `else` branch after ' +
              '`if (result.success)` -- without it, a failed ' +
              'setActiveTheme() call (unknown theme) reports nothing at ' +
              'all instead of the "Unknown theme ..." message.',
          )
        } else {
          const lastErrorIndex = searchAfter(
            themeBody,
            /lastError\.value\s*=/,
            elseIndex,
          )
          const pushMessageIndex = searchAfter(
            themeBody,
            /pushLocalMessage\(/,
            elseIndex,
          )
          if (lastErrorIndex === -1) {
            errors.push(
              "applyThemeCommand()'s failure branch no longer sets " +
                'lastError.value -- an unknown/rejected theme would ' +
                'report nothing to lastError.',
            )
          }
          if (pushMessageIndex === -1) {
            errors.push(
              "applyThemeCommand()'s failure branch no longer calls " +
                'pushLocalMessage() -- an unknown/rejected theme would ' +
                'report nothing to the message feed.',
            )
          }
        }

        const postAckIndex = searchAfter(themeBody, /postAck\(/, successIndex)
        if (postAckIndex === -1) {
          errors.push(
            "applyThemeCommand()'s success branch no longer calls " +
              'postAck() -- this guard expects the voice-ack call to stay ' +
              'gated inside `if (result.success)` so it can tell the ' +
              'success and failure branches apart.',
          )
        } else if (elseIndex !== -1 && postAckIndex >= elseIndex) {
          errors.push(
            'applyThemeCommand() calls postAck() outside the ' +
              '`if (result.success)` branch -- an unknown/rejected theme ' +
              'must not send a false "theme is now X" acknowledgement back ' +
              'to the voice assistant.',
          )
        }
      }
    }
  }

  return errors
}

// Checks the "successful command, but no voice acknowledgement" gap --
// see the file-header addendum above (alexa-integration/t-015, 2026-08-18
// cycle) for what this protects against. Distinct from both guards above:
// those catch a *false* postAck(); this one catches a *missing* one on
// applyArtCommand()'s only success path.
export function checkSerendipityVoiceArtAckGuard(content: string): string[] {
  const errors: string[] = []

  const artBody = extractFunctionSource(content, 'applyArtCommand')
  if (!artBody) {
    errors.push(
      'Could not find a function named applyArtCommand() -- has it been ' +
        'renamed, removed, or restructured? If so, this guard (and the ' +
        'missing-acknowledgement contract it protects) needs to move with ' +
        'it.',
    )
    return errors
  }

  const pushIndex = artBody.search(/artRequests\.value\.push\(request\)/)
  if (pushIndex === -1) {
    errors.push(
      'applyArtCommand() no longer contains `artRequests.value.push(' +
        'request)` -- has the draft-recording shape changed? This guard ' +
        'assumes that structure to locate the success path.',
    )
    return errors
  }

  const postAckIndex = searchAfter(artBody, /postAck\(/, pushIndex)
  if (postAckIndex === -1) {
    errors.push(
      "applyArtCommand()'s success path no longer calls postAck() -- " +
        'every other successful command target (clear, animation on/off/' +
        'toggle, theme set) acknowledges back through the relay so the ' +
        'voice side can confirm; a successful art draft must too, or a ' +
        'spoken "generate art of X" request that fully succeeded gets no ' +
        'acknowledgement at all.',
    )
  }

  return errors
}

// Checks the "toggle-to-off still forces front placement" gap -- see the
// file-header addendum above (alexa-integration/t-015, 2026-08-19 cycle) for
// what this protects against. Distinct from every guard above: those cover
// mismatched actions, false no-match successes, and a missing
// acknowledgement; this one covers a surface-placement side effect that
// fires on the wrong condition (the literal action string) instead of the
// effect's actual resulting active state.
export function checkSerendipityVoiceToggleOffSurfacePlacementGuard(
  content: string,
): string[] {
  const errors: string[] = []

  const commandBody = extractFunctionSource(content, 'applyCommand')
  if (!commandBody) {
    errors.push(
      'Could not find a function named applyCommand() -- has it been ' +
        'renamed, removed, or restructured? If so, this guard (and the ' +
        'toggle-to-off surface-placement contract it protects) needs to ' +
        'move with it.',
    )
    return errors
  }

  const toggleBranchIndex = commandBody.search(
    /else if\s*\(\s*command\.action\s*===\s*'toggle'\s*\)\s*\{?\s*\n?\s*animationStore\.toggleScreenEffect\(effectId\)/,
  )
  if (toggleBranchIndex === -1) {
    errors.push(
      'applyCommand() no longer contains the `else if (command.action === ' +
        "'toggle') animationStore.toggleScreenEffect(effectId)` branch -- " +
        'has the on/off/toggle dispatch shape changed? This guard assumes ' +
        'that structure to locate the surface-placement gate that follows ' +
        'it.',
    )
    return errors
  }

  const placementCallIndex = searchAfter(
    commandBody,
    /animationStore\.setSurfacePlacement\(/,
    toggleBranchIndex,
  )
  if (placementCallIndex === -1) {
    errors.push(
      'applyCommand() no longer calls animationStore.setSurfacePlacement() ' +
        'after the on/off/toggle branch -- has the fx-region-placement step ' +
        'been removed or restructured? This guard assumes that call exists ' +
        'so it can check what gates it.',
    )
    return errors
  }

  const gateWindow = commandBody.slice(toggleBranchIndex, placementCallIndex)

  const buggyLiteralOffGate =
    /if\s*\(\s*command\.action\s*!==\s*'off'\s*\)\s*\{/.test(gateWindow)
  if (buggyLiteralOffGate) {
    errors.push(
      'applyCommand() still gates setSurfacePlacement() on ' +
        "`command.action !== 'off'` -- the literal action string, not the " +
        "effect's actual resulting state. A 'toggle' command that flips an " +
        'already-active effect off ends up exactly as inactive as a ' +
        "literal 'off' does, but this gate lets it fall through and still " +
        'force that fx region to front placement, bringing a now-empty ' +
        'region to the front for no reason.',
    )
  }

  const recheckIndex = searchAfter(
    commandBody,
    /animationStore\.isScreenEffectActive\(effectId\)/,
    toggleBranchIndex,
  )
  if (recheckIndex === -1 || recheckIndex >= placementCallIndex) {
    errors.push(
      'applyCommand() no longer re-checks ' +
        'animationStore.isScreenEffectActive(effectId) after the ' +
        'on/off/toggle branch and before setSurfacePlacement() -- without ' +
        "re-checking the effect's actual resulting state, the placement " +
        'gate has nothing but the literal action string to key off of, ' +
        'reintroducing the toggle-to-off false-front-placement bug.',
    )
  } else {
    // Accepts either `if (isNowActive) {` (this check's own original
    // shape) or `if (stateChanged && isNowActive) {` (the t-015 2026-08-20
    // extension below, checkSerendipityVoiceRedundantOnSurfacePlacementGuard,
    // which further requires an actual state transition) -- either way,
    // isNowActive must still be part of what drives the gate.
    const placementGuardIndex = searchAfter(
      commandBody,
      /if\s*\(\s*(?:stateChanged\s*&&\s*)?isNowActive\s*\)\s*\{/,
      recheckIndex,
    )
    if (
      placementGuardIndex === -1 ||
      placementGuardIndex >= placementCallIndex
    ) {
      errors.push(
        'applyCommand() re-checks isScreenEffectActive(effectId) but does ' +
          'not gate setSurfacePlacement() on `if (isNowActive)` (optionally ' +
          'combined with `stateChanged &&`) right before the call -- the ' +
          'rechecked state must actually drive the gate, not just sit ' +
          'unused alongside the old literal-action check.',
      )
    }
  }

  return errors
}

// Checks the "redundant on/off/toggle still forces placement" gap -- see
// the file-header addendum above (alexa-integration/t-015, 2026-08-20
// cycle) for what this protects against. Distinct from the guard above:
// that one covers the placement gate keying off the wrong *condition*
// (literal action string vs. resulting state); this one covers the gate
// still firing on a command that caused no state *transition* at all.
export function checkSerendipityVoiceRedundantOnSurfacePlacementGuard(
  content: string,
): string[] {
  const errors: string[] = []

  const commandBody = extractFunctionSource(content, 'applyCommand')
  if (!commandBody) {
    errors.push(
      'Could not find a function named applyCommand() -- has it been ' +
        'renamed, removed, or restructured? If so, this guard (and the ' +
        'redundant-action surface-placement contract it protects) needs ' +
        'to move with it.',
    )
    return errors
  }

  const onBranchIndex = commandBody.search(
    /if\s*\(\s*command\.action\s*===\s*'on'\s*&&\s*!active\s*\)\s*\{?/,
  )
  if (onBranchIndex === -1) {
    errors.push(
      "applyCommand() no longer contains the `if (command.action === 'on' " +
        '&& !active)` branch -- has the on/off/toggle dispatch shape ' +
        'changed? This guard assumes that structure to locate the ' +
        'state-change tracking it protects.',
    )
    return errors
  }

  const placementCallIndex = searchAfter(
    commandBody,
    /animationStore\.setSurfacePlacement\(/,
    onBranchIndex,
  )
  if (placementCallIndex === -1) {
    errors.push(
      'applyCommand() no longer calls animationStore.setSurfacePlacement() ' +
        'after the on/off/toggle branch -- has the fx-region-placement step ' +
        'been removed or restructured? This guard assumes that call exists ' +
        'so it can check what gates it.',
    )
    return errors
  }

  const gateWindow = commandBody.slice(onBranchIndex, placementCallIndex)

  if (!/stateChanged\s*=\s*true/.test(gateWindow)) {
    errors.push(
      'applyCommand() no longer sets a `stateChanged = true` flag inside ' +
        'the on/off/toggle branches -- without tracking whether this ' +
        'command actually toggled the effect, the placement gate cannot ' +
        'tell a real state transition apart from a redundant repeat of an ' +
        'already-applied action.',
    )
  }

  const placementGateIndex = commandBody.search(
    /if\s*\(\s*stateChanged\s*&&\s*isNowActive\s*\)\s*\{/,
  )
  if (placementGateIndex === -1) {
    errors.push(
      'applyCommand() no longer gates setSurfacePlacement() on ' +
        '`if (stateChanged && isNowActive)` -- gating on isNowActive alone ' +
        "still forces the fx region to 'front' on a redundant \"turn X " +
        'on" while X was already active there, silently clobbering a ' +
        "region a user manually placed 'behind' via the Coverage Zones " +
        'panel (screen-fx.vue) even though the command caused no actual ' +
        'state change.',
    )
  } else if (placementGateIndex >= placementCallIndex) {
    errors.push(
      'applyCommand() contains the `stateChanged && isNowActive` gate, but ' +
        'not immediately before the setSurfacePlacement() call it must ' +
        'guard -- it needs to directly gate that call.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const actionErrors = checkSerendipityVoiceActionGuard(content)
  const errorReportingErrors = checkSerendipityVoiceErrorReportingGuard(content)
  const artAckErrors = checkSerendipityVoiceArtAckGuard(content)
  const toggleOffPlacementErrors =
    checkSerendipityVoiceToggleOffSurfacePlacementGuard(content)
  const redundantOnPlacementErrors =
    checkSerendipityVoiceRedundantOnSurfacePlacementGuard(content)
  const errors = [
    ...actionErrors,
    ...errorReportingErrors,
    ...artAckErrors,
    ...toggleOffPlacementErrors,
    ...redundantOnPlacementErrors,
  ]

  if (errors.length) {
    console.error(
      'Serendipity Voice action guard contract failed in ' +
        'serendipityVoiceStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Serendipity Voice action guard contract passed: applyCommand(), ' +
      'applyThemeCommand(), and applyArtCommand() all reject action values ' +
      "that don't apply to their target instead of silently reporting a " +
      'false "applied" message, the unmatched-effect/unknown-theme ' +
      'no-match branches still report failure (not a false success) before ' +
      "returning, applyArtCommand()'s success path still acknowledges back " +
      'through the relay like every other successful command target, ' +
      "applyCommand()'s surface-placement gate keys off the effect's " +
      'actual resulting active state rather than the literal action ' +
      'string, so a toggle-to-off is treated the same as a literal off, ' +
      'and that gate also requires an actual state transition, so a ' +
      'redundant repeat of an already-applied on/off/toggle no longer ' +
      "clobbers a region's manually-set placement.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
