// /server/utils/reviewDraftRepository.ts
import prisma from '@/server/utils/prisma'
import {
  assertReviewDraftTransition,
  buildReviewDraftKey,
  finalReviewDraftComment,
  type ReviewDraftAuthorRef,
  type ReviewDraftPublicAuthor,
  type ReviewDraftStatus,
} from '@/utils/wonderlab/reviewDraft'

export type ReviewDraftRecord = {
  id: number
  createdAt: Date
  updatedAt: Date | null
  status: ReviewDraftStatus
  draftKey: string
  componentId: number
  componentName: string
  componentTitle: string | null
  authorBotId: number | null
  authorCharacterId: number | null
  author: ReviewDraftPublicAuthor
  publisherUserId: number | null
  publisherName: string | null
  publishedReactionId: number | null
  promptVersion: string
  promptHash: string
  promptPayload: unknown
  generatedComment: string
  editedComment: string | null
  finalComment: string
  rating: number
  reactionType: string | null
  generationModel: string | null
  generationProvider: string | null
  generationAttempt: number
  approvedAt: Date | null
  rejectedAt: Date | null
  publishedAt: Date | null
  failureReason: string | null
}

type ReviewDraftRow = Omit<ReviewDraftRecord, 'author' | 'finalComment' | 'promptPayload'> & {
  promptPayload: unknown
  botName: string | null
  botAvatarImage: string | null
  botImagePath: string | null
  botRole: string | null
  characterName: string | null
  characterImagePath: string | null
  characterRole: string | null
}

export type ReviewDraftListFilters = {
  status?: ReviewDraftStatus | null
  componentId?: number | null
  authorBotId?: number | null
  authorCharacterId?: number | null
  limit?: number
}

export type CreateReviewDraftInput = {
  componentId: number
  author: ReviewDraftAuthorRef
  promptVersion: string
  promptHash: string
  promptPayload?: unknown
  generatedComment: string
  rating: number
  reactionType?: string | null
  generationModel?: string | null
  generationProvider?: string | null
  generationAttempt?: number
}

export type UpdateReviewDraftInput = {
  id: number
  actorUserId: number
  status?: ReviewDraftStatus
  editedComment?: string | null
  rating?: number
  reactionType?: string | null
  failureReason?: string | null
}

function safePromptPayload(value: unknown): unknown {
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function rowAuthor(row: ReviewDraftRow): ReviewDraftPublicAuthor {
  if (row.authorBotId) {
    return {
      kind: 'BOT',
      id: row.authorBotId,
      name: row.botName?.trim() || `Bot #${row.authorBotId}`,
      avatarImage: row.botAvatarImage?.trim() || row.botImagePath?.trim() || null,
      role: row.botRole?.trim() || 'BOT',
    }
  }

  if (row.authorCharacterId) {
    return {
      kind: 'CHARACTER',
      id: row.authorCharacterId,
      name: row.characterName?.trim() || `Character #${row.authorCharacterId}`,
      avatarImage: row.characterImagePath?.trim() || null,
      role: row.characterRole?.trim() || 'CHARACTER',
    }
  }

  throw new Error(`ReviewDraft ${row.id} has no valid first-party author.`)
}

function mapReviewDraft(row: ReviewDraftRow): ReviewDraftRecord {
  return {
    ...row,
    author: rowAuthor(row),
    promptPayload: safePromptPayload(row.promptPayload),
    finalComment: finalReviewDraftComment(row),
  }
}

const selectReviewDraft = `
  SELECT
    rd.*,
    c.componentName,
    c.title AS componentTitle,
    b.name AS botName,
    b.avatarImage AS botAvatarImage,
    b.imagePath AS botImagePath,
    b.BotType AS botRole,
    ch.name AS characterName,
    ch.imagePath AS characterImagePath,
    ch.role AS characterRole,
    COALESCE(u.name, u.username) AS publisherName
  FROM ReviewDraft rd
  INNER JOIN Component c ON c.id = rd.componentId
  LEFT JOIN Bot b ON b.id = rd.authorBotId
  LEFT JOIN Character ch ON ch.id = rd.authorCharacterId
  LEFT JOIN User u ON u.id = rd.publisherUserId
`

export async function listReviewDrafts(
  filters: ReviewDraftListFilters = {},
): Promise<ReviewDraftRecord[]> {
  const status = filters.status ?? null
  const componentId = filters.componentId ?? null
  const authorBotId = filters.authorBotId ?? null
  const authorCharacterId = filters.authorCharacterId ?? null
  const limit = Math.max(1, Math.min(200, Math.round(filters.limit ?? 100)))

  const rows = await prisma.$queryRawUnsafe<ReviewDraftRow[]>(
    `${selectReviewDraft}
      WHERE (? IS NULL OR rd.status = ?)
        AND (? IS NULL OR rd.componentId = ?)
        AND (? IS NULL OR rd.authorBotId = ?)
        AND (? IS NULL OR rd.authorCharacterId = ?)
      ORDER BY rd.updatedAt DESC, rd.createdAt DESC, rd.id DESC
      LIMIT ?`,
    status,
    status,
    componentId,
    componentId,
    authorBotId,
    authorBotId,
    authorCharacterId,
    authorCharacterId,
    limit,
  )

  return rows.map(mapReviewDraft)
}

export async function getReviewDraftById(id: number): Promise<ReviewDraftRecord | null> {
  const rows = await prisma.$queryRawUnsafe<ReviewDraftRow[]>(
    `${selectReviewDraft} WHERE rd.id = ? LIMIT 1`,
    id,
  )
  return rows[0] ? mapReviewDraft(rows[0]) : null
}

export async function getReviewDraftByKey(
  draftKey: string,
): Promise<ReviewDraftRecord | null> {
  const rows = await prisma.$queryRawUnsafe<ReviewDraftRow[]>(
    `${selectReviewDraft} WHERE rd.draftKey = ? LIMIT 1`,
    draftKey,
  )
  return rows[0] ? mapReviewDraft(rows[0]) : null
}

async function assertReviewDraftReferences(input: CreateReviewDraftInput): Promise<void> {
  const components = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM Component WHERE id = ${input.componentId} LIMIT 1
  `
  if (!components.length) throw new Error(`Component ${input.componentId} not found.`)

  if (input.author.kind === 'BOT') {
    const authors = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM Bot
      WHERE id = ${input.author.id} AND isActive = TRUE AND isPublic = TRUE
      LIMIT 1
    `
    if (!authors.length) throw new Error(`Eligible Bot ${input.author.id} not found.`)
    return
  }

  const authors = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM Character
    WHERE id = ${input.author.id} AND isActive = TRUE AND isPublic = TRUE
    LIMIT 1
  `
  if (!authors.length) throw new Error(`Eligible Character ${input.author.id} not found.`)
}

export async function createReviewDraft(
  input: CreateReviewDraftInput,
): Promise<{ draft: ReviewDraftRecord; created: boolean }> {
  await assertReviewDraftReferences(input)

  const draftKey = buildReviewDraftKey(input)
  const authorBotId = input.author.kind === 'BOT' ? input.author.id : null
  const authorCharacterId = input.author.kind === 'CHARACTER' ? input.author.id : null
  const payload = input.promptPayload === undefined ? null : JSON.stringify(input.promptPayload)
  const generationAttempt = Math.max(1, Math.round(input.generationAttempt ?? 1))

  const inserted = await prisma.$executeRaw`
    INSERT IGNORE INTO ReviewDraft (
      status,
      draftKey,
      componentId,
      authorBotId,
      authorCharacterId,
      promptVersion,
      promptHash,
      promptPayload,
      generatedComment,
      rating,
      reactionType,
      generationModel,
      generationProvider,
      generationAttempt
    ) VALUES (
      'PROPOSED',
      ${draftKey},
      ${input.componentId},
      ${authorBotId},
      ${authorCharacterId},
      ${input.promptVersion},
      ${input.promptHash},
      ${payload},
      ${input.generatedComment},
      ${input.rating},
      ${input.reactionType ?? null},
      ${input.generationModel ?? null},
      ${input.generationProvider ?? null},
      ${generationAttempt}
    )
  `

  const draft = await getReviewDraftByKey(draftKey)
  if (!draft) throw new Error('Review draft was not readable after creation.')

  return { draft, created: inserted > 0 }
}

export async function updateReviewDraft(
  input: UpdateReviewDraftInput,
): Promise<ReviewDraftRecord> {
  const current = await getReviewDraftById(input.id)
  if (!current) throw new Error(`Review draft ${input.id} not found.`)

  const contentChanged =
    input.editedComment !== undefined ||
    input.rating !== undefined ||
    input.reactionType !== undefined

  let status = input.status ?? current.status
  if (contentChanged && current.status === 'APPROVED' && input.status === undefined) {
    status = 'PROPOSED'
  }

  if (status === 'PUBLISHED') {
    throw new Error('Only the controlled publication service may publish a review draft.')
  }

  assertReviewDraftTransition(current.status, status)

  const editedComment =
    input.editedComment === undefined ? current.editedComment : input.editedComment
  const rating = input.rating === undefined ? current.rating : input.rating
  const reactionType =
    input.reactionType === undefined ? current.reactionType : input.reactionType
  const failureReason =
    status === 'FAILED'
      ? input.failureReason?.trim() || current.failureReason || 'Draft validation failed.'
      : input.failureReason === undefined
        ? current.failureReason
        : input.failureReason

  const approvedAt = status === 'APPROVED' ? current.approvedAt ?? new Date() : null
  const rejectedAt = status === 'REJECTED' ? current.rejectedAt ?? new Date() : null
  const publisherUserId = status === 'APPROVED' ? input.actorUserId : current.publisherUserId

  await prisma.$executeRaw`
    UPDATE ReviewDraft
    SET
      updatedAt = CURRENT_TIMESTAMP(3),
      status = ${status},
      editedComment = ${editedComment},
      rating = ${rating},
      reactionType = ${reactionType},
      failureReason = ${failureReason},
      approvedAt = ${approvedAt},
      rejectedAt = ${rejectedAt},
      publisherUserId = ${publisherUserId}
    WHERE id = ${input.id}
  `

  const updated = await getReviewDraftById(input.id)
  if (!updated) throw new Error('Review draft disappeared after update.')
  return updated
}
