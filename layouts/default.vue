<template>
  <div class="flex flex-col md:flex-row h-screen text-gray-800">
    <!-- Left column: vertical nav -->
    <div
      class="md:w-1/5 h-full flex flex-col overflow-y-auto shadow-lg bg-gradient-to-r from-bg-base-200 via-base-600 to-bg-base-400 rounded-r-xl"
    >
      <div class="flex-grow bg-primary">
        <title-image />
        <deluxe-nav class="p-4" />
      </div>
    </div>
    <!-- Middle column: nuxt-page -->
    <main
      class="md:w-3/5 h-full flex flex-col bg-base shadow-inner rounded-l-xl transition-all duration-500 relative"
    >
      <transition name="fade" mode="out-in">
        <slot />
      </transition>
    </main>
    <!-- Right column: title-image and status-notifier -->
    <div
      class="md:w-1/5 h-full flex flex-col bg-secondary shadow-inner rounded-l-xl transition-all duration-500 relative"
    >
      <div class="flex-grow p-4">
        <title-image
          class="block hover:text-white rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-500"
        />
        <status-notifier
          class="bg-yellow-300 rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-500"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../stores/botStore'

const botStore = useBotStore()
botStore.loadStore()
</script>

<style>
/* Fade animation for layout transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
