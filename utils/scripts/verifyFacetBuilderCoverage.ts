// /utils/scripts/verifyFacetBuilderCoverage.ts
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ADVENTURE_CARDS } from '../../stores/helpers/adventureCards'

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
])

type IllustratedChoice = {
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

async function main(): Promise<void> {
  const failures: string[] = []
  const illustrated: IllustratedChoice[] = []

  for (const card of ADVENTURE_CARDS) {
    for (const step of card.steps) {
      const fieldKey = (
        clean(step.field) ||
        clean(step.key) ||
        clean(card.key)
      ).toLowerCase()

      for (const choice of step.choices ?? []) {
        if (choice.opensCustom || choice.opensList) continue
        const value = clean(choice.value)
        const label = clean(choice.label) || value
        const imagePath = clean(choice.image)
        if (!value || !imagePath) continue

        illustrated.push({
          cardKey: card.key,
          stepKey: step.key,
          fieldKey,
          value,
          label,
          imagePath,
        })

        if (!FACET_BACKED_FIELDS.has(fieldKey)) {
          failures.push(
            `${card.key}/${step.key}/${label} has dedicated Builder artwork but field ${fieldKey} is not Facet-backed.`,
          )
        }

        if (!imagePath.startsWith('/images/')) {
          failures.push(
            `${card.key}/${step.key}/${label} uses non-public Builder artwork: ${imagePath}`,
          )
          continue
        }

        try {
          await access(resolve(root, 'public', imagePath.slice(1)))
        } catch {
          failures.push(`${label} references missing Builder artwork: public${imagePath}`)
        }
      }
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

  const files = {
    serverCatalog: 'server/utils/facetCatalog.ts',
    catalogStore: 'stores/facetCatalogStore.ts',
    characterSync: 'server/utils/characterFacetSync.ts',
    randomStore: 'stores/randomStore.ts',
    seedWrapper: 'utils/scripts/runFacetCatalogSeed.ts',
    genderSeed: 'utils/scripts/seedGenderFacetCatalog.ts',
    genderValues: 'utils/seeds/facetGenderValues.ts',
    seedPolicy: 'scripts/lib/facetCatalogSeedPolicy.mjs',
  } as const

  const entries = await Promise.all(
    Object.entries(files).map(
      async ([key, path]) => [key, await readFile(resolve(root, path), 'utf8')] as const,
    ),
  )
  const text = Object.fromEntries(entries) as Record<keyof typeof files, string>

  requireText(files.serverCatalog, text.serverCatalog, "'GENDER'")
  requireText(files.catalogStore, text.catalogStore, "gender: ['GENDER']")
  requireText(files.characterSync, text.characterSync, "gender: ['GENDER']")
  requireText(files.randomStore, text.randomStore, "gender: ['GENDER']")
  requireText(files.seedWrapper, text.seedWrapper, "import('./seedGenderFacetCatalog')")
  requireText(files.genderSeed, text.genderSeed, "taxonomy: 'GENDER'")
  requireText(files.genderSeed, text.genderSeed, 'backfillCharacterGender')
  requireText(files.genderSeed, text.genderSeed, "fieldKey: 'gender'")
  requireText(files.genderValues, text.genderValues, 'legacyFacetGenderValues')
  requireText(files.seedPolicy, text.seedPolicy, 'utils/seeds/facetGenderValues.ts')
  requireText(files.seedPolicy, text.seedPolicy, 'utils/scripts/seedGenderFacetCatalog.ts')

  if (illustrated.length < 50) {
    failures.push(
      `Only ${illustrated.length} illustrated reusable Adventure choices were found; expected at least 50.`,
    )
  }

  if (failures.length) {
    throw new Error(`Facet Builder coverage failed:\n- ${failures.join('\n- ')}`)
  }

  const coveredFields = Array.from(
    new Set(illustrated.map((choice) => choice.fieldKey)),
  ).sort()
  process.stdout.write(
    `Facet Builder coverage verified: ${illustrated.length} illustrated choices across ` +
      `${coveredFields.length} fields (${coveredFields.join(', ')}), including ` +
      `${genderChoices.length} Gender choices.\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
