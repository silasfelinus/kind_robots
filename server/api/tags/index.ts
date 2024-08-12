import type { Prisma, Tag } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to create a new Tag
export async function createTag(tag: Partial<Tag>): Promise<Tag> {
  try {
    // Validate required fields
    if (!tag.label || !tag.title) {
      throw new Error('Label and title must be provided')
    }

    // Create the new Tag
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

// Function to update an existing Tag by ID
export async function updateTag(id: number, updatedTag: Partial<Tag>): Promise<Tag | null> {
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

// Function to delete a Tag by ID
export async function deleteTag(id: number): Promise<boolean> {
  try {
    const tagExists = await prisma.tag.findUnique({ where: { id } })

    if (!tagExists) {
      return false
    }

    await prisma.tag.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch all Tags
export async function fetchAllTags(): Promise<Tag[]> {
  try {
    return await prisma.tag.findMany()
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to fetch a single Tag by ID
export async function fetchTagById(id: number): Promise<Tag | null> {
  try {
    return await prisma.tag.findUnique({
      where: { id },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

// Function to create Tags in batch
export async function createTagsBatch(
  tagsData: Partial<Tag>[],
): Promise<{ count: number; tags: Tag[]; errors: string[] }> {
  const errors: string[] = []

  // Validate and filter the tags
  const data: Prisma.TagCreateManyInput[] = tagsData
    .filter((tagData) => {
      if (!tagData.label || !tagData.title) {
        errors.push(`Tag with label ${tagData.label} is incomplete.`)
        return false
      }
      return true
    })
    .map(tagData => ({
      label: tagData.label!,
      title: tagData.title!,
    } as Prisma.TagCreateManyInput))

  try {
    // Create the tags in a batch
    const result = await prisma.tag.createMany({
      data,
      skipDuplicates: true, // Skip duplicate records based on constraints
    })

    // Fetch the newly created tags
    const tags = await prisma.tag.findMany()

    return { count: result.count, tags, errors }
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export type { Tag }
