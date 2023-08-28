<template>
  <div class="flex flex-col h-screen bg-gradient-to-b from-base to-base-100 text-primary relative">
    <!-- Animated Eyes in Each Corner -->
    <creepy-eyeball class="absolute top-4 left-4" />
    <creepy-eyeball class="absolute top-4 right-4" />
    <creepy-eyeball class="absolute bottom-4 left-4" />
    <creepy-eyeball class="absolute bottom-4 right-4" />

    <!-- Teleport Window/Image -->
    <teleport-window class="self-center w-full h-3/4 z-0" />

    <!-- Overlaid Content -->
    <div class="absolute top-1/4 w-full z-10 flex flex-col items-center">
      <!-- Banner Image -->
      <img
        src="/images/weirdlandia/weird1.png"
        alt="Weirdlandia Banner"
        class="self-center mb-6 w-1/4 h-auto"
      />

      <header class="text-5xl font-bold text-center mb-4">Weirdlandia</header>
      <div class="mx-10 text-center text-xl italic mb-6">
        Step into a realm where anything is possible.
      </div>

      <!-- Main Content - Chat Window Appearance -->
      <div
        class="border-2 border-accent p-10 rounded-xl shadow-xl bg-opacity-60 bg-black max-w-4xl"
      >
        <p v-if="!startNewGame && !showAbout" class="text-lg leading-relaxed mb-6">
          Welcome to "Weirdlandia", a realm where every choice brings a new, unexpected twist.
        </p>

        <p v-if="showAbout" class="text-sm font-semibold mb-6">
          Challenges await at every corner. Carve your own journey in this unpredictable realm.
        </p>

        <div v-if="startNewGame">
          <!-- Start New Game content -->
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center mt-4 space-x-6">
          <button
            class="py-2 px-5 text-xl bg-primary hover:bg-accent focus:outline-none focus:border-accent focus:shadow-outline-accent active:bg-primary rounded-full shadow transition duration-150"
            @click="handleStartNewGame"
          >
            Start New Game
          </button>

          <button
            class="py-2 px-5 text-xl bg-primary hover:bg-accent focus:outline-none focus:border-accent focus:shadow-outline-accent active:bg-primary rounded-full shadow transition duration-150"
            @click="toggleAbout"
          >
            About Weirdlandia
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="absolute bottom-0 w-full text-center pb-4">
      © 2023 Kind Games. All rights reserved.
    </footer>
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
