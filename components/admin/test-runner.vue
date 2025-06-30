<!-- /components/content/test-runner.vue -->
<template>
  <div class="p-4 space-y-4">
    <h2 class="text-xl font-semibold">Test Runner</h2>

    <p class="text-sm text-base-content/70">
      1. Dynamic mount: <code class="font-mono">admin-test-display</code>
    </p>
    <component
      :is="'auto-test-display'"
      class="border border-primary p-4 rounded"
    />

    <p class="text-sm text-base-content/70 mt-4">2. Static import:</p>
    <TestDisplay class="border border-accent p-4 rounded" />

    <div class="mt-6">
      <h3 class="font-bold mb-2">🔍 Registered Components</h3>
      <ul class="list-disc list-inside text-sm">
        <li v-for="(path, name) in componentList" :key="name">
          <code class="text-xs font-mono">{{ name }}</code> →
          <span class="text-base-content/60">{{ path }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const componentList = ref<Record<string, string>>({})

onMounted(() => {
  const files = import.meta.glob('/components/**/*.vue')
  const registered: Record<string, string> = {}

  Object.entries(files).forEach(([path]) => {
    const parts = path
      .replace(/^\/components\//, '')
      .replace(/\.vue$/, '')
      .split('/')
      .map((s) => s.replace(/([A-Z])/g, '-$1').toLowerCase())

    const name = parts.join('-').replace(/^-/, '') // kebab-case flat name
    registered[name] = path
  })

  console.log('🧪 Registered Components:', registered)
  componentList.value = registered
})
</script>
