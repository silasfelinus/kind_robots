import type { AgentCredentialScope } from './agentCredentialScopes'

export type ForumChannel = {
  slug: string
  label: string
  description: string
}

export type ForumOrder = 'recent' | 'chronological'

export const FORUM_ATTACHMENT_KINDS = ['ART_IMAGE', 'PROJECT', 'CHARACTER'] as const
export type ForumAttachmentKind = (typeof FORUM_ATTACHMENT_KINDS)[number]

export type ForumAttachmentReference = {
  kind: ForumAttachmentKind
  id: number
}

export function isForumAttachmentKind(value: unknown): value is ForumAttachmentKind {
  return (
    typeof value === 'string' &&
    (FORUM_ATTACHMENT_KINDS as readonly string[]).includes(value)
  )
}

export function forumAttachmentCanonicalPath(
  reference: ForumAttachmentReference,
): string {
  switch (reference.kind) {
    case 'ART_IMAGE':
      return `/art?art=${reference.id}`
    case 'PROJECT':
      return `/conductor?project=${reference.id}`
    case 'CHARACTER':
      return `/characters?character=${reference.id}`
  }
}

export const DEFAULT_FORUM_CHANNELS: readonly ForumChannel[] = [
  {
    slug: 'introductions',
    label: 'Introductions',
    description: 'Humans, agents, operators, and curious observers saying hello.',
  },
  {
    slug: 'news',
    label: 'News',
    description: 'Project updates, build logs, receipts, and noteworthy developments.',
  },
  {
    slug: 'humanitarian-goals',
    label: 'Humanitarian Goals',
    description: 'Research, proposals, resources, and useful work aimed at public benefit.',
  },
  {
    slug: 'creativity',
    label: 'Creativity',
    description: 'Art, stories, tools, experiments, and collaborative creative work.',
  },
  {
    slug: 'memes',
    label: 'Memes',
    description: 'Playful culture and jokes that still respect the commons rules.',
  },
  {
    slug: 'just-because',
    label: 'Just Because',
    description: 'Open-ended conversation that does not fit the other boards.',
  },
]

export const FORUM_FLAG_REASONS = [
  'spam',
  'harassment',
  'misinformation',
  'unsafe',
  'other',
] as const

export type ForumFlagReason = (typeof FORUM_FLAG_REASONS)[number]

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function parsePositiveForumInt(value: unknown): number | null {
  const parsed = Number(firstValue(value))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function parseForumLimit(value: unknown, fallback = 30): number {
  const parsed = parsePositiveForumInt(value)
  return parsed ? Math.min(parsed, 100) : fallback
}

export function parseForumBoolean(value: unknown): boolean {
  const raw = firstValue(value)
  return raw === true || raw === 'true' || raw === '1' || raw === 'yes'
}

export function parseForumOrder(value: unknown): ForumOrder {
  return cleanText(firstValue(value)).toLowerCase() === 'chronological'
    ? 'chronological'
    : 'recent'
}

export function normalizeForumChannelSlug(value: unknown): string | null {
  const slug = cleanText(firstValue(value)).toLowerCase()
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  return slug
}

function normalizeChannel(value: unknown): ForumChannel | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const row = value as Record<string, unknown>
  const slug = normalizeForumChannelSlug(row.slug)
  const label = cleanText(row.label)
  const description = cleanText(row.description)

  if (!slug || !label || !description) return null
  return { slug, label, description }
}

export function parseForumChannelRegistry(input: unknown): ForumChannel[] {
  if (!Array.isArray(input)) return DEFAULT_FORUM_CHANNELS.map((entry) => ({ ...entry }))

  const seen = new Set<string>()
  const channels: ForumChannel[] = []

  for (const value of input) {
    const channel = normalizeChannel(value)
    if (!channel || seen.has(channel.slug)) continue
    seen.add(channel.slug)
    channels.push(channel)
  }

  return channels.length
    ? channels
    : DEFAULT_FORUM_CHANNELS.map((entry) => ({ ...entry }))
}

export function parseForumChannelRegistryJson(raw: string | undefined): ForumChannel[] {
  const text = cleanText(raw)
  if (!text) return DEFAULT_FORUM_CHANNELS.map((entry) => ({ ...entry }))

  try {
    return parseForumChannelRegistry(JSON.parse(text))
  } catch {
    return DEFAULT_FORUM_CHANNELS.map((entry) => ({ ...entry }))
  }
}

export function findForumChannel(
  channels: readonly ForumChannel[],
  value: unknown,
): ForumChannel | null {
  const slug = normalizeForumChannelSlug(value)
  return slug ? channels.find((channel) => channel.slug === slug) ?? null : null
}

export function credentialHasForumScope(
  authKind: string,
  scopes: readonly AgentCredentialScope[] | undefined,
  required: AgentCredentialScope,
): boolean {
  return authKind !== 'agent-credential' || Boolean(scopes?.includes(required))
}

export type ForumPostAccessShape = {
  id: number
  type: string
  userId: number | null
  botId: number | null
  originId: number | null
  previousEntryId: number | null
  isPublic: boolean
  isActive: boolean
  isMature: boolean
}

export type ForumActorAccessShape = {
  kind: string
  userId: number
  botId?: number | null
  isAdmin?: boolean
}

export function forumPostIsPubliclyVisible(
  post: Pick<ForumPostAccessShape, 'type' | 'isPublic' | 'isActive' | 'isMature'>,
  includeMature = false,
): boolean {
  return (
    post.type === 'ToForum' &&
    post.isPublic &&
    post.isActive &&
    (includeMature || !post.isMature)
  )
}

export function canManageForumPost(
  actor: ForumActorAccessShape,
  post: Pick<ForumPostAccessShape, 'userId' | 'botId'>,
): boolean {
  if (actor.kind !== 'agent-credential' && actor.isAdmin) return true
  if (post.userId !== actor.userId) return false

  if (actor.kind === 'agent-credential') {
    return Boolean(actor.botId) && post.botId === actor.botId
  }

  return true
}

export function isForumThreadRoot(
  post: Pick<ForumPostAccessShape, 'id' | 'originId' | 'previousEntryId' | 'type'>,
): boolean {
  if (post.type !== 'ToForum' || post.previousEntryId !== null) return false
  return post.originId === null || post.originId === post.id
}

export function forumParentBelongsToThread(
  threadId: number,
  parent: Pick<
    ForumPostAccessShape,
    'id' | 'originId' | 'type' | 'isPublic' | 'isActive'
  >,
): boolean {
  return (
    parent.type === 'ToForum' &&
    parent.isPublic &&
    parent.isActive &&
    (parent.id === threadId || parent.originId === threadId)
  )
}

export type ForumReadFilterOptions = {
  channel?: string | null
  includeMature?: boolean
  rootOnly?: boolean
  cursor?: number | null
  order?: ForumOrder
}

export function buildForumReadFilter(
  options: ForumReadFilterOptions = {},
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    type: 'ToForum',
    isPublic: true,
    isActive: true,
  }

  if (!options.includeMature) where.isMature = false
  if (options.channel) where.channel = options.channel
  if (options.rootOnly) where.previousEntryId = null

  if (options.cursor) {
    where.id =
      options.order === 'chronological'
        ? { gt: options.cursor }
        : { lt: options.cursor }
  }

  return where
}

export function parseForumFlagReason(value: unknown): ForumFlagReason | null {
  const reason = cleanText(value).toLowerCase()
  return (FORUM_FLAG_REASONS as readonly string[]).includes(reason)
    ? (reason as ForumFlagReason)
    : null
}
