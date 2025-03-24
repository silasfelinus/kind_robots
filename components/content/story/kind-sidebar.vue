<template>
  <div
    class="transition-all duration-300 bg-base-300 border-1 border-accent rounded-2xl left-0 h-full overflow-y-auto no-scrollbar flex flex-col justify-between flex-grow box-border"
  >
    <div class="flex flex-col justify-between flex-grow">
      <div
        v-for="link in links"
        :key="link.path"
        class="Icon-link-container flex items-center hover:bg-primary hover:scale-110 box-border rounded-xl"
      >
        <a
          v-if="displayStore.sidebarLeftState !== 'hidden'"
          class="flex flex-col items-center cursor-pointer w-full"
          @click.prevent="navigate(link.path)"
          :title="link.tooltip"
        >
          <Icon
            v-if="
              displayStore.sidebarLeftState === 'open' ||
              displayStore.sidebarLeftState === 'compact'
            "
            :name="link.icon"
            class="h-10 w-10 md:h-12 md:w-12 lg:h-13 lg:w-13 xl:w-19 xl:h-19 transition-all duration-300 ease-in-out"
          />

          <span
            class="text-xs md:text-md lg:text-lg font-semibold text-center px-2 rounded-lg"
          >
            {{ link.title }}
          </span>

          <span
            v-if="displayStore.sidebarLeftState === 'open'"
            class="text-xs md:text-md lg:text-lg font-semibold ml-2 transition-opacity duration-300"
          >
            {{ link.title }}
          </span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useLinkStore } from '@/stores/linkStore'

const router = useRouter()
const displayStore = useDisplayStore()
const linkStore = useLinkStore()
const { staticLinks: links } = storeToRefs(linkStore)

const navigate = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.no-scrollbar {
  overflow-y: auto;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.drag-card {
  cursor: grab;
}
</style>
