// utils/scripts/backfillProjectDreamFacet.ts
import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })
const args = new Set(process.argv.slice(2))
const apply = args.has('--apply')
const projectsOnly = args.has('--projects-only')
const facetsOnly = args.has('--facets-only')

if (projectsOnly && facetsOnly) {
  throw new Error('Use at most one of --projects-only or --facets-only')
}

const generatedAt = new Date().toISOString()
const fileStamp = generatedAt.replaceAll(':', '-').replaceAll('.', '-')
const outputArg = process.argv.find((argument) => argument.startsWith('--output='))
const outputPath = resolve(
  outputArg?.slice('--output='.length) ||
    `artifacts/schema-backfill/project-dream-facet-${apply ? 'apply' : 'dry-run'}-${fileStamp}.json`,
)

async function writeReport(report: unknown): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.error(`Schema backfill report written to ${outputPath}`)
}

const mapPriority = (priority: string | null): 'LOW' | 'NORMAL' | 'HIGH' => {
  if (priority === 'LOW' || priority === 'HIGH') return priority
  return 'NORMAL'
}

async function assertAdditiveSchemaApplied(): Promise<void> {
  try {
    await prisma.project.count()
    await prisma.facet.count()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `The additive Project/Facet migration is not available. Run npm run prisma:migrate before --apply. ${message}`,
    )
  }
}

async function main(): Promise<void> {
  const projectDreams = projectsOnly || !facetsOnly
    ? await prisma.dream.findMany({
        where: { dreamType: 'PROJECT' },
        orderBy: { id: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          flavorText: true,
          goal: true,
          waypoints: true,
          projectStatus: true,
          priority: true,
          repoUrl: true,
          liveUrl: true,
          allowReviews: true,
          highlightImage: true,
          icon: true,
          imagePath: true,
          cardPath: true,
          heroPath: true,
          designer: true,
          creationSource: true,
          userId: true,
          artImageId: true,
          artCollectionId: true,
          isPublic: true,
          isMature: true,
          isActive: true,
          PitchSheet: { select: { id: true } },
          ArtImages: { select: { id: true } },
          ArtCollections: { select: { id: true } },
          _count: {
            select: {
              Chats: true,
              Todos: true,
              Reactions: true,
              Characters: true,
              Rewards: true,
              Scenarios: true,
              Bots: true,
            },
          },
        },
      })
    : []

  const genreDreams = facetsOnly || !projectsOnly
    ? await prisma.dream.findMany({
        where: { dreamType: 'GENRE' },
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
          designer: true,
          creationSource: true,
          userId: true,
          artImageId: true,
          artCollectionId: true,
          isPublic: true,
          isMature: true,
          isActive: true,
          Scenarios: { select: { id: true } },
          ArtImages: { select: { id: true } },
          ArtCollections: { select: { id: true } },
          _count: {
            select: {
              Characters: true,
              Rewards: true,
              Scenarios: true,
              Bots: true,
              Chats: true,
            },
          },
        },
      })
    : []

  const missingProjectSlugs = projectDreams.filter((dream) => !dream.slug)
  const missingFacetSlugs = genreDreams.filter((dream) => !dream.slug)
  const projectDreamsWithCreativeRelations = projectDreams.filter(
    (dream) =>
      dream._count.Characters > 0 ||
      dream._count.Rewards > 0 ||
      dream._count.Scenarios > 0 ||
      dream._count.Bots > 0,
  )

  const plan = {
    generatedAt,
    mode: apply ? 'apply' : 'dry-run',
    safety: {
      deletesLegacyDreams: false,
      clearsLegacyDreamRelations: false,
      projectScopedRowsKeepDreamId: true,
      genreWorldInfrastructureRemainsOnLegacyDream: true,
      pitchSheetsMoveOnlyWhenTheirOwnerIsAProjectDream: true,
    },
    summary: {
      projectDreams: projectDreams.length,
      genreDreams: genreDreams.length,
      missingProjectSlugs: missingProjectSlugs.length,
      missingFacetSlugs: missingFacetSlugs.length,
      projectDreamsWithCreativeRelations: projectDreamsWithCreativeRelations.length,
      projectPitchSheets: projectDreams.filter((dream) => Boolean(dream.PitchSheet)).length,
      projectChatsToDualLink: projectDreams.reduce((sum, dream) => sum + dream._count.Chats, 0),
      projectTodosToDualLink: projectDreams.reduce((sum, dream) => sum + dream._count.Todos, 0),
      projectReactionsToDualLink: projectDreams.reduce(
        (sum, dream) => sum + dream._count.Reactions,
        0,
      ),
      facetScenarioLinksToCreate: genreDreams.reduce(
        (sum, dream) => sum + dream.Scenarios.length,
        0,
      ),
      legacyFacetCharacterLinksPreserved: genreDreams.reduce(
        (sum, dream) => sum + dream._count.Characters,
        0,
      ),
    },
    blockers: {
      missingProjectSlugs: missingProjectSlugs.map(({ id, title }) => ({ id, title })),
      missingFacetSlugs: missingFacetSlugs.map(({ id, title }) => ({ id, title })),
      projectDreamsWithCreativeRelations: projectDreamsWithCreativeRelations.map(
        ({ id, title, slug, _count }) => ({ id, title, slug, _count }),
      ),
    },
    projects: projectDreams.map((dream) => ({
      sourceDreamId: dream.id,
      title: dream.title,
      slug: dream.slug,
      pitchSheetId: dream.PitchSheet?.id ?? null,
      counts: dream._count,
      artImageLinks: dream.ArtImages.length,
      artCollectionLinks: dream.ArtCollections.length,
    })),
    facets: genreDreams.map((dream) => ({
      sourceDreamId: dream.id,
      title: dream.title,
      slug: dream.slug,
      scenarioLinks: dream.Scenarios.length,
      counts: dream._count,
      preservedOnLegacyDream: {
        characters: dream._count.Characters,
        rewards: dream._count.Rewards,
        bots: dream._count.Bots,
        chats: dream._count.Chats,
      },
    })),
  }

  if (!apply) {
    await writeReport(plan)
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
    return
  }

  if (missingProjectSlugs.length || missingFacetSlugs.length) {
    await writeReport(plan)
    throw new Error('Backfill stopped because one or more source Dreams have no slug.')
  }

  if (projectDreamsWithCreativeRelations.length) {
    await writeReport(plan)
    throw new Error(
      'Backfill stopped because a Project Dream owns creative world relations. Review the report before applying.',
    )
  }

  await assertAdditiveSchemaApplied()
  const projectResults = []

  for (const dream of projectDreams) {
    const slug = dream.slug as string
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.upsert({
        where: { slug },
        create: {
          title: dream.title,
          slug,
          conductorSlug: slug,
          description: dream.description,
          flavorText: dream.flavorText,
          goal: dream.goal,
          waypoints: dream.waypoints,
          status: dream.projectStatus ?? 'BRAINSTORM',
          priority: mapPriority(dream.priority),
          repoUrl: dream.repoUrl,
          liveUrl: dream.liveUrl,
          allowReviews: dream.allowReviews,
          highlightImage: dream.highlightImage,
          icon: dream.icon,
          imagePath: dream.imagePath,
          cardPath: dream.cardPath,
          heroPath: dream.heroPath,
          designer: dream.designer,
          creationSource: dream.creationSource,
          userId: dream.userId ?? 10,
          artImageId: dream.artImageId,
          artCollectionId: dream.artCollectionId,
          isPublic: dream.isPublic,
          isMature: dream.isMature,
          isActive: dream.isActive,
        },
        update: {
          title: dream.title,
          conductorSlug: slug,
          description: dream.description,
          flavorText: dream.flavorText,
          goal: dream.goal,
          waypoints: dream.waypoints,
          status: dream.projectStatus ?? 'BRAINSTORM',
          priority: mapPriority(dream.priority),
          repoUrl: dream.repoUrl,
          liveUrl: dream.liveUrl,
          allowReviews: dream.allowReviews,
          highlightImage: dream.highlightImage,
          icon: dream.icon,
          imagePath: dream.imagePath,
          cardPath: dream.cardPath,
          heroPath: dream.heroPath,
          designer: dream.designer,
          creationSource: dream.creationSource,
          userId: dream.userId ?? 10,
          artImageId: dream.artImageId,
          artCollectionId: dream.artCollectionId,
          isPublic: dream.isPublic,
          isMature: dream.isMature,
          isActive: dream.isActive,
        },
      })

      for (const artImage of dream.ArtImages) {
        await tx.projectArtImage.upsert({
          where: { projectId_artImageId: { projectId: project.id, artImageId: artImage.id } },
          create: { projectId: project.id, artImageId: artImage.id },
          update: {},
        })
      }

      for (const artCollection of dream.ArtCollections) {
        await tx.projectArtCollection.upsert({
          where: {
            projectId_artCollectionId: {
              projectId: project.id,
              artCollectionId: artCollection.id,
            },
          },
          create: { projectId: project.id, artCollectionId: artCollection.id },
          update: {},
        })
      }

      const chats = await tx.chat.updateMany({
        where: { dreamId: dream.id },
        data: { projectId: project.id },
      })
      const todos = await tx.todo.updateMany({
        where: { dreamId: dream.id },
        data: { projectId: project.id },
      })
      const reactions = await tx.reaction.updateMany({
        where: { dreamId: dream.id },
        data: { projectId: project.id },
      })
      const artJobs = await tx.artJob.updateMany({
        where: { projectSlug: slug },
        data: { projectId: project.id },
      })

      if (dream.PitchSheet) {
        await tx.pitchSheet.update({
          where: { id: dream.PitchSheet.id },
          data: { dreamId: null, projectId: project.id },
        })
      }

      return {
        sourceDreamId: dream.id,
        projectId: project.id,
        slug,
        chatsLinked: chats.count,
        todosLinked: todos.count,
        reactionsLinked: reactions.count,
        artJobsLinked: artJobs.count,
        pitchSheetMoved: Boolean(dream.PitchSheet),
        artImagesLinked: dream.ArtImages.length,
        artCollectionsLinked: dream.ArtCollections.length,
      }
    })
    projectResults.push(result)
  }

  const facetResults = []

  for (const dream of genreDreams) {
    const slug = dream.slug as string
    const result = await prisma.$transaction(async (tx) => {
      const facet = await tx.facet.upsert({
        where: { slug },
        create: {
          title: dream.title,
          slug,
          kind: 'GENRE',
          description: dream.description,
          flavorText: dream.flavorText,
          examples: dream.examples,
          artPrompt: dream.artPrompt,
          imagePath: dream.imagePath,
          cardPath: dream.cardPath,
          heroPath: dream.heroPath,
          icon: dream.icon,
          designer: dream.designer,
          creationSource: dream.creationSource,
          userId: dream.userId ?? 10,
          artImageId: dream.artImageId,
          artCollectionId: dream.artCollectionId,
          isPublic: dream.isPublic,
          isMature: dream.isMature,
          isActive: dream.isActive,
        },
        update: {
          title: dream.title,
          kind: 'GENRE',
          description: dream.description,
          flavorText: dream.flavorText,
          examples: dream.examples,
          artPrompt: dream.artPrompt,
          imagePath: dream.imagePath,
          cardPath: dream.cardPath,
          heroPath: dream.heroPath,
          icon: dream.icon,
          designer: dream.designer,
          creationSource: dream.creationSource,
          userId: dream.userId ?? 10,
          artImageId: dream.artImageId,
          artCollectionId: dream.artCollectionId,
          isPublic: dream.isPublic,
          isMature: dream.isMature,
          isActive: dream.isActive,
        },
      })

      for (const scenario of dream.Scenarios) {
        await tx.scenarioFacet.upsert({
          where: { scenarioId_facetId: { scenarioId: scenario.id, facetId: facet.id } },
          create: { scenarioId: scenario.id, facetId: facet.id },
          update: {},
        })
      }

      for (const artImage of dream.ArtImages) {
        await tx.facetArtImage.upsert({
          where: { facetId_artImageId: { facetId: facet.id, artImageId: artImage.id } },
          create: { facetId: facet.id, artImageId: artImage.id },
          update: {},
        })
      }

      for (const artCollection of dream.ArtCollections) {
        await tx.facetArtCollection.upsert({
          where: {
            facetId_artCollectionId: {
              facetId: facet.id,
              artCollectionId: artCollection.id,
            },
          },
          create: { facetId: facet.id, artCollectionId: artCollection.id },
          update: {},
        })
      }

      return {
        sourceDreamId: dream.id,
        facetId: facet.id,
        slug,
        scenariosLinked: dream.Scenarios.length,
        artImagesLinked: dream.ArtImages.length,
        artCollectionsLinked: dream.ArtCollections.length,
        preservedLegacyCharacters: dream._count.Characters,
        preservedLegacyRewards: dream._count.Rewards,
        preservedLegacyBots: dream._count.Bots,
        preservedLegacyChats: dream._count.Chats,
      }
    })
    facetResults.push(result)
  }

  const invalidPitchSheetOwners = await prisma.pitchSheet.count({
    where: {
      OR: [
        { dreamId: null, projectId: null },
        { dreamId: { not: null }, projectId: { not: null } },
      ],
    },
  })
  const projectsPresent = await prisma.project.count({
    where: { slug: { in: projectDreams.map((dream) => dream.slug as string) } },
  })
  const facetsPresent = await prisma.facet.count({
    where: { slug: { in: genreDreams.map((dream) => dream.slug as string) } },
  })

  const report = {
    ...plan,
    completedAt: new Date().toISOString(),
    results: { projects: projectResults, facets: facetResults },
    verification: {
      invalidPitchSheetOwners,
      projectsPresent,
      facetsPresent,
      expectedProjects: projectDreams.length,
      expectedFacets: genreDreams.length,
    },
  }

  await writeReport(report)
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)

  if (
    invalidPitchSheetOwners > 0 ||
    projectsPresent !== projectDreams.length ||
    facetsPresent !== genreDreams.length
  ) {
    process.exitCode = 1
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
