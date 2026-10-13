<template>
  <section v-if="run" aria-label="Your sealed envelope">
    <button
      v-if="!store.envelopeOpened"
      type="button"
      class="envelope-sealed flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border-4 border-stone-800 p-5 text-left text-stone-900"
      @click="store.openEnvelope()"
    >
      <span class="flex items-center gap-4">
        <span class="envelope-seal" aria-hidden="true">
          <icon name="kind-icon:mask" size="2rem" />
        </span>
        <span>
          <span
            class="block font-mono text-sm font-black uppercase tracking-[.25em]"
            >A sealed envelope is taped under your desk</span
          >
          <span class="block text-sm"
            >Your secret society and your unregistered mutation. Nobody else may
            see it. Read it, then eat it.</span
          >
        </span>
      </span>
      <span
        class="rounded-full border-2 border-stone-800 px-4 py-1 text-xs font-bold uppercase"
        >Break the seal</span
      >
    </button>

    <div
      v-else-if="!expanded"
      class="flex flex-wrap items-center gap-2 rounded-2xl border-2 border-stone-800 bg-base-200 p-2"
    >
      <span
        class="society-chip flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold"
      >
        <icon name="kind-icon:mask" size="0.9rem" />
        {{ society.title }} · {{ statusLabel }}
      </span>
      <span
        class="mutation-chip flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold"
      >
        <icon name="kind-icon:bolt" size="0.9rem" />
        {{ mutation.title }} · {{ run.mutationUsed ? 'used' : 'ready' }}
      </span>
      <button
        v-if="instantAvailable(run, 'mutation')"
        type="button"
        class="btn btn-xs"
        @click="store.useInstant('mutation')"
      >
        Use {{ mutation.title }}
      </button>
      <button
        v-if="instantAvailable(run, 'favor')"
        type="button"
        class="btn btn-xs"
        @click="store.useInstant('favor')"
      >
        Call in {{ society.favor.title }}
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs ml-auto"
        :aria-expanded="false"
        @click="expanded = true"
      >
        Open envelope
      </button>
    </div>

    <div
      v-else
      class="relative grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-3"
    >
      <article
        class="society-card flex flex-col gap-2 rounded-2xl border-4 p-4"
        :class="run.societyStatus === 'betrayed' ? 'opacity-70' : ''"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p
            class="font-mono text-[11px] font-black uppercase tracking-[.25em] opacity-80"
          >
            Secret society
          </p>
          <span
            class="rounded-md px-2 py-0.5 text-[11px] font-black uppercase"
            :class="statusClass"
            >{{ statusLabel }}</span
          >
        </div>
        <shifting-desks-art
          class="rounded-xl border-2 border-stone-900"
          frame="aspect-[3/2]"
          :src="stationArt('societies', society.id)"
          :prompt="society.art_prompt"
          :alt="`Society: ${society.title}`"
          fallback-icon="kind-icon:mask"
          icon-size="2.5rem"
        />
        <p class="font-mono text-lg font-black uppercase">
          {{ society.title }}
        </p>
        <p class="text-sm italic">“{{ society.creed }}”</p>
        <p class="text-sm">
          <strong>Orders:</strong> {{ society.objective_text[run.department] }}
        </p>
        <p class="text-sm">
          <strong>Never:</strong> {{ society.betrayal_text[run.department] }}
        </p>
        <div
          class="flex flex-wrap items-center gap-2 rounded-xl bg-black/20 p-2 text-sm"
        >
          <icon name="kind-icon:key" size="1rem" />
          <span
            ><strong>Favor, {{ society.favor.title }}:</strong>
            {{ society.favor.text }}</span
          >
          <span class="ml-auto text-xs font-bold uppercase opacity-80">{{
            favorAvailable(run) ? 'Ready' : 'Spent'
          }}</span>
          <button
            v-if="instantAvailable(run, 'favor')"
            type="button"
            class="btn btn-xs border-amber-100 bg-amber-100 text-stone-900"
            @click="store.useInstant('favor')"
          >
            Call it in
          </button>
        </div>
      </article>

      <article
        class="mutation-card flex flex-col gap-2 rounded-2xl border-4 p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p
            class="font-mono text-[11px] font-black uppercase tracking-[.25em] opacity-80"
          >
            Unregistered mutation
          </p>
          <span
            class="rounded-md bg-stone-900/15 px-2 py-0.5 text-[11px] font-black uppercase"
            >{{ run.mutationUsed ? 'Used this department' : 'Ready' }}</span
          >
        </div>
        <shifting-desks-art
          class="rounded-xl border-2 border-stone-900"
          frame="aspect-[3/2]"
          :src="stationArt('mutations', mutation.id)"
          :prompt="mutation.art_prompt"
          :alt="`Mutation: ${mutation.title}`"
          fallback-icon="kind-icon:bolt"
          icon-size="2.5rem"
        />
        <p class="font-mono text-lg font-black uppercase">
          {{ mutation.title }}
        </p>
        <p class="text-sm">{{ mutation.text }}</p>
        <p class="text-xs opacity-80">
          Once per department. If anyone is watching, using it costs +2
          Suspicion.
        </p>
        <button
          type="button"
          class="btn btn-ghost btn-xs self-end"
          :aria-expanded="true"
          @click="expanded = false"
        >
          Fold the envelope
        </button>
        <button
          v-if="instantAvailable(run, 'mutation')"
          type="button"
          class="btn btn-sm self-start border-stone-900 bg-stone-900 text-lime-200"
          @click="store.useInstant('mutation')"
        >
          <icon name="kind-icon:bolt" size="1rem" /> Use it now
        </button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  favorAvailable,
  instantAvailable,
  mutationById,
  societyById,
  stationArt,
} from '~/utils/shiftingDesks/rules'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'

const store = useShiftingDesksStore()
const expanded = ref((store.run?.log.length ?? 0) === 0)

watch(
  () => store.run?.position,
  (now, before) => {
    if (before !== undefined && now !== before) expanded.value = false
  },
)
const run = computed(() => store.run)
const society = computed(() => societyById(run.value?.societyId ?? ''))
const mutation = computed(() => mutationById(run.value?.mutationId ?? ''))

const statusLabel = computed(() =>
  run.value?.societyStatus === 'met'
    ? 'Orders fulfilled'
    : run.value?.societyStatus === 'betrayed'
      ? 'You were burned'
      : 'Orders pending',
)
const statusClass = computed(() =>
  run.value?.societyStatus === 'met'
    ? 'bg-success text-success-content'
    : run.value?.societyStatus === 'betrayed'
      ? 'bg-error text-error-content'
      : 'bg-amber-100 text-stone-900',
)
</script>

<style scoped>
.envelope-sealed {
  background-color: #d9c48c;
  background-image: radial-gradient(
    rgb(41 37 36 / 0.12) 1px,
    transparent 1.2px
  );
  background-size: 6px 6px;
}

.envelope-seal {
  display: flex;
  width: 3.5rem;
  height: 3.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #7f1d1d;
  color: #fef3c7;
  box-shadow: inset 0 0 0 4px rgb(254 243 199 / 0.25);
}

.society-chip {
  background: #7f1d1d;
  color: #fef3c7;
}

.mutation-chip {
  background: #bef264;
  color: #1c1917;
}

.society-card {
  border-color: #292524;
  background: #7f1d1d;
  color: #fef3c7;
}

.mutation-card {
  border-color: #292524;
  background: #bef264;
  color: #1c1917;
}
</style>
