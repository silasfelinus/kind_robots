<template>
  <div class="border-2 border-accent p-10 rounded-xl shadow-xl bg-opacity-60 bg-black max-w-4xl">
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
