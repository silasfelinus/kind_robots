<template>
  <div class="relative w-full" style="height: 12vh; max-height: 12vh">
    <header
      class="flex items-center justify-between rounded-2xl border p-1 m-1 bg-base-200 w-full h-full"
    >
      <div class="flex items-center space-x-1">
        <avatar-image alt="User Avatar" class="h-full aspect-square m-1" />
        <div class="flex flex-col justify-between m-1">
          <room-title class="text-sm font-semibold rounded-2xl" />
          <h2 class="text-md text-accent italic text-center">
            {{ page.subtitle || 'Welcome to Kind Robots' }}
          </h2>
        </div>
      </div>
      <div class="flex items-center flex-grow justify-end space-x-1">
        <login-button class="flex-1" style="max-width: 22vw" />
        <theme-toggle class="flex-1" style="max-width: 15vw" />
        <butterfly-toggle class="w-1/6" style="max-width: 5vw" />
        <nav-toggle
          class="w-1/6 m-1"
          style="max-width: 5vw"
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
import { ref } from 'vue'

const { page } = useContent()
const showNav = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>
