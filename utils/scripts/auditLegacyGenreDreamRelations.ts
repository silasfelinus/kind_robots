// utils/scripts/auditLegacyGenreDreamRelations.ts
import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
const generatedAt = new Date().toISOString()
const fileStamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-')
const outputArg = process.argv.find((argument) => argument.startsWith('--output='))
const outputPath = resolve(
  outputArg?.slice('--output='.length) ||
    `artifacts/genre-facet-audit/legacy-genre-relations-${fileStamp}.json`,
)
const stdoutOnly = process.argv.includes('--stdout-only')

function missingIds(expected: number[], actual: number[]): number[] {
  const actualSet = new Set(actual)
  return expected.filter((id) => !actualSet.has(id))
}

async function main() {
  const genreDreams = await prisma.dream.findMany({
    where: { dreamType: 'GENRE' },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      narratorId: true,
      artImageId: true,
      artCollectionId: true,
      Characters: { select: { id: true } },
      Rewards: { select: { id: true } },
      Bots: { select: { id: true } },
      Chats: { select: { id: true } },
      Reactions: { select: { id: true, facetId: true } },
      Scenarios: { select: { id: true } },
      ArtImages: { select: { id: true } },
      ArtCollections: { select: { id: true } },
      Todos: { select: { id: true, projectId: true } },
      Compositions: { select: { id: true } },
      SourceComposition: { select: { id: true } },
      PitchSheet: { select: { id: true, projectId: true } },
      LifeRuns: { select: { id: true } },
      FacetLinks: { select: { facetId: true } },
      RelationsFrom: {
        select: {
          id: true,
          relationType: true,
          note: true,
          toDreamId: true,
          ToDream: {
            select: { id: true, title: true, slug: true, dreamType: true },
          },
        },
      },
      RelationsTo: {
        select: {
          id: true,
          relationType: true,
          note: true,
          fromDreamId: true,
          FromDream: {
            select: { id: true, title: true, slug: true, dreamType: true },
          },
        },
      },
    },
  })

  const rows = []
  for (const dream of genreDreams) {
    const facet = dream.slug
      ? await prisma.facet.findUnique({
          where: { slug: dream.slug },
          select: {
            id: true,
            title: true,
            slug: true,
            kind: true,
            isActive: true,
            artImageId: true,
            artCollectionId: true,
            ArtImageLinks: { select: { artImageId: true } },
            ArtCollectionLinks: { select: { artCollectionId: true } },
            ScenarioLinks: { select: { scenarioId: true } },
          },
        })
      : null

    const expectedScenarioIds = dream.Scenarios.map((item) => item.id)
    const expectedArtImageIds = dream.ArtImages.map((item) => item.id)
    const expectedArtCollectionIds = dream.ArtCollections.map((item) => item.id)
    const expectedReactionIds = dream.Reactions.map((item) => item.id)

    const facetScenarioIds = facet
      ? facet.ScenarioLinks.map((item) => item.scenarioId)
      : []
    const facetArtImageIds = facet
      ? facet.ArtImageLinks.map((item) => item.artImageId)
      : []
    const facetArtCollectionIds = facet
      ? facet.ArtCollectionLinks.map((item) => item.artCollectionId)
      : []
    const facetReactionIds = facet
      ? dream.Reactions
          .filter((reaction) => reaction.facetId === facet.id)
          .map((reaction) => reaction.id)
      : []

    const relationEdges = [
      ...dream.RelationsFrom.map((edge) => ({
        id: edge.id,
        direction: 'from' as const,
        relationType: edge.relationType,
        note: edge.note,
        otherDream: edge.ToDream,
      })),
      ...dream.RelationsTo.map((edge) => ({
        id: edge.id,
        direction: 'to' as const,
        relationType: edge.relationType,
        note: edge.note,
        otherDream: edge.FromDream,
      })),
    ]

    const relationClassification = relationEdges.map((edge) => ({
      ...edge,
      target:
        edge.otherDream.dreamType === 'GENRE' && edge.otherDream.slug
          ? 'facet-relation'
          : 'manual-review',
    }))

    const blockers = {
      missingSlug: !dream.slug,
      missingFacet: !facet,
      missingScenarioFacetIds: missingIds(expectedScenarioIds, facetScenarioIds),
      missingFacetArtImageIds: missingIds(expectedArtImageIds, facetArtImageIds),
      missingFacetArtCollectionIds: missingIds(
        expectedArtCollectionIds,
        facetArtCollectionIds,
      ),
      missingFacetReactionIds: missingIds(expectedReactionIds, facetReactionIds),
      characterIdsWithoutFacetSchema: dream.Characters.map((item) => item.id),
      rewardIdsWithoutFacetSchema: dream.Rewards.map((item) => item.id),
      botIdsWithoutFacetSchema: dream.Bots.map((item) => item.id),
      chatIdsWithoutFacetSchema: dream.Chats.map((item) => item.id),
      todoIds: dream.Todos.map((item) => item.id),
      compositionIds: dream.Compositions.map((item) => item.id),
      sourceCompositionId: dream.SourceComposition?.id ?? null,
      pitchSheetId: dream.PitchSheet?.id ?? null,
      lifeRunIds: dream.LifeRuns.map((item) => item.id),
      narratorId: dream.narratorId,
      facetLinkIds: dream.FacetLinks.map((item) => item.facetId),
      relationEdges: relationClassification,
    }

    const blockerCount =
      Number(blockers.missingSlug) +
      Number(blockers.missingFacet) +
      blockers.missingScenarioFacetIds.length +
      blockers.missingFacetArtImageIds.length +
      blockers.missingFacetArtCollectionIds.length +
      blockers.missingFacetReactionIds.length +
      blockers.characterIdsWithoutFacetSchema.length +
      blockers.rewardIdsWithoutFacetSchema.length +
      blockers.botIdsWithoutFacetSchema.length +
      blockers.chatIdsWithoutFacetSchema.length +
      blockers.todoIds.length +
      blockers.compositionIds.length +
      Number(blockers.sourceCompositionId !== null) +
      Number(blockers.pitchSheetId !== null) +
      blockers.lifeRunIds.length +
      Number(blockers.narratorId !== null) +
      blockers.facetLinkIds.length +
      blockers.relationEdges.length

    rows.push({
      dream: { id: dream.id, title: dream.title, slug: dream.slug },
      facet: facet
        ? {
            id: facet.id,
            title: facet.title,
            slug: facet.slug,
            kind: facet.kind,
            isActive: facet.isActive,
          }
        : null,
      primaryParity: {
        artImage: dream.artImageId === (facet?.artImageId ?? null),
        artCollection:
          dream.artCollectionId === (facet?.artCollectionId ?? null),
      },
      counts: {
        characters: dream.Characters.length,
        rewards: dream.Rewards.length,
        bots: dream.Bots.length,
        chats: dream.Chats.length,
        reactions: dream.Reactions.length,
        scenarios: dream.Scenarios.length,
        artImages: dream.ArtImages.length,
        artCollections: dream.ArtCollections.length,
        todos: dream.Todos.length,
        compositions: dream.Compositions.length,
        sourceCompositions: Number(Boolean(dream.SourceComposition)),
        pitchSheets: Number(Boolean(dream.PitchSheet)),
        lifeRuns: dream.LifeRuns.length,
        facetLinks: dream.FacetLinks.length,
        relationEdges: relationEdges.length,
      },
      blockers,
      blockerCount,
      deletionReady: blockerCount === 0,
    })
  }

  const totals = rows.reduce(
    (result, row) => {
      result.characters += row.counts.characters
      result.rewards += row.counts.rewards
      result.bots += row.counts.bots
      result.chats += row.counts.chats
      result.reactions += row.counts.reactions
      result.scenarios += row.counts.scenarios
      result.artImages += row.counts.artImages
      result.artCollections += row.counts.artCollections
      result.todos += row.counts.todos
      result.compositions += row.counts.compositions
      result.sourceCompositions += row.counts.sourceCompositions
      result.pitchSheets += row.counts.pitchSheets
      result.lifeRuns += row.counts.lifeRuns
      result.facetLinks += row.counts.facetLinks
      result.relationEdges += row.counts.relationEdges
      result.blockers += row.blockerCount
      return result
    },
    {
      characters: 0,
      rewards: 0,
      bots: 0,
      chats: 0,
      reactions: 0,
      scenarios: 0,
      artImages: 0,
      artCollections: 0,
      todos: 0,
      compositions: 0,
      sourceCompositions: 0,
      pitchSheets: 0,
      lifeRuns: 0,
      facetLinks: 0,
      relationEdges: 0,
      blockers: 0,
    },
  )

  const report = {
    generatedAt,
    mode: 'read-only-audit',
    safety: {
      writesDatabase: false,
      deletesLegacyDreams: false,
      deletionRequiresZeroBlockers: true,
    },
    summary: {
      genreDreamCount: genreDreams.length,
      matchedFacetCount: rows.filter((row) => row.facet).length,
      deletionReadyCount: rows.filter((row) => row.deletionReady).length,
      blockerCount: totals.blockers,
      relationTotals: totals,
      schemaGaps: {
        characterFacet: totals.characters,
        rewardFacet: totals.rewards,
        botFacet: totals.bots,
        facetChat: totals.chats,
      },
    },
    rows,
  }

  const json = `${JSON.stringify(report, null, 2)}\n`
  if (!stdoutOnly) {
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, json, 'utf8')
    console.error(`Genre/Facet relation audit written to ${outputPath}`)
  }
  process.stdout.write(json)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
