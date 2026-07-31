// /plugins/20.facet-catalog.client.ts
import { defineNuxtPlugin } from '#app'
import { ADVENTURE_CARDS } from '@/stores/helpers/adventureCards'
import { ART_CARDS } from '@/stores/helpers/artCards'
import { BOT_CARDS } from '@/stores/helpers/botCards'
import type {
  BuilderCard,
  BuilderChoice,
  BuilderStep,
} from '@/stores/helpers/builderCards'
import { DREAM_CARDS } from '@/stores/helpers/dreamCards'
import { REWARD_CARDS } from '@/stores/helpers/rewardCards'
import { SCENARIO_CARDS } from '@/stores/helpers/scenarioCards'
import { ensureBuildersRegistered } from '@/stores/registerBuilderStore'
import {
  ART_FIELD_FACETS,
  BOT_FIELD_TAXONOMIES,
  CHARACTER_FIELD_TAXONOMIES,
  SYSTEM_FIELD_TAXONOMIES,
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
        const visualChoices = canonical.filter((choice) =>
          Boolean(choice.image),
        )
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

function hydrateArtBuilder(
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  const inlineLimit = 12

  for (const card of ART_CARDS) {
    for (const step of card.steps) {
      const fieldKey = step.field || step.key || card.key
      const definition = ART_FIELD_FACETS[fieldKey]
      if (!definition) continue

      const canonical = catalog.builderChoicesForArtField(fieldKey)
      if (!canonical.length) continue

      const inlineChoices = canonical.slice(0, inlineLimit)
      const listChoices = canonical.slice(inlineLimit)
      const existingControls = (step.choices ?? []).filter(
        (choice) => choice.opensCustom && !choice.opensList,
      )
      const controls = existingControls.length
        ? existingControls
        : [
            {
              value: '',
              label: 'Write my own',
              subtext: 'Use a custom value instead of the shared catalog.',
              opensCustom: true,
            } satisfies BuilderChoice,
          ]
      const moreChoice: BuilderChoice[] = listChoices.length
        ? [
            {
              value: '',
              label: 'More options...',
              subtext: `${listChoices.length} more in the Facet catalog.`,
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

      // figureSpecies was formerly a free-text-only field. The catalog becomes
      // the primary picker while the custom control preserves the escape hatch.
      if (fieldKey === 'figureSpecies') step.inputType = 'preset'

      step.choices = [...inlineChoices, ...moreChoice, ...controls]
      step.listOptions = listChoices.map((choice) => choice.value)
      step.payload = {
        ...(step.payload ?? {}),
        source: 'facet-catalog',
        fieldKey,
        taxonomies: definition.taxonomies,
        operationalExemptions: ['mode', 'figureCount', 'negativeFilters'],
      }
    }
  }
}

function hydrateSystemBuilder(
  cards: BuilderCard[],
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  for (const card of cards) {
    for (const step of card.steps) {
      const fieldKey = step.field || step.key || card.key
      const taxonomies = SYSTEM_FIELD_TAXONOMIES[fieldKey]
      if (!taxonomies) continue

      const canonical = catalog.builderChoicesForSystemField(fieldKey)
      if (!canonical.length) continue

      // These decks mirror Prisma enums. They never expose custom values or
      // compact fallback lists; the Facet metadata returns the exact enum value.
      step.choices = canonical
      step.listOptions = []
      step.payload = {
        ...(step.payload ?? {}),
        source: 'facet-catalog',
        fieldKey,
        taxonomies,
        structuralEnum: true,
      }
    }
  }
}

/*
 * MUST NOT be an async plugin. Nuxt awaits the promise a plugin returns before
 * it mounts the Vue app, so awaiting this catalog fetch here held the entire
 * application hostage to one network round trip — up to its own 10s timeout,
 * and indefinitely if the request never settled. Nothing rendered in that
 * window: no loading overlay, no startup controls, no site.
 *
 * The Builders this hydrates are re-registered when the fetch resolves, so
 * running it in the background is correct; callers already tolerate an
 * unpopulated catalog (the `!catalog.entries.length` bail below predates this).
 */
export default defineNuxtPlugin(() => {
  const catalog = useFacetCatalogStore()

  void (async () => {
    try {
      await catalog.fetchCatalog({ includeMature: true, take: 1000 }, true)
      if (!catalog.entries.length) return

      hydrateAdventureBuilder(catalog)
      hydrateScenarioBuilder(catalog)
      hydrateBotBuilder(catalog)
      hydrateArtBuilder(catalog)
      hydrateSystemBuilder(DREAM_CARDS, catalog)
      hydrateSystemBuilder(REWARD_CARDS, catalog)

      // Registration stores the same mutable card graphs. Re-register after the
      // async catalog fetch so mounted Builders observe canonical choices immediately.
      // Generator methods read this same catalog directly and need no runtime patching.
      ensureBuildersRegistered(true)
    } catch (error) {
      console.error('[facet-catalog] Canonical Facet hydration failed.', error)
    }
  })()
})
