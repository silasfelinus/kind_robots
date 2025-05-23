<!-- /components/content/icons/icon-display.vue -->
<template>
  <div class="relative snap-start h-[6rem] w-[4rem] flex flex-col items-center justify-center">
    <div class="w-[3rem] h-[3rem] flex items-center justify-center overflow-hidden">
      <component
        v-if="icon.type === 'utility' && icon.component"
        :is="icon.component"
      />
      <NuxtLink
        v-else-if="!isEditing && icon.link"
        :to="icon.link"
        class="transition-transform hover:scale-110"
      >
        <Icon :name="icon.icon || 'kind-icon:help'" class="text-3xl" />
      </NuxtLink>
      <Icon
        v-else
        :name="icon.icon || 'kind-icon:help'"
        class="text-3xl"
      />
    </div>

    <div class="h-[1.25rem] w-full flex items-center justify-center">
      <template v-if="isEditing">
        <button
          class="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 hover:bg-red-600"
          @click="iconStore.removeIconFromSmartBar(icon.id)"
        >
          ✕
        </button>
      </template>
      <template v-else-if="!bigMode">
        <span class="text-xs text-center leading-none">
          {{ label }}
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useIconStore } from '@/stores/iconStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useThemeStore } from '@/stores/themeStore'
import { useUserStore } from '@/stores/userStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const props = defineProps<{ icon: SmartIcon }>()
const iconStore = useIconStore()
const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const userStore = useUserStore()
const milestoneStore = useMilestoneStore()

const isEditing = computed(() => iconStore.isEditing)
const bigMode = computed(() => displayStore.bigMode)

const label = computed(() => {
  if (props.icon.type === 'utility') {
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
    }
  }
  return props.icon.label
})
</script>
