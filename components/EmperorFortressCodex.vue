<template>
  <section class="@container kr-panel space-y-3 p-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="font-serif text-2xl font-bold">The Codex</h2>
      <p class="text-xs font-semibold uppercase tracking-widest text-warning">
        {{ codex.revealed.length }} of {{ CODEX_SIZE }} secrets
      </p>
    </div>
    <p class="text-xs opacity-70">
      What you learn about your people stays learned. Across every reign, every
      rewind. Brass, gear and loyalties start over. This does not.
    </p>
    <p v-if="!pages.length" class="font-serif text-sm italic opacity-80">
      Nothing yet. Everyone keeps something back. Send them out, sit with them,
      and it comes loose.
    </p>
    <ul class="grid gap-2 @2xl:grid-cols-2">
      <li
        v-for="page in pages"
        :key="page.follower.id"
        class="rounded-xl border border-base-content/15 bg-base-100 p-3"
      >
        <p class="flex items-center gap-2">
          <EmperorFortressPortrait :follower-id="page.follower.id" size="sm" />
          <strong class="font-serif text-lg">{{ page.follower.name }}</strong>
          <span v-if="page.unknown" class="ml-auto text-xs opacity-60"
            >{{ page.unknown }} still hidden</span
          >
        </p>
        <ul class="mt-2 space-y-1.5 text-sm">
          <li
            v-for="entry in page.entries"
            :key="entry.id"
            class="border-l-2 pl-2"
            :class="
              entry.kind === 'allegiance'
                ? 'border-info'
                : entry.amount < 0
                  ? 'border-error'
                  : 'border-success'
            "
          >
            <span
              class="text-[10px] font-semibold uppercase tracking-widest opacity-70"
              >{{ entry.kindLabel }}</span
            >
            <strong class="block">{{ entry.name }}</strong>
            <span class="block text-xs opacity-85">{{ entry.text }}</span>
            <span class="block text-[11px] italic opacity-60">{{
              entry.how
            }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { CODEX_SIZE, codexPages } from '~/utils/emperorOfDust/fortress/codex'

// The persistent Codex (conductor SYSTEMS-V03.md, "Cross-run memory").
const court = useEmperorFortressStore()
const codex = computed(() => court.codex)
const pages = computed(() => codexPages(court.codex, court.run))
</script>
