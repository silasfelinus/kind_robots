<!-- /components/content/icons/splash-nav.vue -->
<template>
  <div class="flex flex-col gap-4 w-full pointer-events-auto">
    <div class="text-center">
      <div class="flex flex-wrap justify-center gap-2">
        <button
          class="btn btn-xs md:btn-sm btn-outline border-base-content/40 bg-primary rounded-2xl"
          @click="setNavSource('nav-nav')"
        >
          🔗 Nav Select
        </button>
        <button
          class="btn btn-xs md:btn-sm btn-outline border-base-content/40 bg-secondary rounded-2xl"
          @click="setNavSource('mode-row')"
        >
          🎮 Mode Row
        </button>
        <button
          v-if="linkNavComponent"
          class="btn btn-xs md:btn-sm btn-outline border-base-content/40 bg-accent rounded-2xl"
          @click="setNavSource('custom')"
        >
          ✨ {{ linkNavComponent }}
        </button>
      </div>
    </div>

    <Transition name="fade-expand">
      <div
        v-if="currentNav === 'nav-nav'"
        class="space-y-2 min-h-[300px] bg-base-200 border border-dashed border-primary rounded-2xl p-4"
      >
        <nav-nav class="w-full max-w-3xl mx-auto" />
      </div>
    </Transition>

    <Transition name="fade-expand">
      <div
        v-if="currentNav === 'custom' && linkNavComponent"
        class="space-y-2 min-h-[300px] bg-base-200 border border-dashed border-accent rounded-2xl p-4"
      >
        <component :is="linkNavComponent" class="w-full max-w-3xl mx-auto" />
      </div>
    </Transition>

    <Transition name="fade-expand">
      <div
        v-if="currentNav === 'mode-row'"
        class="space-y-2 border border-base-300 bg-base-100 rounded-2xl"
      >
        <label
          class="text-sm font-semibold text-base-content/70 text-center block"
        >
          🎮 Mode Row
        </label>
        <div class="flex justify-center">
          <mode-row class="w-full max-w-3xl" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useLinkStore } from '@/stores/linkStore'

const pageStore = usePageStore()
const linkStore = useLinkStore()

const linkNavComponent = computed(() => linkStore.navComponent?.trim() || null)
const defaultNav = computed(
  () => pageStore.page?.navComponent?.trim() || 'mode-row',
)

const currentNav = ref<'nav-nav' | 'mode-row' | 'custom'>(
  linkNavComponent.value ? 'custom' : (defaultNav.value as any),
)

function setNavSource(source: 'nav-nav' | 'mode-row' | 'custom') {
  currentNav.value = source
  if (source === 'nav-nav') {
    linkStore.navComponent = ''
  }
}
</script>
