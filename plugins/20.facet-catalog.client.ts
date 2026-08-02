// /plugins/20.facet-catalog.client.ts
import { defineNuxtPlugin } from '#app'
import type {
  BuilderCard,
  BuilderChoice,
  BuilderStep,
} from '@/stores/helpers/builderCards'
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

function hydrateBotBuilder(
  cards: BuilderCard[],
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  for (const card of cards) {
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
  cards: BuilderCard[],
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  const inlineLimit = 12

  for (const card of cards) {
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
 * This catalog is Builder-only and mutates shared card definitions. Starting
 * the fetch from plugin setup made every route download up to 1,000 Facets
 * while Vue was hydrating, which could both hit the request timeout and change
 * Builder data underneath hydration. Wait until the app is mounted, then load
 * only when /builder is active.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const catalog = useFacetCatalogStore()
  const router = useRouter()
  let hydrationPromise: Promise<void> | null = null

  const hydrateCatalog = async (): Promise<void> => {
    await catalog.fetchCatalog({ includeMature: true, take: 1000 }, true)
    if (!catalog.entries.length) return

    /*
     * Imported here rather than at module scope. Nuxt bundles every plugin
     * into the eager entry chunk, so static imports of these decks put the
     * whole builder card graph (~14 card modules plus the seed tables they
     * pull in) into the payload that must execute before the app can mount.
     */
    const [
      { ADVENTURE_CARDS },
      { ART_CARDS },
      { BOT_CARDS },
      { DREAM_CARDS },
      { REWARD_CARDS },
      { SCENARIO_CARDS },
      { ensureBuildersRegistered },
    ] = await Promise.all([
      import('@/stores/helpers/adventureCards'),
      import('@/stores/helpers/artCards'),
      import('@/stores/helpers/botCards'),
      import('@/stores/helpers/dreamCards'),
      import('@/stores/helpers/rewardCards'),
      import('@/stores/helpers/scenarioCards'),
      import('@/stores/registerBuilderStore'),
    ])

    hydrateBuilderCards(ADVENTURE_CARDS, catalog)
    hydrateBuilderCards(SCENARIO_CARDS, catalog)
    hydrateBotBuilder(BOT_CARDS, catalog)
    hydrateArtBuilder(ART_CARDS, catalog)
    hydrateSystemBuilder(DREAM_CARDS, catalog)
    hydrateSystemBuilder(REWARD_CARDS, catalog)

    // Registration stores the same mutable card graphs. Re-register after the
    // async catalog fetch so mounted Builders observe canonical choices immediately.
    // Generator methods read this same catalog directly and need no runtime patching.
    ensureBuildersRegistered(true)
  }

  const hydrateForRoute = (path: string): void => {
    if (path !== '/builder' || catalog.entries.length || hydrationPromise) return

    hydrationPromise = hydrateCatalog()
      .catch((error) => {
        console.error('[facet-catalog] Canonical Facet hydration failed.', error)
      })
      .finally(() => {
        hydrationPromise = null
      })
  }

  nuxtApp.hook('app:mounted', () => {
    hydrateForRoute(router.currentRoute.value.path)
    router.afterEach((to) => {
      hydrateForRoute(to.path)
    })
  })
})
