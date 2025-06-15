<!-- /components/content/icons/icon-display.vue -->
<template>
  <div
    class="relative snap-start shrink-0 w-16 h-20 md:w-24 md:h-28 flex flex-col items-center justify-center"
  >
    <!-- Icon Section -->
    <div
      class="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center overflow-hidden"
    >
      <!-- Edit mode preview -->
      <div
        v-if="isEditing"
        class="w-full h-full flex items-center justify-center"
      >
        <Icon
          :name="icon.icon || 'kind-icon:help'"
          class="text-3xl w-full h-full"
        />
      </div>

      <!-- Nav link icon -->
      <NuxtLink
        v-else-if="icon.link && icon.type !== 'utility'"
        :to="icon.link"
        class="w-full h-full flex items-center justify-center transition-transform hover:sm:scale-110"
      >
        <Icon
          :name="icon.icon || 'kind-icon:help'"
          class="w-full h-full text-3xl"
          :class="{ glow: isActiveRoute }"
        />
      </NuxtLink>

      <!-- Utility component -->
      <component
        v-else-if="icon.type === 'utility' && icon.component && componentMap[icon.component]"
        :is="componentMap[icon.component]"
        class="w-full h-full flex items-center justify-center"
      />

      <!-- Fallback icon -->
      <div v-else class="w-full h-full flex items-center justify-center">
        <Icon
          :name="icon.icon || 'kind-icon:help'"
          class="text-3xl w-full h-full"
        />
      </div>
    </div>

    <!-- Delete Button with Confirmation -->
    <div
      v-if="isEditing"
      class="h-5 mt-2 w-full flex items-center justify-center"
    >
      <template v-if="confirmingDelete">
        <button
          class="text-xs bg-gray-300 text-black rounded-full px-1 md:px-2 py-0.5 hover:bg-gray-400 mr-1"
          @click="confirmingDelete = false"
        >
          Cancel
        </button>
        <button
          class="text-xs bg-red-600 text-white rounded-full px-1 md:px-2 py-0.5 hover:bg-red-700"
          @click="removeIcon"
        >
          Confirm
        </button>
      </template>

      <button
        v-else
        class="text-xs bg-red-500 text-white rounded-full px-1 md:px-2 py-0.5 hover:bg-red-600"
        @click="confirmingDelete = true"
      >
        ✕
      </button>
    </div>

    <!-- Label -->
    <div
      v-else-if="!bigMode"
      class="h-5 mt-2 w-full flex items-center justify-center pointer-events-none"
    >
      <span
        class="text-xs text-center text-base-content/70 truncate max-w-full"
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

// Utility components
import SwarmIcon from './swarm-icon.vue'
import ThemeIcon from './theme-icon.vue'
import LoginIcon from './login-icon.vue'
import JellybeanIcon from './jellybean-icon.vue'

const componentMap: Record<string, any> = {
  'swarm-icon': SwarmIcon,
  'theme-icon': ThemeIcon,
  'login-icon': LoginIcon,
  'jellybean-icon': JellybeanIcon,
}

const props = defineProps<{ icon: SmartIcon }>()

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
