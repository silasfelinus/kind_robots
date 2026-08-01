// /utils/scripts/auditFacetCatalogOddities.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'
import {
  auditFacetCatalog,
  type FacetAuditInput,
} from './../facetCatalogAudit'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({
  adapter: createDatabaseAdapter(databaseUrl),
})

function numericArgument(name: string, fallback: number): number {
  const prefix = `--${name}=`
  const raw = process.argv.find((argument) => argument.startsWith(prefix))
  if (!raw) return fallback
  const value = Number.parseInt(raw.slice(prefix.length), 10)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

const top = numericArgument('top', 60)
const strict = process.argv.includes('--strict')

async function main(): Promise<void> {
  const [facets, profiles, aliases, artImageLinks, artCollectionLinks] =
    await Promise.all([
      prisma.facet.findMany({
        where: { isActive: true },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          flavorText: true,
          examples: true,
          artPrompt: true,
          imagePath: true,
          cardPath: true,
          heroPath: true,
          icon: true,
          artImageId: true,
          artCollectionId: true,
        },
      }),
      prisma.facetProfile.findMany({
        select: {
          facetId: true,
          taxonomy: true,
          groupKey: true,
          groupLabel: true,
          isRandomizable: true,
          randomWeight: true,
          sourceRank: true,
        },
      }),
      prisma.facetAlias.findMany({
        where: { isActive: true },
        select: { facetId: true, alias: true },
      }),
      prisma.facetArtImage.findMany({ select: { facetId: true } }),
      prisma.facetArtCollection.findMany({ select: { facetId: true } }),
    ])

  const profilesByFacet = new Map(
    profiles.map((profile) => [profile.facetId, profile]),
  )
  const aliasesByFacet = new Map<number, string[]>()
  for (const alias of aliases) {
    const entries = aliasesByFacet.get(alias.facetId) ?? []
    entries.push(alias.alias)
    aliasesByFacet.set(alias.facetId, entries)
  }
  const artImageFacetIds = new Set(artImageLinks.map((link) => link.facetId))
  const artCollectionFacetIds = new Set(
    artCollectionLinks.map((link) => link.facetId),
  )

  const inputs: FacetAuditInput[] = facets.map((facet) => {
    const profile = profilesByFacet.get(facet.id)
    return {
      id: facet.id,
      title: facet.title,
      slug: facet.slug,
      taxonomy: profile?.taxonomy ?? null,
      groupKey: profile?.groupKey ?? null,
      groupLabel: profile?.groupLabel ?? null,
      isRandomizable: profile?.isRandomizable ?? false,
      randomWeight: profile?.randomWeight ?? 0,
      sourceRank: profile?.sourceRank ?? null,
      description: facet.description,
      flavorText: facet.flavorText,
      examples: facet.examples,
      artPrompt: facet.artPrompt,
      aliases: aliasesByFacet.get(facet.id) ?? [],
      artBacked: Boolean(
        facet.imagePath ||
          facet.cardPath ||
          facet.heroPath ||
          facet.icon ||
          facet.artImageId !== null ||
          facet.artCollectionId !== null ||
          artImageFacetIds.has(facet.id) ||
          artCollectionFacetIds.has(facet.id),
      ),
    }
  })

  const report = auditFacetCatalog(inputs)
  const critical = report.candidates.filter((candidate) => candidate.score >= 6)
  const output = {
    generatedAt: new Date().toISOString(),
    mode: strict ? 'strict' : 'report',
    policy: {
      artBacked:
        'Preserve the Facet row, artwork, prompt, and tone. Prefer reclassification, relationships, aliases, or recipe decomposition.',
      exactSynonym:
        'Merge only after migrating every assignment, reaction, alias, relation, and artwork edge.',
      nearSynonym:
        'Keep distinct and connect with RELATED rather than forcing an alias.',
      composite:
        'Keep the historic row as a nonrandom recipe and create reusable component Facets.',
      lowValue:
        'Remove from random selection before considering deletion.',
    },
    totals: report.totals,
    byTaxonomy: report.byTaxonomy,
    byReason: report.byReason,
    duplicateClusters: report.duplicateClusters,
    candidates: report.candidates.slice(0, top).map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      slug: candidate.slug,
      taxonomy: candidate.taxonomy,
      score: candidate.score,
      artBacked: candidate.artBacked,
      preservationMode: candidate.preservationMode,
      actionHint: candidate.actionHint,
      isRandomizable: candidate.isRandomizable,
      randomWeight: candidate.randomWeight,
      sourceRank: candidate.sourceRank,
      reasons: candidate.reasons,
    })),
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)

  if (strict) {
    const missingProfiles = critical.filter((candidate) =>
      candidate.reasons.some((reason) => reason.code === 'missing-profile'),
    )
    const duplicateTitles = report.duplicateClusters.length
    if (missingProfiles.length || duplicateTitles) {
      throw new Error(
        `Strict Facet audit failed: ${missingProfiles.length} active Facets lack profiles and ${duplicateTitles} duplicate-title clusters remain.`,
      )
    }
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
