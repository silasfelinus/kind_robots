<template>
  <div
    class="grid min-h-full grid-cols-[minmax(0,1fr)] gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]"
  >
    <div class="flex items-end @max-4xl:hidden">
      <p class="kr-panel px-3 py-2 text-sm italic">
        {{ run.inventory.length }} unequipped item{{
          run.inventory.length === 1 ? '' : 's'
        }}
        in the storeroom · equip them in the barracks
      </p>
    </div>
    <section class="kr-panel flex min-h-0 flex-col gap-2 p-3">
      <h2 class="sr-only">The market</h2>
      <div class="flex gap-1" role="group" aria-label="Market stock">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          class="btn btn-xs flex-1"
          :class="filter === tab.id ? 'btn-warning' : 'btn-outline'"
          :aria-pressed="filter === tab.id"
          @click="filter = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <p class="text-xs italic opacity-70 @4xl:hidden">
        {{ run.inventory.length }} unequipped in the storeroom · equip them in
        the barracks
      </p>
      <ul class="grid gap-1.5">
        <li
          v-for="item in shown"
          :key="item.id"
          class="flex items-center gap-3 rounded-md border border-warning/25 bg-base-200/70 p-2"
        >
          <span
            class="eod-medallion grid h-10 w-10 shrink-0 place-items-center rounded-md font-serif text-lg text-warning"
            aria-hidden="true"
            >{{ item.name.replace(/^The /, '').charAt(0) }}</span
          >
          <span class="min-w-0 flex-1">
            <strong class="block font-serif text-sm">{{ item.name }}</strong>
            <span class="block text-xs italic opacity-70">{{ item.text }}</span>
            <span class="block text-xs font-semibold text-warning">{{
              effect(item)
            }}</span>
          </span>
          <button
            type="button"
            class="eod-price shrink-0 px-2 py-1 text-sm font-bold"
            :disabled="run.brass < item.price"
            :aria-label="`Buy ${item.name} for ${item.price} brass`"
            @click="buy(item.id)"
          >
            <span
              class="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-current align-middle"
              aria-hidden="true"
            />{{ item.price }}
          </button>
        </li>
      </ul>
      <p v-if="message" class="kr-note p-2 text-sm" role="status">
        {{ message }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { ITEMS } from '~/utils/emperorOfDust/fortress/followers'
import type { FortressRun, ItemDef } from '~/utils/emperorOfDust/fortress/types'

defineProps<{ run: FortressRun }>()
const court = useEmperorFortressStore()
const message = ref('')

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'tool', label: 'Tools' },
  { id: 'charm', label: 'Charms' },
] as const
const filter = ref<(typeof TABS)[number]['id']>('all')
const shown = computed(() =>
  filter.value === 'all'
    ? ITEMS
    : ITEMS.filter((item) => item.slot === filter.value),
)

const ABILITY_TEXT: Record<string, string> = {
  'field-surgery': 'Injuries heal a day sooner',
  swift: 'Quests take a day less',
}

const effect = (item: ItemDef) =>
  [
    ...Object.entries(item.stats ?? {}).map(
      ([stat, amount]) => `+${amount} ${stat}`,
    ),
    ...(item.ability
      ? [ABILITY_TEXT[item.ability.kind] ?? item.ability.kind]
      : []),
  ].join(' · ')

function buy(id: string) {
  try {
    court.buy(id)
    message.value = 'Bought. It is waiting in the storeroom.'
  } catch (cause) {
    message.value =
      cause instanceof Error ? cause.message : 'That did not work.'
  }
}
</script>
