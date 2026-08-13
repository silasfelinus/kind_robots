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
// Only Character is wired today. Dream and further entity types are
// brainstorm/t-014's scope ("Ship Dream-aware brainstorming and expand
// adapter coverage") -- add a resolver to SOURCE_CONTEXT_RESOLVERS below and
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
import { formatCharacterContext } from './brainstormSourceContextKit'

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

type BrainstormSourceContextResolver = (
  id: number,
  viewer: AuthUser | null,
) => Promise<string | null>

const SOURCE_CONTEXT_RESOLVERS: Record<
  string,
  BrainstormSourceContextResolver
> = {
  character: characterContext,
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
