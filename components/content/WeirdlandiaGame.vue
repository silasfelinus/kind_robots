<template>
  <div class="flex flex-col h-screen bg-base text-primary relative">
    <!-- Animated Eyes in Each Corner -->
    <creepy-eyeball class="absolute top-4 left-4" />
    <creepy-eyeball class="absolute top-4 right-4" />
    <creepy-eyeball class="absolute bottom-4 left-4" />
    <creepy-eyeball class="absolute bottom-4 right-4" />

    <header class="text-5xl font-bold mt-10 text-center">Weirdlandia</header>
    <div class="mx-10 mt-6 text-center text-xl italic">
      Step into a realm where anything is possible.
    </div>

    <!-- Main Content -->
    <div class="flex flex-col justify-center items-center flex-grow">
      <div
        class="border-2 border-accent p-10 rounded-xl shadow-xl bg-opacity-60 bg-black max-w-4xl"
      >
        <!-- Introductory Text -->
        <p class="text-lg leading-relaxed mb-6">
          Welcome to "Weirdlandia", a realm where every choice brings a new, unexpected twist. Brace
          yourself for the unpredictable.
        </p>
        <p class="text-sm font-semibold mb-6">
          Challenges await at every corner. You may be presented with three paths, but remember,
          you're free to carve your own journey. The dice determines outcomes, but your attributes:
          Swol, Likability, Weirdness, and Flavor will guide you.
        </p>
        <!-- Action Buttons -->
        <div class="flex justify-between mt-4">
          <button
            class="py-2 px-4 bg-primary hover:bg-accent focus:outline-none focus:border-accent focus:shadow-outline-accent active:bg-primary rounded-full shadow transition duration-150"
          >
            Start Adventure
          </button>
        </div>
      </div>
    </div>

    <footer class="text-center pb-4">© 2023 Kind Games. All rights reserved.</footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue'

const globalMouseX = ref(0)
const globalMouseY = ref(0)

function handleGlobalMouseMove(event: MouseEvent) {
  globalMouseX.value = event.clientX
  globalMouseY.value = event.clientY
}

onMounted(() => {
  document.addEventListener('mousemove', handleGlobalMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove)
})

provide('globalMouseX', globalMouseX)
provide('globalMouseY', globalMouseY)
</script>
