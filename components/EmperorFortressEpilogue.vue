<template>
  <section
    v-if="entries.length"
    class="space-y-3"
    aria-label="Afterwards: what became of them"
  >
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-semibold uppercase tracking-widest text-warning">
        Afterwards
      </p>
      <button
        type="button"
        class="btn btn-ghost btn-xs"
        :aria-pressed="showAll"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'One at a time' : 'Read all' }}
      </button>
    </div>

    <ul v-if="showAll" class="space-y-3">
      <li
        v-for="entry in entries"
        :key="entry.subject.id"
        class="flex gap-3 rounded-xl border border-warning/25 bg-base-200/60 p-3"
      >
        <span
          v-if="artFor(entry)"
          class="h-16 w-14 shrink-0 overflow-hidden rounded-md border border-warning/40 bg-base-300"
        >
          <img
            :src="artFor(entry)"
            alt=""
            class="h-full w-full object-cover object-top"
          />
        </span>
        <span class="min-w-0">
          <strong class="block font-serif text-base text-warning">{{
            entry.subject.name
          }}</strong>
          <span class="block font-serif text-sm italic">{{
            entry.variant.text
          }}</span>
        </span>
      </li>
    </ul>

    <figure
      v-else-if="current"
      class="grid gap-3 rounded-xl border border-warning/30 bg-base-200/60 p-3"
      :class="
        artFor(current)
          ? '@md:grid-cols-[minmax(8rem,12rem)_minmax(0,1fr)]'
          : 'min-h-40'
      "
    >
      <span
        v-if="artFor(current)"
        class="mx-auto block h-48 w-36 overflow-hidden rounded-lg border border-warning/40 bg-base-300 @md:h-56 @md:w-full"
      >
        <img
          :key="current.subject.id"
          :src="artFor(current)"
          :alt="current.subject.name"
          class="h-full w-full object-cover object-top"
        />
      </span>
      <figcaption class="flex min-w-0 flex-col gap-2">
        <strong class="font-serif text-xl text-warning">{{
          current.subject.name
        }}</strong>
        <p
          class="font-serif text-base italic leading-relaxed"
          aria-live="polite"
        >
          {{ current.variant.text }}
        </p>
        <div class="mt-auto flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="index === 0"
            @click="index -= 1"
          >
            ◂ Before
          </button>
          <span class="text-xs opacity-70"
            >{{ index + 1 }} / {{ entries.length }}</span
          >
          <button
            type="button"
            class="eod-finish px-4 py-1.5 text-sm"
            :disabled="index >= entries.length - 1"
            @click="index += 1"
          >
            After ▸
          </button>
        </div>
      </figcaption>
    </figure>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  followerPortrait,
  illustration,
} from '~/utils/emperorOfDust/fortress/castArt'
import type { EndingId } from '~/utils/emperorOfDust/fortress/endings'
import { epilogueFor } from '~/utils/emperorOfDust/fortress/epilogue'
import type { EpilogueEntry } from '~/utils/emperorOfDust/fortress/epilogue'
import type { FortressRun } from '~/utils/emperorOfDust/fortress/types'

const props = defineProps<{ run: FortressRun; ending: EndingId }>()
const index = ref(0)
const showAll = ref(false)
const entries = computed(() => epilogueFor(props.run, props.ending))
const current = computed(() => entries.value[index.value])
watch(entries, () => (index.value = 0))

function artFor(entry: EpilogueEntry): string | undefined {
  const { subject, variant } = entry
  if (subject.follower) {
    const dead = props.run.roster.some(
      (state) => state.id === subject.follower && state.dead,
    )
    return dead
      ? followerPortrait(subject.follower, 'dead')
      : (illustration('followers', subject.follower, variant.mood) ??
          followerPortrait(subject.follower))
  }
  return subject.npc
    ? illustration('npcs', subject.npc, variant.mood)
    : undefined
}
</script>
