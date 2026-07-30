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
      createdAt: { gte: new Date(Date.now() - 8 * 60 * 60 * 1000) },
    },
    orderBy: { id: 'desc' },
    take: 80,
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
  const artImageIds = [...new Set(projectJobs
    .map((job) => Number(job.artImageId))
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
          isPublic: true,
          isMature: true,
          updatedAt: true,
          ArtImageLinks: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: {
              artImageId: true,
              createdAt: true,
              ArtImage: {
                select: {
                  id: true,
                  path: true,
                  imagePath: true,
                  fileName: true,
                  fileType: true,
                  isPublic: true,
                  isMature: true,
                  isActive: true,
                  imageData: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      })
    : []

  const sanitizedProjects = projects.map((project) => ({
    ...project,
    ArtImageLinks: project.ArtImageLinks.map((link) => ({
      ...link,
      ArtImage: {
        ...link.ArtImage,
        hasImageData: Boolean(link.ArtImage.imageData),
        imageDataLength: link.ArtImage.imageData?.length ?? 0,
        imageData: undefined,
      },
    })),
  }))

  console.log('PROJECT_ART_STATE=' + JSON.stringify(sanitizedProjects))

  const images = artImageIds.length
    ? await prisma.artImage.findMany({
        where: { id: { in: artImageIds } },
        select: {
          id: true,
          userId: true,
          path: true,
          imagePath: true,
          fileName: true,
          fileType: true,
          isPublic: true,
          isMature: true,
          isActive: true,
          imageData: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : []

  console.log('PROJECT_ART_IMAGES=' + JSON.stringify(images.map((image) => ({
    ...image,
    hasImageData: Boolean(image.imageData),
    imageDataLength: image.imageData?.length ?? 0,
    imageData: undefined,
  }))))
}

main()
  .catch((error) => {
    console.error('PROJECT_ART_DIAGNOSTIC_FAILED', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined)
  })
