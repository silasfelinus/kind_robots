import prisma from '../prisma'
import {
  normalizeArtModelRef,
  type ArtModelRef,
  type ArtModelType,
} from '@/utils/artModelContext'

export type ArtModelViewer = {
  userId: number
  isAdmin: boolean
}

export type ResolvedArtModelContext = {
  modelType: ArtModelType
  id: number
  slug?: string
  title: string
  fields: Record<string, string | number | boolean>
}

type ScalarRecord = Record<string, unknown> & {
  id: number
  slug?: string | null
  title?: string | null
  name?: string | null
}

function identityWhere(ref: ArtModelRef): { id: number } | { slug: string } {
  return ref.id ? { id: ref.id } : { slug: ref.slug! }
}

function visibleWhere(viewer: ArtModelViewer) {
  return viewer.isAdmin
    ? {}
    : {
        OR: [{ isPublic: true }, { userId: viewer.userId }],
      }
}

function compactText(value: string, maxLength = 1400): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLength) return clean
  return `${clean.slice(0, maxLength - 1).trim()}…`
}

function cleanFields(
  record: ScalarRecord,
): Record<string, string | number | boolean> {
  const fields: Record<string, string | number | boolean> = {}

  for (const [key, value] of Object.entries(record)) {
    if (['id', 'slug', 'title', 'name'].includes(key)) continue
    if (value == null || value === '') continue

    if (typeof value === 'string') {
      const text = compactText(value)
      if (text) fields[key] = text
      continue
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      fields[key] = value
    }
  }

  return fields
}

function resolvedContext(
  modelType: ArtModelType,
  record: ScalarRecord | null,
): ResolvedArtModelContext | null {
  if (!record) return null
  const title = compactText(
    record.title || record.name || record.slug || `${modelType} ${record.id}`,
  )

  return {
    modelType,
    id: record.id,
    ...(record.slug ? { slug: record.slug } : {}),
    title,
    fields: cleanFields(record),
  }
}

export async function resolveArtModelContext(
  value: unknown,
  viewer: ArtModelViewer,
): Promise<ResolvedArtModelContext | null> {
  const ref = normalizeArtModelRef(value)
  if (!ref) return null
  const where = {
    ...identityWhere(ref),
    ...visibleWhere(viewer),
  }

  switch (ref.modelType) {
    case 'project':
      return resolvedContext(
        ref.modelType,
        await prisma.project.findFirst({
          where,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            pitch: true,
            flavorText: true,
            goal: true,
            status: true,
            priority: true,
            channelKey: true,
            tabKey: true,
            designer: true,
          },
        }),
      )

    case 'bot':
      return resolvedContext(
        ref.modelType,
        await prisma.bot.findFirst({
          where,
          select: {
            id: true,
            slug: true,
            name: true,
            subtitle: true,
            description: true,
            botIntro: true,
            BotType: true,
            theme: true,
            personality: true,
            modules: true,
            sampleResponse: true,
            tagline: true,
            designer: true,
            artPrompt: true,
            forgeIntro: true,
            narrativeVoice: true,
          },
        }),
      )

    case 'character':
      return resolvedContext(
        ref.modelType,
        await prisma.character.findFirst({
          where,
          select: {
            id: true,
            slug: true,
            name: true,
            title: true,
            honorific: true,
            species: true,
            class: true,
            gender: true,
            presentation: true,
            role: true,
            genre: true,
            alignment: true,
            personality: true,
            quirks: true,
            backstory: true,
            drive: true,
            achievements: true,
            voice: true,
            charm: true,
            empathy: true,
            grace: true,
            luck: true,
            might: true,
            wits: true,
            artPrompt: true,
          },
        }),
      )

    case 'dream':
      return resolvedContext(
        ref.modelType,
        await prisma.dream.findFirst({
          where,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            pitch: true,
            flavorText: true,
            examples: true,
            dreamType: true,
            designer: true,
            artPrompt: true,
          },
        }),
      )

    case 'scenario':
      return resolvedContext(
        ref.modelType,
        await prisma.scenario.findFirst({
          where,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            intros: true,
            locations: true,
            genres: true,
            inspirations: true,
            difficulty: true,
            group: true,
            tier: true,
            cast: true,
            outputType: true,
            artPrompt: true,
          },
        }),
      )

    case 'reward':
      return resolvedContext(
        ref.modelType,
        await prisma.reward.findFirst({
          where,
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            effect: true,
            flavorText: true,
            rewardType: true,
            rarity: true,
            collection: true,
            icon: true,
            artPrompt: true,
          },
        }),
      )

    case 'facet':
      return resolvedContext(
        ref.modelType,
        await prisma.facet.findFirst({
          where,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            flavorText: true,
            examples: true,
            icon: true,
            designer: true,
            artPrompt: true,
          },
        }),
      )
  }
}
