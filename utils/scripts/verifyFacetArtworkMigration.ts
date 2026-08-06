// /utils/scripts/verifyFacetArtworkMigration.ts
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ADVENTURE_CARDS } from '../../stores/helpers/adventureCards'
import { GENDER_ARTWORK_PATHS } from '../seeds/facetGenderArtwork'
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
    throw new Error(
      `${path} is missing artwork migration contract text: ${fragment}`,
    )
  }
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/*
 * public/images/** is gitignored (.gitignore:33) -- the curated artwork lives on
 * the deployed host, not in the repo. So an existence check against
 * public/images can never pass in CI or in a fresh clone, and this contract had
 * ~280 "references missing artwork" failures on main for exactly that reason.
 *
 * Nobody saw them because the CI step pipes through `tee`, so the step's exit
 * status is tee's and the check could never fail. Two bugs holding each other
 * up: an unpassable assertion and a pipeline that could not report it.
 *
 * The check is still worth running where the assets ARE synced (a dev machine
 * mid-curation, which is when a broken path is cheapest to fix), so it becomes
 * conditional -- and says out loud when it skipped. A check that quietly does
 * nothing is the thing this file exists to prevent.
 */
async function artworkAssetsPresent(): Promise<boolean> {
  try {
    await access(resolve(root, 'public/images/adventure'))
    return true
  } catch {
    return false
  }
}

async function main(): Promise<void> {
  const assetsPresent = await artworkAssetsPresent()
  const curated: CuratedArtwork[] = []
  const artworkByFacetKey = new Map<string, CuratedArtwork>()
  const failures: string[] = []
  const knownArtworkDebt: string[] = []
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

        if (assetsPresent) {
          try {
            await access(resolve(root, 'public', imagePath.slice(1)))
          } catch {
            if (
              fieldKey.toLowerCase() === 'gender' &&
              GENDER_ARTWORK_PATHS.has(imagePath)
            ) {
              knownArtworkDebt.push(imagePath)
            } else {
              failures.push(
                `${title} references missing artwork: public${imagePath}`,
              )
            }
          }
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
      `${directVisualFacetChoices - curated.length} direct visual Facet choices are missing curated artwork declarations.`,
    )
  }

  const [
    seed,
    catalogApi,
    catalogStore,
    facetSummaries,
    facetStore,
    facetEditor,
    facetManager,
    facetGallery,
    facetProfileForm,
  ] = await Promise.all([
    readFile(resolve(root, 'utils/scripts/seedFacetCatalog.ts'), 'utf8'),
    readFile(resolve(root, 'server/utils/facetCatalog.ts'), 'utf8'),
    readFile(resolve(root, 'stores/facetCatalogStore.ts'), 'utf8'),
    readFile(resolve(root, 'server/utils/facetAssignments.ts'), 'utf8'),
    readFile(resolve(root, 'stores/facetStore.ts'), 'utf8'),
    readFile(resolve(root, 'components/facets/facet-editor.vue'), 'utf8'),
    readFile(resolve(root, 'components/facets/facet-manager.vue'), 'utf8'),
    readFile(resolve(root, 'components/facets/facet-gallery.vue'), 'utf8'),
    readFile(resolve(root, 'utils/facetProfileForm.ts'), 'utf8'),
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

  /*
   * Curators must be able to inspect and repair every path role, and the manager
   * must preview with the same precedence Builder cards use.
   *
   * REWRITTEN 2026-08-03. This block used to assert a dozen literal
   * `v-model="newImagePath"` / `v-model="editForm.cardPath"` strings against
   * facet-manager.vue. Those inputs are gone: the create and edit forms are now
   * <FacetProfileEditor v-model="..."> and the art slots are an
   * <EntityArtManager :slots="[...]"> that covers imagePath, iconPath, cardPath
   * AND heroPath -- strictly more than the old form. The contract had been
   * failing on main against a manager that was better, not worse.
   *
   * It went unnoticed because its CI step piped through `tee`, so the step's exit
   * status was tee's and the check could never fail (see the same workflow file).
   * Both halves are fixed together: a contract nobody can see fail is not a
   * contract. Assert the STRUCTURE (which editor, which art roles) rather than
   * one particular spelling of the inputs, so the next legitimate refactor of the
   * form does not fail this again.
   */
  /*
   * SPLIT ACROSS THREE FILES since facet-manager's Library grid was retired.
   * Creating a Facet stayed in the manager; editing one (and therefore the art
   * slots) moved to facet-editor.vue, reached through facet-interact's detail
   * slot; and drawing a Facet's artwork belongs to the gallery, which is now
   * the only surface that browses them.
   */
  requireText(
    'components/facets/facet-manager.vue',
    facetManager,
    '<FacetProfileEditor v-model="createForm" />',
  )

  for (const field of [
    '<FacetProfileEditor v-model="editForm" />',
    'entity-type="facet"',
    "field: 'imagePath'",
    "field: 'iconPath'",
    "field: 'cardPath'",
    "field: 'heroPath'",
  ]) {
    requireText('components/facets/facet-editor.vue', facetEditor, field)
  }

  // Was the literal chain `facet.cardPath || facet.imagePath || facet.heroPath`.
  // That chain lived in six files and now lives in one (resolveEntityArtwork,
  // utils/artImageSrc.ts), so this asserts the call rather than the copy.
  requireText(
    'components/facets/facet-gallery.vue',
    facetGallery,
    'resolveEntityArtwork(facet)',
  )

  /*
   * The form <-> Facet mapping moved out of the manager and into
   * utils/facetProfileForm.ts when FacetProfileEditor was extracted, so the
   * "editing a Facet must not drop its artwork" half of this contract lives
   * there now. Both directions matter: the form has to LOAD each path off the
   * Facet, and the payload has to SEND each one back.
   */
  for (const field of [
    'imagePath: facet.imagePath',
    'cardPath: facet.cardPath',
    'heroPath: facet.heroPath',
    'artPrompt: facet.artPrompt',
    'imagePath: optional(form.imagePath)',
    'cardPath: optional(form.cardPath)',
    'heroPath: optional(form.heroPath)',
    'artPrompt: optional(form.artPrompt)',
  ]) {
    requireText('utils/facetProfileForm.ts', facetProfileForm, field)
  }

  if (failures.length) {
    throw new Error(
      `Facet artwork migration contract failed:\n- ${failures.join('\n- ')}`,
    )
  }

  const uniquePaths = new Set(curated.map((entry) => entry.imagePath))
  process.stdout.write(
    `Facet artwork migration verified: ${directVisualFacetChoices} direct visual ` +
      `Facet choices, ${artworkByFacetKey.size} canonical titles, ` +
      `${uniquePaths.size} declared image paths.\n`,
  )
  if (!assetsPresent) {
    process.stdout.write(
      'NOTE: public/images/adventure is absent (it is gitignored), so the ' +
        `on-disk existence of those ${uniquePaths.size} paths was NOT checked. ` +
        'Declarations, precedence and title conflicts were.\n',
    )
  }
  const uniqueDebt = Array.from(new Set(knownArtworkDebt)).sort()
  if (uniqueDebt.length) {
    process.stdout.write(
      `Known Gender artwork debt (${uniqueDebt.length}; tracked separately and not persisted as broken Facet paths):\n` +
        uniqueDebt.map((path) => `- public${path}`).join('\n') +
        '\n',
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
