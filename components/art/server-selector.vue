<template>
  <div class="flex flex-col gap-2 w-full">
    <label class="text-sm font-semibold">{{ label }}</label>

    <div class="flex flex-col sm:flex-row gap-2">
      <select
        :value="modelValue ?? ''"
        class="select select-bordered rounded-2xl w-full"
        @change="handleChange"
      >
        <option value="">{{ placeholder }}</option>
        <option
          v-for="server in filteredServers"
          :key="server.id"
          :value="server.id"
        >
          {{ server.label || server.title }} · {{ server.serverType }}
        </option>
      </select>

      <NuxtLink to="/servers" class="btn btn-outline rounded-2xl">
        Manage Servers
      </NuxtLink>
    </div>

    <div
      v-if="selectedServer"
      class="rounded-2xl border p-3 bg-base-100 text-sm space-y-1"
    >
      <div class="font-semibold">
        {{ selectedServer.label || selectedServer.title }}
      </div>
      <div>{{ selectedServer.description || 'No description provided.' }}</div>
      <div class="opacity-70">
        {{ selectedServer.baseUrl }}{{ selectedServer.endpointPath || '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useServerStore } from '@/stores/serverStore'
import type { PropType } from 'vue'
import type { Server, ServerType } from '~/prisma/generated/prisma/client'

const props = defineProps({
  modelValue: {
    type: Number as PropType<number | null>,
    default: null,
  },
  label: {
    type: String,
    default: 'Server',
  },
  placeholder: {
    type: String,
    default: 'Select a server',
  },
  allowedTypes: {
    type: Array as PropType<ServerType[]>,
    default: () => [],
  },
  capability: {
    type: String as PropType<'art' | 'text' | 'comfy' | ''>,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const serverStore = useServerStore()

onMounted(() => {
  serverStore.initialize()
})

const filteredServers = computed<Server[]>(() => {
  if (props.capability === 'art') return serverStore.artServers
  if (props.capability === 'text') return serverStore.textServers
  if (props.capability === 'comfy') return serverStore.comfyServers

  if (props.allowedTypes.length) {
    return serverStore.activeServers.filter((server: Server) =>
      props.allowedTypes.includes(server.serverType),
    )
  }

  return serverStore.activeServers
})

const selectedServer = computed<Server | null>(() => {
  if (typeof props.modelValue !== 'number') return null
  return serverStore.getServerById(props.modelValue)
})

function handleChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value)
  emit('update:modelValue', Number.isNaN(value) || value <= 0 ? null : value)
}
</script>
