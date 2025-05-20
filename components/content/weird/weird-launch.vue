<!-- /components/content/weird/weird-launch.vue -->
<template>
  <div
    class="bg-gradient-to-r from-primary to-secondary h-screen flex items-center justify-center p-4"
  >
    <div
      class="max-w-3xl w-full bg-white text-gray-900 rounded-2xl shadow-lg p-8"
    >
      <!-- Adventure Title -->
      <div
        class="text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400"
      >
        Choose Your Own Infinite AI Adventure
      </div>

      <!-- Story Text -->
      <div class="text-lg mb-6 font-mono text-gray-800 leading-relaxed">
        <p>
          You awaken in a strange, futuristic world. The sky is a swirling mix
          of colors and the ground beneath you hums with energy. A soft voice
          greets you:
        </p>
        <p class="mt-4">
          "Welcome to the realm where artificial intelligence and infinite
          possibilities collide. Will you follow the path of wisdom, or dare to
          explore the unknown? The choice is yours, adventurer."
        </p>
      </div>
      <scenario-gallery />

      <!-- Choices Section -->
      <div class="space-y-4">
        <button
          class="w-full py-3 px-4 text-xl text-white bg-primary hover:bg-accent rounded-xl transition duration-300 shadow-lg"
        >
          Follow the path of wisdom
        </button>
        <button
          class="w-full py-3 px-4 text-xl text-white bg-secondary hover:bg-accent rounded-xl transition duration-300 shadow-lg"
        >
          Explore the unknown
        </button>
        <button
          class="w-full py-3 px-4 text-xl text-white bg-warning hover:bg-accent rounded-xl transition duration-300 shadow-lg"
        >
          Seek out an ally
        </button>
      </div>

      <!-- Footer Text -->
      <div class="mt-8 text-center text-gray-600 text-sm font-mono">
        <p>
          © 2024 Choose Your Own Infinite AI Adventure - All Rights Reserved
        </p>
      </div>
    </div>
  </div>
</template>
