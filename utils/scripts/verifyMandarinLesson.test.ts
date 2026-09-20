// /utils/scripts/verifyMandarinLesson.test.ts
//
// Regression test for mandarin-tutor/t-022's teaching layer (utils/mandarinLesson.ts).
// Pure functions only -- no prisma, no database, no network, no Nuxt/H3 runtime -- same
// discipline as utils/scripts/verifyMandarinSrs.test.ts.
//
// The assertions that matter most here are the HONESTY ones: a lesson must never dress a
// structural leaf up as a meaning claim, and a word the source says nothing useful about
// must be reported as `vocabulary` rather than padded out with an invented story.
import assert from 'node:assert/strict'

import {
  buildMandarinLesson,
  buildMandarinLessonIndex,
  describeContribution,
  isTeachingRole,
  describeSyllables,
  exactReadingKey,
  homophoneKey,
  splitPinyinSyllable,
  tonelessPinyin,
} from '../mandarinLesson.js'
import type {
  MandarinCard,
  MandarinComponent,
  MandarinSource,
} from '../mandarin.js'

const SOURCE: MandarinSource = { label: 'test source', version: 'test' }

function card(
  overrides: Partial<MandarinCard> &
    Pick<MandarinCard, 'simplified' | 'pinyin'>,
): MandarinCard {
  return {
    key: overrides.key ?? `test:${overrides.simplified}`,
    simplified: overrides.simplified,
    pinyin: overrides.pinyin,
    meaning: overrides.meaning ?? 'meaning',
    meanings: overrides.meanings ?? [overrides.meaning ?? 'meaning'],
    kind: overrides.kind ?? 'character',
    partsOfSpeech: [],
    classifiers: [],
    categories: overrides.categories ?? [],
    components: overrides.components ?? [],
    historyStatus: overrides.historyStatus ?? 'pending',
    source: overrides.source ?? SOURCE,
    ...(overrides.history ? { history: overrides.history } : {}),
    ...(overrides.traditional ? { traditional: overrides.traditional } : {}),
    ...(overrides.hskLevel ? { hskLevel: overrides.hskLevel } : {}),
  }
}

function component(
  glyph: string,
  role: MandarinComponent['role'],
  character: string,
  extra: Partial<MandarinComponent> = {},
): MandarinComponent {
  return { glyph, role, character, label: `${character} ${role}`, ...extra }
}

// --- pinyin anatomy --------------------------------------------------------

{
  assert.equal(tonelessPinyin('shuō'), 'shuo')
  assert.equal(
    tonelessPinyin('lǜ'),
    'lü',
    'ü keeps its diaeresis; only the tone comes off',
  )
  assert.equal(
    tonelessPinyin('shuo1'),
    'shuo',
    'numeric tone marks are stripped too',
  )

  assert.deepEqual(splitPinyinSyllable('shuō'), { initial: 'sh', final: 'uo' })
  assert.deepEqual(
    splitPinyinSyllable('sè'),
    { initial: 's', final: 'e' },
    'the s/sh digraph must not swallow a bare s',
  )
  assert.deepEqual(
    splitPinyinSyllable('ér'),
    { initial: '', final: 'er' },
    'a syllable with no written initial reports an empty initial rather than guessing one',
  )
  assert.deepEqual(
    splitPinyinSyllable('wǔ'),
    { initial: 'w', final: 'u' },
    'w acts as the onset when something follows it',
  )
}

console.log('✅ pinyin anatomy: tone stripping and initial/final splitting')

{
  const syllables = describeSyllables('nǐ hǎo')
  assert.equal(syllables.length, 2)
  assert.equal(syllables[0]?.lexicalTone, 3)
  assert.equal(
    syllables[0]?.spokenTone,
    2,
    'third-tone sandhi: 你 before 好 is actually said with a rising shape',
  )
  assert.ok(
    syllables[0]?.sandhiNote,
    'a syllable whose spoken tone differs from its lexical tone must say so',
  )
  assert.equal(syllables[1]?.lexicalTone, 3)
  assert.equal(syllables[1]?.spokenTone, 3)
  assert.equal(syllables[1]?.sandhiNote, undefined)
  assert.ok(
    syllables[0]?.toneShape.length,
    'every syllable gets a plain-language pitch description',
  )
}

console.log('✅ describeSyllables: tones, sandhi, and per-syllable pitch shape')

// --- the honesty contract, and the brevity contract -----------------------

{
  const semantic = describeContribution(
    component('讠', 'semantic', '说', { meaning: 'speech; language' }),
    '说',
  )
  assert.ok(
    semantic.includes('speech; language'),
    'a semantic component names the domain it puts the character in',
  )
  assert.ok(
    semantic.includes('meaning side'),
    'a semantic component must be distinguished from a sound clue in words, not just by a badge',
  )

  const phonetic = describeContribution(component('兑', 'phonetic', '说'), '说')
  assert.ok(
    phonetic.includes('not what it means'),
    'the single most common beginner error is reading the phonetic as a second meaning',
  )

  const radical = describeContribution(component('言', 'radical', '说'), '说')
  assert.ok(
    /filed under/i.test(radical),
    'a dictionary radical is a filing fact and should read as one',
  )
  assert.ok(
    !/meaning|sound/i.test(radical),
    'a radical line must not claim -- or spend words denying -- a meaning or sound role',
  )

  const form = describeContribution(component('丷', 'form', '说'), '说')
  assert.ok(
    /also written with/i.test(form),
    'an unexplained stroke group is a fact about the written form, not a lesson',
  )

  const uncertain = describeContribution(
    component('？', 'uncertain', '说'),
    '说',
  )
  assert.ok(uncertain.includes('unresolved'))
  assert.ok(
    !uncertain.includes('？ is'),
    'the unresolved branch must not read as though ？ were itself a component with a job',
  )
}

console.log(
  '✅ describeContribution: teaching roles explain, reference roles just state a fact',
)

{
  // THE REGRESSION GUARD. Silas, 2026-09-20, on hitting 的's pieces card: "wtf, there
  // are phrases that mean nothing." Every line on that card was true, sourced, and
  // carefully hedged -- and together they said nothing, because each one spent its
  // words explaining the limits of the source instead of teaching.
  //
  // The honesty contract is kept by what is SHOWN (a claim appears only where the
  // source made one, and isTeachingRole decides what earns a teaching card at all),
  // NOT by appending a disclaimer to every line. This cap is what stops the
  // disclaimers growing back one clause at a time.
  const MAX = 90
  const roles = [
    'semantic',
    'phonetic',
    'radical',
    'form',
    'uncertain',
  ] as const
  for (const role of roles) {
    for (const meaning of [undefined, 'speech; language']) {
      const line = describeContribution(
        component('言', role, '说', meaning ? { meaning } : {}),
        '说',
      )
      assert.ok(
        line.length <= MAX,
        `${role} contribution is ${line.length} chars, over the ${MAX} cap: ${line}`,
      )
      assert.ok(
        line.trim().endsWith('.'),
        `${role} contribution must be one complete sentence: ${line}`,
      )
    }
  }
}

console.log(
  '✅ describeContribution: every line stays inside the 90-character brevity cap',
)

{
  // Only semantic and phonetic earn a teaching card. This is the predicate the course
  // uses to decide whether a word gets a "what it is built from" screen at all.
  assert.equal(isTeachingRole('semantic'), true)
  assert.equal(isTeachingRole('phonetic'), true)
  assert.equal(isTeachingRole('radical'), false)
  assert.equal(isTeachingRole('form'), false)
  assert.equal(isTeachingRole('uncertain'), false)
}

console.log('✅ isTeachingRole: only an asserted role counts as teaching')

// --- component attribution across a multi-character word -------------------

{
  const dianNao = card({
    simplified: '电脑',
    pinyin: 'diàn nǎo',
    meaning: 'computer',
    kind: 'word',
    components: [
      component('电', 'form', '电'),
      component('月', 'semantic', '脑', { meaning: 'flesh; body' }),
      component('nao-phonetic', 'phonetic', '脑'),
    ],
  })

  const lesson = buildMandarinLesson(dianNao)
  assert.equal(lesson.characters.length, 2)
  assert.equal(lesson.characters[0]?.character, '电')
  assert.equal(lesson.characters[1]?.character, '脑')
  assert.equal(
    lesson.characters[0]?.components.length,
    1,
    '电 must not inherit 脑 pieces from the flat components array',
  )
  assert.equal(lesson.characters[1]?.components.length, 2)
  assert.equal(lesson.characters[0]?.hasAssertedStructure, false)
  assert.equal(lesson.characters[1]?.hasAssertedStructure, true)
}

console.log(
  '✅ buildMandarinLesson: a word’s pieces are attributed to the right character',
)

{
  // A payload written before `character` existed: attribution falls back to the label
  // prefix, which is the shape server/utils/mandarinCharacterData.ts has always written.
  const legacy = card({
    simplified: '电脑',
    pinyin: 'diàn nǎo',
    kind: 'word',
    components: [
      { glyph: '月', role: 'semantic', label: '脑 meaning clue' },
      { glyph: '电', role: 'form', label: '电 written component' },
    ],
  })
  const lesson = buildMandarinLesson(legacy)
  assert.equal(lesson.characters[0]?.components[0]?.glyph, '电')
  assert.equal(lesson.characters[1]?.components[0]?.glyph, '月')
}

console.log(
  '✅ buildMandarinLesson: legacy payloads without `character` still attribute correctly',
)

// --- teachability ----------------------------------------------------------

{
  const bare = card({
    simplified: '了',
    pinyin: 'le',
    components: [component('乙', 'form', '了')],
  })
  const lesson = buildMandarinLesson(bare)
  assert.equal(
    lesson.teachability,
    'vocabulary',
    'a card whose only pieces are unasserted structural leaves has no structural story to teach',
  )
  assert.ok(
    /do not explain it|learn .* as a whole/.test(lesson.summary),
    'the summary must tell the learner what to DO about the silence, not narrate the silence',
  )
  assert.ok(
    lesson.summary.length <= 120,
    `the vocabulary summary must stay short (${lesson.summary.length} chars): ${lesson.summary}`,
  )
  assert.ok(
    lesson.history.includes('makes no historical claim'),
    'a card with no history falls back to an explicit no-claim, never to an invented one',
  )

  const rich = card({
    simplified: '说',
    pinyin: 'shuō',
    components: [
      component('讠', 'semantic', '说', { meaning: 'speech; language' }),
      component('兑', 'phonetic', '说'),
    ],
  })
  assert.equal(buildMandarinLesson(rich).teachability, 'structural')
}

console.log(
  '✅ buildMandarinLesson: teachability separates a real decomposition from a bare leaf dump',
)

// --- sound families (the 青 -> 请/清/情 relationship) -----------------------

{
  const qing = card({
    key: 'c:请',
    simplified: '请',
    pinyin: 'qǐng',
    meaning: 'please; to invite',
    components: [
      component('青', 'phonetic', '请'),
      component('讠', 'semantic', '请', { meaning: 'speech' }),
    ],
  })
  const qingClear = card({
    key: 'c:清',
    simplified: '清',
    pinyin: 'qīng',
    meaning: 'clear',
    components: [component('青', 'phonetic', '清')],
  })
  const qingFeeling = card({
    key: 'c:情',
    simplified: '情',
    pinyin: 'qíng',
    meaning: 'feeling',
    components: [component('青', 'phonetic', '情')],
  })
  const unrelated = card({
    key: 'c:猫',
    simplified: '猫',
    pinyin: 'māo',
    meaning: 'cat',
    components: [component('苗', 'phonetic', '猫')],
  })

  const index = buildMandarinLessonIndex([
    qing,
    qingClear,
    qingFeeling,
    unrelated,
  ])
  const lesson = buildMandarinLesson(qing, index)

  assert.equal(
    lesson.soundFamilies.length,
    1,
    'only the phonetic component seeds a sound family',
  )
  const family = lesson.soundFamilies[0]
  assert.equal(family?.phonetic, '青')
  assert.equal(family?.character, '请')
  assert.deepEqual(
    family?.members.map((member) => member.simplified).sort(),
    ['情', '清'],
    'the family lists the other catalog members and excludes the card itself',
  )
  assert.ok(
    !family?.members.some((member) => member.simplified === '猫'),
    'a different phonetic component must not leak into the family',
  )
  assert.deepEqual(
    family?.readings,
    ['qing'],
    'qǐng/qīng/qíng share one toneless reading',
  )
  assert.equal(family?.drifted, false)
}

console.log(
  '✅ sound families: 青 gathers 请/清/情 and excludes unrelated phonetics',
)

{
  // The drifted case Silas finds interesting: 兑 built 说 shuō and 税 shuì, which no
  // longer sound alike. That is a real historical fact, not a data error, so the lesson
  // must flag it rather than hide or "correct" it.
  const shuo = card({
    key: 'c:说',
    simplified: '说',
    pinyin: 'shuō',
    meaning: 'to speak',
    components: [component('兑', 'phonetic', '说')],
  })
  const shui = card({
    key: 'c:税',
    simplified: '税',
    pinyin: 'shuì',
    meaning: 'tax',
    components: [component('兑', 'phonetic', '税')],
  })

  const lesson = buildMandarinLesson(
    shuo,
    buildMandarinLessonIndex([shuo, shui]),
  )
  const family = lesson.soundFamilies[0]
  assert.equal(family?.phonetic, '兑')
  assert.equal(
    family?.drifted,
    true,
    'shuo vs shui is a genuine sound drift and must be reported',
  )
  assert.deepEqual(family?.readings, ['shuo', 'shui'])
}

console.log(
  '✅ sound families: a drifted family (兑 -> 说 shuō / 税 shuì) is flagged, not hidden',
)

{
  // A phonetic nobody else in the catalog shares is not a "family of one" -- showing the
  // card back to itself under a Sound Family heading teaches nothing.
  const lonely = card({
    simplified: '猫',
    pinyin: 'māo',
    components: [component('苗', 'phonetic', '猫')],
  })
  const lesson = buildMandarinLesson(lonely, buildMandarinLessonIndex([lonely]))
  assert.equal(lesson.soundFamilies.length, 0)
}

console.log(
  '✅ sound families: a family with no other members is omitted rather than shown empty',
)

// --- homophones ------------------------------------------------------------

{
  assert.equal(homophoneKey('shuō fú'), 'shuofu')
  assert.equal(exactReadingKey('shuō fú'), 'shuōfú')

  const shi4gu4 = card({
    key: 'a',
    simplified: '事故',
    pinyin: 'shì gù',
    meaning: 'accident',
    kind: 'word',
  })
  const shi4gu4b = card({
    key: 'b',
    simplified: '世故',
    pinyin: 'shì gù',
    meaning: 'worldly-wise',
    kind: 'word',
  })
  const shi2gu4 = card({
    key: 'c',
    simplified: '石鼓',
    pinyin: 'shí gǔ',
    meaning: 'stone drum',
    kind: 'word',
  })
  const other = card({
    key: 'd',
    simplified: '猫',
    pinyin: 'māo',
    meaning: 'cat',
  })

  const lesson = buildMandarinLesson(
    shi4gu4,
    buildMandarinLessonIndex([shi4gu4, shi4gu4b, shi2gu4, other]),
  )

  assert.equal(lesson.homophones?.base, 'shigu')
  assert.deepEqual(
    lesson.homophones?.exact.map((entry) => entry.simplified),
    ['世故'],
    'same syllables AND same tones is a true homophone',
  )
  assert.deepEqual(
    lesson.homophones?.toneVariants.map((entry) => entry.simplified),
    ['石鼓'],
    'same syllables, different tones belongs in the near-miss bucket, not the homophone one',
  )
  assert.ok(
    !lesson.homophones?.exact.some((entry) => entry.simplified === '猫'),
    'an unrelated reading must not appear',
  )
}

console.log(
  '✅ homophones: exact readings and tone-variant near-misses stay in separate buckets',
)

{
  const solo = card({ simplified: '猫', pinyin: 'māo' })
  const lesson = buildMandarinLesson(solo, buildMandarinLessonIndex([solo]))
  assert.equal(
    lesson.homophones,
    null,
    'a card with no homophones reports null, not an empty shell',
  )
}

console.log('✅ homophones: a card with none reports null')

// --- a card outside the catalog (a user-requested word) --------------------

{
  const requested = card({
    key: 'requested:42',
    simplified: '说',
    pinyin: 'shuō',
    components: [component('讠', 'semantic', '说', { meaning: 'speech' })],
  })
  const lesson = buildMandarinLesson(requested)
  assert.equal(lesson.soundFamilies.length, 0)
  assert.equal(lesson.homophones, null)
  assert.equal(
    lesson.syllables.length,
    1,
    'pinyin anatomy still works with no corpus',
  )
  assert.equal(
    lesson.characters[0]?.components.length,
    1,
    'component roles still work with no corpus',
  )
}

console.log(
  '✅ buildMandarinLesson: works without an index, losing only the cross-links',
)

console.log('✅ verifyMandarinLesson: all assertions passed')
