import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { extractWonderLabComponentSourceEvidence } from '@/utils/wonderlab/componentSourceEvidence.mjs'

const characterSheetSource = await readFile(
  'components/characters/character-sheet.vue',
  'utf8',
)
const characterSheet = extractWonderLabComponentSourceEvidence(
  characterSheetSource,
)

assert.equal(characterSheet.version, 1)
assert.ok(characterSheet.lineCount > 500)
assert.deepEqual(characterSheet.blocks, ['template', 'script', 'style'])
assert.ok(characterSheet.props.includes('sheet'))
assert.ok(characterSheet.props.length >= 5)
assert.ok(characterSheet.emits.includes('remove-section'))
assert.ok(characterSheet.emits.length >= 3)
assert.ok(characterSheet.customComponents.includes('sheet-cell'))
assert.ok(characterSheet.nativeElements.includes('button'))
assert.ok(characterSheet.staticText.includes('Character Sheet'))
assert.ok(characterSheet.functionNames.length >= 4)
assert.ok(characterSheet.localImports.includes('characterHelper'))
assert.ok(characterSheet.facts.length >= 6)
assert.ok(
  characterSheet.facts.some((fact) => fact.startsWith('Declared props:')),
)
assert.ok(
  characterSheet.facts.some((fact) =>
    fact.startsWith('Declared emitted events:'),
  ),
)

const butterflySource = await readFile(
  'components/butterfly/ami-link-butterflies.vue',
  'utf8',
)
const butterfly = extractWonderLabComponentSourceEvidence(butterflySource)
assert.ok(butterfly.customComponents.includes('AmiSwarm'))
assert.ok(butterfly.nativeElements.includes('button'))
assert.ok(butterfly.functionNames.includes('handleButtonClick'))
assert.equal(butterfly.staticText.length, 0)
assert.ok(
  butterfly.facts.some((fact) => fact.includes('AmiSwarm')),
  'custom component composition should survive into bounded facts',
)

const synthetic = extractWonderLabComponentSourceEvidence(`
<template>
  <section><button>Save Friend</button><friend-card /></section>
</template>
<script setup lang="ts">
import FriendCard from './friend-card.vue'
const props = defineProps<{ friendId: number; compact?: boolean }>()
const emit = defineEmits<{ saved: [id: number] }>()
function saveFriend() { emit('saved', props.friendId) }
</script>
`)
assert.deepEqual(synthetic.props, ['compact', 'friendId'])
assert.deepEqual(synthetic.emits, ['saved'])
assert.ok(synthetic.customComponents.includes('friend-card'))
assert.ok(synthetic.staticText.includes('Save Friend'))
assert.ok(synthetic.functionNames.includes('saveFriend'))
assert.ok(synthetic.localImports.includes('friend-card'))
assert.deepEqual(synthetic.blocks, ['template', 'script'])
assert.ok(
  synthetic.facts.includes('Declared props: compact, friendId.'),
)
assert.ok(
  synthetic.facts.includes('Declared emitted events: saved.'),
)

console.log('WonderLab source evidence extraction passed.')
