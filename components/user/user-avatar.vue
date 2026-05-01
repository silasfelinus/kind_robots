<!-- /components/content/user/user-avatar.vue -->
<template>
  <div class="flex items-center justify-center">
    <img
      :src="avatarUrl"
      :alt="`${username}'s avatar`"
      class="rounded-full min-h-1 min-w-1 border-bg-200 border-2 object-cover"
      @error="handleAvatarError"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '../../stores/userStore'

const props = defineProps<{ userId?: number }>()

const userStore = useUserStore()

const avatarUrl = ref('/images/kindart.webp')
const effectiveUserId = computed(() => props.userId ?? userStore.userId)
const username = computed(() => userStore.username || 'Guest')

const fetchAvatar = async () => {
  if (!effectiveUserId.value) {
    console.warn('[user-avatar] No valid userId. Using default avatar.')
    return
  }
  try {
    avatarUrl.value = await userStore.userImage(effectiveUserId.value)
  } catch (error) {
    console.error('[user-avatar] Failed to fetch avatar:', error)
    avatarUrl.value = '/images/kindart.webp'
  }
}

const handleAvatarError = (event: Event) => {
  console.warn('[user-avatar] Image failed to load. Falling back to default.')
  ;(event.target as HTMLImageElement).src = '/images/kindart.webp'
}

watch(
  () => [userStore.user?.artImageId, userStore.user?.avatarImage],
  async ([newArtId, newAvatar], [oldArtId, oldAvatar]) => {
    await fetchAvatar()
  },
)

onMounted(fetchAvatar)
</script>

<style scoped>
img {
  height: auto;
  aspect-ratio: 1 / 1;
}
</style>
