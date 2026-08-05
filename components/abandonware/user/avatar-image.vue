<!-- /components/content/story/avatar-image.vue -->
<template>
  <div v-if="hydrated" class="relative h-full w-full">
    <div class="flip-card h-full w-full" @click.stop="handleAvatarClick">
      <div class="flip-card-inner" :class="{ 'is-flipped': flipped }">
        <div class="flip-card-front">
          <img
            v-if="resolvedImage"
            :src="resolvedImage"
            alt="Avatar"
            class="h-full w-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
            @error="resolvedImage = null"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-base-300"
          >
            <Icon name="kind-icon:person" class="h-full w-full text-accent" />
          </div>
        </div>
        <div class="flip-card-back">
          <img
            v-if="resolvedImage"
            :src="resolvedImage"
            alt="Avatar back"
            class="h-full w-full object-cover shadow-lg hover:shadow-xl"
            draggable="false"
            @error="resolvedImage = null"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-base-300"
          >
            <Icon name="kind-icon:person" class="h-full w-full text-accent" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import type { ArtImage } from '~/prisma/generated/prisma/client'

const flipped = ref(false)
const hydrated = ref(false)
const resolvedImage = ref<string | null>(null)

const userStore = useUserStore()
const artStore = useArtStore()
const errorStore = useErrorStore()

const FALLBACK = '/images/kindart.webp'

function looksLikeBase64(value: string): boolean {
  const compact = value.replace(/\s+/g, '')
  return compact.length >= 64 && compact.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(compact)
}

function asImageSource(value?: string | null): string {
  const clean = value?.trim() || ''
  if (!clean || clean === 'undefined' || clean === 'UNDEFINED') return ''
  if (clean.startsWith('data:image/')) return clean
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('/')) return clean
  if (clean.startsWith('./') || clean.startsWith('images/') || /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(clean)) {
    return `/${clean.replace(/^\/+/, '').replace(/^\.\//, '')}`
  }
  return looksLikeBase64(clean) ? `data:image/png;base64,${clean}` : ''
}

function imageSourceFromArt(image?: ArtImage | null): string {
  return (
    asImageSource(image?.imageData) ||
    asImageSource(image?.imagePath) ||
    asImageSource(image?.path) ||
    asImageSource(image?.thumbnailData)
  )
}

async function fetchAvatar() {
  const user = userStore.user
  if (!user) {
    resolvedImage.value = null
    return
  }

  if (user.artImageId) {
    const image = await artStore.getArtImageById(user.artImageId, {
      includeImageData: true,
      includeThumbnailData: true,
    })
    const source = imageSourceFromArt(image) || asImageSource(user.avatarImage)
    resolvedImage.value = source && source !== FALLBACK ? source : null
    return
  }

  const source = asImageSource(user.avatarImage)
  resolvedImage.value = source && source !== FALLBACK ? source : null
}

watch(
  () => [userStore.user?.id, userStore.user?.artImageId, userStore.user?.avatarImage],
  () => {
    void fetchAvatar()
  },
)

onMounted(async () => {
  hydrated.value = true
  await fetchAvatar()
})

function handleAvatarClick() {
  try {
    flipped.value = !flipped.value
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle'
    errorStore.setError(ErrorType.INTERACTION_ERROR, message)
  }
}
</script>

<style scoped>
.flip-card {
  width: 100%;
  height: 100%;
  perspective: 1000px;
  cursor: pointer;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 1rem;
  overflow: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}
</style>
