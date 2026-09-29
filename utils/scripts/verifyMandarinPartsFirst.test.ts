// /utils/scripts/verifyMandarinPartsFirst.test.ts
//
// Regression test for the parts-first teaching order (Silas, 2026-09-29):
//
//   "If I am learning wo, I should learn how the parts of the symbols mean, and what
//    they used to mean, and how they connect. there is a history for each symbol, and
//    it's VERY important that this is part of the instruction."
//   "we should learn the parts before we learn the combinations"
//   "I should learn roof before I learn house, for example"
//
// Before this, 我 showed "Its parts don't explain this one — learn it whole." The pinned
// source (Make Me a Hanzi) classifies 我 as ideographic -- "A hand 扌 holding a weapon
// 戈" -- but only semantic/phonetic roles counted as teachable, so the analysis was
// thrown away. And 家's pieces screen (宀 roof, 豕 pig) came AFTER the word.
//
// The dictionary lines below are copied verbatim from dictionary.txt at the pinned
// commit, so these assertions describe what the live catalog will actually do.
import assert from 'node:assert/strict'

import {
  analyzeMandarinCharacter,
  type MandarinCharacterDataEntry,
} from '../../server/utils/mandarinCharacterData.js'
import { buildWordRun, orderPartsFirst } from '../mandarinCourse.js'
import { buildMandarinLesson, describeOrigin } from '../mandarinLesson.js'
import type { MandarinCard } from '../mandarin.js'

const LINES = [
  '{"character":"我","definition":"I, me, my; our, us","pinyin":["wǒ"],"decomposition":"⿰扌戈","etymology":{"type":"ideographic","hint":"A hand 扌 holding a weapon 戈"},"radical":"戈"}',
  '{"character":"扌","definition":"hand","pinyin":["shǒu"],"decomposition":"⿻二亅","etymology":{"type":"pictographic","hint":"A hand with the fingers splayed; compare 手"},"radical":"扌"}',
  '{"character":"戈","definition":"spear, lance, halberd","pinyin":["gē"],"decomposition":"？","etymology":{"type":"pictographic","hint":"A spear pointing to the bottom-right"},"radical":"戈"}',
  '{"character":"家","definition":"house, home, residence; family","pinyin":["jiā"],"decomposition":"⿱宀豕","etymology":{"type":"pictophonetic","phonetic":"豕","semantic":"宀","hint":"roof"},"radical":"宀"}',
  '{"character":"宀","definition":"roof; house","pinyin":["gài","mián"],"decomposition":"⿱丶冖","radical":"宀"}',
  '{"character":"豕","definition":"pig, boar","pinyin":["shǐ"],"decomposition":"⿱一⿰勿？","etymology":{"type":"pictographic","hint":"A pig drawn on its side"},"radical":"豕"}',
  '{"character":"明","definition":"bright, clear; to explain, to understand, to shed light","pinyin":["míng"],"decomposition":"⿰日月","etymology":{"type":"ideographic","hint":"The light of the sun 日 and moon 月"},"radical":"日"}',
  '{"character":"日","definition":"sun; day; daytime","pinyin":["rì"],"decomposition":"⿴口一","etymology":{"type":"pictographic","hint":"The sun"},"radical":"日"}',
  '{"character":"月","definition":"moon; month","pinyin":["yuè"],"decomposition":"⿵冂二","etymology":{"type":"pictographic","hint":"A crescent moon"},"radical":"月"}',
  '{"character":"人","definition":"man, person; people","pinyin":["rén"],"decomposition":"？","etymology":{"type":"pictographic","hint":"The legs of a human being"},"radical":"人"}',
  '{"character":"的","definition":"aim, goal; of; possessive particle; -self suffix","pinyin":["de"],"decomposition":"⿰白勺","radical":"白"}',
]

const dictionary = new Map<string, MandarinCharacterDataEntry>()
for (const line of LINES) {
  const entry = JSON.parse(line) as MandarinCharacterDataEntry
  dictionary.set(entry.character as string, entry)
}

/** A catalog card enriched the way enrichMandarinCharacterData does it. */
function enriched(
  simplified: string,
  pinyin: string,
  meaning: string,
): MandarinCard {
  const analysis = analyzeMandarinCharacter(
    dictionary.get(simplified) as MandarinCharacterDataEntry,
    dictionary,
  )
  assert.ok(analysis, `no analysis for ${simplified}`)
  return {
    key: `test:${simplified}`,
    simplified,
    pinyin,
    meaning,
    meanings: [meaning],
    kind: 'character',
    partsOfSpeech: [],
    classifiers: [],
    categories: [],
    components: analysis.components,
    history: analysis.history,
    ...(analysis.formation ? { formations: [analysis.formation] } : {}),
    historyStatus: 'starter',
    source: { label: 'test', version: 'test' },
  }
}

// --- 我: the reported card ---------------------------------------------------

{
  const wo = enriched('我', 'wǒ', 'I; me; my')
  const ideaParts = wo.components.filter(
    (component) => component.role === 'idea',
  )
  assert.deepEqual(
    ideaParts.map((component) => component.glyph),
    ['扌', '戈'],
    'both parts the source names in its hint become idea parts',
  )

  const spear = ideaParts.find((component) => component.glyph === '戈')
  assert.equal(spear?.meaning, 'spear')
  assert.equal(spear?.pinyin, 'gē')
  assert.equal(spear?.origin?.type, 'pictographic')
  assert.equal(spear?.origin?.hint, 'A spear pointing to the bottom-right')

  const lesson = buildMandarinLesson(wo)
  assert.equal(lesson.teachability, 'structural')
  assert.equal(
    describeOrigin(lesson.characters[0]?.formation),
    'An idea put together from pictures: A hand 扌 holding a weapon 戈.',
  )

  const beats = buildWordRun(lesson).map((step) =>
    step.kind === 'word' ? step.beat : step.kind,
  )
  assert.deepEqual(beats, ['pieces', 'meet', 'sound', 'recall'])
}

console.log(
  '✅ 我: taught from its parts (hand, spear), each with its own origin, then whole',
)

// --- 家: roof before house ----------------------------------------------------

{
  const home = enriched('家', 'jiā', 'home')
  const roof = home.components.find((component) => component.glyph === '宀')
  const pig = home.components.find((component) => component.glyph === '豕')
  assert.equal(roof?.role, 'semantic')
  assert.equal(
    roof?.meaning,
    'roof',
    "the source's own semantic hint wins over the definition",
  )
  assert.equal(
    roof?.origin,
    undefined,
    '宀 has no formation in the source, so none is invented',
  )
  assert.equal(pig?.role, 'phonetic')
  assert.equal(
    describeOrigin(pig?.origin),
    'Drawn as a picture: A pig drawn on its side.',
  )

  const beats = buildWordRun(buildMandarinLesson(home)).map((step) =>
    step.kind === 'word' ? step.beat : step.kind,
  )
  assert.equal(beats[0], 'pieces', 'the roof is taught before the house')
  assert.ok(beats.indexOf('pieces') < beats.indexOf('meet'))
}

console.log('✅ 家: 宀 roof and 豕 pig come before the word they build')

// --- pictographs and honest gaps -------------------------------------------------

{
  const person = buildMandarinLesson(enriched('人', 'rén', 'person'))
  assert.equal(person.teachability, 'pictograph')
  assert.equal(
    describeOrigin(person.characters[0]?.formation),
    'Drawn as a picture: The legs of a human being.',
  )

  const de = buildMandarinLesson(enriched('的', 'de', 'of'))
  assert.equal(
    de.teachability,
    'vocabulary',
    '的 has no formation in the source, so it still gets no invented story',
  )
  assert.ok(
    !buildWordRun(de).some(
      (step) => step.kind === 'word' && step.beat === 'pieces',
    ),
  )
}

console.log(
  '✅ 人 teaches its picture; 的 still says nothing the source does not',
)

// --- ideographic hints never promote an unnamed leaf ----------------------------

{
  const analysis = analyzeMandarinCharacter(
    {
      character: '试',
      decomposition: '⿰讠式',
      etymology: { type: 'ideographic', hint: 'Speech 讠 only' },
      radical: '讠',
    },
    dictionary,
  )
  const roles = new Map(analysis?.components.map((c) => [c.glyph, c.role]))
  assert.equal(roles.get('讠'), 'idea')
  assert.equal(
    roles.get('式'),
    'form',
    'a leaf the hint does not name stays unexplained',
  )
}

console.log('✅ idea parts come only from glyphs the source hint names')

// --- whole words that are parts are taught first --------------------------------

{
  const cards = [
    enriched('明', 'míng', 'bright'),
    enriched('日', 'rì', 'sun'),
    enriched('月', 'yuè', 'moon'),
    enriched('我', 'wǒ', 'I'),
  ]

  assert.deepEqual(
    orderPartsFirst({ keys: ['test:明', 'test:我'], cards, limit: 8 }),
    ['test:日', 'test:月', 'test:明', 'test:我'],
    'sun and moon are learned before bright, even when the deck lists bright first',
  )

  assert.deepEqual(
    orderPartsFirst({
      keys: ['test:明'],
      cards,
      learnedKeys: new Set(['test:日']),
      limit: 8,
    }),
    ['test:月', 'test:明'],
    'a part already learned is not taught again',
  )

  assert.deepEqual(
    orderPartsFirst({ keys: ['test:我', 'test:明'], cards, limit: 3 }),
    ['test:我'],
    'a word whose parts do not fit waits for a later session instead of jumping ahead of them',
  )

  assert.deepEqual(
    orderPartsFirst({ keys: ['test:日', 'test:明'], cards, limit: 8 }),
    ['test:日', 'test:月', 'test:明'],
    'no duplicates when a part is already in the session',
  )
}

console.log(
  '✅ orderPartsFirst: sun and moon before bright, within the session size',
)

console.log('✅ verifyMandarinPartsFirst: all assertions passed')
