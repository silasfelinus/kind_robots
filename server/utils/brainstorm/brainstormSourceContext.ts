// /server/utils/brainstorm/brainstormSourceContext.ts
//
// conductor brainstorm/t-013: Character-aware brainstorming.
//
// BrainstormSourceRef (types/brainstorm.ts) only ever carried
// `{ modelType, id?, slug?, intent? }` through the request/session, and
// buildBrainstormPrompts never read it -- a Character-grounded session
// generated exactly the same premise-only ideas as a freeform one (the
// picker just showed what you'd picked). This resolves a ref into a compact,
// privacy-checked trait summary the prompt can actually use.
//
// conductor brainstorm/t-014: added dreamContext and scenarioContext,
// following the identical fetch-minimal-select -> canView -> formatXContext
// shape as characterContext below. Reward, Bot, Project, and Prompt remain
// documented candidates for the next entity type -- add a resolver here and
// resolveBrainstormSourceContext picks it up with no other change needed,
// same "just another registry entry" shape as
// stores/helpers/brainstormSourceAdapters.ts.
//
// The pure trait-formatting logic lives in brainstormSourceContextKit.ts (no
// Prisma/canView imports, unit-testable with plain tsx) and is re-exported
// here alongside the fetch+authorize half, mirroring the
// brainstormSourceAdapterKit.ts / brainstormSourceAdapters.ts split.
import prisma from '../prisma'
import { canView } from '../contentAccess'
import type { AuthUser } from '../authUser'
import type { BrainstormSourceRef } from '../../../types/brainstorm'
import {
  formatCharacterContext,
  formatDreamContext,
  formatScenarioContext,
} from './brainstormSourceContextKit'

async function characterContext(
  id: number,
  viewer: AuthUser | null,
): Promise<string | null> {
  const character = await prisma.character.findUnique({ where: { id } })
  if (!character) return null
  // Same authorization the character.get route itself applies -- a ref the
  // requesting user cannot view must never leak that Character's traits into
  // a generation prompt just because they happened to know its id.
  if (!(await canView(character, null, viewer))) return null

  return formatCharacterContext(character)
}

async function dreamContext(
  id: number,
  viewer: AuthUser | null,
): Promise<string | null> {
  const dream = await prisma.dream.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      dreamType: true,
      description: true,
      pitch: true,
      flavorText: true,
      artPrompt: true,
      isPublic: true,
      userId: true,
      packId: true,
      Characters: { select: { name: true }, take: 6 },
      Rewards: { select: { name: true, rewardType: true }, take: 6 },
      Scenarios: {
        select: {
          title: true,
          description: true,
          locations: true,
          tier: true,
          difficulty: true,
        },
        take: 6,
      },
    },
  })
  if (!dream) return null
  // Same authorization the dreams/:id.get route's assertDreamAccess applies
  // for the "view" action (owner, admin, or isPublic) -- a ref the requesting
  // user cannot view must never leak Dream/Scenario/Reward/Character details
  // into a generation prompt just because they happened to know its id. The
  // route's additional PACK-grant fallback (digital-storefront/t-004) is not
  // replicated here -- a PACK-only-gated Dream simply degrades to ungrounded
  // generation, never a leak.
  if (!(await canView(dream, null, viewer))) return null

  return formatDreamContext(dream)
}

async function scenarioContext(
  id: number,
  viewer: AuthUser | null,
): Promise<string | null> {
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      locations: true,
      tier: true,
      difficulty: true,
      genres: true,
      isPublic: true,
      userId: true,
      Characters: { select: { name: true }, take: 6 },
    },
  })
  if (!scenario) return null
  // The scenarios/:id.get route itself applies no record-level view check
  // today (only its linked Facets are visibility-filtered) -- revalidate
  // independently here rather than inherit that gap, matching every other
  // resolver in this registry.
  if (!(await canView(scenario, null, viewer))) return null

  return formatScenarioContext(scenario)
}

type BrainstormSourceContextResolver = (
  id: number,
  viewer: AuthUser | null,
) => Promise<string | null>

const SOURCE_CONTEXT_RESOLVERS: Record<
  string,
  BrainstormSourceContextResolver
> = {
  character: characterContext,
  dream: dreamContext,
  scenario: scenarioContext,
}

// kind-economy/t-007: which of the modelTypes above also map onto a
// ManaAttributionSource, for crediting the object's creator when a
// brainstorm generation was grounded in it (server/api/brainstorm/generate.post.ts
// passes this into manaGate's `source` alongside the context lookup above --
// two uses of the same BrainstormSourceRef, not two separate resolutions).
// Deliberately a plain data map, not derived from SOURCE_CONTEXT_RESOLVERS's
// keys: the two registries answer different questions (can we ground a
// prompt in this? vs. does this type have a creator to attribute?) and will
// diverge the moment a groundable type without single ownership shows up.
export const BRAINSTORM_SOURCE_ATTRIBUTION_TYPE: Partial<
  Record<string, 'CHARACTER' | 'SCENARIO' | 'DREAM'>
> = {
  character: 'CHARACTER',
  scenario: 'SCENARIO',
  dream: 'DREAM',
}

/**
 * Resolve a BrainstormSourceRef into prompt-ready context text, or null when
 * there's nothing to ground (no source, unregistered modelType, not found,
 * or not viewable). Grounding is an enhancement, not a hard requirement -- a
 * lookup failure degrades to an ungrounded but still-successful generation,
 * never a failed request.
 */
export async function resolveBrainstormSourceContext(
  source: BrainstormSourceRef | null | undefined,
  viewer: AuthUser | null,
): Promise<string | null> {
  if (!source?.modelType || !source.id) return null
  const resolver = SOURCE_CONTEXT_RESOLVERS[source.modelType.toLowerCase()]
  if (!resolver) return null

  try {
    return await resolver(source.id, viewer)
  } catch (error) {
    console.warn(
      '[brainstorm:sourceContext] failed to resolve source context',
      error,
    )
    return null
  }
}
