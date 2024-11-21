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

// Computed boolean to check if the user has an art image
const hasArtImage = computed(() => {
  const user = userStore.users.find((u) => u.id === effectiveUserId.value)
  return !!user?.artImageId
})

// Computed property for avatar URL
const avatarUrl = computed(() => {
  if (hasArtImage.value) {
    const user = userStore.users.find((u) => u.id === effectiveUserId.value)
    return user?.artImageId // Replace with logic to fetch the actual art image if needed
  }

  // Fallback to user's avatarImage or default avatar
  const user = userStore.users.find((u) => u.id === effectiveUserId.value)
  return user?.avatarImage || defaultAvatar
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
