// /utils/scripts/verifyFacetBuilderCoverage.ts
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ADVENTURE_CARDS } from '../../stores/helpers/adventureCards'
import { ART_CARDS } from '../../stores/helpers/artCards'
import {
  GENDER_ARTWORK_PATHS,
  GENDER_ARTWORK_TARGETS,
} from '../seeds/facetGenderArtwork'

const root = process.cwd()

const FACET_BACKED_FIELDS = new Set([
  'species',
  'gender',
  'alignment',
  'class',
  'personality',
  'backstory',
  'quirks',
  'quirk',
  'genre',
  'genres',
  'role',
  'subject',
  'figureSpecies',
  'style',
  'punk',
  'theme',
  'palette',
  'emotion',
  'prettifiers',
])

const OPERATIONAL_ART_FIELDS = new Set([
  'mode',
  'sourceImage',
  'sourceImages',
  'blendInstruction',
  'figureCount',
  'background',
  'objects',
  'loras',
  'checkpoint',
  'artServer',
  'negativeFilters',
  'art',
])

type IllustratedChoice = {
  sourceKey: 'adventure' | 'art'
  cardKey: string
  stepKey: string
  fieldKey: string
  value: string
  label: string
  imagePath: string
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing Builder coverage contract text: ${fragment}`)
  }
}

async function pathExists(imagePath: string): Promise<boolean> {
  try {
    await access(resolve(root, 'public', imagePath.slice(1)))
    return true
  } catch {
    return false
  }
}

async function main(): Promise<void> {
  const failures: string[] = []
  const knownArtworkDebt: string[] = []
  const illustrated: IllustratedChoice[] = []
  const sources = [
    { sourceKey: 'adventure' as const, cards: ADVENTURE_CARDS },
    { sourceKey: 'art' as const, cards: ART_CARDS },
  ]

  for (const source of sources) {
    for (const card of source.cards) {
      for (const step of card.steps) {
        const fieldKey = (
          clean(step.field) ||
          clean(step.key) ||
          clean(card.key)
        )

        for (const choice of step.choices ?? []) {
          if (choice.opensCustom || choice.opensList) continue
          const value = clean(choice.value)
          const label = clean(choice.label) || value
          const imagePath = clean(choice.image)
          if (!value || !imagePath) continue

          illustrated.push({
            sourceKey: source.sourceKey,
            cardKey: card.key,
            stepKey: step.key,
            fieldKey,
            value,
            label,
            imagePath,
          })

          if (!FACET_BACKED_FIELDS.has(fieldKey)) {
            failures.push(
              `${source.sourceKey}:${card.key}/${step.key}/${label} has dedicated Builder artwork but field ${fieldKey} is not Facet-backed.`,
            )
          }

          if (!imagePath.startsWith('/images/')) {
            failures.push(
              `${source.sourceKey}:${card.key}/${step.key}/${label} uses non-public Builder artwork: ${imagePath}`,
            )
            continue
          }

          // Adventure art is versioned in-repo except for the tracked Gender
          // backlog. Art Builder assets live on the media host and are validated
          // by the seed's media contract instead of local existsSync/access.
          if (source.sourceKey === 'adventure' && !(await pathExists(imagePath))) {
            if (fieldKey === 'gender' && GENDER_ARTWORK_PATHS.has(imagePath)) {
              knownArtworkDebt.push(imagePath)
            } else {
              failures.push(
                `${label} references missing Builder artwork: public${imagePath}`,
              )
            }
          }
        }

        if (
          source.sourceKey === 'art' &&
          !FACET_BACKED_FIELDS.has(fieldKey) &&
          !OPERATIONAL_ART_FIELDS.has(fieldKey)
        ) {
          failures.push(
            `Art Builder field ${card.key}/${step.key} (${fieldKey}) is neither Facet-backed nor an explicit operational exemption.`,
          )
        }
      }
    }
  }

  const genderCard = ADVENTURE_CARDS.find((card) => card.key === 'gender')
  for (const path of [genderCard?.deckImage, genderCard?.heroImage]) {
    const imagePath = clean(path)
    if (!imagePath) {
      failures.push('Gender Builder card must keep both deck and hero artwork paths.')
      continue
    }
    if (!(await pathExists(imagePath))) {
      if (GENDER_ARTWORK_PATHS.has(imagePath)) knownArtworkDebt.push(imagePath)
      else failures.push(`Gender Builder references untracked missing artwork: ${imagePath}`)
    }
  }

  const genderChoices = illustrated.filter(
    (choice) => choice.fieldKey === 'gender',
  )
  if (genderChoices.length !== 6) {
    failures.push(
      `Expected 6 illustrated Gender choices, found ${genderChoices.length}.`,
    )
  }

  for (const choice of genderChoices) {
    if (!choice.imagePath.startsWith('/images/adventure/gender/')) {
      failures.push(
        `${choice.label} must preserve its curated Gender artwork path, found ${choice.imagePath}.`,
      )
    }
  }

  const sourceGenderPaths = new Set([
    ...genderChoices.map((choice) => choice.imagePath),
    clean(genderCard?.deckImage),
    clean(genderCard?.heroImage),
    '/images/adventure/gender/custom.webp',
  ])
  for (const target of GENDER_ARTWORK_TARGETS) {
    if (!sourceGenderPaths.has(target.path)) {
      failures.push(
        `Gender artwork manifest target ${target.path} is not represented by the Builder source.`,
      )
    }
  }

  const illustratedArtFields = new Set(
    illustrated
      .filter((choice) => choice.sourceKey === 'art')
      .map((choice) => choice.fieldKey),
  )
  for (const fieldKey of ['subject', 'style', 'punk']) {
    if (!illustratedArtFields.has(fieldKey)) {
      failures.push(`Art Builder illustrated field ${fieldKey} was not discovered.`)
    }
  }

  const files = {
    serverCatalog: 'server/utils/facetCatalog.ts',
    catalogStore: 'stores/facetCatalogStore.ts',
    characterSync: 'server/utils/characterFacetSync.ts',
    randomStore: 'stores/randomStore.ts',
    seedWrapper: 'utils/scripts/runFacetCatalogSeed.ts',
    artSeed: 'utils/scripts/seedArtBuilderFacetCatalog.ts',
    genderSeed: 'utils/scripts/seedGenderFacetCatalog.ts',
    genderValues: 'utils/seeds/facetGenderValues.ts',
    genderArtwork: 'utils/seeds/facetGenderArtwork.ts',
    seedPolicy: 'scripts/lib/facetCatalogSeedPolicy.mjs',
    builderPlugin: 'plugins/20.facet-catalog.client.ts',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await readFile(resolve(root, path), 'utf8')] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.serverCatalog, text.serverCatalog, "'GENDER'")
  requireText(files.catalogStore, text.catalogStore, "gender: ['GENDER']")
  requireText(files.catalogStore, text.catalogStore, 'ART_FIELD_FACETS')
  requireText(files.catalogStore, text.catalogStore, 'builderChoicesForArtField')
  requireText(files.catalogStore, text.catalogStore, "subject: { taxonomies: ['ART_DIRECTION']")
  requireText(files.catalogStore, text.catalogStore, "punk: { taxonomies: ['STYLE']")
  requireText(files.catalogStore, text.catalogStore, "emotion: { taxonomies: ['MOOD']")
  requireText(files.characterSync, text.characterSync, "gender: ['GENDER']")
  requireText(files.randomStore, text.randomStore, "gender: ['GENDER']")
  requireText(files.seedWrapper, text.seedWrapper, "import('./seedGenderFacetCatalog')")
  requireText(files.seedWrapper, text.seedWrapper, "import('./seedArtBuilderFacetCatalog')")
  requireText(files.artSeed, text.artSeed, "subject: {")
  requireText(files.artSeed, text.artSeed, "punk: {")
  requireText(files.artSeed, text.artSeed, "emotion: {")
  requireText(files.artSeed, text.artSeed, 'artBuilderFields')
  requireText(files.artSeed, text.artSeed, 'mediaAssetExists')
  requireText(files.genderSeed, text.genderSeed, "taxonomy: 'GENDER'")
  requireText(files.genderSeed, text.genderSeed, 'backfillCharacterGender')
  requireText(files.genderSeed, text.genderSeed, "fieldKey: 'gender'")
  requireText(files.genderSeed, text.genderSeed, 'existingPublicImagePath')
  requireText(files.genderValues, text.genderValues, 'legacyFacetGenderValues')
  requireText(files.genderArtwork, text.genderArtwork, 'GENDER_ARTWORK_TARGETS')
  requireText(files.seedPolicy, text.seedPolicy, 'stores/helpers/artCards.ts')
  requireText(files.seedPolicy, text.seedPolicy, 'utils/scripts/seedArtBuilderFacetCatalog.ts')
  requireText(files.builderPlugin, text.builderPlugin, "import { ART_CARDS }")
  requireText(files.builderPlugin, text.builderPlugin, 'hydrateArtBuilder')
  requireText(files.builderPlugin, text.builderPlugin, "operationalExemptions: ['mode', 'figureCount', 'negativeFilters']")

  if (illustrated.length < 70) {
    failures.push(
      `Only ${illustrated.length} illustrated reusable Builder choices were found; expected at least 70 across Adventure and Art.`,
    )
  }

  if (failures.length) {
    throw new Error(`Facet Builder coverage failed:\n- ${failures.join('\n- ')}`)
  }

  const coveredFields = Array.from(
    new Set(illustrated.map((choice) => choice.fieldKey)),
  ).sort()
  const uniqueDebt = Array.from(new Set(knownArtworkDebt)).sort()
  process.stdout.write(
    `Facet Builder coverage verified: ${illustrated.length} illustrated choices across ` +
      `${coveredFields.length} fields (${coveredFields.join(', ')}), including ` +
      `${genderChoices.length} Gender choices and Art Builder coverage.\n`,
  )
  if (uniqueDebt.length) {
    process.stdout.write(
      `Known Gender artwork debt (${uniqueDebt.length} files; broken paths are not persisted):\n` +
        uniqueDebt.map((path) => `- public${path}`).join('\n') +
        '\n',
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
