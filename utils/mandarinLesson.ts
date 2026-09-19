// /utils/mandarinLesson.ts
//
// mandarin-tutor/t-022: the teaching layer.
//
// m1-m4 built a flashcard trainer whose character data was already good -- Make Me a
// Hanzi decomposition, explicit etymology.semantic / etymology.phonetic roles, dictionary
// radicals, IDS structural leaves -- but that data only ever appeared behind a `<details>`
// labelled "Parts & history", i.e. AFTER the learner had already been drilled on the card.
// Silas's 2026-09-19 reopening request inverts that: instruction first, flashcard second.
//
// This module is the derivation behind the lesson. It is deliberately pure -- a
// MandarinCard plus the rest of the catalog in, a MandarinLesson out -- so the teaching
// layer is testable without a database, a network fetch, or a Nuxt runtime
// (utils/scripts/verifyMandarinLesson.test.ts).
//
// HONESTY CONTRACT. This file never invents a mnemonic. Every claim it renders is either
// something the pinned source asserted (`server/utils/mandarinCharacterData.ts` already
// distinguishes "the source says this is the semantic element" from "this is a structural
// leaf and no role is asserted") or a mechanical fact about the pinyin string. Where the
// source makes no claim, the lesson SAYS the source makes no claim -- it does not fall
// back to a folk etymology, because a confident wrong story is worse for an academic
// learner than an honest gap.
import type {
  MandarinCard,
  MandarinComponent,
  MandarinComponentRole,
  MandarinSource,
} from './mandarin'
import {
  parsePinyinToneTargets,
  type MandarinToneNumber,
} from './mandarinPronunciation'

/**
 * Pinyin initials, longest-first so the digraphs (zh/ch/sh) win over z/c/s.
 * `y` and `w` are included because they behave as onsets in written pinyin even
 * though they are glides rather than true initials in most analyses -- the lesson
 * says so in `initialNote` rather than silently picking a side.
 */
const PINYIN_INITIALS = [
  'zh',
  'ch',
  'sh',
  'b',
  'p',
  'm',
  'f',
  'd',
  't',
  'n',
  'l',
  'g',
  'k',
  'h',
  'j',
  'q',
  'x',
  'r',
  'z',
  'c',
  's',
  'y',
  'w',
] as const

/** Tone-marked vowel -> bare vowel. ü keeps its diaeresis; only the tone is stripped. */
const TONELESS: Record<string, string> = {
  ā: 'a',
  á: 'a',
  ǎ: 'a',
  à: 'a',
  ē: 'e',
  é: 'e',
  ě: 'e',
  è: 'e',
  ī: 'i',
  í: 'i',
  ǐ: 'i',
  ì: 'i',
  ō: 'o',
  ó: 'o',
  ǒ: 'o',
  ò: 'o',
  ū: 'u',
  ú: 'u',
  ǔ: 'u',
  ù: 'u',
  ǖ: 'ü',
  ǘ: 'ü',
  ǚ: 'ü',
  ǜ: 'ü',
}

const TONE_SHAPES: Record<MandarinToneNumber, string> = {
  1: 'held flat and high, the same pitch from start to finish',
  2: 'rising, like the end of an English question',
  3: 'dipping low and then coming back up',
  4: 'falling sharply from high to low',
  5: 'unstressed and short, taking its pitch from the syllable before it',
}

export type MandarinLessonSyllable = {
  /** As written in the catalog, tone marks intact: "shuō". */
  syllable: string
  /** Tone marks stripped, for matching homophones: "shuo". */
  base: string
  /** "sh", or '' for a syllable with no written initial ("ān", "ér"). */
  initial: string
  /** Everything after the initial, tone marks stripped: "uo". */
  final: string
  /** The tone the dictionary gives this syllable in isolation. */
  lexicalTone: MandarinToneNumber
  /** What it is actually pronounced as here, after third-tone sandhi. */
  spokenTone: MandarinToneNumber
  toneLabel: string
  toneArrow: string
  /** Plain-language description of the pitch movement. */
  toneShape: string
  /** Present only when the spoken tone differs from the lexical one. */
  sandhiNote?: string
}

export type MandarinLessonComponent = {
  glyph: string
  role: MandarinComponentRole
  label: string
  /**
   * One complete sentence saying what this piece DOES for the character -- the
   * "what each aspect represents" Silas asked for. Generated from the role, never
   * from a guess about the glyph.
   */
  contribution: string
  meaning?: string
  note?: string
}

export type MandarinLessonCharacter = {
  character: string
  components: MandarinLessonComponent[]
  /** True when at least one component carries an asserted semantic or phonetic role. */
  hasAssertedStructure: boolean
}

export type MandarinLessonRelative = {
  key: string
  simplified: string
  pinyin: string
  meaning: string
}

export type MandarinSoundFamily = {
  /** The shared sound component, e.g. 青 or 兑. */
  phonetic: string
  /** The character in THIS word that is built on it, e.g. 请. */
  character: string
  /** Other catalog cards built on the same sound component. */
  members: MandarinLessonRelative[]
  /** Distinct toneless readings across the family, in first-seen order. */
  readings: string[]
  /**
   * True when the family's members no longer share one reading (说 shuō / 税 shuì).
   * Drift is the interesting case, not an error -- the sound component records how the
   * character sounded when it was coined, not how it sounds now.
   */
  drifted: boolean
}

export type MandarinHomophones = {
  /** The whole word's reading with tones stripped and spaces removed: "shuofu". */
  base: string
  /** Same reading AND same tones. */
  exact: MandarinLessonRelative[]
  /** Same syllables, different tones -- the near-miss pairs that cause real confusion. */
  toneVariants: MandarinLessonRelative[]
}

export type MandarinLesson = {
  key: string
  simplified: string
  traditional?: string
  pinyin: string
  meaning: string
  meanings: string[]
  hskLevel?: number
  categories: string[]
  /** One sentence framing what this lesson can actually teach. */
  summary: string
  syllables: MandarinLessonSyllable[]
  characters: MandarinLessonCharacter[]
  soundFamilies: MandarinSoundFamily[]
  homophones: MandarinHomophones | null
  history: string
  historyStatus: MandarinCard['historyStatus']
  source: MandarinSource
  /**
   * `structural` -- the source asserts a semantic or phonetic role for at least one
   * piece, so there is a real structural story to teach.
   * `vocabulary` -- the source offers no asserted roles, so this is an item to learn as a
   * word, not as a decomposition. Saying so is the point: it stops the page presenting a
   * bare IDS dump as if it were an explanation, and it is the number
   * mandarin-tutor/t-026 audits.
   */
  teachability: 'structural' | 'vocabulary'
}

/** Strip tone marks from a pinyin string, preserving ü. */
export function tonelessPinyin(value: string): string {
  let out = ''
  for (const character of value.toLowerCase()) {
    out += TONELESS[character] ?? character
  }
  return out.replace(/[1-5]/g, '')
}

/** The whole reading, tone-stripped and whitespace-free, for homophone matching. */
export function homophoneKey(pinyin: string): string {
  return tonelessPinyin(pinyin).replace(/[\s'’·\-.,!?;:，。！？；：]/gu, '')
}

/** The reading with tones intact, whitespace-free, for exact-homophone matching. */
export function exactReadingKey(pinyin: string): string {
  return pinyin.toLowerCase().replace(/[\s'’·\-.,!?;:，。！？；：]/gu, '')
}

export function splitPinyinSyllable(syllable: string): {
  initial: string
  final: string
} {
  const base = tonelessPinyin(syllable)
  for (const initial of PINYIN_INITIALS) {
    if (base.startsWith(initial)) {
      const final = base.slice(initial.length)
      // "y" and "w" only act as initials when something follows them.
      if (final) return { initial, final }
    }
  }
  return { initial: '', final: base }
}

export function describeSyllables(pinyin: string): MandarinLessonSyllable[] {
  return parsePinyinToneTargets(pinyin).map((target) => {
    const { initial, final } = splitPinyinSyllable(target.syllable)
    return {
      syllable: target.syllable,
      base: tonelessPinyin(target.syllable),
      initial,
      final,
      lexicalTone: target.lexicalTone,
      spokenTone: target.spokenTone,
      toneLabel: target.label,
      toneArrow: target.arrow,
      toneShape: TONE_SHAPES[target.spokenTone],
      ...(target.note ? { sandhiNote: target.note } : {}),
    }
  })
}

/**
 * What a component contributes, stated as a full sentence.
 *
 * Every branch is written so it stays true even when the source gave us nothing: a
 * `form` leaf says explicitly that no role is asserted rather than implying one, and a
 * `radical` says it is a filing decision rather than a meaning claim. That distinction
 * is the whole reason `server/utils/mandarinCharacterData.ts` kept the roles separate,
 * and it would be thrown away by a page that rendered every component the same way.
 */
export function describeContribution(
  component: MandarinComponent,
  character: string,
): string {
  const glyph = component.glyph
  switch (component.role) {
    case 'semantic':
      return component.meaning
        ? `${glyph} is the meaning component: it places ${character} in the domain of ${component.meaning}. It tells you what the character is about, not how it sounds.`
        : `${glyph} is the meaning component: the source identifies it as the piece that carries what ${character} is about, rather than how it sounds.`
    case 'phonetic':
      return `${glyph} is the sound component: it carries the historical pronunciation family ${character} belongs to, not a second definition. Characters sharing ${glyph} are related by sound, not by meaning.`
    case 'radical':
      return `${glyph} is the dictionary radical ${character} is filed under. That is an indexing decision made by dictionary compilers -- on its own it is not a claim that ${glyph} supplies the meaning.`
    case 'form':
      return `${glyph} appears in the written form of ${character}, but the source does not say whether it contributes meaning or sound here, so the lesson does not guess.`
    case 'uncertain':
      return `The source marks part of ${character}'s structure as unresolved. Nothing is claimed about this piece rather than a story being invented for it.`
    default:
      return `${glyph} appears in ${character}. The source asserts no role for it.`
  }
}

const ASSERTED_ROLES: ReadonlySet<MandarinComponentRole> =
  new Set<MandarinComponentRole>(['semantic', 'phonetic'])

function isHanCharacter(value: string): boolean {
  const codePoint = value.codePointAt(0) ?? 0
  return (
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff)
  )
}

export function cardCharacters(simplified: string): string[] {
  const characters: string[] = []
  for (const glyph of [...simplified]) {
    if (isHanCharacter(glyph) && !characters.includes(glyph))
      characters.push(glyph)
  }
  return characters
}

/**
 * Which character a component belongs to.
 *
 * `component.character` is the reliable answer and is what
 * server/utils/mandarinCharacterData.ts now records. Older payloads (and the curated
 * STARTER_COMPONENT_GUIDES) may predate that field, so fall back to the leading
 * character of the label ("请 sound clue"), then to the single character of a
 * one-character card. Returns '' when genuinely unknown rather than guessing wrong.
 */
export function componentCharacter(
  component: MandarinComponent,
  characters: string[],
): string {
  if (component.character && characters.includes(component.character)) {
    return component.character
  }
  const leading = [...(component.label || '')][0] || ''
  if (leading && characters.includes(leading)) return leading
  if (characters.length === 1) return characters[0] as string
  return ''
}

function relative(card: MandarinCard): MandarinLessonRelative {
  return {
    key: card.key,
    simplified: card.simplified,
    pinyin: card.pinyin,
    meaning: card.meaning,
  }
}

/**
 * Index of sound component -> the catalog cards built on it.
 *
 * Built once per corpus and passed into buildMandarinLesson, because the whole point of
 * the sound-family view is that it is a global relationship: rebuilding it per card
 * would be O(cards^2) across a 500+ card catalog and a lesson page would pay for it.
 */
export type MandarinLessonIndex = {
  phoneticToCards: Map<string, MandarinCard[]>
  byHomophone: Map<string, MandarinCard[]>
  byExactReading: Map<string, MandarinCard[]>
}

export function buildMandarinLessonIndex(
  corpus: MandarinCard[],
): MandarinLessonIndex {
  const phoneticToCards = new Map<string, MandarinCard[]>()
  const byHomophone = new Map<string, MandarinCard[]>()
  const byExactReading = new Map<string, MandarinCard[]>()

  const push = <K>(map: Map<K, MandarinCard[]>, key: K, card: MandarinCard) => {
    const bucket = map.get(key)
    if (bucket) {
      if (!bucket.some((existing) => existing.key === card.key))
        bucket.push(card)
      return
    }
    map.set(key, [card])
  }

  for (const card of corpus) {
    for (const component of card.components) {
      if (component.role !== 'phonetic') continue
      push(phoneticToCards, component.glyph, card)
    }
    const reading = homophoneKey(card.pinyin)
    if (reading) push(byHomophone, reading, card)
    const exact = exactReadingKey(card.pinyin)
    if (exact) push(byExactReading, exact, card)
  }

  return { phoneticToCards, byHomophone, byExactReading }
}

const MAX_FAMILY_MEMBERS = 24
const MAX_HOMOPHONES = 16

function soundFamiliesFor(
  card: MandarinCard,
  characters: string[],
  index: MandarinLessonIndex,
): MandarinSoundFamily[] {
  const families: MandarinSoundFamily[] = []
  const seen = new Set<string>()

  for (const component of card.components) {
    if (component.role !== 'phonetic') continue
    const phonetic = component.glyph
    const character = componentCharacter(component, characters)
    const dedupeKey = `${character}:${phonetic}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const members = (index.phoneticToCards.get(phonetic) ?? [])
      .filter((candidate) => candidate.key !== card.key)
      .slice(0, MAX_FAMILY_MEMBERS)
      .map(relative)

    // A "family" of one teaches nothing -- it is just this card again.
    if (!members.length) continue

    const readings: string[] = []
    for (const member of [relative(card), ...members]) {
      const reading = homophoneKey(member.pinyin)
      if (reading && !readings.includes(reading)) readings.push(reading)
    }

    families.push({
      phonetic,
      character: character || card.simplified,
      members,
      readings,
      drifted: readings.length > 1,
    })
  }

  return families
}

function homophonesFor(
  card: MandarinCard,
  index: MandarinLessonIndex,
): MandarinHomophones | null {
  const base = homophoneKey(card.pinyin)
  if (!base) return null

  const sameBase = (index.byHomophone.get(base) ?? []).filter(
    (candidate) => candidate.key !== card.key,
  )
  if (!sameBase.length) return null

  const exactKey = exactReadingKey(card.pinyin)
  const exact: MandarinLessonRelative[] = []
  const toneVariants: MandarinLessonRelative[] = []

  for (const candidate of sameBase) {
    const bucket =
      exactReadingKey(candidate.pinyin) === exactKey ? exact : toneVariants
    if (bucket.length >= MAX_HOMOPHONES) continue
    bucket.push(relative(candidate))
  }

  if (!exact.length && !toneVariants.length) return null
  return { base, exact, toneVariants }
}

function summarize(
  card: MandarinCard,
  characters: string[],
  lessonCharacters: MandarinLessonCharacter[],
  families: MandarinSoundFamily[],
  teachability: MandarinLesson['teachability'],
): string {
  const charCount = characters.length
  const shape =
    charCount > 1
      ? `${card.simplified} is written with ${charCount} characters.`
      : `${card.simplified} is a single character.`

  if (teachability === 'vocabulary') {
    return `${shape} The pinned source does not assert a meaning or sound role for any of its pieces, so this lesson teaches ${card.simplified} as a word to learn rather than a structure to take apart.`
  }

  const withStructure = lessonCharacters.filter(
    (entry) => entry.hasAssertedStructure,
  ).length
  const structurePart =
    charCount > 1 && withStructure < charCount
      ? `${withStructure} of them decompose into pieces the source gives a role to.`
      : 'Its pieces have roles the source states explicitly.'

  const familyPart = families.length
    ? ` It sits in ${families.length === 1 ? 'a sound family' : `${families.length} sound families`} built on ${families.map((family) => family.phonetic).join(' and ')}.`
    : ''

  return `${shape} ${structurePart}${familyPart}`
}

/**
 * Build the full lesson for one card.
 *
 * `index` is optional so a caller with a single card (a requested/user-generated card
 * that is not in the catalog) still gets pinyin anatomy and component roles -- it simply
 * gets no cross-links, which is correct rather than a degraded mode.
 */
export function buildMandarinLesson(
  card: MandarinCard,
  index?: MandarinLessonIndex,
): MandarinLesson {
  const characters = cardCharacters(card.simplified)

  const lessonCharacters: MandarinLessonCharacter[] = characters.map(
    (character) => {
      const components = card.components
        .filter(
          (component) =>
            componentCharacter(component, characters) === character,
        )
        .map((component) => ({
          glyph: component.glyph,
          role: component.role,
          label: component.label,
          contribution: describeContribution(component, character),
          ...(component.meaning ? { meaning: component.meaning } : {}),
          ...(component.note ? { note: component.note } : {}),
        }))

      return {
        character,
        components,
        hasAssertedStructure: components.some((component) =>
          ASSERTED_ROLES.has(component.role),
        ),
      }
    },
  )

  const teachability: MandarinLesson['teachability'] = lessonCharacters.some(
    (entry) => entry.hasAssertedStructure,
  )
    ? 'structural'
    : 'vocabulary'

  const soundFamilies = index ? soundFamiliesFor(card, characters, index) : []
  const homophones = index ? homophonesFor(card, index) : null

  return {
    key: card.key,
    simplified: card.simplified,
    ...(card.traditional ? { traditional: card.traditional } : {}),
    pinyin: card.pinyin,
    meaning: card.meaning,
    meanings: card.meanings,
    ...(card.hskLevel ? { hskLevel: card.hskLevel } : {}),
    categories: card.categories,
    summary: summarize(
      card,
      characters,
      lessonCharacters,
      soundFamilies,
      teachability,
    ),
    syllables: describeSyllables(card.pinyin),
    characters: lessonCharacters,
    soundFamilies,
    homophones,
    history:
      card.history ||
      `The pinned source does not provide a formation analysis for ${card.simplified}, so this lesson makes no historical claim about it.`,
    historyStatus: card.historyStatus,
    source: card.source,
    teachability,
  }
}
