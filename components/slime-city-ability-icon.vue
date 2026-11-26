<template>
  <span
    v-if="entry?.icon"
    class="sc-ability-icon"
    role="img"
    :aria-label="entry.term"
    :title="entry.term + ': ' + entry.definition"
    >{{ entry.icon }}</span
  >
</template>

<script setup lang="ts">
import { clashGlossaryEntry } from '~/utils/slimeCity/glossary'

const props = defineProps<{ term: string }>()
const entry = computed(() => clashGlossaryEntry(props.term))
</script>

<style scoped>
.sc-ability-icon {
  display: inline-grid;
  place-items: center;
  min-width: 1.3em;
  min-height: 1.3em;
  padding: 0.08em 0.18em;
  border: 1px solid #9fe5d699;
  border-radius: 0.3em;
  background: #071a20;
  color: #d7ff89;
  font-weight: 950;
  font-family: system-ui, sans-serif;
  line-height: 1;
  vertical-align: middle;
}
</style>
