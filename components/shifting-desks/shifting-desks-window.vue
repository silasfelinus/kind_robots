<template>
  <section
    class="flex grow flex-col gap-1.5 sm:gap-2 lg:gap-3"
    :aria-label="`${shift.title}, applicant ${index + 1} of ${shift.applicants.length}`"
  >
    <div class="flex flex-wrap gap-2">
      <aside
        class="window-memo min-w-[min(100%,14rem)] flex-1 rounded-2xl border-2 border-stone-800 p-3 text-stone-900"
        aria-label="Today's memo"
      >
        <p
          class="font-mono text-[11px] font-black uppercase tracking-[.25em] text-stone-700"
        >
          PAL · Window memo
        </p>
        <p class="font-mono text-sm font-black uppercase">
          {{ shift.memo.title }}
        </p>
        <ol
          class="mt-1 flex list-decimal flex-col gap-0.5 pl-5 text-xs sm:text-sm lg:text-base"
        >
          <li v-for="rule in shift.memo.rules" :key="rule.id">
            {{ rule.text }}
          </li>
        </ol>
      </aside>

      <article
        class="window-papers min-w-[min(100%,16rem)] flex-[1.4] rounded-2xl border-2 border-stone-800 p-3 text-stone-900"
        aria-label="Applicant's papers"
      >
        <p
          class="font-mono text-[11px] font-black uppercase tracking-[.25em] text-stone-700"
        >
          Applicant {{ index + 1 }} of {{ shift.applicants.length }}
        </p>
        <p class="font-mono text-base font-black uppercase lg:text-xl">
          {{ applicant.name }}
        </p>
        <p class="text-xs font-semibold sm:mt-1 sm:text-sm lg:text-base">
          {{ applicant.request }}
        </p>
        <dl
          class="mt-1 flex flex-col gap-0.5 text-xs sm:mt-2 sm:gap-1 sm:text-sm lg:text-base"
        >
          <div
            v-for="doc in applicant.documents"
            :key="doc.label"
            class="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-dashed border-stone-500 pb-1"
          >
            <dt class="font-mono text-xs font-bold uppercase">
              {{ doc.label }}
            </dt>
            <dd class="text-right">{{ doc.value }}</dd>
          </div>
        </dl>
      </article>
    </div>

    <p
      class="hidden self-start rounded-lg bg-base-100/95 px-2 py-0.5 font-mono text-xs font-black uppercase tracking-widest text-base-content/80 sm:block"
    >
      Check the papers against the memo, then stamp
    </p>
    <div class="flex grow flex-wrap gap-2 lg:gap-3">
      <button
        v-for="stamp in stamps"
        :key="stamp.id"
        type="button"
        class="window-stamp flex min-w-[min(100%,10rem)] flex-1 flex-col justify-center gap-0.5 rounded-2xl border-4 bg-base-100 px-3 py-1.5 text-left transition sm:gap-1 sm:py-2 lg:px-5 lg:py-4"
        :class="stamp.id === 'approve' ? 'is-approve' : 'is-deny'"
        @click="emit('stamp', stamp)"
      >
        <span
          class="window-stamp-face font-mono text-lg font-black uppercase md:text-2xl lg:text-3xl"
        >
          {{ stampFace(stamp) }}
        </span>
        <span class="text-xs opacity-80 md:text-sm lg:text-base">{{
          stamp.intent
        }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  Choice,
  WindowApplicant,
  WindowShift,
} from '~/utils/shiftingDesks/rules'

const props = defineProps<{
  shift: WindowShift
  applicant: WindowApplicant
  index: number
}>()
const emit = defineEmits<{ stamp: [choice: Choice] }>()

// The memo decides what PAL expects; the stamps only show their temptation,
// never the audit hint, so reading the papers is the whole job.
// Each desk names its own stamps ("Stamp APPROVED", "Stamp SAFE"); the face
// shows the word on the rubber.
function stampFace(stamp: Choice): string {
  return stamp.label.replace(/^Stamp\s+/i, '')
}

const stamps = computed(() =>
  ['approve', 'deny']
    .map((id) => props.applicant.choices.find((c) => c.id === id))
    .filter((c): c is Choice => !!c),
)
</script>

<style scoped>
.window-memo {
  background-color: #f1e6c4;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0 1.45rem,
    rgb(41 37 36 / 0.12) 1.45rem 1.5rem
  );
}

.window-papers {
  background-color: #e9d8a6;
}

.window-stamp.is-approve {
  border-color: #15803d;
}

.window-stamp.is-deny {
  border-color: #b91c1c;
}

.window-stamp.is-approve .window-stamp-face {
  color: #15803d;
}

.window-stamp.is-deny .window-stamp-face {
  color: #b91c1c;
}

.window-stamp.is-approve:hover,
.window-stamp.is-approve:focus-visible {
  box-shadow: inset 0 0 0 3px #15803d;
}

.window-stamp.is-deny:hover,
.window-stamp.is-deny:focus-visible {
  box-shadow: inset 0 0 0 3px #b91c1c;
}

@media (prefers-reduced-motion: reduce) {
  .window-stamp {
    transition: none;
  }
}
</style>
