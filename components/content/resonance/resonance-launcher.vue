<!-- /components/content/story/resonance-launcher.vue -->
<template>
  <div class="flex flex-wrap items-center justify-center gap-3 w-full p-2">
    <div
      v-for="tool in resonanceTools"
      :key="tool.name"
      class="flex items-center justify-between bg-base-200 rounded-2xl border border-base-300 shadow-sm hover:shadow-md transition group max-w-xs w-full"
    >
      <!-- Icon Launch -->
      <button
        @click="navigate(tool.route)"
        class="flex items-center justify-center p-3 cursor-pointer hover:bg-accent hover:text-white rounded-l-2xl transition w-14 h-14"
        :title="`Open ${tool.label}`"
      >
        <Icon :name="tool.icon" class="w-6 h-6" />
      </button>

      <!-- Divider -->
      <div class="w-px h-8 bg-base-300"></div>

      <!-- Label Launch -->
      <button
        @click="navigate(tool.route)"
        class="flex-1 text-sm sm:text-base font-medium px-4 py-2 cursor-pointer text-center hover:text-accent transition"
        :title="`Go to ${tool.label}`"
      >
        {{ tool.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const resonanceTools = [
  {
    name: 'browser',
    icon: 'kind-icon:gallery',
    label: 'Resonance Browser',
    route: '/resonancebrowser',
  },
  {
    name: 'add',
    icon: 'kind-icon:add',
    label: 'New Resonance',
    route: '/addresonance',
  },
  {
    name: 'lab',
    icon: 'kind-icon:experiment',
    label: 'Resonance Lab',
    route: '/resonancelab',
  },
  {
    name: 'audio',
    icon: 'kind-icon:audio',
    label: 'Audio Visualizer',
    route: '/resonanceaudio',
  },
  {
    name: 'chapter',
    icon: 'kind-icon:chapter',
    label: 'Chapter Manager',
    route: '/resonancechapters',
  },
]

function navigate(path: string) {
  router.push(path)
}
</script>
