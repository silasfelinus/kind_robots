<template>
  <div class="relative w-full m-1 p-1" style="max-height: 12vh">
    <header
      class="flex items-center justify-between rounded-2xl border p-1 m-1 bg-base-200 w-full max-w-[95vw] space-x-2"
    >
      <!-- Avatar and Title Section -->
      <div class="flex items-center rounded-2xl space-x-3 flex-grow">
        <avatar-image
          alt="User Avatar"
          class="max-h-full flex-grow min-h-4 aspect-square m-1 rounded-2xl"
        />
        <!-- Title and Subtitle Column -->
        <div class="flex flex-col items-center justify-center m-1 flex-grow">
          <h1
            class="text-base sm:text-lg md:text-xl font-semibold text-center max-w-full"
          >
            The {{ page.title || 'Room' }} Room
          </h1>
          <h2
            class="text-xs sm:text-sm md:text-base text-accent italic text-center max-w-full"
          >
            {{ subtitle }}
          </h2>
        </div>
      </div>

      <!-- Buttons Section -->
      <div class="flex items-center justify-end space-x-2 flex-shrink-0">
        <login-button
          class="flex-1 max-w-[90px] sm:max-w-[110px] md:max-w-[130px] lg:max-w-[150px]"
        />
        <theme-toggle
          class="flex-1 max-w-[90px] sm:max-w-[110px] md:max-w-[130px] lg:max-w-[150px]"
        />
        <butterfly-toggle
          class="flex-1 w-[50px] sm:w-[60px] md:w-[70px] lg:w-[80px]"
        />
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
  margin-left: auto;
  margin-right: auto;
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
    max-width: 140px;
  }

  h2 {
    max-width: 140px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  h1 {
    max-width: 200px;
  }

  h2 {
    max-width: 200px;
  }
}

@media (min-width: 1025px) {
  h1 {
    max-width: 300px;
  }

  h2 {
    max-width: 300px;
  }
}

/* Add some padding and margins to prevent stretching to full width */
div[style] {
  max-width: 95vw;
  margin-left: auto;
  margin-right: auto;
  padding-left: 10px;
  padding-right: 10px;
}

header {
  max-width: 95vw;
}
</style>
