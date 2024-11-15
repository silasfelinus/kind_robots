<template>
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
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const avatarImage = computed(() => userStore.user?.avatarImage)
const size = 40
</script>
