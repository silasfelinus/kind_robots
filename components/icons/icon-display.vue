<!-- /components/content/icons/icon-display.vue -->
<template>
  <div
    class="relative snap-start shrink-0 h-full flex flex-col items-center justify-center px-1"
    style="aspect-ratio: 1 / 1"
  >
    <!-- Icon Section: 90% of height -->
    <div class="w-full flex items-center justify-center" style="height: 78%">
      <!-- Edit mode -->
      <div
        v-if="isEditing"
        class="w-full h-full flex items-center justify-center"
      >
        <Icon :name="icon.icon || 'kind-icon:help'" class="w-100 h-100" />
      </div>

      <!-- Nav link icon -->
      <NuxtLink
        v-else-if="icon.link && icon.type !== 'utility'"
        :to="icon.link"
        class="w-full h-full flex items-center justify-center transition-transform sm:hover:scale-110"
      >
        <Icon
          :name="icon.icon || 'kind-icon:help'"
          class="w-100 h-100"
          :class="{ glow: isActiveRoute }"
        />
      </NuxtLink>

      <!-- Utility component -->
      <component
        v-else-if="
          icon.type === 'utility' &&
          icon.component &&
          componentMap[icon.component]
        "
        :is="componentMap[icon.component]"
        class="w-full h-full flex items-center justify-center transition-transform sm:hover:scale-110"
      />

      <!-- Fallback -->
      <div
        v-else
        class="w-full h-full flex items-center justify-center transition-transform sm:hover:scale-110"
      >
        <Icon :name="icon.icon || 'kind-icon:help'" class="w-[90%] h-[90%]" />
      </div>
    </div>

    <!-- Delete confirmation (edit mode) -->
    <div
      v-if="isEditing"
      class="w-full flex items-center justify-center"
      style="height: 22%"
    >
      <template v-if="confirmingDelete">
        <button
          class="text-[0.6rem] bg-gray-300 text-black rounded-full px-1.5 py-0.5 hover:bg-gray-400 mr-1 font-bold"
          @click="confirmingDelete = false"
        >
          No
        </button>
        <button
          class="text-[0.6rem] bg-red-600 text-white rounded-full px-1.5 py-0.5 hover:bg-red-700 font-bold"
          @click="removeIcon"
        >
          Remove
        </button>
      </template>
      <button
        v-else
        class="text-[0.6rem] bg-red-500 text-white rounded-full px-1.5 py-0.5 hover:bg-red-600 font-bold"
        @click="confirmingDelete = true"
      >
        ✕
      </button>
    </div>

    <!-- Label (normal mode) -->
    <div
      v-else-if="!bigMode"
      class="w-full flex items-center justify-center"
      style="height: 22%"
    >
      <span
        class="text-center font-bold truncate max-w-full leading-none"
        style="font-size: clamp(0.55rem, 1vw, 0.8rem)"
        :title="computedLabel"
      >
        {{ computedLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/icons/icon-display.vue
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import type { SmartIcon } from '@/stores/smartbarStore'

import SwarmIcon from './swarm-icon.vue'
import ThemeIcon from '../wonderlab/theme-icon.vue'
import LoginIcon from './login-icon.vue'
import JellybeanIcon from './jellybean-icon.vue'

const componentMap: Record<string, any> = {
  'swarm-icon': SwarmIcon,
  'theme-icon': ThemeIcon,
  'login-icon': LoginIcon,
  'jellybean-icon': JellybeanIcon,
}

const props = defineProps<{ icon: SmartIcon; showTitle?: boolean }>()

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const route = useRoute()

const isEditing = computed(() => smartbarStore.isEditing)
const bigMode = computed(() => displayStore.bigMode)

const confirmingDelete = ref(false)

function removeIcon() {
  smartbarStore.removeFromEditableIcons(props.icon.id)
  confirmingDelete.value = false
}

const isActiveRoute = computed(
  () => props.icon.link && route.path.startsWith(props.icon.link),
)

const computedLabel = computed(() => {
  if (props.icon.type !== 'utility') return props.icon.label || ''

  switch (props.icon.component) {
    case 'theme-icon':
      return themeStore.currentTheme || ''
    case 'login-icon':
      return userStore.isLoggedIn
        ? userStore.user?.username || 'User'
        : 'Login?'
    case 'jellybean-icon':
      return `${milestoneStore.milestoneCountForUser || 0} /11`
    case 'swarm-icon':
      return smartbarStore.showSwarm ? smartbarStore.swarmMessage : 'Swarm'
    default:
      return ''
  }
})
</script>

<style scoped>
.glow {
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
  transition: box-shadow 0.3s ease-in-out;
}
</style>
