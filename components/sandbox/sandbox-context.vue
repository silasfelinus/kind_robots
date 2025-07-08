<!-- /components/content/sandbox/sandbox-context.vue -->
<template>
  <div class="bg-base-100 rounded-xl p-2 shadow-md">
    <div class="text-sm font-semibold text-center mb-2">Context Tools</div>
    <div class="flex flex-col gap-2 items-center">
      <sandbox-icon
        v-for="(tool, i) in store.contextTools"
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
import SandboxIcon from './sandbox-icon.vue'

const store = useSandboxStore()

function activate(tool: any) {
  console.log('Activated context tool:', tool)
}
</script>
