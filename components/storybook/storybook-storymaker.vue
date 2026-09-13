<!-- /components/storybook/storybook-storymaker.vue -->
<!--
  The storymaker's two states: the Table until a story is open, the Reading once
  it is (storybook/t-034, t-035). One component owns the switch so neither
  screen has to know about the other, and so resuming works the same whether the
  reader just opened a story or came back to the page a day later.
-->
<template>
  <div class="size-full">
    <StorybookReading
      v-if="runStore.run"
      @left="onLeft"
      @resolved="onResolved"
    />
    <StorybookTable v-else @opened="onOpened" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useStorybookRunStore } from '@/stores/storybookRunStore'

const runStore = useStorybookRunStore()

function onOpened(): void {
  // The store already holds the run; the template switches on it.
}

function onLeft(): void {
  // leaveRun() cleared the store, which drops us back to the Table.
}

function onResolved(): void {
  // The ending lands in the store and the Reading shows it. The Collection
  // (storybook/t-036) is where it gets its album row.
}

onMounted(() => {
  // Resume whatever this browser was last reading. Failure is silent and
  // lands on the Table, which is the right place to be when there is no run.
  void runStore.resumeActiveRun()
})
</script>
