<!-- /components/content/layout/theme-icon.vue -->
<template>
  <icon-shell>
    <template #icon>
      <button
        @click="goToThemePage"
        class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
      >
        <Icon
          name="kind-icon:paintbrush"
          class="w-full h-full max-w-[3rem] max-h-[3rem]"
        />
      </button>
    </template>

    <template #label>
      <span
        v-if="!isEditing && !displayStore.bigMode"
        class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[1.25rem] w-full flex items-center justify-center pointer-events-none z-40 text-xs text-center leading-none"
      >
        {{ currentTheme }}
      </span>
    </template>
  </icon-shell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useIconStore } from '@/stores/iconStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const themeStore = useThemeStore()
const displayStore = useDisplayStore()
const iconStore = useIconStore()

const { bigMode } = storeToRefs(displayStore)
const { isEditing } = storeToRefs(iconStore)
const currentTheme = computed(() => themeStore.currentTheme)

function goToThemePage() {
  if (!isEditing.value) router.push('/theme')
}
</script>
