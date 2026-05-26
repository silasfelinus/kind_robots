<!-- components/pitches/pitch-icon.vue -->
<!--
  Icon picker using iconStore's validIcons list.
  Searchable grid — selecting writes to sheet.icon and stagedValues.
-->
<template>
  <div class="flex flex-col gap-3">
    <!-- Search -->
    <div class="relative">
      <Icon
        name="kind-icon:search"
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
      />
      <input
        v-model="searchQuery"
        type="text"
        class="input input-bordered w-full rounded-2xl pl-9 text-sm focus:border-primary"
        placeholder="Search icons..."
      />
    </div>

    <!-- Current selection -->
    <Transition name="slide-down">
      <div
        v-if="currentIcon"
        class="flex items-center gap-3 rounded-2xl border-2 border-primary/40 bg-primary/8 px-4 py-3"
      >
        <Icon :name="currentIcon" class="h-8 w-8 text-primary" />
        <div class="flex-1 min-w-0">
          <p class="text-xs font-bold text-primary">Selected</p>
          <p class="truncate font-mono text-sm text-base-content/70">
            {{ currentIcon }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 text-base-content/30 hover:text-error transition-colors"
          @click="clearIcon"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>
    </Transition>

    <!-- Icon grid -->
    <div class="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-10">
      <button
        v-for="icon in filteredIcons"
        :key="icon"
        type="button"
        class="group flex aspect-square flex-col items-center justify-center rounded-xl border p-2 transition-all"
        :class="
          currentIcon === icon
            ? 'border-primary bg-primary/15 text-primary shadow-md shadow-primary/20'
            : 'border-base-300 bg-base-100 text-base-content/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
        "
        :title="icon.replace('kind-icon:', '')"
        @click="selectIcon(icon)"
      >
        <Icon :name="icon" class="h-5 w-5" />
      </button>
    </div>

    <p
      v-if="filteredIcons.length === 0"
      class="text-center text-sm text-base-content/40"
    >
      No icons match "{{ searchQuery }}"
    </p>

    <p class="text-xs text-base-content/30">
      {{ filteredIcons.length }} of {{ iconStore.icons.length }} icons
      {{ searchQuery ? `matching "${searchQuery}"` : 'available' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePitchBuilderStore } from '@/stores/pitchBuilderStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useIconStore } from '@/stores/iconStore'

const store = usePitchBuilderStore()
const pitchStore = usePitchStore()
const iconStore = useIconStore()

const searchQuery = ref('')
const stepKey = computed(() => store.activeStep?.key ?? '')
const currentIcon = computed(() => store.stagedValues[stepKey.value] ?? '')

const filteredIcons = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return iconStore.icons
  return iconStore.icons.filter((icon: string) =>
    icon.replace('kind-icon:', '').includes(q),
  )
})

function selectIcon(icon: string) {
  store.setStagedValue(stepKey.value, icon)
  pitchStore.setPitchForm({ icon })
}

function clearIcon() {
  store.setStagedValue(stepKey.value, '')
  pitchStore.setPitchForm({ icon: '' })
}
</script>

<style scoped>
.slide-down-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.slide-down-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
