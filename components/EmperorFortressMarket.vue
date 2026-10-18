<template>
  <section class="kr-panel space-y-3 p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="font-serif text-2xl font-bold">The market</h2>
      <span class="text-sm opacity-75">
        {{ run.inventory.length }} unequipped item{{
          run.inventory.length === 1 ? '' : 's'
        }}
        in the storeroom · equip them in the barracks
      </span>
    </div>
    <div
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2"
    >
      <article
        v-for="item in ITEMS"
        :key="item.id"
        class="flex flex-col gap-1 rounded-xl border border-base-content/15 bg-base-100 p-3"
      >
        <span class="flex items-start justify-between gap-2">
          <strong class="font-serif text-lg">{{ item.name }}</strong>
          <span class="text-xs font-bold uppercase opacity-60">{{
            item.slot
          }}</span>
        </span>
        <p class="text-xs italic opacity-75">{{ item.text }}</p>
        <p class="text-sm font-semibold text-warning">{{ effect(item) }}</p>
        <button
          type="button"
          class="btn btn-sm btn-outline mt-auto"
          :disabled="run.brass < item.price"
          @click="buy(item.id)"
        >
          Buy · {{ item.price }} brass
        </button>
      </article>
    </div>
    <p v-if="message" class="kr-note p-2 text-sm" role="status">
      {{ message }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { ITEMS } from '~/utils/emperorOfDust/fortress/followers'
import type { FortressRun, ItemDef } from '~/utils/emperorOfDust/fortress/types'

defineProps<{ run: FortressRun }>()
const court = useEmperorFortressStore()
const message = ref('')

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
