<template>
  <section class="@container kr-panel space-y-3 p-4" aria-label="Ending archive">
    <header class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-warning">
          Chronicle of Ash
        </p>
        <h2 class="font-serif text-2xl font-bold">The Eight Fates</h2>
      </div>
      <strong class="font-serif text-lg text-warning" aria-live="polite">
        {{ found.length }} / {{ endings.length }} discovered
      </strong>
    </header>
    <div class="grid gap-3 @md:grid-cols-2 @4xl:grid-cols-4">
      <button
        v-for="ending in endings"
        :key="ending.id"
        type="button"
        class="group min-w-0 overflow-hidden rounded-xl border bg-base-200 text-left transition-colors disabled:cursor-default"
        :class="
          selected === ending.id
            ? 'border-warning bg-warning/10'
            : 'border-warning/20 hover:border-warning/60'
        "
        :disabled="!unlocked(ending.id)"
        :aria-pressed="unlocked(ending.id) ? selected === ending.id : undefined"
        :aria-label="
          unlocked(ending.id)
            ? `Read ${ending.title} reigns`
            : 'An undiscovered ending'
        "
        @click="selected = ending.id"
      >
        <EmperorFortressEndingPlate
          :ending-id="ending.id"
          :locked="!unlocked(ending.id)"
          class="rounded-none border-0"
        />
        <span class="block p-2">
          <strong class="block truncate font-serif text-base">
            {{ unlocked(ending.id) ? ending.title : 'An unknown fate' }}
          </strong>
          <span class="text-xs opacity-70">
            {{
              unlocked(ending.id)
                ? `${reignsFor(ending.id)} reign(s) remembered`
                : 'Unclaimed'
            }}
          </span>
        </span>
      </button>
    </div>
    <article
      v-if="chosen"
      class="space-y-3 rounded-xl border border-warning/30 bg-base-200/70 p-3"
    >
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-serif text-xl font-bold text-warning">
            {{ chosen.title }}
          </h3>
          <p class="mt-1 text-sm italic">{{ chosen.text }}</p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          aria-label="Close ending details"
          @click="selected = null"
        >
          Close
        </button>
      </div>
      <p v-if="!matching.length" class="text-sm opacity-75">
        This fate was remembered before detailed reign records began.
      </p>
      <details
        v-for="memory in matching"
        :key="memory.key"
        class="rounded-lg border border-warning/20 bg-base-100/80 p-3"
      >
        <summary class="cursor-pointer font-serif font-semibold">
          {{ new Date(memory.completedAt).toLocaleDateString() }}
          · {{ memory.brass }} brass · {{ memory.followers }} at court
        </summary>
        <div class="mt-3 space-y-2 text-sm">
          <p>
            {{ memory.cryptSealed ? 'Crypt sealed' : 'Crypt open' }} ·
            {{ memory.bellRung ? 'Bell rung' : 'Bell silent' }} ·
            {{ memory.memorials.length }} remembered dead
          </p>
          <p v-if="memory.peace.length">
            The last peace:
            {{
              memory.peace
                .map((flag) =>
                  flag.replace('peace-', '').replaceAll('-', ' '),
                )
                .join(', ')
            }}
          </p>
          <ul v-if="memory.memorials.length" class="list-inside list-disc">
            <li v-for="loss in memory.memorials" :key="loss.followerId">
              {{ followerName(loss.followerId) }} · Day {{ loss.day }}
            </li>
          </ul>
          <details v-if="memory.epilogues.length" class="border-t pt-2">
            <summary class="cursor-pointer font-semibold text-warning">
              Afterwards: {{ memory.epilogues.length }} lives changed
            </summary>
            <ol class="mt-2 space-y-3">
              <li
                v-for="entry in memory.epilogues"
                :key="entry.subjectId"
                class="rounded-lg bg-base-200/70 p-2"
              >
                <strong class="font-serif">{{ entry.name }}</strong>
                <p class="mt-1 italic">{{ entry.text }}</p>
              </li>
            </ol>
          </details>
          <p v-else class="text-xs italic opacity-75">
            This older record predates saved epilogues.
          </p>
        </div>
      </details>
    </article>
    <p v-else-if="!found.length" class="text-sm italic opacity-70">
      The first reign writes the first page. Every ending has a different price.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { ENDINGS } from '~/utils/emperorOfDust/fortress/endings'
import type { EndingId } from '~/utils/emperorOfDust/fortress/endings'
import { followerDef } from '~/utils/emperorOfDust/fortress/cast'

const court = useEmperorFortressStore()
const endings = Object.values(ENDINGS)
const selected = ref<EndingId | null>(null)
const found = computed(() => [
  ...new Set([
    ...court.legacy.endings,
    ...court.scrapbook.map((memory) => memory.ending),
  ]),
])
const chosen = computed(() => (selected.value ? ENDINGS[selected.value] : null))
const matching = computed(() =>
  court.scrapbook.filter((memory) => memory.ending === selected.value),
)
const unlocked = (id: EndingId) => found.value.includes(id)
const reignsFor = (id: EndingId) =>
  court.scrapbook.filter((memory) => memory.ending === id).length
const followerName = (id: string) => followerDef(id)?.name ?? id
</script>
