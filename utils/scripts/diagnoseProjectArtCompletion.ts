import prisma from '../../server/utils/prisma'
import { parseArtJobPayload } from '../../server/utils/artJobPayload'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

async function main() {
  const jobs = await prisma.artJob.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    },
    orderBy: { id: 'desc' },
    take: 40,
    select: {
      id: true,
      status: true,
      engine: true,
      projectSlug: true,
      artImageId: true,
      error: true,
      createdAt: true,
      updatedAt: true,
      payload: true,
    },
  })

  const projectJobs = jobs.flatMap((job) => {
    const payload = parseArtJobPayload(job.payload)
    const entityArt = asRecord(payload.entityArt)
    if (entityArt.entityType !== 'project') return []
    return [{
      id: job.id,
      status: job.status,
      engine: job.engine,
      projectSlug: job.projectSlug,
      artImageId: job.artImageId,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      entityArt,
      hasCompletionTrace: Boolean(asRecord(asRecord(payload.provenance).completion).status),
    }]
  })

  console.log('PROJECT_ART_JOBS=' + JSON.stringify(projectJobs))

  const projectIds = [...new Set(projectJobs
    .map((job) => Number(job.entityArt.entityId))
    .filter((id) => Number.isInteger(id) && id > 0))]

  const projects = projectIds.length
    ? await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          conductorSlug: true,
          imagePath: true,
          cardPath: true,
          heroPath: true,
          artImageId: true,
          updatedAt: true,
          ArtImageLinks: {
            orderBy: { createdAt: 'desc' },
            take: 12,
            select: {
              artImageId: true,
              createdAt: true,
              ArtImage: {
                select: {
                  id: true,
                  path: true,
                  imagePath: true,
                  fileName: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      })
    : []

  console.log('PROJECT_ART_STATE=' + JSON.stringify(projects))
}

main()
  .catch((error) => {
    console.error('PROJECT_ART_DIAGNOSTIC_FAILED', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined)
  })
