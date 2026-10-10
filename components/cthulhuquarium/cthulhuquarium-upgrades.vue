<!-- components/cthulhuquarium/cthulhuquarium-upgrades.vue
     The coin upgrade shop (cthulhuquarium/t-071, DESIGN-BRIEF MVP item 4).
     Levels, prices, and effects are all server-computed
     (server/utils/aquariumCollect.ts UPGRADE_CATALOG) and read from the tank
     store; buying goes through the store's purchaseUpgrade(). No tank-slot
     upgrade: capacity is milestone-only per economy.yaml. -->
<template>
  <div v-if="tankStore.upgrades.length" class="flex flex-col gap-2">
    <div class="flex items-baseline justify-between gap-2">
      <p class="kr-text-eyebrow text-xs tracking-wide opacity-60">
        Tank upgrades
      </p>
      <p
        v-if="tankStore.lastCollectCoins > 0"
        class="flex items-center gap-1 text-xs opacity-70"
      >
        <Icon name="kind-icon:coin" class="size-3 text-warning" />
        +{{ tankStore.lastCollectCoins }} from coins
      </p>
    </div>
    <div class="flex flex-col gap-1.5">
      <div
        v-for="upgrade in tankStore.upgrades"
        :key="upgrade.track"
        class="flex items-center overflow-hidden rounded-2xl border border-base-300 bg-base-200"
      >
        <div class="w-16 shrink-0 self-stretch">
          <kr-art-plate
            :source="{ imagePath: upgradeArt(upgrade.track) }"
            variant="card"
            shape="square"
            frame="none"
            fit="cover"
            :alt="upgrade.title"
            placeholder-icon="kind-icon:sparkles"
          />
        </div>
        <div class="flex min-w-0 flex-1 flex-col gap-1 px-2 py-1.5">
          <p class="truncate text-sm font-bold" :title="upgrade.description">
            {{ upgrade.title }}
          </p>
          <p class="truncate text-xs opacity-70" :title="upgrade.description">
            {{ upgrade.description }}
          </p>
          <div
            class="flex gap-1"
            role="meter"
            :aria-valuenow="upgrade.level"
            aria-valuemin="0"
            :aria-valuemax="upgrade.maxLevel"
            :aria-label="`${upgrade.title} level`"
          >
            <span
              v-for="pip in upgrade.maxLevel"
              :key="pip"
              class="h-1.5 flex-1 rounded-full"
              :class="pip <= upgrade.level ? 'bg-primary' : 'bg-base-300'"
            />
          </div>
        </div>
        <div class="shrink-0 pr-1.5">
          <button
            v-if="upgrade.nextCost !== null"
            type="button"
            class="cq-price btn btn-primary btn-sm min-h-11 min-w-20 gap-1"
            :disabled="
              tankStore.coins < upgrade.nextCost ||
              tankStore.upgradePending !== null
            "
            @click="tankStore.purchaseUpgrade(upgrade.track)"
          >
            <Icon name="kind-icon:coin" class="size-4 text-warning" />
            {{ upgrade.nextCost }}
          </button>
          <span v-else class="kr-badge-neutral-xs">Maxed</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCthulhuquariumTankStore } from '~/stores/cthulhuquariumTankStore'
import { artByName, plateArt } from '~/utils/cthulhuquariumArt'

const tankStore = useCthulhuquariumTankStore()

const UPGRADE_ART: Record<string, { plate: string; standIn: string }> = {
  food: { plate: 'upgrade-food', standIn: 'set-heavier-feed' },
  dropSpeed: { plate: 'upgrade-drops', standIn: 'set-restless-water' },
  room: { plate: 'upgrade-room', standIn: 'set-extra-shelf' },
}

function upgradeArt(track: string): string | null {
  const art = UPGRADE_ART[track]
  if (!art) return null
  return plateArt(art.plate) ?? artByName(art.standIn)
}
</script>

<style scoped>
.cq-price:disabled {
  opacity: 1;
  color: color-mix(in oklab, var(--color-base-content) 75%, transparent);
  background: var(--color-base-200);
  border-color: var(--color-base-300);
}
</style>
