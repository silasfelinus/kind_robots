<template>
  <div
    class="fixed inset-0 z-[70] flex items-center justify-center bg-[#080d14]/90 p-2 backdrop-blur-sm sm:p-4"
    @click.self="emit('close')"
  >
    <section
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Threads, the Briar's side quests"
      tabindex="-1"
      data-testid="memory-quest-log"
      class="flex h-[min(90dvh,46rem)] w-[min(96vw,64rem)] min-h-0 flex-col overflow-hidden rounded-xl border-2 border-[#8fa47a] bg-[#1d2622] text-[#f3ecd2] shadow-[0_0_65px_#090b10] outline-none"
      @keydown.esc.prevent="emit('close')"
      @keydown="trapMemoryDialogTab($event, dialog)"
    >
      <header
        class="flex shrink-0 items-center justify-between gap-3 border-b border-[#7d8f69] bg-[#2b3328] px-3 py-2 sm:px-5"
      >
        <div>
          <p
            class="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c9d9a6]"
          >
            Side quests · Briar Marches
          </p>
          <h2 class="font-serif text-xl font-black sm:text-2xl">Threads</h2>
          <p class="text-xs text-[#d3cdb3]" aria-live="polite">
            {{ finished }} of {{ world.briarQuests.length }} threads tied off
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-[#a9b98c] px-3 py-2 text-sm font-bold hover:bg-[#46523d] focus-visible:outline-2 focus-visible:outline-[#ecf7c8]"
          @click="emit('close')"
        >
          Return to the world
        </button>
      </header>

      <div class="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
        <nav
          aria-label="Side quests"
          class="kr-scroll flex shrink-0 gap-2 overflow-x-auto border-b border-[#5f6d52] bg-[#202923] p-2 sm:w-56 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r"
        >
          <button
            v-for="thread in world.briarQuests"
            :key="thread.quest.id"
            type="button"
            :aria-pressed="active?.quest.id === thread.quest.id"
            class="min-w-40 shrink-0 rounded-lg border p-3 text-left text-base focus-visible:outline-2 focus-visible:outline-[#ecf7c8] sm:min-w-0"
            :class="
              active?.quest.id === thread.quest.id
                ? 'border-[#d9e7a8] bg-[#435035] text-white'
                : 'border-[#56604c] bg-[#2b322b] text-[#d7d3c3]'
            "
            @click="selected = thread.quest.id"
          >
            <span class="block font-mono text-[10px] opacity-75">{{
              STATE_LABELS[thread.state]
            }}</span>
            <strong class="mt-1 block text-base leading-snug sm:text-lg">{{
              thread.quest.title
            }}</strong>
            <span class="mt-1 block opacity-80"
              >{{ thread.done }}/{{ thread.steps.length }} steps</span
            >
          </button>
        </nav>

        <article
          v-if="active"
          :key="active.quest.id"
          class="kr-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-5"
          :aria-label="active.quest.title"
        >
          <div
            class="relative aspect-[16/9] max-h-[min(36dvh,20rem)] w-full shrink-0 overflow-hidden rounded-lg border-4 border-[#a3b384] bg-[radial-gradient(circle_at_50%_35%,#58705a,#22302a)] shadow-xl"
          >
            <img
              v-if="active.state === 'complete' && !failed[active.quest.id]"
              :src="active.quest.artPath"
              :alt="`Thread tied off: ${active.quest.title}`"
              class="h-full w-full object-cover"
              @error="failed[active.quest.id] = true"
            />
            <div
              v-else
              class="flex h-full flex-col items-center justify-center gap-2 px-5 text-center"
            >
              <span
                class="font-serif text-6xl text-[#c3cf9e]"
                aria-hidden="true"
                >❦</span
              >
              <p class="text-sm font-bold text-[#f2ecd0]">
                {{ active.quest.giver }}
              </p>
            </div>
          </div>

          <div>
            <h3 class="font-serif text-xl font-bold sm:text-2xl">
              {{ active.quest.title }}
            </h3>
            <p class="mt-2 text-base leading-relaxed text-[#ece4cb] sm:text-lg">
              {{ active.quest.hook }}
            </p>
          </div>

          <ol class="flex flex-col gap-1.5" aria-label="Steps">
            <li
              v-for="entry in active.steps"
              :key="entry.step.key"
              class="flex items-start gap-3 rounded-md border px-3 py-2 text-base leading-relaxed sm:text-lg"
              :class="
                entry.state === 'done'
                  ? 'border-[#9fb67d] bg-[#33402d]'
                  : entry.state === 'closed'
                    ? 'border-[#8c6a5a] bg-[#3a2c28] text-[#d9c3b6]'
                    : 'border-[#56604c] bg-[#262d27]'
              "
            >
              <span aria-hidden="true" class="font-bold">{{
                entry.state === 'done'
                  ? '✓'
                  : entry.state === 'closed'
                    ? '✕'
                    : '◇'
              }}</span>
              <span
                >{{ entry.step.text
                }}<span class="sr-only">, {{ STEP_LABELS[entry.state] }}</span
                ><span class="ml-1 font-mono text-[10px] opacity-70">{{
                  entry.step.key
                }}</span></span
              >
            </li>
          </ol>

          <p
            v-if="active.state === 'complete' || active.state === 'closed'"
            class="rounded-lg border-l-2 border-[#b7c98e] bg-[#262e29] p-3 text-base leading-relaxed sm:text-lg"
            role="status"
          >
            {{
              active.state === 'complete'
                ? active.quest.complete
                : active.quest.closed
            }}
          </p>

          <section
            v-for="interlude in rareForActive"
            :key="interlude.id"
            class="rounded-lg border border-[#c8ae77] bg-[#332e25] p-4"
            :aria-label="`Rare interlude: ${interlude.title}`"
            data-testid="memory-rare-interlude"
          >
            <p
              class="text-xs font-bold uppercase tracking-widest text-[#e8c98c]"
            >
              Rare convergence · Remembered across the road
            </p>
            <h4 class="mt-2 font-serif text-xl font-bold">
              {{ interlude.title }}
            </h4>
            <p class="mt-2 text-base leading-relaxed sm:text-lg">
              {{ interlude.premise }}
            </p>
            <p
              class="mt-3 border-l-2 border-[#d9c694] pl-3 text-base leading-relaxed sm:text-lg"
            >
              {{ interlude.outcome }}
            </p>
          </section>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { trapMemoryDialogTab } from '~/utils/memoryDungeon/dialogFocus'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'

const STATE_LABELS = {
  unstarted: 'Rumour',
  active: 'Under way',
  complete: 'Tied off',
  closed: 'Closed',
} as const
const STEP_LABELS = { open: 'open', done: 'done', closed: 'closed' } as const

const emit = defineEmits<{ close: [] }>()
const world = useMemoryWorldStore()
const selected = ref(
  world.briarQuests.find((thread) => thread.state === 'active')?.quest.id ??
    world.briarQuests[0]?.quest.id ??
    '',
)
const failed = ref<Record<string, boolean>>({})
const dialog = ref<HTMLElement | null>(null)
const active = computed(
  () =>
    world.briarQuests.find((thread) => thread.quest.id === selected.value) ??
    world.briarQuests[0] ??
    null,
)
const finished = computed(
  () =>
    world.briarQuests.filter((thread) => thread.state === 'complete').length,
)
const rareForActive = computed(() =>
  world.briarRareEvents.filter(
    (event) => event.questId === active.value?.quest.id,
  ),
)
onMounted(async () => {
  await nextTick()
  dialog.value?.focus()
})
</script>
