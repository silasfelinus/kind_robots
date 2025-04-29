<!-- /components/content/story/smart-icons.vue -->
<template>
  <div class="flex w-full items-center justify-end flex-nowrap gap-1 lg:gap-2">
    <!-- SmartBar Nav Links -->
    <div
      v-for="link in filteredNavLinks"
      :key="link.icon"
      class="group flex-1 min-w-0 flex flex-col items-center justify-center transition-all"
    >
      <NuxtLink
        v-if="link.path"
        :to="link.path"
        class="flex flex-col items-center justify-center w-full"
      >
        <Icon
          :name="link.icon"
          class="text-sm md:text-md lg:text-4xl xl:text-5xl transition-transform hover:scale-110 duration-300 ease-in-out"
        />
        <div
          v-if="!compact"
          class="mt-1 text-center text-xs lg:text-sm hidden md:block w-full"
        >
          {{ link.title }}
        </div>
      </NuxtLink>

      <!-- Utility Links (without paths) -->
      <component
        v-else
        :is="link.icon"
        :compact="compact"
        class="flex flex-col items-center justify-center w-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/smart-icons.vue
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLinkStore } from '@/stores/linkStore'
import { useUserStore } from '@/stores/userStore'

defineProps<{ compact?: boolean }>()

const linkStore = useLinkStore()
const userStore = useUserStore()

const { allLinks } = storeToRefs(linkStore)
const { user } = storeToRefs(userStore)

// Parse smartBar
const smartBarItems = computed(
  () =>
    user.value?.smartBar?.split(',').map((item) => item.trim().toLowerCase()) ??
    [],
)

// Filter allLinks by smartBar selections
const filteredNavLinks = computed(() =>
  allLinks.value.filter((link) =>
    smartBarItems.value.includes(link.icon.toLowerCase()),
  ),
)
</script>
