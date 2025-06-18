<!-- /components/content/art/checkpoint-card.vue -->
<template>
  <div
    class="p-3 rounded-2xl border cursor-pointer text-center space-y-2 transition-all w-full max-w-full overflow-hidden"
    :class="[
      isActive
        ? 'bg-primary text-white border-primary shadow-md'
        : 'hover:scale-[1.02] hover:shadow-lg bg-base-100 border-base-300',
    ]"
    @click="select"
  >
    <div class="w-full">
      <art-card v-if="art && checkpoint.name" :art="art" class="w-full h-40" />
      <img
        v-else-if="checkpoint.MediaPath"
        :src="`${checkpoint.MediaPath}?t=${cacheBuster}`"
        alt="Checkpoint Image"
        class="rounded-xl object-cover w-full h-40"
      />
      <img
        v-else
        src="/images/backtree.webp"
        alt="Fallback"
        class="rounded-xl object-cover w-full h-40 opacity-50"
      />
    </div>

    <div class="w-full space-y-1">
      <div class="font-bold text-sm break-words leading-tight">
        {{ showLabel }}
      </div>
      <div class="text-xs text-base-content/70">
        {{ isActive ? '✅ Active' : '' }}
      </div>
      <div
        v-if="checkpoint.isMature && !showMature"
        class="text-warning text-xs font-semibold"
      >
        Mature
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Art } from '@/stores/artStore'
import type { Resource } from '@/stores/resourceStore'
import { useCheckpointStore } from '@/stores/checkpointStore'

const props = defineProps<{
  checkpoint: Resource
  art?: Art | null
  showMature: boolean
  cacheBuster: number
}>()

const checkpointStore = useCheckpointStore()

const isActive = computed(() => {
  return checkpointStore.currentApiModel === props.checkpoint.name
})

const showLabel = computed(() => {
  if (!props.showMature && props.checkpoint.isMature) return 'Hidden'
  return props.checkpoint.customLabel || props.checkpoint.name
})

const select = () => {
  if (props.checkpoint.name) {
    checkpointStore.selectCheckpointByName(props.checkpoint.name)
  }
}
</script>
