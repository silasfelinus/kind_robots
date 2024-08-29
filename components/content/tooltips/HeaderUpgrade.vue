<template>
  <div class="relative w-full" style="height: 12vh; max-height: 12vh">
    <header
      class="flex items-center justify-between rounded-2xl border p-1 m-1 bg-base-200 w-full h-full"
    >
      <div class="flex items-center space-x-1">
        <avatar-image alt="User Avatar" class="h-full aspect-square m-1" />
        <!-- Dynamic flex container for title and subtitle -->
        <div
          class="flex flex-col sm:flex-row justify-between m-1 w-full max-w-xs sm:max-w-md md:max-w-lg"
        >
          <room-title
            class="text-xs sm:text-sm md:text-base lg:text-lg font-semibold rounded-2xl"
          />
          <h2
            class="text-xs sm:text-md md:text-lg lg:text-xl text-accent italic text-center"
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
