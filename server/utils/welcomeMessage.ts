// /server/utils/welcomeMessage.ts
//
// Single source of truth for the "welcome to your inbox" message.
// Used by:
//   - /server/api/chats/welcome.post.ts  (admin bulk seed / toggle)
//   - /server/api/user/register.post.ts  (auto-send on signup)

import prisma from './prisma'

export const WELCOME_SENDER = 'Kind Robots'
export const WELCOME_TITLE = 'Welcome to your inbox!'
export const WELCOME_CONTENT = `Hey there — welcome to Kind Robots! 🦋

This is your inbox. You'll receive messages from other users and system notifications here.

This project is an offshoot of Save One Human, a former non-profit created to combat malaria. The main metric for Kind Robots success is the value of our fundraiser at https://againstmalaria.com/amibot. We see no percentage of that money, it goes directly to the organization fighting malaria, one anti-malaria blanket at a time.

Any donation you could make would be greatly appreciated, but if you cannot, sharing that link on social media will help amplify our message. Our intent is purely to reduce the impact of malaria on this world, and by extension, demonstrate that humans can affect social change by embracing technology while remembering the human element that brings us together.

Thank you for joining Kind Robots.

Silas Knight
Kind Robots Human Ambassador`

// userId of the system sender. 1 = first admin / system account.
const SYSTEM_USER_ID = 1

/**
 * Sends a welcome message to a single user, unless one already exists.
 * Safe to call on every registration — it's idempotent per recipient.
 * Returns true if a message was created, false if one already existed.
 */
export async function sendWelcomeMessage(
  recipientId: number,
  options: { markAsRead?: boolean; force?: boolean } = {},
): Promise<boolean> {
  const { markAsRead = false, force = false } = options

  if (!force) {
    const existing = await prisma.chat.findFirst({
      where: {
        sender: WELCOME_SENDER,
        title: WELCOME_TITLE,
        recipientId,
      },
      select: { id: true },
    })

    if (existing) return false
  }

  await prisma.chat.create({
    data: {
      type: 'ToUser',
      sender: WELCOME_SENDER,
      recipient: 'inbox',
      recipientId,
      userId: SYSTEM_USER_ID,
      content: WELCOME_CONTENT,
      title: WELCOME_TITLE,
      isPublic: false,
      isFavorite: false,
      isRead: markAsRead,
      isActive: true,
      isMature: false,
    },
  })

  return true
}
