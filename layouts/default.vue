<template>
  <div class="flex flex-col md:flex-row h-screen text-gray-800 space-y-4 md:space-y-0 md:space-x-4">
    <div
      class="md:w-1/5 h-full flex flex-col overflow-y-auto shadow-lg bg-gradient-to-r from-bg-base-200 via-base-400 to-bg-base-600 rounded-r-xl p-4 space-y-4"
    >
      <nuxt-link to="/" class="block transition-colors duration-500 hover:text-white">
        <img
          src="/images/fulltitle.png"
          class="mx-auto w-full h-auto shadow-lg hover:shadow-2xl transition-shadow duration-500"
          alt="Title"
        />
        <home-nav></home-nav>
        <theme-selector />
      </nuxt-link>
      <bot-carousel class="flex-grow bg-base rounded-xl p-4" />
    </div>
    <main
      class="md:w-3/5 h-full flex flex-col bg-base shadow-inner rounded-l-xl transition-all duration-500 relative p-4 space-y-4"
    >
      <transition name="fade" mode="out-in">
        <div>
          <slot />
        </div>
      </transition>
    </main>
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
