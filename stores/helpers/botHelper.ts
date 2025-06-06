// /stores/helpers/botHelper.ts
import type { Bot } from '@prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import { botData } from '@/stores/seeds/seedBots'

export async function updateBot(
  id: number,
  botForm: Partial<Bot>,
  avatarImage?: string,
): Promise<Bot | null> {
  try {
    const payload = { ...botForm, avatarImage }
    const response = await performFetch<Bot>(`/api/bot/id/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (response.success && response.data) return response.data
    throw new Error(response.message)
  } catch (error) {
    handleError(error, 'updating bot')
    return null
  }
}

export async function addBot(botData: Partial<Bot>): Promise<Bot | null> {
  try {
    const response = await performFetch<Bot>('/api/bot', {
      method: 'POST',
      body: JSON.stringify(botData),
    })
    if (response.success && response.data) return response.data
    throw new Error(response.message)
  } catch (error) {
    handleError(error, 'adding bot')
    return null
  }
}

export async function addBots(botsData: Partial<Bot>[]): Promise<Bot[]> {
  try {
    const response = await performFetch<Bot[]>('/api/bots', {
      method: 'POST',
      body: JSON.stringify(botsData),
    })
    return response.success && response.data ? response.data : []
  } catch (error) {
    handleError(error, 'adding bots')
    return []
  }
}

export async function deleteBot(id: number): Promise<boolean> {
  try {
    const response = await performFetch(`/api/bot/id/${id}`, {
      method: 'DELETE',
    })
    return !!response.success
  } catch (error) {
    handleError(error, 'deleting bot')
    return false
  }
}

export async function getBotById(id: number): Promise<Bot | null> {
  try {
    const response = await performFetch<Bot>(`/api/bot/id/${id}`)
    return response.success && response.data ? response.data : null
  } catch (error) {
    handleError(error, 'fetching bot by id')
    return null
  }
}

export async function botImage(bot: Bot): Promise<string> {
  if (!bot || !bot.artImageId) return '/images/bot.webp'
  const artStore = useArtStore()
  try {
    const artImage = await artStore.getArtImageById(bot.artImageId)
    return artImage?.imageData || '/images/bot.webp'
  } catch (error) {
    console.error('Error fetching art image:', error)
    return '/images/bot.webp'
  }
}

export async function seedBotsHelper(): Promise<Partial<Bot>[]> {
  return botData
}
