// /server/api/tzaddik/index.post.ts
//
// Authenticated candidate submission (tzaddik-gallery/t-006). Any signed-in
// Kind Robots user may nominate a person with a rationale and a Wikipedia
// source. New submissions always land at curationState: PENDING -- they are
// community suggestions, never automatic canon -- and are visible to their
// submitter (see [id].get.ts's visibility carve-out) and admins until an
// editor approves or archives them.
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { slugify } from '../../../utils/slugify'
import { TzaddikLifeState } from '~/prisma/generated/prisma/client'
import { findTzaddikBlacklistEntry } from '../../../utils/tzaddikBlacklist'

type SubmitBody = {
  displayName?: unknown
  lifeState?: unknown
  rationale?: unknown
  wikipediaUrl?: unknown
  biography?: unknown
}

const SUBMITTABLE_LIFE_STATES = new Set<string>([
  TzaddikLifeState.LIVING,
  TzaddikLifeState.MEMORIAL,
])

function toTrimmedString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function parseLifeState(value: unknown): TzaddikLifeState | undefined {
  if (typeof value !== 'string' || !value.trim()) return TzaddikLifeState.LIVING
  const upper = value.trim().toUpperCase()
  return SUBMITTABLE_LIFE_STATES.has(upper)
    ? (upper as TzaddikLifeState)
    : undefined
}

function isWikipediaUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      /(^|\.)wikipedia\.org$/i.test(url.hostname)
    )
  } catch {
    return false
  }
}

async function reserveUniqueCandidateSlug(base: string): Promise<string> {
  const seed = slugify(base) || 'candidate'
  let slug = seed.slice(0, 255)
  let suffix = 2

  while (
    await prisma.tzaddikCandidate.findUnique({
      where: { slug },
      select: { id: true },
    })
  ) {
    const suffixText = `-${suffix}`
    slug = `${seed.slice(0, 255 - suffixText.length)}${suffixText}`
    suffix += 1
  }

  return slug
}

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<SubmitBody>(event)

    const displayName = toTrimmedString(body?.displayName, 255)
    const rationale = toTrimmedString(body?.rationale, 65535)
    const wikipediaUrl = toTrimmedString(body?.wikipediaUrl, 2048)
    const biography = toTrimmedString(body?.biography, 65535)
    const lifeState = parseLifeState(body?.lifeState)

    if (!displayName) {
      throw createError({
        statusCode: 400,
        message: '"displayName" is required.',
      })
    }

    const blacklisted = findTzaddikBlacklistEntry(displayName)
    if (blacklisted) {
      throw createError({
        statusCode: 422,
        message: `${blacklisted.name} is on the Tzaddikim blacklist and cannot be nominated.`,
      })
    }

    if (!rationale) {
      throw createError({
        statusCode: 400,
        message: '"rationale" is required.',
      })
    }

    if (!wikipediaUrl || !isWikipediaUrl(wikipediaUrl)) {
      throw createError({
        statusCode: 400,
        message: '"wikipediaUrl" must be a valid wikipedia.org URL.',
      })
    }

    if (!lifeState) {
      throw createError({
        statusCode: 400,
        message: '"lifeState" must be either "LIVING" or "MEMORIAL".',
      })
    }

    const slug = await reserveUniqueCandidateSlug(displayName)

    const submitter = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    })

    const candidate = await prisma.tzaddikCandidate.create({
      data: {
        displayName,
        slug,
        lifeState,
        rationale,
        biography: biography || null,
        wikipediaUrl,
        curationState: 'PENDING',
        submittedByUserId: user.id,
        suggestedBy: submitter?.username || null,
      },
      include: { Tags: true },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Submission received. It will appear once an editor reviews it.',
      data: candidate,
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to submit a Tzaddik candidate.',
      data: null,
      statusCode: statusCode || 500,
    }
  }
})
