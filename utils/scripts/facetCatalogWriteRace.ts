export function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002',
  )
}

export function chooseFacetForCanonicalSlug<Row>(
  slugFacet: Row | undefined,
  aliasFacet: Row | undefined,
): Row | undefined {
  return slugFacet ?? aliasFacet
}

type UpdateFacetWithSlugRaceRecoveryOptions<Row extends { id: number }> = {
  existingId: number
  slug: string
  updateExisting: () => Promise<Row>
  findBySlug: (slug: string) => Promise<Row | null>
  updateWinner: (winner: Row) => Promise<Row>
}

export async function updateFacetWithSlugRaceRecovery<
  Row extends { id: number },
>({
  existingId,
  slug,
  updateExisting,
  findBySlug,
  updateWinner,
}: UpdateFacetWithSlugRaceRecoveryOptions<Row>): Promise<Row> {
  try {
    return await updateExisting()
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error

    const winner = await findBySlug(slug)
    if (!winner || winner.id === existingId) throw error

    return updateWinner(winner)
  }
}

export function shouldAssignAliasToFacet(
  ownerId: number | undefined,
  facetId: number,
  isCanonicalAlias: boolean,
): boolean {
  return ownerId === undefined || ownerId === facetId || isCanonicalAlias
}
