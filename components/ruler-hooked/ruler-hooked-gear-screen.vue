<!-- The tackle room: gear upgrades and kingdom works, each a painted item
     card. Purchases go through the store's existing Effect-reducer actions. -->
<template>
  <section class="rh-screen rh-gear" aria-label="Royal tackle room">
    <RulerHookedArt
      class="rh-backdrop rh-gear__backdrop"
      :candidates="BACKDROPS.gear"
      eager
    />
    <div class="rh-gear__sheet rh-parchment">
      <header class="rh-gear__head">
        <div>
          <p class="rh-eyebrow">The royal tackle room</p>
          <h2 class="rh-title rh-title--big">Gear &amp; kingdom works</h2>
        </div>
        <div class="rh-gear__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'gear'"
            :class="{ 'is-on': tab === 'gear' }"
            @click="tab = 'gear'"
          >
            Tackle
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="tab === 'kingdom'"
            :class="{ 'is-on': tab === 'kingdom' }"
            @click="tab = 'kingdom'"
          >
            Kingdom works
          </button>
        </div>
      </header>

      <ul class="rh-gear__grid">
        <li
          v-for="item in items"
          :key="item.id"
          class="rh-item"
          :class="{ 'is-owned': item.owned }"
        >
          <RulerHookedArt
            class="rh-item__art"
            :candidates="shopCandidates(item.id)"
            :alt="item.name"
            :initial="item.name.charAt(0)"
          />
          <div class="rh-item__copy">
            <h3>{{ item.name }}</h3>
            <p>{{ item.description }}</p>
            <p v-if="item.effects.length" class="rh-item__effects">
              <span
                v-for="e in item.effects"
                :key="e.key"
                class="rh-chip is-up"
              >
                <RulerHookedGlyph :name="e.key" />+{{ e.value }}
              </span>
            </p>
          </div>
          <button
            type="button"
            class="rh-btn"
            :class="{ 'rh-btn--gold': !item.owned && coins >= item.cost }"
            :disabled="item.owned || coins < item.cost"
            @click="buy(item.id)"
          >
            <template v-if="item.owned">Owned</template>
            <template v-else
              ><RulerHookedGlyph name="coin" />{{ item.cost }}</template
            >
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRulerHookedStore } from '~/stores/rulerHookedStore'
import { BACKDROPS, shopCandidates } from '~/utils/rulerHooked/artLibrary'
import {
  GEAR_CATALOG,
  KINGDOM_CATALOG,
  ownsGear,
} from '~/utils/rulerHooked/economy'
import type { AxisKey } from '~/types/ruler-hooked'

const store = useRulerHookedStore()
const tab = ref<'gear' | 'kingdom'>('gear')
const coins = computed(() => store.coins)

const items = computed(() =>
  tab.value === 'gear'
    ? GEAR_CATALOG.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        cost: g.cost,
        owned: ownsGear(store.save?.flags ?? {}, g.id),
        effects: [] as { key: AxisKey; value: number }[],
      }))
    : KINGDOM_CATALOG.map((k) => ({
        id: k.id,
        name: k.name,
        description: k.description,
        cost: k.cost,
        owned: false,
        effects: Object.entries(k.sliders).map(([key, value]) => ({
          key: key as AxisKey,
          value: value ?? 0,
        })),
      })),
)

function buy(id: string) {
  if (tab.value === 'gear') store.purchaseGear(id)
  else store.purchaseKingdomItem(id)
}
</script>

<style scoped>
.rh-gear__backdrop {
  filter: brightness(0.65) saturate(0.85);
}
.rh-gear__sheet {
  position: absolute;
  z-index: 2;
  inset: clamp(4.25rem, 11cqi, 5.5rem) clamp(0.5rem, 2.5cqi, 2rem)
    clamp(0.5rem, 2cqi, 1.25rem);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  scrollbar-width: thin;
}
.rh-gear__head {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.6rem;
}
.rh-gear__tabs {
  display: flex;
  gap: 0.3rem;
}
.rh-gear__tabs button {
  min-height: 2.5rem;
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  font-weight: 700;
  border: 1.5px solid rgb(58 38 22 / 0.35);
}
.rh-gear__tabs button.is-on {
  background: var(--rh-plum);
  color: var(--rh-gold-soft);
  border-color: var(--rh-gold);
}
.rh-gear__grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
}
.rh-item {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.8rem;
  background: rgb(255 250 240 / 0.75);
  border: 1.5px solid rgb(58 38 22 / 0.25);
  box-shadow: 0 4px 10px rgb(58 38 22 / 0.18);
}
.rh-item__art {
  aspect-ratio: 7 / 4;
  border-radius: 0.55rem;
}
.rh-item__copy h3 {
  font-family: var(--rh-display);
  font-weight: 700;
  font-size: 1.05rem;
}
.rh-item__copy p {
  font-size: 0.82rem;
  line-height: 1.35;
}
.rh-item__effects {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.3rem;
}
.rh-item.is-owned {
  opacity: 0.75;
}
.rh-gear__sheet {
  left: var(--rh-sheet-left, clamp(0.5rem, 2.5cqi, 2rem));
}
</style>
