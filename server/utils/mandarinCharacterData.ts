import type { MandarinCard, MandarinComponent } from '~/utils/mandarin'

const SOURCE_COMMIT = 'bddc96d41bef78427ed0e034e9f7e31d71fd1b92'
const SOURCE_URL = `https://raw.githubusercontent.com/skishore/makemeahanzi/${SOURCE_COMMIT}/dictionary.txt`
const SOURCE_LABEL = 'Make Me a Hanzi dictionary.txt'
const SOURCE_LICENSE = 'LGPL-3.0-or-later'
const SOURCE_NOTE = `${SOURCE_LABEL} @ ${SOURCE_COMMIT.slice(0, 12)} · ${SOURCE_LICENSE}`

const IDS_START = 0x2ff0
const IDS_END = 0x2fff
const IDS_SUPPLEMENT = 0x31ef

export type MandarinCharacterDataEtymology = {
  type?: 'ideographic' | 'pictographic' | 'pictophonetic'
  hint?: string
  phonetic?: string
  semantic?: string
}

type MandarinCharacterDataEntry = {
  character?: string
  definition?: string
  pinyin?: string[]
  decomposition?: string
  etymology?: MandarinCharacterDataEtymology | null
  radical?: string
}

type ParsedCharacterAnalysis = {
  character: string
  components: MandarinComponent[]
  history: string
}

let dictionaryPromise: Promise<Map<string, MandarinCharacterDataEntry>> | null = null

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isHanCharacter(value: string): boolean {
  const codePoint = value.codePointAt(0) ?? 0
  return (
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff)
  )
}

function isIdsOperator(value: string): boolean {
  const codePoint = value.codePointAt(0) ?? 0
  return (
    (codePoint >= IDS_START && codePoint <= IDS_END) ||
    codePoint === IDS_SUPPLEMENT
  )
}

function decompositionLeaves(decomposition: string): string[] {
  const leaves: string[] = []
  for (const glyph of [...decomposition]) {
    if (glyph === '？' || isIdsOperator(glyph)) continue
    if (!leaves.includes(glyph)) leaves.push(glyph)
  }
  return leaves
}

function normalizedEtymology(
  value: MandarinCharacterDataEntry['etymology'],
): MandarinCharacterDataEtymology | null {
  if (!value || typeof value !== 'object') return null
  const type = value.type
  if (
    type !== 'ideographic' &&
    type !== 'pictographic' &&
    type !== 'pictophonetic'
  ) {
    return null
  }
  const hint = cleanText(value.hint)
  const phonetic = cleanText(value.phonetic)
  const semantic = cleanText(value.semantic)
  return {
    type,
    ...(hint ? { hint } : {}),
    ...(phonetic ? { phonetic } : {}),
    ...(semantic ? { semantic } : {}),
  }
}

function roleComponents(
  entry: MandarinCharacterDataEntry,
): MandarinComponent[] {
  const character = cleanText(entry.character)
  const decomposition = cleanText(entry.decomposition)
  const radical = cleanText(entry.radical)
  const etymology = normalizedEtymology(entry.etymology)
  const components: MandarinComponent[] = []

  const addComponent = (component: MandarinComponent) => {
    if (
      components.some(
        (existing) =>
          existing.glyph === component.glyph && existing.role === component.role,
      )
    ) {
      return
    }
    components.push(component)
  }

  if (etymology?.type === 'pictophonetic') {
    if (etymology.semantic) {
      addComponent({
        glyph: etymology.semantic,
        role: 'semantic',
        label: `${character} meaning clue`,
        ...(etymology.hint ? { meaning: etymology.hint } : {}),
        note: `The source explicitly identifies this as the semantic element. ${SOURCE_NOTE}.`,
      })
    }
    if (etymology.phonetic) {
      addComponent({
        glyph: etymology.phonetic,
        role: 'phonetic',
        label: `${character} sound clue`,
        note: `The source explicitly identifies this as the phonetic element; it is not being treated as a second literal definition. ${SOURCE_NOTE}.`,
      })
    }
  }

  if (decomposition && !decomposition.startsWith('？')) {
    for (const glyph of decompositionLeaves(decomposition)) {
      const alreadyExplained = components.some(
        (component) => component.glyph === glyph,
      )
      if (alreadyExplained) continue
      if (glyph === radical) {
        addComponent({
          glyph,
          role: 'radical',
          label: `${character} dictionary radical`,
          note: `Indexing radical reported by the source. This label does not by itself claim that the radical supplies the character's meaning. ${SOURCE_NOTE}.`,
        })
        continue
      }
      addComponent({
        glyph,
        role: 'form',
        label: `${character} written component`,
        note: `Structural leaf from the source IDS decomposition; no semantic or phonetic role is asserted here. ${SOURCE_NOTE}.`,
      })
    }
  }

  if (
    radical &&
    radical !== character &&
    !components.some((component) => component.glyph === radical)
  ) {
    addComponent({
      glyph: radical,
      role: 'radical',
      label: `${character} dictionary radical`,
      note: `Indexing radical reported by the source. This is deliberately separate from etymology. ${SOURCE_NOTE}.`,
    })
  }

  if (decomposition.includes('？')) {
    addComponent({
      glyph: '？',
      role: 'uncertain',
      label: `${character} unresolved component`,
      note: `The source marks part of this decomposition as unknown or uncertain, so the tutor leaves it unresolved instead of inventing a mnemonic. ${SOURCE_NOTE}.`,
    })
  }

  return components
}

function historyFor(entry: MandarinCharacterDataEntry): string {
  const character = cleanText(entry.character)
  const decomposition = cleanText(entry.decomposition)
  const etymology = normalizedEtymology(entry.etymology)

  if (etymology?.type === 'pictophonetic') {
    const roles: string[] = []
    if (etymology.semantic) {
      roles.push(
        `${etymology.semantic} is identified as the semantic/meaning element${etymology.hint ? ` (${etymology.hint})` : ''}`,
      )
    }
    if (etymology.phonetic) {
      roles.push(`${etymology.phonetic} is identified as the phonetic/sound element`)
    }
    const detail = roles.length ? roles.join('; ') : 'the source classifies the formation as pictophonetic'
    return `${character}: ${detail}. Source formation analysis: ${SOURCE_NOTE}.`
  }

  if (etymology?.type === 'pictographic') {
    return `${character}: the source classifies this as pictographic${etymology.hint ? ` and explains it as “${etymology.hint}”` : ''}. Source formation analysis: ${SOURCE_NOTE}.`
  }

  if (etymology?.type === 'ideographic') {
    return `${character}: the source classifies this as ideographic${etymology.hint ? ` and explains the formation as “${etymology.hint}”` : ''}. Source formation analysis: ${SOURCE_NOTE}.`
  }

  if (decomposition && !decomposition.startsWith('？')) {
    const qualifier = decomposition.includes('？')
      ? 'partial structural decomposition'
      : 'structural decomposition'
    return `${character}: the source supplies the ${qualifier} ${decomposition}, but does not make an etymology claim for it. Source: ${SOURCE_NOTE}.`
  }

  return `${character}: the pinned source does not provide a reliable decomposition or formation analysis, so the tutor makes no historical claim. Source: ${SOURCE_NOTE}.`
}

function analyzeEntry(entry: MandarinCharacterDataEntry): ParsedCharacterAnalysis | null {
  const character = cleanText(entry.character)
  if (!character) return null
  return {
    character,
    components: roleComponents(entry),
    history: historyFor(entry),
  }
}

async function loadDictionary(): Promise<Map<string, MandarinCharacterDataEntry>> {
  const raw = await $fetch<string, string>(SOURCE_URL, {
    retry: 2,
    timeout: 30_000,
    responseType: 'text',
  })
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('Make Me a Hanzi dictionary source was empty.')
  }

  const dictionary = new Map<string, MandarinCharacterDataEntry>()
  const lines = raw.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim()
    if (!line) continue
    try {
      const parsed = JSON.parse(line) as MandarinCharacterDataEntry
      const character = cleanText(parsed.character)
      if (character) dictionary.set(character, parsed)
    } catch {
      throw new Error(`Make Me a Hanzi dictionary line ${index + 1} was invalid JSON.`)
    }
  }

  if (dictionary.size < 8_000) {
    throw new Error(
      `Make Me a Hanzi dictionary only parsed ${dictionary.size} characters; expected at least 8,000.`,
    )
  }
  return dictionary
}

function getDictionary(): Promise<Map<string, MandarinCharacterDataEntry>> {
  dictionaryPromise ??= loadDictionary().catch((error) => {
    dictionaryPromise = null
    throw error
  })
  return dictionaryPromise
}

function cardCharacters(card: MandarinCard): string[] {
  const characters: string[] = []
  for (const glyph of [...card.simplified]) {
    if (isHanCharacter(glyph) && !characters.includes(glyph)) characters.push(glyph)
  }
  return characters
}

export async function enrichMandarinCharacterData(
  cards: MandarinCard[],
): Promise<MandarinCard[]> {
  const dictionary = await getDictionary()

  return cards.map((card) => {
    const analyses = cardCharacters(card)
      .map((character) => dictionary.get(character))
      .filter((entry): entry is MandarinCharacterDataEntry => Boolean(entry))
      .map(analyzeEntry)
      .filter((analysis): analysis is ParsedCharacterAnalysis => Boolean(analysis))

    if (!analyses.length) return card

    const components = analyses.flatMap((analysis) => analysis.components)
    const history = analyses.map((analysis) => analysis.history).join(' • ')

    return {
      ...card,
      ...(components.length ? { components } : {}),
      ...(history ? { history } : {}),
      historyStatus: history ? 'starter' : card.historyStatus,
    }
  })
}

export const MANDARIN_CHARACTER_DATA_PROVENANCE = {
  label: SOURCE_LABEL,
  version: `skishore/makemeahanzi@${SOURCE_COMMIT}`,
  license: SOURCE_LICENSE,
  sourceUrl: 'https://github.com/skishore/makemeahanzi/blob/master/dictionary.txt',
} as const
