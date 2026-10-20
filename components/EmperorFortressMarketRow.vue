<template>
  <li
    class="flex items-center gap-3 rounded-md border border-warning/25 bg-base-200/70 p-2"
    :class="muted ? 'opacity-60' : ''"
  >
    <span
      class="eod-medallion grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md"
      :title="itemSource(item)"
      aria-hidden="true"
    >
      <img
        v-if="ITEM_ART.has(item.id)"
        :src="`/emperor-of-dust/items/${item.id}.webp`"
        alt=""
        class="h-full w-full object-cover"
      />
      <Icon
        v-else
        :name="itemIcon(item)"
        class="h-5 w-5"
        :class="SELLER_TONE[item.faction ?? 'stores']"
      />
    </span>
    <span class="min-w-0 flex-1">
      <strong class="block font-serif text-sm leading-tight"
        >{{ item.name }}
        <span
          class="ml-1 align-middle text-[10px] font-normal uppercase tracking-widest opacity-60"
          >{{ item.slot }} · {{ itemSource(item) }}</span
        ></strong
      >
      <span class="block text-xs italic opacity-75">{{ item.text }}</span>
      <span class="block text-xs font-semibold text-warning">{{
        itemEffects(item).join(' · ')
      }}</span>
      <span v-if="note" class="block text-xs opacity-75">{{ note }}</span>
    </span>
    <button
      v-if="price !== null"
      type="button"
      class="eod-price shrink-0 whitespace-nowrap px-2 py-1 text-sm font-bold"
      :disabled="disabled"
      :aria-label="label"
      @click="emit('act')"
    >
      <span
        class="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-current align-middle"
        aria-hidden="true"
      />{{ price }}
    </button>
  </li>
</template>

<script setup lang="ts">
import { ITEM_ART, itemIcon } from '~/utils/emperorOfDust/fortress/items'
import { itemEffects, itemSource } from '~/utils/emperorOfDust/fortress/market'
import type { ItemDef } from '~/utils/emperorOfDust/fortress/types'

withDefaults(
  defineProps<{
    item: ItemDef
    price?: number | null
    label?: string
    disabled?: boolean
    note?: string
    muted?: boolean
  }>(),
  { price: null, label: '', disabled: false, note: '', muted: false },
)
const emit = defineEmits<{ act: [] }>()

const SELLER_TONE: Record<string, string> = {
  stores: 'text-warning',
  'hollow-bell': 'text-warning',
  abbey: 'text-base-content',
  'storm-crows': 'text-info',
  'mire-mothers': 'text-success',
  jackalwire: 'text-error',
  saltroad: 'text-accent',
  freeholds: 'text-success',
  moles: 'text-secondary',
  rustline: 'text-primary',
  'black-verge': 'text-secondary',
}
</script>
