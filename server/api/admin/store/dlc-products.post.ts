import { createError, defineEventHandler, H3Error, readBody } from 'h3'
import { ProductType } from '~/prisma/generated/prisma/client'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import prisma from '@/server/utils/prisma'

type DlcProductBody = {
  packId?: unknown
  priceCents?: unknown
  slug?: unknown
  title?: unknown
  currency?: unknown
  active?: unknown
}

function requiredPositiveInt(value: unknown, field: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({ statusCode: 400, message: `${field} must be a positive integer.` })
  }
  return parsed
}

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: `${field} must be a string.` })
  }
  const normalized = value.trim()
  if (!normalized) return null
  return normalized.slice(0, maxLength)
}

function readPackId(metadata: string | null): number | null {
  if (!metadata) return null
  try {
    const parsed = JSON.parse(metadata) as { packId?: unknown }
    const packId = Number(parsed.packId)
    return Number.isInteger(packId) && packId > 0 ? packId : null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const body = await readBody<DlcProductBody>(event)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'DLC product payload is required.' })
    }

    const packId = requiredPositiveInt(body.packId, 'packId')
    const priceCents = requiredPositiveInt(body.priceCents, 'priceCents')
    const pack = await prisma.pack.findUnique({
      where: { id: packId },
      select: { id: true, slug: true, title: true },
    })

    if (!pack) {
      throw createError({ statusCode: 404, message: 'Pack not found.' })
    }

    const slug = optionalText(body.slug, 'slug', 191) ?? `dlc-${pack.slug}`
    const title = optionalText(body.title, 'title', 256) ?? pack.title
    const currency = (optionalText(body.currency, 'currency', 8) ?? 'usd').toLowerCase()
    const active = typeof body.active === 'boolean' ? body.active : true
    const existing = await prisma.product.findUnique({ where: { slug } })

    if (existing) {
      if (existing.type !== ProductType.DLC) {
        throw createError({ statusCode: 409, message: 'Product slug already belongs to a non-DLC product.' })
      }
      const existingPackId = readPackId(existing.metadata)
      if (existingPackId !== null && existingPackId !== pack.id) {
        throw createError({ statusCode: 409, message: 'Product slug already belongs to a different Pack.' })
      }
    }

    const metadata = JSON.stringify({ packId: pack.id, packSlug: pack.slug })
    const product = await prisma.product.upsert({
      where: { slug },
      create: {
        slug,
        type: ProductType.DLC,
        title,
        priceCents,
        currency,
        active,
        metadata,
      },
      update: {
        title,
        priceCents,
        currency,
        active,
        metadata,
      },
    })

    event.node.res.statusCode = existing ? 200 : 201
    return {
      success: true,
      created: !existing,
      data: product,
      message: existing ? 'DLC product updated.' : 'DLC product created.',
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
