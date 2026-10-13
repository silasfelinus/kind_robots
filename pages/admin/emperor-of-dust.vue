<template>
  <main class="kr-surface">
    <div v-if="!user.initialized" class="grid min-h-96 place-items-center">
      <span class="kr-spinner-lg-primary" />
    </div>
    <div
      v-else-if="!user.isAdmin"
      class="kr-note kr-note-error mx-auto max-w-xl p-8 text-center"
    >
      The Emperor's strategy chamber is private.
    </div>
    <div
      v-else-if="!court.loaded || !campaign"
      class="grid min-h-96 place-items-center"
    >
      <span class="kr-spinner-lg-primary" />
    </div>
    <div v-else class="kr-scroll mx-auto max-w-7xl space-y-6 px-3 py-5 sm:px-6">
      <header
        class="rounded-3xl border border-warning/30 bg-base-300 p-6 sm:p-9"
      >
        <p class="text-xs font-bold uppercase tracking-widest text-warning">
          Private Zuzu-world strategy chamber · working pilot
        </p>
        <h2 class="font-serif text-4xl font-black sm:text-6xl">
          Emperor of Dust
        </h2>
        <p class="font-serif text-2xl italic text-warning">One Hundred Days</p>
        <p class="mt-3 max-w-3xl">
          Before Zuzu reached the border, the Emperor ruled by dispatch and
          compromise. Command a small court, send leaders with the numerical
          Horde, and live with the results.
        </p>
        <p class="mt-3 text-sm font-semibold text-warning">
          Playable Day 1 systems prototype. Only three incidents are authored.
          Later days are available for travel and injury-recovery testing, not
          as a complete campaign.
        </p>
      </header>

      <p
        v-if="court.storageWarning"
        class="kr-note kr-note-error p-4"
        role="alert"
      >
        {{ court.storageWarning }}
      </p>
      <p v-if="notice" class="kr-note p-4" role="status">{{ notice }}</p>

      <section
        class="grid grid-cols-2 gap-3 sm:grid-cols-5"
        aria-label="Campaign status"
      >
        <div
          v-for="stat in figures"
          :key="stat.label"
          class="rounded-2xl border border-base-content/15 bg-base-200 p-4"
        >
          <p class="text-xs font-bold uppercase tracking-wider opacity-65">
            {{ stat.label }}
          </p>
          <strong class="font-serif text-2xl">{{ stat.value }}</strong>
        </div>
      </section>

      <section class="kr-panel flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <div class="min-w-44 flex-1">
          <p class="text-xs font-semibold uppercase tracking-widest opacity-65">
            Paused imperial clock
          </p>
          <p class="font-serif text-3xl font-bold">
            Day {{ court.day }} · {{ timeLabel(campaign.hour) }}
          </p>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="!canAdvance"
          @click="advanceByOne"
        >
          +1 hour
        </button>
        <button
          type="button"
          class="btn btn-sm btn-warning"
          :disabled="!canAdvance"
          @click="advanceToNext"
        >
          Next event
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="!canAdvance"
          @click="advanceToMorning"
        >
          Next morning
        </button>
        <p class="w-full text-xs opacity-70">
          Time only advances when commanded. Deadlines close while parties
          travel. Recovery days pass at the tower, and an injury does not
          automatically kill a leader.
        </p>
      </section>

      <section
        v-if="court.day === 1"
        class="rounded-3xl border border-warning/25 bg-base-200 p-5"
      >
        <p class="text-xs font-semibold uppercase tracking-widest text-warning">
          Young Komodo · Day 1 briefing
        </p>
        <p class="mt-2 font-serif text-lg italic">{{ KOMODO_DAY_ONE_HINT }}</p>
        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <article
            v-for="report in DAY_ONE_BRIEFINGS"
            :key="report.id"
            class="rounded-xl border border-base-content/15 bg-base-100 p-3"
            :class="
              revealFalseReport(campaign, report.truth)
                ? 'border-warning bg-warning/10'
                : ''
            "
          >
            <span
              v-if="revealFalseReport(campaign, report.truth)"
              class="text-xs font-bold text-warning"
              >Eye revealed: false report</span
            >
            <p
              class="text-xs font-semibold uppercase tracking-wider opacity-60"
            >
              {{ report.source }}
            </p>
            <p class="mt-1 text-sm">{{ report.text }}</p>
          </article>
        </div>
        <p class="mt-3 text-xs opacity-65">
          Two reports are true. One is a harmless false rumor. The Eye of the
          Elder Crow can reveal the false rumor if equipped. The full 100-day
          briefings are not authored yet.
        </p>
      </section>

      <EmperorOfDustRelicVault />

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <div class="space-y-5">
          <EmperorOfDustImperialRoadMap
            :selected-region-id="selectedRegionId"
            :hour="campaign.hour"
            :missions="campaign.dispatches"
            :incidents="DAY_ONE_INCIDENTS"
            @select="selectRegion"
          />
          <section class="kr-panel p-5">
            <h3 class="font-serif text-2xl font-bold">The Emperor's docket</h3>
            <p class="mt-1 text-sm opacity-70">
              Incident reports open at scheduled hours. Outbound travel must
              reach the location before the deadline, and the return trip still
              occupies your people.
            </p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                v-for="incident in DAY_ONE_INCIDENTS"
                :key="incident.id"
                type="button"
                class="rounded-xl border p-4 text-left transition-colors hover:bg-base-300 focus-visible:outline-2 focus-visible:outline-primary"
                :class="
                  selectedIncidentId === incident.id
                    ? 'border-warning bg-base-300'
                    : 'border-base-content/15 bg-base-100'
                "
                :aria-pressed="selectedIncidentId === incident.id"
                @click="selectIncident(incident)"
              >
                <span
                  class="block text-xs font-bold uppercase tracking-wider opacity-65"
                >
                  {{ timeLabel(timeAt(incident.day, incident.opensAtHour)) }}
                  · {{ incident.outwardHours }}h outward
                </span>
                <strong class="mt-1 block font-serif text-lg">{{
                  incident.title
                }}</strong>
                <span class="mt-2 block text-xs font-semibold text-warning">
                  {{ incidentStatus(incident) }}
                </span>
              </button>
            </div>
          </section>

          <section class="kr-panel p-5">
            <h3 class="font-serif text-2xl font-bold">
              Expeditions on the roads
            </h3>
            <p
              v-if="campaign.dispatches.length === 0"
              class="mt-3 text-sm opacity-70"
            >
              Nobody has been sent out yet.
            </p>
            <div v-else class="mt-3 space-y-2">
              <article
                v-for="mission in campaign.dispatches.slice().reverse()"
                :key="mission.incidentId"
                class="rounded-xl border border-base-content/15 bg-base-100 p-3"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <strong>{{ mission.incident.title }}</strong>
                  <span class="text-xs font-semibold text-warning">
                    {{ missionStatus(mission) }}
                  </span>
                </div>
                <p class="mt-1 text-xs opacity-75">
                  {{ mission.leaders.map(leaderName).join(', ') }} ·
                  {{ mission.hordeSurvivors }} / {{ mission.hordeSent }} Horde
                  returning · Due {{ timeLabel(mission.returnsAt) }}
                  <span v-if="dayAt(mission.returnsAt) > court.day">
                    on Day {{ dayAt(mission.returnsAt) }}
                  </span>
                </p>
                <p v-if="mission.outcome" class="mt-2 text-sm">
                  {{
                    mission.outcome.success
                      ? 'Mission succeeded'
                      : 'Mission failed'
                  }}
                  · Dice {{ mission.outcome.dice.join(' + ') }} ·
                  {{ mission.outcome.lostHorde }} Horde lost
                </p>
              </article>
            </div>
          </section>
        </div>

        <div class="space-y-5">
          <section class="kr-panel p-5">
            <p
              class="text-xs font-semibold uppercase tracking-widest text-warning"
            >
              Selected district
            </p>
            <h3 class="mt-1 font-serif text-2xl font-bold">
              {{ selectedRegion?.name }}
            </h3>
            <p class="mt-2 text-sm">{{ selectedRegion?.description }}</p>
            <p class="mt-2 text-sm font-bold text-warning">
              {{ selectedRegion?.faction }}
              · {{ selectedRegion?.outwardHours }}h outward /
              {{ (selectedRegion?.outwardHours ?? 0) * 2 }}h round trip
            </p>
          </section>

          <section class="kr-panel space-y-4 p-5">
            <h3 class="font-serif text-2xl font-bold">Dispatch orders</h3>
            <div v-if="!selectedIncident" class="text-sm opacity-70">
              This district has no authored Day 1 dispatch. Choose a petition
              from the docket.
            </div>
            <template v-else>
              <div>
                <strong class="block font-serif text-lg">{{
                  selectedIncident.title
                }}</strong>
                <p class="mt-1 text-xs opacity-70">
                  Deadline
                  {{
                    timeLabel(
                      timeAt(
                        selectedIncident.day,
                        selectedIncident.deadlineHour,
                      ),
                    )
                  }}
                  · {{ selectedIncident.missionHours }}h on scene ·
                  {{ selectedIncident.outwardHours }}h return journey
                </p>
                <p class="mt-2 text-sm font-semibold text-warning">
                  {{ incidentStatus(selectedIncident) }}
                </p>
              </div>
              <fieldset
                class="space-y-2"
                :disabled="!isDispatchable(selectedIncident)"
              >
                <legend class="text-sm font-bold">Approach</legend>
                <label
                  v-for="choice in selectedIncident.choices"
                  :key="choice.id"
                  class="flex cursor-pointer items-start gap-2 rounded-xl border border-base-content/15 bg-base-100 p-3 text-sm"
                >
                  <input
                    v-model="selectedChoiceId"
                    class="radio radio-sm radio-warning mt-0.5"
                    type="radio"
                    :value="choice.id"
                    name="emperor-dispatch-choice"
                  />
                  <span>
                    <strong>{{ choice.label }}</strong>
                    <span class="mt-1 block text-xs opacity-65">
                      {{ choice.approach }} · difficulty {{ choice.difficulty }}
                    </span>
                  </span>
                </label>
              </fieldset>

              <div>
                <p class="text-sm font-bold">Choose 1–3 available leaders</p>
                <p class="mt-1 text-xs opacity-70">
                  Selected: {{ chosenIds.length }}. Leaders are unavailable
                  until they return to the tower.
                </p>
                <div class="mt-2 grid grid-cols-2 gap-2">
                  <button
                    v-for="leader in campaign.followers"
                    :key="leader.id"
                    type="button"
                    class="rounded-xl border p-2 text-left text-xs"
                    :class="
                      chosenIds.includes(leader.id)
                        ? 'border-warning bg-warning/10'
                        : 'border-base-content/15 bg-base-100'
                    "
                    :aria-pressed="chosenIds.includes(leader.id)"
                    :disabled="
                      !court.ready.some((ready) => ready.id === leader.id) ||
                      !isDispatchable(selectedIncident)
                    "
                    @click="toggleLeader(leader.id)"
                  >
                    <strong class="block">{{ leader.name }}</strong>
                    <span class="block opacity-70">{{
                      leaderStatus(leader)
                    }}</span>
                  </button>
                </div>
              </div>
              <label class="block text-sm font-bold" for="emperor-horde-sent">
                Horde contingent ({{ court.freeHorde }} at the tower)
              </label>
              <input
                id="emperor-horde-sent"
                v-model.number="troops"
                type="number"
                class="input input-bordered w-full"
                :min="selectedIncident.hordeMinimum"
                :max="Math.min(selectedIncident.hordeMaximum, court.freeHorde)"
                :disabled="!isDispatchable(selectedIncident)"
              />
              <p class="text-xs opacity-70">
                {{ selectedIncident.hordeMinimum }}–{{
                  selectedIncident.hordeMaximum
                }}
                troops permitted. The Horde is a headcount, not a consumable
                favor currency.
              </p>
              <label
                v-if="hourglassEquipped"
                class="flex items-start gap-3 rounded-xl border border-base-content/15 p-3 text-sm"
              >
                <input
                  v-model="useHourglass"
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-warning"
                  :disabled="
                    !hourglassReady || !isDispatchable(selectedIncident)
                  "
                />
                <span>
                  <strong>Use Brass Hourglass</strong>
                  <span class="block text-xs opacity-70">
                    Reduce outbound travel by one hour, once per day. Return
                    travel stays unchanged.
                    {{
                      hourglassReady
                        ? 'Available today'
                        : 'Unavailable for this mission'
                    }}
                  </span>
                </span>
              </label>
              <div
                v-if="odds"
                class="rounded-xl border border-warning/40 bg-warning/10 p-3"
              >
                <p class="font-serif text-xl font-bold">
                  {{ Math.round(odds.probability * 100) }}% projected success
                </p>
                <p class="text-xs">
                  {{ odds.numerator }}/36 dice outcomes · returns at
                  {{ timeLabel(odds.projectedReturnHour) }}
                  <span v-if="dayAt(odds.projectedReturnHour) > court.day">
                    on Day {{ dayAt(odds.projectedReturnHour) }}
                  </span>
                </p>
              </div>
              <p v-else class="text-xs opacity-70">
                Select a leader and a valid troop count for exact seeded 2d6
                odds.
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="btn btn-warning"
                  :disabled="!odds || !isDispatchable(selectedIncident)"
                  @click="sendParty"
                >
                  Dispatch expedition
                </button>
                <button
                  type="button"
                  class="btn btn-outline"
                  :disabled="!isDispatchable(selectedIncident)"
                  @click="sendNobody"
                >
                  Send no one
                </button>
              </div>
            </template>
          </section>
        </div>
      </div>

      <section class="kr-panel space-y-4 p-5">
        <div class="flex flex-wrap justify-between gap-2">
          <div>
            <h3 class="font-serif text-2xl font-bold">
              The Emperor's followers
            </h3>
            <p class="text-sm opacity-70">
              Five starting commanders, with additional candidates gated by
              story and Prosperity.
            </p>
          </div>
          <span class="text-sm text-warning">
            {{ court.ready.length }} ready ·
            {{ court.wounded.length }} recovering
          </span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <article
            v-for="leader in campaign.followers"
            :key="leader.id"
            class="overflow-hidden rounded-2xl border border-base-content/15 bg-base-100"
          >
            <div
              class="grid h-36 place-items-center bg-gradient-to-br from-amber-900/30 via-base-300 to-emerald-950/40"
            >
              <img
                v-if="leaderPortrait(leader)"
                :src="leaderPortrait(leader) ?? undefined"
                :alt="
                  leader.name +
                  (isInjured(leader) ? ' recovering' : ' portrait')
                "
                class="h-full w-full object-cover"
              />
              <div v-else class="text-center">
                <span class="font-serif text-5xl font-black opacity-50">
                  {{ leader.name.charAt(0) }}
                </span>
                <span
                  class="mt-1 block text-[10px] font-bold uppercase tracking-widest opacity-65"
                >
                  {{
                    isInjured(leader)
                      ? 'Injured portrait pending'
                      : 'Portrait pending'
                  }}
                </span>
              </div>
            </div>
            <div class="space-y-1 p-3">
              <strong class="block font-serif text-lg">{{
                leader.name
              }}</strong>
              <p class="text-xs text-warning">{{ leaderStatus(leader) }}</p>
              <p class="text-xs opacity-75">
                {{ followerProfile(leader.id)?.faction }}
              </p>
              <p class="text-xs">
                M {{ leader.stats.might }} · D {{ leader.stats.diplomacy }} · I
                {{ leader.stats.ingenuity }}
              </p>
              <p class="line-clamp-3 text-xs opacity-75">
                {{ followerProfile(leader.id)?.biography }}
              </p>
            </div>
          </article>
        </div>
        <details class="rounded-xl border border-base-content/15 p-4">
          <summary class="cursor-pointer font-semibold">
            Future recruits ({{ remainingCandidates(campaign).length }})
          </summary>
          <div class="mt-3 grid gap-2 md:grid-cols-2">
            <div
              v-for="candidate in remainingCandidates(campaign)"
              :key="candidate.id"
              class="rounded-xl border border-base-content/15 bg-base-100 p-3"
            >
              <strong class="block">{{ candidate.name }}</strong>
              <span class="block text-xs opacity-70">
                {{ candidate.faction }} · {{ candidate.recruitCost }} Prosperity
              </span>
              <p class="my-2 text-xs">
                {{ court.availability(candidate.id).reason }}
              </p>
              <button
                type="button"
                class="btn btn-xs btn-outline"
                :disabled="!court.availability(candidate.id).eligible"
                @click="recruit(candidate.id)"
              >
                Commission
              </button>
            </div>
          </div>
        </details>
      </section>

      <section
        class="kr-panel flex flex-wrap items-start justify-between gap-4 p-5"
      >
        <div>
          <h3 class="font-serif text-xl font-bold">Campaign ledger</h3>
          <p class="text-xs opacity-70">
            Saved locally on this device. The road test has no cloud account
            sync.
          </p>
          <ul class="mt-3 space-y-1 text-sm" aria-live="polite">
            <li
              v-for="entry in recentLog"
              :key="entry.incidentId + ':' + entry.hour + ':' + entry.type"
            >
              Day {{ dayAt(entry.hour) }}, {{ timeLabel(entry.hour) }}:
              {{ entry.detail }}
            </li>
            <li v-if="recentLog.length === 0" class="opacity-70">
              Your first order has not been issued.
            </li>
          </ul>
        </div>
        <div class="space-y-2">
          <button
            v-if="!confirmRestart"
            type="button"
            class="btn btn-sm btn-outline"
            @click="confirmRestart = true"
          >
            Start a new pilot run
          </button>
          <div v-else class="rounded-xl border border-warning/50 p-3">
            <p class="mb-2 text-sm font-semibold">
              Replace this device's saved run?
            </p>
            <div class="flex gap-2">
              <button
                type="button"
                class="btn btn-sm btn-warning"
                @click="restartRun"
              >
                Reset run
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline"
                @click="confirmRestart = false"
              >
                Cancel
              </button>
            </div>
          </div>
          <a
            href="https://github.com/silasfelinus/conductor/blob/main/projects/emperor-of-dust/SYSTEMS-V02.md"
            class="link link-primary block text-xs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Systems bible ↗
          </a>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useEmperorOfDustStore } from '~/stores/emperorOfDustStore'
import {
  DAY_ONE_BRIEFINGS,
  DAY_ONE_INCIDENTS,
  KOMODO_DAY_ONE_HINT,
} from '~/utils/emperorOfDust/dayOne'
import { dayAt, timeAt } from '~/utils/emperorOfDust/engine'
import { followerProfile } from '~/utils/emperorOfDust/followers'
import { revealFalseReport } from '~/utils/emperorOfDust/relics'
import { IMPERIAL_REGIONS } from '~/utils/emperorOfDust/map'
import {
  remainingCandidates,
  remainingRecoveryDays,
} from '~/utils/emperorOfDust/progression'
import type {
  Dispatch,
  Follower,
  Incident,
  OddsPreview,
} from '~/utils/emperorOfDust/types'

const user = useUserStore()
const court = useEmperorOfDustStore()
const campaign = computed(() => court.campaign)
const selectedRegionId = ref('hollow-bell')
const selectedIncidentId = ref<string | null>('d001-aqueduct')
const selectedChoiceId = ref('repair')
const chosenIds = ref<string[]>([])
const troops = ref(10)
const useHourglass = ref(false)
const notice = ref('')
const confirmRestart = ref(false)

const selectedRegion = computed(() =>
  IMPERIAL_REGIONS.find((region) => region.id === selectedRegionId.value),
)
const selectedIncident = computed(() =>
  DAY_ONE_INCIDENTS.find(
    (incident) => incident.id === selectedIncidentId.value,
  ),
)
const figures = computed(() => [
  { label: 'Day', value: String(court.day) + ' / 100' },
  { label: 'Prosperity', value: String(campaign.value?.prosperity ?? 0) },
  { label: 'Popularity', value: String(campaign.value?.popularity ?? 0) },
  { label: 'Horde at tower', value: String(court.freeHorde) },
  { label: 'Leaders ready', value: String(court.ready.length) },
])
const MAX_PILOT_HOUR = timeAt(8, 7)
const canAdvance = computed(
  () => !!campaign.value && campaign.value.hour < MAX_PILOT_HOUR,
)

const hourglassEquipped = computed(() =>
  (campaign.value?.equippedRelics ?? []).includes('komodo-brass-hourglass'),
)
const hourglassReady = computed(
  () =>
    hourglassEquipped.value &&
    (campaign.value?.relicUses?.['komodo-brass-hourglass'] ?? 0) !==
      court.day &&
    (selectedIncident.value?.outwardHours ?? 1) > 1,
)

const odds = computed<OddsPreview | null>(() => {
  if (
    !selectedIncident.value ||
    !campaign.value ||
    chosenIds.value.length === 0
  )
    return null
  try {
    return court.estimate(
      selectedIncident.value,
      chosenIds.value,
      troops.value,
      selectedChoiceId.value,
      useHourglass.value,
    )
  } catch {
    return null
  }
})

const recentLog = computed(() => campaign.value?.log.slice(-6).reverse() ?? [])

function timeLabel(hour: number): string {
  return String(hour % 24).padStart(2, '0') + ':00'
}

function incidentStatus(incident: Incident): string {
  if (!campaign.value) return 'Not loaded'
  if (campaign.value.dispatches.some((m) => m.incidentId === incident.id))
    return 'Expedition commissioned'
  if (campaign.value.ignoredIncidentIds.includes(incident.id))
    return 'No help was sent'
  if (campaign.value.hour < timeAt(incident.day, incident.opensAtHour))
    return 'Opens at ' + timeLabel(timeAt(incident.day, incident.opensAtHour))
  if (campaign.value.hour > timeAt(incident.day, incident.deadlineHour))
    return 'Petition expired'
  if (
    campaign.value.hour + incident.outwardHours >
    timeAt(incident.day, incident.deadlineHour)
  )
    return 'Too late to arrive'
  return 'Ready for orders'
}

function isDispatchable(incident: Incident): boolean {
  return incidentStatus(incident) === 'Ready for orders'
}

function selectIncident(incident: Incident) {
  selectedRegionId.value = incident.destinationId
  selectedIncidentId.value = incident.id
  selectedChoiceId.value = incident.choices[0]?.id ?? ''
  chosenIds.value = []
  troops.value = incident.hordeMinimum
  useHourglass.value = false
  notice.value = ''
}

function selectRegion(id: string) {
  selectedRegionId.value = id
  const incident = DAY_ONE_INCIDENTS.find((entry) => entry.destinationId === id)
  if (incident) selectIncident(incident)
  else selectedIncidentId.value = null
}

function toggleLeader(id: string) {
  if (chosenIds.value.includes(id)) {
    chosenIds.value = chosenIds.value.filter((selected) => selected !== id)
  } else if (chosenIds.value.length < 3) {
    chosenIds.value = [...chosenIds.value, id]
  }
}

function leaderName(id: string): string {
  return (
    campaign.value?.followers.find((follower) => follower.id === id)?.name ?? id
  )
}

function isInjured(leader: Follower): boolean {
  return !!campaign.value && remainingRecoveryDays(campaign.value, leader) > 0
}

function leaderPortrait(leader: Follower): string | null {
  const art = followerProfile(leader.id)?.art
  return isInjured(leader) ? (art?.injured ?? null) : (art?.portrait ?? null)
}

function leaderStatus(leader: Follower): string {
  if (!campaign.value) return 'Unavailable'
  if (leader.dead) return 'Memorialized'
  const journey = campaign.value.dispatches.find(
    (mission) =>
      mission.leaders.includes(leader.id) &&
      mission.returnsAt > campaign.value!.hour,
  )
  if (journey) return missionStatus(journey)
  const recovery = remainingRecoveryDays(campaign.value, leader)
  if (recovery > 0) return 'Injured · ' + recovery + ' day(s) to readiness'
  if ((leader.availableOnDay ?? 0) > court.day)
    return 'Arrives on Day ' + leader.availableOnDay
  return 'Ready'
}

function missionStatus(mission: Dispatch): string {
  const hour = campaign.value?.hour ?? 0
  if (hour >= mission.returnsAt) return 'Returned'
  if (hour < mission.arrivesAt) return 'Outbound'
  if (hour < mission.resolvesAt) return 'At the scene'
  return 'Returning'
}

function performOrder(action: () => void, successMessage: string) {
  try {
    action()
    notice.value = successMessage
  } catch (error) {
    notice.value =
      error instanceof Error
        ? error.message
        : 'This order could not be completed.'
  }
}

function sendParty() {
  if (!selectedIncident.value || !odds.value) return
  const incident = selectedIncident.value
  performOrder(
    () =>
      court.dispatch(
        incident,
        chosenIds.value,
        troops.value,
        selectedChoiceId.value,
        useHourglass.value,
      ),
    'The expedition departed the tower. Check the roads and the campaign ledger.',
  )
  chosenIds.value = []
  useHourglass.value = false
}

function sendNobody() {
  if (!selectedIncident.value) return
  performOrder(
    () => court.ignore(selectedIncident.value!),
    'The Emperor declined this petition. The consequences are in the ledger.',
  )
}

function advanceTo(target: number) {
  if (!campaign.value) return
  performOrder(
    () => court.advanceTo(Math.min(MAX_PILOT_HOUR, target)),
    'The court clock advanced. Expeditions and unanswered deadlines were resolved.',
  )
}

function advanceByOne() {
  if (campaign.value) advanceTo(campaign.value.hour + 1)
}

function advanceToNext() {
  if (!campaign.value) return
  const current = campaign.value.hour
  const events = [
    ...DAY_ONE_INCIDENTS.flatMap((incident) => [
      timeAt(incident.day, incident.opensAtHour),
      timeAt(incident.day, incident.deadlineHour) + 1,
    ]),
    ...campaign.value.dispatches.flatMap((mission) => [
      mission.arrivesAt,
      mission.resolvesAt,
      mission.returnsAt,
    ]),
    timeAt(Math.min(court.day + 1, 8), 7),
    MAX_PILOT_HOUR,
  ].filter((time) => time > current)
  advanceTo(Math.min(...events))
}

function advanceToMorning() {
  advanceTo(timeAt(Math.min(court.day + 1, 8), 7))
}

function recruit(id: string) {
  performOrder(
    () => court.recruit(id),
    'The new commander accepted their commission and will arrive tomorrow.',
  )
}

function restartRun() {
  performOrder(() => court.beginNewRun(), 'The court opened a new pilot run.')
  selectedRegionId.value = 'hollow-bell'
  selectedIncidentId.value = 'd001-aqueduct'
  selectedChoiceId.value = 'repair'
  chosenIds.value = []
  troops.value = 10
  confirmRestart.value = false
  useHourglass.value = false
}

onMounted(async () => {
  await user.initialize()
  if (user.isAdmin) court.load()
})
</script>
