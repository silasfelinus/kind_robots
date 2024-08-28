<template>
  <div class="relative">
    <header
      ref="headerRef"
      class="bg-base-200 p-2 m-1 border relative flex items-center w-screen justify-between rounded-2xl"
      :class="toggleSidebar ? 'flex-col' : 'flex-row'"
    >
      <div
        v-show="!toggleSidebar"
        class="flex items-center space-x-2 flex-grow"
      >
        <avatar-image alt="User Avatar" />
        <room-title class="text-sm font-semibold bg-base-200 rounded-2xl" />
      </div>
      <div v-show="toggleSidebar" class="flex items-center space-x-2 flex-grow">
        <avatar-image alt="User Avatar" />
        <div class="flex flex-col">
          <room-title class="flex text-sm font-semibold p-1" />
          <h2 class="text-xs text-gray-500 italic">{{ page.subtitle }}</h2>
        </div>
        <div class="flex space-x-1">
          <smart-links />
          <butterfly-toggle />
          <theme-toggle />
          <login-button />
          <nav-toggle class="text-lg" @click="toggleNav" />
          <jellybean-count />
        </div>
      </div>
      <button class="ml-auto p-2" @click="toggleSidebarFunction">
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
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

const { page } = useContent()
const showNav = ref(false)
const toggleSidebar = ref(true)

const toggleSidebarFunction = () => {
  toggleSidebar.value = !toggleSidebar.value
}

function handleResize() {
  if (window.innerWidth < 768) {
    toggleSidebar.value = true
  } else {
    toggleSidebar.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize() // Initial check
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>
