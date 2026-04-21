<template>
  <div class="gallery">
    <div class="gallery-header">
      <span class="gallery-title">field guide</span>
      <span class="gallery-count">{{ caughtCount }} / {{ slots.length }}</span>
    </div>

    <div class="gallery-grid">
      <div
        v-for="slot in slots"
        :key="slot.rarityNumber"
        class="gallery-slot"
        :class="{ caught: !!slot.butterfly }"
        :title="
          slot.butterfly
            ? slot.butterfly.name
            : `#${String(slot.rarityNumber).padStart(3, '0')} — not yet caught`
        "
        @click="slot.butterfly && $emit('inspect', slot.butterfly)"
      >
        <template v-if="slot.butterfly">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="26"
            viewBox="0 0 36 28"
            :aria-label="slot.butterfly.name"
          >
            <ellipse
              cx="9"
              cy="10"
              rx="9"
              ry="6"
              :fill="slot.butterfly.wingTopColor"
              opacity="0.9"
            />
            <ellipse
              cx="27"
              cy="10"
              rx="9"
              ry="6"
              :fill="slot.butterfly.wingTopColor"
              opacity="0.9"
            />
            <ellipse
              cx="8"
              cy="18"
              rx="7"
              ry="5"
              :fill="slot.butterfly.wingBottomColor"
              opacity="0.8"
            />
            <ellipse
              cx="28"
              cy="18"
              rx="7"
              ry="5"
              :fill="slot.butterfly.wingBottomColor"
              opacity="0.8"
            />
            <ellipse
              cx="18"
              cy="14"
              rx="2"
              ry="6"
              fill="#2c2c2a"
              opacity="0.8"
            />
          </svg>
        </template>
        <template v-else>
          <span class="slot-num">{{
            String(slot.rarityNumber).padStart(2, '0')
          }}</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Butterfly } from '~/stores/helpers/butterflyHelper'

/**
 * GallerySlot represents one entry in the collectible grid.
 * butterfly is null until the user catches it (populated from UserButterfly join).
 */
export interface GallerySlot {
  rarityNumber: number
  butterfly: Butterfly | null
}

const props = defineProps<{
  /**
   * Pass the full ordered slot list — sourced from the DB.
   * Uncaught slots have butterfly: null.
   * Derive this in the parent by fetching the user's UserButterfly records
   * and merging with the full Butterfly roster, ordered by rarityNumber.
   */
  slots: GallerySlot[]
}>()

defineEmits<{
  /** user clicked a caught butterfly — parent can open detail view */
  inspect: [butterfly: Butterfly]
}>()

const caughtCount = computed(
  () => props.slots.filter((s) => s.butterfly !== null).length,
)
</script>

<style scoped>
.gallery {
  padding: 12px 16px 16px;
}

.gallery-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.gallery-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary, #888);
  letter-spacing: 0.06em;
  text-transform: lowercase;
}

.gallery-count {
  font-size: 12px;
  color: #1d9e75;
  font-weight: 500;
}

.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gallery-slot {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  border: 1.5px dashed #b4b2a9;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.15s,
    border-color 0.15s,
    background 0.15s;
  cursor: default;
}

.gallery-slot.caught {
  border-style: solid;
  border-color: #1d9e75;
  background: rgba(29, 158, 117, 0.06);
  cursor: pointer;
}

.gallery-slot.caught:hover {
  transform: scale(1.12);
  background: rgba(29, 158, 117, 0.12);
}

.slot-num {
  font-size: 10px;
  color: #b4b2a9;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
</style>
