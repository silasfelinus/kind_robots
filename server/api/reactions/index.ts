// ~/server/api/reactions/index.ts
import { Reaction as ReactionRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type Reaction = ReactionRecord

export async function fetchReactions(page = 1, pageSize = 10): Promise<Reaction[]> {
  const skip = (page - 1) * pageSize
  return await prisma.reaction.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchReactionById(id: number): Promise<Reaction | null> {
  return await prisma.reaction.findUnique({
    where: { id }
  })
}

export async function addReactions(
  reactionsData: Partial<Reaction>[]
): Promise<{ count: number; reactions: Reaction[]; errors: string[] }> {
  const errors: string[] = []
  const data: Prisma.ReactionCreateManyInput[] = reactionsData
    .filter((reactionData) => {
      if (!reactionData.modelType || !reactionData.modelId) {
        errors.push(`Reaction with ID ${reactionData.id} does not have modelType or modelId.`)
        return false
      }
      return true
    })
    .map((reactionData) => reactionData as Prisma.ReactionCreateManyInput)

  const result = await prisma.reaction.createMany({
    data,
    skipDuplicates: true
  })

  const reactions = await fetchReactions()

  return { count: result.count, reactions, errors }
}

export async function updateReaction(
  id: number,
  data: Partial<Reaction>
): Promise<Reaction | null> {
  const reactionExists = await prisma.reaction.findUnique({ where: { id } })

  if (!reactionExists) {
    return null
  }

  return await prisma.reaction.update({
    where: { id },
    data: data as Prisma.ReactionUpdateInput
  })
}

export async function deleteReaction(id: number): Promise<boolean> {
  const reactionExists = await prisma.reaction.findUnique({ where: { id } })

  if (!reactionExists) {
    return false
  }

  await prisma.reaction.delete({ where: { id } })
  return true
}
