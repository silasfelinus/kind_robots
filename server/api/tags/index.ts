// /server/api/tags/index.ts
import type { Tag } from '~/server/generated/prisma'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

type TagCreateManyArgs = NonNullable<
  Parameters<typeof prisma.tag.createMany>[0]
>
type TagCreateManyData = TagCreateManyArgs['data']
type TagCreateManyItem =
  TagCreateManyData extends Array<infer T> ? T : TagCreateManyData

export async function createTag(tag: Partial<Tag>): Promise<Tag> {
  try {
    if (!tag.label || !tag.title) {
      throw new Error('Label and title must be provided')
    }

    return await prisma.tag.create({
      data: {
        label: tag.label,
        title: tag.title,
      },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export async function updateTag(
  id: number,
  updatedTag: Partial<Tag>,
): Promise<Tag | null> {
  try {
    const tag = await prisma.tag.findUnique({ where: { id } })
    if (!tag) {
      throw new Error(`Tag with ID ${id} not found.`)
    }

    return await prisma.tag.update({
      where: { id },
      data: updatedTag,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export async function deleteTag(id: number): Promise<boolean> {
  try {
    const tagExists = await prisma.tag.findUnique({ where: { id } })
    if (!tagExists) return false

    await prisma.tag.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export async function fetchAllTags(): Promise<Tag[]> {
  try {
    return await prisma.tag.findMany()
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export async function fetchTagById(id: number): Promise<Tag | null> {
  try {
    return await prisma.tag.findUnique({
      where: { id },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export async function createTagsBatch(
  tagsData: Partial<Tag>[],
): Promise<{ count: number; tags: Tag[]; errors: string[] }> {
  const errors: string[] = []

  const data: TagCreateManyItem[] = tagsData
    .filter((tagData) => {
      if (!tagData.label || !tagData.title) {
        errors.push(`Tag with label ${tagData.label} is incomplete.`)
        return false
      }
      return true
    })
    .map((tagData) => ({
      label: tagData.label!,
      title: tagData.title!,
    }))

  try {
    const result = await prisma.tag.createMany({
      data,
      skipDuplicates: true,
    })

    const tags = await prisma.tag.findMany()
    return { count: result.count, tags, errors }
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export type { Tag }
