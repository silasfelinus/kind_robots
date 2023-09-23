<template>
  <div :class="['flex flex-col min-h-screen bg-base']">
    <smart-dashboard class="flex flex-row bg-base-200 border rounded-2xl p-2 m-1" />
    <!-- Navbar -->
    <nav class="flex justify-between items-center p-4 text-default">
      <div class="logo text-3xl font-extrabold rounded-2xl border">KindRobots</div>
      <h1 class="text-xl font-bold">@ {{ page.title }}</h1>
      <h2 class="text-lg font-medium">{{ page.subtitle }}</h2>
    </nav>
    <!-- Main Content -->
    <main class="flex-1 p-4">
      <!-- Banner Image -->
      <div class="p-4 rounded-2xl bg-base-200 mx-auto my-6">
        <div class="p-3 rounded-2xl">
          <img
            :src="'/images/' + page.image"
            alt="Main Image"
            class="mx-auto my-2 rounded-lg shadow-lg max-h-1/3"
          />
        </div>
      </div>
      <!-- Display tooltip -->
      <div v-if="showTooltip" class="mt-4 p-3 rounded-2xl bg-accent text-default">
        {{ page.tooltip }}
      </div>
      <slot />
    </main>
    <!-- Footer -->
    <footer>
      <footer-toggle />
    </footer>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
useContentHead(page)

const pageTitle = ref('Kind Robots Presents: ' + page.title || 'Kind Robots')

const isLoggedIn = ref<boolean>(false)
const showDescription = ref<boolean>(true)
const showTooltip = ref<boolean>(true)
</script>
