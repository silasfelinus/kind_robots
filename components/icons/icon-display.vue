<!-- /components/content/icons/icon-display.vue -->
<template>
  <div
    class="relative flex shrink-0 snap-start flex-col items-center justify-center px-1"
    style="aspect-ratio: 1 / 1; height: 100%; align-self: stretch"
  >
    <div
      class="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
    >
      <div
        v-if="isEditing"
        class="flex h-full w-full items-center justify-center"
      >
        <div
          class="flex h-full w-full items-center justify-center overflow-hidden"
        >
          <Icon
            :name="icon.icon || 'kind-icon:help'"
            class="force-fill h-full w-full"
          />
        </div>
      </div>

      <NuxtLink
        v-else-if="icon.link && icon.type !== 'utility'"
        :to="icon.link"
        class="flex h-full w-full items-center justify-center transition-transform sm:hover:scale-110"
      >
        <div
          class="flex h-full w-full items-center justify-center overflow-hidden"
        >
          <Icon
            :name="icon.icon || 'kind-icon:help'"
            class="force-fill h-full w-full"
            :class="{ glow: isActiveRoute }"
          />
        </div>
      </NuxtLink>

      <component
        v-else-if="
          icon.type === 'utility' &&
          icon.component &&
          componentMap[icon.component]
        "
        :is="componentMap[icon.component]"
        class="flex h-full w-full items-center justify-center transition-transform sm:hover:scale-110"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center transition-transform sm:hover:scale-110"
      >
        <div
          class="flex h-[90%] w-[90%] items-center justify-center overflow-hidden"
        >
          <Icon
            :name="icon.icon || 'kind-icon:help'"
            class="force-fill h-full w-full"
          />
        </div>
      </div>
    </div>

    <div
      v-if="isEditing"
      class="flex w-full items-center justify-center"
      style="height: 22%"
    >
      <template v-if="confirmingDelete">
        <button
          type="button"
          class="mr-1 rounded-full bg-gray-300 px-1.5 py-0.5 text-[0.6rem] font-bold text-black hover:bg-gray-400"
          @click="confirmingDelete = false"
        >
          No
        </button>
        <button
          type="button"
          class="rounded-full bg-red-600 px-1.5 py-0.5 text-[0.6rem] font-bold text-white hover:bg-red-700"
          @click="removeIcon"
        >
          Remove
        </button>
      </template>
      <button
        v-else
        type="button"
        class="rounded-full bg-red-500 px-1.5 py-0.5 text-[0.6rem] font-bold text-white hover:bg-red-600"
        @click="confirmingDelete = true"
      >
        ✕
      </button>
    </div>

    <div
      v-else-if="!isCompactHeader"
      class="flex w-full items-center justify-center"
      style="height: 22%"
    >
      <span
        class="max-w-full truncate text-center font-bold leading-none"
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
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useButterflyStore } from '@/stores/butterflyStore'
import type { SmartIcon } from '@/stores/smartbarStore'

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

const props = defineProps<{ icon: SmartIcon; showTitle?: boolean }>()

const smartbarStore = useSmartbarStore()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()
const butterflyStore = useButterflyStore()
const route = useRoute()

const { butterflies } = storeToRefs(butterflyStore)

const isEditing = computed(() => smartbarStore.isEditing)
const isCompactHeader = computed(() => displayStore.headerState === 'compact')

const confirmingDelete = ref(false)

const activeButterflyCount = computed(
  () => butterflies.value.filter((butterfly) => !butterfly.isExiting).length,
)

function removeIcon() {
  smartbarStore.removeFromEditableIcons(props.icon.id)
  confirmingDelete.value = false
}

const isActiveRoute = computed(
  () => !!(props.icon.link && route.path.startsWith(props.icon.link)),
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
      return activeButterflyCount.value > 0
        ? `${activeButterflyCount.value} Butterflies`
        : 'Swarm'
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

.force-fill :deep(svg),
.force-fill :deep(img),
.force-fill :deep(.iconify),
.force-fill :deep(i) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
