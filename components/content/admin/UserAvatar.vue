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

// Effective user ID
const effectiveUserId = computed(() => {
  if (props.userId) {
    console.debug(`[Avatar Component] Using provided userId: ${props.userId}`)
    return props.userId
  }
  if (userStore.userId) {
    console.debug(`[Avatar Component] Using store userId: ${userStore.userId}`)
    return userStore.userId
  }
  console.warn(`[Avatar Component] No valid userId found. Defaulting to Guest.`)
  return null
})

// Username
const username = computed(() => {
  if (userStore.username) {
    return userStore.username
  }
  console.warn(`[Avatar Component] Username not found. Defaulting to "Guest".`)
  return 'Guest'
})

// Avatar URL
const avatarUrl = computed(() => {
  if (!effectiveUserId.value) {
    console.warn(`[Avatar Component] No effective userId. Using default avatar.`)
    return '/images/kindart.webp'
  }
  const userImage = userStore.userImage(effectiveUserId.value)
  if (userImage) {
    console.debug(`[Avatar Component] Avatar found for userId: ${effectiveUserId.value}`)
    return userImage
  }
  console.warn(`[Avatar Component] No avatar found for userId: ${effectiveUserId.value}. Using default avatar.`)
  return '/images/kindart.webp'
})

// Handle avatar loading errors
const handleAvatarError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement
  console.error(`[Avatar Component] Failed to load avatar for ${username.value}. Setting default avatar.`)
  imgElement.src = '/images/kindart.webp'
}
</script>
