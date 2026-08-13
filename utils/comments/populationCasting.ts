// /utils/comments/populationCasting.ts
//
// Who is entitled to speak on each object, by actual connection.
//
// WHY
// ---
// The facet lane cast on token overlap, and it showed: `relationshipScore`
// returned 0 for every speaker on every facet, so Brine ranked third on a
// coincidental word rather than first on BEING Chaotic Good.
//
// Silas, 2026-08-13, on this pass: "Characters should comment on people they
// have an affinity with, most are connected by a Dream, but if not, a facet
// genre would work. Dreams and scenarios should get commented by someone
// connected to them. Projects ... it probably feels best to pair them with our
// promptbots, since they also are built for utility, not personality."
//
// So connection is a gate, not a weight. This module answers "who is even
// allowed on this card", and the existing signal scoring then picks among them.
// Each answer carries the TIER it came from, because an honest report of how
// many targets are genuinely connected is worth more than a number that quietly
// includes everyone who fell through to the fallback.
//
// What the live data actually supports (surveyed 2026-08-13):
//
//   Characters   26/227 reachable through a shared Dream, 189/227 share a
//                genre with at least one other character. Hence Dream first,
//                genre second -- exactly the order asked for -- and a token
//                match to catch "Weird West" vs "Weird Western", which are the
//                same genre spelled twice.
//   Dreams       28/48 carry Characters or Bots directly; the rest route
//                through their Scenarios.
//   Scenarios    0/116 carry Characters, but 102/116 carry Facets and 25 carry
//                Dreams. So: through the Dream if there is one, otherwise
//                through the facets the scenario is built from.
//   Projects     36, none with a managerBotId. 26 PROMPTBOTs exist, which is
//                enough for the pairing at a visit cap of 2.
import type { PopulationRow, PopulationTargetType } from './populationTargets'

export type CastTier =
  | 'shared-dream'
  | 'dream-cast'
  | 'scenario-dream-cast'
  | 'scenario-facet'
  | 'genre-exact'
  | 'genre-token'
  | 'promptbot'
  | 'unconnected'

export type SpeakerRef = { kind: 'BOT' | 'CHARACTER'; id: number }

export type ConnectionResult = {
  tier: CastTier
  /** Speakers allowed on this target. Empty means "no gate, use affinity". */
  allowed: SpeakerRef[]
}

const text = (value: unknown): string => String(value ?? '').trim()

function idsOf(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => Number((entry as Record<string, unknown>)?.id))
    .filter((id) => Number.isInteger(id) && id > 0)
}

/**
 * Genre strings are free text and inconsistent: "Weird West", "Weird Western"
 * and "WeirdCore" are three spellings around one idea. Exact match catches the
 * first two thirds; the token set is what rescues the 38 characters sitting
 * alone in a genre nobody else spelled the same way.
 *
 * `core`, `punk` and `era` are dropped as tokens -- they are suffixes attached
 * to half the catalogue ("WeirdCore", "Hopepunk", "Villain Era") and matching on
 * them would connect everything to everything, which is the same as connecting
 * nothing.
 */
const GENRE_STOPWORDS = new Set([
  'core',
  'punk',
  'era',
  'the',
  'and',
  'of',
  'a',
  'fiction',
  'story',
  'stories',
  'genre',
])

export function genreTokens(value: unknown): Set<string> {
  const raw = text(value).toLowerCase()
  if (!raw) return new Set()
  // Split camel/pascal joins too: "WeirdCore" -> "weird core".
  const split = text(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
  return new Set(
    `${raw} ${split}`
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !GENRE_STOPWORDS.has(token)),
  )
}

function shareToken(left: Set<string>, right: Set<string>): boolean {
  for (const token of left) if (right.has(token)) return true
  return false
}

export type CastingIndex = {
  /** characterId -> dream ids that list them. */
  characterDreams: Map<number, Set<number>>
  /** dreamId -> the characters and bots it lists. */
  dreamCast: Map<number, SpeakerRef[]>
  /** facetId -> characters whose attributes match that facet. */
  facetCharacters: Map<number, number[]>
  /** characterId -> its genre tokens. */
  characterGenre: Map<number, { exact: string; tokens: Set<string> }>
  /**
   * scenarioId -> the full scenario row. A Scenario nested inside a Dream is a
   * stub carrying only id/title/description -- no Facets, no Dreams -- so
   * routing a Dream through its scenarios has to resolve them here first. This
   * is the difference between 28/48 Dreams connected and 46/48.
   */
  scenarioById: Map<number, PopulationRow>
  /** Every PROMPTBOT, for the Project pairing. */
  promptBots: SpeakerRef[]
  /** All character ids, so genre lookups can enumerate. */
  characterIds: number[]
}

export function buildCastingIndex(input: {
  characters: PopulationRow[]
  bots: PopulationRow[]
  dreams: PopulationRow[]
  scenarios: PopulationRow[]
  /** facetId -> matching character ids, from facetAttributeMatch. */
  facetCharacters?: Map<number, number[]>
}): CastingIndex {
  const characterDreams = new Map<number, Set<number>>()
  const dreamCast = new Map<number, SpeakerRef[]>()

  for (const dream of input.dreams) {
    const dreamId = Number(dream.id)
    if (!Number.isInteger(dreamId)) continue
    const cast: SpeakerRef[] = [
      ...idsOf(dream.Characters).map((id) => ({ kind: 'CHARACTER' as const, id })),
      ...idsOf(dream.Bots).map((id) => ({ kind: 'BOT' as const, id })),
    ]
    if (cast.length) dreamCast.set(dreamId, cast)
    for (const id of idsOf(dream.Characters)) {
      const set = characterDreams.get(id) || new Set<number>()
      set.add(dreamId)
      characterDreams.set(id, set)
    }
  }

  const characterGenre = new Map<number, { exact: string; tokens: Set<string> }>()
  const characterIds: number[] = []
  for (const character of input.characters) {
    const id = Number(character.id)
    if (!Number.isInteger(id)) continue
    characterIds.push(id)
    characterGenre.set(id, {
      exact: text(character.genre).toLowerCase(),
      tokens: genreTokens(character.genre),
    })
  }

  const promptBots = input.bots
    .filter((bot) => text(bot.BotType).toUpperCase() === 'PROMPTBOT')
    .map((bot) => ({ kind: 'BOT' as const, id: Number(bot.id) }))
    .filter((ref) => Number.isInteger(ref.id))

  const scenarioById = new Map<number, PopulationRow>()
  for (const scenario of input.scenarios) {
    const scenarioId = Number(scenario.id)
    if (Number.isInteger(scenarioId)) scenarioById.set(scenarioId, scenario)
  }

  return {
    characterDreams,
    dreamCast,
    scenarioById,
    facetCharacters: input.facetCharacters || new Map(),
    characterGenre,
    promptBots,
    characterIds,
  }
}

/** Characters who share a Dream with this one, excluding itself. */
function sharedDreamPeers(index: CastingIndex, characterId: number): SpeakerRef[] {
  const dreams = index.characterDreams.get(characterId)
  if (!dreams?.size) return []
  const peers = new Map<string, SpeakerRef>()
  for (const dreamId of dreams) {
    for (const member of index.dreamCast.get(dreamId) || []) {
      if (member.kind === 'CHARACTER' && member.id === characterId) continue
      peers.set(`${member.kind}:${member.id}`, member)
    }
  }
  return [...peers.values()]
}

function genrePeers(
  index: CastingIndex,
  characterId: number,
  mode: 'exact' | 'token',
): SpeakerRef[] {
  const own = index.characterGenre.get(characterId)
  if (!own || (mode === 'exact' ? !own.exact : !own.tokens.size)) return []
  const peers: SpeakerRef[] = []
  for (const otherId of index.characterIds) {
    if (otherId === characterId) continue
    const other = index.characterGenre.get(otherId)
    if (!other) continue
    const hit =
      mode === 'exact'
        ? other.exact && other.exact === own.exact
        : shareToken(own.tokens, other.tokens)
    if (hit) peers.push({ kind: 'CHARACTER', id: otherId })
  }
  return peers
}

/**
 * Who may comment on this target.
 *
 * Returns `unconnected` with an empty list when no rule reaches anybody, and
 * the caller falls back to plain affinity. That case is reported rather than
 * hidden: an object with nothing genuinely tied to it should be visible as
 * such, not quietly dressed up as a connection.
 */
export function connectionsFor(
  type: PopulationTargetType,
  row: PopulationRow,
  index: CastingIndex,
): ConnectionResult {
  const id = Number(row.id)

  if (type === 'PROJECT') {
    // Utility objects paired with utility bots, per Silas. This is the one
    // hard rule here -- Projects are functional and specific, and a promptbot
    // is the voice that meets them on their own terms.
    return { tier: 'promptbot', allowed: index.promptBots }
  }

  if (type === 'CHARACTER') {
    const dreamPeers = sharedDreamPeers(index, id)
    if (dreamPeers.length) return { tier: 'shared-dream', allowed: dreamPeers }

    const exact = genrePeers(index, id, 'exact')
    if (exact.length) return { tier: 'genre-exact', allowed: exact }

    const token = genrePeers(index, id, 'token')
    if (token.length) return { tier: 'genre-token', allowed: token }

    return { tier: 'unconnected', allowed: [] }
  }

  if (type === 'DREAM') {
    const cast = index.dreamCast.get(id) || []
    if (cast.length) return { tier: 'dream-cast', allowed: cast }

    // No direct cast: reach through the scenarios this Dream owns, and through
    // whatever those scenarios are built from.
    const viaScenarios = scenarioReach(row.Scenarios, index)
    if (viaScenarios.length) {
      return { tier: 'scenario-dream-cast', allowed: viaScenarios }
    }
    return { tier: 'unconnected', allowed: [] }
  }

  if (type === 'SCENARIO') {
    // Through the Dream first -- a scenario's Dream carries real cast.
    const viaDreams = new Map<string, SpeakerRef>()
    for (const dreamId of idsOf(row.Dreams)) {
      for (const member of index.dreamCast.get(dreamId) || []) {
        viaDreams.set(`${member.kind}:${member.id}`, member)
      }
    }
    if (viaDreams.size) {
      return { tier: 'scenario-dream-cast', allowed: [...viaDreams.values()] }
    }

    // Otherwise through the facets it is built from: whoever carries "Circus"
    // as a trait has standing to speak on a scenario built out of Circus.
    const viaFacets = new Map<string, SpeakerRef>()
    for (const facetId of idsOf(row.Facets)) {
      for (const characterId of index.facetCharacters.get(facetId) || []) {
        viaFacets.set(`CHARACTER:${characterId}`, {
          kind: 'CHARACTER',
          id: characterId,
        })
      }
    }
    if (viaFacets.size) {
      return { tier: 'scenario-facet', allowed: [...viaFacets.values()] }
    }
    return { tier: 'unconnected', allowed: [] }
  }

  // BOT: no connection gate. Bots are the platform's own voices and any of them
  // may drop in on another; spread and affinity decide.
  return { tier: 'unconnected', allowed: [] }
}

function scenarioReach(
  scenarios: unknown,
  index: CastingIndex,
): SpeakerRef[] {
  const found = new Map<string, SpeakerRef>()
  if (!Array.isArray(scenarios)) return []
  for (const scenario of scenarios) {
    const stub = scenario as PopulationRow
    // Resolve the stub to the full row; the nested copy has no Facets/Dreams.
    const row = index.scenarioById.get(Number(stub.id)) || stub
    for (const dreamId of idsOf(row.Dreams)) {
      for (const member of index.dreamCast.get(dreamId) || []) {
        found.set(`${member.kind}:${member.id}`, member)
      }
    }
    for (const facetId of idsOf(row.Facets)) {
      for (const characterId of index.facetCharacters.get(facetId) || []) {
        found.set(`CHARACTER:${characterId}`, { kind: 'CHARACTER', id: characterId })
      }
    }
  }
  return [...found.values()]
}
