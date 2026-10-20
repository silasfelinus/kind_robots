<template>
  <div class="grid gap-3 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
    <section class="space-y-3">
      <div class="eod-board p-3">
        <h2 class="sr-only">The quest board</h2>
        <p
          v-if="!run.board.length"
          class="eod-notice mx-auto max-w-xs p-4 text-center font-serif text-sm italic"
        >
          The board is empty. Petitions in the throne room can post new quests.
        </p>
        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,9rem),1fr))] gap-3"
        >
          <button
            v-for="(entry, i) in board"
            :key="entry.questId"
            type="button"
            class="eod-notice flex flex-col p-2 pt-3 text-left"
            :class="[
              i % 3 === 0 ? '-rotate-1' : i % 3 === 1 ? 'rotate-1' : '',
              selectedId === entry.questId ? 'eod-notice-picked' : '',
            ]"
            :aria-pressed="selectedId === entry.questId"
            @click="select(entry.questId)"
          >
            <span class="eod-pin z-10" aria-hidden="true" />
            <EmperorFortressQuestImage
              :quest-id="entry.questId"
              :region="entry.quest.region"
              :label="entry.quest.title"
              class="-mx-1 -mt-1 mb-2 aspect-[16/9] rounded-sm"
            />
            <strong class="eod-display text-sm leading-tight">{{
              entry.quest.title
            }}</strong>
            <span class="mt-1 block text-xs italic leading-snug opacity-80">
              {{ regionName(entry.quest.region) }}
            </span>
            <span
              class="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] font-semibold"
            >
              <span>
                {{ entry.quest.durationDays }}
                {{ entry.quest.durationDays === 1 ? 'day' : 'days' }} ·
                {{ dangerLabel(entry.quest) }}
              </span>
              <span
                class="shrink-0 rounded-sm px-1"
                :class="
                  entry.daysLeft === 1
                    ? 'bg-error text-error-content'
                    : 'border border-current'
                "
              >
                {{ entry.daysLeft === 1 ? 'Last day' : `${entry.daysLeft}d` }}
              </span>
            </span>
          </button>
        </div>
      </div>

      <div class="kr-panel p-4">
        <h3 class="font-serif text-xl font-bold">Out on quests</h3>
        <p v-if="!run.active.length" class="mt-2 text-sm opacity-75">
          Nobody is away.
        </p>
        <ul class="mt-2 space-y-2">
          <li
            v-for="active in run.active"
            :key="active.questId"
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-content/15 bg-base-100 p-3 text-sm"
          >
            <span>
              <strong>{{ questDef(active.questId)?.title }}</strong>
              <span class="block text-xs opacity-70">
                {{ active.party.map(nameOf).join(', ') }} · home at dawn of Day
                {{ active.returnsDay }}
              </span>
            </span>
            <button
              v-if="active.departedDay === run.day"
              type="button"
              class="btn btn-ghost btn-xs"
              @click="withdraw(active.questId)"
            >
              Withdraw
            </button>
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="selected"
      ref="detail"
      class="@container kr-panel space-y-3 p-4"
    >
      <EmperorFortressQuestImage
        :quest-id="selected.id"
        :region="selected.region"
        :label="selected.title"
        class="-mx-4 -mt-4 aspect-[21/8] rounded-t-lg"
      />
      <div>
        <p class="text-xs font-semibold uppercase tracking-widest text-warning">
          {{ regionName(selected.region) }}
          <span
            v-if="
              selected.faction &&
              factionName(selected.faction) !== regionName(selected.region)
            "
            >· {{ factionName(selected.faction) }}</span
          >
        </p>
        <h3 class="font-serif text-2xl font-bold">{{ selected.title }}</h3>
        <p class="mt-1 text-sm">{{ selected.summary }}</p>
        <p
          v-if="selected.mustInclude"
          class="mt-1 text-xs font-semibold text-warning"
        >
          {{ nameOf(selected.mustInclude) }} must go on this quest.
        </p>
      </div>

      <dl class="grid grid-cols-2 gap-2 text-sm @md:grid-cols-4">
        <div class="rounded-lg bg-base-200 p-2">
          <dt class="text-[10px] uppercase opacity-60">Takes</dt>
          <dd class="font-bold">
            {{ odds?.durationDays ?? selected.durationDays }} day(s)
          </dd>
        </div>
        <div class="rounded-lg bg-base-200 p-2">
          <dt class="text-[10px] uppercase opacity-60">Party</dt>
          <dd class="font-bold">{{ partyLabel(selected) }}</dd>
        </div>
        <div class="rounded-lg bg-base-200 p-2">
          <dt class="text-[10px] uppercase opacity-60">Danger</dt>
          <dd class="font-bold" :class="selected.lethal ? 'text-error' : ''">
            {{ dangerLabel(selected) }}
          </dd>
        </div>
        <div class="rounded-lg bg-base-200 p-2">
          <dt class="text-[10px] uppercase opacity-60">Reward</dt>
          <dd class="font-bold">{{ rewardLabel(selected) }}</dd>
        </div>
      </dl>

      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75"
        >
          Requirements
        </p>
        <ul class="mt-1 grid gap-1">
          <li
            v-for="(req, i) in selected.requirements"
            :key="req.stat"
            class="flex items-center justify-between rounded-lg border border-base-content/10 px-2 py-1 text-sm"
          >
            <span class="capitalize">{{ req.stat }}</span>
            <span class="text-xs">
              <template v-if="odds?.perRequirement[i]?.hidden">
                party {{ odds.perRequirement[i]?.total }} · need ?
              </template>
              <template v-else-if="odds">
                party {{ odds.perRequirement[i]?.total }} · need
                {{ odds.perRequirement[i]?.needed }} ({{ req.band }})
              </template>
              <template v-else>{{ req.hidden ? '?' : req.band }}</template>
            </span>
          </li>
        </ul>
      </div>

      <div>
        <p
          class="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75"
        >
          Assign party {{ party.length }} /
          {{ partyLimit(selected, party) }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2" aria-hidden="true">
          <span
            v-for="slot in partyLimit(selected, party)"
            :key="slot"
            class="grid h-16 w-14 place-items-center overflow-hidden rounded-md border"
            :class="
              party[slot - 1]
                ? 'border-warning'
                : 'border-dashed border-base-content/30 text-base-content/40'
            "
          >
            <img
              v-if="party[slot - 1] && slotArt(party[slot - 1]!)"
              :src="slotArt(party[slot - 1]!)"
              alt=""
              class="h-full w-full object-cover object-top"
            />
            <span v-else class="text-xl">+</span>
          </span>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-2 @md:grid-cols-3">
          <button
            v-for="state in roster"
            :key="state.id"
            type="button"
            class="flex items-center gap-2 rounded-xl border p-2 text-left text-xs"
            :class="
              party.includes(state.id)
                ? 'border-warning bg-warning/10'
                : 'border-base-content/15 bg-base-100'
            "
            :disabled="state.status !== 'ready'"
            :aria-pressed="party.includes(state.id)"
            @click="toggle(state.id)"
          >
            <EmperorFortressPortrait
              :follower-id="state.id"
              :state="state.status"
              :days="state.days"
              size="sm"
            />
            <span class="min-w-0">
              <strong class="block truncate">{{ nameOf(state.id) }}</strong>
              <span class="block opacity-70">{{ statusLabel(state) }}</span>
            </span>
          </button>
        </div>
      </div>

      <label
        v-if="run.equippedRelics.includes('komodo-brass-hourglass')"
        class="flex items-start gap-2 text-sm"
      >
        <input
          v-model="hourglass"
          type="checkbox"
          class="checkbox checkbox-sm checkbox-warning"
          :disabled="!canUseHourglass(run)"
        />
        <span>
          Turn the Brass Hourglass: this quest comes home a day early (once per
          act).
        </span>
      </label>

      <div
        v-if="odds"
        class="rounded-xl border border-warning/40 bg-warning/10 p-3"
        aria-live="polite"
      >
        <p class="font-serif text-xl font-bold">
          <template v-if="odds.estimate">
            {{ odds.low }}–{{ odds.high }}% chance of success
          </template>
          <template v-else>{{ odds.chance }}% chance of success</template>
        </p>
        <p class="text-xs">
          Home at dawn of Day {{ run.day + odds.durationDays }} · injury risk on
          failure {{ odds.injuryChance }}%<span v-if="selected.lethal">
            · a failure here can kill</span
          >
        </p>
        <p v-if="odds.estimate" class="mt-1 text-xs opacity-75">
          Some requirements are hidden. A scout, or a follower who knows the
          ground, would reveal them.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-warning"
          :disabled="!canSend"
          @click="send"
        >
          Send {{ party.length || '' }} follower{{
            party.length === 1 ? '' : 's'
          }}
        </button>
        <EmperorFortressFinish :run="run" class="ml-auto" />
        <p
          v-if="error"
          class="kr-note kr-note-error w-full p-2 text-sm"
          role="alert"
        >
          {{ error }}
        </p>
      </div>
    </section>
    <section
      v-else
      class="kr-panel flex flex-col items-center justify-center gap-3 p-6 text-sm"
    >
      <p class="opacity-75">
        {{
          run.board.length
            ? 'Choose a quest from the board.'
            : 'No quests wait on the board today.'
        }}
      </p>
      <EmperorFortressFinish :run="run" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { followerPortrait } from '~/utils/emperorOfDust/fortress/castArt'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { questDef } from '~/utils/emperorOfDust/fortress/content'
import {
  canUseHourglass,
  followerStatus,
  injuryDaysLeft,
  partyLimit,
} from '~/utils/emperorOfDust/fortress/engine'
import {
  KINGDOM_FACTION_DEFS,
  REGIONS,
} from '~/utils/emperorOfDust/fortress/factions'
import { followerDef } from '~/utils/emperorOfDust/fortress/followers'
import type {
  FortressRun,
  KingdomFactionId,
  OddsPreview,
  QuestDef,
} from '~/utils/emperorOfDust/fortress/types'

const props = defineProps<{ run: FortressRun }>()
const court = useEmperorFortressStore()
const selectedId = ref<string | null>(null)
const party = ref<string[]>([])
const slotArt = (id: string) => followerPortrait(id)
const hourglass = ref(false)
const error = ref('')
const detail = ref<HTMLElement | null>(null)

const board = computed(() =>
  props.run.board
    .map((entry) => ({
      ...entry,
      quest: questDef(entry.questId)!,
      daysLeft: entry.lastDay - props.run.day + 1,
    }))
    .filter((entry) => entry.quest)
    .sort((a, b) => a.daysLeft - b.daysLeft),
)
const selected = computed(() =>
  selectedId.value && board.value.some((e) => e.questId === selectedId.value)
    ? (questDef(selectedId.value) ?? null)
    : null,
)
const roster = computed(() =>
  props.run.roster
    .filter((state) => !state.dead)
    .map((state) => ({
      id: state.id,
      status: followerStatus(props.run, state.id) ?? 'ready',
      days: injuryDaysLeft(props.run, state.id),
    })),
)

watch(
  () => [props.run.day, board.value.length],
  () => {
    if (!selected.value) selectedId.value = board.value[0]?.questId ?? null
  },
  { immediate: true },
)

const odds = computed<OddsPreview | null>(() => {
  if (!selectedId.value || !party.value.length) return null
  try {
    return court.preview(selectedId.value, party.value, hourglass.value)
  } catch {
    return null
  }
})
const canSend = computed(
  () =>
    !!selected.value &&
    party.value.length >= selected.value.party.min &&
    party.value.length <= partyLimit(selected.value, party.value),
)

function select(id: string) {
  selectedId.value = id
  party.value = []
  hourglass.value = false
  error.value = ''
  // On narrow screens the details sit below the board.
  void nextTick(() => detail.value?.scrollIntoView({ block: 'nearest' }))
}

function toggle(id: string) {
  if (party.value.includes(id)) {
    party.value = party.value.filter((entry) => entry !== id)
  } else if (
    selected.value &&
    party.value.length < partyLimit(selected.value, [...party.value, id])
  ) {
    party.value = [...party.value, id]
  }
}

function send() {
  if (!selectedId.value) return
  error.value = ''
  try {
    court.assign(selectedId.value, party.value, hourglass.value)
    party.value = []
    hourglass.value = false
    selectedId.value = board.value[0]?.questId ?? null
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'That did not work.'
  }
}

function withdraw(questId: string) {
  try {
    court.withdraw(questId)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'That did not work.'
  }
}

const nameOf = (id: string) => followerDef(id)?.name ?? id
const regionName = (id: string) =>
  REGIONS.find((region) => region.id === id)?.name ?? id
const factionName = (id: KingdomFactionId) =>
  KINGDOM_FACTION_DEFS.find((def) => def.id === id)?.name ?? id
const partyLabel = (quest: QuestDef) =>
  quest.party.min === quest.party.max
    ? `${quest.party.min} follower${quest.party.min === 1 ? '' : 's'}`
    : `${quest.party.min}–${quest.party.max} followers`
const dangerLabel = (quest: QuestDef) =>
  quest.lethal
    ? 'Lethal'
    : {
        none: 'Safe',
        low: 'Low danger',
        mid: 'Dangerous',
        high: 'Very dangerous',
      }[quest.danger]
const rewardLabel = (quest: QuestDef) => {
  const brass = quest.rewards.success.brass
  const parts = brass ? [`${brass} brass`] : []
  if (Object.keys(quest.rewards.success.affinity ?? {}).length)
    parts.push('goodwill')
  if (Object.keys(quest.rewards.success.local ?? {}).length)
    parts.push('support')
  if (quest.rewards.success.flags?.length) parts.push('secrets')
  return parts.join(', ') || 'Thanks'
}
const statusLabel = (state: { status: string; days: number }) =>
  ({
    ready: 'Ready',
    'on-quest': 'Away',
    injured: `Injured, ${state.days} day(s)`,
    dead: 'Remembered',
  })[state.status] ?? state.status
</script>
