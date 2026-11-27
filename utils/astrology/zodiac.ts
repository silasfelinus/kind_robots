// /utils/astrology/zodiac.ts
//
// Static reference data for the chart reader: signs, bodies, houses, aspects
// and their tarot correspondences (the Golden Dawn attributions most modern
// decks follow). Interpretive phrases are short building blocks that
// utils/astrology/interpret.ts assembles; nothing here is fetched.

export type ZodiacSignId =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces'

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water'
export type ZodiacModality = 'cardinal' | 'fixed' | 'mutable'

export type PlanetId =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'

export type ChartPointId = PlanetId | 'ascendant' | 'midheaven'

export type AspectId =
  'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition'

export type ZodiacSign = {
  id: ZodiacSignId
  name: string
  glyph: string
  element: ZodiacElement
  modality: ZodiacModality
  ruler: PlanetId
  modernRuler: PlanetId
  keywords: [string, string, string]
  style: string
  gift: string
  growth: string
  /** Tarot catalog key of the major arcanum attributed to the sign. */
  tarotKey: string
  /** Tarot catalog keys of the three decan minor cards, 0-10°, 10-20°, 20-30°. */
  decanKeys: [string, string, string]
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: 'aries',
    name: 'Aries',
    glyph: '♈',
    element: 'fire',
    modality: 'cardinal',
    ruler: 'mars',
    modernRuler: 'mars',
    keywords: ['courage', 'initiative', 'spark'],
    style: 'boldly, directly and first through the door',
    gift: 'the nerve to begin before you feel ready',
    growth: 'patience with the slower parts of a story',
    tarotKey: 'major-04',
    decanKeys: ['two-of-wands', 'three-of-wands', 'four-of-wands'],
  },
  {
    id: 'taurus',
    name: 'Taurus',
    glyph: '♉',
    element: 'earth',
    modality: 'fixed',
    ruler: 'venus',
    modernRuler: 'venus',
    keywords: ['steadiness', 'pleasure', 'patience'],
    style: 'steadily, sensually and at your own unhurried pace',
    gift: 'a loyal, grounding presence that makes things last',
    growth: 'letting comfort make room for change',
    tarotKey: 'major-05',
    decanKeys: ['five-of-pentacles', 'six-of-pentacles', 'seven-of-pentacles'],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    glyph: '♊',
    element: 'air',
    modality: 'mutable',
    ruler: 'mercury',
    modernRuler: 'mercury',
    keywords: ['curiosity', 'conversation', 'versatility'],
    style: 'curiously, quickly and through good conversation',
    gift: 'a bright mind that connects people and ideas',
    growth: 'staying with one thread long enough to finish it',
    tarotKey: 'major-06',
    decanKeys: ['eight-of-swords', 'nine-of-swords', 'ten-of-swords'],
  },
  {
    id: 'cancer',
    name: 'Cancer',
    glyph: '♋',
    element: 'water',
    modality: 'cardinal',
    ruler: 'moon',
    modernRuler: 'moon',
    keywords: ['care', 'memory', 'belonging'],
    style: 'tenderly, protectively and with a long memory',
    gift: 'making any place feel like home',
    growth: 'asking for the care you give so freely',
    tarotKey: 'major-07',
    decanKeys: ['two-of-cups', 'three-of-cups', 'four-of-cups'],
  },
  {
    id: 'leo',
    name: 'Leo',
    glyph: '♌',
    element: 'fire',
    modality: 'fixed',
    ruler: 'sun',
    modernRuler: 'sun',
    keywords: ['warmth', 'creativity', 'heart'],
    style: 'warmly, generously and with a flair for the stage',
    gift: 'a big heart that lights up the room',
    growth: 'shining without needing the applause',
    tarotKey: 'major-08',
    decanKeys: ['five-of-wands', 'six-of-wands', 'seven-of-wands'],
  },
  {
    id: 'virgo',
    name: 'Virgo',
    glyph: '♍',
    element: 'earth',
    modality: 'mutable',
    ruler: 'mercury',
    modernRuler: 'mercury',
    keywords: ['craft', 'service', 'discernment'],
    style: 'carefully, practically and with an eye for detail',
    gift: 'quiet competence that makes everything work better',
    growth: 'forgiving the imperfect, including yourself',
    tarotKey: 'major-09',
    decanKeys: ['eight-of-pentacles', 'nine-of-pentacles', 'ten-of-pentacles'],
  },
  {
    id: 'libra',
    name: 'Libra',
    glyph: '♎',
    element: 'air',
    modality: 'cardinal',
    ruler: 'venus',
    modernRuler: 'venus',
    keywords: ['harmony', 'fairness', 'partnership'],
    style: 'gracefully, fairly and in good company',
    gift: 'seeing every side and finding the beautiful balance',
    growth: 'choosing even when no option is perfect',
    tarotKey: 'major-11',
    decanKeys: ['two-of-swords', 'three-of-swords', 'four-of-swords'],
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    glyph: '♏',
    element: 'water',
    modality: 'fixed',
    ruler: 'mars',
    modernRuler: 'pluto',
    keywords: ['depth', 'loyalty', 'transformation'],
    style: 'intensely, privately and all the way down',
    gift: 'staying present with what others look away from',
    growth: 'trusting enough to let people in',
    tarotKey: 'major-13',
    decanKeys: ['five-of-cups', 'six-of-cups', 'seven-of-cups'],
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    glyph: '♐',
    element: 'fire',
    modality: 'mutable',
    ruler: 'jupiter',
    modernRuler: 'jupiter',
    keywords: ['adventure', 'meaning', 'optimism'],
    style: 'adventurously, honestly and with the horizon in view',
    gift: 'contagious faith that the road leads somewhere good',
    growth: 'tending what is close as well as what is far',
    tarotKey: 'major-14',
    decanKeys: ['eight-of-wands', 'nine-of-wands', 'ten-of-wands'],
  },
  {
    id: 'capricorn',
    name: 'Capricorn',
    glyph: '♑',
    element: 'earth',
    modality: 'cardinal',
    ruler: 'saturn',
    modernRuler: 'saturn',
    keywords: ['ambition', 'structure', 'endurance'],
    style: 'patiently, responsibly and one sure step at a time',
    gift: 'building things that outlast the moment',
    growth: 'resting before the summit, not only after it',
    tarotKey: 'major-15',
    decanKeys: ['two-of-pentacles', 'three-of-pentacles', 'four-of-pentacles'],
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    glyph: '♒',
    element: 'air',
    modality: 'fixed',
    ruler: 'saturn',
    modernRuler: 'uranus',
    keywords: ['vision', 'friendship', 'originality'],
    style: 'inventively, independently and for the good of the group',
    gift: 'imagining a kinder future and inviting others into it',
    growth: 'letting your feelings be as welcome as your ideas',
    tarotKey: 'major-17',
    decanKeys: ['five-of-swords', 'six-of-swords', 'seven-of-swords'],
  },
  {
    id: 'pisces',
    name: 'Pisces',
    glyph: '♓',
    element: 'water',
    modality: 'mutable',
    ruler: 'jupiter',
    modernRuler: 'neptune',
    keywords: ['empathy', 'imagination', 'surrender'],
    style: 'dreamily, compassionately and through feeling',
    gift: 'boundless empathy and a vivid inner world',
    growth: 'keeping gentle boundaries so your gifts stay yours',
    tarotKey: 'major-18',
    decanKeys: ['eight-of-cups', 'nine-of-cups', 'ten-of-cups'],
  },
]

export type ChartPointInfo = {
  id: ChartPointId
  name: string
  glyph: string
  theme: string
  question: string
  tarotKey: string | null
}

export const CHART_POINTS: Record<ChartPointId, ChartPointInfo> = {
  sun: {
    id: 'sun',
    name: 'Sun',
    glyph: '☉',
    theme: 'your core self, vitality and purpose',
    question: 'What makes you feel most alive?',
    tarotKey: 'major-19',
  },
  moon: {
    id: 'moon',
    name: 'Moon',
    glyph: '☽',
    theme: 'your feelings, needs and inner comfort',
    question: 'What helps you feel safe and cared for?',
    tarotKey: 'major-02',
  },
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    glyph: '☿',
    theme: 'how you think, learn and speak',
    question: 'How do you best make sense of things?',
    tarotKey: 'major-01',
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    glyph: '♀',
    theme: 'love, beauty, pleasure and what you value',
    question: 'What do you find truly beautiful?',
    tarotKey: 'major-03',
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    glyph: '♂',
    theme: 'drive, courage and how you go after things',
    question: 'What is worth your effort right now?',
    tarotKey: 'major-16',
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    glyph: '♃',
    theme: 'growth, generosity, luck and meaning',
    question: 'Where are you ready to grow?',
    tarotKey: 'major-10',
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    glyph: '♄',
    theme: 'structure, responsibility and hard-won mastery',
    question: 'What are you patiently building?',
    tarotKey: 'major-21',
  },
  uranus: {
    id: 'uranus',
    name: 'Uranus',
    glyph: '♅',
    theme: 'originality, freedom and sudden insight',
    question: 'Where do you need room to be different?',
    tarotKey: 'major-00',
  },
  neptune: {
    id: 'neptune',
    name: 'Neptune',
    glyph: '♆',
    theme: 'dreams, intuition, compassion and imagination',
    question: 'What are you dreaming toward?',
    tarotKey: 'major-12',
  },
  pluto: {
    id: 'pluto',
    name: 'Pluto',
    glyph: '♇',
    theme: 'deep change, power and renewal',
    question: 'What is ready to be transformed?',
    tarotKey: 'major-20',
  },
  ascendant: {
    id: 'ascendant',
    name: 'Ascendant',
    glyph: 'AC',
    theme: 'the way you meet the world and first impressions',
    question: 'How do you like to arrive?',
    tarotKey: null,
  },
  midheaven: {
    id: 'midheaven',
    name: 'Midheaven',
    glyph: 'MC',
    theme: 'your public path, calling and reputation',
    question: 'What would you love to be known for?',
    tarotKey: null,
  },
}

export const PLANET_IDS: PlanetId[] = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
]

export const HOUSE_DOMAINS: string[] = [
  'self, body and fresh starts',
  'resources, values and self-worth',
  'learning, siblings, neighbors and everyday talk',
  'home, family and roots',
  'creativity, play, romance and children',
  'daily work, health habits and service',
  'partnerships and one-to-one relationships',
  'shared resources, intimacy and transformation',
  'travel, study, faith and big ideas',
  'career, calling and public life',
  'friends, community and hopes for the future',
  'rest, solitude, dreams and the unseen',
]

export type AspectInfo = {
  id: AspectId
  name: string
  glyph: string
  angle: number
  orb: number
  tone: 'blend' | 'flow' | 'friction'
  meaning: string
}

export const ASPECTS: AspectInfo[] = [
  {
    id: 'conjunction',
    name: 'Conjunction',
    glyph: '☌',
    angle: 0,
    orb: 8,
    tone: 'blend',
    meaning: 'fuse into one voice, amplifying each other',
  },
  {
    id: 'sextile',
    name: 'Sextile',
    glyph: '⚹',
    angle: 60,
    orb: 4,
    tone: 'flow',
    meaning: 'offer a friendly opening that rewards a little effort',
  },
  {
    id: 'square',
    name: 'Square',
    glyph: '□',
    angle: 90,
    orb: 7,
    tone: 'friction',
    meaning: 'push against each other, building strength through tension',
  },
  {
    id: 'trine',
    name: 'Trine',
    glyph: '△',
    angle: 120,
    orb: 7,
    tone: 'flow',
    meaning: 'cooperate easily, a natural talent',
  },
  {
    id: 'opposition',
    name: 'Opposition',
    glyph: '☍',
    angle: 180,
    orb: 8,
    tone: 'friction',
    meaning: 'pull from opposite ends, asking for balance',
  },
]

export const ELEMENT_NOTES: Record<ZodiacElement, string> = {
  fire: 'enthusiasm, courage and creative spark',
  earth: 'practicality, patience and a love of the tangible',
  air: 'ideas, conversation and perspective',
  water: 'feeling, intuition and emotional depth',
}

export const MODALITY_NOTES: Record<ZodiacModality, string> = {
  cardinal: 'starting things and taking the lead',
  fixed: 'sustaining, deepening and seeing things through',
  mutable: 'adapting, connecting and gracefully changing course',
}

export const MOON_PHASES = [
  { max: 22.5, name: 'New Moon', note: 'a quiet seed of new intentions' },
  { max: 67.5, name: 'Waxing Crescent', note: 'early hope gathering strength' },
  { max: 112.5, name: 'First Quarter', note: 'a moment to choose and act' },
  { max: 157.5, name: 'Waxing Gibbous', note: 'refining what is nearly ready' },
  { max: 202.5, name: 'Full Moon', note: 'everything illuminated and felt' },
  { max: 247.5, name: 'Waning Gibbous', note: 'sharing what you have learned' },
  { max: 292.5, name: 'Last Quarter', note: 'releasing what no longer fits' },
  { max: 337.5, name: 'Waning Crescent', note: 'rest before the next cycle' },
  { max: 360, name: 'New Moon', note: 'a quiet seed of new intentions' },
] as const

export function moonPhaseFor(angle: number) {
  const normalized = ((angle % 360) + 360) % 360
  return MOON_PHASES.find((phase) => normalized < phase.max) ?? MOON_PHASES[0]
}

export function signAt(longitude: number): ZodiacSign {
  const normalized = ((longitude % 360) + 360) % 360
  return ZODIAC_SIGNS[Math.floor(normalized / 30) % 12] ?? ZODIAC_SIGNS[0]!
}

export function signById(id: ZodiacSignId): ZodiacSign {
  return ZODIAC_SIGNS.find((sign) => sign.id === id) ?? ZODIAC_SIGNS[0]!
}

export function decanCardKey(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360
  const sign = signAt(normalized)
  const decan = Math.min(2, Math.floor((normalized % 30) / 10))
  return sign.decanKeys[decan] ?? sign.decanKeys[0]
}

export function formatDegree(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360
  const within = normalized % 30
  const degrees = Math.floor(within)
  const minutes = Math.floor((within - degrees) * 60)
  return `${degrees}°${String(minutes).padStart(2, '0')}′ ${signAt(normalized).name}`
}

export function ordinal(value: number): string {
  const tens = value % 100
  if (tens >= 11 && tens <= 13) return `${value}th`
  const suffix = ['th', 'st', 'nd', 'rd'][value % 10] ?? 'th'
  return `${value}${value % 10 > 3 ? 'th' : suffix}`
}
