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
assert.deepEqual(characterSheet.blocks, ['template', 'script'])
assert.ok(characterSheet.props.includes('sheet'))
assert.ok(characterSheet.props.includes('rewardSlots'))
assert.ok(characterSheet.props.includes('isBuilderMode'))
assert.ok(characterSheet.emits.includes('remove-section'))
assert.ok(characterSheet.emits.includes('select-card'))
assert.ok(characterSheet.customComponents.includes('sheet-cell'))
assert.ok(characterSheet.customComponents.includes('sheet-panel'))
assert.ok(characterSheet.nativeElements.includes('button'))
assert.ok(characterSheet.staticText.includes('Character Sheet'))
assert.ok(characterSheet.staticText.includes('Portrait Pending'))
assert.ok(characterSheet.functionNames.includes('skillImagePath'))
assert.ok(characterSheet.localImports.includes('characterHelper'))
assert.ok(
  characterSheet.facts.some((fact) =>
    fact.includes('Declared props: allowArt, canCreateArt, isBuilderMode'),
  ),
)
assert.ok(
  characterSheet.facts.some((fact) =>
    fact.includes('Declared emitted events: remove-reward, remove-section, select-card'),
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
assert.ok(butterfly.staticText.length === 0)
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

console.log('WonderLab source evidence extraction passed.')
