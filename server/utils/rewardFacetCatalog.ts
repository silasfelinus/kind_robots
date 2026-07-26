// /server/utils/rewardFacetCatalog.ts
import prisma from '~/server/utils/prisma'
import {
  loadFacetCatalogEntries,
  type FacetCatalogEntry,
  type FacetTaxonomy,
} from '~/server/utils/facetCatalog'

export type RewardFacetAssignment = {
  facetId: number
  fieldKey: string
  sortOrder: number
  weight: number
  source: string
}

export function rewardFacetFieldKey(taxonomy: FacetTaxonomy): string {
  if (taxonomy === 'MATERIAL') return 'material'
  if (taxonomy === 'COLOR') return 'color'
  if (taxonomy === 'THEME') return 'theme'
  if (taxonomy === 'STYLE') return 'style'
  if (taxonomy === 'ART_DIRECTION' || taxonomy === 'PROMPT_ENHANCEMENT') {
    return 'art-direction'
  }
  return 'facet'
}

export async function loadRewardFacetAssignments(
  rewardId: number,
): Promise<Array<RewardFacetAssignment & { facet: FacetCatalogEntry }>> {
  const links = await prisma.rewardFacet.findMany({
    where: { rewardId },
    orderBy: [{ fieldKey: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
  })
  if (!links.length) return []

  const facets = await loadFacetCatalogEntries({
    facetIds: links.map((link) => link.facetId),
    includeMature: true,
    includeInactive: true,
    isAdmin: true,
  })
  const byId = new Map(facets.map((facet) => [facet.id, facet]))

  return links
    .map((link) => {
      const facet = byId.get(link.facetId)
      return facet ? { ...link, facet } : null
    })
    .filter(
      (
        entry,
      ): entry is RewardFacetAssignment & { facet: FacetCatalogEntry } =>
        Boolean(entry),
    )
}

export async function loadRewardFacetCatalog(
  rewardId: number,
): Promise<FacetCatalogEntry[]> {
  const assignments = await loadRewardFacetAssignments(rewardId)
  return assignments.map((assignment) => assignment.facet)
}
