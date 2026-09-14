<!-- /components/storybook/storybook-reading.vue -->
<!--
  THE READING. One page per turn, on the server-side engine.

  Three moves are visible together at all times -- take an offered option,
  write your own, or play a card off the hero's sheet. Silas, 2026-09-12:
  "they then get a number of experiences that they can choose either from a set
  of choices, a custom choice, or use their main character's character sheet."
  Stacking them behind a mode switch would make two of the three invisible.

  TURN PIPS DO NOT ALWAYS COUNT DOWN. An open-ended run has no budget
  (storybook/t-040), so "Turn 3 of 8" is only shown when there is an 8. An
  endless story shows how far it has come and offers the reader the ending
  instead: the store's readyToResolve is the server's word on when that is
  allowed, never a local guess.

  AXES ARE THE DECK'S SECRET. Only structured mode has ever shown its values,
  as stat pills since davinci/t-014, and only there does the ledger toggle
  appear. For every other deck the server does not even send them.

  Silas, 2026-09-13: "we just want things functional at this point." Built
  against the shipped API end to end; the visual pass comes after.
-->
<template>
  <section
    class="relative h-full min-h-0 overflow-y-auto overscroll-contain rounded-[2rem] border border-base-300 bg-base-100 shadow-xl"
  >
    <div class="space-y-4 p-4 sm:p-5 lg:p-6">
      <!-- Where we are -->
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="kr-text-black-lg">{{ runStore.run?.title || 'Untitled' }}</h2>
        <p class="kr-text-dim-xs" data-testid="storybook-turn-pips">
          <span v-if="runStore.isEndless">
            Turn {{ runStore.turnIndex }} · no last page
          </span>
          <span v-else>
            Turn {{ runStore.turnIndex }} of {{ runStore.turnBudget }}
          </span>
        </p>
      </div>

      <!-- Taskmaster keeps the real objective beside the fiction, always -->
      <div
        v-if="quest"
        class="space-y-2 rounded-2xl border border-warning/40 bg-warning/5 p-3"
        data-testid="storybook-quest-objective"
      >
        <div>
          <p class="kr-text-eyebrow">Objective</p>
          <p class="kr-text-semibold-sm">{{ quest.objective }}</p>
        </div>

        <ul v-if="openCheckpoints.length" class="space-y-0.5">
          <li
            v-for="checkpoint in openCheckpoints"
            :key="checkpoint.id"
            class="kr-text-dim-xs flex items-center gap-1"
          >
            <Icon
              :name="
                checkpoint.id === quest.activeCheckpointId
                  ? 'kind-icon:arrow-right'
                  : 'kind-icon:circle'
              "
              class="kr-icon-3"
            />
            {{ checkpoint.title }}
          </li>
        </ul>

        <!--
          THE ACCEPT STEP (storybook/t-045, t-046). A turn PROPOSES; this is
          where a proposal becomes a real change, and only because the reader
          pressed it. Every proposal says what applying would do BEFORE it is
          applied, and an unapplied one is labelled as not having happened --
          a story must never look like it silently edited a task list.
        -->
        <div
          v-for="proposal in quest.proposals"
          :key="proposal.id"
          class="rounded-xl border border-base-300 bg-base-100 p-2"
          data-testid="storybook-proposal"
        >
          <p class="kr-text-semibold-sm">{{ proposal.note }}</p>
          <p class="kr-text-dim-xs">{{ proposal.effect }}</p>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <span
              v-if="proposal.applied"
              class="badge badge-success badge-sm"
              data-testid="storybook-proposal-applied"
            >
              Applied
            </span>
            <template v-else>
              <span class="badge badge-outline badge-sm">
                Not applied — nothing has changed yet
              </span>
              <button
                type="button"
                class="btn btn-xs btn-primary"
                :disabled="runStore.isApplying"
                @click="runStore.applyProposal(proposal.id)"
              >
                Accept
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- The scene -->
      <KrArtPlate
        v-if="sceneArt"
        :source="sceneArt"
        shape="hero"
        :alt="runStore.run?.title || 'This scene'"
      />

      <p
        v-if="runStore.pendingTurn"
        class="whitespace-pre-line"
        data-testid="storybook-scene"
      >
        {{ runStore.pendingTurn.narrativeText }}
      </p>
      <div v-else-if="runStore.isNarrating" class="py-8 text-center">
        <span class="kr-spinner-lg-dots" />
      </div>
      <div v-else-if="!runStore.isComplete" class="py-6 text-center">
        <p class="kr-text-dim-xs mb-2">This scene never arrived.</p>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          @click="runStore.requestScene()"
        >
          Ask for it again
        </button>
      </div>

      <p v-if="runStore.errorMessage" class="kr-text-dim-xs text-error">
        {{ runStore.errorMessage }}
      </p>

      <!-- MOVE 1: the offered options -->
      <div
        v-if="options.length"
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-2"
        data-testid="storybook-options"
      >
        <button
          v-for="option in options"
          :key="option.id"
          type="button"
          class="rounded-2xl border-2 border-base-300 bg-base-200/40 p-3 text-left transition hover:border-primary disabled:opacity-50"
          :disabled="busy"
          @click="runStore.chooseOption(option.id)"
        >
          <span class="kr-text-semibold-sm">{{ option.choiceText }}</span>
        </button>
      </div>

      <!-- MOVE 2: write your own -->
      <form
        v-if="canMove"
        class="flex flex-wrap items-end gap-2"
        @submit.prevent="submitWritten"
      >
        <label class="form-control min-w-0 flex-1">
          <span class="kr-text-eyebrow mb-1">Or do something else</span>
          <input
            v-model="written"
            type="text"
            class="input input-bordered"
            placeholder="You ..."
            :disabled="busy"
          />
        </label>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="busy || !written.trim()"
        >
          Do it
        </button>
      </form>

      <!-- MOVE 3: the hero's own cards -->
      <div
        v-if="canMove && runStore.playableCards.length"
        class="rounded-[1.5rem] border border-base-300 bg-base-200/40 p-3"
        data-testid="storybook-sheet"
      >
        <p class="kr-text-eyebrow mb-2">Your cards</p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
          <button
            v-for="card in runStore.playableCards"
            :key="card.slug"
            type="button"
            class="rounded-2xl border-2 border-base-300 bg-base-100 p-2 text-left transition hover:border-primary disabled:opacity-50"
            :disabled="busy"
            @click="runStore.playCard(card.slug)"
          >
            <span class="kr-text-semibold-sm block">{{ card.name }}</span>
            <span class="kr-text-dim-xs block">
              {{ card.rarity }} {{ card.rewardType.toLowerCase() }}
            </span>
          </button>
        </div>
      </div>

      <!-- Structured mode alone may show its ledger -->
      <details v-if="runStore.stats" class="rounded-2xl bg-base-200/40 p-3">
        <summary class="kr-text-semibold-sm cursor-pointer">
          Show the ledger
        </summary>
        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="(value, key) in runStore.stats"
            :key="key"
            class="badge badge-outline"
          >
            {{ key }} {{ value }}
          </span>
        </div>
      </details>

      <!-- Ending the story -->
      <div v-if="runStore.readyToResolve" class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="runStore.isResolving"
          @click="resolve"
        >
          <span
            v-if="runStore.isResolving"
            class="kr-spinner-sm"
          />
          {{ runStore.isEndless ? 'Bring this to an end' : 'See your ending' }}
        </button>
      </div>

      <button type="button" class="btn btn-ghost btn-sm" @click="leave">
        Back to the table
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStorybookRunStore } from '@/stores/storybookRunStore'

const emit = defineEmits<{ left: []; resolved: [] }>()

const runStore = useStorybookRunStore()
const written = ref('')

const busy = computed(() => runStore.isNarrating || runStore.isResolving)
const options = computed(() => runStore.pendingTurn?.choices ?? [])
const canMove = computed(
  () => Boolean(runStore.pendingTurn) && !runStore.isComplete,
)
const quest = computed(() => runStore.quest)

/** Checkpoints still to work, so the reader can see what the quest holds. */
const openCheckpoints = computed(() =>
  (quest.value?.checkpoints ?? []).filter(
    (checkpoint) =>
      checkpoint.status === 'pending' ||
      checkpoint.status === 'proposed' ||
      checkpoint.status === 'needs-info',
  ),
)

/**
 * The art already generated for this turn, if any.
 *
 * pendingTurn.artPrompt is a PROMPT, not an image: generation is asynchronous
 * and the ArtImage lands on the run later. So the plate is drawn from what the
 * run actually holds for this chapter, and is simply absent until there is
 * something -- an empty frame is worse than no frame.
 */
const sceneArt = computed(() => {
  const forTurn = runStore.art.find(
    (entry) => entry.chapter === runStore.turnIndex,
  )
  const image = (forTurn ?? runStore.art[runStore.art.length - 1])?.ArtImage
  return image?.imagePath || image?.path ? image : null
})

async function submitWritten() {
  const text = written.value
  if (!text.trim()) return
  const ok = await runStore.writeMove(text)
  if (ok) written.value = ''
}

async function resolve() {
  const ok = await runStore.resolveRun()
  if (ok) emit('resolved')
}

function leave() {
  runStore.leaveRun()
  emit('left')
}
</script>
