<template>
  <header class="bg-base-200 flex items-center justify-between p-1">
    <!-- Left Section -->
    <div class="flex flex-col md:flex-row items-center w-full md:w-auto">
      <div class="flex-shrink-0">
        <avatar-image :size="avatarSize" class="m-2 rounded-2xl" />
      </div>
      <div class="flex flex-col items-center w-full md:w-auto">
        <room-title class="text-lg font-semibold w-full border-b text-center" />
        <h2 v-if="pageSubtitle" class="text-sm text-gray-500 italic text-center">
          {{ pageSubtitle }}
        </h2>
      </div>
    </div>
    <!-- Right Section -->
    <div class="flex items-center justify-center flex-wrap space-x-2 w-auto">
      <jellybean-count />
      <login-button />
      <theme-toggle />
      <butterfly-toggle />
    </div>
  </header>
</template>

<script lang="ts" setup>
import { useUserStore } from '@/stores/userStore';
const { page } = useContent();
const userStore = useUserStore();
const username = computed(() => userStore.username);
const user = computed(() => userStore.user);
const pageSubtitle = computed(() => page.subtitle);

const avatarSize = 'small';
</script>
