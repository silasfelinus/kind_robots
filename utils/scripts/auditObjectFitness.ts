// /utils/scripts/auditObjectFitness.ts
//
// The fitness pass: which objects SHOULD be connected to each other and are not.
//
// Read-only, over the public API, no database. Writes a JSON artifact and prints
// a summary. Nothing here mutates production -- proposing is a separate step and
// applying is a separate lane again.
//
//   npx tsx utils/scripts/auditObjectFitness.ts
//   npx tsx utils/scripts/auditObjectFitness.ts --json artifacts/fitness-audit.json
//
// Four questions, in the order they matter:
//   1. Which Characters are stranded -- no Dream, no Scenario, no genre the
//      catalog can see?
//   2. Which Scenarios are thin -- no Dream, or too few Characters to feel
//      inhabited?
//   3. Which Dreams have no cast?
//   4. Which Facets are dead weight -- genre rows nothing uses, or near-
//      duplicates that should be one row and an alias?
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  facetUsage,
  lookupKey,
  resolveFreeText,
  type FacetRow,
} from '@/utils/comments/fitnessInventory'
import {
  loadFitnessInventory,
  type LoadedInventory,
} from '@/utils/comments/fitnessLoader'

function arg(name: string, fallback = ''): string {
  const hit = process.argv.find((value) => value.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : fallback
}

const flag = (name: string) => process.argv.includes(`--${name}`)

const baseUrl = arg('base', 'https://kindrobots.org').replace(/\/+$/, '')
const jsonOut = arg('json', 'artifacts/fitness-audit.json')
/** A Scenario with fewer than this many Characters reads as unpopulated. */
const THIN_CAST = Number(arg('thin-cast', '2'))

/**
 * Near-duplicate detection, restricted to what can be argued for in one line.
 *
 * Fuzzy string distance was tried on this catalog during the genre pass and
 * rejected: it proposed Hopepunk -> Hellpunk at 0.75 and Eco-Fantasy -> Epic
 * Fantasy at 0.87, which are opposites and unrelated respectively. Edit distance
 * does not know that "Hell" and "Hope" are the whole word. So this only reports
 * pairs joined by a rule a person can check at a glance:
 *   - identical once punctuation and spacing are dropped
 *   - one title is a whole-word prefix or suffix of the other, same taxonomy
 * Everything else is left for a human to notice.
 */
function duplicateCandidates(inventory: LoadedInventory) {
  const byKey = new Map<string, FacetRow[]>()
  for (const facet of inventory.facets) {
    const key = lookupKey(facet.title)
    if (!key) continue
    const list = byKey.get(key)
    if (list) list.push(facet)
    else byKey.set(key, [facet])
  }

  const exact = [...byKey.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      kind: 'exact' as const,
      facets: group.map((facet) => ({
        id: facet.id,
        title: facet.title,
        taxonomy: facet.taxonomy || null,
      })),
    }))

  const words = (facet: FacetRow) =>
    String(facet.title || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)

  const containment: Array<{
    kind: 'containment'
    outer: { id: number; title: string }
    inner: { id: number; title: string }
    taxonomy: string | null
  }> = []

  const byTaxonomy = new Map<string, FacetRow[]>()
  for (const facet of inventory.facets) {
    const key = String(facet.taxonomy || 'OTHER')
    const list = byTaxonomy.get(key)
    if (list) list.push(facet)
    else byTaxonomy.set(key, [facet])
  }

  for (const [taxonomy, group] of byTaxonomy) {
    for (const outer of group) {
      const outerWords = words(outer)
      if (outerWords.length < 2) continue
      for (const inner of group) {
        if (inner.id === outer.id) continue
        const innerWords = words(inner)
        if (!innerWords.length || innerWords.length >= outerWords.length) continue
        const isPrefix = innerWords.every((w, i) => outerWords[i] === w)
        const offset = outerWords.length - innerWords.length
        const isSuffix = innerWords.every((w, i) => outerWords[offset + i] === w)
        if (isPrefix || isSuffix) {
          containment.push({
            kind: 'containment',
            outer: { id: outer.id, title: outer.title },
            inner: { id: inner.id, title: inner.title },
            taxonomy,
          })
        }
      }
    }
  }

  return { exact, containment }
}

const named = (row: { id: number; name: string }) => ({
  id: row.id,
  name: row.name,
})
const titled = (row: { id: number; title: string }) => ({
  id: row.id,
  title: row.title,
})

async function main() {
  const inventory = await loadFitnessInventory(baseUrl)
  const usage = facetUsage(inventory)

  const publicCharacters = inventory.characters.filter(
    (row) => row.isPublic !== false && row.isActive !== false,
  )

  const characters = publicCharacters.map((character) => {
    const dreams = inventory.characterDreams.get(character.id) || []
    const scenarios = inventory.characterScenarios.get(character.id) || []
    const facetIds = inventory.characterFacetIds.get(character.id) || []
    const genre = resolveFreeText(inventory.facetIndex, character.genre)
    const genreFacetLinks = facetIds.filter(
      (id) => inventory.facetIndex.byId.get(id)?.taxonomy === 'GENRE',
    )
    return {
      id: character.id,
      name: character.name,
      genreText: character.genre || null,
      genreResolved: genre.resolved.map((f) => ({ id: f.id, title: f.title })),
      genreUnresolved: genre.unresolved,
      genreFacetLinks,
      dreamIds: dreams,
      scenarioIds: scenarios,
      facetCount: facetIds.length,
    }
  })

  const scenarios = inventory.scenarios
    .filter((row) => row.isPublic !== false && row.isActive !== false)
    .map((scenario) => {
      const genres = resolveFreeText(inventory.facetIndex, scenario.genres)
      return {
        id: scenario.id,
        title: scenario.title,
        dreamIds: (scenario.Dreams || []).map((d) => d.id),
        characterIds: (scenario.Characters || []).map((c) => c.id),
        facetIds: (scenario.Facets || []).map((f) => f.id),
        genreText: scenario.genres || null,
        genreResolved: genres.resolved.map((f) => ({
          id: f.id,
          title: f.title,
        })),
        genreUnresolved: genres.unresolved,
        locations: scenario.locations || null,
      }
    })

  const dreams = inventory.dreams
    .filter((row) => row.isPublic !== false && row.isActive !== false)
    .map((dream) => ({
      id: dream.id,
      title: dream.title,
      dreamType: dream.dreamType || null,
      characterIds: (dream.Characters || []).map((c) => c.id),
      scenarioIds: (dream.Scenarios || []).map((s) => s.id),
      botIds: (dream.Bots || []).map((b) => b.id),
    }))

  const genreFacets = inventory.facets.filter(
    (facet) => facet.taxonomy === 'GENRE',
  )
  const orphanGenres = genreFacets
    .filter((facet) => !(usage.get(facet.id) || 0))
    .map((facet) => ({
      id: facet.id,
      title: facet.title,
      aliases: facet.aliases || [],
    }))

  const unresolvedVocabulary = new Map<string, { count: number; sample: string }>()
  const noteUnresolved = (values: readonly string[]) => {
    for (const value of values) {
      const key = lookupKey(value)
      if (!key) continue
      const hit = unresolvedVocabulary.get(key)
      if (hit) hit.count += 1
      else unresolvedVocabulary.set(key, { count: 1, sample: value })
    }
  }
  for (const character of characters) noteUnresolved(character.genreUnresolved)
  for (const scenario of scenarios) noteUnresolved(scenario.genreUnresolved)

  const duplicates = duplicateCandidates(inventory)

  const report = {
    generatedFrom: baseUrl,
    totals: {
      characters: characters.length,
      dreams: dreams.length,
      scenarios: scenarios.length,
      facets: inventory.facets.length,
      genreFacets: genreFacets.length,
      characterFacetLinks: inventory.characterFacets.length,
    },
    // Gap lists name the objects and nothing else. Embedding the whole record
    // made the artifact 385KB of mostly-repeated inventory, which buries the one
    // thing the file is for: the list of names somebody has to go and fix.
    gaps: {
      charactersWithoutDream: characters
        .filter((c) => !c.dreamIds.length)
        .map(named),
      charactersWithoutScenario: characters
        .filter((c) => !c.scenarioIds.length)
        .map(named),
      charactersWithoutAnyGenre: characters
        .filter((c) => !c.genreResolved.length && !c.genreFacetLinks.length)
        .map((c) => ({ id: c.id, name: c.name, genreText: c.genreText })),
      scenariosWithoutDream: scenarios
        .filter((s) => !s.dreamIds.length)
        .map(titled),
      scenariosWithThinCast: scenarios
        .filter((s) => s.characterIds.length < THIN_CAST)
        .map(titled),
      scenariosWithoutFacet: scenarios
        .filter((s) => !s.facetIds.length)
        .map(titled),
      dreamsWithoutCast: dreams.filter((d) => !d.characterIds.length).map(titled),
      dreamsWithoutScenario: dreams
        .filter((d) => !d.scenarioIds.length)
        .map(titled),
    },
    facetHealth: {
      orphanGenres,
      unresolvedVocabulary: [...unresolvedVocabulary.values()].sort(
        (a, b) => b.count - a.count,
      ),
      duplicates,
    },
  }

  // The full per-object inventory is 27k lines of data that is one command away
  // from being regenerated, so it is opt-in rather than committed by default.
  // The gap lists above are the finding; the inventory is just the working set.
  if (flag('with-inventory')) {
    ;(report as Record<string, unknown>).inventory = {
      characters,
      dreams,
      scenarios,
    }
  }

  if (jsonOut) {
    const path = join(process.cwd(), jsonOut)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`)
  }

  const g = report.gaps
  console.log('=== Fitness audit ===')
  console.log(
    `characters ${report.totals.characters} | dreams ${report.totals.dreams} | scenarios ${report.totals.scenarios} | facets ${report.totals.facets}`,
  )
  console.log('')
  console.log('CHARACTERS')
  console.log(`  without a Dream ......... ${g.charactersWithoutDream.length}`)
  console.log(`  without a Scenario ...... ${g.charactersWithoutScenario.length}`)
  console.log(`  without any genre ....... ${g.charactersWithoutAnyGenre.length}`)
  console.log('SCENARIOS')
  console.log(`  without a Dream ......... ${g.scenariosWithoutDream.length}`)
  console.log(
    `  fewer than ${THIN_CAST} Characters ... ${g.scenariosWithThinCast.length}`,
  )
  console.log(`  without a Facet ......... ${g.scenariosWithoutFacet.length}`)
  console.log('DREAMS')
  console.log(`  without a cast .......... ${g.dreamsWithoutCast.length}`)
  console.log(`  without a Scenario ...... ${g.dreamsWithoutScenario.length}`)
  console.log('FACETS')
  console.log(
    `  genre rows nothing uses . ${report.facetHealth.orphanGenres.length} of ${report.totals.genreFacets}`,
  )
  console.log(
    `  unseen vocabulary ....... ${report.facetHealth.unresolvedVocabulary.length} distinct`,
  )
  console.log(
    `  exact duplicate titles .. ${duplicates.exact.length} group(s)`,
  )
  console.log(
    `  containment pairs ....... ${duplicates.containment.length}`,
  )
  if (jsonOut) console.log(`\nWrote ${jsonOut}`)
}

await main()
