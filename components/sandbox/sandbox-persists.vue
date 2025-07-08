<!-- /components/content/sandbox/sandbox-persists.vue -->
<template>
  <div class="flex flex-col items-center gap-2 p-2">
    <sandbox-icon
      v-for="(item, i) in persistableIcons"
      :key="i"
      :icon="item.icon"
      :label="item.label"
      @click="addToCanvas(item)"
    />
  </div>
</template>

<script setup lang="ts">
import { useSandboxStore } from '@/stores/sandboxStore'
import SandboxIcon from './sandbox-icon.vue'

const store = useSandboxStore()

const persistableIcons = [
  { icon: 'kind-icon:tree', label: 'Tree' },
  { icon: 'kind-icon:house', label: 'House' },
  { icon: 'kind-icon:flame', label: 'Fire' },
  { icon: 'kind-icon:rock', label: 'Rock' },
  { icon: 'kind-icon:pond', label: 'Water' },
  { icon: 'kind-icon:block', label: 'Platform' },
  { icon: 'kind-icon:portal', label: 'Portal' },
  { icon: 'kind-icon:crate', label: 'Crate' }
]

function addToCanvas(item: any) {
  // Placeholder for actual placeable logic
  store.persistables.push({ ...item, id: Date.now() })
}
</script>
