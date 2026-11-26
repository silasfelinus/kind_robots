<template>
  <main
    class="kr-surface h-full min-h-0 overflow-hidden gap-0"
    data-layout="console-fixed"
    data-testid="deepheart"
  >
    <PlaybookKitShell :spec="deepheart" :meter-values="dh.meterValues">
      <div class="dh-page @container h-full min-h-full p-2 @3xl:p-3">
        <p
          v-if="dh.warning"
          class="alert alert-warning mb-2 py-2 text-sm"
          role="alert"
        >
          {{ dh.warning }}
        </p>
        <DeepheartTitle v-if="dh.screen === 'title'" />
        <DeepheartBuilder v-else-if="dh.screen === 'builder'" />
        <DeepheartDelve v-else-if="dh.screen === 'delve' && dh.run" />
        <DeepheartChronicle
          v-else-if="dh.screen === 'chronicle' || dh.screen === 'saves'"
        />
        <DeepheartTitle v-else />
      </div>
    </PlaybookKitShell>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useDeepheartStore } from '~/stores/deepheartStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import {
  DeepheartSound,
  deepheartAudioFrame,
  deepheartCues,
  deepheartMood,
} from '~/utils/deepheart/sound'
import { DEEPHEART as deepheart } from '~/utils/playbookKit/games/deepheart'

const dh = useDeepheartStore()

const kit = usePlaybookKitStore()
const sound = new DeepheartSound()
const frame = computed(() => deepheartAudioFrame(dh.run, dh.screen))
let motion: MediaQueryList | null = null

function configureSound() {
  if (typeof document === 'undefined') return
  sound.configure(
    kit.settings.sound === 'on',
    kit.settings.motion === 'reduced' || !!motion?.matches,
    document.hidden,
  )
}

function unlockSound(event: Event) {
  if (!event.isTrusted) return
  configureSound()
  sound.unlock()
}

watch(() => [kit.settings.sound, kit.settings.motion], configureSound)
watch(
  frame,
  (next, previous) => {
    sound.setMood(deepheartMood(next))
    if (previous) sound.play(deepheartCues(previous, next))
  },
  { immediate: true },
)

onMounted(() => {
  dh.load()
  motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  motion.addEventListener('change', configureSound)
  document.addEventListener('visibilitychange', configureSound)
  window.addEventListener('pointerdown', unlockSound, { capture: true })
  window.addEventListener('keydown', unlockSound, { capture: true })
  configureSound()
})

onBeforeUnmount(() => {
  motion?.removeEventListener('change', configureSound)
  document.removeEventListener('visibilitychange', configureSound)
  window.removeEventListener('pointerdown', unlockSound, true)
  window.removeEventListener('keydown', unlockSound, true)
  sound.dispose()
})
</script>

<style scoped>
.dh-page {
  display: flex;
  flex-direction: column;
}
.dh-page > :last-child {
  flex: 1;
  min-height: 0;
}
</style>
