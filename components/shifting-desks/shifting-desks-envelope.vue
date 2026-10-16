<template>
  <section
    v-if="run"
    aria-label="Your sealed envelope"
    :class="compact ? 'contents' : ''"
  >
    <button
      v-if="compact"
      type="button"
      class="btn btn-xs relative max-sm:px-1"
      :class="
        !store.envelopeOpened && highlight
          ? 'envelope-sealed border-2 border-stone-800 text-stone-900'
          : 'btn-ghost'
      "
      :title="
        store.envelopeOpened
          ? `Envelope: ${society.title} · ${statusLabel}; ${mutation.title} · ${run.mutationUsed ? 'used' : 'ready'}`
          : 'A sealed envelope is taped under your desk'
      "
      @click="store.envelopeOpened ? (expanded = true) : breakSeal()"
    >
      <icon name="kind-icon:mask" class="size-4" />
      <span
        :class="
          !store.envelopeOpened && highlight ? '' : 'sr-only lg:not-sr-only'
        "
        >{{ store.envelopeOpened ? 'Envelope' : 'Break the seal' }}</span
      >
      <span
        v-if="
          store.envelopeOpened &&
          (instantAvailable(run, 'favor') || instantAvailable(run, 'mutation'))
        "
        class="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warning"
        aria-hidden="true"
      />
    </button>
    <button
      v-else-if="!store.envelopeOpened"
      type="button"
      class="envelope-sealed flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-stone-800 px-3 py-2 text-left text-stone-900"
      @click="breakSeal"
    >
      <span class="flex min-w-0 items-center gap-3">
        <span class="envelope-seal shrink-0" aria-hidden="true">
          <icon name="kind-icon:mask" size="1.1rem" />
        </span>
        <span class="min-w-0">
          <span
            class="block font-mono text-xs font-black uppercase tracking-[.2em]"
            >A sealed envelope is taped under your desk</span
          >
          <span class="hidden text-xs md:block"
            >Your secret society and your unregistered mutation. Nobody else may
            see it. Read it, then eat it.</span
          >
        </span>
      </span>
      <span
        class="shrink-0 rounded-full border-2 border-stone-800 px-3 py-1 text-xs font-bold uppercase"
        >Break the seal</span
      >
    </button>

    <div
      v-else
      class="flex items-center gap-1.5 overflow-hidden rounded-2xl border-2 border-stone-800 bg-base-200 p-1.5"
    >
      <span
        class="society-chip flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold"
      >
        <icon name="kind-icon:mask" size="0.9rem" class="shrink-0" />
        <span class="truncate">{{ society.title }} · {{ statusLabel }}</span>
      </span>
      <span
        class="mutation-chip flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold"
      >
        <icon name="kind-icon:bolt" size="0.9rem" class="shrink-0" />
        <span class="truncate"
          >{{ mutation.title }} ·
          {{ run.mutationUsed ? 'used' : 'ready' }}</span
        >
      </span>
      <button
        v-if="instantAvailable(run, 'mutation')"
        type="button"
        class="btn btn-xs shrink-0"
        @click="store.useInstant('mutation')"
      >
        Use it
      </button>
      <button
        v-if="instantAvailable(run, 'favor')"
        type="button"
        class="btn btn-xs shrink-0"
        @click="store.useInstant('favor')"
      >
        Call in favor
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-xs ml-auto shrink-0"
        :aria-expanded="expanded"
        @click="expanded = true"
      >
        Open envelope
      </button>
    </div>

    <dialog
      ref="sheet"
      class="modal"
      aria-label="Your envelope"
      @close="expanded = false"
    >
      <div
        class="modal-box grid max-h-[88dvh] max-w-4xl grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3 overflow-y-auto p-3"
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
            <strong>Orders:</strong>
            {{ society.objective_text[run.department] }}
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
      <form method="dialog" class="modal-backdrop">
        <button type="submit">Close</button>
      </form>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  favorAvailable,
  instantAvailable,
  mutationById,
  societyById,
  stationArt,
} from '~/utils/shiftingDesks/rules'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'

withDefaults(defineProps<{ compact?: boolean; highlight?: boolean }>(), {
  compact: false,
  highlight: false,
})
const store = useShiftingDesksStore()
const expanded = ref(false)
const sheet = ref<HTMLDialogElement | null>(null)

function breakSeal(): void {
  store.openEnvelope()
  expanded.value = true
}

function syncSheet(): void {
  const open = expanded.value && store.envelopeOpened
  if (open && !sheet.value?.open) sheet.value?.showModal()
  if (!open && sheet.value?.open) sheet.value.close()
}

watch(expanded, () => nextTick(syncSheet))
onMounted(syncSheet)

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
    ? 'bg-green-800 text-white'
    : run.value?.societyStatus === 'betrayed'
      ? 'bg-red-800 text-white'
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
  width: 2.1rem;
  height: 2.1rem;
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
