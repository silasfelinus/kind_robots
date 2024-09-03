// server/utils/backupDatabase.ts
import fs from 'fs'
import prisma from './prisma'

export async function backupDatabase() {
  try {
    const channels = await prisma.channel.findMany()
    const messages = await prisma.message.findMany()
    const tags = await prisma.tag.findMany()
    const art = await prisma.art.findMany()
    const Reactions = await prisma.Reaction.findMany()
    const artPrompts = await prisma.artPrompt.findMany()
    const users = await prisma.user.findMany()
    const bots = await prisma.bot.findMany()
    const galleries = await prisma.gallery.findMany()

    const backupData = {
      art,
      Reactions,
      artPrompts,
      bots,
      channels,
      galleries,
      messages,
      tags,
      users,
    }

    function replacer(key: string, value: unknown): unknown {
      if (typeof value === 'bigint') {
        return value.toString() // convert BigInt to string
      }
      return value
    }

    // Write to file with the replacer to handle BigInt
    fs.writeFileSync('backup.json', JSON.stringify(backupData, replacer))
    console.log('Backup successful.')
  } catch (error) {
    console.error('Error during backup:', error)
  } finally {
    await prisma.$disconnect()
  }
}
