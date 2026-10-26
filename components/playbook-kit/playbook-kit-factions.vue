<template>
  <ul class="flex flex-col gap-2">
    <li
      v-for="faction in spec.factions"
      :key="faction.id"
      class="flex gap-3 overflow-hidden rounded-xl border border-base-content/10 bg-base-200/60 p-2"
    >
      <PlaybookKitArt
        :art="faction.emblem"
        :tone="faction.tone"
        icon="kind-icon:shield"
        class="size-16 shrink-0 rounded-lg"
      />
      <span class="flex min-w-0 flex-1 flex-col gap-1">
        <span class="pk-display text-sm font-bold">{{ faction.name }}</span>
        <span class="pk-dim text-xs leading-snug opacity-80">{{
          faction.tagline
        }}</span>
        <span
          v-if="standing(faction.id)"
          class="flex items-center gap-2 text-xs"
        >
          <span class="pk-dim opacity-70">{{
            standing(faction.id)!.label
          }}</span>
          <progress
            class="progress h-1.5 flex-1"
            :class="PROGRESS[faction.tone]"
            :value="standing(faction.id)!.value - standing(faction.id)!.min"
            :max="standing(faction.id)!.max - standing(faction.id)!.min"
          />
          <span class="font-bold tabular-nums">{{
            standing(faction.id)!.value
          }}</span>
        </span>
        <span
          v-if="members(faction.id).length"
          class="pk-dim text-[11px] opacity-70"
        >
          {{ members(faction.id).join(' · ') }}
        </span>
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { KitTone, PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{
  spec: PlaybookKitSpec
  meterValues?: Record<string, number>
}>()

const PROGRESS: Record<KitTone, string> = {
  primary: 'progress-primary',
  secondary: 'progress-secondary',
  accent: 'progress-accent',
  info: 'progress-info',
  success: 'progress-success',
  warning: 'progress-warning',
  error: 'progress-error',
  neutral: 'progress-neutral',
}

function standing(id: string) {
  const meter = props.spec.meters.find((m) => m.faction === id)
  if (!meter) return null
  return { ...meter, value: props.meterValues?.[meter.id] ?? meter.start }
}

function members(id: string): string[] {
  return props.spec.cast.filter((c) => c.faction === id).map((c) => c.name)
}
</script>
