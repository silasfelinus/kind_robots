<template>
  <nuxt-link to="/dashboard" class="block">
    <!-- Show the avatar image if available -->
    <nuxt-img
      v-if="avatarImage"
      :src="avatarImage"
      class="rounded-full object-cover h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
      :alt="'User Avatar'"
    />
    <!-- Fallback to icon if no avatar image -->
    <div
      v-else
      class="flex items-center justify-center rounded-full bg-base-300"
      :style="{ width: size + 'px', height: size + 'px' }"
    >
      <Icon name="kind-icon:person" class="w-full h-full text-accent" />
    </div>
  </nuxt-link>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useArtStore } from '@/stores/artStore'

const userStore = useUserStore()
const artStore = useArtStore()

// Reactive size
const size = 40

// Compute avatar image dynamically
const avatarImage = computed(() => {
  const user = userStore.user

  // Check for art image if artImageId exists
  if (user?.artImageId) {
    const artImage = artStore.getArtImageById(user.artImageId)
    return artImage?.imageData || user.avatarImage || null
  }

  // Fallback to user's default avatar image
  return user?.avatarImage || null
})
</script>
