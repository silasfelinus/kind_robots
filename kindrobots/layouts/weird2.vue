<template>
  <div class="flex flex-col h-screen bg-gradient-to-b from-base to-base-100 text-primary relative">
    <!-- Navigation -->
    <weird-nav />

    <!-- Animated Eyes in Each Corner -->
    <creepy-eyeball position="top-left" class="z-100" />
    <creepy-eyeball position="top-right" />
    <creepy-eyeball position="bottom-left" />
    <creepy-eyeball position="bottom-right" />

    <!-- Teleport Image -->
    <teleport-window class="self-center w-full h-3/4 z-0" />

    <!-- Overlaid Content -->
    <weird-banner />
    <slot />

    <ChatWindow
      :start-new-game="startNewGame"
      :show-about="showAbout"
      @toggle-game="handleStartNewGame"
      @toggle-about="toggleAbout"
    />

    <!-- Home Link -->
    <NuxtLink to="/">Home</NuxtLink>

    <!-- Rebel Button -->
    <RebelButton label="Click me!" />

    <!-- Footer -->
    <weird-footer />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const startNewGame = ref(false)
const showAbout = ref(false)

const handleStartNewGame = () => {
  startNewGame.value = true
  showAbout.value = false
}

const toggleAbout = () => {
  showAbout.value = !showAbout.value
  startNewGame.value = false
}
</script>
