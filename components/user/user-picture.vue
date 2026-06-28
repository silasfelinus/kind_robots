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

const userStore = useUserStore()
const size = 40
const fallbackAvatar = '/images/kindart.webp'
const avatarImage = ref<string | null>(fallbackAvatar)

async function refreshAvatar() {
  avatarImage.value = await userStore.userImage()
}

watch(
  () => [userStore.user?.id, userStore.user?.artImageId, userStore.user?.avatarImage],
  () => {
    void refreshAvatar()
  },
  { immediate: true },
)
</script>
