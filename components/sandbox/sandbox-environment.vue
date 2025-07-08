<!-- /components/content/sandbox/sandbox-environment.vue -->
<template>
  <div class="flex gap-2 p-2">
    <sandbox-icon
      v-for="(env, i) in environmentList"
      :key="i"
      :icon="env.icon"
      :label="env.label"
      @click="toggle(env)"
    />
  </div>
</template>

<script setup lang="ts">
import { useSandboxStore } from '@/stores/sandboxStore'
import SandboxIcon from './sandbox-icon.vue'

const store = useSandboxStore()

const environmentList = [
  { icon: 'kind-icon:sun', label: 'Sun' },
  { icon: 'kind-icon:rain', label: 'Rain' },
  { icon: 'kind-icon:storm', label: 'Storm' },
  { icon: 'kind-icon:moon', label: 'Moonlight' }
]

function toggle(item: any) {
  const idx = store.environment.findIndex(e => e.label === item.label)
  if (idx >= 0) store.environment.splice(idx, 1)
  else store.environment.push(item)
}
</script>