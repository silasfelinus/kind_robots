<template>
  <aside
    class="pf-panel @container flex min-h-0 flex-col overflow-hidden"
    aria-label="Beat"
  >
    <div
      class="flex shrink-0 items-center gap-1 border-b border-base-content/10 px-3 py-2"
    >
      <button
        type="button"
        class="pf-tab"
        :class="view === 'edit' ? 'pf-tab-on' : ''"
        @click="view = 'edit'"
      >
        Edit
      </button>
      <button
        type="button"
        class="pf-tab"
        :class="view === 'scene' ? 'pf-tab-on' : ''"
        @click="view = 'scene'"
      >
        As played
      </button>
    </div>
    <div
      class="playbook-studio pf-studio kr-scroll min-h-0 flex-1 p-3 @3xl:p-4"
    >
      <PlaybookScene
        v-if="view === 'scene'"
        @back="view = 'edit'"
        @art="showArt"
      />
      <PlaybookDetail v-else ref="detail" />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'

// The Playbook Studio scene editor, hosted by the Forge: overlays and going
// live, notes, flags, submitted images and art requests for the selected beat.
const view = ref<'edit' | 'scene'>('edit')
const detail = ref<{ showTab: (tab: 'art') => void } | null>(null)

async function showArt() {
  view.value = 'edit'
  await nextTick()
  detail.value?.showTab('art')
}
</script>

<style src="../../assets/css/playbook-studio.css"></style>
