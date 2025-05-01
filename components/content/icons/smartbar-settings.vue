<!-- /components/content/story/smartbar-settings.vue -->
<template>
  <div class="flex flex-wrap gap-4 justify-center">
    <div
      v-for="item in allSmartBarItems"
      :key="item.icon"
      class="flex flex-col items-center cursor-pointer group"
      @click="toggleItem(item.icon)"
    >
      <!-- Highlight if selected -->
      <div
        class="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 transition-all"
        :class="
          isSelected(item.icon)
            ? 'border-primary bg-primary/10'
            : 'border-base-300 bg-base-200 hover:border-primary hover:bg-primary/10'
        "
      >
        <Icon
          :name="item.icon"
          class="text-3xl md:text-4xl group-hover:scale-110 transition-transform"
        />
      </div>
      <div class="mt-2 text-xs md:text-sm text-center w-20 truncate">
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/smartbar-settings.vue
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLinkStore } from '@/stores/linkStore'
import { useUserStore } from '@/stores/userStore'

const linkStore = useLinkStore()
const userStore = useUserStore()

const { staticLinks, utilityLinks } = storeToRefs(linkStore)
const { user } = storeToRefs(userStore)

// Merge nav links + utilities into one selectable gallery
const allSmartBarItems = computed(() => [
  ...staticLinks.value,
  ...utilityLinks.value,
])

// Current smartBar icons array
const smartBarArray = computed(
  () =>
    user.value?.smartBar?.split(',').map((s) => s.trim().toLowerCase()) ?? [],
)

// Check if a given icon is active in smartBar
const isSelected = (icon: string) =>
  smartBarArray.value.includes(icon.toLowerCase())

// Toggle (add or remove) an icon from smartBar
function toggleItem(icon: string) {
  if (!user.value) return

  const current = smartBarArray.value
  const updated = current.includes(icon.toLowerCase())
    ? current.filter((item) => item !== icon.toLowerCase())
    : [...current, icon.toLowerCase()]

  user.value.smartBar = updated.join(',')
}
</script>
