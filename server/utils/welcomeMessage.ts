// /server/utils/welcomeMessage.ts
import prisma from './prisma'
import { ChatType } from '~/prisma/generated/prisma/client'

export const WELCOME_SENDER = 'Kind Robots'
export const WELCOME_TITLE = 'Welcome to your inbox!'
export const WELCOME_CHANNEL = 'system'
export const WELCOME_CONTENT = `Hey there, welcome to Kind Robots! 🦋

This is your inbox. You'll receive messages from other users and system notifications here.

This project is an offshoot of Save One Human, a former non-profit created to combat malaria. The main metric for Kind Robots success is the value of our fundraiser at https://againstmalaria.com/amibot. We see no percentage of that money. It goes directly to the organization fighting malaria, one anti-malaria net at a time.

Any donation you could make would be greatly appreciated, but if you cannot, sharing that link on social media will help amplify our message. Our intent is purely to reduce the impact of malaria on this world and, by extension, demonstrate that AI-driven communities can be fun, useful, and kind.

Welcome aboard. The robots are mostly house-trained.`

type WelcomeOptions = {
  markAsRead?: boolean
  force?: boolean
}

export async function sendWelcomeMessage(
  userId: number,
  options: WelcomeOptions = {},
): Promise<boolean> {
  const markAsRead = options.markAsRead ?? false
  const force = options.force ?? false

  if (!force) {
    const existing = await prisma.chat.findFirst({
      where: {
        userId,
        sender: WELCOME_SENDER,
        title: WELCOME_TITLE,
      },
      select: {
        id: true,
      },
    })

    if (existing) {
      return false
    }
  }

  await prisma.chat.create({
    data: {
      type: ChatType.ToUser,
      sender: WELCOME_SENDER,
      recipient: 'User Inbox',
      recipientId: userId,
      userId,
      title: WELCOME_TITLE,
      content: WELCOME_CONTENT,
      channel: WELCOME_CHANNEL,
      isRead: markAsRead,
      isPublic: false,
      isFavorite: false,
      isMature: false,
      isActive: true,
    },
  })

  return true
}
