// /utils/scripts/verifyCardActionContract.ts
//
// A card is an entry point. It emits; the gallery decides what that means.
//
// WHY
// ---
// Silas, 2026-08-07: "Question about our {model}-cards ... especially as the
// cards could be the entry points for interact, edit, and review abilities.
// Are we bespoking our cards?"
//
// Half of the answer was yes: every core-object card mounts
// kr-entity-card-body and reaches kr-art-plate, and verifyGalleryConsistency
// already pins the LOOK -- variant plumbing, mode binding, the container-
// responsive grids, the shape spec.
//
// The other half was no, and nothing was watching it. An audit of the nine
// entity cards found the "user picked this one" action wearing four different
// names (`select`, `choose`, `chat`/`adventure`, `launch`), carrying two
// different payloads (an id, or the whole record), and -- the part that
// actually costs something -- THREE cards reaching into their own domain store
// instead of emitting:
//
//   character-card    called characterStore.selectCharacter() and emitted nothing
//   checkpoint-card   called checkpointStore.selectCheckpointByName(), no emits at all
//   scenario-card     called scenarioStore.selectScenario() AND emitted, so the
//                     store was already changed before the gallery heard
//   server-card       emitted nothing whatsoever
//
// A card that mutates its own store has decided what clicking it MEANS. That is
// why bot-gallery and reward-gallery can offer a dropdown variant that selects
// WITHOUT navigating, and character/scenario could not: the behaviour was
// welded into the card. It also makes the card unmountable in WonderLab without
// a live store.
//
// THE CONTRACT
//   1. The pick action is named `open`, and carries an identifier.
//   2. A card does not mutate its own domain store in response to being picked.
//   3. Model-specific verbs (`launch`, `adventure`, `clone`, `delete`) are
//      ADDITIONS, never replacements -- the interact tier is where models
//      legitimately differ, but the entry point is the frame.
//
//   npx tsx utils/scripts/verifyCardActionContract.ts

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildComponentGraph } from './componentGraph'
import { stripComments } from './lib/sourceText'

/**
 * Entity cards: a card that stands for one record of a model with its own
 * gallery. Deliberately a list rather than a glob -- `production-stage-card`,
 * `flip-card` and `card-picker` are layout widgets, not entity cards, and a
 * filename rule would sweep them in. New models get added here.
 */
export const ENTITY_CARDS = [
  'bot-card',
  'character-card',
  'dream-card',
  'reward-card',
  'scenario-card',
  'collection-card',
  'image-card',
  'server-card',
  'checkpoint-card',
] as const

export type Offence = { card: string; reason: string }

export function emitNames(source: string): string[] {
  const block = source.match(/defineEmits<\{([\s\S]*?)\}>/)?.[1]
  if (!block) return []
  return [...block.matchAll(/^\s*'?([\w:-]+)'?\s*:/gm)].map(
    (m) => m[1] as string,
  )
}

/**
 * Store calls that make this record the current one -- i.e. the card deciding
 * what BEING PICKED means.
 *
 * Deliberately narrow. A first draft matched every `set*`/`open*` setter too
 * and reported `collectionStore.setSelectedCollectionIds()` (bulk selection),
 * `serverStore.openServerForm()` (form UI) and `setActiveTextServer()`
 * (assigning a server a job). Those are separate concerns that happen to live
 * in the same file; folding them in would have made the rule mean "a card may
 * not touch a store", which is not the contract and would have forced
 * unrelated refactors to get green.
 *
 * Reads are always fine -- a card asks the store whether it is the selected one
 * in order to draw its ring, and must keep being able to.
 */
export function selfMutations(source: string): string[] {
  /*
   * Comments stripped FIRST. Without this the check reported its own
   * documentation: three cards carry a comment saying "this used to call
   * characterStore.selectCharacter()", and a raw scan reads that as the call
   * still being there. Asserting on a mention rather than a use is this repo's
   * house failure mode, and it caught this file too.
   */
  const script = stripComments(source.slice(source.indexOf('<script')))
  return [
    ...script.matchAll(
      /\b(\w*[sS]tore)\s*\.\s*((?:select|choose|deselect)\w*)\s*\??\.?\s*\(/g,
    ),
  ].map((m) => `${m[1]}.${m[2]}()`)
}

export function findOffences(
  cards: { card: string; source: string }[],
): Offence[] {
  const offences: Offence[] = []
  for (const { card, source } of cards) {
    const emits = emitNames(source)

    if (!emits.includes('open')) {
      offences.push({
        card,
        reason: `does not emit \`open\` (emits: ${emits.join(', ') || 'nothing'})`,
      })
    }

    for (const stale of ['select', 'choose']) {
      if (emits.includes(stale)) {
        offences.push({
          card,
          reason: `emits \`${stale}\` — the pick action is named \`open\` on every entity card`,
        })
      }
    }

    for (const call of selfMutations(source)) {
      offences.push({
        card,
        reason: `mutates its own store (${call}) instead of emitting — the gallery owns the consequence`,
      })
    }
  }
  return offences
}

/* -------------------------------------------------------------------------- */

function selfTest(): void {
  const fail = (m: string): never => {
    throw new Error(m)
  }
  const ok = `
    <script setup lang="ts">
    const emit = defineEmits<{
      open: [id: number]
      edit: [id: number]
    }>()
    const isSelected = computed(() => botStore.selectedBot?.id === props.bot.id)
    function pick() { emit('open', props.bot.id) }
    </script>`
  if (findOffences([{ card: 'a', source: ok }]).length) {
    fail(
      'a compliant card must pass, and READING a store must not be an offence',
    )
  }

  const mutating = `
    <script setup lang="ts">
    const emit = defineEmits<{ open: [id: number] }>()
    function pick() { characterStore.selectCharacter(props.character.id) }
    </script>`
  if (!findOffences([{ card: 'b', source: mutating }]).length) {
    fail(
      'a card that mutates its own store must be reported even if it emits open',
    )
  }

  const oldVerb = `
    <script setup lang="ts">
    const emit = defineEmits<{ select: [id: number] }>()
    </script>`
  const verbOffences = findOffences([{ card: 'c', source: oldVerb }])
  if (verbOffences.length !== 2) {
    fail(
      'a card emitting `select` must be flagged for the stale verb AND the missing open',
    )
  }

  console.log('✅ verifyCardActionContract self-test passed.')
}

/* -------------------------------------------------------------------------- */

selfTest()

const graph = buildComponentGraph(resolve(process.cwd(), 'components'))
const cards = ENTITY_CARDS.map((card) => {
  const file = graph.files.get(card)
  if (!file) throw new Error(`entity card not found: ${card}`)
  return { card, source: readFileSync(file, 'utf8') }
})

const offences = findOffences(cards)

if (offences.length) {
  console.error(
    `\nFAIL - ${offences.length} card action contract violation(s):\n`,
  )
  for (const { card, reason } of offences) {
    console.error(`  ${card}\n    ${reason}`)
  }
  console.error(
    `\nA card is an ENTRY POINT: it emits \`open\` and the gallery decides what\n` +
      `that means. bot-gallery and reward-gallery interpret the same click two\n` +
      `ways -- select-only in a dropdown, navigate otherwise -- which a card that\n` +
      `drives the store itself makes impossible. Model-specific verbs (launch,\n` +
      `adventure, clone, delete) are additions on top, not replacements.`,
  )
  process.exitCode = 1
} else {
  console.log(
    `\nCard action contract holds: ${cards.length} entity cards emit \`open\`` +
      ` and none decides its own consequence.`,
  )
}
