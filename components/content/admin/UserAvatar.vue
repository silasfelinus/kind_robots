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
import { ref, computed } from 'vue'
import { useUserStore } from '../../../stores/userStore'

// Props
const props = defineProps<{ userId?: number }>()

const userStore = useUserStore()

// Determine the user to fetch
const effectiveUserId = computed(() => props.userId ?? userStore.user?.id)

// Computed Properties
const username = computed(() => {
  if (effectiveUserId.value === undefined) return 'User'
  const user = userStore.getUserById(effectiveUserId.value)
  return user?.username || 'User'
})

// Ref for Avatar URL with a fallback on error
const avatarUrl = ref(
  effectiveUserId.value !== undefined
    ? userStore.userImage(effectiveUserId.value)
    : '/images/kindart.webp',
)

const setDefaultAvatar = () => {
  avatarUrl.value = '/images/kindart.webp'
}
</script>
