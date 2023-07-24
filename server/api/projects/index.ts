// ~/server/api/projects/index.ts
import { Project as ProjectRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type Project = ProjectRecord

export async function fetchProjects(page = 1, pageSize = 10): Promise<Project[]> {
  const skip = (page - 1) * pageSize
  return await prisma.project.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchProjectById(id: number): Promise<Project | null> {
  return await prisma.project.findUnique({
    where: { id }
  })
}

export async function addProjects(
  projectsData: Partial<Project>[]
): Promise<{ count: number; projects: Project[]; errors: string[] }> {
  const errors: string[] = []
  const data: Prisma.ProjectCreateManyInput[] = projectsData
    .filter((projectData) => {
      if (!projectData.name || !projectData.title) {
        errors.push(`Project with ID ${projectData.id} does not have a name or title.`)
        return false
      }
      return true
    })
    .map((projectData) => projectData as Prisma.ProjectCreateManyInput)

  const result = await prisma.project.createMany({
    data,
    skipDuplicates: true
  })

  const projects = await fetchProjects()

  return { count: result.count, projects, errors }
}

export async function updateProject(id: number, data: Partial<Project>): Promise<Project | null> {
  const projectExists = await prisma.project.findUnique({ where: { id } })

  if (!projectExists) {
    return null
  }

  return await prisma.project.update({
    where: { id },
    data: data as Prisma.ProjectUpdateInput
  })
}

export async function deleteProject(id: number): Promise<boolean> {
  const projectExists = await prisma.project.findUnique({ where: { id } })

  if (!projectExists) {
    return false
  }

  await prisma.project.delete({ where: { id } })
  return true
}
export async function randomProject(): Promise<Project | null> {
  const totalProjects = await prisma.project.count()

  if (totalProjects === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalProjects)
  return await prisma.project.findFirst({
    skip: randomIndex
  })
}

export async function countProjects(): Promise<number> {
  return await prisma.project.count()
}
