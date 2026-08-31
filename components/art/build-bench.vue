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
        <button class="btn btn-ghost btn-sm" :disabled="running" @click="store.newMatchup">
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
            class="btn btn-ghost btn-xs"
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