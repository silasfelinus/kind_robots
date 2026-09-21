<!-- /components/storybook/storybook-storymaker.vue -->
<!--
  The storymaker's two states: the Table until a story is open, the Reading once
  it is (storybook/t-034, t-035). One component owns the switch so neither
  screen has to know about the other, and so resuming works the same whether the
  reader just opened a story or came back to the page a day later.
-->
<template>
  <div class="size-full">
    <StorybookEnding
      v-if="showEnding"
      @again="playAgain"
      @new-table="newTable"
    />
    <StorybookReading
      v-else-if="runStore.run"
      @left="onLeft"
      @resolved="onResolved"
    />
    <!--
      The Table owns its own three bands now (storybook/t-010, 2026-09-13), and
      the Chronicle it opens is where the Collection lives. Nothing is stacked
      under it: the floor of the screen belongs to the hand.
    -->
    <StorybookTable v-else @opened="onOpened" @resume="openAdventure" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStorybookRunStore } from '@/stores/storybookRunStore'

const runStore = useStorybookRunStore()

/**
 * A resolved run shows its ending, not another turn.
 *
 * Both halves are required: `ending` alone could be a stale object from a run
 * the reader has since left, and `isComplete` alone would show an empty card
 * for the moment between the resolve request and its answer.
 */
const showEnding = computed(() =>
  Boolean(runStore.run && runStore.isComplete && runStore.ending),
)

function onOpened(): void {
  // The store already holds the run; the template switches on it.
}

function onLeft(): void {
  // leaveRun() cleared the store, which drops us back to the Table.
}

function onResolved(): void {
  // The ending is in the store; showEnding switches the screen.
}

/**
 * Play again: drop the reader back on the Table rather than silently
 * opening a second run behind their back.
 *
 * NOTE (storybook/t-059): this does not yet retain the prior board — the
 * Table remounts fresh here exactly like `newTable()` below. Board
 * retention (the same cards with a different length or narrator, the
 * common second play) is a real feature still to be built, not a
 * currently-existing behavior; kept as a separate function from
 * `newTable()` so that future retention work has a seam to land in
 * without touching the "start over" path.
 */
function playAgain(): void {
  runStore.leaveRun()
}

function newTable(): void {
  runStore.leaveRun()
}

function openAdventure(runId: number): void {
  void runStore.loadRun(runId)
}

onMounted(() => {
  // Resume whatever this browser was last reading. Failure is silent and
  // lands on the Table, which is the right place to be when there is no run.
  void runStore.resumeActiveRun()
})
</script>
