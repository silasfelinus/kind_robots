<!-- /components/content/sandbox/sandbox-context.vue -->
<template>
  <div class="bg-base-100 rounded-xl p-2 shadow-md w-full max-w-[160px]">
    <div class="text-sm font-semibold text-center mb-2">Context Tools</div>
    <div class="flex flex-col gap-2 items-center">
      <sandbox-icon
        v-for="(tool, i) in contextTools"
        :key="i"
        :icon="tool.icon"
        :label="tool.label"
        @click="activate(tool)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSandboxStore } from '@/stores/sandboxStore'

const store = useSandboxStore()

const contextTools = [
  { icon: 'kind-icon:wand', label: 'Animate' },
  { icon: 'kind-icon:bolt', label: 'Zap' },
  { icon: 'kind-icon:gear', label: 'Configure' },
  { icon: 'kind-icon:rotate', label: 'Rotate' },
  { icon: 'kind-icon:resize', label: 'Resize' },
  { icon: 'kind-icon:trash', label: 'Delete' },
]

function activate(tool: any) {
  console.log('🛠️ Activated tool:', tool.label)
  // Future: apply behavior to selected element
}
</script>
