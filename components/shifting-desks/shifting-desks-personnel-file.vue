<template>
  <section
    v-if="run"
    class="flex min-h-0 flex-col gap-2"
    aria-labelledby="file-heading"
  >
    <article
      class="file-folder relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl border-4 border-stone-800 p-3 text-stone-900 sm:p-6"
    >
      <div class="shrink-0 pr-28 sm:pr-44">
        <p
          class="truncate font-mono text-[10px] font-black uppercase tracking-[.3em] text-stone-700 sm:text-xs"
        >
          Consolidated Wellness &amp; Defense · Personnel File #4471
          <span v-if="daily" class="text-amber-800">
            · Daily Memo {{ dailyLabel(daily) }}</span
          >
        </p>
        <p
          id="file-heading"
          class="file-title mt-1 font-mono text-2xl font-black uppercase leading-tight sm:text-5xl"
        >
          {{ verdict.title }}
        </p>
        <p
          class="file-summary mt-1 hidden max-w-2xl font-semibold sm:block sm:text-lg"
        >
          {{ verdict.summary }}
        </p>
      </div>
      <span class="file-stamp" aria-hidden="true">{{ verdict.stamp }}</span>
      <div
        v-if="epilogue"
        class="flex h-44 shrink-0 gap-3 overflow-hidden rounded-xl border-2 border-stone-900 bg-stone-900 text-amber-50 sm:h-48 print:h-48"
        aria-label="Your ending reward"
      >
        <shifting-desks-art
          class="w-[38%] shrink-0 overflow-hidden sm:w-[42%]"
          frame="h-full w-full"
          position="object-center"
          :src="stationArt('endings', epilogue.id)"
          :prompt="epilogue.epilogue.art_prompt"
          :alt="`Earned ending art: ${epilogue.title}`"
          fallback-icon="kind-icon:trophy"
          :show-brief="false"
        />
        <div
          class="flex min-w-0 flex-1 flex-col justify-center gap-1 overflow-y-auto py-2 pr-3"
        >
          <p
            class="font-mono text-[10px] font-black uppercase tracking-widest text-amber-300"
          >
            Ending declassified · permanent record
          </p>
          <p class="font-mono text-sm font-black uppercase sm:text-lg">
            {{ epilogue.title }}
          </p>
          <p class="hidden text-xs italic sm:block">
            {{ epilogue.epilogue.title }}
          </p>
          <div
            v-if="ceremonyAward"
            class="flex items-center gap-2 rounded-md border border-amber-300/70 bg-amber-300/10 px-2 py-1"
            :aria-label="`Personnel award: ${ceremonyAward.title}`"
          >
            <icon :name="ceremonyAward.icon" class="size-6 shrink-0 text-amber-300" />
            <div class="min-w-0">
              <p
                v-if="store.newlyEarnedMilestones.length"
                class="font-mono text-[9px] font-black uppercase tracking-widest text-amber-300"
                role="status"
              >
                {{ store.newlyEarnedMilestones.length }} new distinction{{ store.newlyEarnedMilestones.length === 1 ? '' : 's' }} earned
              </p>
              <p v-else class="font-mono text-[9px] uppercase text-amber-200">
                Previously filed distinction
              </p>
              <p class="truncate text-xs font-black">{{ ceremonyAward.title }}</p>
            </div>
          </div>
          <p class="font-mono text-[10px] text-amber-50/85">
            {{ Object.keys(run.departmentOutcomes).length }} departments ·
            {{ filesHandled }} files · {{ run.generation + 1 }} employees ·
            {{ run.meters.forms }} forms
          </p>
          <p class="hidden truncate font-mono text-[10px] text-amber-50/80 sm:block">
            {{ jobTitle }} · {{ society.title }} · {{ mutation.title }}
          </p>
          <p v-if="nextMilestone" class="truncate text-[10px] text-amber-200">
            Next: {{ nextMilestone.title }} · {{ nextMilestoneProgress }}/{{ nextMilestone.target }}
          </p>
          <button
            type="button"
            class="btn btn-warning btn-xs mt-1 self-start print:hidden sm:btn-sm"
            @click="emit('archive')"
          >
            <icon name="kind-icon:trophy" class="size-3.5" />
            {{
              store.newlyEarnedMilestones.includes('first-ending')
                ? 'Personnel Archive unlocked'
                : 'View earned milestones'
            }}
          </button>
        </div>
      </div>

      <div
        class="flex shrink-0 gap-1 overflow-x-auto rounded-xl bg-stone-900/10 p-1 print:hidden"
        role="tablist"
        aria-label="Personnel file sections"
      >
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="tab === t.id"
          class="flex-1 whitespace-nowrap rounded-lg px-2 py-1 font-mono text-[11px] font-black uppercase tracking-wider sm:text-xs"
          :class="tab === t.id ? 'bg-stone-900 text-amber-50' : ''"
          @click="tab = t.id"
        >
          {{ t.title }}
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto print:overflow-visible">
        <div
          role="tabpanel"
          aria-label="Verdict"
          class="flex-col gap-2"
          :class="tab === 'verdict' ? 'flex' : 'hidden print:flex'"
        >
          <p class="text-sm font-semibold sm:hidden">{{ verdict.summary }}</p>
          <article
            v-if="epilogue"
            class="flex gap-3 rounded-xl border-2 border-stone-800 bg-stone-50/70 p-2 sm:p-3"
            aria-label="Epilogue"
          >
            <shifting-desks-art
              class="epilogue-art w-[26%] max-w-[13rem] shrink-0 self-start rounded-lg"
              frame="aspect-[2/3]"
              :src="stationArt('endings', epilogue.id)"
              :prompt="epilogue.epilogue.art_prompt"
              :alt="`Epilogue: ${epilogue.epilogue.title}`"
              fallback-icon="kind-icon:document"
              icon-size="3rem"
            />
            <div class="flex min-w-0 flex-1 flex-col gap-1 sm:gap-2">
              <p
                class="font-mono text-[11px] font-black uppercase tracking-widest opacity-80"
              >
                Epilogue · {{ epilogue.title }}
              </p>
              <p class="font-mono text-base font-black uppercase sm:text-xl">
                {{ epilogue.epilogue.title }}
              </p>
              <p class="text-xs leading-relaxed sm:text-sm">
                {{ epilogue.epilogue.text }}
              </p>
              <p
                v-for="(line, i) in epilogueLines"
                :key="i"
                class="text-xs italic sm:text-sm"
              >
                {{ line }}
              </p>
            </div>
          </article>
          <p
            v-if="run.status === 'complete' && !ending"
            class="rounded-xl border border-warning/50 bg-base-200 p-3 text-sm text-base-content"
          >
            The elevator chimes again. Level −{{ deeperLevel }} is still being
            restructured. PAL promises it will open soon, and that you will love
            it.
          </p>
          <p
            v-if="ending"
            class="hidden rounded-xl border border-warning/50 bg-base-200 p-3 text-sm text-base-content sm:block"
          >
            The Board has decided, and this is one of its endings. The others
            are still on the table, and so, technically, are you. PAL has kept
            your Successors warm.
          </p>
        </div>

        <div
          role="tabpanel"
          aria-label="Departments"
          class="grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-2"
          :class="tab === 'departments' ? 'grid' : 'hidden print:grid'"
        >
          <div
            v-for="dept in departments"
            :key="dept.id"
            class="rounded-xl border-2 border-stone-800 bg-stone-50/70 p-2"
          >
            <p
              class="font-mono text-[11px] font-black uppercase tracking-widest opacity-70"
            >
              {{ dept.floor }} · {{ dept.title }}
            </p>
            <p class="font-mono text-base font-black uppercase">
              {{ dept.outcome?.title ?? 'Not reached' }}
            </p>
            <p v-if="dept.outcome" class="text-sm">
              {{ dept.outcome.summary }}
            </p>
            <p v-if="dept.society" class="mt-1 text-xs font-bold uppercase">
              Society: {{ dept.society }}
            </p>
            <p v-if="dept.restructured" class="mt-1 text-xs italic">
              Restructured on arrival: {{ dept.restructured }}
            </p>
          </div>
        </div>

        <div
          role="tabpanel"
          aria-label="Test Results"
          :class="tab === 'results' ? 'block' : 'hidden print:block'"
        >
          <shifting-desks-test-results
            final
            :readings="results"
            :verdict="resultsVerdict"
          />
        </div>

        <div
          role="tabpanel"
          aria-label="Record"
          class="flex-col gap-3"
          :class="tab === 'record' ? 'flex' : 'hidden print:flex'"
        >
          <dl
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] gap-2 text-sm"
          >
            <div>
              <dt class="text-xs font-bold uppercase opacity-70">Job title</dt>
              <dd class="font-semibold">{{ jobTitle }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase opacity-70">
                Secret society
              </dt>
              <dd class="font-semibold">{{ society.title }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase opacity-70">Mutation</dt>
              <dd class="font-semibold">{{ mutation.title }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase opacity-70">
                Employees used
              </dt>
              <dd class="font-semibold">{{ run.generation + 1 }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase opacity-70">
                Successors on file
              </dt>
              <dd class="font-semibold">{{ run.meters.successors }}</dd>
            </div>
            <div>
              <dt class="text-xs font-bold uppercase opacity-70">
                Files handled
              </dt>
              <dd class="font-semibold">{{ filesHandled }}</dd>
            </div>
          </dl>
          <div v-if="run.terminations.length">
            <p class="font-mono text-xs font-black uppercase tracking-widest">
              Causes of termination
            </p>
            <ul class="mt-1 flex flex-col gap-1 text-sm">
              <li v-for="(t, i) in run.terminations" :key="i">
                <span class="font-mono font-bold">{{ t.employee }}</span
                >:
                {{ t.cause }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </article>

    <div
      class="flex shrink-0 flex-wrap gap-2 rounded-2xl bg-base-100/95 p-2 print:hidden"
    >
      <button
        type="button"
        class="btn btn-warning btn-sm sm:btn-md"
        @click="emit('again')"
      >
        <icon name="kind-icon:refresh" size="1rem" /> New Wellness Weekend
      </button>
      <button
        v-if="daily"
        type="button"
        class="btn btn-outline btn-sm sm:btn-md"
        @click="shareDaily"
      >
        <icon name="kind-icon:copy" size="1rem" />
        {{ shared ? 'Copied' : "Share today's memo" }}
      </button>
      <button
        type="button"
        class="btn btn-outline btn-sm max-sm:hidden sm:btn-md"
        @click="printFile"
      >
        <icon name="kind-icon:document" size="1rem" /> Print your file
      </button>
      <button
        v-if="store.archiveUnlocked"
        type="button"
        class="btn btn-outline btn-sm sm:btn-md"
        @click="emit('archive')"
      >
        <icon name="kind-icon:trophy" size="1rem" /> Personnel Archive
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm sm:btn-md"
        @click="emit('front')"
      >
        Front desk
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DEPARTMENTS,
  DEPARTMENT_FLOORS,
  jobById,
  mutationById,
  finalVerdict,
  endingFor,
  endingLines,
  stationArt,
  outcomeById,
  RESTRUCTURING_CARD,
  restructuringById,
  restructuringHeadline,
  rankedGrades,
  societyById,
  START_GRADES,
} from '~/utils/shiftingDesks/rules'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'
import { MILESTONES } from '~/utils/shiftingDesks/rewards'
import {
  dailyDateOf,
  dailyLabel,
  dailyShareText,
} from '~/utils/shiftingDesks/daily'

const emit = defineEmits<{ again: []; front: []; archive: [] }>()
const tab = ref<'verdict' | 'departments' | 'results' | 'record'>('verdict')
const tabs = [
  { id: 'verdict', title: 'Verdict' },
  { id: 'departments', title: 'Departments' },
  { id: 'results', title: 'Test Results' },
  { id: 'record', title: 'Record' },
] as const
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
const ceremonyAward = computed(
  () =>
    MILESTONES.find((m) => store.newlyEarnedMilestones.includes(m.id)) ??
    MILESTONES.find((m) => !!store.rewardArchive.milestones[m.id]) ??
    null,
)
const nextMilestone = computed(
  () =>
    MILESTONES.filter((m) =>
      ['forms-25', 'three-endings', 'five-departments', 'exceptional-empathy'].includes(m.id),
    ).find((m) => !store.rewardArchive.milestones[m.id]) ?? null,
)
const nextMilestoneProgress = computed(() =>
  nextMilestone.value
    ? Math.min(nextMilestone.value.target, nextMilestone.value.value(store.rewardArchive, store.endingsFound))
    : 0,
)
const deeperLevel = computed(() => DEPARTMENTS.length)
const BOTTOM_FLOOR = 5
const epilogue = computed(() => (run.value ? endingFor(run.value) : null))
const epilogueLines = computed(() =>
  run.value && epilogue.value ? endingLines(run.value, epilogue.value) : [],
)

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

const daily = computed(() => dailyDateOf(run.value?.seed))
const shared = ref(false)

// The Daily Memo result: the native share sheet where there is one (phones,
// tablets), otherwise the clipboard.
async function shareDaily(): Promise<void> {
  if (!run.value || !daily.value) return
  const text = dailyShareText({
    key: daily.value,
    title: verdict.value.title,
    successor: run.value.generation + 1,
    files: filesHandled.value,
    verdict: resultsVerdict.value.title,
  })
  try {
    if (navigator.share) await navigator.share({ text })
    else await navigator.clipboard.writeText(text)
    shared.value = true
  } catch {
    // A dismissed share sheet is not an error worth surfacing.
  }
}

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
  z-index: 1;
  top: 1rem;
  right: 1rem;
  transform: rotate(-12deg);
  border: 5px double #7f1d1d;
  border-radius: 0.5rem;
  padding: 0.25rem 0.9rem;
  color: #7f1d1d;
  font-family: ui-monospace, monospace;
  font-size: clamp(0.75rem, 2.4vw, 1.1rem);
  font-weight: 900;
  letter-spacing: 0.15em;
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

/* Short screens (a landscape tablet) keep the verdict readable without the
   tab panel scrolling: a smaller headline and summary (2026-10-16). */
@media (min-width: 640px) and (max-height: 820px) {
  .file-folder {
    padding: 1rem;
  }

  .file-title {
    font-size: 1.875rem;
    line-height: 2.25rem;
  }

  .file-summary {
    font-size: 1rem;
    line-height: 1.4rem;
  }

  .epilogue-art {
    width: 7.5rem;
  }
}
</style>
