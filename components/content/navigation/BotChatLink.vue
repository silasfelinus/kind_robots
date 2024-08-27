<template>
  <div class="icon-link-container">
    <NuxtLink
      to="/botcafe"
      :class="[
        'flex',
        'items-center',
        'justify-center',
        'rounded-2xl',
        'bg-base-200',
        'text-center',
        'hover:scale-110',
        'hover:glow-animation',
        isCurrentPage ? 'text-gray-400' : '',
      ]"
    >
      <icon name="ic:baseline-wechat" class="icon-effect" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from './../../../stores/contentStore'

const contentStore = useContentStore()
const isCurrentPage = computed(
  () => contentStore.currentPage?._path === '/botchat',
)
</script>

<style scoped>
.glow-animation:hover {
  animation: glow 1.5s infinite;
}
</style>
