// /utils/scripts/cleanupRetiredFacetShells.ts
//
// Removes obsolete Facet rows after every curation/merge pass. Retired merge
// shells are not history records: all live edges, aliases, artwork, and queued
// entity-art jobs are moved to the canonical Facet, then the shell is deleted.
// Genre-recipe rows are transient migration scaffolding and are deleted outright.

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import type { PrismaClient } from './../../prisma/generated/prisma/client'
import {
  parseArtJobPayload,
  serializeArtJobPayload,
} from './../../server/utils/artJobPayload'
import { normalizeFacetLookupKey } from './../facetAliases'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './../../scripts/lib/databaseRetry'

const APPLY = process.argv.includes('--apply')
const BATCH_ID = '2026-08-01-retired-facet-cleanup-10'
const MERGED_SLUG_PATTERN = /-merged-\d+$/

type JsonObject = Record<string, unknown>
type Db = PrismaClient

type FacetRecord = Awaited<ReturnType<Db['facet']['findUnique']>>

type CleanupResult = {
  id: number
  title: string
  action: string
  canonicalId?: number
  canonicalTitle?: string
  artImageLinks?: number
  artCollectionLinks?: number
  artJobs?: number
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

function parseMetadata(value: string | null | undefined): JsonObject {
  if (!value) return {}
  try {
    return asObject(JSON.parse(value))
  } catch {
    return {}
  }
}

function positiveInteger(value: unknown): number | null {
  const numberValue = Number(value)
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null
}

function stripRetiredMergeMetadata(value: JsonObject): JsonObject {
  const cleaned = { ...value }
  for (const key of [
    'mergedFacetSources',
    'mergedArtworkPaths',
    'mergedDuplicateFacetId',
    'mergedDuplicateSlug',
    'mergedIntoFacetId',
    'canonicalFacetId',
    'duplicateFacetId',
    'canonicalSlug',
    'duplicateSlug',
  ]) {
    delete cleaned[key]
  }
  return cleaned
}

async function installAlias(
  prisma: Db,
  facetId: number,
  aliasValue: string | null | undefined,
): Promise<void> {
  const alias = String(aliasValue || '').trim()
  const lookupKey = normalizeFacetLookupKey(alias)
  if (!alias || !lookupKey || !APPLY) return

  const conflict = await prisma.facetAlias.findUnique({ where: { lookupKey } })
  if (conflict && conflict.facetId !== facetId) {
    await prisma.facetAlias.delete({ where: { lookupKey } })
  }

  await prisma.facetAlias.upsert({
    where: { lookupKey },
    create: {
      facetId,
      alias,
      lookupKey,
      isCanonical: false,
      isActive: true,
    },
    update: {
      facetId,
      alias,
      isCanonical: false,
      isActive: true,
    },
  })
}

async function findCanonicalFacet(
  prisma: Db,
  duplicate: NonNullable<FacetRecord>,
): Promise<NonNullable<FacetRecord> | null> {
  const profile = await prisma.facetProfile.findUnique({
    where: { facetId: duplicate.id },
  })
  const metadata = parseMetadata(profile?.metadata)
  const canonicalId =
    positiveInteger(metadata.mergedIntoFacetId) ??
    positiveInteger(metadata.canonicalFacetId)

  if (canonicalId && canonicalId !== duplicate.id) {
    const byId = await prisma.facet.findUnique({ where: { id: canonicalId } })
    if (byId) return byId
  }

  const canonicalSlug = String(metadata.canonicalSlug || '').trim()
  if (canonicalSlug) {
    const bySlug = await prisma.facet.findUnique({ where: { slug: canonicalSlug } })
    if (bySlug && bySlug.id !== duplicate.id) return bySlug
  }

  return null
}

function replaceFacetJobPayload(
  rawPayload: string,
  duplicate: NonNullable<FacetRecord>,
  canonical: NonNullable<FacetRecord>,
): string | null {
  const payload = parseArtJobPayload(rawPayload)
  let changed = false

  const entityArt = asObject(payload.entityArt)
  if (
    entityArt.entityType === 'facet' &&
    Number(entityArt.entityId) === duplicate.id
  ) {
    payload.entityArt = { ...entityArt, entityId: canonical.id }
    changed = true
  }

  if (Array.isArray(payload.facets)) {
    payload.facets = payload.facets.map((entry) => {
      const facet = asObject(entry)
      if (Number(facet.id) !== duplicate.id) return entry
      changed = true
      return {
        ...facet,
        id: canonical.id,
        title: canonical.title,
        slug: canonical.slug,
        artPrompt: canonical.artPrompt,
        imagePath: canonical.imagePath,
        cardPath: canonical.cardPath,
        heroPath: canonical.heroPath,
      }
    })
  }

  const provenance = asObject(payload.provenance)
  if (typeof provenance.idempotencyKey === 'string') {
    const updated = provenance.idempotencyKey.replace(
      `facet:${duplicate.id}:`,
      `facet:${canonical.id}:`,
    )
    if (updated !== provenance.idempotencyKey) {
      payload.provenance = { ...provenance, idempotencyKey: updated }
      changed = true
    }
  }

  return changed ? serializeArtJobPayload(payload) : null
}

async function migrateArtJobs(
  prisma: Db,
  duplicate: NonNullable<FacetRecord>,
  canonical: NonNullable<FacetRecord>,
): Promise<number> {
  const jobs = await prisma.artJob.findMany({
    where: {
      payload: {
        contains: `\"entityType\":\"facet\",\"entityId\":${duplicate.id},`,
      },
    },
    select: { id: true, payload: true },
  })

  let updated = 0
  for (const job of jobs) {
    const payload = replaceFacetJobPayload(job.payload, duplicate, canonical)
    if (!payload) continue
    if (APPLY) {
      await prisma.artJob.update({ where: { id: job.id }, data: { payload } })
    }
    updated += 1
  }
  return updated
}

async function migrateMergedShell(
  prisma: Db,
  duplicate: NonNullable<FacetRecord>,
  canonical: NonNullable<FacetRecord>,
): Promise<CleanupResult> {
  const [
    canonicalProfile,
    duplicateProfile,
    aliases,
    characterLinks,
    botLinks,
    rewardLinks,
    dreamLinks,
    scenarioLinks,
    artImageLinks,
    artCollectionLinks,
    relations,
    artJobs,
  ] = await Promise.all([
    prisma.facetProfile.findUnique({ where: { facetId: canonical.id } }),
    prisma.facetProfile.findUnique({ where: { facetId: duplicate.id } }),
    prisma.facetAlias.findMany({ where: { facetId: duplicate.id } }),
    prisma.characterFacet.findMany({
      where: { facetId: duplicate.id },
      select: {
        characterId: true,
        fieldKey: true,
        sortOrder: true,
        weight: true,
        source: true,
      },
    }),
    prisma.botFacet.findMany({
      where: { facetId: duplicate.id },
      select: {
        botId: true,
        fieldKey: true,
        sortOrder: true,
        weight: true,
        source: true,
      },
    }),
    prisma.rewardFacet.findMany({
      where: { facetId: duplicate.id },
      select: {
        rewardId: true,
        fieldKey: true,
        sortOrder: true,
        weight: true,
        source: true,
      },
    }),
    prisma.dreamFacet.findMany({
      where: { facetId: duplicate.id },
      select: { dreamId: true },
    }),
    prisma.scenarioFacet.findMany({
      where: { facetId: duplicate.id },
      select: { scenarioId: true },
    }),
    prisma.facetArtImage.findMany({
      where: { facetId: duplicate.id },
      select: { artImageId: true },
    }),
    prisma.facetArtCollection.findMany({
      where: { facetId: duplicate.id },
      select: { artCollectionId: true },
    }),
    prisma.facetRelation.findMany({
      where: {
        OR: [{ fromFacetId: duplicate.id }, { toFacetId: duplicate.id }],
      },
      select: {
        fromFacetId: true,
        toFacetId: true,
        relationType: true,
        note: true,
      },
    }),
    migrateArtJobs(prisma, duplicate, canonical),
  ])

  if (APPLY) {
    if (characterLinks.length) {
      await prisma.characterFacet.createMany({
        data: characterLinks.map((link) => ({ ...link, facetId: canonical.id })),
        skipDuplicates: true,
      })
    }
    if (botLinks.length) {
      await prisma.botFacet.createMany({
        data: botLinks.map((link) => ({ ...link, facetId: canonical.id })),
        skipDuplicates: true,
      })
    }
    if (rewardLinks.length) {
      await prisma.rewardFacet.createMany({
        data: rewardLinks.map((link) => ({ ...link, facetId: canonical.id })),
        skipDuplicates: true,
      })
    }
    if (dreamLinks.length) {
      await prisma.dreamFacet.createMany({
        data: dreamLinks.map((link) => ({ ...link, facetId: canonical.id })),
        skipDuplicates: true,
      })
    }
    if (scenarioLinks.length) {
      await prisma.scenarioFacet.createMany({
        data: scenarioLinks.map((link) => ({ ...link, facetId: canonical.id })),
        skipDuplicates: true,
      })
    }

    const artImageIds = new Set([
      ...artImageLinks.map((link) => link.artImageId),
      ...(duplicate.artImageId ? [duplicate.artImageId] : []),
    ])
    if (artImageIds.size) {
      await prisma.facetArtImage.createMany({
        data: [...artImageIds].map((artImageId) => ({
          facetId: canonical.id,
          artImageId,
        })),
        skipDuplicates: true,
      })
    }

    const artCollectionIds = new Set([
      ...artCollectionLinks.map((link) => link.artCollectionId),
      ...(duplicate.artCollectionId ? [duplicate.artCollectionId] : []),
    ])
    if (artCollectionIds.size) {
      await prisma.facetArtCollection.createMany({
        data: [...artCollectionIds].map((artCollectionId) => ({
          facetId: canonical.id,
          artCollectionId,
        })),
        skipDuplicates: true,
      })
    }

    const mappedRelations = relations
      .map((relation) => ({
        ...relation,
        fromFacetId:
          relation.fromFacetId === duplicate.id
            ? canonical.id
            : relation.fromFacetId,
        toFacetId:
          relation.toFacetId === duplicate.id
            ? canonical.id
            : relation.toFacetId,
      }))
      .filter((relation) => relation.fromFacetId !== relation.toFacetId)
    if (mappedRelations.length) {
      await prisma.facetRelation.createMany({
        data: mappedRelations,
        skipDuplicates: true,
      })
    }

    await prisma.reaction.updateMany({
      where: { facetId: duplicate.id },
      data: { facetId: canonical.id },
    })

    await prisma.facet.update({
      where: { id: canonical.id },
      data: {
        description: canonical.description || duplicate.description,
        flavorText: canonical.flavorText || duplicate.flavorText,
        examples: canonical.examples || duplicate.examples,
        artPrompt: canonical.artPrompt || duplicate.artPrompt,
        imagePath: canonical.imagePath || duplicate.imagePath,
        cardPath: canonical.cardPath || duplicate.cardPath,
        heroPath: canonical.heroPath || duplicate.heroPath,
        icon: canonical.icon || duplicate.icon,
        artImageId: canonical.artImageId ?? duplicate.artImageId,
        artCollectionId:
          canonical.artCollectionId ?? duplicate.artCollectionId,
        isActive: true,
      },
    })

    const canonicalMetadata = stripRetiredMergeMetadata(
      parseMetadata(canonicalProfile?.metadata),
    )
    const duplicateMetadata = stripRetiredMergeMetadata(
      parseMetadata(duplicateProfile?.metadata),
    )
    if (canonicalProfile || duplicateProfile) {
      await prisma.facetProfile.upsert({
        where: { facetId: canonical.id },
        create: {
          facetId: canonical.id,
          taxonomy: canonicalProfile?.taxonomy ?? duplicateProfile?.taxonomy ?? 'OTHER',
          canonicalValue:
            canonicalProfile?.canonicalValue ??
            duplicateProfile?.canonicalValue ??
            canonical.title,
          groupKey: canonicalProfile?.groupKey ?? duplicateProfile?.groupKey,
          groupLabel: canonicalProfile?.groupLabel ?? duplicateProfile?.groupLabel,
          sortOrder: canonicalProfile?.sortOrder ?? duplicateProfile?.sortOrder ?? 0,
          isRandomizable:
            canonicalProfile?.isRandomizable ??
            duplicateProfile?.isRandomizable ??
            true,
          randomWeight: Math.max(
            canonicalProfile?.randomWeight ?? 0,
            duplicateProfile?.randomWeight ?? 0,
          ),
          artRequired:
            canonicalProfile?.artRequired ?? duplicateProfile?.artRequired ?? true,
          sourceRank: Math.min(
            canonicalProfile?.sourceRank ?? 100,
            duplicateProfile?.sourceRank ?? 100,
          ),
          metadata: JSON.stringify({
            ...duplicateMetadata,
            ...canonicalMetadata,
            catalogCleanup: { batchId: BATCH_ID, action: 'merged-shell-removed' },
          }),
        },
        update: {
          metadata: JSON.stringify({
            ...duplicateMetadata,
            ...canonicalMetadata,
            catalogCleanup: { batchId: BATCH_ID, action: 'merged-shell-removed' },
          }),
        },
      })
    }

    await Promise.all([
      prisma.characterFacet.deleteMany({ where: { facetId: duplicate.id } }),
      prisma.botFacet.deleteMany({ where: { facetId: duplicate.id } }),
      prisma.rewardFacet.deleteMany({ where: { facetId: duplicate.id } }),
      prisma.dreamFacet.deleteMany({ where: { facetId: duplicate.id } }),
      prisma.scenarioFacet.deleteMany({ where: { facetId: duplicate.id } }),
      prisma.facetArtImage.deleteMany({ where: { facetId: duplicate.id } }),
      prisma.facetArtCollection.deleteMany({ where: { facetId: duplicate.id } }),
      prisma.facetRelation.deleteMany({
        where: {
          OR: [{ fromFacetId: duplicate.id }, { toFacetId: duplicate.id }],
        },
      }),
      prisma.facetAlias.deleteMany({ where: { facetId: duplicate.id } }),
      prisma.facetProfile.deleteMany({ where: { facetId: duplicate.id } }),
    ])
    await prisma.facet.delete({ where: { id: duplicate.id } })

    for (const alias of new Set([
      duplicate.title,
      duplicate.slug || '',
      ...aliases.map((entry) => entry.alias),
    ])) {
      await installAlias(prisma, canonical.id, alias)
    }
  }

  return {
    id: duplicate.id,
    title: duplicate.title,
    canonicalId: canonical.id,
    canonicalTitle: canonical.title,
    artImageLinks: artImageLinks.length + (duplicate.artImageId ? 1 : 0),
    artCollectionLinks:
      artCollectionLinks.length + (duplicate.artCollectionId ? 1 : 0),
    artJobs,
    action: APPLY ? 'migrated-and-deleted' : 'would-migrate-and-delete',
  }
}

async function deleteFacetCompletely(
  prisma: Db,
  facet: NonNullable<FacetRecord>,
): Promise<void> {
  if (!APPLY) return
  await Promise.all([
    prisma.characterFacet.deleteMany({ where: { facetId: facet.id } }),
    prisma.botFacet.deleteMany({ where: { facetId: facet.id } }),
    prisma.rewardFacet.deleteMany({ where: { facetId: facet.id } }),
    prisma.dreamFacet.deleteMany({ where: { facetId: facet.id } }),
    prisma.scenarioFacet.deleteMany({ where: { facetId: facet.id } }),
    prisma.facetArtImage.deleteMany({ where: { facetId: facet.id } }),
    prisma.facetArtCollection.deleteMany({ where: { facetId: facet.id } }),
    prisma.facetRelation.deleteMany({
      where: { OR: [{ fromFacetId: facet.id }, { toFacetId: facet.id }] },
    }),
    prisma.facetAlias.deleteMany({ where: { facetId: facet.id } }),
    prisma.facetProfile.deleteMany({ where: { facetId: facet.id } }),
    prisma.reaction.deleteMany({ where: { facetId: facet.id } }),
  ])
  await prisma.facet.delete({ where: { id: facet.id } })
}

async function stripHistoricalMetadata(prisma: Db): Promise<number> {
  const profiles = await prisma.facetProfile.findMany({
    where: {
      OR: [
        { metadata: { contains: 'mergedFacetSources' } },
        { metadata: { contains: 'mergedArtworkPaths' } },
        { metadata: { contains: 'mergedDuplicateFacetId' } },
        { metadata: { contains: 'mergedIntoFacetId' } },
      ],
    },
    select: { facetId: true, metadata: true },
  })

  let changed = 0
  for (const profile of profiles) {
    const original = parseMetadata(profile.metadata)
    const cleaned = stripRetiredMergeMetadata(original)
    if (JSON.stringify(original) === JSON.stringify(cleaned)) continue
    if (APPLY) {
      await prisma.facetProfile.update({
        where: { facetId: profile.facetId },
        data: { metadata: JSON.stringify(cleaned) },
      })
    }
    changed += 1
  }
  return changed
}

async function main(): Promise<void> {
  await withDatabaseRetry('retired Facet cleanup', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const mergedShells = await prisma.facet.findMany({
        where: {
          OR: [
            { designer: 'facet-catalog-merged' },
            { slug: { contains: '-merged-' } },
          ],
        },
        orderBy: { id: 'asc' },
      })

      const merged: CleanupResult[] = []
      for (const shell of mergedShells) {
        if (!shell.slug || !MERGED_SLUG_PATTERN.test(shell.slug)) {
          // The designer marker is authoritative even if a legacy script used a
          // different slug suffix. Canonical metadata must still resolve it.
        }
        const canonical = await findCanonicalFacet(prisma, shell)
        if (!canonical) {
          throw new Error(
            `Retired merged Facet ${shell.id} (${shell.title}) has no canonical target.`,
          )
        }
        merged.push(await migrateMergedShell(prisma, shell, canonical))
      }

      const recipeProfiles = await prisma.facetProfile.findMany({
        where: { groupKey: 'genre-recipe' },
        select: { facetId: true },
      })
      const recipes: CleanupResult[] = []
      for (const profile of recipeProfiles) {
        const facet = await prisma.facet.findUnique({
          where: { id: profile.facetId },
        })
        if (!facet) continue
        if (APPLY) await deleteFacetCompletely(prisma, facet)
        recipes.push({
          id: facet.id,
          title: facet.title,
          action: APPLY ? 'deleted-recipe-shell' : 'would-delete-recipe-shell',
        })
      }

      const metadataCleaned = await stripHistoricalMetadata(prisma)
      const [remainingMergedShells, remainingRecipeProfiles] = await Promise.all([
        prisma.facet.count({
          where: {
            OR: [
              { designer: 'facet-catalog-merged' },
              { slug: { contains: '-merged-' } },
            ],
          },
        }),
        prisma.facetProfile.count({ where: { groupKey: 'genre-recipe' } }),
      ])

      const report = {
        mode: APPLY ? 'apply' : 'dry-run',
        batchId: BATCH_ID,
        merged,
        recipes,
        metadataCleaned,
        remainingMergedShells,
        remainingRecipeProfiles,
        policy:
          'Retired Facet shells are migration scaffolding, not historical records. Migrate live data, then physically delete them.',
      }
      console.log(JSON.stringify(report, null, 2))

      if (APPLY && (remainingMergedShells || remainingRecipeProfiles)) {
        throw new Error(
          `Facet cleanup incomplete: ${remainingMergedShells} merged shell(s), ${remainingRecipeProfiles} recipe shell(s).`,
        )
      }
    } finally {
      await prisma.$disconnect()
    }
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
