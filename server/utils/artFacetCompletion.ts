// /server/utils/artFacetCompletion.ts
import { readArtFacetIds } from './artFacetSelection'

type FacetLink = { facetId: number }

type FacetArtImageDelegate = {
  findMany(args: {
    where: { artImageId: number }
    select: { facetId: true }
  }): Promise<FacetLink[]>
  deleteMany(args: { where: { artImageId: number } }): Promise<unknown>
  createMany(args: {
    data: Array<{ artImageId: number; facetId: number }>
    skipDuplicates: true
  }): Promise<unknown>
}

export type FacetCompletionTransaction = {
  facetArtImage: FacetArtImageDelegate
}

async function replaceArtImageFacetLinks(
  tx: FacetCompletionTransaction,
  artImageId: number,
  facetIds: readonly number[],
): Promise<void> {
  await tx.facetArtImage.deleteMany({ where: { artImageId } })
  if (!facetIds.length) return

  await tx.facetArtImage.createMany({
    data: facetIds.map((facetId) => ({ artImageId, facetId })),
    skipDuplicates: true,
  })
}

export async function syncCompletedArtImageFacets(
  tx: FacetCompletionTransaction,
  payload: unknown,
  artImageId: number,
): Promise<number[]> {
  const facetIds = readArtFacetIds(payload)
  await replaceArtImageFacetLinks(tx, artImageId, facetIds)
  return facetIds
}

export async function copyArtImageFacets(
  tx: FacetCompletionTransaction,
  sourceArtImageId: number,
  targetArtImageId: number,
): Promise<number[]> {
  const links = await tx.facetArtImage.findMany({
    where: { artImageId: sourceArtImageId },
    select: { facetId: true },
  })
  const facetIds = [...new Set(links.map((link) => link.facetId))]
  await replaceArtImageFacetLinks(tx, targetArtImageId, facetIds)
  return facetIds
}
