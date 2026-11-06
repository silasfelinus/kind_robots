<!-- components/cthulhuquarium/cthulhuquarium-relics.vue
     The Relics room (cthulhuquarium/t-098): set pieces, the counted build
     layer (setSlotsCap sockets), and ornaments, the purely cosmetic decor that
     is placed by tapping the tank. Catalogues, costs and the slot cap are the
     store's; equipping and buying go through its actions. -->
<template>
  <div class="cq-relics-room">
    <div class="cq-relics-head">
      <div class="cq-market-switch" role="tablist" aria-label="Relics">
        <button
          type="button"
          role="tab"
          data-nav
          class="cq-switch-button"
          :aria-selected="view === 'sets'"
          @click="view = 'sets'"
        >
          Set pieces
        </button>
        <button
          type="button"
          role="tab"
          data-nav
          class="cq-switch-button"
          :aria-selected="view === 'decor'"
          @click="view = 'decor'"
        >
          Ornaments
          <span v-if="tankStore.placedDecor.length" class="cq-switch-count">{{
            tankStore.placedDecor.length
          }}</span>
        </button>
      </div>
      <div
        v-if="view === 'sets'"
        class="cq-sockets"
        role="meter"
        :aria-valuenow="tankStore.equippedSets.length"
        aria-valuemin="0"
        :aria-valuemax="tankStore.setSlotsCap"
        aria-label="Set piece slots in use"
      >
        <span
          v-for="slot in tankStore.setSlotsCap"
          :key="slot"
          class="cq-socket"
          :class="{ 'cq-socket-on': slot <= tankStore.equippedSets.length }"
        />
        <span class="cq-sockets-label tabular-nums"
          >{{ tankStore.equippedSets.length }}/{{
            tankStore.setSlotsCap
          }}
          set</span
        >
      </div>
      <p v-else class="cq-sockets-label">Drag anything placed to move it.</p>
    </div>

    <cthulhuquarium-bark :context="view === 'sets' ? 'sets' : 'decor'" />

    <div class="cq-relic-grid kr-scroll">
      <template v-if="view === 'sets'">
        <p v-if="tankStore.setCatalogLoading" class="cq-shelf-empty">
          Surveying the build layer…
        </p>
        <article
          v-for="entry in tankStore.setCatalog"
          v-else
          :key="entry.kind"
          class="cq-relic"
          :class="{ 'cq-relic-on': entry.equipped }"
        >
          <span class="cq-relic-art">
            <img
              v-if="artForSetKind(entry.kind)"
              :src="artForSetKind(entry.kind) ?? undefined"
              :alt="entry.title"
              loading="lazy"
            />
            <cthulhuquarium-ui-art v-else name="tab-relics" />
          </span>
          <div class="cq-relic-body">
            <h4 class="cq-plaque-title">{{ entry.title }}</h4>
            <p class="cq-plaque-text">{{ entry.description }}</p>
            <button
              v-if="entry.equipped"
              type="button"
              data-nav
              class="cq-plate-button cq-plate-button-quiet"
              @click="unequip(entry.kind)"
            >
              Set aside
            </button>
            <button
              v-else
              type="button"
              data-nav
              class="cq-price"
              :disabled="!canEquip(entry)"
              :aria-label="`Equip ${entry.title} for ${entry.cost} coins`"
              @click="tankStore.equipSet(entry.kind)"
            >
              <cthulhuquarium-ui-art name="coin" class="cq-price-coin" />
              <span class="tabular-nums">{{ entry.cost }}</span>
            </button>
          </div>
        </article>
        <p
          v-if="!tankStore.setCatalogLoading && !tankStore.setCatalog.length"
          class="cq-shelf-empty"
        >
          No set pieces to show right now.
        </p>
      </template>
      <template v-else>
        <p v-if="tankStore.decorCatalogLoading" class="cq-shelf-empty">
          Sorting through the driftwood…
        </p>
        <article
          v-for="entry in tankStore.decorCatalog"
          v-else
          :key="entry.kind"
          class="cq-relic"
          :class="{ 'cq-relic-on': tankStore.pendingDecorKind === entry.kind }"
        >
          <span class="cq-relic-art cq-relic-glyph" aria-hidden="true">
            <span>{{ entry.icon }}</span>
            <cthulhuquarium-ui-art name="plinth" class="cq-relic-plinth" />
          </span>
          <div class="cq-relic-body">
            <h4 class="cq-plaque-title">{{ entry.title }}</h4>
            <p class="cq-plaque-text">{{ entry.description }}</p>
            <button
              type="button"
              data-nav
              class="cq-price"
              :disabled="tankStore.coins < entry.cost"
              :aria-label="`Place ${entry.title} for ${entry.cost} coins`"
              @click="place(entry.kind)"
            >
              <cthulhuquarium-ui-art name="coin" class="cq-price-coin" />
              <span class="tabular-nums">{{ entry.cost }}</span>
            </button>
          </div>
        </article>
        <p
          v-if="
            !tankStore.decorCatalogLoading && !tankStore.decorCatalog.length
          "
          class="cq-shelf-empty"
        >
          Nothing to place right now.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useCthulhuquariumTankStore,
  type SetCatalogEntry,
} from '~/stores/cthulhuquariumTankStore'
import { artForSetKind } from '~/utils/cthulhuquariumArt'

const view = defineModel<'sets' | 'decor'>('view', { default: 'sets' })
const emit = defineEmits<{ placing: [] }>()

const tankStore = useCthulhuquariumTankStore()

function canEquip(entry: SetCatalogEntry): boolean {
  return (
    !entry.equipped &&
    tankStore.coins >= entry.cost &&
    tankStore.equippedSets.length < tankStore.setSlotsCap
  )
}

function unequip(kind: string) {
  const id = tankStore.equippedSets.find((entry) => entry.kind === kind)?.id
  if (id) void tankStore.unequipSet(id)
}

function place(kind: string) {
  tankStore.chooseDecorToPlace(kind)
  emit('placing')
}
</script>
