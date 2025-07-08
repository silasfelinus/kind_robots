<!-- /components/content/sandbox/sandbox-environment.vue -->
<template>
  <div class="flex gap-2 p-2">
    <sandbox-icon
      v-for="(env, i) in environmentIcons"
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

const environmentIcons = [
  { icon: 'kind-icon:sun', label: 'Sun' },
  { icon: 'kind-icon:rain', label: 'Rain' },
  { icon: 'kind-icon:storm', label: 'Storm' },
  { icon: 'kind-icon:moon', label: 'Moonlight' },
  { icon: 'kind-icon:fog', label: 'Fog' },
  { icon: 'kind-icon:quake', label: 'Earthquake' },
  { icon: 'kind-icon:wind', label: 'Wind' },
  { icon: 'kind-icon:freeze', label: 'Time Freeze' }
]

function toggle(item: any) {
  store.toggleItem(store.environment, item)
}
</script>
