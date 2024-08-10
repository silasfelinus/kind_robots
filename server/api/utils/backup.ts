import fs from 'fs'
import prisma from './prisma'

async function backupDatabase() {
  try {
    const channels = await prisma.channel.findMany()
    const messages = await prisma.message.findMany()
    const tags = await prisma.tag.findMany()
    const art = await prisma.art.findMany()
    const artReactions = await prisma.artReaction.findMany()
    const artPrompts = await prisma.artPrompt.findMany()
    const users = await prisma.user.findMany()
    const bots = await prisma.bot.findMany()
    const galleries = await prisma.gallery.findMany()

    const backupData = {
      art,
      artReactions,
      artPrompts,
      bots,
      channels,
      galleries,
      messages,
      tags,
      users,
    }

    fs.writeFileSync('backup.json', JSON.stringify(backupData))
    console.log('Backup successful.')
  }
  catch (error) {
    console.error('Error during backup:', error)
  }
  finally {
    await prisma.$disconnect()
  }
}

backupDatabase()
