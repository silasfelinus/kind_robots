<template>
  <div class="relative w-full" style="max-height: 12vh">
    <header
      class="flex items-center justify-between rounded-2xl border p-1 m-1 bg-base-200 w-full h-full"
    >
      <div class="flex items-center space-x-1">
        <avatar-image
          alt="User Avatar"
          class="flex max-h-full flex-grow min-h-8 aspect-square m-1"
        />
        <!-- Adjusting layout and wrapping -->
        <div class="flex flex-col sm:flex-row justify-between m-1 flex-grow">
          <room-title
            class="text-xs sm:text-sm md:text-base lg:text-lg font-semibold rounded-2xl truncate max-w-full sm:max-w-xs md:max-w-sm lg:max-w-md"
          />
          <h2
            class="text-xs sm:text-md md:text-lg lg:text-xl text-accent italic text-center truncate"
          >
            {{ page.subtitle || 'Welcome to Kind Robots' }}
          </h2>
        </div>
      </div>
      <div class="flex items-center flex-grow justify-end space-x-1">
        <login-button
          class="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
        />
        <theme-toggle class="flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md" />
        <butterfly-toggle class="w-1/6 min-w-0 max-w-xs" />
        <nav-toggle class="w-1/6 m-1 min-w-0 max-w-xs" @click="toggleNav" />
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
import { ref } from 'vue'

const { page } = useContent()
const showNav = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>
<style>
.room-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* Ensures the text doesn't wrap and stays in a single line */
}

@media (max-width: 640px) {
  .room-title {
    max-width: 100px; /* Limit the maximum width on smaller screens */
  }
}

@media (min-width: 641px) and (max-width: 768px) {
  .room-title {
    max-width: 150px; /* Slightly larger max width for slightly larger screens */
  }
}

/* Adjustments for larger devices remain as they were */
</style>
