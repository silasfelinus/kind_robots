import { defineNuxtPlugin } from '#app'
import { useNarratorStore } from '@/stores/narratorStore'
import { performFetch } from '@/stores/utils'

const DEFAULT_NARRATOR_ID = 433
const DEFAULT_NARRATOR_SLUG = 'ami-butterfly'

type DefaultNarratorBot = {
  id?: number | null
  name?: string | null
  slug?: string | null
  prompt?: string | null
  personality?: string | null
  narrativeVoice?: string | null
  botIntro?: string | null
  forgeIntro?: string | null
  imagePath?: string | null
  avatarImage?: string | null
  chatBorderImage?: string | null
  ExpressionMedia?: unknown[] | null
  NarratorThreads?: unknown[] | null
}

function isDefaultNarrator(bot: DefaultNarratorBot | null | undefined): boolean {
  return (
    Number(bot?.id) === DEFAULT_NARRATOR_ID ||
    String(bot?.slug || '').toLowerCase() === DEFAULT_NARRATOR_SLUG
  )
}

export default defineNuxtPlugin(async () => {
  if (!import.meta.client) return

  const narratorStore = useNarratorStore()
  const activeNarrator = narratorStore.narratorBot as DefaultNarratorBot | null

  if (!isDefaultNarrator(activeNarrator)) return

  try {
    const response = await performFetch<DefaultNarratorBot>(
      `/api/bots/${DEFAULT_NARRATOR_ID}`,
    )

    const defaultNarrator = response.success ? response.data : null

    if (!isDefaultNarrator(defaultNarrator)) return

    const expressionMedia = Array.isArray(defaultNarrator?.ExpressionMedia)
      ? defaultNarrator.ExpressionMedia
      : []

    if (!expressionMedia.length) return

    Object.assign(activeNarrator, {
      name: defaultNarrator?.name || activeNarrator?.name,
      slug: defaultNarrator?.slug || activeNarrator?.slug,
      prompt: defaultNarrator?.prompt || activeNarrator?.prompt,
      personality: defaultNarrator?.personality || activeNarrator?.personality,
      narrativeVoice:
        defaultNarrator?.narrativeVoice || activeNarrator?.narrativeVoice,
      botIntro: defaultNarrator?.botIntro || activeNarrator?.botIntro,
      forgeIntro: defaultNarrator?.forgeIntro || activeNarrator?.forgeIntro,
      imagePath: defaultNarrator?.imagePath || activeNarrator?.imagePath,
      avatarImage: defaultNarrator?.avatarImage || activeNarrator?.avatarImage,
      chatBorderImage:
        defaultNarrator?.chatBorderImage ?? activeNarrator?.chatBorderImage,
      ExpressionMedia: expressionMedia,
      NarratorThreads: Array.isArray(defaultNarrator?.NarratorThreads)
        ? defaultNarrator.NarratorThreads
        : activeNarrator?.NarratorThreads,
    })

    narratorStore.setEmotion(narratorStore.currentEmotion, false)
  } catch (error) {
    console.warn('Could not hydrate the default narrator bot.', error)
  }
})
