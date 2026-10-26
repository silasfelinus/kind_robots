<template>
  <div class="flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
    <nav
      class="grid shrink-0 grid-cols-2 gap-2 @4xl:hidden"
      aria-label="Quest room view"
    >
      <button
        type="button"
        class="btn btn-sm"
        :class="mobilePane === 'board' ? 'btn-warning' : 'btn-outline'"
        :aria-pressed="mobilePane === 'board'"
        @click="mobilePane = 'board'"
      >
        Quest board · {{ board.length }}
      </button>
      <button
        type="button"
        class="btn btn-sm"
        :class="mobilePane === 'details' ? 'btn-warning' : 'btn-outline'"
        :aria-pressed="mobilePane === 'details'"
        @click="mobilePane = 'details'"
      >
        Dispatch details
      </button>
    </nav>
    <div
      class="kr-panes grid-cols-[minmax(0,1fr)] gap-2 @4xl:grid-rows-[minmax(0,1fr)] @4xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"
    >
      <section
        class="kr-pane flex-col gap-2"
        :class="mobilePane === 'board' ? 'flex' : 'hidden @4xl:flex'"
      >
        <div class="kr-pane-scroll pr-1">
          <div class="eod-board shrink-0 p-3">
            <h2 class="sr-only">The quest board</h2>
            <p
              v-if="!run.board.length"
              class="eod-notice mx-auto max-w-xs p-4 text-center font-serif text-sm italic"
            >
              The board is empty. Petitions in the throne room can post new
              quests.
            </p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="(entry, i) in board"
                :key="entry.questId"
                type="button"
                class="eod-notice flex min-h-0 flex-col p-2.5 pt-4 text-left"
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
                  class="mb-1 aspect-[16/8] max-h-20 w-full rounded-sm object-cover"
                />
                <strong class="eod-display text-sm leading-tight">{{
                  entry.quest.title
                }}</strong>
                <span
                  class="mt-1 block text-xs italic leading-tight opacity-80"
                >
                  {{ regionName(entry.quest.region) }}
                </span>
                <span
                  class="mt-1 flex flex-wrap gap-0.5 text-[10px] font-semibold uppercase"
                  :aria-label="`Needs ${bandSummary(entry.questId)}`"
                >
                  <span
                    v-for="req in boardBands(entry.questId)"
                    :key="req.stat"
                    class="rounded-sm border border-current/40 px-1"
                    >{{ req.stat.slice(0, 3) }} {{ req.label }}</span
                  >
                </span>
                <span
                  class="mt-auto flex items-center justify-between gap-1 pt-2 text-[10px] font-semibold"
                >
                  <span>
                    {{ entry.quest.durationDays }}
                    {{ entry.quest.durationDays === 1 ? 'day' : 'days' }}
                    <span
                      v-if="entry.quest.lethal"
                      class="ml-0.5 rounded-sm bg-error px-1 text-error-content"
                      >Lethal</span
                    >
                  </span>
                  <span
                    class="shrink-0 rounded-sm px-1"
                    :class="
                      entry.expiry.daysLeft <= 1
                        ? 'bg-error text-error-content'
                        : 'border border-current'
                    "
                  >
                    {{ entry.expiry.countdown }}
                  </span>
                </span>
              </button>
            </div>
          </div>

          <details class="kr-panel mt-2 p-2">
            <summary class="cursor-pointer font-serif text-base font-bold">
              Out on quests · {{ run.active.length }}
            </summary>
            <p v-if="!run.active.length" class="mt-2 text-sm opacity-75">
              Nobody is away.
            </p>
            <ul class="mt-2 space-y-2">
              <li
                v-for="active in run.active"
                :key="active.questId"
                class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-base-content/15 bg-base-100 p-3 text-sm"
              >
                <span class="min-w-0">
                  <strong>{{ questDef(active.questId)?.title }}</strong>
                  <span class="block text-xs opacity-70">
                    {{ active.party.map(nameOf).join(', ') }} · home at dawn of
                    Day
                    {{ active.returnsDay }}
                  </span>
                  <span
                    v-if="active.departedDay === run.day"
                    class="block text-xs italic opacity-70"
                  >
                    Still saddling up. You can call them back until the day
                    ends.
                  </span>
                </span>
                <button
                  v-if="active.departedDay === run.day"
                  type="button"
                  class="btn btn-outline btn-warning btn-xs"
                  @click="withdraw(active.questId)"
                >
                  Call back
                </button>
              </li>
            </ul>
          </details>
        </div>
      </section>

      <section
        v-if="selected && selectedEntry"
        class="kr-pane kr-panel @container"
        :class="mobilePane === 'details' ? 'flex' : 'hidden @4xl:flex'"
      >
        <div
          class="flex shrink-0 items-center justify-between gap-2 border-b border-warning/30 bg-base-100 p-2"
        >
          <button
            type="button"
            class="btn btn-xs"
            :class="detailStep === 'briefing' ? 'btn-warning' : 'btn-outline'"
            :aria-current="detailStep === 'briefing' ? 'step' : undefined"
            @click="detailStep = 'briefing'"
          >
            1 · Mission briefing
          </button>
          <button
            type="button"
            class="btn btn-xs"
            :class="detailStep === 'assignment' ? 'btn-warning' : 'btn-outline'"
            :aria-current="detailStep === 'assignment' ? 'step' : undefined"
            @click="detailStep = 'assignment'"
          >
            2 · Assign party
          </button>
        </div>
        <div
          :key="selectedId + ':' + detailStep"
          class="kr-pane-scroll space-y-2 px-3 py-2"
        >
          <div v-if="detailStep === 'briefing'" class="space-y-3">
            <div
              class="grid min-w-0 gap-3 @md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
            >
              <EmperorFortressQuestImage
                :quest-id="selected.id"
                :region="selected.region"
                :label="selected.title"
                class="aspect-[16/10] max-h-52 w-full rounded-lg object-cover @md:aspect-[4/5]"
              />
              <div class="min-w-0 space-y-2">
                <p
                  class="text-xs font-semibold uppercase tracking-widest text-warning"
                >
                  {{ regionName(selected.region) }}
                  <span
                    v-if="
                      selected.faction &&
                      factionName(selected.faction) !==
                        regionName(selected.region)
                    "
                    >· {{ factionName(selected.faction) }}</span
                  >
                </p>
                <h3 class="font-serif text-xl font-bold leading-tight">
                  {{ selected.title }}
                </h3>
                <p
                  class="whitespace-pre-line font-serif text-sm leading-relaxed"
                >
                  {{ selected.summary.split('\n\n')[0] }}
                </p>
                <p
                  v-if="selected.mustInclude"
                  class="text-xs font-semibold text-warning"
                >
                  {{ nameOf(selected.mustInclude) }} must go on this quest.
                </p>
              </div>
            </div>
            <details
              v-if="selected.summary.includes('\n\n')"
              class="rounded-lg border border-warning/20 bg-base-200 p-2 font-serif text-sm"
            >
              <summary
                class="cursor-pointer font-sans text-xs font-semibold uppercase text-warning"
              >
                More mission intelligence
              </summary>
              <p class="mt-2 whitespace-pre-line leading-relaxed">
                {{ selected.summary.split('\n\n').slice(1).join('\n\n') }}
              </p>
            </details>

            <dl class="grid grid-cols-2 gap-1 text-xs @md:grid-cols-4">
              <div class="rounded-lg bg-base-200 p-1.5">
                <dt class="text-[10px] uppercase opacity-60">Takes</dt>
                <dd class="font-bold">
                  {{ days(odds?.durationDays ?? selected.durationDays) }}
                </dd>
              </div>
              <div class="rounded-lg bg-base-200 p-2">
                <dt class="text-[10px] uppercase opacity-60">Party</dt>
                <dd class="font-bold">{{ partyLabel(selected) }}</dd>
              </div>
              <div class="rounded-lg bg-base-200 p-2">
                <dt class="text-[10px] uppercase opacity-60">Danger</dt>
                <dd
                  class="font-bold"
                  :class="selected.lethal ? 'text-error' : ''"
                >
                  {{ dangerLine(selected) }}
                </dd>
              </div>
              <div
                class="rounded-lg p-1.5"
                :class="
                  selectedEntry.expiry.daysLeft <= 1
                    ? 'bg-error/15 text-error'
                    : 'bg-base-200'
                "
              >
                <dt class="text-[10px] uppercase opacity-60">On the board</dt>
                <dd class="font-bold">{{ selectedEntry.expiry.countdown }}</dd>
              </div>
            </dl>

            <div class="space-y-1 text-sm">
              <p>
                <span
                  class="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-70"
                  >Promised</span
                >
                {{ rewardLines(run, selected).join(', ') }}.
              </p>
              <p
                :class="
                  selectedEntry.expiry.punishes ? 'text-error' : 'opacity-75'
                "
              >
                {{ selectedEntry.expiry.when }}
                {{ selectedEntry.expiry.consequence }}
              </p>
            </div>
          </div>
          <div v-else class="space-y-3">
            <h3 class="font-serif text-lg font-bold text-warning">
              {{ selected.title }}
            </h3>
            <p class="text-xs opacity-75">
              {{ partyLabel(selected) }} · {{ days(selected.durationDays) }} ·
              {{ dangerLine(selected) }}
            </p>
            <div>
              <p
                class="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75"
              >
                Needs
                <span class="normal-case tracking-normal">(party / need)</span>
              </p>
              <ul class="mt-1 grid grid-cols-2 gap-1">
                <li
                  v-for="req in bands"
                  :key="req.stat"
                  class="rounded-lg border border-base-content/10 px-2 py-1 text-xs"
                >
                  <span class="flex items-center justify-between gap-2">
                    <span class="capitalize">
                      {{ req.stat }}
                      <span
                        class="ml-1 text-[10px] font-semibold uppercase tracking-wider opacity-70"
                        >{{ req.hidden ? 'unknown' : req.band }}</span
                      >
                    </span>
                    <span
                      class="text-xs font-semibold"
                      :class="
                        req.hidden
                          ? 'opacity-75'
                          : req.total >= req.needed
                            ? 'text-success'
                            : party.length
                              ? 'text-error'
                              : 'opacity-75'
                      "
                    >
                      {{ req.total }} / {{ req.hidden ? '?' : req.needed }}
                    </span>
                  </span>
                  <span
                    class="mt-1 block h-1.5 overflow-hidden rounded-full bg-base-content/10"
                    aria-hidden="true"
                  >
                    <span
                      class="block h-full rounded-full"
                      :class="
                        req.hidden
                          ? 'bg-base-content/40'
                          : req.total >= req.needed
                            ? 'bg-success'
                            : 'bg-warning'
                      "
                      :style="{ width: barWidth(req) }"
                    />
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
                <span
                  v-if="selected.party.min > 1"
                  class="normal-case tracking-normal"
                >
                  · at least {{ selected.party.min }}</span
                >
              </p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <button
                  v-for="slot in partyLimit(selected, party)"
                  :key="slot"
                  type="button"
                  class="relative grid h-11 w-10 place-items-center overflow-hidden rounded-md border"
                  :class="
                    party[slot - 1]
                      ? 'border-warning'
                      : slot <= selected.party.min
                        ? 'border-dashed border-warning/60 text-warning/70'
                        : 'border-dashed border-base-content/30 text-base-content/40'
                  "
                  :disabled="!party[slot - 1]"
                  :aria-label="
                    party[slot - 1]
                      ? `Take ${nameOf(party[slot - 1]!)} off the quest`
                      : slot <= selected.party.min
                        ? 'Empty slot, needed'
                        : 'Empty slot, optional'
                  "
                  @click="party[slot - 1] && toggle(party[slot - 1]!)"
                >
                  <img
                    v-if="party[slot - 1] && slotArt(party[slot - 1]!)"
                    :src="slotArt(party[slot - 1]!)"
                    alt=""
                    class="h-full w-full object-cover object-top"
                  />
                  <span v-else-if="party[slot - 1]" class="text-[10px]">{{
                    nameOf(party[slot - 1]!)
                  }}</span>
                  <span v-else class="text-xl">+</span>
                </button>
              </div>
              <div
                class="mt-1 grid grid-cols-2 gap-1 @md:grid-cols-3 @lg:grid-cols-4"
              >
                <button
                  v-for="state in roster"
                  :key="state.id"
                  type="button"
                  class="flex items-center gap-1.5 rounded-lg border p-1.5 text-left text-xs"
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
                    <strong class="block truncate">{{
                      nameOf(state.id)
                    }}</strong>
                    <span class="block opacity-70">{{
                      statusLabel(state)
                    }}</span>
                    <span
                      v-if="state.status === 'ready' && contributions[state.id]"
                      class="block truncate font-semibold text-warning"
                      >{{ contributions[state.id] }}</span
                    >
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
                Turn the Brass Hourglass: this quest comes home a day early
                (once per act).
              </span>
            </label>

            <div
              v-if="odds && party.length"
              class="rounded-lg border border-warning/40 bg-warning/10 p-2"
              aria-live="polite"
            >
              <p class="font-serif text-xl font-bold">
                <template v-if="odds.estimate">
                  {{ odds.low }}–{{ odds.high }}% chance of success
                </template>
                <template v-else>{{ odds.chance }}% chance of success</template>
              </p>
              <p class="text-xs">
                Home at dawn of Day {{ run.day + odds.durationDays }}
                <template v-if="odds.injuryRisk">
                  · {{ odds.injuryRisk }}% each comes home wounded ({{
                    odds.injuryDays[0] || 1
                  }}–{{ odds.injuryDays[1] }} days)
                </template>
                <template v-else> · nobody comes home wounded</template>
                <span v-if="selected.lethal" class="font-semibold text-error">
                  · {{ odds.estimate ? 'up to ' : '' }}{{ odds.deathChance }}%
                  someone dies</span
                >
              </p>
              <p
                v-if="
                  odds.estimate && odds.perRequirement.some((req) => req.hidden)
                "
                class="mt-1 text-xs opacity-75"
              >
                Some needs are hidden. A scout, a follower who knows the ground,
                or the Lamplight Archive at {{ LAMPLIGHT_SIGHT }} would read
                them.
              </p>
              <p v-if="odds.unread" class="mt-1 text-xs opacity-75">
                {{
                  odds.unread === 1
                    ? 'Someone in this party has'
                    : `${odds.unread} in this party have`
                }}
                a trait here the Codex has not read. It could cut either way.
                The true odds are somewhere in the range.
              </p>
              <ul
                v-if="odds.aid.length"
                class="mt-2 space-y-0.5 text-xs"
                aria-label="Help the court has earned"
              >
                <li v-for="(aid, i) in odds.aid" :key="i">
                  <strong class="text-success">Aid</strong>: {{ aid.label }}
                  <span class="text-success"
                    >+{{ aid.bonus }}
                    {{ aid.stat ? capitalize(aid.stat) : 'every need' }}</span
                  >
                </li>
              </ul>
              <ul v-if="modifiers.length" class="mt-2 space-y-0.5 text-xs">
                <li v-for="(mod, i) in modifiers" :key="i">
                  <strong>{{ nameOf(mod.followerId) }}</strong
                  >: {{ mod.label }}
                  <span :class="mod.amount < 0 ? 'text-error' : 'text-success'"
                    >{{ mod.amount > 0 ? '+' : '−'
                    }}{{ Math.abs(mod.amount) }}</span
                  >
                </li>
              </ul>
            </div>

            <ul
              v-if="warnings.length"
              class="space-y-1 text-xs"
              aria-label="Before you send them"
            >
              <li
                v-for="(warning, i) in warnings"
                :key="i"
                class="border-l-2 border-error/70 pl-2"
              >
                {{ warning }}
              </li>
            </ul>
          </div>
        </div>
        <div
          class="flex shrink-0 flex-wrap items-center gap-2 border-t border-warning/30 bg-base-100 p-2"
        >
          <button
            v-if="detailStep === 'briefing'"
            type="button"
            class="btn btn-warning btn-sm"
            @click="detailStep = 'assignment'"
          >
            Assign followers <span aria-hidden="true">▸</span>
          </button>
          <template v-else>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              @click="detailStep = 'briefing'"
            >
              ◂ Briefing
            </button>
            <button
              type="button"
              class="btn btn-warning btn-sm"
              :disabled="!canSend"
              @click="send"
            >
              Send {{ party.length || '' }} follower{{
                party.length === 1 ? '' : 's'
              }}
            </button>
          </template>
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
        class="kr-panel kr-pane items-center justify-center gap-3 p-6 text-sm"
        :class="mobilePane === 'details' ? 'flex' : 'hidden @4xl:flex'"
      >
        <p class="opacity-75">
          {{
            run.board.length
              ? 'Choose a quest from the board.'
              : 'No quests wait on the board today.'
          }}
        </p>
        <p v-if="error" class="kr-note kr-note-error p-2 text-sm" role="alert">
          {{ error }}
        </p>
        <EmperorFortressFinish :run="run" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { followerPortrait } from '~/utils/emperorOfDust/fortress/castArt'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import { questDef } from '~/utils/emperorOfDust/fortress/content'
import {
  LAMPLIGHT_SIGHT,
  canUseHourglass,
  followerStatus,
  injuryDaysLeft,
  partyLimit,
} from '~/utils/emperorOfDust/fortress/engine'
import {
  dangerLine,
  expiryInfo,
  partyModifiers,
  rewardLines,
  sendWarnings,
} from '~/utils/emperorOfDust/fortress/board'
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
const mobilePane = ref<'board' | 'details'>('board')
const detailStep = ref<'briefing' | 'assignment'>('briefing')

const board = computed(() =>
  props.run.board
    .map((entry) => {
      const quest = questDef(entry.questId)
      return quest
        ? {
            ...entry,
            quest,
            expiry: expiryInfo(props.run, quest, entry.lastDay),
          }
        : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => !!entry)
    .sort((a, b) => a.expiry.daysLeft - b.expiry.daysLeft),
)
const selectedEntry = computed(() =>
  board.value.find((entry) => entry.questId === selectedId.value),
)
const selected = computed(() => selectedEntry.value?.quest ?? null)
const roster = computed(() =>
  props.run.roster
    .filter((state) => !state.dead && !state.departed)
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

const previewOf = (questId: string, members: string[]): OddsPreview | null => {
  try {
    return court.preview(questId, members, hourglass.value)
  } catch {
    return null
  }
}
const odds = computed(() =>
  selectedId.value ? previewOf(selectedId.value, party.value) : null,
)
/** Requirement bands for the chosen party, or for nobody yet. */
const bands = computed(() => odds.value?.perRequirement ?? [])
/** Band chips for a board notice: "?" until a requirement is revealed. */
const boardBands = (questId: string) =>
  (previewOf(questId, [])?.perRequirement ?? []).map((req) => ({
    stat: req.stat,
    label: req.hidden ? '?' : req.band,
  }))
const bandSummary = (questId: string) =>
  boardBands(questId)
    .map((req) => `${req.stat} ${req.label === '?' ? 'unknown' : req.label}`)
    .join(', ')
/** What each ready follower would add to this quest's needs, known only. */
const contributions = computed<Record<string, string>>(() => {
  const quest = selected.value
  if (!quest) return {}
  return Object.fromEntries(
    roster.value
      .filter((state) => state.status === 'ready')
      .map((state) => {
        const solo = previewOf(quest.id, [state.id])
        return [
          state.id,
          (solo?.perRequirement ?? [])
            .map(
              (req) =>
                `${req.stat[0]!.toUpperCase()}${req.stat.slice(1)} ${req.total - req.aid}`,
            )
            .join(' · '),
        ]
      }),
  )
})
const modifiers = computed(() =>
  selected.value
    ? partyModifiers(
        props.run,
        selected.value,
        party.value,
        court.codex.revealed,
      )
    : [],
)
const warnings = computed(() =>
  selected.value && odds.value && party.value.length
    ? sendWarnings(props.run, selected.value, odds.value, modifiers.value)
    : [],
)
const canSend = computed(
  () =>
    !!selected.value &&
    (!selected.value.mustInclude ||
      party.value.includes(selected.value.mustInclude)) &&
    party.value.length >= selected.value.party.min &&
    party.value.length <= partyLimit(selected.value, party.value),
)

const capitalize = (word: string) => word[0]!.toUpperCase() + word.slice(1)

function select(id: string) {
  selectedId.value = id
  party.value = []
  hourglass.value = false
  error.value = ''
  mobilePane.value = 'details'
  detailStep.value = 'briefing'
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
    detailStep.value = 'briefing'
    selectedId.value = board.value[0]?.questId ?? null
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'That did not work.'
  }
}

function withdraw(questId: string) {
  error.value = ''
  try {
    court.withdraw(questId)
    selectedId.value = questId
    party.value = []
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'That did not work.'
  }
}

const barWidth = (req: { total: number; needed: number; hidden: boolean }) =>
  req.hidden
    ? `${Math.min(100, (req.total / 22) * 100)}%`
    : `${Math.min(100, (req.total / Math.max(1, req.needed)) * 100)}%`
const days = (n: number) => `${n} day${n === 1 ? '' : 's'}`
const nameOf = (id: string) => followerDef(id)?.name ?? id
const regionName = (id: string) =>
  REGIONS.find((region) => region.id === id)?.name ?? id
const factionName = (id: KingdomFactionId) =>
  KINGDOM_FACTION_DEFS.find((def) => def.id === id)?.name ?? id
const partyLabel = (quest: QuestDef) =>
  quest.party.min === quest.party.max
    ? `${quest.party.min} follower${quest.party.min === 1 ? '' : 's'}`
    : `${quest.party.min}–${quest.party.max} followers`
const statusLabel = (state: { status: string; days: number }) =>
  ({
    ready: 'Ready',
    'on-quest': 'Away',
    injured: `Injured, ${state.days} day(s)`,
    dead: 'Remembered',
  })[state.status] ?? state.status
</script>
