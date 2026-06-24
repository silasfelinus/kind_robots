import { nextTick, watch } from 'vue'
import { defineNuxtPlugin } from '#app'
import { useNarratorStore } from '@/stores/narratorStore'

const AMI_SLUG = 'ami-butterfly'

const amiExpressionImages: Record<string, string> = {
  NEUTRAL: '/images/bots/expressions/ami-butterfly/neutral_01.webp',
  JOYFUL: '/images/bots/expressions/ami-butterfly/joyful_01.webp',
  SORROWFUL: '/images/bots/expressions/ami-butterfly/sorrowful_01.webp',
  AFRAID: '/images/bots/expressions/ami-butterfly/afraid_01.webp',
  DISGUSTED: '/images/bots/expressions/ami-butterfly/disgusted_01.webp',
  ENRAGED: '/images/bots/expressions/ami-butterfly/enraged_01.webp',
  SURPRISED: '/images/bots/expressions/ami-butterfly/surprised_01.webp',
  ANXIOUS: '/images/bots/expressions/ami-butterfly/anxious_01.webp',
  PROUD: '/images/bots/expressions/ami-butterfly/proud_01.webp',
  LOVING: '/images/bots/expressions/ami-butterfly/loving_01.webp',
  LAUGHING: '/images/bots/expressions/ami-butterfly/joyful_01.webp',
  CRYING: '/images/bots/expressions/ami-butterfly/sorrowful_01.webp',
  SLEEPING: '/images/bots/expressions/ami-butterfly/neutral_01.webp',
  THINKING: '/images/bots/expressions/ami-butterfly/anxious_01.webp',
  SHRUGGING: '/images/bots/expressions/ami-butterfly/surprised_01.webp',
  WINKING: '/images/bots/expressions/ami-butterfly/joyful_01.webp',
  FACEPALMING: '/images/bots/expressions/ami-butterfly/disgusted_01.webp',
  CHEERING: '/images/bots/expressions/ami-butterfly/proud_01.webp',
  WHISPERING: '/images/bots/expressions/ami-butterfly/neutral_01.webp',
  SHOUTING: '/images/bots/expressions/ami-butterfly/enraged_01.webp',
  CUSTOM: '/images/bots/expressions/ami-butterfly/neutral_01.webp',
}

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return

  const narratorStore = useNarratorStore()

  const isAmiNarrator = () => {
    return String(narratorStore.narratorBot?.slug || '').toLowerCase() === AMI_SLUG
  }

  const currentAmiImage = () => {
    const rowImage = narratorStore.currentEmotionRow?.imagePath

    if (rowImage) return rowImage

    const expression = String(narratorStore.currentEmotion || 'NEUTRAL').toUpperCase()

    return amiExpressionImages[expression] || amiExpressionImages.NEUTRAL
  }

  const applyFallbackImage = () => {
    if (!isAmiNarrator()) return

    const imagePath = currentAmiImage()
    const images = document.querySelectorAll<HTMLImageElement>(
      'img[alt="Ami-butterfly"], img[alt="ami-butterfly"], img[alt="AMI-butterfly"]',
    )

    images.forEach((image) => {
      if (image.getAttribute('src') === imagePath) return

      image.src = imagePath
      image.setAttribute('src', imagePath)
    })
  }

  const queueFallbackImage = () => {
    void nextTick(() => {
      applyFallbackImage()
      window.setTimeout(applyFallbackImage, 160)
      window.setTimeout(applyFallbackImage, 520)
    })
  }

  watch(
    () => [
      narratorStore.currentEmotion,
      narratorStore.currentEmotionRow?.imagePath,
      narratorStore.narratorImage,
      narratorStore.narratorBot?.slug,
    ],
    queueFallbackImage,
    { immediate: true },
  )
})
