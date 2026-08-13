// /utils/scripts/proposeObjectConnections.ts
//
// Candidate generator for the fitness pass. Read-only; writes one artifact.
//
//   npx tsx utils/scripts/proposeObjectConnections.ts --scenarios=61-120
//   npx tsx utils/scripts/proposeObjectConnections.ts --characters --from=0 --count=30
//
// This proposes NOTHING on its own authority. It ranks candidates and prints the
// evidence for each, and a human (or an author working like one) decides. That
// division is deliberate and was learned the expensive way on this repo: during
// the genre pass, automated string similarity confidently proposed folding
// Hopepunk into Hellpunk and Eco-Fantasy into Epic Fantasy. Both are wrong in a
// way no threshold fixes, because edit distance cannot see that "Hope" and
// "Hell" are the entire meaning of the word.
//
// So every candidate carries WHY, and weak evidence is labelled weak rather than
// scored slightly lower and quietly promoted by the sort.
//
// The single-token character-name trap is the same shape: 39 of 227 Characters
// are named things like Static, Marrow, Compost, Deadline and Brine. A Dream
// called "Static Marsh" is not evidence for the character Static, and "Salt
// Memory" is not evidence for Old Salt. Those matches are emitted at tier
// `name-weak` and must be read before use.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  resolveFreeText,
  type CharacterRow,
  type ScenarioRow,
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

const baseUrl = arg('base', 'https://kindrobots.org')
const jsonOut = arg('json', 'artifacts/connection-proposals.json')
const from = Number(arg('from', '0'))
const count = Number(arg('count', '0'))

/** Words too common to carry affinity on their own. */
const STOPWORDS = new Set([
  'the','and','of','a','an','in','on','at','to','for','with','from','by','it',
  'its','is','are','was','were','be','been','has','have','had','that','this',
  'they','them','their','you','your','who','what','when','where','which','how',
  'one','two','all','any','not','but','or','if','as','so','than','then','into',
  'out','up','down','over','under','off','no','yes','can','will','would','more',
  'most','some','other','new','old','first','last','own','same','very','just',
  'story','stories','tale','tales','character','characters','scenario','dream',
  'thing','things','something','anything','nothing','someone','anyone','nobody',
  'about','after','before','again','still','only','also','even','every','each',
  'there','here','while','because','through','between','against','during',
])

function tokens(value: unknown): string[] {
  return String(value ?? '')
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word))
}

function tokenSet(...values: unknown[]): Set<string> {
  const set = new Set<string>()
  for (const value of values) for (const token of tokens(value)) set.add(token)
  return set
}

/**
 * Shared tokens, keeping only the ones that actually discriminate.
 *
 * Raw overlap does not work on this corpus. Dream descriptions vary from one
 * line to several paragraphs, and the long ones matched every scenario in the
 * catalog: "Mistress Cassady's Spooktakular Monster Drag Party" surfaced as a
 * candidate for a zombie runway, a fox-prince court drama and a fairy heist,
 * purely because it has more words for the count to find. Length was being read
 * as affinity.
 *
 * So a token only counts if it is rare across the corpus. `commonTokens` holds
 * everything appearing in more than a twentieth of documents, and those are dropped
 * before the count -- which is what leaves "folklore, nine, tail, crown" and
 * discards "dark, human".
 */
function overlap(
  a: Set<string>,
  b: Set<string>,
  commonTokens: Set<string>,
): string[] {
  const shared: string[] = []
  for (const token of a) {
    if (b.has(token) && !commonTokens.has(token)) shared.push(token)
  }
  return shared
}

/** Tokens appearing in more than `ratio` of documents carry no affinity signal. */
function buildCommonTokens(
  documents: readonly Set<string>[],
  ratio = 0.05,
): Set<string> {
  const frequency = new Map<string, number>()
  for (const document of documents) {
    for (const token of document) {
      frequency.set(token, (frequency.get(token) || 0) + 1)
    }
  }
  const limit = Math.max(2, Math.floor(documents.length * ratio))
  const common = new Set<string>()
  for (const [token, count] of frequency) {
    if (count > limit) common.add(token)
  }
  return common
}

function phrase(value: unknown): string {
  return ` ${String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
}

export type Evidence = {
  tier:
    | 'name-phrase'
    | 'name-weak'
    | 'dream-bridge'
    | 'facet-shared'
    | 'genre-shared'
    | 'token-overlap'
  detail: string
}

const TIER_RANK: Record<Evidence['tier'], number> = {
  'name-phrase': 0,
  'dream-bridge': 1,
  'facet-shared': 2,
  'genre-shared': 3,
  'token-overlap': 4,
  'name-weak': 5,
}

type Candidate = { id: number; name: string; evidence: Evidence[] }

function rank(candidates: Candidate[]): Candidate[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      evidence: [...candidate.evidence].sort(
        (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier],
      ),
    }))
    .sort((a, b) => {
      const best = TIER_RANK[a.evidence[0]!.tier] - TIER_RANK[b.evidence[0]!.tier]
      if (best !== 0) return best
      if (b.evidence.length !== a.evidence.length) {
        return b.evidence.length - a.evidence.length
      }
      return a.id - b.id
    })
}

/**
 * A character name counts as strong evidence only when it is a phrase that
 * cannot occur by accident: two or more tokens, or one token of six-plus
 * characters that is not an ordinary English noun the setting uses anyway.
 */
function nameEvidence(
  character: CharacterRow,
  haystack: string,
): Evidence | null {
  const name = String(character.name || '').trim()
  if (!name) return null
  const key = phrase(name).trim()
  if (!key) return null
  if (!haystack.includes(` ${key} `)) return null
  const wordCount = key.split(' ').length
  if (wordCount >= 2) {
    return { tier: 'name-phrase', detail: `text names "${name}"` }
  }
  return {
    tier: 'name-weak',
    detail: `text contains the word "${name}" -- single-token name, read before trusting`,
  }
}

function characterFacetIds(
  inventory: LoadedInventory,
  character: CharacterRow,
): Set<number> {
  const ids = new Set<number>(
    inventory.characterFacetIds.get(character.id) || [],
  )
  for (const facet of resolveFreeText(inventory.facetIndex, character.genre)
    .resolved) {
    ids.add(facet.id)
  }
  return ids
}

function scenarioReport(
  inventory: LoadedInventory,
  scenario: ScenarioRow,
  commonTokens: Set<string>,
): unknown {
  const linkedDreamIds = new Set((scenario.Dreams || []).map((d) => d.id))
  const linkedCharacterIds = new Set(
    (scenario.Characters || []).map((c) => c.id),
  )
  const scenarioFacets = new Set((scenario.Facets || []).map((f) => f.id))
  for (const facet of resolveFreeText(inventory.facetIndex, scenario.genres)
    .resolved) {
    scenarioFacets.add(facet.id)
  }

  const haystack = phrase(
    `${scenario.title} . ${scenario.description || ''} . ${scenario.locations || ''}`,
  )
  const scenarioTokens = tokenSet(
    scenario.title,
    scenario.description,
    scenario.genres,
    scenario.locations,
    scenario.inspirations,
  )

  // Characters already in one of this scenario's Dreams are the strongest
  // structural candidates: somebody already decided they belong to that world.
  const dreamCast = new Set<number>()
  for (const dream of inventory.dreams) {
    if (!linkedDreamIds.has(dream.id)) continue
    for (const character of dream.Characters || []) dreamCast.add(character.id)
  }

  const characterCandidates: Candidate[] = []
  for (const character of inventory.characters) {
    if (linkedCharacterIds.has(character.id)) continue
    if (character.isPublic === false || character.isActive === false) continue
    const evidence: Evidence[] = []

    const named = nameEvidence(character, haystack)
    if (named) evidence.push(named)

    if (dreamCast.has(character.id)) {
      evidence.push({
        tier: 'dream-bridge',
        detail: 'already cast in a Dream this Scenario belongs to',
      })
    }

    const facets = characterFacetIds(inventory, character)
    const sharedFacets = [...facets].filter((id) => scenarioFacets.has(id))
    if (sharedFacets.length) {
      const titles = sharedFacets
        .map((id) => inventory.facetIndex.byId.get(id)?.title || String(id))
        .join(', ')
      evidence.push({ tier: 'facet-shared', detail: `shares Facet: ${titles}` })
    }

    const shared = overlap(
      tokenSet(
        character.genre,
        character.class,
        character.species,
        character.role,
        character.title,
      ),
      scenarioTokens,
      commonTokens,
    )
    if (shared.length >= 2) {
      evidence.push({
        tier: 'token-overlap',
        detail: `shared language: ${shared.slice(0, 5).join(', ')}`,
      })
    }

    if (evidence.length) {
      characterCandidates.push({
        id: character.id,
        name: character.name,
        evidence,
      })
    }
  }

  const dreamCandidates: Candidate[] = []
  if (!linkedDreamIds.size) {
    for (const dream of inventory.dreams) {
      if (dream.isPublic === false || dream.isActive === false) continue
      const evidence: Evidence[] = []
      const dreamKey = phrase(dream.title).trim()
      if (dreamKey.split(' ').length >= 2 && haystack.includes(` ${dreamKey} `)) {
        evidence.push({
          tier: 'name-phrase',
          detail: `Scenario text names "${dream.title}"`,
        })
      }
      const facets = new Set(inventory.dreamFacetIds.get(dream.id) || [])
      const sharedFacets = [...facets].filter((id) => scenarioFacets.has(id))
      if (sharedFacets.length) {
        const titles = sharedFacets
          .map((id) => inventory.facetIndex.byId.get(id)?.title || String(id))
          .join(', ')
        evidence.push({
          tier: 'facet-shared',
          detail: `shares Facet: ${titles}`,
        })
      }
      const shared = overlap(
        tokenSet(dream.title, dream.pitch, dream.description, dream.flavorText),
        scenarioTokens,
        commonTokens,
      )
      if (shared.length >= 3) {
        evidence.push({
          tier: 'token-overlap',
          detail: `shared language: ${shared.slice(0, 6).join(', ')}`,
        })
      }
      if (evidence.length) {
        dreamCandidates.push({
          id: dream.id,
          name: `${dream.title} [${dream.dreamType || '?'}]`,
          evidence,
        })
      }
    }
  }

  return {
    scenario: {
      id: scenario.id,
      title: scenario.title,
      description: String(scenario.description || '').slice(0, 400),
      genres: scenario.genres || null,
      locations: scenario.locations || null,
      linkedDreams: (scenario.Dreams || []).map((d) => d.title),
      linkedCharacters: (scenario.Characters || []).map((c) => c.name),
      facets: (scenario.Facets || []).map((f) => f.title),
    },
    characterCandidates: rank(characterCandidates).slice(0, 12),
    dreamCandidates: rank(dreamCandidates).slice(0, 6),
  }
}

function characterReport(
  inventory: LoadedInventory,
  character: CharacterRow,
  commonTokens: Set<string>,
): unknown {
  const linkedDreams = new Set(inventory.characterDreams.get(character.id) || [])
  const linkedScenarios = new Set(
    inventory.characterScenarios.get(character.id) || [],
  )
  const facets = characterFacetIds(inventory, character)
  const characterTokens = tokenSet(
    character.genre,
    character.class,
    character.species,
    character.role,
    character.title,
    character.drive,
    character.backstory,
  )
  const namePhrase = phrase(character.name).trim()
  const nameTokenCount = namePhrase.split(' ').length

  const dreamCandidates: Candidate[] = []
  for (const dream of inventory.dreams) {
    if (linkedDreams.has(dream.id)) continue
    if (dream.isPublic === false || dream.isActive === false) continue
    const evidence: Evidence[] = []
    const haystack = phrase(
      `${dream.title} . ${dream.pitch || ''} . ${dream.description || ''} . ${dream.flavorText || ''}`,
    )
    if (namePhrase && haystack.includes(` ${namePhrase} `)) {
      evidence.push(
        nameTokenCount >= 2
          ? { tier: 'name-phrase', detail: `Dream text names "${character.name}"` }
          : {
              tier: 'name-weak',
              detail: `Dream text contains "${character.name}" -- single-token name, read before trusting`,
            },
      )
    }
    const dreamFacets = new Set(inventory.dreamFacetIds.get(dream.id) || [])
    const sharedFacets = [...facets].filter((id) => dreamFacets.has(id))
    if (sharedFacets.length) {
      evidence.push({
        tier: 'facet-shared',
        detail: `shares Facet: ${sharedFacets
          .map((id) => inventory.facetIndex.byId.get(id)?.title || String(id))
          .join(', ')}`,
      })
    }
    const shared = overlap(
      tokenSet(dream.title, dream.pitch, dream.description, dream.flavorText),
      characterTokens,
      commonTokens,
    )
    if (shared.length >= 2) {
      evidence.push({
        tier: 'token-overlap',
        detail: `shared language: ${shared.slice(0, 6).join(', ')}`,
      })
    }
    if (evidence.length) {
      dreamCandidates.push({
        id: dream.id,
        name: `${dream.title} [${dream.dreamType || '?'}]`,
        evidence,
      })
    }
  }

  const scenarioCandidates: Candidate[] = []
  for (const scenario of inventory.scenarios) {
    if (linkedScenarios.has(scenario.id)) continue
    if (scenario.isPublic === false || scenario.isActive === false) continue
    const evidence: Evidence[] = []
    const haystack = phrase(
      `${scenario.title} . ${scenario.description || ''} . ${scenario.locations || ''}`,
    )
    if (namePhrase && haystack.includes(` ${namePhrase} `)) {
      evidence.push(
        nameTokenCount >= 2
          ? {
              tier: 'name-phrase',
              detail: `Scenario text names "${character.name}"`,
            }
          : {
              tier: 'name-weak',
              detail: `Scenario text contains "${character.name}" -- single-token name, read before trusting`,
            },
      )
    }
    if ((scenario.Dreams || []).some((dream) => linkedDreams.has(dream.id))) {
      evidence.push({
        tier: 'dream-bridge',
        detail: 'Scenario belongs to a Dream this Character is cast in',
      })
    }
    const scenarioFacets = new Set((scenario.Facets || []).map((f) => f.id))
    const sharedFacets = [...facets].filter((id) => scenarioFacets.has(id))
    if (sharedFacets.length) {
      evidence.push({
        tier: 'facet-shared',
        detail: `shares Facet: ${sharedFacets
          .map((id) => inventory.facetIndex.byId.get(id)?.title || String(id))
          .join(', ')}`,
      })
    }
    const shared = overlap(
      tokenSet(
        scenario.title,
        scenario.description,
        scenario.genres,
        scenario.locations,
      ),
      characterTokens,
      commonTokens,
    )
    if (shared.length >= 3) {
      evidence.push({
        tier: 'token-overlap',
        detail: `shared language: ${shared.slice(0, 6).join(', ')}`,
      })
    }
    if (evidence.length) {
      scenarioCandidates.push({
        id: scenario.id,
        name: scenario.title,
        evidence,
      })
    }
  }

  return {
    character: {
      id: character.id,
      name: character.name,
      genre: character.genre || null,
      species: character.species || null,
      class: character.class || null,
      role: character.role || null,
      title: character.title || null,
      drive: String(character.drive || '').slice(0, 200),
      linkedDreams: [...linkedDreams],
      linkedScenarios: [...linkedScenarios],
      facetTitles: [...facets]
        .map((id) => inventory.facetIndex.byId.get(id)?.title)
        .filter(Boolean),
    },
    dreamCandidates: rank(dreamCandidates).slice(0, 8),
    scenarioCandidates: rank(scenarioCandidates).slice(0, 10),
  }
}

function slice<T>(rows: readonly T[]): T[] {
  if (!count) return [...rows].slice(from)
  return [...rows].slice(from, from + count)
}

async function main() {
  const inventory = await loadFitnessInventory(baseUrl)
  const wantCharacters = flag('characters')
  const wantScenarios = flag('scenarios') || !wantCharacters

  // Document frequency is measured over every text-bearing object at once, not
  // per type. A token like "harbour" is only distinctive if it is rare in the
  // whole setting; measuring within Dreams alone would call it rare in a corpus
  // of 48 while half the Scenarios use it.
  const commonTokens = buildCommonTokens([
    ...inventory.dreams.map((d) =>
      tokenSet(d.title, d.pitch, d.description, d.flavorText),
    ),
    ...inventory.scenarios.map((s) =>
      tokenSet(s.title, s.description, s.genres, s.locations, s.inspirations),
    ),
    ...inventory.characters.map((c) =>
      tokenSet(c.genre, c.class, c.species, c.role, c.title, c.drive, c.backstory),
    ),
  ])

  const report: Record<string, unknown> = { base: baseUrl, from, count }

  if (wantScenarios) {
    const rows = slice(
      inventory.scenarios
        .filter((s) => s.isPublic !== false && s.isActive !== false)
        .sort((a, b) => a.id - b.id),
    )
    report.scenarios = rows.map((scenario) =>
      scenarioReport(inventory, scenario, commonTokens),
    )
    console.log(`scenario reports: ${rows.length}`)
  }

  if (wantCharacters) {
    const rows = slice(
      inventory.characters
        .filter((c) => c.isPublic !== false && c.isActive !== false)
        .sort((a, b) => a.id - b.id),
    )
    report.characters = rows.map((character) =>
      characterReport(inventory, character, commonTokens),
    )
    console.log(`character reports: ${rows.length}`)
  }

  const path = join(process.cwd(), jsonOut)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Wrote ${jsonOut}`)
}

await main()
