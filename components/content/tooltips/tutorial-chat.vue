<template>
  <div class="flex flex-col h-full w-full">
    <!-- Messages Area -->
    <div class="flex items-center justify-center gap-2 h-[15vh] m-2">
      <div
        v-if="page.tooltip"
        class="message-card bg-accent"
      >
        <img
          src="/images/silasfelinus.webp"
          alt="Silas"
          class="rounded-full"
        >
        <div>
          <div class="text-sm font-semibold">
            silasfelinus
          </div>
          <div class="text-lg">
            {{ page.tooltip }}
          </div>
        </div>
      </div>
      <div
        v-if="page.amitip"
        class="message-card bg-accent"
      >
        <img
          src="/images/amibotsquare1.webp"
          alt="AMI"
          class="rounded-full"
        >
        <div>
          <div class="text-sm font-semibold">
            AMIbot
          </div>
          <div class="text-lg">
            {{ page.amitip }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const showInfo = computed(() => pageStore.showInfo)
const { page } = useContent()
</script>

<style>
.message-card {
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}
</style>
