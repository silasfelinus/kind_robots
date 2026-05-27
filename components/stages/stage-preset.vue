<!-- /components/content/stage/stage-preset.vue -->
<template>
  <button
    type="button"
    class="card card-compact w-full overflow-hidden text-left border bg-base-100 transition hover:bg-base-200"
    :class="
      isSelected ? 'border-primary ring-2 ring-primary' : 'border-base-300'
    "
    @click="emit('select', preset.id)"
  >
    <figure
      v-if="preset.imagePath"
      class="relative h-28 w-full overflow-hidden bg-base-300"
    >
      <img
        :src="preset.imagePath"
        :alt="preset.label"
        class="h-full w-full object-cover"
      />
      <div
        class="absolute inset-0 bg-linear-to-t from-base-100/90 to-transparent"
      />
      <Icon
        :name="preset.icon"
        class="absolute bottom-2 left-2 h-6 w-6 text-primary drop-shadow"
      />
    </figure>

    <div class="card-body gap-1 p-3">
      <div class="flex items-center gap-2">
        <Icon
          v-if="!preset.imagePath"
          :name="preset.icon"
          class="h-5 w-5 shrink-0 text-primary"
        />
        <h3 class="card-title text-sm leading-tight">
          {{ preset.label }}
        </h3>
      </div>

      <p class="line-clamp-2 text-xs leading-snug opacity-70">
        {{ preset.tagline }}
      </p>

      <div v-if="isSelected" class="flex flex-wrap gap-1 pt-1">
        <span
          v-for="role in preset.roles"
          :key="role.key"
          class="badge badge-outline badge-xs gap-1"
        >
          <img
            v-if="role.badgeImagePath"
            :src="role.badgeImagePath"
            :alt="role.label"
            class="h-3 w-3 rounded-full object-cover"
          />
          {{ role.label }}
        </span>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { StagePreset } from '@/stores/helpers/stageHelper'

defineProps<{
  preset: StagePreset
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [stageId: string]
}>()
</script>
<script setup lang="ts">
import type { StagePreset } from '@/stores/helpers/stageHelper'

defineProps<{
  preset: StagePreset
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [stageId: string]
}>()
</script>
