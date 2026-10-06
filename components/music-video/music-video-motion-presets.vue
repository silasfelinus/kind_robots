<!-- /components/music-video/music-video-motion-presets.vue -->
<template>
  <section class="kr-panel space-y-3 p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="kr-text-black-xl text-base-content">Animation presets</h2>
      <span class="kr-text-dim-sm">
        Named animation prompts. Apply one from any scene set to "Animated
        clip".
      </span>
    </div>

    <ul class="space-y-2">
      <li
        v-for="(preset, index) in draft"
        :key="preset.id"
        class="kr-panel space-y-1 p-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="preset.name"
            class="kr-input flex-1 text-sm"
            type="text"
            :maxlength="limits.maxMotionPresetName"
            placeholder="Preset name"
            aria-label="Preset name"
          />
          <button
            type="button"
            class="kr-btn kr-btn-xs"
            @click="draft.splice(index, 1)"
          >
            Remove
          </button>
        </div>
        <textarea
          v-model="preset.prompt"
          class="kr-textarea text-sm"
          rows="3"
          :maxlength="limits.maxPrompt"
          placeholder="One camera move plus one action"
          aria-label="Preset animation prompt"
        />
      </li>
    </ul>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="kr-btn"
        :disabled="draft.length >= limits.maxMotionPresets"
        @click="add"
      >
        Add preset
      </button>
      <button
        v-if="!draft.length"
        type="button"
        class="kr-btn"
        @click="addStarters"
      >
        Add starter presets
      </button>
      <button
        type="button"
        class="kr-btn kr-btn-primary"
        :disabled="!dirty || store.saving || hasIncomplete"
        @click="save"
      >
        Save presets
      </button>
      <span v-if="hasIncomplete" class="kr-text-dim-sm">
        Every preset needs a name and a prompt.
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
// music-video/t-030. Silas, 2026-10-06: "There should also be a preset
// section to create/edit an animation prompt."
import { computed, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import {
  MUSIC_VIDEO_LIMITS,
  type MusicVideoMotionPreset,
} from '@/utils/musicVideoDoc'

const store = useMusicVideoStore()
const limits = MUSIC_VIDEO_LIMITS
const draft = ref<MusicVideoMotionPreset[]>([])

const STARTERS: Omit<MusicVideoMotionPreset, 'id'>[] = [
  {
    name: 'Slow push in',
    prompt:
      'Slow push in toward the subject; the subject breathes and shifts its weight.',
  },
  {
    name: 'Hero turn',
    prompt:
      'Camera holds steady as the subject turns its head toward the camera.',
  },
  {
    name: 'Wind and dust',
    prompt:
      'Static camera; wind moves cloth and hair while dust drifts across the frame.',
  },
  {
    name: 'Orbit',
    prompt:
      'Camera orbits slowly around the subject, who stays still and watchful.',
  },
]

const saved = computed(() =>
  JSON.stringify(store.current?.doc.settings.motionPresets ?? []),
)
const dirty = computed(() => JSON.stringify(draft.value) !== saved.value)
const hasIncomplete = computed(() =>
  draft.value.some((preset) => !preset.name.trim() || !preset.prompt.trim()),
)

watch(
  saved,
  (value) => {
    draft.value = JSON.parse(value) as MusicVideoMotionPreset[]
  },
  { immediate: true },
)

function newId(): string {
  return `motion-${Date.now().toString(36)}-${draft.value.length}`
}

function add() {
  draft.value.push({ id: newId(), name: '', prompt: '' })
}

function addStarters() {
  draft.value = STARTERS.map((preset, index) => ({
    ...preset,
    id: `motion-starter-${index + 1}`,
  }))
}

async function save() {
  await store.saveMotionPresets(
    draft.value.map((preset) => ({
      id: preset.id,
      name: preset.name.trim(),
      prompt: preset.prompt.trim(),
    })),
  )
}
</script>
