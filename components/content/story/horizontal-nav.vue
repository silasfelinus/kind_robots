<!-- /components/content/story/horizontal-nav.vue -->
<template>
  <div
    class="relative flex justify-center bg-base-300 border border-accent rounded-2xl max-w-full overflow-x-auto"
  >
    <div
      class="flex flex-wrap justify-center w-full items-center gap-1 md:gap-2 lg:gap-3 xl:gap-4"
    >
      <div
        v-for="(item, index) in links"
        :key="index"
        class="group flex flex-col items-center justify-center min-w-[80px]"
      >
        <button
          :aria-label="item.title"
          class="group flex flex-col items-center justify-center w-full space-y-1 text-center transition-all transform hover:scale-105 hover:bg-accent hover:text-info focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          @click="navigateTo(item.path)"
        >
          <icon
            :name="item.icon"
            class="w-6 h-6 transition-transform group-hover:scale-110"
          />
          <span
            class="text-xs md:text-sm font-semibold text-center bg-secondary rounded-lg"
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
import { useLinkStore } from '@/stores/linkStore'

const router = useRouter()
const linkStore = useLinkStore()
const { staticLinks: links } = storeToRefs(linkStore)

const navigateTo = (path: string) => {
  router.push(path)
}
</script>
