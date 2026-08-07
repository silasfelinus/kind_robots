<!-- /components/icons/icon-card.vue -->
<!--
  One Smart Icon, as a card.

  Extracted from icon-gallery.vue when that grid moved onto kr-gallery. The
  markup is unchanged; it only needed an owner, because a card inlined in a
  `#item` slot has to reach its record through the slot's GalleryItem and every
  reference becomes `iconById.get(Number(item.id))!`. A card component takes the
  record as a prop instead, which is the shape reward-card and bot-card already
  use.

  Presentational: it renders and emits, and reads no store. Membership of the
  smart bar is passed in rather than looked up, so this stays mountable in
  WonderLab with a plain fixture.
-->
<template>
  <div
    class="relative group p-4 border-2 rounded-2xl bg-base-100 shadow-md flex flex-col items-center gap-2"
    :class="{
      'border-primary/30': icon.type === 'nav',
      'border-secondary/30': icon.type === 'utility',
      'border-base-300': !icon.type,
    }"
  >
    <span
      class="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
      :class="{
        'bg-primary/10 text-primary': icon.type === 'nav',
        'bg-secondary/10 text-secondary': icon.type === 'utility',
        'bg-base-300 text-base-content/40': !icon.type,
      }"
    >
      {{ icon.type || '?' }}
    </span>

    <Icon :name="icon.icon || 'kind-icon:help'" class="text-4xl mt-3" />

    <div class="text-center text-sm font-medium">
      {{ icon.label || icon.title }}
    </div>

    <div v-if="icon.description" class="text-center text-sm font-medium">
      {{ icon.description }}
    </div>

    <button
      v-if="canEdit"
      class="mt-1 text-[10px] underline text-blue-500 hover:text-blue-700"
      @click="emit('edit', icon)"
    >
      Edit Details
    </button>

    <button
      class="btn btn-xs mt-1 rounded-xl"
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

<script setup lang="ts">
import type { SmartIcon } from '@/stores/smartbarStore'

withDefaults(
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
</script>
