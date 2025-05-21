<template>
  <div
    class="group relative flex items-center justify-center snap-start h-[6rem] w-[4rem] select-none"
    :draggable="isEditing"
    @dragstart="handleDragStart"
    @drop="handleDrop"
  >
    <div class="relative w-full h-full flex items-center justify-center">
      <div
        class="w-[3rem] h-[3rem] flex items-center justify-center overflow-hidden"
      >
        <NuxtLink
          v-if="icon?.link && icon?.type !== 'utility' && !isEditing"
          :to="icon.link"
          class="transition-transform hover:scale-110"
        >
          <Icon
            :name="icon.icon || 'kind-icon:help'"
            class="text-3xl max-w-[3rem] max-h-[3rem]"
            :class="{ glow: icon.link && route.path.startsWith(icon.link) }"
          />
        </NuxtLink>

        <component
          v-else-if="icon?.type === 'utility'"
          :is="icon.component"
          class="text-3xl"
        />

        <Icon
          v-else-if="icon"
          :name="icon.icon || 'kind-icon:help'"
          class="text-3xl max-w-[3rem] max-h-[3rem]"
        />

        <NuxtLink
          v-else-if="isAddIcon"
          to="/icons"
          class="transition-transform hover:scale-110"
          @click="iconStore.isEditing && iconStore.confirmEdit()"
        >
          <Icon name="kind-icon:plus" class="text-3xl" />
        </NuxtLink>

        <Icon v-else name="kind-icon:help" class="text-3xl" />
      </div>

      <div
        class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.25rem] w-full flex items-center justify-center pointer-events-none z-40"
      >
        <span
          v-if="!isEditing && !displayStore.bigMode && icon"
          class="text-xs text-center leading-none"
        >
          {{ iconLabel }}
        </span>
        <button
          v-else-if="isEditing && icon"
          class="text-xs bg-red-500 text-white rounded-full z-50 px-2 py-0.5 hover:bg-red-600 pointer-events-auto"
          @click="iconStore.removeIconFromSmartBar(icon.id)"
        >
          ✕
        </button>
      </div>
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

// Props and destructuring
const props = defineProps<{
  icon?: SmartIcon
  index?: number
  isAddIcon?: boolean
}>()
const { icon, index, isAddIcon } = props

// Stores
const iconStore = useIconStore()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()

// Route
const route = useRoute()

// Computed
const isEditing = computed(() => iconStore.isEditing)

const iconLabel = computed(() => {
  if (!icon || icon.type !== 'utility') return icon?.label || '…'
  switch (icon.component) {
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

// Drag logic (safe with undefined index)
function handleDragStart() {
  if (typeof index === 'number') iconStore.startDrag(index)
}

function handleDrop() {
  if (typeof index === 'number') iconStore.dropIcon(index)
}
</script>
