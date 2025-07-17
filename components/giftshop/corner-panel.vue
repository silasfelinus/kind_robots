<template>
  <div
    ref="panelRef"
    class="fixed top-2 right-2 z-[9999] p-1 w-[5.5rem] pointer-events-auto"
  >
    <div class="flex flex-col gap-2 items-start">
      <div
        v-for="item in menuItems"
        :key="item.id"
        class="relative flex items-center"
      >
        <div
          class="tooltip tooltip-top z-[9999]"
          :data-tip="item.tooltip"
        >
          <button
            class="btn btn-xs flex items-center gap-1 px-2"
            @click.stop="toggle(item.id)"
          >
            <span v-if="item.id === 'tokens'" class="text-xs font-bold">
              {{ userStore.user?.mana ?? 0 }}
            </span>
            <Icon :name="item.icon" class="inline" />
          </button>
        </div>

        <!-- Dropdown Panel -->
        <div
          v-if="activePanel === item.id"
          class="mt-2 w-64 bg-base-100 shadow-lg rounded-xl p-3 z-[9999] text-sm space-y-2 absolute right-full top-0"
        >
          <!-- your dropdown panel sections (tokens, account, directory...) -->
          <!-- unchanged, so omitting for brevity -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const activePanel = ref<string | null>(null)
const panelRef = ref<HTMLElement | null>(null)

function toggle(panel: string) {
  activePanel.value = activePanel.value === panel ? null : panel
}

function closePanel() {
  activePanel.value = null
}

function handleClickOutside(event: MouseEvent) {
  if (!panelRef.value) return
  if (!panelRef.value.contains(event.target as Node)) {
    closePanel()
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
})

const menuItems = [
  { id: 'tokens', icon: 'kind-icon:mana-potion', tooltip: `${userStore.user?.mana ?? 0} Mana` },
  { id: 'account', icon: 'kind-icon:person', tooltip: userStore.user?.designerName || 'Account' },
  { id: 'directory', icon: 'kind-icon:folder-tree', tooltip: 'Site Map' },
  { id: 'sources', icon: 'kind-icon:butterfly', tooltip: 'Modeller Sources' },
  { id: 'about', icon: 'kind-icon:info-circle', tooltip: 'About / Sponsors' },
]
</script>

<style scoped>
.tooltip {
  font-family: 'Chicago', sans-serif;
  font-size: 0.75rem;
}
</style>
