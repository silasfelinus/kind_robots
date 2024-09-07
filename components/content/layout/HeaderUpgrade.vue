<template>
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
        <div
          class="flex flex-col md:flex-row justify-between m-1 flex-shrink min-w-0"
        >
          <room-title
            class="text-xs sm:text-sm md:text-base lg:text-lg font-semibold max-w-full sm:max-w-xs md:max-w-sm lg:max-w-md"
          />
          <h2
            class="text-xs sm:text-sm md:text-base lg:text-lg text-accent italic text-center truncate"
          >
            {{ subtitle }}
          </h2>
        </div>
      </div>

      <!-- Buttons Section -->
      <div
        class="flex items-center justify-end space-x-1 flex-shrink-0 min-w-0"
      >
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

<script lang="ts" setup>
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

/* Title and subtitle stack vertically on smaller screens */
@media (max-width: 640px) {
  header .flex-col {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
}

/* Room title width for various screen sizes */
.room-title {
  max-width: 100px;
}

@media (min-width: 641px) and (max-width: 768px) {
  .room-title {
    max-width: 120px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .room-title {
    max-width: 150px;
  }
}

@media (min-width: 1025px) {
  .room-title {
    max-width: 200px;
  }
}

/* Adjust subtitle for better text handling */
h2 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Make button sections responsive with smaller max widths */
.login-button,
.theme-toggle,
.butterfly-toggle {
  max-width: 100px;
}

@media (min-width: 768px) {
  .login-button,
  .theme-toggle {
    max-width: 120px;
  }

  .butterfly-toggle {
    max-width: 80px;
  }
}
</style>