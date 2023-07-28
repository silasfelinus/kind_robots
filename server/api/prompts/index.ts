// ~/server/api/prompts/index.ts
import { Prompt as PromptRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type Prompt = PromptRecord

export async function fetchPrompts(page = 1, pageSize = 100): Promise<Prompt[]> {
  const skip = (page - 1) * pageSize
  return await prisma.prompt.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchPromptById(id: number): Promise<Prompt | null> {
  return await prisma.prompt.findUnique({
    where: { id }
  })
}

export async function addPrompts(
  promptsData: Partial<Prompt>[]
): Promise<{ count: number; prompts: Prompt[]; errors: string[] }> {
  const errors: string[] = []
  const data: Prisma.PromptCreateManyInput[] = promptsData
    .filter((promptData) => {
      if (!promptData.content) {
        errors.push(`Prompt with ID ${promptData.id} does not have content.`)
        return false
      }
      return true
    })
    .map((promptData) => promptData as Prisma.PromptCreateManyInput)

  const result = await prisma.prompt.createMany({
    data,
    skipDuplicates: true
  })

  const prompts = await fetchPrompts()

  return { count: result.count, prompts, errors }
}

export async function updatePrompt(id: number, data: Partial<Prompt>): Promise<Prompt | null> {
  const promptExists = await prisma.prompt.findUnique({ where: { id } })

  if (!promptExists) {
    return null
  }

  return await prisma.prompt.update({
    where: { id },
    data: data as Prisma.PromptUpdateInput
  })
}

export async function deletePrompt(id: number): Promise<boolean> {
  const promptExists = await prisma.prompt.findUnique({ where: { id } })

  if (!promptExists) {
    return false
  }

  await prisma.prompt.delete({ where: { id } })
  return true
}

export async function randomPrompt(): Promise<Prompt | null> {
  const totalPrompts = await prisma.prompt.count()

  if (totalPrompts === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalPrompts)
  return await prisma.prompt.findFirst({
    skip: randomIndex
  })
}
export async function countPrompts(): Promise<number> {
  return await prisma.prompt.count()
}
