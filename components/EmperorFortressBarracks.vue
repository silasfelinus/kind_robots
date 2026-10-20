<template>
  <div
    class="grid min-h-full grid-cols-[minmax(0,1fr)] gap-3 @4xl:grid-cols-[minmax(13rem,15rem)_minmax(0,1fr)_minmax(19rem,24rem)]"
  >
    <section class="flex min-h-0 flex-col gap-3">
      <div class="kr-panel p-2">
        <p
          class="flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75"
        >
          <span>Followers</span>
          <span class="text-warning"
            >{{ bedsUsed(run) }} / {{ run.beds }} beds</span
          >
        </p>
        <ul
          class="mt-1 flex gap-1 overflow-x-auto pb-1 @4xl:flex-col @4xl:overflow-visible"
        >
          <li v-for="member in living" :key="member.id" class="shrink-0">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-md border px-1.5 py-1 text-left text-xs transition-colors"
              :class="
                selectedId === member.id
                  ? 'border-warning bg-warning/15'
                  : 'border-transparent hover:border-warning/40'
              "
              :aria-pressed="selectedId === member.id"
              @click="selectedId = member.id"
            >
              <EmperorFortressPortrait
                :follower-id="member.id"
                :state="followerStatus(run, member.id) ?? 'ready'"
                :days="injuryDaysLeft(run, member.id)"
                size="sm"
              />
              <span class="min-w-0 pr-1">
                <strong class="block truncate font-serif text-sm">{{
                  nameOf(member.id)
                }}</strong>
                <span class="block truncate opacity-65">{{
                  shortStatus(member.id)
                }}</span>
              </span>
            </button>
          </li>
        </ul>
        <div v-if="fallen.length" class="mt-2 px-1">
          <p
            class="text-[10px] font-semibold uppercase tracking-widest opacity-60"
          >
            Remembered
          </p>
          <div class="mt-1 flex flex-wrap gap-1">
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
          class="btn btn-outline btn-xs mt-2 w-full"
          @click="act(() => court.expandBarracks())"
        >
          Add beds ({{
            run.beds === 6
              ? '9 beds, 40 brass'
              : '12 beds, 80 brass, Gate Watch 12'
          }})
        </button>
      </div>

      <div v-if="run.recruitable.length" class="kr-panel p-2">
        <p
          class="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75"
        >
          Waiting at the gate
        </p>
        <ul class="mt-1 space-y-1">
          <li
            v-for="id in run.recruitable"
            :key="id"
            class="flex items-center justify-between gap-2 px-1 text-xs"
          >
            <span class="flex min-w-0 items-center gap-2">
              <EmperorFortressPortrait :follower-id="id" size="sm" />
              <span class="truncate">{{ nameOf(id) }}</span>
            </span>
            <button
              type="button"
              class="btn btn-warning btn-xs shrink-0"
              @click="act(() => court.hire(id))"
            >
              Hire · {{ followerDef(id)?.recruitFee ?? 0 }}
            </button>
          </li>
        </ul>
      </div>
    </section>

    <figure
      v-if="art && def"
      class="pointer-events-none relative hidden min-h-0 items-end justify-center @4xl:flex"
    >
      <img
        :key="art"
        :src="art"
        :alt="def.name + ' in the barracks'"
        class="eod-figure absolute inset-x-0 bottom-0 mx-auto block h-full w-auto object-contain"
      />
    </figure>
    <div v-else class="hidden @4xl:block" />

    <section v-if="def && state" class="@container kr-panel space-y-3 p-4">
      <div class="flex items-start gap-3">
        <span
          class="h-20 w-16 shrink-0 overflow-hidden rounded-md border border-warning/50 bg-base-200"
        >
          <img
            v-if="art"
            :src="art"
            alt=""
            class="h-full w-full object-cover object-top"
          />
        </span>
        <div class="min-w-0">
          <h2 class="font-serif text-2xl font-bold text-warning">
            {{ def.name }}
          </h2>
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
      <p
        v-if="talkLine"
        class="border-l-2 border-warning/60 pl-3 font-serif text-sm italic"
      >
        “{{ talkLine }}”
      </p>
      <p class="text-sm opacity-85">{{ def.biography }}</p>

      <ul class="space-y-1 text-xs">
        <li
          v-for="stat in STATS"
          :key="stat"
          class="flex items-center justify-between gap-2"
        >
          <span
            class="w-14 font-semibold uppercase tracking-wider opacity-70"
            >{{ stat }}</span
          >
          <span
            class="flex flex-1 justify-end gap-0.5"
            role="img"
            :aria-label="`${stat} ${def.stats[stat]} of ${PIPS}`"
          >
            <span
              v-for="pip in PIPS"
              :key="pip"
              class="h-2 w-2 rounded-full border border-warning/60"
              :class="pip <= def.stats[stat] ? 'bg-warning' : ''"
            />
          </span>
          <strong class="w-5 text-right">{{ def.stats[stat] }}</strong>
        </li>
      </ul>

      <div class="rounded-md border border-warning/30 bg-warning/5 p-2 text-sm">
        <strong class="text-warning">{{ def.ability.name }}</strong>
        <p class="text-xs opacity-80">{{ def.ability.text }}</p>
      </div>

      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70"
        >
          Traits
        </p>
        <ul class="mt-1 flex flex-wrap gap-1">
          <li
            v-for="trait in knownTraits"
            :key="trait.id"
            class="rounded border px-2 py-0.5 text-xs"
            :class="
              trait.amount < 0
                ? 'border-error/50 text-error'
                : 'border-success/50 text-success'
            "
            :title="trait.text"
          >
            {{ trait.name }}
          </li>
          <li
            v-if="hiddenCount"
            class="rounded border border-dashed border-base-content/30 px-2 py-0.5 text-xs opacity-70"
            :title="`${hiddenCount} secret${hiddenCount === 1 ? '' : 's'} not yet revealed. They show themselves when they matter.`"
          >
            {{ hiddenCount }} unknown
          </li>
        </ul>
        <p v-if="modifiers.length" class="mt-1 text-xs opacity-75">
          {{ modifiers.join(' · ') }}
        </p>
      </div>

      <div class="grid gap-2 @xs:grid-cols-2">
        <label v-for="slot in SLOTS" :key="slot" class="text-sm">
          <span
            class="block text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70"
            >{{ slot }}</span
          >
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
import { illustration } from '~/utils/emperorOfDust/fortress/castArt'
import { followerDef, itemDef } from '~/utils/emperorOfDust/fortress/followers'
import { STATS } from '~/utils/emperorOfDust/fortress/types'
import type {
  FortressRun,
  ItemDef,
  ItemSlot,
} from '~/utils/emperorOfDust/fortress/types'

const SLOTS: ItemSlot[] = ['tool', 'charm']
const PIPS = 10
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
/** The follower's illustration; a wounded follower shows their sad mood. */
const art = computed(() =>
  def.value
    ? illustration(
        'followers',
        def.value.id,
        followerStatus(props.run, def.value.id) === 'injured'
          ? 'sad'
          : 'neutral',
      )
    : undefined,
)
/** One line of barracks chatter per day, for followers who have some. */
const talkLine = computed(() => {
  const talk = def.value?.talk
  return talk?.length ? talk[props.run.day % talk.length] : ''
})
const statusLine = computed(() => {
  if (!def.value) return ''
  const status = followerStatus(props.run, def.value.id)
  if (status === 'injured')
    return `Injured · ready in ${injuryDaysLeft(props.run, def.value.id)} day(s)`
  if (status === 'on-quest') return 'Away on a quest'
  return 'Ready'
})

const nameOf = (id: string) => followerDef(id)?.name ?? id
const shortStatus = (id: string) => {
  const status = followerStatus(props.run, id)
  if (status === 'injured') return `Injured · ${injuryDaysLeft(props.run, id)}d`
  if (status === 'on-quest') return 'Away'
  return followerDef(id)?.species ?? 'Ready'
}
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
