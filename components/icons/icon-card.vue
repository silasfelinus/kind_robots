<!-- /components/icons/icon-card.vue -->
<!--
  One Smart Icon, as a card.

  Extracted from icon-gallery.vue when that grid moved onto kr-gallery. The
  markup is unchanged; it only needed an owner, because a card inlined in a
  `#item` slot has to reach its record through the slot's GalleryItem and
  every reference becomes `iconById.get(Number(item.id))!`. A card component takes the
  record as a prop instead, which is the shape reward-card and bot-card already
  use.

  Presentational: it renders and emits, and reads no store. Membership of the
  smart bar is passed in rather than looked up, so this stays mountable in
  WonderLab with a plain fixture.

  MIGRATED onto kr-entity-card-body's icon variant (interface-vision t-104):
  this card's body -- art/glyph, title, badge -- was a hand-rolled duplicate
  of the row kr-entity-card-body already draws for every OTHER object's Icons
  gallery mode (bot/character/dream/reward/scenario-card all pass their mode
  straight through as `variant`). Smart Icons render a literal Icon glyph
  rather than stored art, so `source` is left unset and `placeholder-icon`
  carries the glyph -- kr-art-plate's existing no-src fallback already draws
  exactly that. The two actions (Edit Details, Add/Remove) are per-object, so
  they go through the new `#icon-actions` slot rather than the shared default
  slot (see that slot's own comment for why it isn't the default one).
-->
<template>
  <div
    class="relative rounded-2xl border-2 bg-base-100 p-3 shadow-md"
    :class="{
      'border-primary/30': icon.type === 'nav',
      'border-secondary/30': icon.type === 'utility',
      'border-base-300': !icon.type,
    }"
  >
    <kr-entity-card-body
      variant="icon"
      :title="icon.label || icon.title"
      :subtitle="icon.description ?? undefined"
      :badges="typeBadges"
      :placeholder-icon="icon.icon || 'kind-icon:help'"
    >
      <template #icon-actions>
        <div class="flex shrink-0 flex-col items-end gap-1">
          <button
            v-if="canEdit"
            class="text-[10px] text-blue-500 underline hover:text-blue-700"
            type="button"
            @click="emit('edit', icon)"
          >
            Edit Details
          </button>

          <button
            class="btn btn-xs rounded-xl"
            type="button"
            :class="{
              'btn-secondary': inSmartBar,
              'btn-outline': !inSmartBar,
            }"
            @click="emit('toggle', icon.id)"
          >
            {{ inSmartBar ? 'Remove' : 'Add' }}
          </button>
        </div>
      </template>
    </kr-entity-card-body>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SmartIcon } from '@/stores/smartbarStore'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'

const props = withDefaults(
  defineProps<{
    icon: SmartIcon
    inSmartBar?: boolean
    canEdit?: boolean
  }>(),
  {
    inSmartBar: false,
    canEdit: false,
  },
)

const emit = defineEmits<{
  edit: [icon: SmartIcon]
  toggle: [id: number]
}>()

/** Same nav/utility/unset color coding the old hand-rolled corner chip used. */
const typeBadges = computed<EntityCardChip[]>(() => [
  {
    label: props.icon.type || '?',
    class:
      props.icon.type === 'nav'
        ? 'badge-primary'
        : props.icon.type === 'utility'
          ? 'badge-secondary'
          : 'badge-neutral',
  },
])
</script>
