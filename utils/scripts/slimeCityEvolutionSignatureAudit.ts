// Slime City t-041: audit authored three-tier identities without mistaking
// renamed stat bumps for new decisions. Run with:
// npx tsx utils/scripts/slimeCityEvolutionSignatureAudit.ts
// This is a diagnostic report, not a claim that repeated verbs are always bad.
import assert from 'node:assert/strict'
import { CARDS } from '../slimeCity/prototypes'
import { CLASH_EVOLUTIONS } from '../slimeCity/clashEvolutions'
import { CLASH_TWISTS } from '../slimeCity/clashTwists'
import type { EvoAction, EvoStage } from '../slimeCity/evolutions/dsl'

function verbs(actions: EvoAction[]): string[] {
  return actions.flatMap((action) => {
    if (action.do === 'if' || action.do === 'chance')
      return [action.do, ...verbs(action.then)]
    return [action.do]
  })
}

function signature(stage: EvoStage): string {
  // Titles and numeric magnitude are intentionally ignored: two stages
  // with the same verbs, trigger and targets need an editorial look even
  // when the damage number or flavor name differs.
  return JSON.stringify({
    abilities: stage.abilities.map((ability) => ({
      when: ability.when,
      once: !!ability.once,
      actions: ability.do.map((action) => ({
        verb: action.do,
        target: 'to' in action ? action.to : null,
        zone: 'zone' in action ? action.zone : null,
        where: 'where' in action ? action.where : null,
        verbs: verbs([action]),
      })),
    })),
    static: stage.static ? Object.keys(stage.static).sort() : [],
    freeIf: stage.freeIf ?? null,
  })
}

const ids = new Set(CARDS.map((card) => card.id))
assert.equal(ids.size, 300, 'exactly 300 unique card IDs')
const data = Object.keys(CLASH_EVOLUTIONS)
const legacy = Object.keys(CLASH_TWISTS)
const overlap = data.filter((id) => legacy.includes(id))
const unknown = [...data, ...legacy].filter((id) => !ids.has(id))
const missing = [...ids].filter(
  (id) => !CLASH_EVOLUTIONS[id] && !CLASH_TWISTS[id],
)
const noAbilities: string[] = []
const sameSignature: string[] = []
const duplicateSignature = new Map<string, string[]>()
const genericStages: string[] = []
for (const [id, evolution] of Object.entries(CLASH_EVOLUTIONS)) {
  for (const level of [2, 3] as const) {
    const stage = evolution[level]
    const key = signature(stage)
    const group = duplicateSignature.get(key) ?? []
    group.push(id + '/L' + level)
    duplicateSignature.set(key, group)
    if (!stage.abilities.length && !stage.static && !stage.freeIf)
      noAbilities.push(id + '/L' + level)
    if (stage.abilities.every((ability) =>
      ability.do.every((action) =>
        ['power', 'life', 'armor', 'guard'].includes(action.do),
      ),
    ) && !stage.static && !stage.freeIf)
      genericStages.push(id + '/L' + level)
  }
  if (signature(evolution[2]) === signature(evolution[3]))
    sameSignature.push(id)
}
const sharedSignatures = [...duplicateSignature.values()]
  .filter((group) => group.length > 1)
  .sort((a, b) => b.length - a.length)
const result = {
  totalCards: ids.size,
  authoredData: data.length,
  legacyTwists: legacy.length,
  missing,
  unknown,
  overlap,
  noAbilities,
  sameSignature,
  genericStages,
  sharedSignatures: sharedSignatures.slice(0, 30),
  sharedSignatureGroupCount: sharedSignatures.length,
  note:
    'Structural signatures ignore names and numeric scaling. Shared verbs are leads for human editorial review, not automatic design failures.',
}
console.log('SLIME_CITY_EVOLUTION_SIGNATURE_AUDIT ' + JSON.stringify(result))
assert.deepEqual(unknown, [], 'evolution registries must reference real cards')
assert.deepEqual(overlap, [], 'cards must have one authoritative evolution')
assert.deepEqual(missing, [], 'every card must have an authored evolution')
