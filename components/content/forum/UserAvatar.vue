<template>
  <div>
    <img
      :src="avatarUrl"
      :alt="`${username}'s avatar`"
      class="h-full w-auto rounded-full"
      @error="handleAvatarError"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '../../../stores/userStore'

// Props
const props = defineProps<{ userId?: number }>()

// User Store
const userStore = useUserStore()

// State
const defaultAvatar = '/images/kindart.webp'
const effectiveUserId = computed(() => props.userId ?? userStore.userId)
const username = computed(() => userStore.username || 'Guest')

// Helper to determine if the image is base64 or raw data
const isImageData = (data: string): boolean => {
  return data.startsWith('data:image/') || /^[A-Za-z0-9+/]+={0,2}$/.test(data)
}

// Computed property for avatar URL
const avatarUrl = computed(() => {
  const artImageId = userStore.user.artImageId

  if (!artImageId || !effectiveUserId.value) {
    console.warn(`[Avatar Component] No valid artImageId or userId.`)
    return defaultAvatar
  }

  const userImage = userStore.userImage(effectiveUserId.value)

  if (userImage && isImageData(userImage)) {
    return `data:image/png;base64,${userImage}`
  }

  return userImage || defaultAvatar
})

// Handle avatar loading errors
const handleAvatarError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement
  console.warn(
    `[Avatar Component] Failed to load avatar. Setting default avatar.`,
  )
  imgElement.src = defaultAvatar
}
</script>
