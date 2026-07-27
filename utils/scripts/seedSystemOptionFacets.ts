// Seed illustrated enum-backed Builder options as presentation Facets.
//
// This does not replace DreamType, RewardType, or Rarity persistence. The enum
// value is stored in metadata and remains the only value written to object rows.
import 'dotenv/config'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import {
  SYSTEM_OPTION_FACET_TARGETS,
  type SystemOptionFacetTarget,
} from './../seeds/facetSystemOptionArtwork'
import { prepareUniqueFacetAliases } from './../facetAliases'
import { imageSrcToMediaPath, mediaAssetExists } from './mediaContractSource'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
const apply = process.argv.includes('--apply')

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 220)
}

function taxonomyPrefix(target: SystemOptionFacetTarget): string {
  return target.taxonomy.toLowerCase().replaceAll('_', '-')
}

async function imageState(path: string): Promise<{
  imagePath?: string
  requestedImagePath: string
  artworkStatus: 'available' | 'missing'
}> {
  // public/images/** is git-ignored and served from the media host, so a local
  // existsSync check reports live art as missing in CI/production. Treat the
  // asset as present if it exists locally OR on the media mount.
  const available =
    path.startsWith('/images/') &&
    (existsSync(resolve(process.cwd(), 'public', path.slice(1))) ||
      (await mediaAssetExists(imageSrcToMediaPath(path))))
  return {
    imagePath: available ? path : undefined,
    requestedImagePath: path,
    artworkStatus: available ? 'available' : 'missing',
  }
}

async function saveTarget(target: SystemOptionFacetTarget): Promise<'created' | 'updated'> {
  const prefix = taxonomyPrefix(target)
  const slug = `${prefix}-${slugify(target.enumValue)}`
  const art = await imageState(target.path)
  const metadata = JSON.stringify({
    source: 'system-builder',
    structuralEnum: true,
    fieldKey: target.fieldKey,
    enumValue: target.enumValue,
    requestedImagePath: art.requestedImagePath,
    artworkStatus: art.artworkStatus,
    artworkPrompt: target.prompt,
  })

  const existing = await prisma.facet.findUnique({ where: { slug } })
  const facet = existing
    ? await prisma.facet.update({
        where: { id: existing.id },
        data: {
          title: target.label,
          description: target.description,
          imagePath: existing.imagePath || art.imagePath,
          designer: existing.designer || 'facet-catalog',
          isPublic: true,
          isMature: false,
          isActive: true,
        },
      })
    : await prisma.facet.create({
        data: {
          title: target.label,
          slug,
          kind: 'OTHER',
          description: target.description,
          imagePath: art.imagePath,
          designer: 'facet-catalog',
          creationSource: 'HUMAN',
          userId: 1,
          isPublic: true,
          isMature: false,
          isActive: true,
        },
      })

  await prisma.facetProfile.upsert({
    where: { facetId: facet.id },
    create: {
      facetId: facet.id,
      taxonomy: target.taxonomy,
      canonicalValue: `${prefix}:${target.enumValue}`,
      groupKey: target.groupKey,
      groupLabel: target.groupLabel,
      sortOrder: SYSTEM_OPTION_FACET_TARGETS.indexOf(target),
      isRandomizable: false,
      randomWeight: 0,
      artRequired: true,
      sourceRank: 4,
      metadata,
    },
    update: {
      taxonomy: target.taxonomy,
      canonicalValue: `${prefix}:${target.enumValue}`,
      groupKey: target.groupKey,
      groupLabel: target.groupLabel,
      sortOrder: SYSTEM_OPTION_FACET_TARGETS.indexOf(target),
      isRandomizable: false,
      randomWeight: 0,
      artRequired: true,
      sourceRank: 4,
      metadata,
    },
  })

  for (const alias of prepareUniqueFacetAliases([
    slug,
    `${target.groupLabel} ${target.enumValue}`,
    `${prefix} ${target.enumValue}`,
  ])) {
    const owner = await prisma.facetAlias.findUnique({
      where: { lookupKey: alias.lookupKey },
      select: { facetId: true },
    })
    if (owner && owner.facetId !== facet.id) continue
    await prisma.facetAlias.upsert({
      where: { lookupKey: alias.lookupKey },
      create: {
        facetId: facet.id,
        alias: alias.alias,
        lookupKey: alias.lookupKey,
        isCanonical: alias.lookupKey === slug.replaceAll('-', ''),
        isActive: true,
      },
      update: {
        facetId: facet.id,
        alias: alias.alias,
        isActive: true,
      },
    })
  }

  return existing ? 'updated' : 'created'
}

async function main(): Promise<void> {
  const counts = new Map<string, number>()
  for (const target of SYSTEM_OPTION_FACET_TARGETS) {
    counts.set(target.taxonomy, (counts.get(target.taxonomy) ?? 0) + 1)
  }

  const artStates = await Promise.all(
    SYSTEM_OPTION_FACET_TARGETS.map((target) => imageState(target.path)),
  )
  const missingArtwork = SYSTEM_OPTION_FACET_TARGETS.filter(
    (_, index) => artStates[index]!.artworkStatus === 'missing',
  )

  process.stdout.write(
    `System option Facet plan: ${SYSTEM_OPTION_FACET_TARGETS.length} entries (` +
      Array.from(counts.entries())
        .map(([taxonomy, count]) => `${taxonomy}=${count}`)
        .join(', ') +
      `), missing artwork=${missingArtwork.length}.\n`,
  )

  if (!apply) {
    process.stdout.write('Dry run only. Pass --apply to write system option Facets.\n')
    return
  }

  let created = 0
  let updated = 0
  for (const target of SYSTEM_OPTION_FACET_TARGETS) {
    const result = await saveTarget(target)
    if (result === 'created') created++
    else updated++
  }

  process.stdout.write(
    `System option Facets applied: created=${created}, updated=${updated}.\n`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
