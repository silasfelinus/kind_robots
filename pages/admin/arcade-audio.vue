<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col overflow-hidden"
    data-layout="console-fixed"
    data-testid="arcade-audio-admin"
  >
    <header-page-bar>
      <div class="flex min-w-0 flex-1 items-center gap-2 text-sm">
        <Icon name="kind-icon:music" class="size-5 shrink-0 text-primary" />
        <span class="truncate font-bold">ARCADE SOUNDTRACK STUDIO</span>
        <span class="badge badge-outline ml-auto hidden sm:inline-flex">
          Private production queue
        </span>
      </div>
    </header-page-bar>

    <div
      v-if="!user.isAdmin"
      class="grid min-h-0 flex-1 place-items-center p-5 text-center"
    >
      <p class="max-w-sm text-sm opacity-80" role="status">
        Administrator access is required to review Arcade soundtrack jobs.
      </p>
    </div>

    <section v-else class="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <div
        v-if="audio.error"
        class="alert alert-error py-2 text-sm"
        role="alert"
      >
        {{ audio.error }}
      </div>
      <p
        v-if="audio.message"
        class="alert alert-success py-2 text-sm"
        role="status"
      >
        {{ audio.message }}
      </p>

      <div
        class="grid gap-2 rounded-2xl border border-base-content/15 bg-base-200 p-3 sm:grid-cols-3"
      >
        <div class="space-y-1">
          <p class="text-xs font-bold uppercase opacity-65">Generation</p>
          <p class="text-sm font-semibold">
            {{ audio.queue?.generationEnabled ? 'Server enabled' : 'Disabled' }}
          </p>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-bold uppercase opacity-65">Audio relay</p>
          <p class="text-sm font-semibold">
            {{ audio.queue?.relay.ready ? 'Available' : 'Not ready' }}
          </p>
          <p class="text-xs opacity-70">
            {{ audio.queue?.relay.reason || 'Checking readiness…' }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <select
            v-model="gameFilter"
            class="select select-bordered select-sm min-w-0 flex-1 sm:max-w-44"
            aria-label="Filter Arcade soundtrack cues by game"
            data-testid="arcade-audio-filter"
          >
            <option value="all">All cabinets</option>
            <option v-for="game in gameNames" :key="game" :value="game">
              {{ game }}
            </option>
          </select>
          <button
            type="button"
            class="btn btn-outline btn-sm"
            :disabled="audio.loading"
            @click="audio.load()"
          >
            {{ audio.loading ? 'Loading…' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div
        class="kr-scroll min-h-0 flex-1 overflow-y-auto pr-1"
        data-testid="arcade-audio-queue"
      >
        <div
          v-if="audio.loading && !audio.queue"
          class="flex min-h-32 items-center justify-center text-sm opacity-70"
          role="status"
        >
          Loading soundtrack briefs…
        </div>
        <div
          v-else-if="audio.queue && !filteredEntries.length"
          class="rounded-2xl border border-dashed border-base-content/25 p-8 text-center text-sm"
        >
          No cues in this cabinet.
        </div>
        <div v-else class="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          <article
            v-for="entry in filteredEntries"
            :key="entry.jobKey"
            class="flex min-h-0 flex-col gap-2 rounded-2xl border border-base-content/15 bg-base-200 p-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <h2 class="truncate text-sm font-bold">
                  {{ entry.game }} · {{ entry.cue }}
                </h2>
                <p class="text-xs opacity-65">
                  {{ entry.brief.kind }} · {{ entry.brief.seconds }}s
                  <span v-if="entry.brief.bpm">
                    · {{ entry.brief.bpm }} BPM
                  </span>
                </p>
              </div>
              <span class="badge badge-ghost shrink-0 text-xs">
                {{ entry.job?.status || 'Not queued' }}
              </span>
            </div>
            <p class="text-xs font-medium text-secondary">
              {{ entry.brief.mood }}
            </p>
            <p class="text-xs opacity-70">
              {{ entry.brief.instrumentation.join(' · ') }}
            </p>
            <p class="line-clamp-3 text-xs leading-relaxed">
              {{ entry.brief.prompt }}
            </p>
            <div
              class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-base-content/10 pt-2"
            >
              <div class="min-w-0 text-xs opacity-70">
                <p>{{ stateFor(entry).label }}</p>
                <p v-if="entry.job">
                  Job #{{ entry.job.id }} ·
                  {{ String(entry.job.createdAt).slice(0, 16) }} UTC
                </p>
              </div>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="!audio.canApprove(entry)"
                :aria-label="
                  'Approve private audio render for ' +
                  entry.game +
                  ' ' +
                  entry.cue
                "
                :data-testid="
                  'arcade-audio-approve-' + entry.game + '-' + entry.cue
                "
                @click="audio.approve(entry)"
              >
                {{
                  audio.approving === entry.jobKey
                    ? 'Submitting…'
                    : 'Approve render'
                }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArcadeAudioQueueStore } from '~/stores/arcadeAudioQueueStore'
import { useUserStore } from '~/stores/userStore'
import {
  arcadeAudioCueState,
  arcadeAudioQueueGames,
  type ArcadeAudioQueueEntry,
} from '~/utils/arcade/audioQueue'

const user = useUserStore()
const audio = useArcadeAudioQueueStore()
const gameFilter = ref('all')
const gameNames = computed(() =>
  arcadeAudioQueueGames(audio.queue?.entries ?? []),
)
const filteredEntries = computed(() =>
  (audio.queue?.entries ?? []).filter(
    (entry) => gameFilter.value === 'all' || entry.game === gameFilter.value,
  ),
)

function stateFor(entry: ArcadeAudioQueueEntry) {
  return audio.queue
    ? arcadeAudioCueState(entry, audio.queue)
    : { label: 'Not loaded', eligible: false }
}

onMounted(() => {
  watch(
    () => user.isAdmin,
    (admin) => {
      if (admin) void audio.load()
      else audio.clear()
    },
    { immediate: true },
  )
})

useHead({ title: 'Arcade Soundtrack Studio · Kind Robots' })
</script>
