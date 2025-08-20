<!-- /components/content/sandbox/sandbox-menu.vue -->
<template>
  <div class="flex gap-4 p-2 items-center justify-center">
    <!-- Theme Selector -->
    <select v-model="store.theme" class="select select-sm select-bordered">
      <option value="default">Default</option>
      <option value="cosmic">Cosmic</option>
      <option value="garden">Garden</option>
      <option value="arcade">Arcade</option>
    </select>

    <!-- Actions -->
    <sandbox-icon icon="kind-icon:save" label="Save" @click="store.saveScene" />
    <sandbox-icon icon="kind-icon:load" label="Load" @click="store.loadScene" />
    <sandbox-icon
      icon="kind-icon:refresh"
      label="Reset"
      @click="store.resetScene"
    />
    <sandbox-icon
      icon="kind-icon:camera"
      label="Screenshot"
      @click="screenshot"
    />
    <sandbox-icon icon="kind-icon:record" label="Record" @click="record" />
  </div>
</template>

<script setup lang="ts">
import { useSandboxStore } from '~/abandonware/sandboxStore'

const store = useSandboxStore()

function screenshot() {
  console.log('📸 Screenshot requested')
  // Future implementation: capture canvas state
}

function record() {
  console.log('🎥 Record requested')
  // Future implementation: screen capture or GIF
}
</script>
