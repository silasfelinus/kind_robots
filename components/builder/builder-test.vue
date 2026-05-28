<!-- /components/builder/builder-test.vue -->
<template>
  <builder-manager />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBuilderStore } from '@/stores/builderStore'
import {
  BUILDER_TEST_CARDS,
  BUILDER_TEST_REWARDS,
  BUILDER_TEST_SPLASH,
  defaultBuilderTestSheet,
} from '@/stores/helpers/testCards'

const builderStore = useBuilderStore()

onMounted(() => {
  builderStore.registerBuilder({
    key: 'builder-test',
    label: 'Builder Test',
    title: 'Builder Test Lab',
    modelType: 'builder-test',
    storageKey: 'kindrobots.builder.builderTest.v1',
    cards: BUILDER_TEST_CARDS,
    splash: BUILDER_TEST_SPLASH,
    defaultSheet: defaultBuilderTestSheet,
    coreCardKeys: ['identity', 'genre', 'mood', 'description', 'stats'],
    requiredCardKeys: [
      'identity',
      'genre',
      'mood',
      'description',
      'stats',
      'reward',
      'art',
    ],
    finalCardKey: 'art',
    rewardOptions: {
      'test-reward': BUILDER_TEST_REWARDS,
    },
  })

  builderStore.setBuilder('builder-test')
  builderStore.hydrate()
})
</script>