import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ts from 'typescript'

type AuditKind =
  | 'GENRE'
  | 'ANIMAL'
  | 'SPECIES'
  | 'COLOR'
  | 'THEME'
  | 'CORE'
  | 'MOOD'
  | 'STYLE'
  | 'SETTING'
  | 'ART_DIRECTION'
  | 'OCCUPATION'
  | 'ARCHETYPE'
  | 'ROLE'
  | 'ALIGNMENT'
  | 'PERSONALITY'
  | 'BACKSTORY'
  | 'QUIRK'
  | 'MATERIAL'
  | 'PROMPT_ENHANCEMENT'
  | 'IDENTITY_REVIEW'
  | 'REWARD_CANDIDATE'
  | 'NON_FACET'
  | 'NEGATIVE_PROMPT'
  | 'REVIEW'

type MigrationAction =
  | 'import'
  | 'merge'
  | 'alias'
  | 'retain-programmatic'
  | 'review'

type RawCandidate = {
  title: string
  source: string
  sourcePath: string
  bucket: string
  explicitKind?: AuditKind
  description?: string
  imagePath?: string
  curated?: boolean
  notes?: string[]
  metadata?: Record<string, string | number | boolean | null>
}

type CandidateAudit = {
  normalizedKey: string
  canonicalTitle: string
  titles: string[]
  aliases: string[]
  recommendedKind: AuditKind
  recommendedGroup: string
  sources: string[]
  sourcePaths: string[]
  imagePaths: string[]
  descriptions: string[]
  metadata: Array<Record<string, string | number | boolean | null>>
  conflicts: string[]
  migrationAction: MigrationAction
  hasCuratedArt: boolean
}

type StructuralFinding = {
  id: string
  severity: 'info' | 'warning' | 'error'
  title: string
  evidence: string[]
  recommendation: string
}

type AuditReport = {
  schemaVersion: 1
  purpose: string
  summary: {
    sourceEntries: number
    canonicalCandidates: number
    facetCandidates: number
    programmaticEntries: number
    candidatesWithConflicts: number
    candidatesMissingCuratedArt: number
    byKind: Record<string, number>
    byAction: Record<string, number>
    bySource: Record<string, number>
  }
  currentFacetKinds: string[]
  proposedFacetKinds: string[]
  structuralFindings: StructuralFinding[]
  candidates: CandidateAudit[]
}

type VariableSourceSpec = {
  path: string
  source: string
  variables: Record<string, AuditKind>
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')
const markdownOutput = resolve(
  repositoryRoot,
  'docs/facets/generated/facet-source-audit.md',
)
const jsonOutput = resolve(
  repositoryRoot,
  'docs/facets/generated/facet-source-audit.json',
)

const writeOutputs = process.argv.includes('--write')
const selfTest = process.argv.includes('--self-test')

const proposedFacetKinds: AuditKind[] = [
  'GENRE',
  'ANIMAL',
  'SPECIES',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'OCCUPATION',
  'ARCHETYPE',
  'ROLE',
  'ALIGNMENT',
  'PERSONALITY',
  'BACKSTORY',
  'QUIRK',
  'MATERIAL',
  'PROMPT_ENHANCEMENT',
]

const artRequiredKinds = new Set<AuditKind>([
  'GENRE',
  'ANIMAL',
  'SPECIES',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'OCCUPATION',
  'ARCHETYPE',
  'ROLE',
  'ALIGNMENT',
  'PERSONALITY',
  'BACKSTORY',
  'QUIRK',
  'MATERIAL',
])

const occupationKeys = new Set(
  [
    'accountant',
    'public notary',
    'politician',
    'musician',
    'performance artist',
    'bounty hunter',
    'doctor',
    'lawyer',
    'space lawyer',
    'reporter',
    'gambler',
    'pilot',
    'engineer',
    'hacker',
    'xenobiologist',
    'void scout',
    'corporate operative',
    'weapons systems analyst',
    'drone wrangler',
    'signals intelligence',
    'investigator',
    'containment specialist',
    'compliance officer',
    'meeting facilitator',
    'debt collector',
    'grief cartographer',
    'accidental diplomat',
    'maritime ecclesiastic',
    'narrative engineer',
    'professional disappearer',
    'chaos consultant',
    'unlicensed exorcist',
    'chronicler of the wrong',
  ].map(normalizeKey),
)

const roleKeys = new Set(
  [
    'reluctant chosen one',
    'the bait',
    'mentor',
    'dark parallel',
    'designated protagonist',
    'the one with the forbidden power',
    'the one who knows where the bodies are',
    'ambient threat',
    'passive hazard',
    'decorative element',
    'unknown function',
    'the thing that does the thing',
    'ecosystem keystone',
    'invasive species',
    'load-bearing wall',
    'last survivor',
    'apex predator',
    'decommissioned weapon',
    'ship ai',
    'institutional memory',
  ].map(normalizeKey),
)

const archetypeKeys = new Set(
  [
    'rogue',
    'warrior',
    'wizard',
    'cleric',
    'bard',
    'ranger',
    'paladin',
    'druid',
    'monk',
    'warlock',
    'artificer',
    'oracle',
    'witch',
    'assassin',
    'mad scientist',
    'alchemist',
    'super hero',
    'super villain',
    'criminal mastermind',
    'occultist',
    'medium',
    'cultist',
    'sword saint',
    'probability thief',
    'reluctant team leader',
    'tactical coward',
    'plague baker',
    'retired villain',
  ].map(normalizeKey),
)

const brandedKeys = new Set(
  ['kryptonian', 'dalek', 'time lord', 'tralfamadorian', 'xenomorph'].map(
    normalizeKey,
  ),
)

const canonicalAliases = new Map<string, string>([
  [normalizeKey('Water Bear'), normalizeKey('Tardigrade')],
  [normalizeKey('Tardigrade'), normalizeKey('Tardigrade')],
])

const variableSources: VariableSourceSpec[] = [
  {
    path: 'stores/generatorStore.ts',
    source: 'generatorStore',
    variables: {
      GIVEN_NAMES: 'NON_FACET',
      FAMILY_NAMES: 'NON_FACET',
      HONORIFICS: 'NON_FACET',
      PERSONALITIES: 'PERSONALITY',
      QUIRKS: 'QUIRK',
      GENRES: 'GENRE',
      SPECIES: 'SPECIES',
      Classes: 'REVIEW',
      ALIGNMENTS: 'ALIGNMENT',
      GENDERS: 'IDENTITY_REVIEW',
      BACKGROUNDS: 'BACKSTORY',
    },
  },
  {
    path: 'stores/utils/randomAdjective.ts',
    source: 'randomHelper/adjective',
    variables: { adjectiveList: 'NON_FACET' },
  },
  {
    path: 'stores/utils/randomAnimal.ts',
    source: 'randomHelper/animal',
    variables: { animalList: 'ANIMAL' },
  },
  {
    path: 'stores/utils/randomBackstory.ts',
    source: 'randomHelper/backstory',
    variables: { backstoryList: 'BACKSTORY' },
  },
  {
    path: 'stores/utils/randomClass.ts',
    source: 'randomHelper/class',
    variables: { classList: 'REVIEW' },
  },
  {
    path: 'stores/utils/randomColor.ts',
    source: 'randomHelper/color',
    variables: { colorList: 'COLOR' },
  },
  {
    path: 'stores/utils/randomGenre.ts',
    source: 'randomHelper/genre',
    variables: { genreList: 'GENRE' },
  },
  {
    path: 'stores/utils/randomHonorific.ts',
    source: 'randomHelper/honorific',
    variables: { honorificList: 'NON_FACET' },
  },
  {
    path: 'stores/utils/randomInventory.ts',
    source: 'randomHelper/inventory',
    variables: { inventoryList: 'REWARD_CANDIDATE' },
  },
  {
    path: 'stores/utils/randomItem.ts',
    source: 'randomHelper/item',
    variables: { itemList: 'REWARD_CANDIDATE' },
  },
  {
    path: 'stores/utils/randomMaterial.ts',
    source: 'randomHelper/material',
    variables: { materialList: 'MATERIAL' },
  },
  {
    path: 'stores/utils/randomName.ts',
    source: 'randomHelper/name',
    variables: { nameList: 'NON_FACET' },
  },
  {
    path: 'stores/utils/randomNoun.ts',
    source: 'randomHelper/noun',
    variables: { nounList: 'NON_FACET' },
  },
  {
    path: 'stores/utils/randomPersonality.ts',
    source: 'randomHelper/personality',
    variables: { personalityList: 'PERSONALITY' },
  },
  {
    path: 'stores/utils/randomQuirks.ts',
    source: 'randomHelper/quirk',
    variables: { quirkList: 'QUIRK' },
  },
  {
    path: 'stores/utils/randomSkills.ts',
    source: 'randomHelper/skill',
    variables: { skillList: 'REWARD_CANDIDATE' },
  },
  {
    path: 'stores/utils/randomSpecies.ts',
    source: 'randomHelper/species',
    variables: {
      fantasySpecies: 'SPECIES',
      sciFiSpecies: 'SPECIES',
      cartoonSpecies: 'SPECIES',
    },
  },
  {
    path: 'stores/utils/randomVerb.ts',
    source: 'randomHelper/verb',
    variables: { verbList: 'NON_FACET' },
  },
  {
    path: 'stores/seeds/themeList.ts',
    source: 'artList/theme',
    variables: { themeList: 'THEME' },
  },
  {
    path: 'stores/seeds/styleList.ts',
    source: 'artList/style',
    variables: { styleList: 'STYLE' },
  },
  {
    path: 'stores/seeds/colorList.ts',
    source: 'artList/palette',
    variables: { colorPaletteList: 'COLOR' },
  },
  {
    path: 'stores/seeds/prettifierList.ts',
    source: 'artList/prettifier',
    variables: { prettifierList: 'PROMPT_ENHANCEMENT' },
  },
  {
    path: 'stores/seeds/negativeList.ts',
    source: 'artList/negative',
    variables: { negativeList: 'NEGATIVE_PROMPT' },
  },
]

function normalizeKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function propertyNameText(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text
  return null
}

function propertyExpression(
  object: ts.ObjectLiteralExpression,
  key: string,
): ts.Expression | undefined {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    if (propertyNameText(property.name) === key) return property.initializer
  }
  return undefined
}

function stringValue(expression?: ts.Expression): string | undefined {
  if (!expression) return undefined
  if (
    ts.isStringLiteral(expression) ||
    ts.isNoSubstitutionTemplateLiteral(expression)
  ) {
    return expression.text.trim()
  }
  return undefined
}

function booleanValue(expression?: ts.Expression): boolean | undefined {
  if (!expression) return undefined
  if (expression.kind === ts.SyntaxKind.TrueKeyword) return true
  if (expression.kind === ts.SyntaxKind.FalseKeyword) return false
  return undefined
}

function parseSource(path: string, source: string): ts.SourceFile {
  return ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
}

function literalArrayStrings(expression?: ts.Expression): string[] {
  if (!expression || !ts.isArrayLiteralExpression(expression)) return []
  return expression.elements
    .map((element) => stringValue(element as ts.Expression))
    .filter((value): value is string => Boolean(value))
}

function collectNamedStringArrays(sourceFile: ts.SourceFile): Map<string, string[]> {
  const result = new Map<string, string[]>()

  function visit(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      const values = literalArrayStrings(node.initializer)
      if (values.length) result.set(node.name.text, values)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}

function resolvedArrayStrings(
  expression: ts.Expression | undefined,
  namedArrays: Map<string, string[]>,
): string[] {
  if (!expression) return []
  const direct = literalArrayStrings(expression)
  if (direct.length) return direct
  if (ts.isIdentifier(expression)) return namedArrays.get(expression.text) ?? []
  return []
}

function findVariableInitializer(
  sourceFile: ts.SourceFile,
  variableName: string,
): ts.Expression | undefined {
  let result: ts.Expression | undefined

  function visit(node: ts.Node): void {
    if (result) return
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName
    ) {
      result = node.initializer
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}

function adventureEntries(source: string): RawCandidate[] {
  const sourcePath = 'stores/helpers/adventureCards.ts'
  const sourceFile = parseSource(sourcePath, source)
  const namedArrays = collectNamedStringArrays(sourceFile)
  const cardsInitializer = findVariableInitializer(sourceFile, 'ADVENTURE_CARDS')
  if (!cardsInitializer || !ts.isArrayLiteralExpression(cardsInitializer)) return []

  const entries: RawCandidate[] = []

  for (const cardNode of cardsInitializer.elements) {
    if (!ts.isObjectLiteralExpression(cardNode)) continue
    const cardKey = stringValue(propertyExpression(cardNode, 'key')) ?? 'unknown'
    const stepsNode = propertyExpression(cardNode, 'steps')
    if (!stepsNode || !ts.isArrayLiteralExpression(stepsNode)) continue

    for (const stepNode of stepsNode.elements) {
      if (!ts.isObjectLiteralExpression(stepNode)) continue
      const bucket =
        stringValue(propertyExpression(stepNode, 'field')) ??
        stringValue(propertyExpression(stepNode, 'key')) ??
        cardKey
      const choicesNode = propertyExpression(stepNode, 'choices')
      if (!choicesNode || !ts.isArrayLiteralExpression(choicesNode)) continue

      for (const choiceNode of choicesNode.elements) {
        if (!ts.isObjectLiteralExpression(choiceNode)) continue
        const value = stringValue(propertyExpression(choiceNode, 'value')) ?? ''
        const label = stringValue(propertyExpression(choiceNode, 'label')) ?? value
        const description = stringValue(propertyExpression(choiceNode, 'subtext'))
        const imagePath = stringValue(propertyExpression(choiceNode, 'image'))
        const opensCustom = booleanValue(
          propertyExpression(choiceNode, 'opensCustom'),
        )
        const opensList = booleanValue(propertyExpression(choiceNode, 'opensList'))

        if (value && !opensCustom) {
          entries.push({
            title: label || value,
            source: `adventureCards/${cardKey}`,
            sourcePath,
            bucket,
            description,
            imagePath,
            curated: true,
            notes: label !== value ? [`stored value: ${value}`] : undefined,
          })
        }

        if (opensList) {
          const listOptions = resolvedArrayStrings(
            propertyExpression(choiceNode, 'listOptions'),
            namedArrays,
          )
          for (const option of listOptions) {
            entries.push({
              title: option,
              source: `adventureCards/${cardKey}/extended`,
              sourcePath,
              bucket,
              curated: true,
              notes: ['Extended builder list entry; no dedicated choice card.'],
            })
          }
        }
      }
    }
  }

  return entries
}

function animalDataEntries(source: string): RawCandidate[] {
  const sourcePath = 'stores/utils/animalData.ts'
  const sourceFile = parseSource(sourcePath, source)
  const initializer = findVariableInitializer(sourceFile, 'animalDataList')
  if (!initializer || !ts.isArrayLiteralExpression(initializer)) return []

  const entries: RawCandidate[] = []
  for (const node of initializer.elements) {
    if (!ts.isObjectLiteralExpression(node)) continue
    const title = stringValue(propertyExpression(node, 'name'))
    if (!title) continue

    const metadata: Record<string, string | number | boolean | null> = {}
    const scientificName = stringValue(propertyExpression(node, 'scientificName'))
    const category = stringValue(propertyExpression(node, 'category'))
    const wikiUrl = stringValue(propertyExpression(node, 'wikiUrl'))
    if (scientificName) metadata.scientificName = scientificName
    if (category) metadata.category = category
    if (wikiUrl) metadata.wikiUrl = wikiUrl

    entries.push({
      title,
      source: 'animalData',
      sourcePath,
      bucket: 'animal',
      explicitKind: 'ANIMAL',
      description: stringValue(propertyExpression(node, 'description')),
      imagePath: stringValue(propertyExpression(node, 'imageUrl')),
      metadata,
    })
  }
  return entries
}

function classifyClass(title: string): AuditKind {
  const key = normalizeKey(title)
  if (occupationKeys.has(key)) return 'OCCUPATION'
  if (roleKeys.has(key)) return 'ROLE'
  if (archetypeKeys.has(key)) return 'ARCHETYPE'
  return 'REVIEW'
}

function classifyEntry(entry: RawCandidate, animalKeys: Set<string>): AuditKind {
  if (entry.explicitKind === 'REVIEW' && entry.bucket === 'class') {
    return classifyClass(entry.title)
  }
  if (entry.explicitKind) return entry.explicitKind

  const bucket = entry.bucket.toLowerCase()
  if (bucket === 'genre' || bucket === 'genres') return 'GENRE'
  if (bucket === 'species') {
    return animalKeys.has(normalizeKey(entry.title)) ? 'ANIMAL' : 'SPECIES'
  }
  if (bucket === 'class' || bucket === 'role') return classifyClass(entry.title)
  if (bucket === 'alignment') return 'ALIGNMENT'
  if (bucket === 'personality') return 'PERSONALITY'
  if (bucket === 'backstory' || bucket === 'background') return 'BACKSTORY'
  if (bucket === 'quirks' || bucket === 'quirk') return 'QUIRK'
  if (bucket === 'color' || bucket === 'palette') return 'COLOR'
  if (bucket === 'theme') return 'THEME'
  if (bucket === 'style') return 'STYLE'
  return 'REVIEW'
}

function recommendedGroup(kind: AuditKind, entries: RawCandidate[]): string {
  if (kind === 'ANIMAL') return 'Species / Animals'
  if (kind === 'SPECIES') return 'Species / Fictional and constructed beings'
  if (kind === 'OCCUPATION') return 'Class / Occupations'
  if (kind === 'ARCHETYPE') return 'Class / Archetypes'
  if (kind === 'ROLE') return 'Class / Narrative roles'
  if (kind === 'REVIEW' && entries.some((entry) => entry.bucket === 'class')) {
    return 'Class / Needs classification'
  }
  if (kind === 'NON_FACET') return 'Programmatic lexicon'
  if (kind === 'REWARD_CANDIDATE') return 'Reward migration review'
  if (kind === 'NEGATIVE_PROMPT') return 'Generation configuration'
  if (kind === 'IDENTITY_REVIEW') return 'Identity field review'
  return kind
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function pickCanonicalTitle(entries: RawCandidate[]): string {
  const ranked = [...entries].sort((a, b) => {
    const rank = (entry: RawCandidate): number => {
      if (entry.curated && entry.imagePath?.startsWith('/images/')) return 0
      if (entry.curated) return 1
      if (entry.source === 'animalData') return 2
      if (entry.source === 'generatorStore') return 3
      return 4
    }
    return rank(a) - rank(b) || a.title.localeCompare(b.title)
  })
  return ranked[0]?.title ?? entries[0]?.title ?? 'Untitled'
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

function aggregateCandidates(entries: RawCandidate[]): CandidateAudit[] {
  const animalKeys = new Set(
    entries
      .filter((entry) => entry.explicitKind === 'ANIMAL')
      .map((entry) => normalizeKey(entry.title)),
  )
  const grouped = new Map<string, RawCandidate[]>()

  for (const entry of entries) {
    const normalized = normalizeKey(entry.title)
    if (!normalized) continue
    const canonicalKey = canonicalAliases.get(normalized) ?? normalized
    const group = grouped.get(canonicalKey) ?? []
    group.push(entry)
    grouped.set(canonicalKey, group)
  }

  const candidates: CandidateAudit[] = []

  for (const [normalizedKey, group] of grouped) {
    const canonicalTitle = pickCanonicalTitle(group)
    const titles = unique(group.map((entry) => entry.title)).sort()
    const kinds = unique(group.map((entry) => classifyEntry(entry, animalKeys))) as AuditKind[]
    const recommendedKind =
      kinds.length === 1
        ? kinds[0]!
        : kinds.includes('ANIMAL') && kinds.includes('SPECIES')
          ? 'ANIMAL'
          : 'REVIEW'
    const sources = unique(group.map((entry) => entry.source)).sort()
    const sourcePaths = unique(group.map((entry) => entry.sourcePath)).sort()
    const imagePaths = unique(group.map((entry) => entry.imagePath)).sort()
    const descriptions = unique(group.map((entry) => entry.description)).sort()
    const hasCuratedArt = imagePaths.some((path) => path.startsWith('/images/'))
    const conflicts: string[] = []

    if (kinds.length > 1 && recommendedKind === 'REVIEW') {
      conflicts.push(`Conflicting type recommendations: ${kinds.join(', ')}`)
    }
    if (brandedKeys.has(normalizedKey)) {
      conflicts.push('Likely franchise-specific or IP-sensitive term.')
    }
    if (imagePaths.length > 1) {
      conflicts.push('Multiple image sources; curated local builder art should win.')
    }
    if (descriptions.length > 1) {
      conflicts.push('Multiple descriptions require merge or canonical-copy review.')
    }
    if (titles.length > 1) {
      conflicts.push('Multiple titles should become aliases or receive manual review.')
    }
    if (artRequiredKinds.has(recommendedKind) && !hasCuratedArt) {
      conflicts.push('Missing curated local artwork for an art-bearing Facet kind.')
    }

    const repeatedSources = sources.filter(
      (source) => group.filter((entry) => entry.source === source).length > 1,
    )
    if (repeatedSources.length) {
      conflicts.push(`Duplicate entries within source: ${repeatedSources.join(', ')}`)
    }

    let migrationAction: MigrationAction = 'import'
    if (
      recommendedKind === 'NON_FACET' ||
      recommendedKind === 'NEGATIVE_PROMPT'
    ) {
      migrationAction = 'retain-programmatic'
    } else if (
      recommendedKind === 'REVIEW' ||
      recommendedKind === 'IDENTITY_REVIEW' ||
      recommendedKind === 'REWARD_CANDIDATE' ||
      brandedKeys.has(normalizedKey)
    ) {
      migrationAction = 'review'
    } else if (titles.length > 1 && sources.length === 1) {
      migrationAction = 'alias'
    } else if (sources.length > 1) {
      migrationAction = 'merge'
    }

    candidates.push({
      normalizedKey,
      canonicalTitle,
      titles,
      aliases: titles.filter((title) => title !== canonicalTitle),
      recommendedKind,
      recommendedGroup: recommendedGroup(recommendedKind, group),
      sources,
      sourcePaths,
      imagePaths,
      descriptions,
      metadata: group
        .map((entry) => entry.metadata)
        .filter(
          (metadata): metadata is Record<
            string,
            string | number | boolean | null
          > => Boolean(metadata && Object.keys(metadata).length),
        ),
      conflicts,
      migrationAction,
      hasCuratedArt,
    })
  }

  return candidates.sort(
    (a, b) =>
      a.recommendedKind.localeCompare(b.recommendedKind) ||
      a.canonicalTitle.localeCompare(b.canonicalTitle),
  )
}

async function readRepositoryFile(path: string): Promise<string> {
  return readFile(resolve(repositoryRoot, path), 'utf8')
}

async function collectEntries(
  findings: StructuralFinding[],
): Promise<RawCandidate[]> {
  const entries: RawCandidate[] = []

  for (const spec of variableSources) {
    let source: string
    try {
      source = await readRepositoryFile(spec.path)
    } catch {
      findings.push({
        id: `missing-source-${normalizeKey(spec.path)}`,
        severity: 'warning',
        title: `Configured audit source is missing: ${spec.path}`,
        evidence: [spec.path],
        recommendation: 'Remove the stale source spec or restore the intended pool.',
      })
      continue
    }

    const sourceFile = parseSource(spec.path, source)
    const arrays = collectNamedStringArrays(sourceFile)
    for (const [variable, kind] of Object.entries(spec.variables)) {
      const values = arrays.get(variable)
      if (!values?.length) {
        findings.push({
          id: `missing-array-${normalizeKey(spec.path)}-${normalizeKey(variable)}`,
          severity: 'warning',
          title: `Expected list ${variable} was not found in ${spec.path}`,
          evidence: [`${spec.path}#${variable}`],
          recommendation:
            'Update the audit source map if the list was renamed or migrated.',
        })
        continue
      }

      for (const title of values) {
        entries.push({
          title,
          source: spec.source,
          sourcePath: spec.path,
          bucket: variable.toLowerCase().includes('class') ? 'class' : variable,
          explicitKind: kind,
        })
      }
    }
  }

  try {
    entries.push(...animalDataEntries(await readRepositoryFile('stores/utils/animalData.ts')))
  } catch {
    findings.push({
      id: 'missing-animal-data',
      severity: 'error',
      title: 'animalData.ts could not be audited.',
      evidence: ['stores/utils/animalData.ts'],
      recommendation: 'Restore the rich animal metadata source before migration.',
    })
  }

  try {
    const adventure = adventureEntries(
      await readRepositoryFile('stores/helpers/adventureCards.ts'),
    )
    entries.push(...adventure)
    if (!adventure.length) {
      findings.push({
        id: 'adventure-cards-unparsed',
        severity: 'error',
        title: 'The curated Adventure Builder choices could not be parsed.',
        evidence: ['stores/helpers/adventureCards.ts#ADVENTURE_CARDS'],
        recommendation:
          'Update the AST extractor before using the report for migration.',
      })
    }
  } catch {
    findings.push({
      id: 'missing-adventure-cards',
      severity: 'error',
      title: 'The curated Adventure Builder source is unavailable.',
      evidence: ['stores/helpers/adventureCards.ts'],
      recommendation: 'Do not migrate until the curated source can be inventoried.',
    })
  }

  return entries
}

function parseFacetKinds(schema: string): string[] {
  const match = schema.match(/enum\s+FacetKind\s*\{([\s\S]*?)\}/)
  if (!match?.[1]) return []
  return match[1]
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/)[0] ?? '')
    .filter((value) => /^[A-Z][A-Z0-9_]*$/.test(value))
}

async function detectStructuralFindings(): Promise<{
  findings: StructuralFinding[]
  currentFacetKinds: string[]
}> {
  const findings: StructuralFinding[] = []
  const [randomStore, dreamApi, randomSpecies, schema, facetStore] =
    await Promise.all([
      readRepositoryFile('stores/randomStore.ts').catch(() => ''),
      readRepositoryFile('server/api/dreams/index.ts').catch(() => ''),
      readRepositoryFile('stores/utils/randomSpecies.ts').catch(() => ''),
      readRepositoryFile('prisma/schema.prisma').catch(() => ''),
      readRepositoryFile('stores/facetStore.ts').catch(() => ''),
    ])

  const currentFacetKinds = parseFacetKinds(schema)

  if (
    randomStore.includes('dreamType=RANDOMLIST') &&
    randomStore.includes("'BRAINSTORM'") &&
    randomStore.includes("dreamType: 'PITCH'") &&
    !dreamApi.includes("'RANDOMLIST'")
  ) {
    findings.push({
      id: 'random-list-type-drift',
      severity: 'error',
      title: 'The user random-list path disagrees with the Dream API and itself.',
      evidence: [
        'randomStore fetches dreamType=RANDOMLIST.',
        'The current Dream API does not register RANDOMLIST.',
        'Random-list rows are filtered/created as BRAINSTORM and updated as PITCH.',
      ],
      recommendation:
        'Retire Dream-backed random lists as a content authority; use Facets or a dedicated list model.',
    })
  }

  if (
    randomSpecies.includes('Math.random') &&
    randomSpecies.includes('const speciesList') &&
    randomSpecies.includes('for (let i = 0; i < 100; i++)')
  ) {
    findings.push({
      id: 'module-scope-random-species',
      severity: 'error',
      title: 'randomSpecies creates a different species catalog at module load.',
      evidence: [
        'stores/utils/randomSpecies.ts builds speciesList with Math.random.',
        'Random animals and generated hybrids do not receive durable IDs.',
      ],
      recommendation:
        'Keep hybrid generation programmatic, but draw its durable components from Facets.',
    })
  }

  if (!facetStore.includes("'character'")) {
    findings.push({
      id: 'character-facet-owner-missing',
      severity: 'error',
      title: 'Characters cannot currently own Facet assignments.',
      evidence: ['FacetOwnerType currently covers Dream, Scenario, and ArtImage only.'],
      recommendation:
        'Add an explicit CharacterFacet join with field role and ordering metadata.',
    })
  }

  const missingKinds = proposedFacetKinds.filter(
    (kind) => !currentFacetKinds.includes(kind),
  )
  if (missingKinds.length) {
    findings.push({
      id: 'facet-kind-coverage',
      severity: 'warning',
      title: 'FacetKind cannot represent the curated Character Builder taxonomy.',
      evidence: [`Missing proposed kinds: ${missingKinds.join(', ')}`],
      recommendation:
        'Expand FacetKind only after this audit is reviewed; preserve class divisions as occupation, archetype, and narrative role.',
    })
  }

  findings.push({
    id: 'source-priority',
    severity: 'info',
    title: 'Curated Character Builder cards are the preferred migration source.',
    evidence: [
      'They preserve labels, descriptions, local artwork, divisions, and ordering.',
      'generatorStore and randomHelper contain overlapping plain-string copies.',
    ],
    recommendation:
      'Use curated card data first, then enrich from existing Facets and animalData; use legacy pools only for gap discovery.',
  })

  return { findings, currentFacetKinds }
}

function countBy<T>(values: T[], key: (value: T) => string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const value of values) {
    const label = key(value)
    counts[label] = (counts[label] ?? 0) + 1
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
  )
}

function buildReport(
  entries: RawCandidate[],
  candidates: CandidateAudit[],
  currentFacetKinds: string[],
  findings: StructuralFinding[],
): AuditReport {
  const facetCandidates = candidates.filter((candidate) =>
    proposedFacetKinds.includes(candidate.recommendedKind),
  )
  const programmaticEntries = candidates.filter((candidate) =>
    ['NON_FACET', 'NEGATIVE_PROMPT'].includes(candidate.recommendedKind),
  )

  return {
    schemaVersion: 1,
    purpose:
      'Inventory competing creative seed sources before consolidating reusable content into Facets.',
    summary: {
      sourceEntries: entries.length,
      canonicalCandidates: candidates.length,
      facetCandidates: facetCandidates.length,
      programmaticEntries: programmaticEntries.length,
      candidatesWithConflicts: candidates.filter(
        (candidate) => candidate.conflicts.length,
      ).length,
      candidatesMissingCuratedArt: candidates.filter((candidate) =>
        candidate.conflicts.some((conflict) => conflict.startsWith('Missing curated')),
      ).length,
      byKind: countBy(candidates, (candidate) => candidate.recommendedKind),
      byAction: countBy(candidates, (candidate) => candidate.migrationAction),
      bySource: countBy(entries, (entry) => entry.source),
    },
    currentFacetKinds,
    proposedFacetKinds,
    structuralFindings: findings,
    candidates,
  }
}

function markdownTable(rows: string[][]): string {
  if (!rows.length) return '_None._'
  const header = rows[0]!
  const separator = header.map(() => '---')
  return [header, separator, ...rows.slice(1)]
    .map((row) => `| ${row.join(' | ')} |`)
    .join('\n')
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function renderMarkdown(report: AuditReport): string {
  const summaryRows = [
    ['Measure', 'Count'],
    ['Source entries', String(report.summary.sourceEntries)],
    ['Canonical candidates', String(report.summary.canonicalCandidates)],
    ['Facet candidates', String(report.summary.facetCandidates)],
    ['Programmatic/non-Facet candidates', String(report.summary.programmaticEntries)],
    ['Candidates with conflicts', String(report.summary.candidatesWithConflicts)],
    [
      'Art-bearing candidates missing curated local art',
      String(report.summary.candidatesMissingCuratedArt),
    ],
  ]

  const kindRows = [
    ['Recommended kind', 'Candidates'],
    ...Object.entries(report.summary.byKind).map(([kind, count]) => [
      kind,
      String(count),
    ]),
  ]

  const actionRows = [
    ['Migration action', 'Candidates'],
    ...Object.entries(report.summary.byAction).map(([action, count]) => [
      action,
      String(count),
    ]),
  ]

  const sourceRows = [
    ['Source', 'Entries'],
    ...Object.entries(report.summary.bySource).map(([source, count]) => [
      escapeCell(source),
      String(count),
    ]),
  ]

  const conflictRows = [
    ['Candidate', 'Kind', 'Action', 'Sources', 'Conflicts'],
    ...report.candidates
      .filter((candidate) => candidate.conflicts.length)
      .slice(0, 200)
      .map((candidate) => [
        escapeCell(candidate.canonicalTitle),
        candidate.recommendedKind,
        candidate.migrationAction,
        escapeCell(candidate.sources.join(', ')),
        escapeCell(candidate.conflicts.join(' ')),
      ]),
  ]

  const findings = report.structuralFindings
    .map(
      (finding) => `### ${finding.title}\n\n**Severity:** ${finding.severity}\n\n${finding.evidence
        .map((evidence) => `- ${evidence}`)
        .join('\n')}\n\n**Recommendation:** ${finding.recommendation}`,
    )
    .join('\n\n')

  return `# Facet Source Audit — Generated Inventory

This report inventories the repository's competing creative-seed authorities. It is generated by \`npm run audit:facet-sources\` and should be reviewed before schema expansion or database backfill.

## Answer first

- The curated Adventure Character Builder is the preferred source for labels, descriptions, artwork, divisions, and ordering.
- Facet should own reusable creative concepts; randomStore should select and combine them rather than maintain a separate encyclopedia.
- Names, verbs, nouns, generic adjectives, negative prompts, rarity rolls, and procedural hybrid assembly remain programmatic.
- Items, skills, pets, powers, magic, and favors should normally migrate to Reward, not Facet.
- Colors do not require image files; art-bearing creative categories do.

## Summary

${markdownTable(summaryRows)}

## Structural findings

${findings}

## Candidate kinds

${markdownTable(kindRows)}

## Migration actions

${markdownTable(actionRows)}

## Source coverage

${markdownTable(sourceRows)}

## Conflicts and missing art

${markdownTable(conflictRows)}

## Source priority

1. Curated Adventure Builder choice with local art and copy.
2. Existing reviewed database Facet.
3. Rich animalData metadata.
4. generatorStore list.
5. randomHelper utility list.
6. Module-load-generated randomSpecies output.

## Interpretation rules

- A Facet's kind describes what the concept is; assignment metadata describes how it is used. An Octopus remains an ANIMAL even when assigned to a Character's species field.
- The current Character class bucket must be split into OCCUPATION, ARCHETYPE, and ROLE without changing the existing Character field during compatibility.
- Duplicate normalized titles are merge candidates. Safe linguistic variants become Facet aliases.
- Franchise-specific names and unclear class entries require explicit review and are never silently imported.
- Existing local Character Builder art is protected source material and wins over remote or missing images.
`
}

async function writeReport(report: AuditReport): Promise<void> {
  await mkdir(dirname(markdownOutput), { recursive: true })
  await Promise.all([
    writeFile(jsonOutput, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    writeFile(markdownOutput, `${renderMarkdown(report).trim()}\n`, 'utf8'),
  ])
}

function runSelfTest(): void {
  const fixture = `
    const EXTRA = ['Tardigrade']
    export const ADVENTURE_CARDS = [{
      key: 'species',
      steps: [{
        key: 'species',
        field: 'species',
        choices: [
          { value: 'Cat', label: 'Cat', subtext: 'A cat.', image: '/images/cat.webp' },
          { value: '', label: 'More', opensList: true, listOptions: EXTRA },
        ],
      }],
    }]
  `
  const entries = adventureEntries(fixture)
  if (entries.length !== 2) {
    throw new Error(`Self-test expected 2 Adventure entries, received ${entries.length}.`)
  }
  if (!entries.some((entry) => entry.title === 'Cat' && entry.imagePath)) {
    throw new Error('Self-test failed to preserve curated choice artwork.')
  }
  if (!entries.some((entry) => entry.title === 'Tardigrade')) {
    throw new Error('Self-test failed to resolve extended list options.')
  }
  console.log('Facet source audit self-test passed.')
}

async function main(): Promise<void> {
  if (selfTest) {
    runSelfTest()
    return
  }

  const structural = await detectStructuralFindings()
  const entries = await collectEntries(structural.findings)
  const candidates = aggregateCandidates(entries)
  const report = buildReport(
    entries,
    candidates,
    structural.currentFacetKinds,
    structural.findings,
  )

  if (writeOutputs) await writeReport(report)

  console.log(
    `Facet source audit found ${report.summary.sourceEntries} source entries and ${report.summary.canonicalCandidates} canonical candidates.`,
  )
  console.log(
    `${report.summary.candidatesWithConflicts} candidates need conflict review; ${report.summary.candidatesMissingCuratedArt} art-bearing candidates lack curated local art.`,
  )
  if (writeOutputs) {
    console.log(`Wrote ${relative(repositoryRoot, markdownOutput)}.`)
    console.log(`Wrote ${relative(repositoryRoot, jsonOutput)}.`)
  } else {
    console.log('Run with --write to generate the Markdown and JSON reports.')
  }

  if (structural.findings.some((finding) => finding.severity === 'error')) {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
