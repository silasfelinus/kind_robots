<!-- components/adventure/adventure-reward.vue -->
<!--
  Four-option skill reward picker.
  Reads store.activeRewardOptions — four RolledReward entries rolled by generatorStore.
  Each option may have been upgraded beyond the base rarity (the drama of the draw).
  No emits. All state via adventureStore.
-->
<template>
  <div class="flex flex-col gap-4">
    <!-- Rarity legend hint -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p class="text-xs text-base-content/40">
        Base tier:
        <span class="font-bold" :class="slotRarityColor">
          {{ slotRarityLabel }}
        </span>
      </p>
      <p class="text-xs text-base-content/40">·</p>
      <p class="text-xs text-base-content/40">
        Higher tiers may appear. Choose wisely. Or don't.
      </p>
    </div>

    <!-- Reward cards grid -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="option in store.activeRewardOptions"
        :key="option.id"
        type="button"
        class="reward-card group relative flex flex-col gap-0 overflow-hidden rounded-2xl border-2 text-left transition-all duration-200"
        :class="cardClass(option)"
        @click="selectOption(option.id)"
      >
        <!-- Rarity header band -->
        <div
          class="flex items-center justify-between gap-2 px-4 py-2"
          :class="rarityBandClass(option.rarity)"
        >
          <div class="flex items-center gap-2">
            <Icon :name="option.icon" class="h-4 w-4 opacity-80" />
            <span
              class="text-xs font-black uppercase tracking-widest opacity-90"
            >
              {{ option.rarity }}
            </span>
          </div>

          <!-- Upgrade badge — shown when above base tier -->
          <span
            v-if="isUpgraded(option.rarity)"
            class="rounded-full bg-white/15 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wider"
          >
            upgraded ✦
          </span>
        </div>

        <!-- Card body -->
        <div class="flex flex-1 flex-col gap-2 p-4">
          <!-- Label -->
          <h3
            class="text-lg font-black leading-tight text-base-content transition-colors group-hover:text-primary"
          >
            {{ option.label }}
          </h3>

          <!-- Flavour text -->
          <p class="text-sm leading-relaxed text-base-content/60 line-clamp-3">
            {{ option.text }}
          </p>

          <!-- Power — revealed on hover / selection -->
          <div
            class="mt-auto rounded-xl border border-base-300 bg-base-200/70 p-3 transition-all duration-200"
            :class="
              isSelected(option.id)
                ? 'border-primary/30 bg-primary/5'
                : 'group-hover:border-base-content/20'
            "
          >
            <p
              class="text-xs font-bold uppercase tracking-wider text-base-content/40 mb-1"
            >
              Power
            </p>
            <p class="text-xs leading-relaxed text-base-content/70">
              {{ option.power }}
            </p>
          </div>
        </div>

        <!-- Selected overlay tick -->
        <Transition name="check-pop">
          <div
            v-if="isSelected(option.id)"
            class="absolute right-3 top-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30"
          >
            <Icon name="kind-icon:check" class="h-4 w-4 text-primary-content" />
          </div>
        </Transition>
      </button>
    </div>

    <!-- Reroll + selection state row -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <!-- Selection status -->
      <Transition name="status-fade">
        <p v-if="selectedLabel" class="text-sm font-bold text-primary">
          ✦ {{ selectedLabel }} selected
        </p>
        <p v-else class="text-sm text-base-content/40 italic">
          None selected yet. The options are patient.
        </p>
      </Transition>

      <!-- Reroll -->
      <button
        type="button"
        class="btn btn-sm btn-ghost gap-2 rounded-xl border border-base-300 hover:border-secondary hover:bg-secondary/10"
        @click="reroll"
      >
        <Icon name="kind-icon:dice" class="h-3.5 w-3.5" />
        Redraw
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAdventureStore } from '@/stores/adventureStore'
import type { Rarity } from '@/stores/generatorStore'

const store = useAdventureStore()

// ── Slot context ────────────────────────────────────────────────────────────

const slotKey = computed(() => store.activeCard?.rewardSlotKey ?? '')

const BASE_RARITY: Record<string, Rarity> = {
  'common-skill': 'COMMON',
  'uncommon-skill': 'UNCOMMON',
  'rare-skill': 'RARE',
}

const baseRarity = computed<Rarity>(
  () => BASE_RARITY[slotKey.value] ?? 'COMMON',
)

const RARITY_LABELS: Record<Rarity, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  EPIC: 'Epic',
  LEGENDARY: 'Legendary',
  MYTHIC: 'Mythic',
}

const RARITY_ORDER: Rarity[] = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
]

const slotRarityLabel = computed(() => RARITY_LABELS[baseRarity.value])
const slotRarityColor = computed(() => rarityTextColor(baseRarity.value))

function isUpgraded(rarity: Rarity): boolean {
  return RARITY_ORDER.indexOf(rarity) > RARITY_ORDER.indexOf(baseRarity.value)
}

// ── Selection ───────────────────────────────────────────────────────────────

const selectedId = computed(() => store.activeSelectedRewardId)

const selectedLabel = computed(
  () =>
    store.activeRewardOptions.find((o) => o.id === selectedId.value)?.label ??
    '',
)

function isSelected(id: string): boolean {
  return selectedId.value === id
}

function selectOption(id: string) {
  store.selectRewardOption(slotKey.value, id)
}

function reroll() {
  store.rollRewardOptions(slotKey.value)
}

// ── Rarity styling ──────────────────────────────────────────────────────────

function rarityTextColor(rarity: Rarity): string {
  switch (rarity) {
    case 'MYTHIC':
      return 'text-warning'
    case 'LEGENDARY':
      return 'text-warning/80'
    case 'EPIC':
      return 'text-secondary'
    case 'RARE':
      return 'text-primary'
    case 'UNCOMMON':
      return 'text-success'
    default:
      return 'text-base-content/60'
  }
}

function rarityBandClass(rarity: Rarity): string {
  switch (rarity) {
    case 'MYTHIC':
      return 'bg-warning/20 text-warning border-b border-warning/20'
    case 'LEGENDARY':
      return 'bg-warning/12 text-warning/80 border-b border-warning/15'
    case 'EPIC':
      return 'bg-secondary/15 text-secondary border-b border-secondary/20'
    case 'RARE':
      return 'bg-primary/12 text-primary border-b border-primary/20'
    case 'UNCOMMON':
      return 'bg-success/10 text-success border-b border-success/15'
    default:
      return 'bg-base-300/60 text-base-content/60 border-b border-base-300'
  }
}

function cardClass(option: { id: string; rarity: Rarity }): string {
  const selected = isSelected(option.id)

  if (selected) {
    switch (option.rarity) {
      case 'MYTHIC':
        return 'border-warning shadow-lg shadow-warning/20 scale-[1.02]'
      case 'LEGENDARY':
        return 'border-warning/70 shadow-lg shadow-warning/15 scale-[1.02]'
      case 'EPIC':
        return 'border-secondary shadow-lg shadow-secondary/20 scale-[1.02]'
      case 'RARE':
        return 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
      case 'UNCOMMON':
        return 'border-success shadow-lg shadow-success/15 scale-[1.02]'
      default:
        return 'border-base-content/30 shadow-md scale-[1.02]'
    }
  }

  // Unselected — rarity-tinted hover
  switch (option.rarity) {
    case 'MYTHIC':
    case 'LEGENDARY':
      return 'border-base-300 bg-base-100 hover:border-warning/50 hover:shadow-md hover:shadow-warning/10 hover:-translate-y-0.5'
    case 'EPIC':
      return 'border-base-300 bg-base-100 hover:border-secondary/50 hover:shadow-md hover:shadow-secondary/10 hover:-translate-y-0.5'
    case 'RARE':
      return 'border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5'
    case 'UNCOMMON':
      return 'border-base-300 bg-base-100 hover:border-success/40 hover:shadow-md hover:shadow-success/8 hover:-translate-y-0.5'
    default:
      return 'border-base-300 bg-base-100 hover:border-base-content/30 hover:shadow-sm hover:-translate-y-0.5'
  }
}
</script>

<style scoped>
.reward-card {
  -webkit-tap-highlight-color: transparent;
}

.check-pop-enter-active {
  transition:
    opacity 150ms ease,
    transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.check-pop-leave-active {
  transition: opacity 100ms ease;
}
.check-pop-enter-from {
  opacity: 0;
  transform: scale(0.4);
}
.check-pop-leave-to {
  opacity: 0;
}

.status-fade-enter-active,
.status-fade-leave-active {
  transition: opacity 200ms ease;
}
.status-fade-enter-from,
.status-fade-leave-to {
  opacity: 0;
}
</style>
