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

const butterflyLinkSource = await readFile(
  'components/butterfly/ami-link-butterflies.vue',
  'utf8',
)
const butterflyLink = extractWonderLabComponentSourceEvidence(butterflyLinkSource)
assert.ok(butterflyLink.customComponents.includes('AmiSwarm'))
assert.ok(butterflyLink.nativeElements.includes('button'))
assert.ok(butterflyLink.functionNames.includes('handleButtonClick'))
assert.equal(butterflyLink.staticText.length, 0)
assert.ok(
  butterflyLink.facts.some((fact) => fact.includes('AmiSwarm')),
  'custom component composition should survive into bounded facts',
)

const amiButterflySource = await readFile(
  'components/butterfly/ami-butterfly.vue',
  'utf8',
)
const amiButterfly = extractWonderLabComponentSourceEvidence(amiButterflySource)
assert.deepEqual(amiButterfly.browserEvents, [
  'window adds resize listener with handleResize',
  'window removes resize listener with handleResize',
])
assert.deepEqual(amiButterfly.animationCalls, [
  'cancelAnimationFrame(animationFrameId)',
  'requestAnimationFrame(animate)',
])
assert.deepEqual(amiButterfly.styleBindings, [
  'background',
  'left',
  'top',
  'transform',
])
assert.deepEqual(amiButterfly.cssAnimations, [
  'animation flutter-left',
  'animation flutter-right',
  'keyframes flutter-left',
  'keyframes flutter-right',
])
assert.deepEqual(amiButterfly.storeCalls, [
  'butterflyStore.analogousColor()',
  'butterflyStore.complementaryColor()',
  'butterflyStore.randomColor()',
])
assert.ok(
  amiButterfly.facts.includes(
    'Animation API calls include: cancelAnimationFrame(animationFrameId), requestAnimationFrame(animate).',
  ),
)
assert.ok(
  amiButterfly.facts.includes(
    'Dynamic style bindings include: background, left, top, transform.',
  ),
)
assert.ok(
  amiButterfly.facts.includes(
    'Scoped CSS animations include: animation flutter-left, animation flutter-right, keyframes flutter-left, keyframes flutter-right.',
  ),
)

const synthetic = extractWonderLabComponentSourceEvidence(`
<template>
  <section :style="{ opacity: visibleOpacity }"><button>Save Friend</button><friend-card /></section>
</template>
<script setup lang="ts">
import FriendCard from './friend-card.vue'
const props = defineProps<{ friendId: number; compact?: boolean }>()
const emit = defineEmits<{ saved: [id: number] }>()
function saveFriend() { emit('saved', props.friendId) }
window.addEventListener('focus', saveFriend)
requestAnimationFrame(saveFriend)
</script>
<style scoped>
@keyframes pulse-card { from { opacity: 0 } to { opacity: 1 } }
.friend-card { animation: pulse-card 1s infinite; }
</style>
`)
assert.deepEqual(synthetic.props, ['compact', 'friendId'])
assert.deepEqual(synthetic.emits, ['saved'])
assert.ok(synthetic.customComponents.includes('friend-card'))
assert.ok(synthetic.staticText.includes('Save Friend'))
assert.ok(synthetic.functionNames.includes('saveFriend'))
assert.ok(synthetic.localImports.includes('friend-card'))
assert.deepEqual(synthetic.browserEvents, [
  'window adds focus listener with saveFriend',
])
assert.deepEqual(synthetic.animationCalls, ['requestAnimationFrame(saveFriend)'])
assert.deepEqual(synthetic.styleBindings, ['opacity'])
assert.deepEqual(synthetic.cssAnimations, [
  'animation pulse-card',
  'keyframes pulse-card',
])
assert.deepEqual(synthetic.blocks, ['template', 'script', 'style'])
assert.ok(
  synthetic.facts.includes('Declared props: compact, friendId.'),
)
assert.ok(
  synthetic.facts.includes('Declared emitted events: saved.'),
)

console.log('WonderLab source evidence extraction passed.')
