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
        +{{ tankStore.lastCollectCoins }} from scales
      </p>
    </div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-2">
      <div
        v-for="upgrade in tankStore.upgrades"
        :key="upgrade.track"
        class="flex overflow-hidden rounded-2xl border border-base-300 bg-base-200"
      >
        <div class="w-28 shrink-0">
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
        <div class="flex min-w-0 flex-1 flex-col gap-1 p-3">
          <p class="truncate text-sm font-bold">{{ upgrade.title }}</p>
          <p class="text-xs opacity-70">{{ upgrade.description }}</p>
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
          <button
            v-if="upgrade.nextCost !== null"
            type="button"
            class="btn btn-primary btn-sm mt-auto min-h-11"
            :disabled="
              tankStore.coins < upgrade.nextCost ||
              tankStore.upgradePending !== null
            "
            @click="tankStore.purchaseUpgrade(upgrade.track)"
          >
            <Icon name="kind-icon:coin" class="size-4" />
            {{ upgrade.nextCost }}
          </button>
          <span v-else class="kr-badge-neutral-xs mt-auto self-start">
            Fully upgraded
          </span>
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
}

function upgradeArt(track: string): string | null {
  const art = UPGRADE_ART[track]
  if (!art) return null
  return plateArt(art.plate) ?? artByName(art.standIn)
}
</script>
