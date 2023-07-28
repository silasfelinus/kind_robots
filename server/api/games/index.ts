// ~/server/api/games/index.ts
import { Game as GameRecord, Prisma } from '@prisma/client'
import prisma from './../utils/prisma'

export type Game = GameRecord

export async function fetchGames(page = 1, pageSize = 100): Promise<Game[]> {
  const skip = (page - 1) * pageSize
  return await prisma.game.findMany({
    skip,
    take: pageSize
  })
}

export async function fetchGameById(id: number): Promise<Game | null> {
  return await prisma.game.findUnique({
    where: { id }
  })
}

export async function addGames(
  gamesData: Partial<Game>[]
): Promise<{ count: number; games: Game[]; errors: string[] }> {
  const errors: string[] = []
  const data: Prisma.GameCreateManyInput[] = gamesData
    .filter((gameData) => {
      if (!gameData.content) {
        errors.push(`Game with ID ${gameData.id} does not have content.`)
        return false
      }
      return true
    })
    .map((gameData) => gameData as Prisma.GameCreateManyInput)

  const result = await prisma.game.createMany({
    data,
    skipDuplicates: true
  })

  const games = await fetchGames()

  return { count: result.count, games, errors }
}

export async function updateGame(id: number, data: Partial<Game>): Promise<Game | null> {
  const gameExists = await prisma.game.findUnique({ where: { id } })

  if (!gameExists) {
    return null
  }

  return await prisma.game.update({
    where: { id },
    data: data as Prisma.GameUpdateInput
  })
}

export async function deleteGame(id: number): Promise<boolean> {
  const gameExists = await prisma.game.findUnique({ where: { id } })

  if (!gameExists) {
    return false
  }

  await prisma.game.delete({ where: { id } })
  return true
}

export async function randomGame(): Promise<Game | null> {
  const totalGames = await prisma.game.count()

  if (totalGames === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * totalGames)
  return await prisma.game.findFirst({
    skip: randomIndex
  })
}

export async function countGames(): Promise<number> {
  return await prisma.game.count()
}
