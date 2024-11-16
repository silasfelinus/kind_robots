<template>
  <nuxt-link to="/dashboard" class="block">
    <nuxt-img
      v-if="avatarImage"
      :src="avatarImage"
      class="rounded-full object-cover"
      :alt="'User Avatar'"
      :width="size"
      :height="size"
    />
    <div
      v-else
      class="flex items-center justify-center rounded-full bg-base-300"
      :style="{ width: size + 'px', height: size + 'px' }"
    >
      <Icon name="kind-icon:person" class="w-1/2 h-1/2 text-accent" />
    </div>
  </nuxt-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

const userStore = useUserStore()
const artStore = useArtStore()

// Determine the avatar image source
const avatarImage = computed(() => {
  const user = userStore.user
  if (user?.artImageId) {
    const artImage = artStore.getArtImageById(user.artImageId)
    return artImage?.imageData || null
  }
  return user?.avatarImage || null
})

const size = 40
</script>
