<!-- components/ruler-hooked/ruler-hooked-shop.vue
     A shop for coins found while fishing (ruler-hooked/t-029). Silas,
     2026-09-11: "no shop to purchase upgrades to fishing or to upgrade the
     kingdom, no ability to catch treasures when fishing that might be spent
     at said shop on gear or the kingdom." Two tabs, both spending the same
     coins counter: GEAR permanently widens/slows t-026's timing bar; KINGDOM
     moves the real kingdomHealth sliders the landscape recomposites from. -->
<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <h3 class="kr-text-bold-lg">Shop</h3>
      <span class="kr-badge-outline-sm flex items-center gap-1">
        <Icon name="kind-icon:coin" class="kr-icon-3-5" />
        {{ store.coins }}
      </span>
    </div>

    <div role="tablist" class="tabs tabs-boxed w-fit">
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': tab === 'gear' }"
        @click="tab = 'gear'"
      >
        Gear
      </button>
      <button
        type="button"
        role="tab"
        class="tab"
        :class="{ 'tab-active': tab === 'kingdom' }"
        @click="tab = 'kingdom'"
      >
        Kingdom
      </button>
    </div>

    <div v-if="tab === 'gear'" class="flex flex-col gap-2">
      <p class="kr-text-faded-xs">
        Permanent upgrades that visibly change the timing bar on every future
        catch.
      </p>
      <div
        v-for="item in gearItems"
        :key="item.id"
        class="flex items-start justify-between gap-3 rounded-xl border border-base-300 bg-base-100/70 p-3"
      >
        <div>
          <p class="kr-text-bold-sm">{{ item.name }}</p>
          <p class="mt-0.5 text-xs opacity-75">{{ item.description }}</p>
        </div>
        <button
          type="button"
          class="kr-btn-primary-xs-lg shrink-0"
          :disabled="item.owned || store.coins < item.cost"
          @click="store.purchaseGear(item.id)"
        >
          {{ item.owned ? 'Owned' : `${item.cost} coins` }}
        </button>
      </div>
    </div>

    <div v-else class="flex flex-col gap-2">
      <p class="kr-text-faded-xs">
        Invests directly in the realm -- the same sliders the kingdom view
        recomposites from.
      </p>
      <div
        v-for="item in KINGDOM_CATALOG"
        :key="item.id"
        class="flex items-start justify-between gap-3 rounded-xl border border-base-300 bg-base-100/70 p-3"
      >
        <div>
          <p class="kr-text-bold-sm">{{ item.name }}</p>
          <p class="mt-0.5 text-xs opacity-75">{{ item.description }}</p>
          <p
            class="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wide opacity-60"
          >
            <span v-for="(delta, axis) in item.sliders" :key="axis">
              {{ axis }} +{{ delta }}
            </span>
          </p>
        </div>
        <button
          type="button"
          class="kr-btn-primary-xs-lg shrink-0"
          :disabled="store.coins < item.cost"
          @click="store.purchaseKingdomItem(item.id)"
        >
          {{ item.cost }} coins
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import {
  GEAR_CATALOG,
  KINGDOM_CATALOG,
  ownsGear,
} from '~/utils/rulerHooked/economy'

const store = useRulerHookedStore()
const tab = ref<'gear' | 'kingdom'>('gear')

const gearItems = computed(() =>
  GEAR_CATALOG.map((item) => ({
    ...item,
    owned: ownsGear(store.save?.flags ?? {}, item.id),
  })),
)
</script>
