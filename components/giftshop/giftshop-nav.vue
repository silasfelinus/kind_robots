<!-- /components/content/story/giftshop-nav.vue -->
<template>
  <div class="w-full flex flex-col items-center">
    <div
      class="flex justify-center flex-wrap gap-2 md:gap-3 lg:gap-4 w-full mb-3"
    >
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.link"
        class="min-w-[45%] md:min-w-[33%] lg:min-w-[20%] px-4 py-2 text-sm md:text-md lg:text-lg font-semibold border border-accent rounded-lg whitespace-normal text-center"
        :class="[
          tab.link === route.path
            ? 'bg-primary text-black'
            : 'bg-secondary hover:bg-accent text-black',
        ]"
        @click.native="selectTab(tab.name)"
      >
        {{ tab.label }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/giftshop-nav.vue
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplayStore } from '~/stores/displayStore'

const route = useRoute()
const displayStore = useDisplayStore()

const tabs = [
  { name: 'giftshop', label: 'Gift Shop', link: '/giftshop' },
  { name: 'dashboard', label: 'Dashboard', link: '/dashboard' },
  { name: 'forum', label: 'Forum', link: '/forum' },
  { name: 'credits', label: 'Credits', link: '/credits' },
  { name: 'about', label: 'About', link: '/about' },
  { name: 'amibot', label: 'AmiBot', link: '/amibot' },
]

const selected = ref('')

const selectTab = (tabName: string) => {
  selected.value = tabName
  displayStore.setMainComponent(tabName)
}

watch(
  () => route.path,
  () => {
    const match = tabs.find((tab) => tab.link === route.path)
    if (match) selectTab(match.name)
    else selectTab(tabs[0].name)
  },
  { immediate: true },
)
</script>
