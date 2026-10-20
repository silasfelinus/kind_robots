<template>
  <span class="block overflow-hidden bg-base-300">
    <EcotoneScene
      v-if="scene"
      :kind="scene as SceneKind"
      :art="art ?? undefined"
      :label="title"
      class="absolute inset-0"
    />
    <img
      v-else-if="artUrl && !broken"
      :src="artUrl"
      :alt="title"
      loading="lazy"
      class="absolute inset-0 size-full object-cover"
      @error="broken = true"
    />
    <span
      v-else
      class="absolute inset-0 grid place-items-center bg-gradient-to-br from-base-200 to-base-300"
    >
      <Icon name="kind-icon:image" class="size-6 text-base-content/30" />
    </span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SceneKind } from '~/utils/ecotone/content'

// A beat's picture in the Playbook Manager: Ecotone's code-drawn scene with any
// painting over it, another game's own art file, or an empty slot.
const props = defineProps<{
  title: string
  scene?: string
  art?: string | null
  artUrl?: string | null
}>()

const broken = ref(false)
watch(
  () => props.artUrl,
  () => (broken.value = false),
)
</script>
