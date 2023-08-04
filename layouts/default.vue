<template>
  <div class="flex flex-col md:flex-row h-screen text-gray-800">
    <!-- Left column: vertical nav -->
    <div
      class="md:w-1/5 h-full flex flex-col overflow-y-auto shadow-lg bg-gradient-to-r from-bg-base-200 via-base-400 to-bg-base-600 rounded-r-xl p-4"
    >
      <nuxt-link to="/" class="block transition-colors duration-500 hover:text-white mb-4">
        <img
          src="/images/fulltitle.png"
          class="mx-auto shadow-lg hover:shadow-2xl transition-shadow duration-500"
          alt="Title"
        />
      </nuxt-link>
      <deluxe-nav class="flex-grow bg-base rounded-xl p-4" />
    </div>
    <!-- Middle column: nuxt-page -->
    <main
      class="md:w-3/5 h-full flex flex-col bg-base shadow-inner rounded-l-xl transition-all duration-500 relative p-4"
    >
      <transition name="fade" mode="out-in">
        <slot />
      </transition>
    </main>
    <!-- Right column: title-image and status-notifier -->
    <div
      class="md:w-1/5 h-full flex flex-col bg-base shadow-inner rounded-l-xl transition-all duration-500 relative p-4"
    >
      <title-image
        class="block hover:text-white rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-500 mb-4"
      />
      <status-notifier
        class="bg-accent rounded-full shadow-lg hover:shadow-2xl transition-shadow duration-500 mb-4"
      />
      <div
        v-if="currentBot"
        class="flex-grow p-4 flex flex-col justify-center items-center bg-accent rounded-xl shadow-lg animation-fade"
      >
        <avatar-image />
        <button class="bg-accent hover:bg-accent-dark text-white py-2 px-4 rounded-full mt-4">
          Chat with {{ currentBot.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotStore } from '../stores/botStore'

const botStore = useBotStore()
botStore.loadStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)
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
