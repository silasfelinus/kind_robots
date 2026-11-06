import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CURATED_MANDARIN_CARDS, type MandarinCard } from '../mandarin'
import {
  animalMandarinCards,
  choiceCount,
  geographyQuestion,
  isMandarinQuizScope,
  mandarinTopicCards,
  MANDARIN_QUIZ_TOPICS,
  mandarinFrontier,
  mandarinQuestion,
  STATE_CAPITALS,
  unlockedCount,
} from './quiz'

assert.equal(STATE_CAPITALS.length, 50, 'every US state must be represented')
assert.equal(new Set(STATE_CAPITALS.map((row) => row[0])).size, 50)
assert.equal(unlockedCount(0, 50), 6)
assert.equal(unlockedCount(9, 50), 15)
assert.equal(unlockedCount(1000, 50), 50)

for (const module of ['flags', 'capitals'] as const) {
  const first = geographyQuestion(module, 0, null, () => 0)
  assert.equal(first.module, module)
  assert.equal(first.options.length, 4)
  assert.equal(new Set(first.options.map((option) => option.id)).size, 4)
  assert.ok(first.options.some((option) => option.id === first.correctId))
  const next = geographyQuestion(module, 9, first.id, () => 0)
  assert.notEqual(
    next.id,
    first.id,
    'repeated questions rotate when alternatives exist',
  )
}
assert.equal(
  geographyQuestion('capitals', 0, null, () => 0).correctId,
  'Montgomery',
)
assert.match(geographyQuestion('flags', 0, null, () => 0).hero, /[🇦-🇿]/u)
assert.equal(choiceCount('easy'), 2)
assert.equal(choiceCount('standard'), 4)
assert.equal(unlockedCount(0, 50, 'challenge'), 12)
assert.equal(
  geographyQuestion('flags', 0, null, () => 0, 'easy').options.length,
  2,
)
assert.ok(
  geographyQuestion('flags', 0, null, () => 0).options.every(
    (option) => !option.icon,
  ),
  'flag answers must not display the matching flag next to country labels',
)
const reversedFlag = geographyQuestion(
  'flags',
  0,
  null,
  () => 0,
  'standard',
  true,
)
assert.equal(reversedFlag.hero, 'United States')
assert.equal(reversedFlag.correctId, 'United States')
assert.match(
  reversedFlag.options.find((option) => option.id === reversedFlag.correctId)!
    .label,
  /[🇦-🇿]/u,
)
const reversedCapital = geographyQuestion(
  'capitals',
  0,
  null,
  () => 0,
  'standard',
  true,
)
assert.equal(reversedCapital.hero, 'Montgomery')
assert.equal(reversedCapital.correctId, 'Alabama')

const cards = [
  { key: 'a', simplified: '鱼', pinyin: 'yú', meaning: 'fish', hskLevel: 1 },
  { key: 'b', simplified: '水', pinyin: 'shuǐ', meaning: 'water', hskLevel: 1 },
  { key: 'c', simplified: '猫', pinyin: 'māo', meaning: 'cat', hskLevel: 1 },
  { key: 'd', simplified: '书', pinyin: 'shū', meaning: 'book', hskLevel: 1 },
  { key: 'e', simplified: '火', pinyin: 'huǒ', meaning: 'fire', hskLevel: 1 },
  { key: 'f', simplified: '人', pinyin: 'rén', meaning: 'person', hskLevel: 1 },
  {
    key: 'g',
    simplified: '山',
    pinyin: 'shān',
    meaning: 'mountain',
    hskLevel: 1,
  },
] as MandarinCard[]
const q = mandarinQuestion(cards[0]!, cards, () => 0)
assert.equal(q.module, 'mandarin')
assert.equal(q.hero, '鱼')
assert.equal(q.correctId, 'a')
assert.equal(q.options.length, 4)
assert.equal(new Set(q.options.map((x) => x.label)).size, 4)

const reversedMandarin = mandarinQuestion(
  cards[0]!,
  cards,
  () => 0,
  'easy',
  true,
)
assert.equal(reversedMandarin.hero, 'fish')
assert.equal(reversedMandarin.options.length, 2)
assert.equal(
  reversedMandarin.options.find((option) => option.id === 'a')?.label,
  '鱼',
)
const start = mandarinFrontier(cards, {}, null, 0, () => 0)
assert.equal(start?.key, 'a')
assert.equal(mandarinFrontier(cards, {}, 'a', 0, () => 0)?.key, 'b')
assert.equal(mandarinFrontier(cards, {}, null, 2, () => 0)?.key, 'a')
const due = { b: { repetitions: 1, dueAt: '2020-01-01T00:00:00Z' } }
assert.equal(
  mandarinFrontier(cards, due, null, 0, () => 0)?.key,
  'b',
  'due reviews outrank new words',
)

assert.ok(
  MANDARIN_QUIZ_TOPICS.length >= 20,
  'the topic selector exposes the tutor taxonomy',
)
for (const scope of [
  'all',
  'animals',
  'colors',
  'family',
  'food-drink',
  'travel-transport',
  'numbers',
  'casino',
])
  assert.ok(isMandarinQuizScope(scope), `registered topic: ${scope}`)
assert.equal(isMandarinQuizScope('invented'), false)
assert.ok(mandarinTopicCards(CURATED_MANDARIN_CARDS, 'colors').length >= 8)
assert.ok(mandarinTopicCards(CURATED_MANDARIN_CARDS, 'casino').length >= 20)
assert.equal(mandarinTopicCards(CURATED_MANDARIN_CARDS, 'invented').length, 0)
const animals = animalMandarinCards(CURATED_MANDARIN_CARDS)
assert.ok(
  animals.length >= 15,
  'the curated Mandarin catalog contains animal names',
)
assert.ok(animals.every((card) => card.categories.includes('animals')))
assert.ok(
  animals.some((card) => card.hskLevel === undefined),
  'curated animals without HSK levels remain eligible',
)
const animalQuestion = mandarinFrontier(
  [...cards, ...animals],
  {},
  null,
  0,
  () => 0,
  'animals',
)
assert.ok(animalQuestion && animalQuestion.categories.includes('animals'))
const animalOptions = mandarinQuestion(animalQuestion!, animals, () => 0)
assert.equal(animalOptions.options.length, 4)
assert.ok(
  animalOptions.options.every((option) =>
    animals.some((card) => card.key === option.id),
  ),
  'animal-only distractors must also be animal names',
)
const animalReviews = {
  [animals[1]!.key]: { repetitions: 1, dueAt: '2020-01-01T00:00:00Z' },
}
assert.equal(
  mandarinFrontier(animals, animalReviews, null, 0, () => 0, 'animals')?.key,
  animals[1]!.key,
  'animal review keeps the same spaced-repetition priority',
)
assert.notEqual(
  mandarinFrontier(
    animals,
    animalReviews,
    animals[1]!.key,
    0,
    () => 0,
    'animals',
  )?.key,
  animals[1]!.key,
  'a freshly missed animal does not trap the player in the same question',
)

const store = readFileSync('stores/rulerHookedStore.ts', 'utf8')
assert.match(
  store,
  /function landQuizFish\(\)[\s\S]*?advanceFishing\(\{[\s\S]*?stage: 'LANDED'/,
  'quiz successes must use the same fish reward/turn transition',
)
const lake = readFileSync(
  'components/ruler-hooked/ruler-hooked-lake-screen.vue',
  'utf8',
)
assert.match(
  lake,
  /<RulerHookedQuizEncounter[\s\S]*?!store\.activeClassicFishing/,
  'quiz mode remains isolated from the classic fight even if fishing settings change mid-cast',
)
assert.match(
  lake,
  /<RulerHookedFishingEncounter[\s\S]*?v-else-if="store\.activeClassicFishing"/,
)
const quiz = readFileSync(
  'components/ruler-hooked/ruler-hooked-quiz-encounter.vue',
  'utf8',
)
const quizStore = readFileSync('stores/rulerHookedQuizStore.ts', 'utf8')
const settings = readFileSync(
  'components/ruler-hooked/ruler-hooked-study-settings.vue',
  'utf8',
)
const sheet = readFileSync(
  'components/ruler-hooked/ruler-hooked-mandarin-answer-sheet.vue',
  'utf8',
)
assert.match(settings, /quiz\.setMandarinScope\(topic\.id\)/)
assert.match(settings, /quiz\.setLessonMode\(choice\.id\)/)
assert.match(settings, /quiz\.setDifficulty\(choice\.id\)/)
assert.match(settings, /quiz\.setPromptDirection\(choice\.id\)/)
assert.match(settings, /quiz\.setReferenceDetail\('full'\)/)
assert.match(
  quizStore,
  /isMandarinQuizScope\(parsed\.mandarinScope\)/,
  'unknown saved topics cannot poison the selector',
)
assert.match(
  quizStore,
  /topicCorrect\.value\[mandarinScope\.value\]/,
  'new topics get their own unlock progression',
)
assert.match(
  quizStore,
  /lessonMode\.value === 'guided'/,
  'guided mode introduces unfamiliar items',
)
assert.match(
  quizStore,
  /answerSheet\.value = true/,
  'every answer opens the field guide',
)
const geographyGuide = readFileSync(
  'components/ruler-hooked/ruler-hooked-geography-fact-sheet.vue',
  'utf8',
)
assert.match(
  quiz,
  /<RulerHookedGeographyFactSheet/,
  'geography has a study and review screen',
)
assert.match(
  geographyGuide,
  /question\.explanation/,
  'geography sheets explain their fact pair',
)
assert.match(sheet, /detail === 'full'/, 'word history detail is configurable')
assert.match(
  quizStore,
  /animalMandarinCards\(tutor\.cards\)/,
  'animal mode draws from the shared tutor catalog',
)
assert.match(
  quizStore,
  /answerSheet\.value = true/,
  'answer selection opens an answer reference',
)
assert.match(
  quizStore,
  /function finishAnswerSheet\(\)[\s\S]*?if \(caught\) fishing\.landQuizFish\(\)/,
  'a correct Mandarin answer waits for the sheet before landing the fish',
)
assert.match(
  quiz,
  /<RulerHookedMandarinAnswerSheet/,
  'answer sheet is in the fishing flow',
)
assert.match(
  sheet,
  /lesson\.history/,
  'word history comes from the Mandarin Tutor lesson',
)
assert.match(
  sheet,
  /card\.source\.label/,
  'answer sheets credit source material',
)
assert.match(
  sheet,
  /emit\('speak'\)/,
  'answer sheet has playable pronunciation',
)
assert.match(
  quiz,
  /<KrChoiceHand/,
  'the challenge uses the shared animated-card choice system',
)
assert.match(
  quiz,
  /quiz\.finishIntroduction\(\)/,
  'new words are introduced before recall',
)
assert.match(quiz, /tutor\.speak/, 'Mandarin offers tutor audio')
console.log(
  'Quiz-to-catch: geography, Mandarin frontier, rewards, and console wiring passed.',
)
