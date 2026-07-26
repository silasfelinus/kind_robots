// /plugins/20.facet-catalog.client.ts
import { defineNuxtPlugin } from '#app'
import { ADVENTURE_CARDS } from '@/stores/helpers/adventureCards'
import type { BuilderChoice } from '@/stores/helpers/builderCards'
import { ensureBuildersRegistered } from '@/stores/registerBuilderStore'
import {
  CHARACTER_FIELD_TAXONOMIES,
  useFacetCatalogStore,
} from '@/stores/facetCatalogStore'

function fieldKeyForStep(cardKey: string, step: { field?: string; key: string }) {
  const key = step.field || step.key || cardKey
  return CHARACTER_FIELD_TAXONOMIES[key] ? key : null
}

function hydrateAdventureBuilder(
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  for (const card of ADVENTURE_CARDS) {
    for (const step of card.steps) {
      const fieldKey = fieldKeyForStep(card.key, step)
      if (!fieldKey) continue

      const canonical = catalog.builderChoicesForField(fieldKey)
      if (!canonical.length) continue

      const visualChoices = canonical.filter((choice) => Boolean(choice.image))
      const listChoices = canonical.filter((choice) => !choice.image)
      const controls = (step.choices ?? []).filter(
        (choice) => choice.opensCustom && !choice.opensList,
      )
      const moreChoice: BuilderChoice[] = listChoices.length
        ? [
            {
              value: '',
              label: 'More options',
              opensList: true,
              listOptions: listChoices.map((choice) => choice.value),
              payload: {
                source: 'facet-catalog',
                fieldKey,
                count: listChoices.length,
              },
            },
          ]
        : []

      // Rich Facets with art remain the primary gallery. Canonical entries that
      // do not have artwork stay in the compact “More options” division. Custom
      // entry remains available for one-off prose that should not become a Facet.
      step.choices = [...visualChoices, ...moreChoice, ...controls]
      step.listOptions = listChoices.map((choice) => choice.value)
      step.payload = {
        ...(step.payload ?? {}),
        source: 'facet-catalog',
        fieldKey,
        taxonomies: CHARACTER_FIELD_TAXONOMIES[fieldKey],
      }
    }
  }
}

export default defineNuxtPlugin(async () => {
  const catalog = useFacetCatalogStore()

  try {
    await catalog.fetchCatalog({ includeMature: true, take: 1000 }, true)
    if (!catalog.entries.length) return

    hydrateAdventureBuilder(catalog)

    // Registration stores the same mutable card graph. Re-register after the
    // async catalog fetch so an already-mounted Character Builder observes the
    // canonical choices immediately. Generator methods read this same catalog
    // directly and need no runtime reassignment.
    ensureBuildersRegistered(true)
  } catch (error) {
    console.error('[facet-catalog] Canonical Facet hydration failed.', error)
  }
})
