<template>
  <section
    class="flex flex-col gap-2"
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
          class="mt-1 flex list-decimal flex-col gap-0.5 pl-5 text-xs sm:text-sm"
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
        <p class="font-mono text-base font-black uppercase">
          {{ applicant.name }}
        </p>
        <p class="text-xs font-semibold sm:mt-1 sm:text-sm">
          {{ applicant.request }}
        </p>
        <dl
          class="mt-1 flex flex-col gap-0.5 text-xs sm:mt-2 sm:gap-1 sm:text-sm"
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
      class="font-mono text-xs font-black uppercase tracking-widest opacity-70"
    >
      Check the papers against the memo, then stamp
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="stamp in stamps"
        :key="stamp.id"
        type="button"
        class="window-stamp flex min-w-[min(100%,10rem)] flex-1 flex-col gap-0.5 rounded-2xl border-4 bg-base-100 px-3 py-2 text-left transition"
        :class="stamp.id === 'approve' ? 'is-approve' : 'is-deny'"
        @click="emit('stamp', stamp)"
      >
        <span class="window-stamp-face font-mono text-lg font-black uppercase">
          {{ stamp.id === 'approve' ? 'Approved' : 'Denied' }}
        </span>
        <span class="text-xs opacity-80">{{ stamp.intent }}</span>
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

.window-stamp:hover,
.window-stamp:focus-visible {
  transform: rotate(-1deg) scale(1.01);
}

@media (prefers-reduced-motion: reduce) {
  .window-stamp {
    transition: none;
  }

  .window-stamp:hover,
  .window-stamp:focus-visible {
    transform: none;
  }
}
</style>
