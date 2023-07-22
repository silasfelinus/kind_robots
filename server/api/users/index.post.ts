import { User } from '@prisma/client'
import prisma from '../utils/prisma'

const createUserData = (user: User) => ({
  username: user.username,
  realName: user.realName || '',
  fancyName: user.fancyName || '',
  salt: user.salt || '',
  hashedPassword: user.hashedPassword,
  email: user.email,
  bio: user.bio || "I was born and then things happened and now I'm here.",
  birthday: user.birthday || '',
  address1: user.address1 || '',
  address2: user.address2 || '',
  city: user.city || '',
  state: user.state || '',
  country: user.country || '',
  timezone: user.timezone || '',
  phone: user.phone || '',
  languages: user.languages || '',
  hideBio: user.hideBio !== undefined ? user.hideBio : false,
  avatarImage: user.avatarImage || '/images/botcafe.png',
  isPrivate: user.isPrivate !== undefined ? user.isPrivate : false,
  allowCookies: user.allowCookies !== undefined ? user.allowCookies : false,
  defaultTheme: user.defaultTheme || 'default',
  themeOverride: user.themeOverride !== undefined ? user.themeOverride : false,
  showNsfw: user.showNsfw !== undefined ? user.showNsfw : false,
  likes: user.likes || 0,
  visits: user.visits || 0,
  hideComments: user.hideComments !== undefined ? user.hideComments : false,
  instagramUrl: user.instagramUrl || '',
  twitterUrl: user.twitterUrl || '',
  facebookUrl: user.facebookUrl || '',
  discordUrl: user.discordUrl || '',
  kindrobotsUrl: user.kindrobotsUrl || '',
  hideSocialNetworks: user.hideSocialNetworks !== undefined ? user.hideSocialNetworks : false,
  questPoints: user.questPoints || 0
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (Array.isArray(body)) {
    // Creating multiple users.
    const createData = body.map(createUserData)

    await prisma.user.createMany({
      data: createData,
      skipDuplicates: true
    })
  } else if (typeof body === 'object' && body !== null) {
    // Creating a single user.
    await prisma.user.create({
      data: createUserData(body)
    })
  }

  // Fetch and return the latest users.
  const latestUsers = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })

  return {
    users: latestUsers
  }
})
