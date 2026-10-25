<template>
  <section
    v-if="run"
    class="kr-panes grid-cols-1 gap-3 @3xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]"
    aria-label="Case board"
  >
    <div class="kr-pane cs-frame">
      <div class="kr-pane-scroll space-y-3 p-3">
        <crystal-street-art
          class="rounded-xl"
          frame="aspect-[3/4]"
          :kind="run.revealed ? 'villain' : 'night'"
          :seed="run.revealed ? villain.id : 'unknown'"
          :src="
            run.revealed
              ? `/crystal-street/villains/${villain.id}-poster.webp`
              : ''
          "
          :palette="run.revealed ? villain.palette : []"
          :sigil="run.revealed ? villain.sigil : '?'"
          :alt="
            run.revealed
              ? villain.poster
              : 'Something is waking under Crystal Street'
          "
        />
        <template v-if="run.revealed">
          <h2 class="cs-display text-2xl leading-tight">{{ villain.name }}</h2>
          <p class="cs-kicker">{{ villain.epithet }}</p>
          <p class="text-sm">{{ villain.logline }}</p>
          <p class="cs-quote">“{{ taunt }}”</p>
          <p class="flex flex-wrap gap-1">
            <span v-for="t in villain.tags" :key="t" class="cs-pill">{{
              TAG_LABELS[t]
            }}</span>
          </p>
        </template>
        <template v-else>
          <h2 class="cs-display text-2xl">Something is waking</h2>
          <p class="text-sm opacity-80">
            Nobody knows what is coming yet. Get ready by day: make friends,
            train, gear up. The nightmare shows itself on the first night.
          </p>
        </template>
      </div>
    </div>
    <div class="kr-pane cs-frame">
      <div class="kr-pane-scroll space-y-3 p-3">
        <h2 class="cs-display text-xl">Leads {{ run.clues.length }}/3</h2>
        <ul class="grid gap-2">
          <li
            v-for="lead in leads"
            :key="lead.id"
            class="cs-card p-3"
            :class="lead.found ? 'border-success' : ''"
          >
            <p class="cs-label uppercase tracking-wider opacity-70">
              {{ locationById(lead.location)?.name }}
            </p>
            <p class="font-semibold">
              {{ run.revealed ? lead.title : 'Unknown lead' }}
              <span v-if="lead.found" class="cs-pill cs-pill-good ml-1"
                >Found</span
              >
            </p>
            <p v-if="run.revealed" class="text-sm opacity-85">
              {{ lead.hint }}
            </p>
          </li>
        </ul>
        <div v-if="run.revealed" class="cs-card space-y-2 p-3">
          <p class="cs-kicker">
            {{ KIND_LABELS[villain.inspiration.kind] }}
            {{ villain.inspiration.original }} ·
            {{ villain.inspiration.film }} ({{ villain.inspiration.year }})
          </p>
          <p class="text-sm">
            <strong>The old script.</strong> {{ villain.inspiration.oldScript }}
          </p>
          <p class="text-sm">
            <strong>The new lens.</strong> {{ villain.inspiration.newLens }}
          </p>
        </div>
        <div v-if="run.revealed" class="cs-card p-3">
          <p class="cs-kicker">The heart of it</p>
          <template v-if="run.clues.length >= 3">
            <p class="font-semibold">{{ villain.centralIssue.title }}</p>
            <p class="text-sm">{{ villain.centralIssue.summary }}</p>
          </template>
          <p v-else class="text-sm opacity-80">
            Find all three leads to understand what this nightmare really wants.
            Only then can you reach its heart on Halloween.
          </p>
        </div>
        <p class="text-xs opacity-75">
          Best ending: reach the heart on Halloween with all three leads and at
          least {{ BEST_WINS }} night wins this week (you have {{ run.wins }}).
        </p>
        <p class="text-xs opacity-75" data-testid="cs-case-edges">
          Edges for Halloween:
          {{
            edges.length
              ? edges.map((n) => `Act ${['I', 'II', 'III'][n - 1]}`).join(', ')
              : 'none yet'
          }}. Each act where you beat one of the nightmare's own cards adds +1
          to every Halloween roll and can open a straighter way through.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  BEST_WINS,
  TAG_LABELS,
  caseBoard,
  edgesOf,
  locationById,
  villainOf,
} from '~/utils/crystalStreet/rules'

const KIND_LABELS = {
  flip: 'Gender flip of',
  bend: 'Gender-bent',
  remix: 'Remix of',
} as const
const store = useCrystalStreetStore()
const run = computed(() => store.run)
const villain = computed(() => villainOf(store.run!))
const edges = computed(() => (store.run ? edgesOf(store.run) : []))
const leads = computed(() => (store.run ? caseBoard(store.run) : []))
const taunt = computed(
  () =>
    villain.value.taunts[(store.run?.day ?? 1) % villain.value.taunts.length],
)
</script>
