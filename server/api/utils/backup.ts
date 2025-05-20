// /server/utils/backup.ts
import fs from 'fs'
import prisma from './prisma'

const models = [
  'user',
  'art',
  'artImage',
  'reaction',
  'prompt',
  'bot',
  'gallery',
  'character',
  'component',
  'scenario',
  'reward',
  'pitch',
  'resource',
  'tag',
  'resonance',
  'milestone',
  'milestoneRecord',
  'blueprint',
  'chat',
  'smartIcon',
  'theme',
  'log',
] as const

type ModelName = (typeof models)[number]

export async function backupDatabase() {
  const backupData: Record<string, any[]> = {}

  try {
    for (const model of models) {
      const data = await (prisma as any)[model].findMany()
      backupData[model] = data
    }

    const replacer = (_key: string, value: unknown): unknown =>
      typeof value === 'bigint' ? value.toString() : value

    fs.writeFileSync('backup.json', JSON.stringify(backupData, replacer, 2))
    console.log(
      '✅ Backup successful. Models:',
      Object.keys(backupData).join(', '),
    )
  } catch (error) {
    console.error('❌ Error during backup:', error)
  } finally {
    await prisma.$disconnect()
  }
}
