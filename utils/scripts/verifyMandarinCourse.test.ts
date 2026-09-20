// /utils/scripts/verifyMandarinCourse.test.ts
//
// Regression test for mandarin-tutor/t-028's guided course (utils/mandarinCourse.ts).
// Pure functions only -- no prisma, no database, no network, no Nuxt runtime -- same
// discipline as verifyMandarinLesson.test.ts and verifyMandarinPoints.test.ts.
//
// The assertions worth having here are about PACING, not data shape: that a word with
// nothing to say on a beat does not get an empty screen, that an already-learned word
// collapses to a review, and that the progress bar measures something the learner
// actually perceives.
import assert from 'node:assert/strict'

import {
  MANDARIN_COURSE_INTRO,
  buildCoursePlan,
  buildWordRun,
  courseProgress,
  runTeachesAnything,
} from '../mandarinCourse.js'
import type { MandarinLesson } from '../mandarinLesson.js'

function lesson(
  overrides: Partial<MandarinLesson> & { key: string },
): MandarinLesson {
  return {
    key: overrides.key,
    simplified: overrides.simplified ?? '字',
    pinyin: overrides.pinyin ?? 'zì',
    meaning: overrides.meaning ?? 'character',
    meanings: overrides.meanings ?? ['character'],
    categories: overrides.categories ?? [],
    summary: overrides.summary ?? 'summary',
    syllables: overrides.syllables ?? [],
    characters: overrides.characters ?? [],
    soundFamilies: overrides.soundFamilies ?? [],
    homophones: overrides.homophones ?? null,
    history: overrides.history ?? 'history',
    historyStatus: overrides.historyStatus ?? 'pending',
    source: overrides.source ?? { label: 'test', version: 'test' },
    teachability: overrides.teachability ?? 'vocabulary',
  }
}

function withComponents(key: string): MandarinLesson {
  return lesson({
    key,
    characters: [
      {
        character: '清',
        hasAssertedStructure: true,
        components: [
          {
            glyph: '氵',
            role: 'semantic',
            label: 'water',
            contribution: 'water',
          },
        ],
      },
    ],
    teachability: 'structural',
  })
}

function withFamily(key: string): MandarinLesson {
  const base = withComponents(key)
  return {
    ...base,
    soundFamilies: [
      {
        phonetic: '青',
        character: '清',
        members: [
          { key: 'c:请', simplified: '请', pinyin: 'qǐng', meaning: 'please' },
        ],
        readings: ['qing'],
        drifted: false,
      },
    ],
  }
}

const beats = (steps: ReturnType<typeof buildWordRun>) =>
  steps.map((step) => (step.kind === 'word' ? step.beat : step.kind))

// --- a word's run only contains beats it can actually fill -----------------

{
  const full = buildWordRun(withFamily('c:清'))
  assert.deepEqual(beats(full), ['meet', 'sound', 'pieces', 'family', 'recall'])
}

console.log(
  '✅ buildWordRun: a word with structure and a sound family gets the full five beats',
)

{
  // No sound family in the catalog -> no family screen. Showing an empty "who shares
  // this sound" card would teach the learner that the course pads.
  const noFamily = buildWordRun(withComponents('c:x'))
  assert.deepEqual(beats(noFamily), ['meet', 'sound', 'pieces', 'recall'])
}

console.log(
  '✅ buildWordRun: a word with no sound family skips that beat rather than showing it empty',
)

{
  // Nothing to take apart at all.
  const bare = buildWordRun(lesson({ key: 'c:了' }))
  assert.deepEqual(beats(bare), ['meet', 'sound', 'recall'])
}

console.log(
  '✅ buildWordRun: a word with no components at all drops to a three-beat run',
)

{
  // `teachability: 'vocabulary'` must NOT be the test for the pieces beat. A word whose
  // components are all unasserted structural leaves still has something honest to show,
  // and the lesson layer already labels them as asserting no role.
  const leafOnly = lesson({
    key: 'c:leaf',
    teachability: 'vocabulary',
    characters: [
      {
        character: '了',
        hasAssertedStructure: false,
        components: [
          {
            glyph: '乙',
            role: 'form',
            label: 'leaf',
            contribution: 'appears in the form',
          },
        ],
      },
    ],
  })
  assert.ok(
    beats(buildWordRun(leafOnly)).includes('pieces'),
    'a vocabulary-teachability word with real components still gets its pieces screen',
  )
}

console.log(
  '✅ buildWordRun: teachability is not the pieces test — having components is',
)

{
  // Already learned: the course becomes a review rather than making someone re-read a
  // lesson to reach a card they know.
  const review = buildWordRun(withFamily('c:清'), { alreadyLearned: true })
  assert.deepEqual(beats(review), ['recall'])
  assert.equal(runTeachesAnything(review), false)
  assert.equal(runTeachesAnything(buildWordRun(withFamily('c:清'))), true)
}

console.log(
  '✅ buildWordRun: an already-learned word collapses to a single recall beat',
)

// --- the whole session -----------------------------------------------------

{
  const plan = buildCoursePlan({
    lessons: [withFamily('a'), lesson({ key: 'b' })],
    includeIntro: true,
  })

  assert.equal(plan[0]?.kind, 'intro')
  assert.equal(
    plan.filter((step) => step.kind === 'intro').length,
    MANDARIN_COURSE_INTRO.length,
  )
  assert.equal(
    plan.at(-1)?.kind,
    'done',
    'a session always ends somewhere deliberate',
  )

  const noIntro = buildCoursePlan({ lessons: [lesson({ key: 'a' })] })
  assert.ok(
    !noIntro.some((step) => step.kind === 'intro'),
    'a returning learner is not made to sit through the orientation again',
  )
}

console.log(
  '✅ buildCoursePlan: intro is opt-in and the session always ends on a done step',
)

{
  const plan = buildCoursePlan({
    lessons: [withFamily('a'), withFamily('b')],
    learnedKeys: new Set(['a']),
  })
  const aBeats = plan.filter((s) => s.kind === 'word' && s.cardKey === 'a')
  const bBeats = plan.filter((s) => s.kind === 'word' && s.cardKey === 'b')
  assert.equal(aBeats.length, 1, 'the learned word is a review')
  assert.equal(bBeats.length, 5, 'the new word is taught in full')
}

console.log(
  '✅ buildCoursePlan: learned and unlearned words coexist in one session',
)

{
  // Every step id is unique, so steps can be keyed and resumed by id rather than index.
  const plan = buildCoursePlan({
    lessons: [withFamily('a'), withFamily('b')],
    includeIntro: true,
  })
  const ids = plan.map((step) => step.id)
  assert.equal(
    new Set(ids).size,
    ids.length,
    'step ids must be unique across a session',
  )
}

console.log('✅ buildCoursePlan: every step carries a unique, resumable id')

// --- progress --------------------------------------------------------------

{
  const plan = buildCoursePlan({
    lessons: [withFamily('a'), lesson({ key: 'b' })],
  })

  // Index 0 is the first beat of word a: nothing finished yet.
  assert.deepEqual(courseProgress(plan, 0), {
    wordsDone: 0,
    wordsTotal: 2,
    ratio: 0,
  })

  // Mid-way through word a's run, a is still in progress and must not count.
  assert.equal(
    courseProgress(plan, 2).wordsDone,
    0,
    'a word in progress is not a word done — the bar must not advance mid-word',
  )

  // First beat of word b: a is behind us.
  const firstB = plan.findIndex((s) => s.kind === 'word' && s.cardKey === 'b')
  assert.equal(courseProgress(plan, firstB).wordsDone, 1)

  // The done step: everything is behind us.
  const doneAt = plan.length - 1
  const atEnd = courseProgress(plan, doneAt)
  assert.equal(atEnd.wordsDone, 2)
  assert.equal(atEnd.ratio, 1)
}

console.log(
  '✅ courseProgress: measures whole words, so the bar does not lurch on longer runs',
)

{
  // Intro steps are not words and must not dilute the count -- otherwise the bar would
  // already read "4 of 6" before the learner has seen a single character.
  const plan = buildCoursePlan({
    lessons: [lesson({ key: 'a' })],
    includeIntro: true,
  })
  assert.equal(courseProgress(plan, 0).wordsTotal, 1)
  assert.equal(courseProgress(plan, 2).wordsDone, 0)
}

console.log(
  '✅ courseProgress: the introduction does not count toward word progress',
)

{
  const empty = buildCoursePlan({ lessons: [] })
  assert.deepEqual(courseProgress(empty, 0), {
    wordsDone: 0,
    wordsTotal: 0,
    ratio: 0,
  })
}

console.log(
  '✅ courseProgress: an empty session reports zero rather than dividing by zero',
)

// --- the introduction itself -----------------------------------------------

{
  assert.ok(MANDARIN_COURSE_INTRO.length >= 3)
  for (const card of MANDARIN_COURSE_INTRO) {
    assert.ok(card.title.length > 0, 'every intro card needs a title')
    assert.ok(
      card.body.trim().endsWith('.'),
      `intro card ${card.id} must be complete prose, not a fragment`,
    )
  }

  const howItWorks = MANDARIN_COURSE_INTRO.at(-1)
  assert.ok(
    /not timed|no streak|nothing is a streak/i.test(howItWorks?.body ?? ''),
    'the last intro card must state that nothing here nags — Silas ruled that mechanic out by name, and saying so beats a learner waiting for a nag that never comes',
  )
}

console.log(
  '✅ intro: complete prose, and it states the no-nagging contract out loud',
)

console.log('✅ verifyMandarinCourse: all assertions passed')
