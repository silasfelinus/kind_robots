<template>
  <div
    class="grid min-h-full grid-cols-[minmax(0,1fr)] gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]"
  >
    <div class="flex flex-col justify-end gap-2 @max-4xl:hidden">
      <div class="kr-panel sticky bottom-0 max-w-md space-y-1.5 p-3">
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.2em] text-warning"
        >
          {{ heading }} · {{ windowLabel }}
        </p>
        <p
          v-for="line in stalls"
          :key="line"
          class="font-serif text-sm leading-snug"
        >
          {{ line }}
        </p>
        <p class="text-xs italic opacity-70">
          {{ restockLine }} · {{ run.inventory.length }} in the storeroom
        </p>
      </div>
    </div>

    <section class="kr-panel flex min-h-0 flex-col gap-2 p-3">
      <h2 class="sr-only">{{ heading }}</h2>
      <p class="font-serif text-sm leading-snug @4xl:hidden">
        <span class="text-warning">{{ windowLabel }}.</span> {{ stalls[0] }}
      </p>
      <div class="grid grid-cols-5 gap-1" role="group" aria-label="Market">
        <button
          v-for="entry in TABS"
          :key="entry.id"
          type="button"
          class="btn btn-xs px-0"
          :class="tab === entry.id ? 'btn-warning' : 'btn-outline'"
          :aria-pressed="tab === entry.id"
          @click="open(entry.id)"
        >
          {{ entry.label }}
        </button>
      </div>
      <p v-if="message" class="kr-note p-2 text-sm" role="status">
        {{ message }}
      </p>
      <div
        v-if="tab === 'buy' || tab === 'all'"
        class="flex gap-1"
        role="group"
        aria-label="Slot"
      >
        <button
          v-for="entry in SLOT_FILTERS"
          :key="entry.id"
          type="button"
          class="btn btn-ghost btn-xs"
          :class="slot === entry.id ? 'text-warning underline' : 'opacity-70'"
          :aria-pressed="slot === entry.id"
          @click="slot = entry.id"
        >
          {{ entry.label }}
        </button>
      </div>

      <ul v-if="tab === 'buy'" class="grid gap-1.5">
        <EmperorFortressMarketRow
          v-for="item in stockShown"
          :key="item.id"
          :item="item"
          :price="item.price"
          :label="`Buy ${item.name} for ${item.price} brass`"
          :disabled="sold.includes(item.id) || run.brass < item.price"
          :muted="sold.includes(item.id)"
          :note="buyNote(item)"
          @act="buy(item)"
        />
        <li v-if="!stockShown.length" class="p-2 text-sm italic opacity-70">
          Nothing of that kind on the stalls.
        </li>
      </ul>

      <ul v-else-if="tab === 'sell'" class="grid gap-1.5">
        <EmperorFortressMarketRow
          v-for="entry in storeroom"
          :key="entry.item.id"
          :item="entry.item"
          :price="sellPrice(entry.item)"
          :label="`Sell ${entry.item.name} for ${sellPrice(entry.item)} brass`"
          :note="entry.count > 1 ? `${entry.count} in the storeroom` : ''"
          @act="sell(entry.item)"
        />
        <li v-if="!storeroom.length" class="p-2 text-sm italic opacity-70">
          The storeroom is empty. Gear a follower carries comes off under
          Equipment first.
        </li>
      </ul>

      <ul v-else-if="tab === 'equipment'" class="grid gap-1.5">
        <li
          v-for="member in atCourt"
          :key="member.id"
          class="flex flex-wrap items-center gap-2 rounded-md border border-warning/25 bg-base-200/70 p-2"
        >
          <EmperorFortressPortrait
            :follower-id="member.id"
            :state="followerStatus(run, member.id) ?? 'ready'"
            :days="injuryDaysLeft(run, member.id)"
            size="sm"
          />
          <span class="min-w-0 flex-1">
            <strong class="block truncate font-serif text-sm">{{
              nameOf(member.id)
            }}</strong>
            <span class="block truncate text-xs opacity-70">{{
              carried(member.id)
            }}</span>
          </span>
          <span class="grid w-full grid-cols-2 gap-1 @xs:w-auto">
            <select
              v-for="part in SLOTS"
              :key="part"
              class="select select-bordered select-xs w-full @xs:w-32"
              :aria-label="`${nameOf(member.id)}: ${part}`"
              :value="member.equipment[part] ?? ''"
              :disabled="followerStatus(run, member.id) === 'on-quest'"
              @change="
                equip(
                  member.id,
                  part,
                  ($event.target as HTMLSelectElement).value || null,
                )
              "
            >
              <option value="">{{ part }}: nothing</option>
              <option
                v-for="item in options(member.id, part)"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
              </option>
            </select>
          </span>
        </li>
      </ul>

      <div v-else-if="tab === 'treatments'" class="grid gap-2">
        <p class="text-xs italic opacity-75">
          Kiyo's infirmary can restore a wounded follower for brass from the
          first day. The surgeon closes one day of a wound.
          <span v-if="medicine">Saltroad medicine: a quarter off.</span>
          <span v-if="poultice">
            A Mire poultice is cheap and does not always take. The Abbey
            hears.</span
          >
        </p>
        <ul class="grid gap-1.5">
          <li
            v-for="member in wounded"
            :key="member.id"
            class="flex flex-wrap items-center gap-2 rounded-md border border-warning/25 bg-base-200/70 p-2"
          >
            <EmperorFortressPortrait
              :follower-id="member.id"
              state="injured"
              :days="injuryDaysLeft(run, member.id)"
              size="sm"
            />
            <span class="min-w-[8rem] flex-1">
              <strong class="block truncate font-serif text-sm">{{
                nameOf(member.id)
              }}</strong>
              <span class="block text-xs opacity-70"
                >{{ injuryDaysLeft(run, member.id) }} day(s) to heal{{
                  treated.includes(member.id) ? ' · seen today' : ''
                }}</span
              >
            </span>
            <span class="flex gap-1">
              <button
                v-for="kind in kinds"
                :key="kind"
                type="button"
                class="eod-price whitespace-nowrap px-2 py-1 text-xs font-bold"
                :disabled="!!treatmentBlocker(run, member.id, kind)"
                :title="treatmentBlocker(run, member.id, kind) ?? ''"
                :aria-label="`${TREATMENT_LABEL[kind]} for ${nameOf(member.id)}, ${treatmentPrice(run, member.id, kind)} brass`"
                @click="treat(member.id, kind)"
              >
                {{ TREATMENT_LABEL[kind] }}
                <span
                  class="mx-0.5 inline-block h-2 w-2 rounded-full border-2 border-current align-middle"
                  aria-hidden="true"
                />{{ treatmentPrice(run, member.id, kind) }}
              </button>
            </span>
          </li>
          <li v-if="!wounded.length" class="p-2 text-sm italic opacity-70">
            Nobody at court is wounded.
          </li>
        </ul>
        <div
          class="flex items-center gap-3 rounded-md border border-warning/25 bg-base-200/70 p-2"
        >
          <span
            class="eod-medallion grid h-11 w-11 shrink-0 place-items-center rounded-md"
            aria-hidden="true"
          >
            <Icon name="kind-icon:blueprint" class="h-5 w-5 text-warning" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block font-serif text-sm">The carpenters</strong>
            <span class="block text-xs italic opacity-75">{{ bedLine }}</span>
          </span>
          <button
            v-if="bedUpgrade"
            type="button"
            class="eod-price shrink-0 px-2 py-1 text-sm font-bold"
            :disabled="!!bedBlocker"
            :title="bedBlocker"
            :aria-label="`Build ${bedUpgrade.beds} beds for ${bedUpgrade.cost} brass`"
            @click="expand"
          >
            <span
              class="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-current align-middle"
              aria-hidden="true"
            />{{ bedUpgrade.cost }}
          </button>
        </div>
      </div>

      <ul v-else class="grid gap-1.5">
        <EmperorFortressMarketRow
          v-for="item in catalogShown"
          :key="item.id"
          :item="item"
          :price="stock.includes(item.id) ? item.price : null"
          :label="`Buy ${item.name} for ${item.price} brass`"
          :disabled="sold.includes(item.id) || run.brass < item.price"
          :muted="!stock.includes(item.id) || sold.includes(item.id)"
          :note="catalogNote(item)"
          @act="buy(item)"
        />
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import {
  BED_UPGRADES,
  followerStatus,
  injuryDaysLeft,
} from '~/utils/emperorOfDust/fortress/engine'
import { LAST_DAY } from '~/utils/emperorOfDust/fortress/content'
import { followerDef } from '~/utils/emperorOfDust/fortress/followers'
import { ITEMS, itemDef } from '~/utils/emperorOfDust/fortress/items'
import {
  boughtThisWindow,
  effectReactions,
  isPeddler,
  itemEffects,
  marketStock,
  marketWindow,
  nextRestockDay,
  poulticeOffered,
  saltroadMedicine,
  sellPrice,
  stallLines,
  stockBlocker,
  treatedToday,
  treatmentBlocker,
  treatmentPrice,
} from '~/utils/emperorOfDust/fortress/market'
import type { TreatmentKind } from '~/utils/emperorOfDust/fortress/market'
import type {
  FortressRun,
  ItemDef,
  ItemSlot,
} from '~/utils/emperorOfDust/fortress/types'

const props = defineProps<{ run: FortressRun }>()
const court = useEmperorFortressStore()
const message = ref('')

const TABS = [
  { id: 'buy', label: 'Buy' },
  { id: 'sell', label: 'Sell' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'treatments', label: 'Treatments' },
  { id: 'all', label: 'All' },
] as const
type Tab = (typeof TABS)[number]['id']
const tab = ref<Tab>('buy')
const SLOT_FILTERS = [
  { id: 'any', label: 'Everything' },
  { id: 'tool', label: 'Tools' },
  { id: 'charm', label: 'Charms' },
] as const
const slot = ref<(typeof SLOT_FILTERS)[number]['id']>('any')
const SLOTS: readonly ItemSlot[] = ['tool', 'charm']
const TREATMENT_LABEL: Record<TreatmentKind, string> = {
  surgeon: 'Surgeon',
  poultice: 'Poultice',
  infirmary: 'Kiyo · full recovery',
}

const heading = computed(() =>
  isPeddler(props.run) ? 'The peddler' : 'The market',
)
const windowLabel = computed(() => {
  const first =
    [...Array(props.run.day).keys()]
      .map((i) => i + 1)
      .find((day) => marketWindow(day) === marketWindow(props.run.day)) ??
    props.run.day
  const last = nextRestockDay(props.run.day) - 1
  return first === last ? `Day ${first}` : `Days ${first}–${last}`
})
const restockLine = computed(() => {
  const day = nextRestockDay(props.run.day)
  return day > LAST_DAY ? 'The last stalls' : `New stock on Day ${day}`
})
const stalls = computed(() => stallLines(props.run))
const stock = computed(() => marketStock(props.run))
const sold = computed(() => boughtThisWindow(props.run))
const treated = computed(() => treatedToday(props.run))
const medicine = computed(() => saltroadMedicine(props.run))
const poultice = computed(() => poulticeOffered(props.run))
const kinds = computed<TreatmentKind[]>(() =>
  poultice.value
    ? ['infirmary', 'surgeon', 'poultice']
    : ['infirmary', 'surgeon'],
)

const bySlot = (item: ItemDef) =>
  slot.value === 'any' || item.slot === slot.value
const stockShown = computed(() =>
  stock.value
    .map((id) => itemDef(id))
    .filter((item): item is ItemDef => !!item && bySlot(item)),
)
const catalogShown = computed(() =>
  [...ITEMS]
    .filter(bySlot)
    .sort(
      (a, b) =>
        Number(!stock.value.includes(a.id)) -
        Number(!stock.value.includes(b.id)),
    ),
)
const storeroom = computed(() => {
  const counts = new Map<string, number>()
  for (const id of props.run.inventory)
    counts.set(id, (counts.get(id) ?? 0) + 1)
  return [...counts.entries()]
    .map(([id, count]) => ({ item: itemDef(id), count }))
    .filter((entry): entry is { item: ItemDef; count: number } => !!entry.item)
})
const atCourt = computed(() =>
  props.run.roster.filter((state) => !state.dead && !state.departed),
)
const wounded = computed(() =>
  props.run.roster.filter(
    (state) => followerStatus(props.run, state.id) === 'injured',
  ),
)

const bedUpgrade = computed(() => {
  if (props.run.beds === 12) return null
  const beds = props.run.beds === 6 ? 9 : 12
  return { beds, ...BED_UPGRADES[beds] }
})
const bedBlocker = computed(() => {
  const next = bedUpgrade.value
  if (!next) return ''
  if (props.run.brass < next.cost) return `Needs ${next.cost} brass`
  if (props.run.local['gate-watch'] < next.gateWatch)
    return `Needs Gate Watch ${next.gateWatch}`
  return ''
})
const bedLine = computed(() => {
  const next = bedUpgrade.value
  if (!next) return `${props.run.beds} beds. No room for more.`
  const watch = next.gateWatch
    ? `, and the Gate Watch at ${next.gateWatch}`
    : ''
  return `${props.run.beds} beds now. ${next.beds} for ${next.cost} brass${watch}.`
})

const nameOf = (id: string) => followerDef(id)?.name ?? id
const carried = (id: string) => {
  const state = props.run.roster.find((entry) => entry.id === id)
  const items = Object.values(state?.equipment ?? {})
    .map((itemId) => (itemId ? itemDef(itemId) : undefined))
    .filter((item): item is ItemDef => !!item)
  return items.length
    ? items.map((item) => itemEffects(item).join(', ')).join(' · ')
    : 'Carries nothing'
}
const options = (followerId: string, part: ItemSlot) => {
  const equipped = props.run.roster.find((entry) => entry.id === followerId)
    ?.equipment[part]
  const ids = [
    ...new Set([...props.run.inventory, ...(equipped ? [equipped] : [])]),
  ]
  return ids
    .map((id) => itemDef(id))
    .filter((item): item is ItemDef => item?.slot === part)
}

const reaction = (item: ItemDef) => {
  const parts = effectReactions(item.onBuy)
  return parts.length ? `Word gets out: ${parts.join(', ')}` : ''
}
const buyNote = (item: ItemDef) =>
  sold.value.includes(item.id)
    ? 'Sold. The stall has no other.'
    : reaction(item)
const catalogNote = (item: ItemDef) => {
  if (sold.value.includes(item.id)) return 'Sold this week.'
  if (stock.value.includes(item.id)) return reaction(item) || 'On the stalls.'
  return stockBlocker(props.run, item) ?? 'Not laid out this week.'
}

function open(id: Tab) {
  tab.value = id
  message.value = ''
}

function attempt(action: () => string) {
  try {
    message.value = action()
  } catch (cause) {
    message.value =
      cause instanceof Error ? cause.message : 'That did not work.'
  }
}

const buy = (item: ItemDef) =>
  attempt(() => {
    court.buy(item.id)
    return `${item.name}. It waits in the storeroom.`
  })
const sell = (item: ItemDef) =>
  attempt(() => {
    court.sell(item.id)
    return `${item.name} sold for ${sellPrice(item)} brass.`
  })
const treat = (followerId: string, kind: TreatmentKind) =>
  attempt(() => court.treat(followerId, kind))
const expand = () =>
  attempt(() => {
    court.expandBarracks()
    return `The carpenters work all night. ${court.run?.beds ?? props.run.beds} beds.`
  })
const equip = (followerId: string, part: ItemSlot, itemId: string | null) =>
  attempt(() => {
    court.equip(followerId, part, itemId)
    return itemId
      ? `${nameOf(followerId)} takes the ${itemDef(itemId)?.name ?? itemId}.`
      : `${nameOf(followerId)} hands it back.`
  })
</script>
