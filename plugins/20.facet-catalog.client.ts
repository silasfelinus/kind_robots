// /plugins/20.facet-catalog.client.ts
import { defineNuxtPlugin } from '#app'
import { ADVENTURE_CARDS } from '@/stores/helpers/adventureCards'
import { BOT_CARDS } from '@/stores/helpers/botCards'
import type {
  BuilderCard,
  BuilderChoice,
  BuilderStep,
} from '@/stores/helpers/builderCards'
import { SCENARIO_CARDS } from '@/stores/helpers/scenarioCards'
import { ensureBuildersRegistered } from '@/stores/registerBuilderStore'
import {
  BOT_FIELD_TAXONOMIES,
  CHARACTER_FIELD_TAXONOMIES,
  useFacetCatalogStore,
} from '@/stores/facetCatalogStore'

function facetFieldKey(cardKey: string, step: BuilderStep): string | null {
  const key = step.field || step.key || cardKey
  if (key === 'genres') return 'genre'
  return CHARACTER_FIELD_TAXONOMIES[key] ? key : null
}

function hydrateBuilderCards(
  cards: BuilderCard[],
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  for (const card of cards) {
    for (const step of card.steps) {
      const fieldKey = facetFieldKey(card.key, step)
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

function hydrateAdventureBuilder(
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  hydrateBuilderCards(ADVENTURE_CARDS, catalog)
}

function hydrateScenarioBuilder(
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  hydrateBuilderCards(SCENARIO_CARDS, catalog)
}

function hydrateBotBuilder(
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  for (const card of BOT_CARDS) {
    for (const step of card.steps) {
      const fieldKey = step.field || step.key || card.key
      if (!BOT_FIELD_TAXONOMIES[fieldKey]) continue

      const canonical = catalog.builderChoicesForBotField(fieldKey)
      if (!canonical.length) continue
      const controls = (step.choices ?? []).filter(
        (choice) => choice.opensCustom && !choice.opensList,
      )

      if (fieldKey === 'personality') {
        step.choices = [...canonical, ...controls]
        step.listOptions = canonical.map((choice) => choice.value)
      } else {
        const visualChoices = canonical.filter((choice) => Boolean(choice.image))
        const listChoices = canonical.filter((choice) => !choice.image)
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
        step.choices = [...visualChoices, ...moreChoice, ...controls]
        step.listOptions = listChoices.map((choice) => choice.value)
      }

      step.payload = {
        ...(step.payload ?? {}),
        source: 'facet-catalog',
        fieldKey,
        taxonomies: BOT_FIELD_TAXONOMIES[fieldKey],
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
    hydrateScenarioBuilder(catalog)
    hydrateBotBuilder(catalog)

    // Registration stores the same mutable card graphs. Re-register after the
    // async catalog fetch so mounted Builders observe canonical choices immediately.
    // Generator methods read this same catalog directly and need no runtime patching.
    ensureBuildersRegistered(true)
  } catch (error) {
    console.error('[facet-catalog] Canonical Facet hydration failed.', error)
  }
})
