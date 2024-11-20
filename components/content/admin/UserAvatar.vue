<template>
  <div>
    <img
      :src="avatarUrl"
      :alt="`${username}'s avatar`"
      class="h-full w-auto rounded-full"
      @error="setDefaultAvatar"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '../../../stores/userStore'

// Props
const props = defineProps<{ userId?: number }>()

const userStore = useUserStore()

// Determine the effective user ID
const effectiveUserId = computed(() => props.userId ?? userStore.userId)

// Computed for Username
const username = computed(() => userStore.username || 'Guest')

// Computed for Avatar URL
const avatarUrl = computed(() => {
  const userImage = userStore.userImage(effectiveUserId.value)
  return userImage || '/images/kindart.webp'
})

// Fallback for avatar loading errors
const setDefaultAvatar = (event: Event) => {
  const imgElement = event.target as HTMLImageElement
  imgElement.src = '/images/kindart.webp'
}
</script>
