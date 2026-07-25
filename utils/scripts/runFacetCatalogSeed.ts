// /utils/scripts/runFacetCatalogSeed.ts
//
// Normalize known source synonyms before the canonical Facet seed imports its
// source arrays. This keeps one concept row per idea while preserving the
// original animal metadata for the canonical record.
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

// seedFacetCatalog reads process.argv itself, so --apply passes through.
await import('./seedFacetCatalog')
