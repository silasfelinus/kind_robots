<template>
  <div class="relative">
    <header class="flex items-center justify-between flex-row">
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
          <butterfly-toggle class="flex-grow" />
          <theme-toggle class="flex-grow" />
          <login-button class="flex-grow" />
          <nav-toggle class="flex-grow" @click="toggleNav" />
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

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>
