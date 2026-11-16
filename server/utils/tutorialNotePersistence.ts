import prisma from '~/server/utils/prisma'
import {
  parseTutorialCopy,
  tutorialPageKey,
  type TutorialCopy,
} from '~/server/utils/tutorialNotes'

export async function tutorialProjectId(): Promise<number | null> {
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { slug: 'kind-robots' },
        { conductorSlug: 'kind-robots' },
        { slug: 'kind_robots' },
      ],
    },
    select: { id: true },
  })
  return project?.id ?? null
}

export async function readTutorialCopy(path: string): Promise<{
  projectId: number | null
  copy: TutorialCopy | null
}> {
  const projectId = await tutorialProjectId()
  if (!projectId) return { projectId: null, copy: null }
  const page = await prisma.projectPageContent.findUnique({
    where: {
      projectId_pageKey: {
        projectId,
        pageKey: tutorialPageKey(path),
      },
    },
    select: { content: true },
  })
  return { projectId, copy: parseTutorialCopy(page?.content, path) }
}

export async function writeTutorialCopy(
  projectId: number,
  path: string,
  copy: TutorialCopy,
  userId: number,
): Promise<void> {
  const content = JSON.stringify(copy)
  await prisma.projectPageContent.upsert({
    where: {
      projectId_pageKey: {
        projectId,
        pageKey: tutorialPageKey(path),
      },
    },
    create: {
      projectId,
      pageKey: tutorialPageKey(path),
      content,
      updatedById: userId,
    },
    update: {
      content,
      updatedById: userId,
    },
  })
}
