import { BUILT_IN_SET_META, type MandarinCard } from '../mandarin'

export type FishingQuizModule = 'flags' | 'capitals' | 'mandarin'
export type FishingMode = 'classic' | 'quiz'
export type MandarinQuizScope = string
export type FishingQuizDifficulty = 'easy' | 'standard' | 'challenge'
export type FishingLessonMode = 'guided' | 'always' | 'quiz-first'
export type FishingPromptDirection = 'forward' | 'reverse' | 'mixed'

export const MANDARIN_QUIZ_TOPICS = [
  {
    id: 'all',
    label: 'All beginner words',
    description: 'A broad beginner vocabulary mix.',
  },
  ...Object.entries(BUILT_IN_SET_META).map(([id, meta]) => ({
    id,
    label: meta.label,
    description: meta.description,
  })),
]
export function isMandarinQuizScope(value: string): boolean {
  return MANDARIN_QUIZ_TOPICS.some((topic) => topic.id === value)
}

export function choiceCount(difficulty: FishingQuizDifficulty): number {
  return difficulty === 'easy' ? 2 : 4
}
export type QuizOption = {
  id: string
  label: string
  icon?: string
  image?: string
}
export type FishingQuizQuestion = {
  id: string
  module: FishingQuizModule
  prompt: string
  hero: string
  heroImage?: string
  answerImage?: string
  options: QuizOption[]
  correctId: string
  explanation: string
  cardKey?: string
}

type Place = { name: string; answer: string; image?: string }

const COUNTRIES: readonly [string, string][] = [
  ['US', 'United States'],
  ['CA', 'Canada'],
  ['MX', 'Mexico'],
  ['BR', 'Brazil'],
  ['AR', 'Argentina'],
  ['CL', 'Chile'],
  ['PE', 'Peru'],
  ['CO', 'Colombia'],
  ['GB', 'United Kingdom'],
  ['IE', 'Ireland'],
  ['FR', 'France'],
  ['DE', 'Germany'],
  ['ES', 'Spain'],
  ['PT', 'Portugal'],
  ['IT', 'Italy'],
  ['GR', 'Greece'],
  ['NO', 'Norway'],
  ['SE', 'Sweden'],
  ['FI', 'Finland'],
  ['DK', 'Denmark'],
  ['IS', 'Iceland'],
  ['NL', 'Netherlands'],
  ['BE', 'Belgium'],
  ['CH', 'Switzerland'],
  ['AT', 'Austria'],
  ['PL', 'Poland'],
  ['UA', 'Ukraine'],
  ['TR', 'Türkiye'],
  ['EG', 'Egypt'],
  ['ZA', 'South Africa'],
  ['NG', 'Nigeria'],
  ['KE', 'Kenya'],
  ['MA', 'Morocco'],
  ['IN', 'India'],
  ['CN', 'China'],
  ['JP', 'Japan'],
  ['KR', 'South Korea'],
  ['TH', 'Thailand'],
  ['VN', 'Vietnam'],
  ['PH', 'Philippines'],
  ['ID', 'Indonesia'],
  ['SG', 'Singapore'],
  ['MY', 'Malaysia'],
  ['AU', 'Australia'],
  ['NZ', 'New Zealand'],
  ['FJ', 'Fiji'],
  ['SA', 'Saudi Arabia'],
  ['AE', 'United Arab Emirates'],
  ['IL', 'Israel'],
  ['PK', 'Pakistan'],
]

export const STATE_CAPITALS: readonly [string, string][] = [
  ['Alabama', 'Montgomery'],
  ['Alaska', 'Juneau'],
  ['Arizona', 'Phoenix'],
  ['Arkansas', 'Little Rock'],
  ['California', 'Sacramento'],
  ['Colorado', 'Denver'],
  ['Connecticut', 'Hartford'],
  ['Delaware', 'Dover'],
  ['Florida', 'Tallahassee'],
  ['Georgia', 'Atlanta'],
  ['Hawaii', 'Honolulu'],
  ['Idaho', 'Boise'],
  ['Illinois', 'Springfield'],
  ['Indiana', 'Indianapolis'],
  ['Iowa', 'Des Moines'],
  ['Kansas', 'Topeka'],
  ['Kentucky', 'Frankfort'],
  ['Louisiana', 'Baton Rouge'],
  ['Maine', 'Augusta'],
  ['Maryland', 'Annapolis'],
  ['Massachusetts', 'Boston'],
  ['Michigan', 'Lansing'],
  ['Minnesota', 'Saint Paul'],
  ['Mississippi', 'Jackson'],
  ['Missouri', 'Jefferson City'],
  ['Montana', 'Helena'],
  ['Nebraska', 'Lincoln'],
  ['Nevada', 'Carson City'],
  ['New Hampshire', 'Concord'],
  ['New Jersey', 'Trenton'],
  ['New Mexico', 'Santa Fe'],
  ['New York', 'Albany'],
  ['North Carolina', 'Raleigh'],
  ['North Dakota', 'Bismarck'],
  ['Ohio', 'Columbus'],
  ['Oklahoma', 'Oklahoma City'],
  ['Oregon', 'Salem'],
  ['Pennsylvania', 'Harrisburg'],
  ['Rhode Island', 'Providence'],
  ['South Carolina', 'Columbia'],
  ['South Dakota', 'Pierre'],
  ['Tennessee', 'Nashville'],
  ['Texas', 'Austin'],
  ['Utah', 'Salt Lake City'],
  ['Vermont', 'Montpelier'],
  ['Virginia', 'Richmond'],
  ['Washington', 'Olympia'],
  ['West Virginia', 'Charleston'],
  ['Wisconsin', 'Madison'],
  ['Wyoming', 'Cheyenne'],
]

/** Bundled SVG flags (public/flags, from flag-icons, MIT): flag emoji
 *  render as bare letters on Windows, so the quiz never relies on them. */
export function flagImage(code: string): string {
  return '/flags/' + code.toLowerCase() + '.svg'
}

export function unlockedCount(
  correct: number,
  total: number,
  difficulty: FishingQuizDifficulty = 'standard',
): number {
  const start = difficulty === 'challenge' ? 12 : 6
  const step = difficulty === 'easy' ? 2 : difficulty === 'challenge' ? 4 : 3
  return Math.min(total, start + Math.floor(Math.max(0, correct) / 3) * step)
}

function index(length: number, random: () => number): number {
  return Math.min(
    length - 1,
    Math.floor(Math.max(0, Math.min(0.999999, random())) * length),
  )
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]
  for (let n = result.length - 1; n > 0; n--) {
    const i = index(n + 1, random)
    ;[result[i], result[n]] = [result[n]!, result[i]!]
  }
  return result
}

function options(
  correct: Place,
  all: readonly Place[],
  random: () => number,
  module: 'flags' | 'capitals',
  difficulty: FishingQuizDifficulty,
  reversed: boolean,
): QuizOption[] {
  const choices = [
    correct,
    ...shuffled(
      all.filter((place) => place.name !== correct.name),
      random,
    ).slice(0, choiceCount(difficulty) - 1),
  ]
  return shuffled(choices, random).map((place, n) =>
    reversed && module === 'flags'
      ? {
          id: place.name,
          label: 'Flag ' + String.fromCharCode(65 + n),
          image: place.image,
        }
      : {
          id: reversed ? place.name : place.answer,
          label: reversed ? place.name : place.answer,
        },
  )
}

export function geographyQuestion(
  module: 'flags' | 'capitals',
  correctAnswers: number,
  previousId: string | null = null,
  random: () => number = Math.random,
  difficulty: FishingQuizDifficulty = 'standard',
  reversed = false,
): FishingQuizQuestion {
  const places: Place[] =
    module === 'flags'
      ? COUNTRIES.map(([code, name]) => ({
          name,
          answer: name,
          image: flagImage(code),
        }))
      : STATE_CAPITALS.map(([name, capital]) => ({ name, answer: capital }))
  const pool = places.slice(
    0,
    unlockedCount(correctAnswers, places.length, difficulty),
  )
  const candidates = pool.filter(
    (place) => module + ':' + place.name !== previousId,
  )
  const correct = (candidates.length ? candidates : pool)[
    index(candidates.length || pool.length, random)
  ]!
  const id = module + ':' + correct.name
  return {
    id,
    module,
    prompt:
      module === 'flags'
        ? reversed
          ? 'Which flag belongs to this country?'
          : 'Which country flies this flag?'
        : reversed
          ? 'Which state has this capital city?'
          : 'What is the capital of ' + correct.name + '?',
    hero: reversed
      ? module === 'flags'
        ? correct.name
        : correct.answer
      : module === 'flags'
        ? 'Flag of a mystery country'
        : correct.name,
    heroImage: module === 'flags' && !reversed ? correct.image : undefined,
    answerImage: module === 'flags' ? correct.image : undefined,
    options: options(correct, places, random, module, difficulty, reversed),
    correctId: reversed ? correct.name : correct.answer,
    explanation:
      module === 'flags'
        ? 'This is the flag of ' + correct.name + '.'
        : correct.name + ' has its capital in ' + correct.answer + '.',
  }
}

export function mandarinQuestion(
  card: MandarinCard,
  catalog: readonly MandarinCard[],
  random: () => number = Math.random,
  difficulty: FishingQuizDifficulty = 'standard',
  reversed = false,
): FishingQuizQuestion {
  const choices = catalog.filter(
    (other) => other.key !== card.key && other.meaning !== card.meaning,
  )
  const distractors = shuffled(choices, random).slice(
    0,
    choiceCount(difficulty) - 1,
  )
  return {
    id: 'mandarin:' + card.key,
    module: 'mandarin',
    cardKey: card.key,
    prompt: reversed
      ? 'Which Mandarin word has this meaning?'
      : 'What does this Mandarin word mean?',
    hero: reversed ? card.meaning : card.simplified,
    options: shuffled([card, ...distractors], random).map((item) => ({
      id: item.key,
      label: reversed ? item.simplified : item.meaning,
    })),
    correctId: card.key,
    explanation:
      card.simplified + ' (' + card.pinyin + ') means ' + card.meaning + '.',
  }
}

export function animalMandarinCards(
  catalog: readonly MandarinCard[],
): MandarinCard[] {
  return catalog.filter(
    (card) =>
      card.categories?.includes('animals') &&
      Boolean(card.meaning && card.simplified),
  )
}

export function mandarinTopicCards(
  catalog: readonly MandarinCard[],
  scope: MandarinQuizScope,
): MandarinCard[] {
  if (scope === 'animals') return animalMandarinCards(catalog)
  if (scope === 'all')
    return catalog.filter(
      (card) =>
        (card.hskLevel ?? 99) <= 2 && Boolean(card.meaning && card.simplified),
    )
  if (!isMandarinQuizScope(scope)) return []
  return catalog.filter(
    (card) =>
      card.categories?.includes(scope) &&
      Boolean(card.meaning && card.simplified),
  )
}

export function mandarinFrontier(
  catalog: readonly MandarinCard[],
  tracked: Readonly<Record<string, { repetitions: number; dueAt: string }>>,
  recentlyAsked: string | null,
  correctAnswers: number,
  random: () => number = Math.random,
  scope: MandarinQuizScope = 'all',
  difficulty: FishingQuizDifficulty = 'standard',
): MandarinCard | null {
  const beginner = mandarinTopicCards(catalog, scope)
  if (!beginner.length) return null
  const studied = beginner.filter(
    (card) => (tracked[card.key]?.repetitions ?? 0) > 0,
  ).length
  const frontier = beginner.slice(
    0,
    Math.min(
      beginner.length,
      unlockedCount(correctAnswers, beginner.length, difficulty) + studied,
    ),
  )
  const now = Date.now()
  const due = frontier.filter(
    (card) =>
      tracked[card.key] && new Date(tracked[card.key]!.dueAt).getTime() <= now,
  )
  const newWords = frontier.filter((card) => !tracked[card.key])
  const reviews = frontier.filter((card) => tracked[card.key])
  const nextPool = due.length ? due : newWords.length ? newWords : reviews
  const candidates = nextPool.filter((card) => card.key !== recentlyAsked)
  const alternatives = [...due, ...newWords, ...reviews].filter(
    (card) => card.key !== recentlyAsked,
  )
  const pool = candidates.length
    ? candidates
    : alternatives.length
      ? alternatives
      : nextPool
  return pool[index(pool.length, random)] ?? null
}
