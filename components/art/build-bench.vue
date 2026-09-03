<template>
  <section class="kr-container flex flex-col gap-4 p-4 md:p-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span
          class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary"
        >
          <Icon name="kind-icon:server" class="h-7 w-7" />
        </span>
        <div>
          <p class="text-2xl font-black tracking-tight">Build Bench</p>
          <p class="text-sm text-base-content/60">
            Two builds enter, you decide. Clone one side, change a single knob,
            render both, pick the winner.
          </p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button class="btn btn-primary btn-sm" :disabled="running" @click="store.runBoth">
          <span v-if="running" class="loading loading-spinner loading-xs" />
          Run both
        </button>
        <button class="kr-btn-ghost-plain" :disabled="running" @click="store.newMatchup">
          New matchup
        </button>
      </div>
    </header>

    <p v-if="store.state.error" class="kr-note kr-note-warning">
      {{ store.state.error }}
    </p>

    <div class="grid gap-4 md:grid-cols-2">
      <div
        v-for="side in (['A', 'B'] as BenchSide[])"
        :key="side"
        class="kr-panel-flat flex flex-col gap-3 p-4"
        :class="store.state.winner === side ? 'border-success bg-success/5' : ''"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="badge badge-lg" :class="side === 'A' ? 'badge-primary' : 'badge-secondary'">
              Build {{ side }}
            </span>
            <span v-if="store.state.winner === side" class="badge badge-success badge-sm">🏆 winner</span>
          </div>
          <button
            class="kr-btn-ghost-xs-plain"
            :disabled="running"
            :title="`Copy Build ${side}'s entire config onto Build ${side === 'A' ? 'B' : 'A'}`"
            @click="store.cloneTo(side)"
          >
            Clone → {{ side === 'A' ? 'B' : 'A' }}
          </button>
        </div>

        <label class="flex flex-col gap-1 text-xs">
          <span class="font-semibold">Engine</span>
          <select
            class="select select-bordered select-sm"
            :value="cfg(side).engine"
            @change="store.setEngine(side, ($event.target as HTMLSelectElement).value as BenchEngineKey)"
          >
            <option v-for="e in store.BENCH_ENGINES" :key="e.key" :value="e.key">
              {{ e.label }} — {{ e.hint }}
            </option>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-xs">
          <span class="font-semibold">Prompt</span>
          <textarea
            v-model="cfg(side).prompt"
            rows="3"
            class="textarea textarea-bordered textarea-sm"
            placeholder="Describe the image…"
            @change="store.persist"
          />
        </label>

        <details class="text-xs">
          <summary class="cursor-pointer font-semibold opacity-70">Negative + advanced</summary>
          <textarea
            v-model="cfg(side).negativePrompt"
            rows="2"
            class="textarea textarea-bordered textarea-sm mt-2 w-full"
            placeholder="Negative prompt (works on cfg>1 engines)"
            @change="store.persist"
          />
          <div class="mt-2 grid grid-cols-3 gap-2">
            <label class="flex flex-col gap-1">
              <span>Steps</span>
              <input v-model.number="cfg(side).steps" type="number" min="1" class="input input-bordered input-xs" @change="store.persist" />
            </label>
            <label class="flex flex-col gap-1">
              <span>CFG</span>
              <input v-model.number="cfg(side).cfg" type="number" step="0.1" class="input input-bordered input-xs" @change="store.persist" />
            </label>
            <label class="flex flex-col gap-1">
              <span>Guidance</span>
              <input v-model.number="cfg(side).guidance" type="number" step="0.1" class="input input-bordered input-xs" @change="store.persist" />
            </label>
            <label class="flex flex-col gap-1">
              <span>Seed</span>
              <input
                :value="cfg(side).seed ?? ''"
                type="number"
                placeholder="random"
                class="input input-bordered input-xs"
                @change="onSeed(side, $event)"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span>Width</span>
              <input v-model.number="cfg(side).width" type="number" step="8" class="input input-bordered input-xs" @change="store.persist" />
            </label>
            <label class="flex flex-col gap-1">
              <span>Height</span>
              <input v-model.number="cfg(side).height" type="number" step="8" class="input input-bordered input-xs" @change="store.persist" />
            </label>
            <label class="flex flex-col gap-1">
              <span>Sampler</span>
              <input v-model="cfg(side).sampler" type="text" class="input input-bordered input-xs" @change="store.persist" />
            </label>
            <label class="flex flex-col gap-1">
              <span>Scheduler</span>
              <input v-model="cfg(side).scheduler" type="text" class="input input-bordered input-xs" @change="store.persist" />
            </label>
            <label class="flex flex-col gap-1">
              <span>LoRA</span>
              <input v-model="cfg(side).loraName" type="text" placeholder="none" class="input input-bordered input-xs" @change="store.persist" />
            </label>
          </div>
        </details>

        <button class="btn btn-outline btn-sm" :disabled="running" @click="store.runSide(side)">
          Render Build {{ side }}
        </button>

        <!-- result -->
        <div class="flex min-h-48 items-center justify-center rounded-2xl bg-base-200 p-3">
          <div
            v-if="result(side).status === 'idle'"
            class="flex flex-col items-center gap-2 text-xs text-base-content/50"
          >
            <Icon name="kind-icon:image" class="h-8 w-8 opacity-60" />
            No render yet
          </div>
          <div v-else-if="result(side).status === 'queued' || result(side).status === 'rendering'" class="flex flex-col items-center gap-2 text-xs">
            <span class="loading loading-spinner loading-md" />
            {{ result(side).status === 'rendering' ? 'Rendering…' : 'Queued…' }}
            <span v-if="result(side).jobId" class="opacity-50">job #{{ result(side).jobId }}</span>
          </div>
          <p v-else-if="result(side).status === 'failed'" class="kr-note kr-note-warning">
            Failed: {{ result(side).error }}
          </p>
          <img
            v-else-if="result(side).src"
            :src="result(side).src"
            :alt="`Build ${side} render`"
            class="max-h-96 w-auto rounded-xl"
          />
        </div>

        <div v-if="result(side).status === 'done'" class="flex items-center justify-between text-[11px] opacity-70">
          <span>seed {{ result(side).seed ?? '—' }} · {{ elapsed(side) }} · ArtImage #{{ result(side).artImageId }}</span>
          <button
            class="btn btn-xs"
            :class="store.state.winner === side ? 'btn-success' : 'btn-ghost'"
            @click="store.pickWinner(side)"
          >
            {{ store.state.winner === side ? '🏆 winner' : 'Pick winner' }}
          </button>
        </div>
      </div>
    </div>

    <!-- save / notes -->
    <div class="kr-panel-flat flex flex-wrap items-center gap-2 p-4">
      <input
        v-model="store.state.note"
        type="text"
        placeholder="Notes on this matchup (why the winner won)…"
        class="input input-bordered input-sm flex-1"
      />
      <button class="btn btn-sm" @click="store.saveMatchup">Save matchup</button>
    </div>

    <!-- saved matchups -->
    <details v-if="store.state.saved.length" class="kr-panel-flat p-4 text-xs">
      <summary class="cursor-pointer font-semibold">Saved matchups ({{ store.state.saved.length }})</summary>
      <ul class="mt-3 flex flex-col gap-1.5">
        <li
          v-for="m in store.state.saved"
          :key="m.id"
          class="flex items-center justify-between gap-2 rounded-xl bg-base-200 px-3 py-2"
        >
          <span class="truncate">
            <strong>{{ engineLabel(m.a.engine) }}</strong> vs <strong>{{ engineLabel(m.b.engine) }}</strong>
            <span v-if="m.winner" class="badge badge-success badge-xs ml-1">{{ m.winner }} won</span>
            <span class="ml-1 opacity-60">{{ m.note }}</span>
          </span>
          <span class="flex gap-1">
            <button class="kr-btn-ghost-xs-plain" @click="store.loadSaved(m)">Load</button>
            <button class="btn btn-ghost btn-xs text-error" @click="store.deleteSaved(m.id)">✕</button>
          </span>
        </li>
      </ul>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  useBuildBenchStore,
  type BenchSide,
  type BenchEngineKey,
  type BuildConfig,
  type BuildResult,
} from '@/stores/buildBenchStore'

const store = useBuildBenchStore()

onMounted(() => store.hydrate())

function cfg(side: BenchSide): BuildConfig {
  return side === 'A' ? store.state.buildA : store.state.buildB
}
function result(side: BenchSide): BuildResult {
  return side === 'A' ? store.state.resultA : store.state.resultB
}
function elapsed(side: BenchSide): string {
  const ms = result(side).elapsedMs
  return ms == null ? '' : `${(ms / 1000).toFixed(1)}s`
}
function engineLabel(key: BenchEngineKey): string {
  return store.BENCH_ENGINES.find((e) => e.key === key)?.label ?? key
}
function onSeed(side: BenchSide, event: Event): void {
  const raw = (event.target as HTMLInputElement).value.trim()
  cfg(side).seed = raw === '' ? null : Number(raw)
  store.persist()
}

const running = computed(
  () =>
    store.state.resultA.status === 'queued' ||
    store.state.resultA.status === 'rendering' ||
    store.state.resultB.status === 'queued' ||
    store.state.resultB.status === 'rendering',
)
</script>
