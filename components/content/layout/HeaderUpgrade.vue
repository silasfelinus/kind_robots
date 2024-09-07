<template>
  <div<template>
  <div class="relative w-full m-1 p-1" style="max-height: 12vh">
    <header
      class="flex items-center justify-between rounded-2xl border p-1 m-1 bg-base-200 w-full h-full"
    >
      <!-- Avatar and Title Section -->
      <div class="flex items-center space-x-1 flex-grow">
        <avatar-image
          alt="User Avatar"
          class="flex max-h-full flex-grow min-h-4 aspect-square m-1"
        />
        <!-- Title and Subtitle Column -->
        <div class="flex flex-col items-center justify-center m-1 flex-grow">
          <h1
            class="text-base sm:text-lg md:text-xl font-semibold text-center truncate max-w-full"
          >
            The {{ page.title || 'Room' }}
          </h1>
          <h2
            class="text-xs sm:text-sm md:text-base text-accent italic text-center truncate max-w-full"
          >
            {{ subtitle }}
          </h2>
        </div>
      </div>

      <!-- Buttons Section -->
      <div class="flex items-center justify-end space-x-1 flex-shrink-0 min-w-0">
        <login-button
          class="flex-1 min-w-0 max-w-[80px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[150px]"
        />
        <theme-toggle
          class="flex-1 min-w-0 max-w-[80px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[150px]"
        />
        <butterfly-toggle class="w-1/6 min-w-0 max-w-[60px] md:max-w-[80px]" />
      </div>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { page } = useContent()
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>

<style scoped>
/* Ensure the header content is in a single row */
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
}

h1 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

h2 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Ensure that room title and subtitle stay within max width */
@media (max-width: 768px) {
  h1 {
    max-width: 120px;
  }

  h2 {
    max-width: 120px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  h1 {
    max-width: 180px;
  }

  h2 {
    max-width: 180px;
  }
}

@media (min-width: 1025px) {
  h1 {
    max-width: 250px;
  }

  h2 {
    max-width: 250px;
  }
}
</style>