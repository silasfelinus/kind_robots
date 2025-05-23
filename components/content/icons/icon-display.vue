<!-- /components/content/icons/icon-display.vue -->
<template>
  <div class="relative snap-start h-[6rem] w-[4rem] flex flex-col items-center justify-center">
    <!-- Icon Section -->
    <div class="w-[3rem] h-[3rem] flex items-center justify-center overflow-hidden">
      <div v-if="isEditing" class="w-full h-full flex items-center justify-center">
        <Icon :name="icon.icon || 'kind-icon:help'" class="text-3xl" />
      </div>

      <NuxtLink
        v-else-if="icon.link && icon.type !== 'utility'"
        :to="icon.link"
        class="transition-transform hover:scale-110 w-full h-full flex items-center justify-center"
      >
        <Icon
          :name="icon.icon || 'kind-icon:help'"
          class="text-3xl"
          :class="{ glow: isActiveRoute }"
        />
      </NuxtLink>

      <component
        v-else-if="icon.type === 'utility' && icon.component"
        :is="icon.component"
        class="w-full h-full flex items-center justify-center"
      />

      <Icon
        v-else
        :name="icon.icon || 'kind-icon:help'"
        class="text-3xl"
      />
    </div>

    <!-- Label / Delete -->
    <div class="h-[1.25rem] w-full flex items-center justify-center mt-1">
      <template v-if="isEditing">
        <button
          class="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 hover:bg-red-600 pointer-events-auto"
          @click="iconStore.removeIconFromSmartBar(icon.id)"
        >
          ✕
        </button>
      </template>

      <template v-else-if="!bigMode">
        <span class="text-xs text-center leading-none">
          {{ computedLabel }}
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useIconStore } from '@/stores/iconStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import type { SmartIcon } from '@/stores/iconStore'

const props = defineProps<{ icon: SmartIcon }>()

const iconStore = useIconStore()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const route = useRoute()

const isEditing = computed(() => iconStore.isEditing)
const bigMode = computed(() => displayStore.bigMode)

const isActiveRoute = computed(() =>
  props.icon.link && route.path.startsWith(props.icon.link)
)

const computedLabel = computed(() => {
  if (props.icon.type !== 'utility') return props.icon.label
  switch (props.icon.component) {
    case 'theme-icon':
      return themeStore.currentTheme
    case 'login-icon':
      return userStore.isLoggedIn
        ? userStore.user?.username || 'User'
        : 'Login?'
    case 'jellybean-icon':
      return `${milestoneStore.milestoneCountForUser || 0} /11`
    case 'swarm-icon':
      return iconStore.showSwarm ? iconStore.swarmMessage : 'Swarm'
    default:
      return '…'
  }
})
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
  transition: box-shadow 0.3s ease-in-out;
}
</style>
