<template>
  <div
    class="relative flex justify-center bg-base-300 border border-accent rounded-2xl max-w-full overflow-x-auto"
  >
    <div
      class="flex flex-wrap justify-center w-full items-center gap-2 md:gap-4 p-2"
    >
      <div
        v-for="(item, index) in hardcodedLinks"
        :key="index"
        class="group flex flex-col items-center justify-center min-w-[80px]"
      >
        <button
          :aria-label="item.title"
          class="group flex flex-col items-center justify-center w-full space-y-1 text-center transition-all transform p-2 hover:scale-105 hover:bg-accent hover:text-info focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          @click="navigateTo(item.path)"
        >
          <icon
            :name="item.icon"
            class="w-6 h-6 transition-transform group-hover:scale-110"
          />
          <span
            class="text-xs md:text-sm font-semibold mt-1 text-center bg-secondary px-2 rounded-lg"
          >
            {{ item.title }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

// Hardcoded sidebar links
const hardcodedLinks = ref([
  { title: 'Home', path: '/', icon: 'kind-icon:home' },
  { title: 'Bots', path: '/botcafe', icon: 'kind-icon:addbot' },
  { title: 'Brainstorm', path: '/brainstorm', icon: 'kind-icon:brain' },
  { title: 'Art Lab', path: '/artmaker', icon: 'kind-icon:easel' },
  { title: 'Memory', path: '/memory', icon: 'kind-icon:question' },
  { title: 'WonderLab', path: '/wonderlab', icon: 'kind-icon:gearhammer' },
  { title: 'WeirdLand', path: '/weirdlandia', icon: 'kind-icon:alien' },
  { title: 'Story Maker', path: '/story', icon: 'kind-icon:book' },
])

// Access Vue Router for navigation
const router = useRouter()

// Navigation function
const navigateTo = (path: string) => {
  router.push(path) // Navigate using Vue Router
}
</script>
