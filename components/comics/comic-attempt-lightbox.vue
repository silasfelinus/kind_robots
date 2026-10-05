<template>
  <div
    v-if="attempt"
    class="fixed inset-0 z-50 grid place-items-center bg-neutral/80 p-4"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="kr-panel flex max-h-full w-full max-w-5xl flex-col gap-3 overflow-auto p-4"
    >
      <div class="flex items-center justify-between gap-2">
        <p class="kr-text-black-base">{{ slot?.title }} · {{ laneLabel }}</p>
        <button
          type="button"
          class="kr-btn btn-ghost btn-sm"
          aria-label="Close"
          @click="close"
        >
          <icon name="kind-icon:close" class="kr-icon-4" />
        </button>
      </div>
      <img
        v-if="attempt.fullUrl"
        :src="attempt.fullUrl"
        :alt="slot?.title ?? 'Render'"
        class="max-h-[70vh] w-full rounded-2xl object-contain"
      />
      <p v-else class="kr-note">
        {{ attempt.error || 'This render has no image yet.' }}
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="kr-btn btn-sm"
          :class="attempt.verdict === 'liked' ? 'btn-success' : 'btn-outline'"
          @click="studio.setVerdict(attempt.id, 'liked')"
        >
          <icon name="kind-icon:heart" class="kr-icon-4" /> Like (L)
        </button>
        <button
          type="button"
          class="kr-btn btn-sm"
          :class="attempt.verdict === 'rejected' ? 'btn-error' : 'btn-outline'"
          @click="studio.setVerdict(attempt.id, 'rejected')"
        >
          <icon name="kind-icon:x-circle" class="kr-icon-4" /> Reject (R)
        </button>
        <button
          type="button"
          class="kr-btn btn-sm"
          :class="
            attempt.verdict === 'selected' ? 'btn-primary' : 'btn-outline'
          "
          @click="studio.setVerdict(attempt.id, 'selected')"
        >
          <icon name="kind-icon:crown" class="kr-icon-4" /> Final (S)
        </button>
        <button
          v-if="studio.selectedPanel"
          type="button"
          class="kr-btn btn-outline btn-sm"
          @click="useOnPanel"
        >
          <icon name="kind-icon:image" class="kr-icon-4" /> Use on selected
          panel
        </button>
        <span class="kr-text-dim-xs ml-auto"
          >← → to step through this subject</span
        >
      </div>
      <dl class="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-xs">
        <dt class="opacity-60">Lane</dt>
        <dd>
          {{ laneLabel
          }}{{ attempt.checkpoint ? ` · ${attempt.checkpoint}` : '' }}
        </dd>
        <dt class="opacity-60">Size</dt>
        <dd>{{ attempt.width }}×{{ attempt.height }}</dd>
        <dt class="opacity-60">ArtJob</dt>
        <dd>{{ attempt.artJobId ?? 'none' }} · {{ attempt.status }}</dd>
        <dt class="opacity-60">Prompt</dt>
        <dd class="whitespace-pre-wrap">{{ attempt.prompt }}</dd>
        <dt v-if="attempt.negativePrompt" class="opacity-60">Negative</dt>
        <dd v-if="attempt.negativePrompt">{{ attempt.negativePrompt }}</dd>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useComicStudioStore } from '@/stores/comicStudioStore'

const studio = useComicStudioStore()
const attempt = computed(() => studio.attemptFor(studio.lightboxAttemptId))
const slot = computed(() => studio.slotById(attempt.value?.slotId))
const siblings = computed(() =>
  attempt.value ? studio.attemptsFor(attempt.value.slotId) : [],
)
const laneLabel = computed(
  () =>
    studio.lanes.find((lane) => lane.key === attempt.value?.laneKey)?.label ??
    attempt.value?.laneKey,
)

function close() {
  studio.lightboxAttemptId = null
}

function step(delta: number) {
  const list = siblings.value
  const index = list.findIndex((item) => item.id === attempt.value?.id)
  const next = list[index + delta]
  if (next) studio.lightboxAttemptId = next.id
}

function useOnPanel() {
  if (attempt.value && studio.selectedPanel)
    studio.assignArt(studio.selectedPanel.id, attempt.value.id)
  close()
}

function onKey(event: KeyboardEvent) {
  if (!attempt.value) return
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (event.key === 'Escape') close()
  else if (event.key === 'ArrowRight') step(1)
  else if (event.key === 'ArrowLeft') step(-1)
  else if (event.key.toLowerCase() === 'l')
    void studio.setVerdict(attempt.value.id, 'liked')
  else if (event.key.toLowerCase() === 'r')
    void studio.setVerdict(attempt.value.id, 'rejected')
  else if (event.key.toLowerCase() === 's')
    void studio.setVerdict(attempt.value.id, 'selected')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
