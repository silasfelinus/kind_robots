<template>
  <div class="grid gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
    <section class="@container space-y-3">
      <div class="kr-panel p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="font-serif text-2xl font-bold">The barracks</h2>
          <span class="text-sm font-bold text-warning">
            {{ bedsUsed(run) }} / {{ run.beds }} beds
          </span>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 @md:grid-cols-4">
          <button
            v-for="member in living"
            :key="member.id"
            type="button"
            class="flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-xs"
            :class="
              selectedId === member.id
                ? 'border-warning bg-warning/10'
                : 'border-base-content/15 bg-base-100'
            "
            :aria-pressed="selectedId === member.id"
            @click="selectedId = member.id"
          >
            <EmperorFortressPortrait
              :follower-id="member.id"
              :state="followerStatus(run, member.id) ?? 'ready'"
              :days="injuryDaysLeft(run, member.id)"
            />
            <span class="w-full truncate font-semibold">{{
              nameOf(member.id)
            }}</span>
          </button>
        </div>
        <div v-if="fallen.length" class="mt-4">
          <p class="text-xs font-semibold uppercase tracking-widest opacity-60">
            Remembered
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <EmperorFortressPortrait
              v-for="member in fallen"
              :key="member.id"
              :follower-id="member.id"
              state="dead"
              size="sm"
            />
          </div>
        </div>
        <button
          v-if="run.beds < 12"
          type="button"
          class="btn btn-outline btn-sm mt-4"
          @click="act(() => court.expandBarracks())"
        >
          Add beds ({{
            run.beds === 6
              ? '9 beds, 40 brass'
              : '12 beds, 80 brass, Gate Watch 12'
          }})
        </button>
      </div>

      <div v-if="run.recruitable.length" class="kr-panel p-4">
        <h3 class="font-serif text-xl font-bold">Waiting at the gate</h3>
        <ul class="mt-2 space-y-2">
          <li
            v-for="id in run.recruitable"
            :key="id"
            class="flex items-center justify-between gap-2 rounded-xl border border-base-content/15 bg-base-100 p-2 text-sm"
          >
            <span class="flex items-center gap-2">
              <EmperorFortressPortrait :follower-id="id" size="sm" />
              {{ nameOf(id) }}
            </span>
            <button
              type="button"
              class="btn btn-warning btn-xs"
              @click="act(() => court.hire(id))"
            >
              Hire · {{ followerDef(id)?.recruitFee ?? 0 }} brass
            </button>
          </li>
        </ul>
      </div>
    </section>

    <section v-if="def && state" class="@container kr-panel space-y-3 p-4">
      <div class="flex items-start gap-3">
        <EmperorFortressPortrait
          :follower-id="def.id"
          :state="followerStatus(run, def.id) ?? 'ready'"
          :days="injuryDaysLeft(run, def.id)"
          size="lg"
        />
        <div class="min-w-0">
          <h3 class="font-serif text-2xl font-bold">{{ def.name }}</h3>
          <p class="text-xs opacity-70">
            {{ def.species }} · {{ def.pronouns }} · from
            {{ originName(def.origin) }}
            <span v-if="def.romanceable"> · open to romance</span>
          </p>
          <p class="mt-1 text-xs font-semibold text-warning">
            {{ statusLine }}
          </p>
        </div>
      </div>
      <p class="text-sm">{{ def.biography }}</p>

      <ul class="grid grid-cols-5 gap-1 text-center text-xs">
        <li
          v-for="stat in STATS"
          :key="stat"
          class="rounded-lg bg-base-200 p-2"
        >
          <span class="block uppercase opacity-60">{{ stat }}</span>
          <strong class="font-serif text-xl">{{ def.stats[stat] }}</strong>
        </li>
      </ul>

      <div class="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">
        <strong>{{ def.ability.name }}</strong>
        <p class="text-xs opacity-80">{{ def.ability.text }}</p>
      </div>

      <div>
        <p class="text-sm font-bold">What the court knows</p>
        <ul class="mt-1 space-y-1 text-sm">
          <li v-for="trait in knownTraits" :key="trait.id">
            <span
              class="font-semibold"
              :class="trait.amount < 0 ? 'text-error' : 'text-success'"
              >{{ trait.name }}</span
            >
            <span class="text-xs opacity-75"> · {{ trait.text }}</span>
          </li>
          <li v-if="hiddenCount" class="text-xs opacity-60">
            {{ hiddenCount }} secret{{ hiddenCount === 1 ? '' : 's' }} not yet
            revealed. They show themselves when they matter.
          </li>
        </ul>
        <p v-if="modifiers.length" class="mt-1 text-xs opacity-75">
          {{ modifiers.join(' · ') }}
        </p>
      </div>

      <div class="grid gap-2 @md:grid-cols-2">
        <label v-for="slot in SLOTS" :key="slot" class="text-sm">
          <span class="block text-xs font-bold uppercase opacity-60">{{
            slot
          }}</span>
          <select
            class="select select-bordered select-sm w-full"
            :value="state.equipment[slot] ?? ''"
            :disabled="followerStatus(run, def.id) === 'on-quest'"
            @change="
              equip(slot, ($event.target as HTMLSelectElement).value || null)
            "
          >
            <option value="">Nothing</option>
            <option
              v-for="item in options(slot)"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </option>
          </select>
        </label>
      </div>
      <p v-if="error" class="kr-note kr-note-error p-2 text-sm" role="alert">
        {{ error }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import {
  bedsUsed,
  followerStatus,
  injuryDaysLeft,
  traitKnown,
} from '~/utils/emperorOfDust/fortress/engine'
import {
  KINGDOM_FACTION_DEFS,
  LOCAL_FACTION_DEFS,
} from '~/utils/emperorOfDust/fortress/factions'
import { followerDef, itemDef } from '~/utils/emperorOfDust/fortress/followers'
import { STATS } from '~/utils/emperorOfDust/fortress/types'
import type {
  FortressRun,
  ItemDef,
  ItemSlot,
} from '~/utils/emperorOfDust/fortress/types'

const SLOTS: ItemSlot[] = ['tool', 'charm']
const props = defineProps<{ run: FortressRun }>()
const court = useEmperorFortressStore()
const selectedId = ref<string | null>(props.run.roster[0]?.id ?? null)
const error = ref('')

const living = computed(() => props.run.roster.filter((state) => !state.dead))
const fallen = computed(() => props.run.roster.filter((state) => state.dead))
const state = computed(() =>
  props.run.roster.find(
    (entry) => entry.id === selectedId.value && !entry.dead,
  ),
)
const def = computed(() =>
  state.value ? followerDef(state.value.id) : undefined,
)
const knownTraits = computed(() =>
  (def.value?.traits ?? []).filter((trait) =>
    traitKnown(props.run, trait, court.codex.revealed),
  ),
)
const hiddenCount = computed(
  () => (def.value?.traits.length ?? 0) - knownTraits.value.length,
)
const modifiers = computed(() =>
  Object.entries(def.value?.factionModifiers ?? {}).map(
    ([id, amount]) =>
      `${amount! > 0 ? '+' : ''}${amount} with ${
        KINGDOM_FACTION_DEFS.find((faction) => faction.id === id)?.name ?? id
      }`,
  ),
)
const statusLine = computed(() => {
  if (!def.value) return ''
  const status = followerStatus(props.run, def.value.id)
  if (status === 'injured')
    return `Injured · ready in ${injuryDaysLeft(props.run, def.value.id)} day(s)`
  if (status === 'on-quest') return 'Away on a quest'
  return 'Ready'
})

const nameOf = (id: string) => followerDef(id)?.name ?? id
const originName = (id: string) =>
  KINGDOM_FACTION_DEFS.find((faction) => faction.id === id)?.name ??
  LOCAL_FACTION_DEFS.find((faction) => faction.id === id)?.name ??
  id
const options = (slot: ItemSlot) => {
  const equipped = state.value?.equipment[slot]
  const ids = [
    ...new Set([...props.run.inventory, ...(equipped ? [equipped] : [])]),
  ]
  return ids
    .map((id) => itemDef(id))
    .filter((item): item is ItemDef => item?.slot === slot)
}

function act(action: () => void) {
  error.value = ''
  try {
    action()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'That did not work.'
  }
}

function equip(slot: ItemSlot, itemId: string | null) {
  if (!def.value) return
  const id = def.value.id
  if (itemId === (state.value?.equipment[slot] ?? null)) return
  act(() => court.equip(id, slot, itemId))
}
</script>
