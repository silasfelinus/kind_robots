<!-- /components/content/user/user-picture.vue -->
<template>
  <nuxt-link to="/dashboard" class="block">
    <nuxt-img
      v-if="avatarImage"
      :src="avatarImage"
      class="rounded-full border border-accent object-cover transition-transform duration-300 ease-in-out hover:scale-110 h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14"
      alt="User avatar"
      @error="avatarImage = fallbackAvatar"
    />
    <div
      v-else
      class="flex items-center justify-center rounded-full bg-base-300"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
      <Icon name="kind-icon:person" class="h-full w-full text-accent" />
    </div>
  </nuxt-link>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'
import type { ArtImage } from '~/prisma/generated/prisma/client'

const userStore = useUserStore()
const artStore = useArtStore()
const size = 40
const fallbackAvatar = '/images/kindart.webp'
const avatarImage = ref<string | null>(fallbackAvatar)

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
    asImageSource(image?.thumbnailData) ||
    asImageSource(image?.imageData) ||
    asImageSource(image?.imagePath) ||
    asImageSource(image?.path)
  )
}

async function refreshAvatar() {
  const user = userStore.user
  if (!user) {
    avatarImage.value = fallbackAvatar
    return
  }

  if (user.artImageId) {
    const image = await artStore.getArtImageById(user.artImageId, {
      includeImageData: true,
      includeThumbnailData: true,
    })
    avatarImage.value = imageSourceFromArt(image) || asImageSource(user.avatarImage) || fallbackAvatar
    return
  }

  avatarImage.value = asImageSource(user.avatarImage) || fallbackAvatar
}

watch(
  () => [userStore.user?.id, userStore.user?.artImageId, userStore.user?.avatarImage],
  () => {
    void refreshAvatar()
  },
  { immediate: true },
)
</script>
