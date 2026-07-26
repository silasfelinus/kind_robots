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

// Gender was omitted from the original catalog cutover. Seed its illustrated
// Builder choices and legacy generator values before the broader catalog pass.
await import('./seedGenderFacetCatalog')

// seedFacetCatalog reads process.argv itself, so --apply passes through.
await import('./seedFacetCatalog')
