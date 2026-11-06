import type { MandarinCard } from '../mandarin'

export type FishingQuizModule = 'flags' | 'capitals' | 'mandarin'
export type FishingMode = 'classic' | 'quiz'
export type QuizOption = { id: string; label: string; icon?: string }
export type FishingQuizQuestion = {
  id: string
  module: FishingQuizModule
  prompt: string
  hero: string
  options: QuizOption[]
  correctId: string
  explanation: string
  cardKey?: string
}

type Place = { name: string; answer: string; icon?: string }

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

function flag(code: string): string {
  return String.fromCodePoint(
    ...[...code].map((letter) => 127397 + letter.charCodeAt(0)),
  )
}

export function unlockedCount(correct: number, total: number): number {
  return Math.min(total, 6 + Math.floor(Math.max(0, correct) / 3) * 3)
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
): QuizOption[] {
  const choices = [
    correct,
    ...shuffled(
      all.filter((place) => place.answer !== correct.answer),
      random,
    ).slice(0, 3),
  ]
  return shuffled(choices, random).map((place) => ({
    id: place.answer,
    label: place.answer,
    icon: place.icon,
  }))
}

export function geographyQuestion(
  module: 'flags' | 'capitals',
  correctAnswers: number,
  previousId: string | null = null,
  random: () => number = Math.random,
): FishingQuizQuestion {
  const places: Place[] =
    module === 'flags'
      ? COUNTRIES.map(([code, name]) => ({
          name,
          answer: name,
          icon: flag(code),
        }))
      : STATE_CAPITALS.map(([name, capital]) => ({ name, answer: capital }))
  const pool = places.slice(0, unlockedCount(correctAnswers, places.length))
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
        ? 'Which country flies this flag?'
        : 'What is the capital of ' + correct.name + '?',
    hero: module === 'flags' ? correct.icon! : correct.name,
    options: options(correct, places, random),
    correctId: correct.answer,
    explanation:
      module === 'flags'
        ? correct.icon + ' is the flag of ' + correct.name + '.'
        : correct.name + ' has its capital in ' + correct.answer + '.',
  }
}

export function mandarinQuestion(
  card: MandarinCard,
  catalog: readonly MandarinCard[],
  random: () => number = Math.random,
): FishingQuizQuestion {
  const choices = catalog.filter(
    (other) => other.key !== card.key && other.meaning !== card.meaning,
  )
  const distractors = shuffled(choices, random).slice(0, 3)
  return {
    id: 'mandarin:' + card.key,
    module: 'mandarin',
    cardKey: card.key,
    prompt: 'What does this Mandarin word mean?',
    hero: card.simplified,
    options: shuffled([card, ...distractors], random).map((item) => ({
      id: item.key,
      label: item.meaning,
    })),
    correctId: card.key,
    explanation:
      card.simplified + ' (' + card.pinyin + ') means ' + card.meaning + '.',
  }
}

export function mandarinFrontier(
  catalog: readonly MandarinCard[],
  tracked: Readonly<Record<string, { repetitions: number; dueAt: string }>>,
  recentlyAsked: string | null,
  correctAnswers: number,
  random: () => number = Math.random,
): MandarinCard | null {
  const beginner = catalog.filter(
    (card) => (card.hskLevel ?? 99) <= 2 && card.meaning && card.simplified,
  )
  if (!beginner.length) return null
  const studied = beginner.filter(
    (card) => (tracked[card.key]?.repetitions ?? 0) > 0,
  ).length
  const frontier = beginner.slice(
    0,
    Math.min(beginner.length, 6 + studied + Math.floor(correctAnswers / 2)),
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
  const pool = candidates.length ? candidates : nextPool
  return pool[index(pool.length, random)] ?? null
}
