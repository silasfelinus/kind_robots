<template>
  <div
    class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] gap-3 @5xl:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)] @5xl:gap-4"
  >
    <header
      class="flex flex-wrap items-end justify-between gap-2 @5xl:col-span-2"
    >
      <div>
        <p class="pf-kicker text-secondary">Gestation</p>
        <p class="pf-display mt-1 text-2xl @3xl:text-4xl">
          Concepts growing day by day
        </p>
      </div>
      <p class="max-w-md text-xs leading-snug opacity-70">
        The daily playbook challenge writes three pitches every Pacific day,
        building on what came before. Notes you leave here are answered first by
        the next day’s development. Nothing here is approved until you say so.
      </p>
    </header>

    <p
      v-if="forge.gestationLoading && !forge.gestation"
      class="text-sm opacity-70"
    >
      Reading the dockets from Conductor…
    </p>
    <p v-else-if="forge.gestationError" class="text-sm text-warning">
      Could not read the dockets: {{ forge.gestationError }}
      <button
        type="button"
        class="ml-2 underline"
        @click="forge.loadGestation()"
      >
        Try again
      </button>
    </p>
    <p
      v-else-if="forge.gestation && !forge.gestation.length"
      class="text-sm opacity-70"
    >
      No dockets yet. The daily challenge writes its first three pitches to
      Conductor’s pitches/playbook-challenges.
    </p>

    <template v-else-if="forge.gestation">
      <ul
        class="kr-scroll -mx-1 flex min-h-0 flex-col gap-1.5 px-1 py-1"
        aria-label="Concepts"
        :class="mobileDetail ? 'hidden @5xl:flex' : ''"
      >
        <li v-for="(item, i) in forge.gestation" :key="item.conceptId">
          <button
            type="button"
            data-nav
            :data-autofocus="i === 0 ? '' : undefined"
            class="pf-row pf-focusable"
            :class="
              forge.gestationFocused?.conceptId === item.conceptId
                ? 'pf-row-on'
                : ''
            "
            @click="select(item.conceptId)"
            @focus="forge.gestationId = item.conceptId"
          >
            <span class="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
              <span class="pf-label truncate text-sm">{{ item.title }}</span>
              <span class="truncate text-[0.7rem] opacity-70">{{
                item.latest.genrePillar || 'Genre to come'
              }}</span>
            </span>
            <span class="flex shrink-0 flex-col items-end gap-0.5">
              <span
                class="pf-kicker text-[0.55rem]"
                :class="statusClass(item.status)"
                >{{ item.status }}</span
              >
              <span class="text-[0.65rem] tabular-nums opacity-70"
                >{{ item.versions.length }}
                {{ item.versions.length === 1 ? 'version' : 'versions' }}
                <template v-if="openNotes(item)">
                  · {{ openNotes(item) }} note{{
                    openNotes(item) === 1 ? '' : 's'
                  }}
                </template></span
              >
            </span>
          </button>
        </li>
      </ul>

      <PlaybookForgeGestationConcept
        v-if="forge.gestationFocused"
        :class="mobileDetail ? '' : 'hidden @5xl:flex'"
        @back="mobileDetail = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import type { GestationConcept } from '~/utils/playbookForge/gestation'

// Gestation: the daily playbook challenge's concepts, their lineage and
// editorial memory, with Silas's notes for the next development. The list is
// here; the focused concept is playbook-forge-gestation-concept.

const forge = usePlaybookForgeStore()
const mobileDetail = ref(false)

onMounted(() => {
  if (!forge.gestation) void forge.loadGestation()
})

function select(id: string) {
  forge.gestationId = id
  mobileDetail.value = true
}

function openNotes(c: GestationConcept) {
  return c.notes.filter((n) => n.status === 'open').length
}

function statusClass(status: string) {
  return status === 'promising' || status === 'approved'
    ? 'text-success'
    : status === 'rejected' || status === 'parked'
      ? 'opacity-50'
      : 'text-secondary'
}
</script>
