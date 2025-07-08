<!-- /components/content/sandbox/sandbox-persists.vue -->
<template>
  <div class="flex flex-col items-center gap-2 p-2">
    <sandbox-icon
      v-for="(item, i) in store.persistables"
      :key="i"
      :icon="item.icon"
      :label="item.label"
      @click="select(item)"
    />
  </div>
</template>

<script setup lang="ts">
import { useSandboxStore } from '@/stores/sandboxStore'
import SandboxIcon from './sandbox-icon.vue'

const store = useSandboxStore()

function select(item: any) {
  console.log('Selected persistable:', item)
}
</script>
