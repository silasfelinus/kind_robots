// /utils/scripts/runFacetCatalogSeed.ts
//
// Normalize source data before the canonical Facet seed imports its arrays.
// This keeps one concept row per idea and makes compact Builder controls expose
// their complete underlying option lists to the catalog importer.
import { ADVENTURE_CARDS } from './../../stores/helpers/adventureCards'
import { animalDataList } from './../../stores/utils/animalData'
import { normalizeFacetLookupKey } from './../facetAliases'

const waterBear = animalDataList.find(
  (animal) => normalizeFacetLookupKey(animal.name) === 'waterbear',
)

if (waterBear) {
  ;(waterBear as { name: string }).name = 'Tardigrade'
  console.log(
    '[facet-catalog] Normalized source synonym Water Bear -> Tardigrade.',
  )
} else {
  console.warn(
    '[facet-catalog] Water Bear source entry was not found; continuing without source normalization.',
  )
}

let promotedBuilderOptions = 0
for (const card of ADVENTURE_CARDS) {
  for (const step of card.steps) {
    const completeList = new Set(step.listOptions ?? [])

    for (const choice of step.choices ?? []) {
      if (!choice.opensList) continue
      for (const option of choice.listOptions ?? []) {
        const value = option.trim()
        if (!value || completeList.has(value)) continue
        completeList.add(value)
        promotedBuilderOptions++
      }
    }

    if (completeList.size !== (step.listOptions?.length ?? 0)) {
      step.listOptions = Array.from(completeList)
    }
  }
}

console.log(
  `[facet-catalog] Promoted ${promotedBuilderOptions} Builder “More options” entries into canonical seed input.`,
)

await import('./seedGenderFacetCatalog')
await import('./seedFacetCatalog')
await import('./seedArtBuilderFacetCatalog')
await import('./seedScenarioGenreFacetCatalog')

// Legacy Bot values must exist before the Bot Builder seed backfills production
// rows; illustrated Bot Types and reusable Bot personalities then enrich them.
await import('./seedLegacyBotTypeFacets')
await import('./seedBotFacetCatalog')
await import('./normalizeBotPersonalityFacetValues')

// Enum-backed Builder decks are presentation Facets only. Prisma enums remain
// authoritative for persisted Dream and Reward values.
await import('./seedSystemOptionFacets')
