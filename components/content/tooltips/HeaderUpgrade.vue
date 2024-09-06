<template>
  <div class="relative w-full m-1 p-1" style="max-height: 12vh">
    <header
      class="flex items-center justify-between rounded-2xl border p-1 m-1 bg-base-200 w-full h-full"
    >
      <!-- Avatar and Title Section -->
      <div class="flex items-center space-x-1 flex-grow">
        <avatar-image
          alt="User Avatar"
          class="flex max-h-full flex-grow min-h-8 aspect-square m-1"
        />
        <!-- Title and Subtitle Column -->
        <div class="flex flex-col md:flex-row justify-between m-1 flex-grow min-w-0">
          <room-title
            class="text-xs sm:text-sm md:text-base lg:text-lg font-semibold truncate max-w-full sm:max-w-xs md:max-w-sm lg:max-w-md"
          />
          <h2
            class="text-xs sm:text-sm md:text-base lg:text-lg text-accent italic text-center truncate"
          >
            {{ subtitle }}
          </h2>
        </div>
      </div>

      <!-- Buttons Section -->
      <div class="flex items-center justify-end space-x-1 flex-shrink-0 min-w-0">
        <login-button
          class="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
        />
        <theme-toggle
          class="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md"
        />
        <butterfly-toggle class="w-1/6 min-w-0 max-w-xs" />
      </div>
    </header>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

const { page } = useContent()
const showNav = ref(false)
const subtitle = computed(() => page.subtitle || 'Welcome to Kind Robots')
const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
/* Ensure the header content is in a single row */
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  padding: 1rem;
  gap: 1rem;
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

/* Room Title */
.room-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h2 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Adjust maximum width for smaller screens */
@media (max-width: 640px) {
  .room-title {
    max-width: 100px;
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .room-title {
    max-width: 150px;
  }
}

.flex-grow {
  flex-grow: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}
</style>
<style scoped>
/* Header - Ensure it remains a single row */
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  padding: 1rem;
  gap: 1rem;
}

/* Title and subtitle stack vertically on screens below 768px */
@media (max-width: 768px) {
  header .flex-col {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
}

/* Room Title */
.room-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h2 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Adjust maximum width for smaller screens */
@media (max-width: 768px) {
  .room-title {
    max-width: 150px;
  }
}

.flex-grow {
  flex-grow: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}
</style>
