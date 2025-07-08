<!-- /components/content/sandbox/sandbox-menu.vue -->
<template>
  <div class="flex gap-4 p-2 items-center justify-center">
    <select v-model="store.theme" class="select select-sm select-bordered">
      <option value="default">Default</option>
      <option value="cosmic">Cosmic</option>
      <option value="garden">Garden</option>
      <option value="arcade">Arcade</option>
    </select>

    <button class="btn btn-sm" @click="store.saveScene">💾 Save</button>
    <button class="btn btn-sm" @click="store.loadScene">📂 Load</button>
    <button class="btn btn-sm btn-outline" @click="reset">🗑️ Reset</button>
  </div>
</template>

<script setup lang="ts">
import { useSandboxStore } from '@/stores/sandboxStore'
const store = useSandboxStore()

function reset() {
  store.environment = []
  store.contextTools = []
  store.persistables = []
}
</script>