// /utils/community/rooms.ts
//
// Live group chat rooms for people on a project's front-end page. Register a
// room here and mount <kr-group-chat room="<slug>" /> on the page; the shared
// /api/rooms/* routes create the ChatRoom row on first use.

export type ChatRoomSpec = {
  slug: string
  projectSlug: string
  title: string
  welcome: string
}

export const CHAT_ROOMS: ChatRoomSpec[] = [
  {
    slug: 'tarot',
    projectSlug: 'tarot-studio',
    title: 'Tarot Circle',
    welcome:
      'Share a reading, a pull or a kind word. Be gentle: everyone here is figuring things out.',
  },
]

export const CHAT_MESSAGE_MAX = 500
export const CHAT_PAGE_SIZE = 60

export function chatRoomBySlug(slug: string): ChatRoomSpec | null {
  return CHAT_ROOMS.find((room) => room.slug === slug) ?? null
}

const isAllowedChar = (char: string) => {
  const code = char.charCodeAt(0)
  return code === 9 || code === 10 || (code >= 32 && code !== 127)
}

/** Trim, collapse runs of blank lines and drop control characters. */
export function cleanChatBody(value: unknown): string {
  if (typeof value !== 'string') return ''
  return Array.from(value.replace(/\r\n?/g, '\n'))
    .filter(isAllowedChar)
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
