<template>
      <aside
        class="kr-panel kr-scroll min-h-0 overflow-y-auto p-2"
        aria-label="Dead Air private film archive"
      >
        <p class="mb-2 text-xs font-black uppercase tracking-wider opacity-65">
          Archive · newest first
        </p>
        <p v-if="store.error" role="alert" class="text-sm text-error">
          {{ store.error }}
        </p>
        <p v-if="!films.length" class="kr-text-dim-sm p-4 text-center">
          No private Dead Air broadcasts found. Films appear here after the
          producer creates a saved MusicVideo.
        </p>
        <div
          v-else
          class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1"
        >
          <button
            v-for="film in films"
            :key="film.id"
            type="button"
            class="flex min-w-0 gap-2 rounded-xl border p-2 text-left transition-colors"
            :class="
              selectedId === film.id
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-100/70 hover:border-primary/50'
            "
            :aria-pressed="selectedId === film.id"
            :data-testid="'dead-air-film-' + film.id"
            @click="emit('select', film.id)"
          >
            <div
              class="relative aspect-video w-[42%] shrink-0 overflow-hidden rounded-lg bg-neutral"
            >
              <img
                v-if="film.hasFinal && !posterFailures[film.id]"
                :src="store.posterUrl(film.id)"
                :alt="'Poster for ' + film.title"
                class="h-full w-full object-cover"
                loading="lazy"
                @error="posterFailures[film.id] = true"
              />
              <div
                v-else
                class="grid h-full place-items-center text-xl text-neutral-content"
                aria-hidden="true"
              >
                ◉
              </div>
            </div>
            <span class="flex min-w-0 flex-1 flex-col justify-center gap-1">
              <strong class="line-clamp-2 text-sm leading-tight">
                {{ displayTitle(film.title) }}
              </strong>
              <small class="text-[11px] opacity-70">
                #{{ film.id }} · {{ dateLabel(film.createdAt) }}
              </small>
              <span class="flex flex-wrap gap-1">
                <span class="kr-badge-outline text-[10px]">
                  {{ film.hasFinal ? 'Final cut' : 'Rendering / draft' }}
                </span>
                <span class="kr-badge-outline text-[10px]">
                  {{ film.isPublic ? 'Public' : 'Private' }}
                </span>
              </span>
            </span>
          </button>
        </div>
      </aside>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useMusicVideoStore, type MusicVideoSummary } from '@/stores/musicVideoStore'

defineProps<{ films: MusicVideoSummary[]; selectedId: number | null }>()
const emit = defineEmits<{ select: [id: number] }>()
const store = useMusicVideoStore()
const posterFailures = reactive<Record<number, boolean>>({})

function displayTitle(title: string): string {
  return title.replace(/^Dead Air:\s*/, '')
}
function dateLabel(value: string): string {
  return value.slice(0, 10)
}
</script>
