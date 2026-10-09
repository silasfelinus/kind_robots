import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/prisma'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { viewerShowsMature } from '~/server/utils/contentAccess'
import { loadFacetCatalogEntries } from '~/server/utils/facetCatalog'
import { errorHandler } from '~/server/utils/error'
import {
  countZuzuMatches,
  parseZuzuResourceCandidates,
  reconcileZuzuResources,
  worldTags,
  type ZuzuResourceCandidate,
  type ZuzuResourceKind,
  type ZuzuResourceAuditReport,
} from '~/utils/zuzuResourceAudit'

const SUBMISSION_URL =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/worlds/zuzu/resource-submissions.json'
const CACHE_MS = 5 * 60 * 1000

let cached: { at: number; candidates: ZuzuResourceCandidate[] } | null = null

async function sourceCandidates(): Promise<ZuzuResourceCandidate[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.candidates

  const response = await fetch(SUBMISSION_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok)
    throw new Error('Zuzu candidate manifest unavailable (' + response.status + ').')
  const candidates = parseZuzuResourceCandidates(await response.json())
  cached = { at: Date.now(), candidates }
  return candidates
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const ownerId = auth.user.id
    const matureVisible = viewerShowsMature(auth.user)
    const candidates = await sourceCandidates()
    const selected = (kind: ZuzuResourceKind) =>
      candidates.filter((candidate) => candidate.kind === kind)
    const names = (kind: ZuzuResourceKind) =>
      selected(kind).map((candidate) => candidate.name)
    const slugs = (kind: ZuzuResourceKind) =>
      selected(kind).flatMap((candidate) => candidate.slug ? [candidate.slug] : [])
    const visible = {
      userId: ownerId,
      isActive: true,
      ...(matureVisible ? {} : { isMature: false }),
    }

    const [characters, scenarios, rewards, resources, facets] = await Promise.all([
      prisma.character.findMany({
        where: {
          ...visible,
          OR: [
            { slug: { in: slugs('character') } },
            { name: { in: names('character') } },
          ],
        },
        select: { id: true, slug: true, name: true },
      }),
      prisma.scenario.findMany({
        where: {
          ...visible,
          OR: [
            { slug: { in: slugs('scenario') } },
            { title: { in: names('scenario') } },
          ],
        },
        select: { id: true, slug: true, title: true },
      }),
      prisma.reward.findMany({
        where: {
          ...visible,
          OR: [
            { slug: { in: slugs('reward') } },
            { name: { in: names('reward') } },
          ],
        },
        select: { id: true, slug: true, name: true },
      }),
      prisma.resource.findMany({
        where: {
          ...visible,
          resourceType: 'LORA',
          OR: [
            { name: { in: names('model-resource') } },
            { customLabel: { in: names('model-resource') } },
            ...selected('model-resource').flatMap((candidate) =>
              candidate.trigger
                ? [{ triggerWords: { contains: candidate.trigger } }]
                : [],
            ),
          ],
        },
        select: { id: true, slug: true, name: true, customLabel: true, triggerWords: true },
      }),
      loadFacetCatalogEntries({
        userId: ownerId,
        isAdmin: false,
        includeMature: matureVisible,
        taxonomies: ['SPECIES', 'OCCUPATION', 'ROLE', 'ARCHETYPE', 'SETTING'],
        take: 2000,
      }),
    ])

    const matches = reconcileZuzuResources(candidates, {
      character: characters,
      scenario: scenarios.map((record) => ({
        id: record.id,
        slug: record.slug,
        name: record.title,
      })),
      reward: rewards,
      'model-resource': resources.map((record) => ({
        id: record.id,
        slug: record.slug,
        name: record.customLabel || record.name,
        triggerWords: record.triggerWords,
      })),
    })
    const taggedFacets = facets
      .filter((facet) => facet.userId === ownerId)
      .filter((facet) => worldTags(facet.metadata).includes('zuzu'))
      .map((facet) => ({
        id: facet.id,
        title: facet.title,
        taxonomy: facet.taxonomy,
        isRandomizable: facet.isRandomizable,
        worlds: worldTags(facet.metadata),
      }))

    const data: ZuzuResourceAuditReport = {
      source: 'Conductor worlds/zuzu/resource-submissions.json (live read)',
      scopedTo: 'authenticated-admin-owned-records',
      matches,
      taggedFacets,
      counts: countZuzuMatches(matches),
    }
    return { success: true, data, statusCode: 200 }
  } catch (cause: unknown) {
    const handled = errorHandler(cause)
    event.node.res.statusCode = handled.statusCode || 503
    return {
      success: false,
      message: handled.message || 'Zuzu resource audit unavailable.',
      statusCode: event.node.res.statusCode,
    }
  }
})
