import type {
  MandarinCard,
  MandarinComponent,
  MandarinFormation,
} from '~/utils/mandarin'

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

export type MandarinCharacterDataEntry = {
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
  formation: MandarinFormation | null
}

type CharacterDictionary = Map<string, MandarinCharacterDataEntry>

let dictionaryPromise: Promise<Map<string, MandarinCharacterDataEntry>> | null =
  null

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

function formationFor(
  entry: MandarinCharacterDataEntry | undefined,
): MandarinFormation | null {
  const character = cleanText(entry?.character)
  const etymology = normalizedEtymology(entry?.etymology)
  if (!character || !etymology?.type) return null
  return {
    character,
    type: etymology.type,
    ...(etymology.hint ? { hint: etymology.hint } : {}),
  }
}

/** The first sense of a dictionary definition: "spear, lance, halberd" -> "spear". */
function shortDefinition(definition: string): string {
  return definition.split(/[;,]/)[0]?.trim() || definition
}

/**
 * Look a part up as a character in its own right, so the lesson can teach 戈 before
 * it teaches 我 (Silas, 2026-09-29: "we should learn the parts before we learn the
 * combinations ... I should learn roof before I learn house"). Everything added here is
 * the source's entry for the PART; a part the source has no entry for gets nothing.
 */
function withPartDetails(
  component: MandarinComponent,
  dictionary: CharacterDictionary,
): MandarinComponent {
  if (
    component.role === 'radical' ||
    component.role === 'form' ||
    component.role === 'uncertain'
  ) {
    return component
  }
  const partEntry = dictionary.get(component.glyph)
  if (!partEntry) return component
  const definition = cleanText(partEntry.definition)
  const pinyin = Array.isArray(partEntry.pinyin)
    ? cleanText(partEntry.pinyin[0])
    : ''
  const origin = formationFor(partEntry)
  return {
    ...component,
    ...(!component.meaning && definition
      ? { meaning: shortDefinition(definition) }
      : {}),
    ...(pinyin ? { pinyin } : {}),
    ...(origin ? { origin } : {}),
  }
}

function roleComponents(
  entry: MandarinCharacterDataEntry,
  dictionary: CharacterDictionary = new Map(),
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
          existing.glyph === component.glyph &&
          existing.role === component.role,
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
        character,
        label: `${character} meaning clue`,
        ...(etymology.hint ? { meaning: etymology.hint } : {}),
        note: `The source explicitly identifies this as the semantic element. ${SOURCE_NOTE}.`,
      })
    }
    if (etymology.phonetic) {
      addComponent({
        glyph: etymology.phonetic,
        role: 'phonetic',
        character,
        label: `${character} sound clue`,
        note: `The source explicitly identifies this as the phonetic element; it is not being treated as a second literal definition. ${SOURCE_NOTE}.`,
      })
    }
  }

  // An ideographic character is an idea drawn with pictures: 休 is "a person 亻
  // leaning against a tree 木". The source names the parts that carry the idea inside
  // its own hint, so a leaf is an idea part exactly when the hint names it -- no leaf
  // is promoted on a guess. Before 2026-09-29 these parts fell through to `form`, and
  // 我, 你, 好 and 休 all told the learner "its parts don't explain this one" while the
  // source sat there explaining them.
  if (etymology?.type === 'ideographic' && etymology.hint && decomposition) {
    for (const glyph of decompositionLeaves(decomposition)) {
      if (!etymology.hint.includes(glyph)) continue
      const definition = cleanText(dictionary.get(glyph)?.definition)
      addComponent({
        glyph,
        role: 'idea',
        character,
        label: `${character} idea part`,
        ...(definition ? { meaning: shortDefinition(definition) } : {}),
        note: `The source's formation analysis names this part: “${etymology.hint}”. ${SOURCE_NOTE}.`,
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
          character,
          label: `${character} dictionary radical`,
          note: `Indexing radical reported by the source. This label does not by itself claim that the radical supplies the character's meaning. ${SOURCE_NOTE}.`,
        })
        continue
      }
      addComponent({
        glyph,
        role: 'form',
        character,
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
      character,
      label: `${character} dictionary radical`,
      note: `Indexing radical reported by the source. This is deliberately separate from etymology. ${SOURCE_NOTE}.`,
    })
  }

  if (decomposition.includes('？')) {
    addComponent({
      glyph: '？',
      role: 'uncertain',
      character,
      label: `${character} unresolved component`,
      note: `The source marks part of this decomposition as unknown or uncertain, so the tutor leaves it unresolved instead of inventing a mnemonic. ${SOURCE_NOTE}.`,
    })
  }

  return components.map((component) => withPartDetails(component, dictionary))
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
      roles.push(
        `${etymology.phonetic} is identified as the phonetic/sound element`,
      )
    }
    const detail = roles.length
      ? roles.join('; ')
      : 'the source classifies the formation as pictophonetic'
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

function analyzeEntry(
  entry: MandarinCharacterDataEntry,
  dictionary: CharacterDictionary = new Map(),
): ParsedCharacterAnalysis | null {
  const character = cleanText(entry.character)
  if (!character) return null
  return {
    character,
    components: roleComponents(entry, dictionary),
    history: historyFor(entry),
    formation: formationFor(entry),
  }
}

/** The pure per-character analysis, exported so it can be tested without the network fetch. */
export function analyzeMandarinCharacter(
  entry: MandarinCharacterDataEntry,
  dictionary: CharacterDictionary,
): ParsedCharacterAnalysis | null {
  return analyzeEntry(entry, dictionary)
}

async function loadDictionary(): Promise<
  Map<string, MandarinCharacterDataEntry>
> {
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
      throw new Error(
        `Make Me a Hanzi dictionary line ${index + 1} was invalid JSON.`,
      )
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
    if (isHanCharacter(glyph) && !characters.includes(glyph))
      characters.push(glyph)
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
      .map((entry) => analyzeEntry(entry, dictionary))
      .filter((analysis): analysis is ParsedCharacterAnalysis =>
        Boolean(analysis),
      )

    if (!analyses.length) return card

    const components = analyses.flatMap((analysis) => analysis.components)
    const history = analyses.map((analysis) => analysis.history).join(' • ')
    const formations = analyses
      .map((analysis) => analysis.formation)
      .filter((formation): formation is MandarinFormation => Boolean(formation))

    return {
      ...card,
      ...(formations.length ? { formations } : {}),
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
  sourceUrl:
    'https://github.com/skishore/makemeahanzi/blob/master/dictionary.txt',
} as const
