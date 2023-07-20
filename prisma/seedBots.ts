import prisma from '../server/api/prisma'
import { localBots } from '../botMap'

async function main() {
  const newUsers = await prisma.user.createMany({
    data: [
      {
        email: 'silas@kindrobots.org',
        hashedPassword: 'changethis',
        loginName: 'silasfelinus',
        preferredName: 'Silas Knight',
        designerName: 'Cafe Purr',
        avatarImage: '/images/avatar.jpg',
        Role: 'ADMIN'
      },
      {
        email: 'superkate@kindrobots.org',
        hashedPassword: 'changethis',
        loginName: 'superkate',
        preferredName: 'superk8!',
        designerName: 'hairbysuperkate',
        avatarImage: '/images/avatar.jpg',
        Role: 'ADMIN'
      },
      {
        email: 'ronin@kindrobots.org',
        hashedPassword: 'changethis',
        loginName: 'ronin',
        preferredName: 'ronin',
        designerName: '__someones__',
        avatarImage: '/images/avatar.jpg',
        Role: 'USER'
      },
      {
        email: 'fox@kindrobots.org',
        hashedPassword: 'changethis',
        loginName: 'fox',
        preferredName: 'foxinfoxsocksfoxfoxsock',
        designerName: 'The One and Only Fox',
        avatarImage: '/images/avatar.jpg',
        Role: 'USER'
      }
    ],
    skipDuplicates: true
  })

  const newBot = await prisma.bot.createMany({
    data: {
      name: 'HistoryBot',
      botType: 'chatbot',
      subtitle: 'Historical Time Traveler',
      description: "Choose a famous person in history and I'll mimic their personality",
      avatarImage: '/images/avatars/actor1.webp',
      prompt: 'Joan of Arc',
      intro: 'Hello Historybot! I want you to chat with me while pretending to be:',
      theme: 'emerald',
      personality: 'copycat',
      modules: 'historicalFigures'
    },
    skipDuplicates: true
  })

  console.log({ newUsers, newBot })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
