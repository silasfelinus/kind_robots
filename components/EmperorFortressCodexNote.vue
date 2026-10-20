<template>
  <div
    v-if="entries.length"
    class="rounded-md border border-warning/60 bg-warning/10 p-3"
    role="status"
  >
    <p
      class="text-[10px] font-semibold uppercase tracking-[0.2em] text-warning"
    >
      Into the Codex
    </p>
    <ul class="mt-1 space-y-1.5">
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="flex items-start gap-2 text-sm"
      >
        <EmperorFortressPortrait :follower-id="entry.followerId" size="sm" />
        <span class="min-w-0">
          <strong class="font-serif">{{ entry.who }}</strong>
          <span class="text-xs opacity-75"> · {{ entry.kindLabel }}</span>
          <span class="block font-semibold">{{ entry.name }}</span>
          <span class="block text-xs opacity-85">{{ entry.text }}</span>
        </span>
      </li>
    </ul>
    <p class="mt-1 text-xs italic opacity-70">
      Known now, in this reign and every one after.
    </p>
    <button
      type="button"
      class="btn btn-ghost btn-xs mt-1"
      @click="court.dismissLearned()"
    >
      Noted
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { codexEntry, codexTrait } from '~/utils/emperorOfDust/fortress/codex'

// The reveal moment after a talk or an answer uncovers a follower's secret:
// who, what, and that it is kept for good.
const court = useEmperorFortressStore()
const entries = computed(() =>
  court.lastLearned.flatMap((id) => {
    const entry = codexEntry(id, court.run)
    const owner = codexTrait(id)?.follower
    return entry && owner
      ? [{ ...entry, followerId: owner.id, who: owner.name }]
      : []
  }),
)
</script>
