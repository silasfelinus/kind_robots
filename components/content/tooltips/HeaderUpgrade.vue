<template>
  <div class="relative w-full m-1 p-1" style="max-height: 12vh">
    <header
      class="flex items-center justify-between rounded-2xl border p-1 m-1 bg-base-200 w-full h-full"
    >
      <div class="flex items-center space-x-1">
        <avatar-image
          alt="User Avatar"
          class="flex max-h-full flex-grow min-h-8 aspect-square m-1"
        />
        <!-- Adjusting layout and wrapping -->
        <div class="flex flex-col sm:flex-col md:flex-row justify-between m-1 flex-grow min-w-0">
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
      <div class="flex items-center justify-end space-x-1 flex-shrink-0 min-w-0">
        <login-button
          class="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
        />
        <theme-toggle
          class="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md"
        />
        <butterfly-toggle class="w-1/6 min-w-0 max-w-xs" />
        <nav-toggle
          class="w-1/6 m-1 min-w-0 max-w-xs"
          @click="toggleNav"
        />
      </div>
    </header>
    <navigation-trimmed
      v-if="showNav"
      class="absolute bottom-0 left-0 w-full bg-secondary shadow-lg transition-transform duration-300"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
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
.room-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* Ensures the text doesn't wrap */
}

@media (max-width: 640px) {
  .room-title {
    max-width: 100px; /* Limit the maximum width on smaller screens */
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .room-title {
    max-width: 150px; /* Slightly larger max width for medium screens */
  }
}

h2 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

header {
  display: flex;
  flex-wrap: wrap;
}

.flex-grow {
  flex-grow: 1;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  header .flex-col {
    flex-direction: column; /* Stack title and subtitle on smaller screens */
  }
}
</style>