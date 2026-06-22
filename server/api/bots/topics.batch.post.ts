// server/api/narrator/topics/batch.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { validateApiKey } from '../../../utils/validateKey'
import { errorHandler } from '../../../utils/error'

type TopicInput = {
  slug: string
  title: string
  subtitle?: string | null
  description?: string | null
  icon?: string | null
  prompt: string
  sampleUserPrompt?: string | null
  sortOrder?: number
  isPublic?: boolean
  isActive?: boolean
}

type BatchBody = {
  topics?: TopicInput[]
  dryRun?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // --- auth ---
    const auth = await validateApiKey(event)
    if (!auth.isValid) {
      event.node.res.statusCode = 401
      return { success: false, message: 'Invalid or missing API key.', statusCode: 401 }
    }

    const body = (await readBody(event)) as BatchBody
    const topics = Array.isArray(body?.topics) ? body.topics : []
    const dryRun = body?.dryRun === true

    if (!topics.length) {
      event.node.res.statusCode = 400
      return { success: false, message: 'No topics provided.', statusCode: 400 }
    }

    // --- validate + in-batch dedup on slug ---
    const seen = new Set<string>()
    const errors: Array<{ index: number; slug?: string; message: string }> = []
    const valid: TopicInput[] = []

    topics.forEach((t, index) => {
      if (!t || typeof t.slug !== 'string' || !t.slug.trim()) {
        errors.push({ index, message: 'Missing required field: slug' })
        return
      }
      if (typeof t.title !== 'string' || !t.title.trim()) {
        errors.push({ index, slug: t.slug, message: 'Missing required field: title' })
        return
      }
      if (typeof t.prompt !== 'string' || !t.prompt.trim()) {
        errors.push({ index, slug: t.slug, message: 'Missing required field: prompt' })
        return
      }
      const slug = t.slug.trim()
      if (seen.has(slug)) {
        errors.push({ index, slug, message: 'Duplicate slug within batch' })
        return
      }
      seen.add(slug)
      valid.push({ ...t, slug })
    })

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        message: `Validated ${valid.length} topic(s), ${errors.length} error(s).`,
        wouldUpsert: valid.map((t) => t.slug),
        errors,
        statusCode: 200,
      }
    }

    // --- upsert keyed on unique slug ---
    const results = []
    for (const t of valid) {
      const data = {
        title: t.title,
        subtitle: t.subtitle ?? null,
        description: t.description ?? null,
        icon: t.icon ?? null,
        prompt: t.prompt,
        sampleUserPrompt: t.sampleUserPrompt ?? null,
        sortOrder: typeof t.sortOrder === 'number' ? t.sortOrder : 0,
        isPublic: t.isPublic ?? true,
        isActive: t.isActive ?? true,
      }
      const topic = await prisma.narratorTopic.upsert({
        where: { slug: t.slug },
        update: data,
        create: { slug: t.slug, ...data },
      })
      results.push(topic)
    }

    return {
      success: true,
      message: `Upserted ${results.length} topic(s).`,
      data: results,
      errors,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500
    return { success: false, message: handled.message, statusCode: handled.statusCode || 500 }
  }
})
