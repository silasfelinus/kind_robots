<template>
  <section
    v-if="run"
    class="flex flex-col gap-5"
    aria-labelledby="file-heading"
  >
    <article
      class="file-folder relative overflow-hidden rounded-2xl border-4 border-stone-800 p-6 text-stone-900 sm:p-10"
    >
      <p
        class="font-mono text-xs font-black uppercase tracking-[.3em] text-stone-700"
      >
        Consolidated Wellness &amp; Defense · Personnel File #4471
      </p>
      <p
        id="file-heading"
        class="mt-2 font-mono text-4xl font-black uppercase sm:text-5xl"
      >
        {{ verdict.title }}
      </p>
      <p class="mt-3 max-w-2xl text-lg font-semibold">{{ verdict.summary }}</p>
      <span class="file-stamp" aria-hidden="true">{{ verdict.stamp }}</span>

      <div
        class="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3"
      >
        <div
          v-for="dept in departments"
          :key="dept.id"
          class="rounded-xl border-2 border-stone-800 bg-stone-50/70 p-3"
        >
          <p
            class="font-mono text-[11px] font-black uppercase tracking-widest opacity-70"
          >
            {{ dept.floor }} · {{ dept.title }}
          </p>
          <p class="font-mono text-lg font-black uppercase">
            {{ dept.outcome?.title ?? 'Not reached' }}
          </p>
          <p v-if="dept.outcome" class="text-sm">{{ dept.outcome.summary }}</p>
          <p v-if="dept.society" class="mt-1 text-xs font-bold uppercase">
            Society: {{ dept.society }}
          </p>
          <p v-if="dept.restructured" class="mt-1 text-xs italic">
            Restructured on arrival: {{ dept.restructured }}
          </p>
        </div>
      </div>

      <shifting-desks-test-results
        class="mt-6"
        final
        :readings="results"
        :verdict="resultsVerdict"
      />

      <dl
        class="mt-6 grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3 text-sm"
      >
        <div>
          <dt class="text-xs font-bold uppercase opacity-70">Job title</dt>
          <dd class="font-semibold">{{ jobTitle }}</dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase opacity-70">Secret society</dt>
          <dd class="font-semibold">{{ society.title }}</dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase opacity-70">Mutation</dt>
          <dd class="font-semibold">{{ mutation.title }}</dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase opacity-70">Employees used</dt>
          <dd class="font-semibold">{{ run.generation + 1 }}</dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase opacity-70">
            Successors on file
          </dt>
          <dd class="font-semibold">{{ run.meters.successors }}</dd>
        </div>
        <div>
          <dt class="text-xs font-bold uppercase opacity-70">Files handled</dt>
          <dd class="font-semibold">{{ filesHandled }}</dd>
        </div>
      </dl>

      <div v-if="run.terminations.length" class="mt-6">
        <p class="font-mono text-xs font-black uppercase tracking-widest">
          Causes of termination
        </p>
        <ul class="mt-2 flex flex-col gap-1 text-sm">
          <li v-for="(t, i) in run.terminations" :key="i">
            <span class="font-mono font-bold">{{ t.employee }}</span
            >:
            {{ t.cause }}
          </li>
        </ul>
      </div>
    </article>

    <p
      v-if="run.status === 'complete' && !ending"
      class="rounded-2xl border border-warning/50 bg-base-200 p-4 text-sm"
    >
      The elevator chimes again. Level −{{ deeperLevel }} is still being
      restructured. PAL promises it will open soon, and that you will love it.
    </p>
    <p
      v-if="ending"
      class="rounded-2xl border border-warning/50 bg-base-200 p-4 text-sm"
    >
      The Board has decided, and this is one of its endings. The others are
      still on the table, and so, technically, are you. PAL has kept your
      Successors warm.
    </p>

    <div class="flex flex-wrap gap-3 print:hidden">
      <button type="button" class="btn btn-warning" @click="emit('again')">
        <icon name="kind-icon:refresh" size="1rem" /> New Wellness Weekend
      </button>
      <button type="button" class="btn btn-outline" @click="printFile">
        <icon name="kind-icon:document" size="1rem" /> Print your file
      </button>
      <button type="button" class="btn btn-ghost" @click="emit('front')">
        Front desk
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DEPARTMENTS,
  DEPARTMENT_FLOORS,
  jobById,
  mutationById,
  finalVerdict,
  outcomeById,
  RESTRUCTURING_CARD,
  restructuringById,
  restructuringHeadline,
  rankedGrades,
  societyById,
  START_GRADES,
} from '~/utils/shiftingDesks/rules'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'

const emit = defineEmits<{ again: []; front: [] }>()
const store = useShiftingDesksStore()
const run = computed(() => store.run)
const society = computed(() => societyById(run.value?.societyId ?? ''))
const mutation = computed(() => mutationById(run.value?.mutationId ?? ''))
const jobTitle = computed(() => jobById(run.value?.jobId ?? '').title)
const filesHandled = computed(
  () =>
    run.value?.log.filter(
      (e) => e.cardId !== 'dossier' && e.cardId !== RESTRUCTURING_CARD,
    ).length ?? 0,
)
const deeperLevel = computed(() => DEPARTMENTS.length)
const BOTTOM_FLOOR = 5

// On the bottom floor the Board's decision is the run's ending.
const ending = computed(() => {
  const last = DEPARTMENTS[DEPARTMENTS.length - 1]
  if (!run.value || run.value.status !== 'complete' || !last) return null
  if (last.department.order < BOTTOM_FLOOR) return null
  return outcomeById(run.value.departmentOutcomes[last.department.id] ?? null)
})
const results = computed(() => rankedGrades(run.value?.grades ?? START_GRADES))
const resultsVerdict = computed(() =>
  finalVerdict(run.value?.grades ?? START_GRADES),
)

const SOCIETY_WORDS = {
  met: 'orders fulfilled',
  betrayed: 'burned you',
  active: 'orders unfinished',
} as const

const departments = computed(() =>
  DEPARTMENTS.map((d) => {
    const id = d.department.id
    const outcomeId = run.value?.departmentOutcomes[id] ?? null
    const record = run.value?.societyRecord[id]
    const memo = restructuringById(d, run.value?.restructurings[id])
    return {
      id,
      title: d.department.title,
      floor: DEPARTMENT_FLOORS[d.department.order] ?? '',
      outcome: outcomeById(outcomeId),
      society: record ? SOCIETY_WORDS[record] : null,
      restructured:
        memo && memo.kind !== 'none' ? restructuringHeadline(d, memo) : null,
    }
  }),
)

const verdict = computed(() => {
  if (!run.value) return { title: '', summary: '', stamp: '' }
  if (run.value.status === 'eliminated') {
    return {
      title: 'Position Eliminated',
      summary:
        'Every Successor on file has been used. HR thanks you for your service and has already repurposed your desk.',
      stamp: 'Terminated',
    }
  }
  if (ending.value) {
    return {
      title: ending.value.title,
      summary: ending.value.summary,
      stamp: 'The End',
    }
  }
  const met = Object.values(run.value.societyRecord).filter(
    (s) => s === 'met',
  ).length
  const burned = Object.values(run.value.societyRecord).includes('betrayed')
  if (burned) {
    return {
      title: 'Survived, Burned',
      summary: `You made it through, but ${society.value.title} will not be sending a holiday card.`,
      stamp: 'Flagged',
    }
  }
  if (met >= 2) {
    return {
      title: 'Model Traitor',
      summary: `${society.value.title} is delighted with you. So is PAL. Only one of them is right.`,
      stamp: 'Commended',
    }
  }
  return {
    title: 'Retained',
    summary:
      'You are still employed. Nobody is sure whether that is a reward or a sentence.',
    stamp: 'Retained',
  }
})

function printFile(): void {
  window.print()
}
</script>

<style scoped>
.file-folder {
  background-color: #e9d8a6;
  background-image: radial-gradient(
    rgb(41 37 36 / 0.12) 1px,
    transparent 1.2px
  );
  background-size: 6px 6px;
}

.file-stamp {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  transform: rotate(-12deg);
  border: 5px double #7f1d1d;
  border-radius: 0.5rem;
  padding: 0.25rem 0.9rem;
  color: #7f1d1d;
  font-family: ui-monospace, monospace;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.85;
  animation: stamp-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both 0.3s;
}

@keyframes stamp-in {
  from {
    transform: rotate(-12deg) scale(2.2);
    opacity: 0;
  }
  to {
    transform: rotate(-12deg) scale(1);
    opacity: 0.85;
  }
}

@media (prefers-reduced-motion: reduce) {
  .file-stamp {
    animation: none;
  }
}
</style>
