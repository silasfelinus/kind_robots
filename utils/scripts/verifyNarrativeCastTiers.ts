// /utils/scripts/verifyNarrativeCastTiers.ts
//
// Casting-board contract: role-to-tier grouping plus the interaction wiring
// that lets cards move to role drop zones without removing the pressable-chip
// accessibility fallback.
//
//   npx tsx utils/scripts/verifyNarrativeCastTiers.ts

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { NARRATIVE_ROLE_KEYS, narrativeCastTier } from '../narrativeRoles'

const root = process.cwd()
let failures = 0

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok - ${message}`)
    return
  }
  failures += 1
  console.error(`FAIL - ${message}`)
}

const read = (path: string): string => readFileSync(resolve(root, path), 'utf8')

check(
  narrativeCastTier('protagonist') === 'protagonist',
  'a protagonist lands in the protagonist tier',
)
check(
  narrativeCastTier('antagonist') === 'antagonist',
  'an antagonist lands in the antagonist tier',
)

const supportingRoles = NARRATIVE_ROLE_KEYS.filter(
  (key) => key !== 'protagonist' && key !== 'antagonist' && key !== 'ensemble',
)
check(
  supportingRoles.length > 0,
  'there is at least one supporting role to check (vocabulary is not empty)',
)
for (const key of supportingRoles) {
  check(
    narrativeCastTier(key) === 'support',
    `'${key}' lands in the supporting tier, not lead or back`,
  )
}

check(
  narrativeCastTier('ensemble') === 'back',
  'ensemble lands in the back tier',
)
check(
  narrativeCastTier(null) === 'back',
  'an unassigned member (null) lands in the back tier',
)
check(
  narrativeCastTier(undefined) === 'back',
  'an unassigned member (undefined) lands in the back tier',
)
check(
  narrativeCastTier('villain') === 'support',
  'an unknown/stale role key degrades to the supporting tier rather than disappearing',
)

const component = read('components/narrative/narrative-role-assigner.vue')
const calls = component.match(/narrativeCastTier\(/g) ?? []
check(
  calls.length >= 4,
  'the casting board calls narrativeCastTier() for all four tier computeds',
)
check(
  !/roleFor\(member\.slug\)\s*===\s*'protagonist'/.test(component) &&
    !/roleFor\(member\.slug\)\s*===\s*'antagonist'/.test(component),
  'tier placement stays centralized in narrativeCastTier()',
)

const card = read('components/narrative/narrative-cast-card.vue')
check(
  /:data-cast-role="option\.key"/.test(component) &&
    /@drop\.prevent="dropRole\(option\.key\)"/.test(component),
  'each narrative role is rendered as an actual card drop zone',
)
check(
  /draggable="true"/.test(card) && /@dragstart="startNativeDrag"/.test(card),
  'cast cards support native mouse drag',
)
check(
  /@pointerdown="startPointerDrag"/.test(card) &&
    /event\.pointerType === 'mouse'/.test(card) &&
    /setPointerCapture/.test(card) &&
    /@pointermove="movePointerDrag"/.test(card) &&
    /@pointerup="finishPointerDrag"/.test(card),
  'cast cards provide a Pointer Events drag path for touch and pen',
)
check(
  /class="[^"]*touch-none[^"]*"/.test(card),
  'the touch drag handle suppresses browser panning while a pointer drag is active',
)
check(
  /:aria-pressed="role === option\.key"/.test(card) &&
    /@click="emit\('toggle-role', option\.key\)"/.test(card),
  'pressable role chips remain as the keyboard/accessibility fallback',
)
check(
  /elementFromPoint\(x, y\)/.test(component) &&
    /closest\('\[data-cast-role\]'\)/.test(component),
  'touch drag completion resolves the role slot under the pointer',
)

if (failures) {
  console.error(
    `\nNarrative casting-board contract failed with ${failures} error(s).`,
  )
  process.exitCode = 1
} else {
  console.log(
    '\nNarrative casting-board contract passed: role tiers, mouse drag, touch/pen drag, and chip fallback are all wired.',
  )
}
