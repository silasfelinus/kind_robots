<!-- /components/music-video/music-video-pipeline-bar.vue -->
<template>
  <section class="kr-panel space-y-3 p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="kr-text-black-xl text-base-content">Pipeline</h2>
      <span v-if="store.hasPendingJobs" class="kr-badge-outline">
        <span class="kr-spinner-xs" />
        Renders queued · checking every 20 s
      </span>
    </div>

    <ol
      class="grid gap-2 grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))]"
    >
      <li v-for="step in steps" :key="step.key" class="kr-panel space-y-1 p-2">
        <p class="kr-text-dim-sm">{{ step.index }}. {{ step.title }}</p>
        <p class="text-sm">{{ step.state }}</p>
        <button
          type="button"
          class="kr-btn w-full"
          :class="{ 'kr-btn-primary': step.primary }"
          :disabled="Boolean(store.busyAction) || step.disabled"
          :title="step.hint"
          @click="step.run()"
        >
          <span v-if="store.busyAction === step.key" class="kr-spinner-xs" />
          {{ step.label }}
        </button>
      </li>
    </ol>

    <div class="flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="kr-btn"
        :disabled="Boolean(store.busyAction)"
        @click="store.syncStatus()"
      >
        Check renders now
      </button>
      <span v-if="store.actionMessage" class="kr-text-dim-sm">
        {{ store.actionMessage }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
// music-video/t-027: the pipeline steps the headless script already drives
// (lyrics -> song -> plan -> prompts -> stills), as buttons on the admin page.
import { computed } from 'vue'
import { useMusicVideoStore } from '@/stores/musicVideoStore'

const store = useMusicVideoStore()

const doc = computed(() => store.current?.doc ?? null)
const scenesWithPrompt = computed(
  () => doc.value?.scenes.filter((scene) => scene.prompt.trim()).length ?? 0,
)
const stillsQueued = computed(
  () =>
    Object.values(store.sceneStatuses).filter((row) =>
      ['PENDING', 'RUNNING'].includes(row.status),
    ).length,
)

function songState(): string {
  const song = doc.value?.song
  const job = store.songJob
  if (job && ['PENDING', 'RUNNING'].includes(job.status)) {
    return `Song job ${job.id} is ${job.status.toLowerCase()}.`
  }
  if (job?.status === 'FAILED') return `Song failed: ${job.error ?? 'unknown'}`
  if (song?.artImageId) {
    return song.source === 'upload' ? 'Uploaded song ready.' : 'Song ready.'
  }
  return 'No song yet.'
}

const steps = computed(() => {
  const d = doc.value
  const hasLyrics = store.lyricLineCount > 0
  const hasSong = Boolean(d?.song?.artImageId)
  const sceneCount = store.sceneCount
  return [
    {
      key: 'lyrics',
      index: 1,
      title: 'Lyrics',
      state: hasLyrics ? `${store.lyricLineCount} lines` : 'Not written',
      label: hasLyrics ? 'Rewrite lyrics' : 'Write lyrics',
      hint: 'Writes structured lyrics from the pitch and settings.',
      disabled: !d?.pitch.trim(),
      primary: !hasLyrics,
      run: () => {
        if (
          hasLyrics &&
          !window.confirm('Rewrite every unlocked lyric section?')
        ) {
          return
        }
        void store.writeLyrics()
      },
    },
    {
      key: 'song',
      index: 2,
      title: 'Song',
      state: songState(),
      label: d?.song ? 'Regenerate song' : 'Generate song',
      hint: 'Queues an ACE-Step song on the Comfy backend (about 40 s for 30 s of music).',
      disabled: !hasLyrics,
      primary: hasLyrics && !d?.song,
      run: () => {
        if (d?.song && !window.confirm('Replace the current song?')) return
        void store.generateSong(Boolean(d?.song))
      },
    },
    {
      key: 'plan',
      index: 3,
      title: 'Scenes',
      state: sceneCount ? `${sceneCount} scenes planned` : 'Not planned',
      label: sceneCount ? 'Re-plan scenes' : 'Plan scenes',
      hint: 'Lays scenes on the beat grid. Re-planning replaces every scene.',
      disabled: !hasSong,
      primary: hasSong && !sceneCount,
      run: () => {
        if (
          sceneCount &&
          !window.confirm(
            'Re-planning replaces every scene, its art and its clip. Continue?',
          )
        ) {
          return
        }
        void store.planScenes(sceneCount > 0)
      },
    },
    {
      key: 'prompts',
      index: 4,
      title: 'Scene prompts',
      state: sceneCount
        ? `${scenesWithPrompt.value}/${sceneCount} written`
        : 'Plan scenes first',
      label: 'Write scene prompts',
      hint: 'Writes a prompt for each scene that has none; rejected ones retry next time.',
      disabled: !sceneCount,
      primary: sceneCount > 0 && scenesWithPrompt.value < sceneCount,
      run: () => void store.writeScenePrompts(),
    },
    {
      key: 'render',
      index: 5,
      title: 'Stills',
      state: stillsQueued.value
        ? `${store.scenesWithImage}/${sceneCount} done · ${stillsQueued.value} queued`
        : `${store.scenesWithImage}/${sceneCount} done`,
      label: 'Render missing stills',
      hint: 'Queues a still for every prompted scene that has no image yet.',
      disabled: !scenesWithPrompt.value,
      primary: scenesWithPrompt.value > 0 && store.scenesWithImage < sceneCount,
      run: () => void store.renderScenes(),
    },
  ]
})
</script>
