<template>
  <header
    class="bg-base-200 flex items-center justify-between rounded-2xl"
    :class="toggleSidebar ? 'flex-col' : 'flex-row'"
  >
    <div v-show="!toggleSidebar" class="flex items-center space-x-2 flex-grow">
      <avatar-image alt="User Avatar" />
      <room-title class="text-sm font-semibold bg-base-200 rounded-2xl" />
    </div>
    <div v-show="toggleSidebar" class="flex items-center space-x-2 flex-grow">
      <avatar-image alt="User Avatar" />
      <div class="flex flex-col">
        <room-title class="flex text-sm font-semibold p-1" />
        <h2 class="text-md text-accent italic text-center">
          {{ page.subtitle }}
        </h2>
      </div>
      <div class="flex space-x-1">
        <back-link />
        <random-link />
        <home-link />
        <forward-link />
        <butterfly-toggle />
        <theme-toggle />
        <login-button />
        <nav-toggle @click="toggleNav" />
      </div>
    </div>
    <button class="ml-auto z-50" @click="toggleSidebarFunction">
      <icon
        :name="toggleSidebar ? 'fxemoji:eye' : 'nimbus:eye-off'"
        class="text-lg text-accent"
      />
    </button>
  </header>
  <navigation-trimmed
    v-if="showNav"
    class="absolute bottom-0 w-full bg-secondary shadow-lg transition-transform duration-300"
    :class="showNav ? 'translate-y-0' : 'translate-y-full'"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const { page } = useContent()
const showNav = ref(false)
const toggleSidebar = ref(true)

const toggleSidebarFunction = () => {
  toggleSidebar.value = !toggleSidebar.value
}

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>
