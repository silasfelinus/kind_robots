<template>
  <div class="relative">
    <header
      class="flex items-center justify-between"
      :class="toggleSidebar ? 'flex-col' : 'flex-row'"
    >
      <div
        class="flex items-center space-x-1 flex-grow rounded-2xl w-full h-auto border p-1 m-1 bg-base-200"
      >
        <avatar-image alt="User Avatar" />
        <div class="flex flex-col">
          <room-title class="text-sm font-semibold bg-base-200 rounded-2xl" />
          <h2 class="text-md text-accent italic text-center">
            {{ page.subtitle }}
          </h2>
        </div>
        <div class="flex flex-grow">
          <!-- Each link and button now has flex-grow to evenly distribute space -->
          <back-link v-show="toggleSidebar" class="flex-grow" />
          <random-link v-show="toggleSidebar" class="flex-grow" />
          <home-link v-show="toggleSidebar" class="flex-grow" />
          <forward-link v-show="toggleSidebar" class="flex-grow" />
          <butterfly-toggle v-show="toggleSidebar" class="flex-grow" />
          <theme-toggle v-show="toggleSidebar" class="flex-grow" />
          <login-button v-show="toggleSidebar" class="flex-grow" />
          <nav-toggle
            v-show="toggleSidebar"
            class="flex-grow"
            @click="toggleNav"
          />
          <button class="ml-auto z-50" @click="toggleSidebarFunction">
            <icon
              :name="toggleSidebar ? 'fxemoji:eye' : 'nimbus:eye-off'"
              class="text-lg text-accent"
            />
          </button>
        </div>
      </div>
    </header>
    <navigation-trimmed
      v-if="showNav"
      class="absolute bottom-0 w-full bg-secondary shadow-lg transition-transform duration-300"
      :class="showNav ? 'translate-y-0' : 'translate-y-full'"
    />
  </div>
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
