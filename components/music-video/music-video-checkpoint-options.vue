<!-- /components/music-video/music-video-checkpoint-options.vue -->
<template>
  <optgroup label="Tuned lanes">
    <option v-for="lane in lanes" :key="lane.key" :value="lane.key">
      {{ lane.label }}
    </option>
  </optgroup>
  <optgroup v-if="checkpoints.length" label="All checkpoints">
    <option
      v-for="checkpoint in checkpoints"
      :key="checkpoint.key"
      :value="checkpoint.key"
    >
      {{ checkpoint.label }}
    </option>
  </optgroup>
</template>

<script setup lang="ts">
// music-video/t-032. Silas, 2026-10-06: "why am i missing so many checkpoints
// on the music video selection list?" The tuned comic lanes first, then every
// active SD-family checkpoint in the catalog, the list the art generator uses.
import { computed, onMounted } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useResourceStore } from '@/stores/resourceStore'
import { DEFAULT_COMIC_LANES } from '@/utils/comicLanes'
import { checkpointLaneKey } from '@/utils/musicVideoScenes'

const checkpointStore = useCheckpointStore()
const resourceStore = useResourceStore()

const lanes = DEFAULT_COMIC_LANES.filter((lane) => lane.key !== 'krea2')

const checkpoints = computed(() =>
  checkpointStore.visibleCheckpoints
    .map((checkpoint) => {
      const path = String(checkpoint.name ?? '').trim()
      return {
        key: checkpointLaneKey(path),
        label: String(checkpoint.customLabel || path),
        path,
      }
    })
    .filter((checkpoint) => checkpoint.path)
    .sort((a, b) => a.label.localeCompare(b.label)),
)

onMounted(() => {
  void resourceStore.getResources()
})
</script>
