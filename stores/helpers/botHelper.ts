// /stores/helpers/botHelper.ts
import type { Bot } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import { botData } from '@/stores/seeds/seedBots'

export interface BotPayload extends Partial<Bot> {
  serverId?: number | null
  serverName?: string | null
}

export async function updateBot(
  id: number,
  botForm: BotPayload,
  avatarImage?: string,
): Promise<Bot | null> {
  try {
    const payload: BotPayload = {
      ...botForm,
      ...(avatarImage ? { avatarImage } : {}),
    }

    const response = await performFetch<Bot>(`/api/bots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to update bot')
  } catch (error: unknown) {
    handleError(error, 'updating bot')
    return null
  }
}

export async function addBot(botData: BotPayload): Promise<Bot | null> {
  try {
    const response = await performFetch<Bot>('/api/bot', {
      method: 'POST',
      body: JSON.stringify(botData),
    })

    if (response.success && response.data) {
      return response.data
    }

    throw new Error(response.message || 'Failed to add bot')
  } catch (error: unknown) {
    handleError(error, 'adding bot')
    return null
  }
}

export async function addBots(botsData: BotPayload[]): Promise<Bot[]> {
  try {
    const response = await performFetch<Bot[]>('/api/bots', {
      method: 'POST',
      body: JSON.stringify(botsData),
    })

    return response.success && response.data ? response.data : []
  } catch (error: unknown) {
    handleError(error, 'adding bots')
    return []
  }
}

export async function deleteBot(id: number): Promise<boolean> {
  try {
    const response = await performFetch(`/api/bots/${id}`, {
      method: 'DELETE',
    })

    return Boolean(response.success)
  } catch (error: unknown) {
    handleError(error, 'deleting bot')
    return false
  }
}

export async function getBotById(id: number): Promise<Bot | null> {
  try {
    const response = await performFetch<Bot>(`/api/bots/${id}`)
    return response.success && response.data ? response.data : null
  } catch (error: unknown) {
    handleError(error, 'fetching this bot by id')
    return null
  }
}

export async function botImage(bot: Bot): Promise<string> {
  const fallbackImage = bot.avatarImage || '/images/bot.webp'

  if (!bot.artImageId) return fallbackImage

  const artStore = useArtStore()

  try {
    const artImage = await artStore.getArtImageById(bot.artImageId)

    if (!artImage?.imageData) return fallbackImage

    if (artImage.imageData.startsWith('data:image/')) {
      return artImage.imageData
    }

    const fileType = artImage.fileType || 'webp'

    return `data:image/${fileType};base64,${artImage.imageData}`
  } catch (error: unknown) {
    console.error('Error fetching art image:', error)
    return fallbackImage
  }
}

export async function seedBotsHelper(): Promise<Partial<BotPayload>[]> {
  return botData as Partial<BotPayload>[]
}
