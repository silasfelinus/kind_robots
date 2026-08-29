<!-- /components/home/home-attention.vue -->
<!--
  The things waiting on Silas.

  Silas, 2026-08-29: "Dream entry should take up less horizontal space to leave
  room for a vertical notification scroll, especially things that I can answer
  that are human gated."

  NOTHING NEW WAS BUILT FOR THIS. conductorStore already computes `humanGates` --
  every conductor task at `status: needs-human`, filtered to active and
  continuous projects and sorted -- and conductorCards.ts already labels that
  status "Needs You". It simply had no surface: grepping components for it
  returned nothing before this file. The home page is the first place these are
  visible without going looking, which is the whole complaint the redesign
  started from.

  LINKS, NOT INLINE APPROVE. /api/conductor/task-action takes approve, reject
  and comment, so answering from here is possible and is the obvious next step.
  It is deliberately not in this pass: approving writes to the coordination
  system of record, and this sandbox has no database or live conductor data to
  test that against. Shipping an untested one-click approve on a gate is a worse
  outcome than one more click. Each row goes to /conductor with the project
  open, where the existing controls live.

  ADMIN-ONLY BY DATA, not by a check here: conductorStore only has gates when
  the projection is readable, so a signed-out visitor sees the empty branch and
  the column collapses out of the layout entirely.
-->
<template>
  <section
    v-if="gates.length || isLoading"
    class="flex min-h-0 flex-col gap-1 kr-panel-flat p-2 lg:w-64 lg:shrink-0"
  >
    <header class="flex shrink-0 items-baseline justify-between gap-2">
      <h2
        class="text-[0.7rem] font-black uppercase tracking-[0.16em] text-primary"
      >
        Needs you
        <span v-if="gates.length" class="text-base-content/40"
          >· {{ gates.length }}</span
        >
      </h2>

      <NuxtLink
        to="/conductor"
        class="link link-hover text-[0.7rem] font-bold text-base-content/50 hover:text-primary"
      >
        conductor →
      </NuxtLink>
    </header>

    <!--
      A bounded scroller, not an unbounded list: the gate count is unpredictable
      (it has been twenty-plus) and this sits beside a fixed-height hero. The
      layout contract's one-scroll rule deliberately does not count a `max-h-*`
      region -- nested preview, not the page's scroll owner.
    -->
    <div
      class="max-h-56 min-h-0 space-y-1 overflow-y-auto overscroll-contain pr-1"
    >
      <NuxtLink
        v-for="gate in gates"
        :key="`${gate.project.slug}-${gate.task.id}`"
        :to="`/conductor?project=${encodeURIComponent(gate.project.slug)}`"
        class="group block rounded-lg border border-base-300 bg-base-100 px-2 py-1.5 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        :title="gate.task.title"
      >
        <p
          class="truncate text-[0.6rem] font-black uppercase tracking-[0.12em] text-primary"
        >
          {{ gate.project.name || gate.project.slug }}
        </p>
        <p
          class="line-clamp-2 text-[0.7rem] font-bold leading-snug text-base-content group-hover:text-primary"
        >
          {{ gate.task.title }}
        </p>
      </NuxtLink>

      <p
        v-if="isLoading && !gates.length"
        class="px-1 py-2 text-[0.7rem] text-base-content/50"
      >
        Checking what's waiting…
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useConductorStore } from '@/stores/conductorStore'

const conductorStore = useConductorStore()

const gates = computed(() => conductorStore.humanGates)
const isLoading = computed(() => !conductorStore.hasLoaded)

onMounted(() => {
  /*
   * fetchProjects is cached in the store (FRESH_DATA_MS), so this is a no-op
   * when anything else on the session has already asked.
   */
  void conductorStore.fetchProjects()
})
</script>
