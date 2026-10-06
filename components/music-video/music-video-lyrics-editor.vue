<!-- /components/music-video/music-video-lyrics-editor.vue -->
<template>
  <section class="kr-panel space-y-3 p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="kr-text-black-xl text-base-content">Lyrics</h2>
      <span class="kr-text-dim-sm">
        One line per row. Lock a section to keep it when the AI rewrites.
      </span>
    </div>

    <p v-if="!draft.length" class="kr-text-dim-sm">
      No lyrics yet. Write them with the AI from the pitch, or add a section and
      type your own.
    </p>

    <ol class="space-y-3">
      <li
        v-for="(section, index) in draft"
        :key="section.id"
        class="kr-panel space-y-2 p-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="section.kind"
            class="kr-input w-auto"
            :aria-label="`Section ${index + 1} kind`"
          >
            <option v-for="kind in kinds" :key="kind" :value="kind">
              {{ kind }}
            </option>
          </select>
          <label class="flex items-center gap-1 text-sm">
            <input
              v-model="section.locked"
              type="checkbox"
              class="checkbox checkbox-sm"
            />
            Locked
          </label>
          <span class="flex-1" />
          <button
            type="button"
            class="kr-btn kr-btn-xs"
            :disabled="index === 0"
            @click="move(index, -1)"
          >
            Up
          </button>
          <button
            type="button"
            class="kr-btn kr-btn-xs"
            :disabled="index === draft.length - 1"
            @click="move(index, 1)"
          >
            Down
          </button>
          <button
            type="button"
            class="kr-btn kr-btn-xs"
            :disabled="section.locked || dirty || Boolean(store.busyAction)"
            :title="
              dirty
                ? 'Save your edits first'
                : 'Rewrite just this section with the AI'
            "
            @click="store.regenerateLyricSection(section.id)"
          >
            Rewrite with AI
          </button>
          <button type="button" class="kr-btn kr-btn-xs" @click="remove(index)">
            Remove
          </button>
        </div>
        <textarea
          v-model="section.text"
          class="kr-input w-full font-mono text-sm"
          :rows="Math.max(3, section.text.split('\n').length)"
          :aria-label="`Section ${index + 1} lines`"
        />
      </li>
    </ol>

    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="kr-btn" @click="addSection">
        Add section
      </button>
      <button
        type="button"
        class="kr-btn kr-btn-primary"
        :disabled="!dirty || store.saving"
        @click="save"
      >
        Save lyrics
      </button>
      <button
        type="button"
        class="kr-btn"
        :disabled="Boolean(store.busyAction) || !store.current?.doc.pitch"
        @click="writeAll"
      >
        {{ draft.length ? 'Rewrite unlocked with AI' : 'Write lyrics with AI' }}
      </button>
      <button
        type="button"
        class="kr-btn kr-btn-primary"
        :disabled="!hasLines || Boolean(store.busyAction) || store.saving"
        @click="generateSong"
      >
        {{
          store.current?.doc.song
            ? 'Regenerate song from these lyrics'
            : 'Generate song from these lyrics'
        }}
      </button>
      <span v-if="dirty" class="kr-text-dim-sm">Unsaved changes</span>
    </div>
  </section>
</template>

<script setup lang="ts">
// music-video/t-030. Silas, 2026-10-06: "we should be able to create and edit
// the song lyrics and then get it to generate from that same interface".
import { computed, ref, watch } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import {
  MUSIC_VIDEO_LIMITS,
  MUSIC_VIDEO_SECTION_KINDS,
  type MusicVideoSection,
  type MusicVideoSectionKind,
} from '@/utils/musicVideoDoc'

type DraftSection = {
  id: string
  kind: MusicVideoSectionKind
  locked: boolean
  text: string
}

const store = useMusicVideoStore()
const kinds = MUSIC_VIDEO_SECTION_KINDS
const draft = ref<DraftSection[]>([])

function toDraft(sections: MusicVideoSection[]): DraftSection[] {
  return sections.map((section) => ({
    id: section.id,
    kind: section.kind,
    locked: section.locked,
    text: section.lines.join('\n'),
  }))
}

function toSections(rows: DraftSection[]): MusicVideoSection[] {
  const L = MUSIC_VIDEO_LIMITS
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    locked: row.locked,
    lines: row.text
      .split('\n')
      .map((line) => line.trim().slice(0, L.maxLine))
      .filter(Boolean)
      .slice(0, L.maxLinesPerSection),
  }))
}

const saved = computed(() =>
  JSON.stringify(toDraft(store.current?.doc.lyrics.sections ?? [])),
)
const dirty = computed(() => JSON.stringify(draft.value) !== saved.value)
const hasLines = computed(() =>
  draft.value.some((row) => row.text.trim().length > 0),
)

watch(
  () => store.current?.doc.lyrics.sections,
  (sections) => {
    draft.value = toDraft(sections ?? [])
  },
  { immediate: true },
)

function addSection() {
  const kind: MusicVideoSectionKind = draft.value.length ? 'verse' : 'intro'
  draft.value.push({
    id: `${kind}-${Date.now().toString(36)}`,
    kind,
    locked: true,
    text: '',
  })
}

function move(index: number, step: number) {
  const next = [...draft.value]
  const [row] = next.splice(index, 1)
  if (!row) return
  next.splice(index + step, 0, row)
  draft.value = next
}

function remove(index: number) {
  const row = draft.value[index]
  if (row?.text.trim() && !window.confirm('Remove this section?')) return
  draft.value = draft.value.filter((_, i) => i !== index)
}

async function save(): Promise<boolean> {
  return store.saveLyrics(toSections(draft.value))
}

async function writeAll() {
  if (dirty.value && !(await save())) return
  if (
    draft.value.some((row) => !row.locked && row.text.trim()) &&
    !window.confirm('Rewrite every unlocked section with the AI?')
  ) {
    return
  }
  await store.writeLyrics()
}

async function generateSong() {
  if (dirty.value && !(await save())) return
  const replacing = Boolean(store.current?.doc.song)
  if (replacing && !window.confirm('Replace the current song?')) return
  await store.generateSong(replacing)
}
</script>
