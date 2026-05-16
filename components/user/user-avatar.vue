<!-- /components/content/user/user-avatar.vue -->
<template>
  <div class="flex items-center justify-center">
    <img
      :src="avatarUrl"
      :alt="`${displayName}'s avatar`"
      class="aspect-square min-h-1 min-w-1 rounded-full border-2 border-base-200 object-cover"
      @error="handleAvatarError"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '../../stores/userStore'

const props = defineProps<{
  userId?: number
  username?: string
}>()

const userStore = useUserStore()

const fallbackAvatar = '/images/kindart.webp'
const avatarUrl = ref(fallbackAvatar)

const effectiveUserId = computed(() => props.userId ?? userStore.userId)

const displayName = computed(() => {
  return props.username || userStore.username || 'Guest'
})

const fetchAvatar = async () => {
  const id = effectiveUserId.value

  if (!id) {
    avatarUrl.value = fallbackAvatar
    return
  }

  avatarUrl.value = await userStore.userImage(id)
}

const handleAvatarError = (event: Event) => {
  ;(event.target as HTMLImageElement).src = fallbackAvatar
}

watch(() => [effectiveUserId.value, userStore.user?.artImageId], fetchAvatar)

onMounted(fetchAvatar)
</script>
