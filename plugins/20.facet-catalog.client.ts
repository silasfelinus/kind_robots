// /plugins/20.facet-catalog.client.ts
import { defineNuxtPlugin } from '#app'
import { ADVENTURE_CARDS } from '@/stores/helpers/adventureCards'
import type { BuilderChoice } from '@/stores/helpers/builderCards'
import { ensureBuildersRegistered } from '@/stores/registerBuilderStore'
import { useCharacterStore } from '@/stores/characterStore'
import {
  CHARACTER_FIELD_TAXONOMIES,
  useFacetCatalogStore,
} from '@/stores/facetCatalogStore'
import { useGeneratorStore } from '@/stores/generatorStore'

type MutableGeneratorStore = ReturnType<typeof useGeneratorStore> & {
  __facetCatalogPatched?: boolean
}

type MutableCharacterStore = ReturnType<typeof useCharacterStore> & {
  __facetCatalogPatched?: boolean
}

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

function patchGenerator(catalog: ReturnType<typeof useFacetCatalogStore>): void {
  const generator = useGeneratorStore() as MutableGeneratorStore
  if (generator.__facetCatalogPatched) return

  const original = {
    genre: generator.genre.bind(generator),
    species: generator.species.bind(generator),
    characterClass: generator.characterClass.bind(generator),
    alignment: generator.alignment.bind(generator),
    personality: generator.personality.bind(generator),
    quirks: generator.quirks.bind(generator),
    background: generator.background.bind(generator),
    backstory: generator.backstory.bind(generator),
    suggest: generator.suggest.bind(generator),
    generateOne: generator.generateOne.bind(generator),
  }

  const one = (fieldKey: string, fallback: () => string): string =>
    catalog.randomFacetForField(fieldKey)?.canonicalValue || fallback()

  const many = (
    fieldKey: string,
    count: number,
    fallback: () => string,
  ): string => {
    const pool = catalog
      .facetsForCharacterField(fieldKey)
      .filter((entry) => entry.isRandomizable && entry.randomWeight > 0)
    if (!pool.length) return fallback()

    const picked = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(1, count))
      .map((entry) => entry.canonicalValue || entry.title)
    return picked.join(', ')
  }

  generator.genre = () => one('genre', original.genre)
  generator.species = () => one('species', original.species)
  generator.characterClass = () => one('class', original.characterClass)
  generator.alignment = () => one('alignment', original.alignment)
  generator.personality = (count = 3) =>
    many('personality', count, () => original.personality(count))
  generator.quirks = (count = 1) =>
    many('quirks', count, () => original.quirks(count))
  generator.background = () => one('backstory', original.background)
  generator.backstory = () => one('backstory', original.backstory)

  generator.suggest = (key, context = {}) => {
    if (key === 'genre') return generator.genre()
    if (key === 'species') return generator.species()
    if (key === 'characterClass' || key === 'class') {
      return generator.characterClass()
    }
    if (key === 'alignment') return generator.alignment()
    if (key === 'personality') return generator.personality()
    if (key === 'quirks') return generator.quirks()
    if (key === 'background' || key === 'backstory') {
      return generator.backstory()
    }
    return original.suggest(key, context)
  }

  generator.generateOne = (key, fallbackOrContext = {}) => {
    const fallback = typeof fallbackOrContext === 'string' ? fallbackOrContext : ''
    const context =
      fallbackOrContext && typeof fallbackOrContext === 'object'
        ? fallbackOrContext
        : {}
    const generated = generator.suggest(key, context).trim()
    return generated || fallback || original.generateOne(key, fallbackOrContext)
  }

  generator.__facetCatalogPatched = true
}

function patchCharacterSave(
  catalog: ReturnType<typeof useFacetCatalogStore>,
): void {
  const characterStore = useCharacterStore() as MutableCharacterStore
  if (characterStore.__facetCatalogPatched) return

  const originalSave = characterStore.saveCharacter.bind(characterStore)
  characterStore.saveCharacter = async () => {
    const result = await originalSave()
    const character = result.data

    if (result.success && character?.id) {
      await catalog.syncCharacterFacets(
        character.id,
        character as unknown as Record<string, unknown>,
      )
    }

    return result
  }
  characterStore.__facetCatalogPatched = true
}

export default defineNuxtPlugin(async () => {
  const catalog = useFacetCatalogStore()

  try {
    await catalog.fetchCatalog({ includeMature: true, take: 1000 }, true)
    if (!catalog.entries.length) return

    hydrateAdventureBuilder(catalog)
    patchGenerator(catalog)
    patchCharacterSave(catalog)

    // Registration stores the same mutable card graph. Re-register after the
    // async catalog fetch so an already-mounted Character Builder observes the
    // canonical choices immediately.
    ensureBuildersRegistered(true)
  } catch (error) {
    console.error('[facet-catalog] Canonical Facet hydration failed.', error)
  }
})
