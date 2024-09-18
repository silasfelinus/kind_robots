<template>
  <div class="flex">
    <aside
      v-if="(displayStore.sidebarLeft as DisplayState) !== 'hidden'"
      class="transition-all duration-300 bg-base-200 hide-scrollbar flex-grow p-2"
      :class="{
        'w-64': displayStore.sidebarLeft === 'open',
        'w-16': displayStore.sidebarLeft === 'compact',
        'w-0': displayStore.sidebarLeft === 'hidden',
      }"
      :style="{
        maxHeight: 'calc(100vh - ' + displayStore.headerVh + 'vh)',
        position: 'sticky',
        top: displayStore.headerVh + 'vh',
      }"
    >
      <div>
        <div class="p-1">
          <!-- Home -->
          <NuxtLink
            to="/"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="line-md:home-md-twotone"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Home</span
            >
          </NuxtLink>

          <!-- Add Bot -->
          <NuxtLink
            to="/addbot"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="fluent:bot-add-20-regular"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Add Bot</span
            >
          </NuxtLink>

          <!-- Bot Cafe -->
          <NuxtLink
            to="/botcafe"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="mdi:chat-processing"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Bot Cafe</span
            >
          </NuxtLink>

          <!-- Pitch Manager -->
          <NuxtLink
            to="/pitch"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="fluent:chat-bubbles-question-16-regular"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Pitch Manager</span
            >
          </NuxtLink>

          <!-- Art Maker -->
          <NuxtLink
            to="/artmaker"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="game-icons:easel"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Art Maker</span
            >
          </NuxtLink>

          <!-- Hot or Not? -->
          <NuxtLink
            to="/hotornot"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="emojione-monotone:fire"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Hot or Not?</span
            >
          </NuxtLink>

          <!-- Art Gallery -->
          <NuxtLink
            to="/artgallery"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="mdi:palette"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Art Gallery</span
            >
          </NuxtLink>

          <!-- Art Challenge -->
          <NuxtLink
            to="/artchallenge"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="game-icons:tabletop-players"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Art Challenge</span
            >
          </NuxtLink>

          <!-- Brainstorm -->
          <NuxtLink
            to="/brainstorm"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="game-icons:robot-antennas"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Brainstorm</span
            >
          </NuxtLink>

          <!-- Memory Match -->
          <NuxtLink
            to="/memory"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="material-symbols:art-track-outline-rounded"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Memory Match</span
            >
          </NuxtLink>

          <!-- Dashboard -->
          <NuxtLink
            to="/dashboard"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="mingcute:settings-6-fill"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Dashboard</span
            >
          </NuxtLink>

          <!-- Mature Content -->
          <NuxtLink
            v-if="showMature"
            to="/mature"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="fxemoji:lips"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Mature Content</span
            >
          </NuxtLink>

          <!-- Wonderlab -->
          <NuxtLink
            v-if="showMature"
            to="/wonderlab"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="game-icons:gear-hammer"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >Wonderlab</span
            >
          </NuxtLink>

          <!-- About -->
          <NuxtLink
            to="/about"
            :style="{ height: iconHeight + 'px', margin: '1px 0' }"
            class="Icon-link-container flex items-center space-x-2 hover:bg-base-100 hover:scale-105 rounded-xl mt-1 mb-1 p-1"
          >
            <Icon
              name="game-icons:abstract-037"
              class="h-12 w-12 transition-all duration-300 ease-in-out"
            />
            <span
              v-if="isSidebarOpen"
              class="text-sm font-semibold ml-2 transition-opacity duration-300"
              >About</span
            >
          </NuxtLink>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useDisplayStore } from '@/stores/displayStore'
import type { DisplayState } from '@/stores/displayStore'

// Access the display store for the sidebar state
const displayStore = useDisplayStore()
const userStore = useUserStore()
const showMature = computed(() => userStore.showMature)

// Computed properties to check the sidebar state
const isSidebarOpen = computed(() => displayStore.sidebarLeft === 'open')

// Adjust height calculations based on window size and available space
const availableSidebarHeight = ref(100 - 10) // Assume header height = 10vh for now
const iconHeight = ref(0)

onMounted(() => {
  const calculateIconHeight = () => {
    const totalLinks = 13 // The total number of links in the sidebar
    const marginSpace = 2 * totalLinks // Adjust for link margins
    const sidebarHeightInPx =
      (availableSidebarHeight.value * window.innerHeight) / 100
    iconHeight.value = (sidebarHeightInPx - marginSpace) / totalLinks
  }

  calculateIconHeight()

  window.addEventListener('resize', calculateIconHeight)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', calculateIconHeight)
  })
})
</script>
