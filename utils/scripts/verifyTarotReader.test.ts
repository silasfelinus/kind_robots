// DB-free tests for the public tarot reader and the studio art recipes:
// the full 78-card Kind Oracle content, every deck resolving to engine cards,
// the natal chart engine against known astronomy, and every composed design
// prompt passing the enqueue-time art prompt contract.
import assert from 'node:assert/strict'
import { Body, Observer, SearchAltitude } from 'astronomy-engine'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  ORACLE_CARDS,
  ORACLE_CARD_BY_ID,
  ORACLE_CONTENT,
} from '../oracle/content'
import { buildReading } from '../oracle/reading'
import { ORACLE_SPREAD_IDS, spreadPositionIds } from '../oracle/spreads'
import { validateOracle } from '../oracle/validate'
import {
  TAROT_CATALOG,
  TAROT_DECK_SEEDS,
  TAROT_DESIGN_PRESETS,
  TAROT_SAMPLE_CARD_KEYS,
  cardScenePrompt,
  composeFacePrompt,
  legacySeedPrompt,
  parseLoraLines,
  seedTarotCards,
  seedTarotDesigns,
  tarotArtRequestKey,
} from '../tarotStudio'
import {
  chartAngles,
  computeNatalChart,
  computeTransits,
  houseOf,
  moonIngresses,
  planetLongitude,
  separation,
} from '../astrology/chart'
import {
  balanceReading,
  birthCards,
  dailyHoroscope,
  placementReading,
} from '../astrology/interpret'
import { birthMomentToUtc, zoneOffsetMinutes } from '../astrology/time'
import {
  DEFAULT_TAROT_SETTINGS,
  TAROT_MAX_PROFILES,
  TAROT_SAVE_MAX_BYTES,
  emptyTarotSave,
  newerTarotSave,
  parseTarotAccountSave,
  sanitizeSettings,
} from '../tarot/accountSave'
import { BIRTH_CITIES } from '../astrology/cities'
import { ZODIAC_SIGNS, decanCardKey, signAt } from '../astrology/zodiac'

// --- Oracle content: complete, valid and joined to every deck ---
assert.equal(ORACLE_CARDS.length, 78)
assert.deepEqual(validateOracle(ORACLE_CARDS, ORACLE_CONTENT), [])
for (const card of TAROT_CATALOG) {
  assert.ok(ORACLE_CARD_BY_ID[card.oracleId], `${card.oracleId} has content`)
}
for (const spread of ORACLE_SPREAD_IDS) {
  for (let i = 0; i < 40; i++) {
    const reading = buildReading(ORACLE_CARDS, ORACLE_CONTENT, spread, `t${i}`)
    assert.ok(reading.text.length > 80)
    assert.equal(reading.passages.length, reading.cards.length)
  }
}
const again = buildReading(ORACLE_CARDS, ORACLE_CONTENT, 'three', 'same-seed')
assert.equal(
  again.text,
  buildReading(ORACLE_CARDS, ORACLE_CONTENT, 'three', 'same-seed').text,
)
assert.equal(TAROT_CATALOG[22]?.oracleTitle, 'Ace of Sparks')
assert.equal(TAROT_CATALOG[32]?.oracleTitle, 'Apprentice of Sparks')

// Every major has a bespoke passage in every position and orientation, and a
// drawn reading actually uses them instead of the generic frame.
const majorIds = ORACLE_CARDS.filter((card) => card.arcana === 'major').map(
  (card) => card.id,
)
for (const spread of ORACLE_SPREAD_IDS) {
  for (const position of spreadPositionIds(spread)) {
    for (const id of majorIds) {
      const texts = ORACLE_CONTENT.positionText[position]?.[id]
      assert.ok(texts?.upright && texts.reversed, `${position}.${id} passages`)
    }
  }
}
const bespokeReading = buildReading(
  ORACLE_CARDS.filter((card) => card.arcana === 'major'),
  ORACLE_CONTENT,
  'five',
  'bespoke-check',
)
bespokeReading.cards.forEach((drawn, index) => {
  assert.equal(
    bespokeReading.passages[index],
    ORACLE_CONTENT.positionText[drawn.position.id]?.[drawn.card.id]?.[
      drawn.orientation
    ],
  )
})

// --- Every sign/decan/planet correspondence names a real catalog card ---
const keys = new Set(TAROT_CATALOG.map((card) => card.key))
for (const sign of ZODIAC_SIGNS) {
  assert.ok(keys.has(sign.tarotKey), `${sign.id} major`)
  for (const decan of sign.decanKeys) assert.ok(keys.has(decan), decan)
}
assert.equal(decanCardKey(5), 'two-of-wands')
assert.equal(decanCardKey(359), 'ten-of-cups')

// --- Time zones: wall-clock birth time converts through DST correctly ---
assert.equal(
  birthMomentToUtc({
    date: '1990-07-04',
    time: '15:30',
    timeZone: 'America/Los_Angeles',
  })?.toISOString(),
  '1990-07-04T22:30:00.000Z',
)
assert.equal(
  birthMomentToUtc({
    date: '1990-01-04',
    time: '15:30',
    timeZone: 'America/Los_Angeles',
  })?.toISOString(),
  '1990-01-04T23:30:00.000Z',
)
assert.equal(
  zoneOffsetMinutes(new Date('2026-06-01T00:00:00Z'), 'Asia/Kolkata'),
  330,
)
assert.equal(
  birthMomentToUtc({ date: '1990-02-30', time: '10:00', timeZone: 'UTC' }),
  null,
)
for (const city of BIRTH_CITIES) {
  assert.doesNotThrow(
    () => zoneOffsetMinutes(new Date(), city.timeZone),
    city.id,
  )
}

// --- Astronomy: Sun at equinox; the ascendant meets the Sun's centre on the
// geometric horizon (sunrise proper adds refraction and the upper limb) ---
const equinox = planetLongitude('sun', new Date('2024-03-20T03:06:00Z'))
assert.ok(separation(equinox, 0) < 0.05, `equinox sun ${equinox}`)
const solstice = planetLongitude('sun', new Date('2024-06-20T20:51:00Z'))
assert.ok(separation(solstice, 90) < 0.05, `solstice sun ${solstice}`)
for (const city of [
  BIRTH_CITIES[5]!,
  BIRTH_CITIES.find((c) => c.id.startsWith('london'))!,
]) {
  const rise = SearchAltitude(
    Body.Sun,
    new Observer(city.latitude, city.longitude, 0),
    +1,
    new Date('2026-04-10T00:00:00Z'),
    2,
    0,
  )
  assert.ok(rise, `${city.id} sunrise`)
  const { ascendant, midheaven } = chartAngles(rise.date, city)
  const sun = planetLongitude('sun', rise.date)
  assert.ok(
    separation(ascendant, sun) < 0.5,
    `${city.id} asc ${ascendant} sun ${sun}`,
  )
  assert.ok(separation(ascendant, midheaven) > 60)
}

const sfBirth = birthMomentToUtc({
  date: '1990-07-04',
  time: '15:30',
  timeZone: 'America/Los_Angeles',
})!
const chart = computeNatalChart(
  sfBirth,
  { latitude: 37.7749, longitude: -122.4194 },
  true,
)
assert.equal(chart.houseSystem, 'placidus')
assert.equal(chart.houses?.length, 12)
assert.equal(
  signAt(chart.points.find((p) => p.id === 'sun')!.longitude).id,
  'cancer',
)
assert.equal(chart.points.find((p) => p.id === 'ascendant')?.house, 1)
for (const point of chart.points) {
  assert.ok(point.house && point.house >= 1 && point.house <= 12, point.id)
}
assert.ok(chart.points.find((p) => p.id === 'saturn')?.retrograde)
assert.ok(chart.aspects.length > 3)
assert.equal(houseOf(chart.houses![0]! + 0.01, chart.houses!), 1)

const noTime = computeNatalChart(sfBirth, null, false)
assert.equal(noTime.houses, null)
assert.equal(
  noTime.points.some((p) => p.id === 'ascendant'),
  false,
)

const arctic = computeNatalChart(sfBirth, { latitude: 70, longitude: 25 }, true)
assert.equal(arctic.houseSystem, 'whole-sign')

const transits = computeTransits(chart, new Date('2026-11-27T20:00:00Z'))
assert.equal(transits.sky.length, 10)
const horoscope = dailyHoroscope(chart, transits.sky, transits.hits)
assert.ok(horoscope.lines.length >= 2)
assert.ok(balanceReading(chart).length === 3)
assert.ok(placementReading(chart.points[0]!).detail.length > 40)
assert.deepEqual(
  birthCards(chart).map((card) => card.role),
  ['Sun card', 'Sun decan', 'Moon card', 'Rising card'],
)
const week = moonIngresses(new Date('2026-11-27T00:00:00Z'), 7)
assert.ok(week.length >= 2 && week.length <= 5, `moon ingresses ${week.length}`)

// --- Studio recipes: legacy prompts upgrade, presets pass the contract ---
for (const seed of TAROT_DECK_SEEDS) {
  const designs = seedTarotDesigns(seed.slug)
  assert.equal(designs.length, TAROT_DESIGN_PRESETS.length)
  for (const card of seedTarotCards(seed.slug)) {
    const legacy = legacySeedPrompt(seed.slug, card.key)
    assert.ok(legacy)
    assert.equal(
      cardScenePrompt(seed.slug, { key: card.key, prompt: legacy }),
      card.prompt,
    )
    for (const design of designs) {
      const prompt = composeFacePrompt(card.prompt, design.stylePrompt)
      assert.deepEqual(
        checkArtPromptContract({ prompt, engine: 'krea2' }),
        [],
        `${seed.slug}/${design.key}/${card.key}`,
      )
    }
  }
  for (const design of designs) {
    assert.deepEqual(
      checkArtPromptContract({ prompt: design.backPrompt, engine: 'krea2' }),
      [],
      `${seed.slug}/${design.key}/back`,
    )
  }
}
assert.equal(
  cardScenePrompt('superkate', { key: 'major-00', prompt: 'A custom scene.' }),
  'A custom scene.',
)
for (const key of TAROT_SAMPLE_CARD_KEYS) assert.ok(keys.has(key), key)
assert.equal(tarotArtRequestKey(42), 'tarot-art:42')
assert.deepEqual(parseLoraLines('alpha:0.6\n\nbeta'), [
  { name: 'alpha', strength: 0.6 },
  { name: 'beta', strength: 1 },
])
assert.equal(
  TAROT_DECK_SEEDS.find((seed) => seed.slug === 'kind-robots')?.isPublic,
  true,
)
assert.equal(
  TAROT_DECK_SEEDS.find((seed) => seed.slug === 'superkate')?.isPublic,
  false,
)

// --- Account save: one validated shape for browser and account storage ---
const goodProfile = {
  id: 'p-abc',
  name: 'Kate',
  date: '1990-07-04',
  time: '15:30',
  cityId: 'san-francisco-ca-usa',
  latitude: 37.7749,
  longitude: -122.4194,
  timeZone: 'America/Los_Angeles',
}
const parsedSave = parseTarotAccountSave({
  savedAt: '2026-11-28T01:00:00Z',
  profiles: [
    goodProfile,
    { ...goodProfile, id: 'bad', date: 'yesterday' },
    { ...goodProfile, id: 'far', latitude: 120 },
    { ...goodProfile, id: 'p-notime', time: null, cityId: null },
  ],
  activeProfileId: 'missing',
  settings: { musicVolume: 7, textSize: 'huge', accountSync: false },
  majorsStudied: ['major-00', 'major-00', 'ace-of-cups', 'major-21'],
  deck: 'kind-robots',
  injected: '<script>',
})
assert.deepEqual(
  parsedSave.profiles.map((profile) => profile.id),
  ['p-abc', 'p-notime'],
)
assert.equal(parsedSave.activeProfileId, 'p-abc')
assert.equal(parsedSave.settings.musicVolume, 1)
assert.equal(parsedSave.settings.textSize, 'md')
assert.equal(parsedSave.settings.accountSync, false)
assert.deepEqual(parsedSave.majorsStudied, ['major-00', 'major-21'])
assert.equal('injected' in parsedSave, false)
assert.equal(
  parseTarotAccountSave(JSON.stringify(parsedSave)).deck,
  'kind-robots',
)
assert.throws(() => parseTarotAccountSave([]))
assert.throws(() => parseTarotAccountSave('not json'))
const largest = parseTarotAccountSave({
  profiles: Array.from({ length: 40 }, (_, i) => ({
    ...goodProfile,
    id: `p-${i}`,
    name: 'x'.repeat(60),
    timeZone: 'y'.repeat(64),
  })),
})
assert.ok(
  JSON.stringify(largest).length < TAROT_SAVE_MAX_BYTES,
  'the field caps keep every valid save under the byte limit',
)
assert.equal(
  parseTarotAccountSave({ profiles: Array(30).fill(goodProfile) }).profiles
    .length,
  TAROT_MAX_PROFILES,
)
assert.equal(DEFAULT_TAROT_SETTINGS.accountSync, true)
assert.equal(sanitizeSettings({}).accountSync, true)
const olderSave = { ...emptyTarotSave(), savedAt: '2026-11-27T00:00:00.000Z' }
const newerSave = { ...emptyTarotSave(), savedAt: '2026-11-28T00:00:00.000Z' }
assert.equal(newerTarotSave(olderSave, newerSave), newerSave)
assert.equal(newerTarotSave(newerSave, olderSave), newerSave)
assert.equal(newerTarotSave(olderSave, olderSave), olderSave)

console.log('verifyTarotReader: ok')
