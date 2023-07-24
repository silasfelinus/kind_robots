// ~/server/api/resources/index.ts
import { Resource as ResourceRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type Resource = ResourceRecord

export async function fetchResources(page = 1, pageSize = 10): Promise<Resource[]> {
  const skip = (page - 1) * pageSize
  return await prisma.resource.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchResourceById(id: number): Promise<Resource | null> {
  return await prisma.resource.findUnique({
    where: { id }
  })
}

export async function addResources(
  resourcesData: Partial<Resource>[]
): Promise<{ count: number; resources: Resource[]; errors: string[] }> {
  const errors: string[] = []
  const data: Prisma.ResourceCreateManyInput[] = resourcesData
    .filter((resourceData) => {
      if (!resourceData.name) {
        errors.push(`Resource with ID ${resourceData.id} does not have a name.`)
        return false
      }
      return true
    })
    .map((resourceData) => resourceData as Prisma.ResourceCreateManyInput)

  const result = await prisma.resource.createMany({
    data,
    skipDuplicates: true
  })

  const resources = await fetchResources()

  return { count: result.count, resources, errors }
}

export async function updateResource(
  id: number,
  data: Partial<Resource>
): Promise<Resource | null> {
  const resourceExists = await prisma.resource.findUnique({ where: { id } })

  if (!resourceExists) {
    return null
  }

  return await prisma.resource.update({
    where: { id },
    data: data as Prisma.ResourceUpdateInput
  })
}

export async function deleteResource(id: number): Promise<boolean> {
  const resourceExists = await prisma.resource.findUnique({ where: { id } })

  if (!resourceExists) {
    return false
  }

  await prisma.resource.delete({ where: { id } })
  return true
}

export async function randomResource(): Promise<Resource | null> {
  const totalResources = await prisma.resource.count()

  if (totalResources === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalResources)
  return await prisma.resource.findFirst({
    skip: randomIndex
  })
}
export async function countResources(): Promise<number> {
  return await prisma.resource.count()
}
