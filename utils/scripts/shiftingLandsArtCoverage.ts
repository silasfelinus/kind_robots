import assert from 'node:assert/strict'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  PREMADE_CHARACTERS,
  SHIPPED_SPECIES_PORTRAITS,
  SPECIES,
} from '../shiftingLands/characters'
import {
  CAST_CARDS_V10,
  PERSONAL_CARDS_V10,
  V6_CARDS,
} from '../shiftingLands/deckV6'
import { SHARED_ENDING_PLATES } from '../shiftingLands/endingPlates'
import { JOURNEY_WORLD } from '../shiftingLands/journey'
import {
  ALL_PERSONAL_ENDINGS,
  SHIPPED_PERSONAL_ENDING_PLATES,
} from '../shiftingLands/personalEndings'
import {
  ZUZU_FEATURING_PLATES,
  bespokeArt,
  outcomeArt,
} from '../shiftingLands/sceneArt'
import { trialForLandV8 } from '../shiftingLands/trialRulesV8'

// zuzu-shifting-lands t-044: the scene-to-image coverage matrix. Every image
// slot the game can ask for is enumerated from the runtime registries (the V6
// deck, cameo and personal cards, every choice's success and failure, every
// V8 trial route, shared and personal endings, traveler and species
// portraits), never from a hand-kept list, and each is classed as painted
// (its own plate ships under public/), fallback (a shared or reused plate) or
// missing. `--json <path>` writes the matrix; `--strict` fails on any card
// face, ending or portrait without its own painting.

const shipped = (url: string | null | undefined) =>
  !!url &&
  existsSync(fileURLToPath(new URL('../../public' + url, import.meta.url)))

type Row = {
  slot: string
  id: string
  status: 'painted' | 'fallback' | 'missing'
  art: string | null
}
const rows: Row[] = []
const add = (
  slot: string,
  id: string,
  painted: string | null,
  fallback: string | null,
) => {
  const art = shipped(painted) ? painted : shipped(fallback) ? fallback : null
  rows.push({
    slot,
    id,
    art,
    status: shipped(painted) ? 'painted' : art ? 'fallback' : 'missing',
  })
}

for (const card of V6_CARDS)
  add('card-face', card.id, bespokeArt(card.id), null)
for (const card of CAST_CARDS_V10) {
  const art = (card as { art?: string }).art ?? null
  add(
    'cameo-card',
    card.id,
    bespokeArt(card.id),
    art && !ZUZU_FEATURING_PLATES.has(art) ? art : null,
  )
}
for (const card of PERSONAL_CARDS_V10) {
  const art = (card as { art?: string }).art ?? null
  const own = `/shifting-lands/cards/${card.id}.webp`
  add(
    'own-card',
    card.id,
    own,
    art && !ZUZU_FEATURING_PLATES.has(art) ? art : null,
  )
}
for (const card of [...V6_CARDS, ...PERSONAL_CARDS_V10])
  for (const choice of card.choices)
    for (const success of choice.failure ? [true, false] : [true])
      add(
        'outcome',
        `${card.id}--${choice.id}--${success ? 'success' : 'failure'}`,
        outcomeArt(card.id, choice.id, success),
        bespokeArt(card.id),
      )
for (const land of JOURNEY_WORLD.lands)
  for (const choice of trialForLandV8(land.id)?.choices ?? [])
    for (const success of [true, false])
      add(
        'trial-outcome',
        `trial-${land.id}--${choice.id}--${success ? 'success' : 'failure'}`,
        outcomeArt('trial-' + land.id, choice.id, success),
        null,
      )
for (const [title, id] of Object.entries(SHARED_ENDING_PLATES))
  add(
    'shared-ending',
    `${id} (${title})`,
    `/shifting-lands/endings/${id}.webp`,
    null,
  )
for (const ending of ALL_PERSONAL_ENDINGS)
  add(
    'personal-ending',
    ending.id,
    SHIPPED_PERSONAL_ENDING_PLATES.has(ending.id)
      ? `/shifting-lands/endings/${ending.id}.webp`
      : null,
    null,
  )
for (const character of PREMADE_CHARACTERS)
  add(
    'traveler-portrait',
    character.id,
    character.portrait.startsWith('/shifting-lands/portraits/')
      ? character.portrait
      : null,
    character.portrait,
  )
for (const species of SPECIES)
  add(
    'species-portrait',
    species.id,
    SHIPPED_SPECIES_PORTRAITS.has(species.id)
      ? `/shifting-lands/portraits/${species.id}.webp`
      : null,
    null,
  )

const slots = [...new Set(rows.map((row) => row.slot))]
const summary = Object.fromEntries(
  slots.map((slot) => {
    const mine = rows.filter((row) => row.slot === slot)
    return [
      slot,
      {
        total: mine.length,
        painted: mine.filter((row) => row.status === 'painted').length,
        fallback: mine.filter((row) => row.status === 'fallback').length,
        missing: mine.filter((row) => row.status === 'missing').length,
      },
    ]
  }),
)
for (const row of rows)
  assert.ok(
    !row.art || !ZUZU_FEATURING_PLATES.has(row.art),
    `${row.slot} ${row.id} never shows Zuzu's plate`,
  )

const json = process.argv.indexOf('--json')
if (json > 0)
  writeFileSync(
    process.argv[json + 1]!,
    JSON.stringify({ summary, rows }, null, 1),
  )
console.table(summary)
if (process.argv.includes('--strict')) {
  const gaps = rows.filter(
    (row) =>
      row.status !== 'painted' &&
      !['outcome', 'trial-outcome'].includes(row.slot),
  )
  assert.deepEqual(
    gaps.map((row) => `${row.slot}:${row.id}`),
    [],
    'every card face, ending and portrait has its own painting',
  )
  console.log('Shifting Lands art coverage (strict) passed')
}
