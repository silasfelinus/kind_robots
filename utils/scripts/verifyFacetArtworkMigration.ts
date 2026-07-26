// /utils/scripts/verifyFacetArtworkMigration.ts
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ADVENTURE_CARDS } from '../../stores/helpers/adventureCards'
import { normalizeFacetLookupKey } from '../facetAliases'

const root = process.cwd()

const VISUAL_FACET_FIELDS = new Set([
  'species',
  'gender',
  'class',
  'alignment',
  'personality',
  'backstory',
  'quirks',
  'quirk',
  'genre',
  'genres',
  'role',
])

type CuratedArtwork = {
  title: string
  value: string
  fieldKey: string
  cardKey: string
  stepKey: string
  imagePath: string
}

function requireText(path: string, text: string, fragment: string): void {
  if (!text.includes(fragment)) {
    throw new Error(`${path} is missing artwork migration contract text: ${fragment}`)
  }
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function main(): Promise<void> {
  const curated: CuratedArtwork[] = []
  const artworkByFacetKey = new Map<string, CuratedArtwork>()
  const failures: string[] = []
  let directVisualFacetChoices = 0

  for (const card of ADVENTURE_CARDS) {
    for (const step of card.steps) {
      const fieldKey = clean(step.field) || clean(step.key) || clean(card.key)
      const visualFacetField = VISUAL_FACET_FIELDS.has(fieldKey.toLowerCase())

      for (const choice of step.choices ?? []) {
        // Expanded string lists and custom-entry controls are intentionally text-only.
        // Direct choices are the curated gallery and must retain their artwork.
        if (choice.opensCustom || choice.opensList) continue

        const value = clean(choice.value)
        const title = clean(choice.label) || value
        const imagePath = clean(choice.image)

        if (!value || !title) {
          if (imagePath) {
            failures.push(
              `${card.key}/${step.key} has curated artwork without a canonical title/value: ${imagePath}`,
            )
          }
          continue
        }

        if (visualFacetField) {
          directVisualFacetChoices++
          if (!imagePath) {
            failures.push(
              `${card.key}/${step.key}/${title} is a direct visual Facet choice without curated artwork.`,
            )
            continue
          }
        }

        if (!imagePath) continue

        if (!imagePath.startsWith('/images/')) {
          failures.push(
            `${card.key}/${step.key}/${title} uses a non-public curated image path: ${imagePath}`,
          )
          continue
        }

        const artwork: CuratedArtwork = {
          title,
          value,
          fieldKey,
          cardKey: card.key,
          stepKey: step.key,
          imagePath,
        }
        curated.push(artwork)

        try {
          await access(resolve(root, 'public', imagePath.slice(1)))
        } catch {
          failures.push(`${title} references missing artwork: public${imagePath}`)
        }

        // seedFacetCatalog currently canonicalizes by normalized title. Conflicting
        // curated images for the same title would therefore be nondeterministic and
        // must be resolved explicitly rather than silently choosing the first one.
        const facetKey = normalizeFacetLookupKey(title)
        const existing = artworkByFacetKey.get(facetKey)
        if (existing && existing.imagePath !== imagePath) {
          failures.push(
            `Conflicting curated artwork for canonical title "${title}": ` +
              `${existing.imagePath} (${existing.cardKey}/${existing.stepKey}) vs ` +
              `${imagePath} (${card.key}/${step.key})`,
          )
        } else if (!existing) {
          artworkByFacetKey.set(facetKey, artwork)
        }
      }
    }
  }

  if (directVisualFacetChoices < 50) {
    failures.push(
      `Only ${directVisualFacetChoices} direct visual Facet choices were found; expected at least 50.`,
    )
  }
  if (curated.length < directVisualFacetChoices) {
    failures.push(
      `${directVisualFacetChoices - curated.length} direct visual Facet choices are missing curated artwork.`,
    )
  }

  const [
    seed,
    catalogApi,
    catalogStore,
    facetSummaries,
    facetStore,
    facetManager,
  ] = await Promise.all([
    readFile(resolve(root, 'utils/scripts/seedFacetCatalog.ts'), 'utf8'),
    readFile(resolve(root, 'server/utils/facetCatalog.ts'), 'utf8'),
    readFile(resolve(root, 'stores/facetCatalogStore.ts'), 'utf8'),
    readFile(resolve(root, 'server/utils/facetAssignments.ts'), 'utf8'),
    readFile(resolve(root, 'stores/facetStore.ts'), 'utf8'),
    readFile(resolve(root, 'components/facets/facet-manager.vue'), 'utf8'),
  ])

  // Source -> candidate.
  requireText(
    'utils/scripts/seedFacetCatalog.ts',
    seed,
    'imagePath: clean(choice.image) || undefined',
  )
  requireText(
    'utils/scripts/seedFacetCatalog.ts',
    seed,
    'imagePath: item.imagePath',
  )

  // Candidate -> Facet create/update. Existing curated art must survive lower-rank
  // enrichment sources and idempotent reruns.
  requireText(
    'utils/scripts/seedFacetCatalog.ts',
    seed,
    'imagePath: candidate.imagePath',
  )
  requireText(
    'utils/scripts/seedFacetCatalog.ts',
    seed,
    'imagePath: candidate.imagePath || existingFacet.imagePath',
  )
  requireText(
    'utils/scripts/seedFacetCatalog.ts',
    seed,
    'imagePath: candidate.imagePath || winner.imagePath',
  )

  // Facet -> canonical API -> Builder card. The richer card/hero fallbacks remain
  // available for manually authored Facets, while Adventure choice art continues
  // to work through imagePath.
  for (const field of ['imagePath: true', 'cardPath: true', 'heroPath: true']) {
    requireText('server/utils/facetCatalog.ts', catalogApi, field)
  }
  requireText(
    'stores/facetCatalogStore.ts',
    catalogStore,
    'image: entry.cardPath || entry.imagePath || entry.heroPath || undefined',
  )

  // General Facet CRUD and assignment summaries must not downgrade richer artwork.
  // These surfaces feed the Facet Library and owner assignment stores, so omitting
  // card/hero paths here would make curated media disappear after a normal refresh.
  for (const field of [
    "| 'artPrompt'",
    "| 'imagePath'",
    "| 'cardPath'",
    "| 'heroPath'",
    "| 'artImageId'",
    "| 'artCollectionId'",
  ]) {
    requireText('server/utils/facetAssignments.ts', facetSummaries, field)
    requireText('stores/facetStore.ts', facetStore, field)
  }
  for (const field of [
    'artPrompt: true',
    'imagePath: true',
    'cardPath: true',
    'heroPath: true',
    'artImageId: true',
    'artCollectionId: true',
  ]) {
    requireText('server/utils/facetAssignments.ts', facetSummaries, field)
  }

  // Curators must be able to inspect and repair all three path roles. The manager
  // uses the same precedence as Builder cards so its preview matches runtime use.
  for (const field of [
    'v-model="newImagePath"',
    'v-model="newCardPath"',
    'v-model="newHeroPath"',
    'v-model="newArtPrompt"',
    'v-model="editForm.imagePath"',
    'v-model="editForm.cardPath"',
    'v-model="editForm.heroPath"',
    'v-model="editForm.artPrompt"',
    'imagePath: editForm.imagePath.trim() || null',
    'cardPath: editForm.cardPath.trim() || null',
    'heroPath: editForm.heroPath.trim() || null',
    'artPrompt: editForm.artPrompt.trim() || null',
    'return facet.cardPath || facet.imagePath || facet.heroPath || null',
  ]) {
    requireText('components/facets/facet-manager.vue', facetManager, field)
  }

  if (failures.length) {
    throw new Error(`Facet artwork migration contract failed:\n- ${failures.join('\n- ')}`)
  }

  const uniquePaths = new Set(curated.map((entry) => entry.imagePath))
  process.stdout.write(
    `Facet artwork migration verified: ${directVisualFacetChoices} direct visual ` +
      `Facet choices, ${artworkByFacetKey.size} canonical titles, ` +
      `${uniquePaths.size} image files.\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
