<template>
  <main
    class="kr-surface scpvp h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    data-testid="slime-pvp"
  >
    <header-page-bar
      v-if="!(narrowScreen && pvp.duel?.stage === 'battle')"
      console-theme="slime-city"
    >
      <nav class="scpvp-top" aria-label="Slime City multiplayer">
        <NuxtLink to="/play/slime-city?vs=1">← VS</NuxtLink>
        <strong>THE TWO-PLAYER PIT</strong>
        <button
          v-if="pvp.duel?.stage === 'battle'"
          type="button"
          class="scpvp-concede"
          :disabled="pvp.sending"
          @click="confirmForfeit"
        >
          {{ forfeitArmed ? 'CONFIRM FORFEIT' : 'FORFEIT' }}
        </button>
        <span>PRIVATE INVITE · PREVIEW</span>
        <SlimeCitySoundToggle />
      </nav>
    </header-page-bar>

    <div class="scpvp-stage">
      <p v-if="pvp.error" class="scpvp-error" role="alert">
        {{ pvp.error }}
      </p>

      <section
        v-if="!pvp.duel || answering"
        class="scpvp-lobby"
        aria-label="Create or join a duel"
      >
        <div class="scpvp-poster">
          <SlimeCityArtwork
            :image-id="
              slimeArtId('crews', answering ? pvp.duel!.hostTeam : selectedTeam)
            "
            :alt="nameOf(selectedTeam) + ' crew poster'"
            fallback="⚔"
            compact
          />
          <div class="scpvp-poster-copy">
            <small>TWENTY CARDS · FIVE ALLEYS · THREE EVOLUTIONS</small>
            <strong class="scpvp-poster-title">
              {{ invitedId ? 'ANSWER THE CHALLENGE' : 'FIGHT A REAL RIVAL' }}
            </strong>
            <p>
              {{
                answering
                  ? (pvp.duel!.challenge ? 'Your friend' : 'Your rival') +
                    ' brings ' +
                    nameOf(pvp.duel!.hostTeam) +
                    '. Pick your crew, then enter the pit.'
                  : invitedId
                    ? 'Pick your crew, then enter the pit.'
                    : 'Choose a crew, create a private duel, and send your opponent the invitation.'
              }}
            </p>
          </div>
        </div>
        <div class="scpvp-lobby-tools">
          <div
            class="scpvp-crew-grid"
            role="group"
            aria-label="Choose your crew"
          >
            <button
              v-for="team in TEAMS"
              :key="team.id"
              type="button"
              :class="{ chosen: selectedTeam === team.id }"
              :aria-pressed="selectedTeam === team.id"
              :aria-label="team.name"
              @click="selectedTeam = team.id"
            >
              <SlimeCityArtwork
                :image-id="slimeArtId('crews', team.id)"
                :alt="team.name"
                :fallback="team.insignia"
                compact
              />
              <span>{{ team.name }}</span>
            </button>
          </div>
          <div
            v-if="!invitedId"
            class="scpvp-visibility"
            role="group"
            aria-label="Who can join"
          >
            <button
              type="button"
              :aria-pressed="!openDuel"
              data-testid="slime-pvp-private"
              @click="openDuel = false"
            >
              PRIVATE LINK
            </button>
            <button
              type="button"
              :aria-pressed="openDuel"
              data-testid="slime-pvp-open"
              @click="openDuel = true"
            >
              OPEN TO ANYONE
            </button>
          </div>
          <button
            class="scpvp-primary"
            type="button"
            :disabled="pvp.sending || pvp.loading"
            @click="invitedId ? join() : start()"
          >
            {{
              pvp.sending
                ? 'OPENING THE GATES…'
                : invitedId
                  ? 'JOIN THIS DUEL'
                  : openDuel
                    ? 'CREATE OPEN DUEL'
                    : 'CREATE PRIVATE DUEL'
            }}
          </button>
          <button
            v-if="answering && pvp.duel!.challenge"
            type="button"
            class="scpvp-quiet"
            :class="{ armed: cancelArmed }"
            :disabled="pvp.sending"
            data-testid="slime-pvp-decline"
            @click="cancelDuel"
          >
            {{ cancelArmed ? 'SURE? DECLINE' : 'DECLINE CHALLENGE' }}
          </button>
          <p class="scpvp-note">
            {{
              answering
                ? pvp.duel!.challenge
                  ? 'This challenge was sent to you.'
                  : pvp.duel!.open
                    ? 'Open challenge: the first player to join takes the seat.'
                    : 'You hold a private invite.'
                : openDuel
                  ? 'Open duels are listed in VS for any signed-in player.'
                  : 'Only someone with your link can join.'
            }}
            These fights award no Meat or cards.
          </p>
        </div>
      </section>

      <section
        v-else-if="pvp.duel.stage === 'waiting'"
        class="scpvp-waiting"
        aria-label="Waiting for rival"
      >
        <div class="scpvp-poster">
          <SlimeCityArtwork
            :image-id="slimeArtId('crews', pvp.duel.hostTeam)"
            :alt="nameOf(pvp.duel.hostTeam)"
            compact
          />
          <div class="scpvp-poster-copy">
            <small>YOUR CREW IS IN THE PIT</small>
            <strong class="scpvp-poster-title">{{
              pvp.duel.challenge
                ? 'CHALLENGE SENT'
                : pvp.duel.open
                  ? 'OPEN CHALLENGE'
                  : 'ONE FIGHTER SHORT'
            }}</strong>
            <p>
              {{
                pvp.duel.challenge
                  ? 'Your friend got a notification. This page wakes up when they answer.'
                  : pvp.duel.open
                    ? 'Listed in VS for any signed-in player to join. This page wakes up when someone does.'
                    : 'Share this private invite with another signed-in player. Your duel resumes from this link, even after a refresh.'
              }}
            </p>
          </div>
        </div>
        <div class="scpvp-invite">
          <label for="scpvp-invite-link">INVITE LINK</label>
          <input id="scpvp-invite-link" readonly :value="inviteLink" />
          <button type="button" class="scpvp-primary" @click="copyInvite">
            {{ copied ? 'COPIED!' : 'COPY INVITE' }}
          </button>
          <p>Watching for your opponent…</p>
          <button
            type="button"
            class="scpvp-quiet"
            :class="{ armed: cancelArmed }"
            :disabled="pvp.sending"
            data-testid="slime-pvp-cancel"
            @click="cancelDuel"
          >
            {{ cancelArmed ? 'SURE? CANCEL IT' : 'CANCEL THIS DUEL' }}
          </button>
        </div>
      </section>

      <section
        v-else-if="board && pvp.duel && finished && !reviewBoard"
        class="scpvp-result"
        aria-label="Duel result"
        data-testid="slime-pvp-result"
      >
        <div class="scpvp-result-crews">
          <figure
            v-for="side in resultSides"
            :key="side"
            :class="{
              won: pvp.duel.outcome === side,
              lost: pvp.duel.outcome !== side && pvp.duel.outcome !== 'draw',
            }"
          >
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', teamOf(side))"
              :alt="nameOf(teamOf(side))"
              fallback="⚔"
              compact
            />
            <figcaption>
              <small>{{
                side === pvp.duel.seat
                  ? 'YOU'
                  : (pvp.duel.rivalName ?? 'RIVAL').toUpperCase()
              }}</small>
              <strong>{{ nameOf(teamOf(side)) }}</strong>
              <b>♥ {{ Math.max(0, board.boss[side]) }}</b>
            </figcaption>
          </figure>
        </div>
        <div class="scpvp-result-copy">
          <small>FINAL BELL · ROUND {{ board.round }}</small>
          <strong
            class="scpvp-result-title"
            :class="{ 'is-loss': resultKind === 'loss' }"
            >{{ resultHeadline }}</strong
          >
          <p>{{ resultNote }}</p>
          <div class="scpvp-result-actions">
            <button
              v-if="rivalIsFriend || !pvp.friendsLoaded"
              type="button"
              class="scpvp-primary"
              :disabled="pvp.sending || !pvp.canRematch"
              data-testid="slime-pvp-rematch"
              @click="rematch"
            >
              {{ pvp.sending ? 'SENDING…' : 'REMATCH' }}
            </button>
            <button
              v-else
              type="button"
              class="scpvp-primary"
              :disabled="pvp.sending || friendAsked || !pvp.duel.rivalId"
              data-testid="slime-pvp-befriend"
              @click="befriendRival"
            >
              {{
                friendAsked ? 'FRIEND REQUEST SENT' : 'ADD FRIEND TO REMATCH'
              }}
            </button>
            <NuxtLink
              to="/play/slime-city?vs=1"
              class="scpvp-quiet"
              data-testid="slime-pvp-back-vs"
              >BACK TO VS</NuxtLink
            >
            <button
              type="button"
              class="scpvp-quiet"
              data-testid="slime-pvp-final-board"
              @click="reviewBoard = true"
            >
              SEE FINAL BOARD
            </button>
          </div>
        </div>
      </section>

      <section
        v-else-if="board && pvp.duel"
        class="scpvp-battle"
        aria-label="Live CLASH duel"
      >
        <div class="scpvp-versus">
          <NuxtLink
            v-if="narrowScreen"
            class="scpvp-back"
            to="/play/slime-city?vs=1"
            aria-label="Back to VS"
            >‹</NuxtLink
          >
          <div v-for="side in lineup" :key="side" class="scpvp-boss">
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', teamOf(side))"
              :alt="nameOf(teamOf(side))"
              compact
            />
            <div>
              <small>{{
                side === pvp.duel.seat ? 'YOUR BOSS' : 'RIVAL BOSS'
              }}</small>
              <strong>{{ nameOf(teamOf(side)) }}</strong>
              <b>♥ {{ board.boss[side] }} / 40</b>
            </div>
          </div>
          <div class="scpvp-turn" aria-live="polite">
            <b>{{
              finished
                ? resultHeadline
                : pvp.isMyTurn
                  ? 'YOUR TURN'
                  : 'RIVAL THINKING'
            }}</b>
            <small
              >ROUND {{ board.round }} · {{ board.phase.toUpperCase() }}</small
            >
            <button
              v-if="finished"
              type="button"
              class="scpvp-result-link"
              @click="reviewBoard = false"
            >
              RESULT ›
            </button>
          </div>
          <SlimeCitySoundToggle v-if="narrowScreen" class="scpvp-sound" />
          <button
            v-if="narrowScreen && !finished"
            type="button"
            class="scpvp-flag"
            :class="{ armed: forfeitArmed }"
            :disabled="pvp.sending"
            :aria-label="forfeitArmed ? 'Confirm forfeit' : 'Forfeit'"
            data-testid="slime-pvp-forfeit"
            @click="confirmForfeit"
          >
            {{ forfeitArmed ? 'SURE?' : '⚑' }}
          </button>
        </div>

        <div class="scpvp-field" role="grid" aria-label="Five CLASH alleys">
          <SlimeCityArtwork
            class="scpvp-arena-art"
            :image-id="slimeArtId('boards', 'pitworks-blackout')"
            alt="Painted arena floor"
            compact
          />
          <div
            v-for="(side, row) in lineup"
            :key="side"
            class="scpvp-row"
            :class="row === 0 ? 'is-top' : 'is-bottom'"
            role="row"
          >
            <button
              v-for="lane in 5"
              :key="side + lane"
              type="button"
              role="gridcell"
              class="scpvp-slot"
              :class="{
                'can-target':
                  pvp.isMyTurn &&
                  board.phase === 'play' &&
                  (selectedCard || chosenPower),
                occupied: !!unit(side, lane - 1),
              }"
              :aria-label="slotLabel(side, lane - 1)"
              :disabled="
                !pvp.isMyTurn ||
                board.phase !== 'play' ||
                (!selectedCard && !chosenPower) ||
                pvp.sending
              "
              @click="playLane(lane - 1)"
            >
              <template v-if="unit(side, lane - 1)">
                <SlimeCityArtwork
                  :image-id="
                    slimeCardArtId(
                      unit(side, lane - 1)!.cardId,
                      unit(side, lane - 1)!.level,
                      unit(side, lane - 1)!.evoChoice ?? 0,
                    )
                  "
                  :alt="cardById(unit(side, lane - 1)!.cardId).name"
                  :fallback="cardById(unit(side, lane - 1)!.cardId).symbol"
                  compact
                />
                <span class="scpvp-stats">
                  <b>⚔ {{ unit(side, lane - 1)!.power }}</b>
                  <b>♥ {{ unit(side, lane - 1)!.hp }}</b>
                </span>
                <span class="scpvp-unit-title">{{
                  cardById(unit(side, lane - 1)!.cardId).name
                }}</span>
                <span class="scpvp-unit-level">{{
                  '★'.repeat(unit(side, lane - 1)!.level)
                }}</span>
              </template>
              <span v-else class="scpvp-empty">{{ lane }}</span>
              <span
                v-if="
                  board.traps.some(
                    (trap) => trap.side === side && trap.lane === lane - 1,
                  )
                "
                class="scpvp-own-trap"
                aria-label="Your hidden trap in this alley"
                >✦ ARMED</span
              >
            </button>
          </div>
          <span class="scpvp-midline">FIVE ALLEYS · NO MAN'S LAND</span>
        </div>

        <div class="scpvp-controls">
          <div class="scpvp-hand" aria-label="Your five-card hand">
            <button
              v-for="id in board.hand"
              :key="id"
              type="button"
              class="scpvp-card"
              :class="{ selected: selectedCard === id }"
              :disabled="!pvp.isMyTurn || board.phase !== 'play' || pvp.sending"
              :aria-pressed="selectedCard === id"
              :aria-label="
                cardById(id).name + ', level ' + (board.levels[id] ?? 1)
              "
              @click="pickCard(id)"
            >
              <SlimeCityClashCardFace
                :card-id="id"
                :level="board.levels[id] ?? 1"
              />
            </button>
            <p v-if="!board.hand.length">
              Your hand is empty. Send the crew into battle.
            </p>
          </div>
          <div class="scpvp-actions">
            <p>
              {{ board.hand.length }} IN HAND · {{ board.deckCount }} IN DECK ·
              OPPONENT {{ board.opponentHandCount }} HIDDEN
            </p>
            <div
              v-if="
                selectedCard &&
                clashEvolutionChoice(
                  selectedCard,
                  board.levels[selectedCard] ?? 1,
                )
              "
              class="scpvp-choice"
            >
              <button
                type="button"
                :aria-pressed="choice === 0"
                @click="choice = 0"
              >
                EVOLUTION A
              </button>
              <button
                type="button"
                :aria-pressed="choice === 1"
                @click="choice = 1"
              >
                EVOLUTION B
              </button>
            </div>
            <button
              v-if="pvp.isMyTurn && board.phase === 'play'"
              type="button"
              :aria-pressed="chosenPower"
              :disabled="pvp.sending"
              @click="togglePower"
            >
              {{ chosenPower ? 'CHOOSE POWER TARGET' : 'FACTION POWER' }}
            </button>
            <button
              type="button"
              class="scpvp-primary"
              :disabled="!pvp.isMyTurn || pvp.sending || !!board.victor"
              @click="advance"
            >
              {{
                board.phase === 'play'
                  ? 'FIGHT · START ATTACKS'
                  : board.nextStrike >= 0
                    ? 'STRIKE NEXT ALLEY'
                    : 'END TURN'
              }}
            </button>
            <button type="button" @click="showLog = !showLog">
              {{ showLog ? 'CLOSE LOG' : 'BATTLE LOG' }}
            </button>
          </div>
        </div>

        <div
          v-if="showLog"
          class="scpvp-log kr-scroll"
          role="log"
          aria-label="Battle log"
        >
          <p v-for="(entry, i) in board.log.slice(-15)" :key="i">
            <small>R{{ entry.round }}</small> {{ entry.text }}
          </p>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useNavStore } from '@/stores/navStore'
import { useSlimeCityPvpStore } from '~/stores/slimeCityPvp'
import { useSlimeCitySoundStore } from '~/stores/slimeCitySound'
import {
  clashIsTense,
  clashSoundCues,
  pvpSoundView,
} from '~/utils/slimeCity/sound'
import {
  cardById,
  TEAMS,
  type Side,
  type TeamId,
} from '~/utils/slimeCity/prototypes'
import { clashEvolutionChoice } from '~/utils/slimeCity/clashEvolutions'
import { slimeArtId, slimeCardArtId } from '~/utils/slimeCity/artManifest'

const route = useRoute()
const router = useRouter()
const pvp = useSlimeCityPvpStore()
const forfeitArmed = ref(false)
async function confirmForfeit() {
  if (!forfeitArmed.value) {
    forfeitArmed.value = true
    return
  }
  forfeitArmed.value = false
  await pvp.forfeit()
}
const invitedId = computed(() =>
  typeof route.query.duel === 'string' ? route.query.duel : '',
)
const selectedTeam = ref<TeamId>('catgirls')
/** A friend's challenge waiting for this player to pick a crew and join. */
const answering = computed(
  () => pvp.duel?.stage === 'waiting' && pvp.duel.seat === 'enemy',
)
const selectedCard = ref<string | null>(null)
const chosenPower = ref(false)
const choice = ref<0 | 1>(0)
const copied = ref(false)
const showLog = ref(false)
const board = computed(() => pvp.duel?.board ?? null)
const lineup = computed<Side[]>(() =>
  pvp.duel?.seat === 'enemy' ? ['player', 'enemy'] : ['enemy', 'player'],
)
const inviteLink = computed(() => {
  if (!pvp.duel) return ''
  const path = '/play/slime-city-pvp?duel=' + encodeURIComponent(pvp.duel.id)
  return import.meta.client ? location.origin + path : path
})

/** Silas, 2026-11-11 PT: "finalize multiplayer": the duel ends on a result. */
const finished = computed(() => pvp.duel?.stage === 'finished')
const reviewBoard = ref(false)
const friendAsked = ref(false)
const resultSides = computed<Side[]>(() =>
  pvp.duel?.seat === 'enemy' ? ['enemy', 'player'] : ['player', 'enemy'],
)
const resultKind = computed(() => {
  const victor = pvp.duel?.outcome
  if (!victor || victor === 'draw') return 'draw'
  return victor === pvp.duel?.seat ? 'win' : 'loss'
})
const resultHeadline = computed(() =>
  resultKind.value === 'draw'
    ? 'DRAW'
    : resultKind.value === 'win'
      ? 'YOU WIN!'
      : (pvp.duel?.rivalName?.toUpperCase() ?? 'RIVAL') + ' WINS',
)
const resultNote = computed(() => {
  const forfeit = pvp.duel?.forfeitedBy
  const how = forfeit
    ? forfeit === pvp.duel?.seat
      ? 'You forfeited.'
      : 'Your rival forfeited.'
    : 'Boss life at the final bell.'
  return how + ' VS duels award no Meat or cards.'
})
const rivalIsFriend = computed(() =>
  pvp.friends.some((friend) => friend.id === pvp.duel?.rivalId),
)
watch(
  finished,
  (done) => {
    if (done && !pvp.friendsLoaded) void pvp.loadFriends()
  },
  { immediate: true },
)
async function rematch() {
  const data = await pvp.rematch()
  if (!data) return
  reviewBoard.value = false
  await router.replace({ query: { duel: data.id } })
  pvp.watchDuel(data.id)
}
async function befriendRival() {
  const id = pvp.duel?.rivalId
  if (id && (await pvp.addFriend(id))) friendAsked.value = true
}

function nameOf(team: TeamId) {
  return TEAMS.find((entry) => entry.id === team)?.name ?? team
}
function teamOf(side: Side): TeamId {
  return (
    (side === 'player' ? pvp.duel?.hostTeam : pvp.duel?.guestTeam) ?? 'catgirls'
  )
}
function unit(side: Side, lane: number) {
  return board.value?.units.find(
    (item) => item.side === side && item.lane === lane,
  )
}
function slotLabel(side: Side, lane: number) {
  const fighter = unit(side, lane)
  return (
    (side === pvp.duel?.seat ? 'Your' : 'Rival') +
    ' alley ' +
    (lane + 1) +
    (fighter
      ? ', ' +
        cardById(fighter.cardId).name +
        ' level ' +
        fighter.level +
        ', ' +
        fighter.hp +
        ' life'
      : ', empty')
  )
}
function pickCard(id: string) {
  selectedCard.value = selectedCard.value === id ? null : id
  chosenPower.value = false
  choice.value = 0
}
function togglePower() {
  chosenPower.value = !chosenPower.value
  selectedCard.value = null
}
async function playLane(lane: number) {
  if (chosenPower.value) {
    if (await pvp.send({ t: 'power', lane })) chosenPower.value = false
  } else if (selectedCard.value) {
    if (
      await pvp.send({
        t: 'play',
        card: selectedCard.value,
        lane,
        ...(choice.value === 1 ? { choice: 1 as const } : {}),
      })
    )
      selectedCard.value = null
  }
}
async function advance() {
  if (!board.value) return
  const t =
    board.value.phase === 'play'
      ? 'pass'
      : board.value.nextStrike >= 0
        ? 'strike'
        : 'end'
  if (await pvp.send({ t })) {
    selectedCard.value = null
    chosenPower.value = false
  }
}
/** Silas, 2026-11-11 PT: "Invites should be private or open". */
const openDuel = ref(false)
/** Silas, 2026-11-11 PT: "Invites should be cancellable." Two taps. */
const cancelArmed = ref(false)
async function cancelDuel() {
  const id = pvp.duel?.id
  if (!id) return
  if (!cancelArmed.value) {
    cancelArmed.value = true
    return
  }
  cancelArmed.value = false
  pvp.stopWatching()
  if (await pvp.cancel(id)) await navigateTo('/play/slime-city?vs=1')
  else pvp.watchDuel(id)
}
async function start() {
  const data = await pvp.start(selectedTeam.value, { isPublic: openDuel.value })
  if (data) {
    await router.replace({ query: { duel: data.id } })
    pvp.watchDuel(data.id)
  }
}
async function join() {
  if (!invitedId.value) return
  const data = await pvp.join(invitedId.value, selectedTeam.value)
  if (data) pvp.watchDuel(data.id)
}
async function copyInvite() {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}
onMounted(async () => {
  if (invitedId.value) {
    await pvp.load(invitedId.value)
    pvp.watchDuel(invitedId.value)
  }
})
onBeforeUnmount(() => pvp.stopWatching())

/**
 * Silas, 2026-11-11 PT: the two-player board gets the phone battle layout.
 * In battle on a phone only the site header remains ("at most one row of a
 * header"); back and forfeit ride in the versus strip, the board takes the
 * rest and the hand fans up from the bottom edge.
 */
const narrowScreen = ref(false)
let narrowQuery: MediaQueryList | null = null
function syncNarrow(): void {
  narrowScreen.value = !!narrowQuery?.matches
}
const navStore = useNavStore()
let themeId = 0
onMounted(() => {
  themeId = navStore.registerConsoleTheme('slime-city')
  narrowQuery = window.matchMedia('(max-width: 600px)')
  syncNarrow()
  narrowQuery.addEventListener('change', syncNarrow)
})
onBeforeUnmount(() => {
  narrowQuery?.removeEventListener('change', syncNarrow)
  navStore.releasePageBar(themeId)
  sound.detach()
})

/** The duel plays the same music and effects as a CPU Clash, heard from this seat. */
const sound = useSlimeCitySoundStore()
onMounted(() => sound.attach())
watch(
  () => {
    const live = pvp.duel?.stage === 'battle' && board.value
    if (!live) return 'title' as const
    return clashIsTense(board.value!.boss, board.value!.victor)
      ? ('showdown' as const)
      : ('battle' as const)
  },
  (music) => sound.setScene(music),
  { immediate: true },
)
watch(
  () => [pvp.duel?.id, board.value] as const,
  ([id, next], [previousId, prev]) => {
    if (!next || !prev || !pvp.duel || id !== previousId) return
    sound.cue(
      clashSoundCues(pvpSoundView(prev), pvpSoundView(next), pvp.duel.seat),
    )
  },
)
watch(
  () => pvp.duel?.stage,
  (stage, before) => {
    if (stage === 'battle' && before === 'waiting') sound.cue('bell')
  },
)
</script>

<style scoped>
.scpvp-concede {
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 700;
}
.scpvp-concede:hover,
.scpvp-concede:focus-visible {
  color: #fca5a5;
}

.scpvp {
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at 45% 20%, #29313e 0%, #090e15 75%);
  color: #ecf5e9;
}
.scpvp-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
  font-size: 0.77rem;
  letter-spacing: 0.12em;
}
.scpvp-top a {
  color: #b9f151;
  font-weight: 850;
}
.scpvp-top strong {
  font-size: 0.95rem;
}
.scpvp-top span {
  color: #9bb0a7;
}
.scpvp-stage {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: clip;
}
.scpvp-error {
  position: absolute;
  z-index: 20;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: #6a2634;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  max-width: 85%;
}
.scpvp-lobby,
.scpvp-waiting {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: clamp(0.6rem, 2vw, 1.6rem);
  height: 100%;
  padding: clamp(0.6rem, 2vw, 1.4rem);
}
.scpvp-poster {
  position: relative;
  overflow: hidden;
  border-radius: 1.25rem;
  background: #18242c;
  min-height: 0;
}
.scpvp-poster > :first-child {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.scpvp-poster-copy {
  position: absolute;
  inset: auto 0 0;
  padding: clamp(1rem, 3vw, 2rem);
  background: linear-gradient(transparent, #09131bea 40%);
}
.scpvp-poster-title {
  display: block;
  font-size: clamp(1.35rem, 3vw, 3rem);
  font-weight: 950;
  line-height: 1;
  margin: 0.35rem 0;
}
.scpvp-poster-copy small {
  color: #c9f56c;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.scpvp-poster-copy p {
  max-width: 36rem;
  font-size: 0.95rem;
}
.scpvp-lobby-tools,
.scpvp-invite {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}
.scpvp-crew-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}
.scpvp-crew-grid button {
  border: 2px solid #416264;
  border-radius: 0.75rem;
  overflow: hidden;
  text-align: left;
  background: #112933;
}
.scpvp-crew-grid button.chosen {
  border-color: #d4f960;
  box-shadow: 0 0 0 2px #d4f96044;
}
.scpvp-crew-grid button > :first-child {
  width: 100%;
  aspect-ratio: 4/3;
}
.scpvp-crew-grid button span {
  display: block;
  padding: 0.35rem;
  font-size: 0.75rem;
  font-weight: 800;
}
.scpvp-primary {
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  background: #c4f25d;
  color: #111b15;
  font-weight: 950;
  letter-spacing: 0.03em;
}
.scpvp-visibility {
  display: flex;
  gap: 0.35rem;
}
.scpvp-visibility button {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #586e68;
  border-radius: 0.6rem;
  background: #16262b;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.scpvp-visibility button[aria-pressed='true'] {
  border-color: #c4f25d;
  color: #c4f25d;
}
.scpvp-quiet {
  padding: 0.55rem 1rem;
  border: 1px solid #586e68;
  border-radius: 0.8rem;
  background: transparent;
  color: #c7d6d0;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.scpvp-quiet.armed {
  border-color: #ff6f7a;
  background: #4b1f26;
  color: #ffd6dc;
}
.scpvp-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.scpvp-note,
.scpvp-invite p {
  font-size: 0.8rem;
  color: #bdcfc9;
}
.scpvp-invite input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #759287;
  border-radius: 0.5rem;
  color: #f6faed;
  background: #15232a;
}
.scpvp-battle {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 0.4rem;
  padding: 0.5rem;
}
.scpvp-versus {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  min-height: 0;
}
.scpvp-boss {
  display: flex;
  gap: 0.45rem;
  align-items: center;
  min-width: 0;
  width: 36%;
  border: 1px solid #4d665e;
  border-radius: 0.7rem;
  padding: 0.25rem;
  background: #14262bc9;
}
.scpvp-boss > :first-child {
  width: clamp(2.5rem, 6vw, 4.5rem);
  height: clamp(2.5rem, 6vw, 4.5rem);
  border-radius: 0.4rem;
  overflow: hidden;
  flex-shrink: 0;
}
.scpvp-boss div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
}
.scpvp-boss strong {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.scpvp-boss b {
  color: #f6b6a3;
}
.scpvp-turn {
  text-align: center;
  display: flex;
  flex-direction: column;
  font-weight: 850;
  color: #d2f364;
}
.scpvp-turn small {
  color: #a9bfb7;
  font-size: 0.65rem;
}
.scpvp-field {
  position: relative;
  min-height: 0;
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  gap: 0.3rem;
  overflow: hidden;
  border: 1px solid #566c70;
  border-radius: 1rem;
  padding: 0.45rem;
}
.scpvp-arena-art {
  position: absolute;
  inset: 0;
  opacity: 0.42;
  pointer-events: none;
}
.scpvp-row.is-top {
  grid-row: 1;
}
.scpvp-row.is-bottom {
  grid-row: 3;
}
.scpvp-midline {
  grid-row: 2;
}
.scpvp-back,
.scpvp-flag {
  flex: none;
  display: grid;
  place-items: center;
  min-width: 1.9rem;
  height: 2.2rem;
  padding: 0 0.4rem;
  border: 1px solid #5c99917a;
  border-radius: 0.5rem;
  background: #10231f;
  color: #c9ee5a;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
}
.scpvp-flag {
  color: #f6b6a3;
  font-size: 0.9rem;
}
.scpvp-flag.armed {
  border-color: #ff6f7a;
  background: #4b1f26;
  color: #ffd6dc;
  font-size: 0.6rem;
}
.scpvp-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
  min-height: 0;
}
.scpvp-slot {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 2px solid #708b80;
  border-radius: 0.65rem;
  overflow: hidden;
  background: #0a1619bd;
}
.scpvp-slot.can-target {
  border-color: #c9ee5a;
  box-shadow: inset 0 0 1rem #c9ee5a44;
  cursor: crosshair;
}
.scpvp-slot > :first-child {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.scpvp-stats {
  position: absolute;
  inset: 0.15rem 0.15rem auto;
  display: flex;
  justify-content: space-between;
  gap: 0.2rem;
  font-size: clamp(0.65rem, 1.7vw, 1.25rem);
  font-weight: 950;
  text-shadow: 1px 2px 3px #000;
}
.scpvp-stats b {
  padding: 0 0.2rem;
  border-radius: 0.3rem;
  background: #101b1cde;
}
.scpvp-unit-title {
  position: absolute;
  inset: auto 0 0;
  padding: 0.35rem 0.2rem;
  background: linear-gradient(transparent, #07141bef);
  font-size: clamp(0.52rem, 1.1vw, 0.8rem);
  font-weight: 900;
}
.scpvp-unit-level {
  position: absolute;
  right: 0.2rem;
  bottom: 1.5rem;
  color: #ffdb76;
  font-size: 0.6rem;
}
.scpvp-own-trap {
  position: absolute;
  left: 0.2rem;
  bottom: 1.45rem;
  padding: 0.1rem 0.24rem;
  border-radius: 0.25rem;
  background: #152632ea;
  color: #e8f787;
  font-size: 0.59rem;
  font-weight: 900;
}
.scpvp-empty {
  color: #6c8882;
  font-size: 1.5rem;
  font-weight: 950;
}
.scpvp-midline {
  text-align: center;
  color: #ebd39a;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  align-self: center;
}
.scpvp-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.4rem;
  min-height: 0;
}
.scpvp-hand {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 0.35rem;
  min-width: 0;
  min-height: 0;
  height: clamp(8rem, 30vh, 13rem);
}
.scpvp-card {
  flex: 0 1 auto;
  height: 100%;
  min-width: 0;
  aspect-ratio: 2 / 3;
  position: relative;
  border: 2px solid #526e69;
  border-radius: 0.5rem;
  transition:
    transform 0.18s ease,
    border-color 0.18s;
}
.scpvp-card.selected {
  border-color: #d9ff6a;
  transform: translateY(-0.5rem);
  z-index: 2;
  --rules-open: 1;
}
.scpvp-card:hover,
.scpvp-card:focus-visible {
  --rules-open: 1;
  transform: translateY(-0.35rem);
  z-index: 3;
}
.scpvp-actions {
  max-width: 13rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.scpvp-actions p {
  color: #aabfb8;
  font-size: 0.65rem;
}
.scpvp-actions > button:not(.scpvp-primary),
.scpvp-choice button {
  border: 1px solid #7a9687;
  border-radius: 0.4rem;
  background: #13252b;
  font-size: 0.75rem;
  padding: 0.35rem;
}
.scpvp-choice {
  display: flex;
  gap: 0.25rem;
}
.scpvp-choice button[aria-pressed='true'] {
  background: #526c2c;
}
.scpvp-log {
  position: absolute;
  z-index: 10;
  top: 4.5rem;
  right: 0.5rem;
  bottom: 9rem;
  width: min(22rem, 86%);
  padding: 0.8rem;
  background: #0c1c22f2;
  border: 1px solid #8da69a;
  border-radius: 0.75rem;
  overflow-y: auto;
  font-size: 0.75rem;
}
.scpvp-log p {
  border-bottom: 1px solid #49605e;
  padding: 0.3rem;
}
.scpvp-log small {
  color: #c9ee5a;
}
.scpvp-result {
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: clamp(0.6rem, 2vw, 1.6rem);
  padding: clamp(0.6rem, 2vw, 1.4rem);
  overflow: hidden;
}
.scpvp-result-crews {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  min-height: 0;
}
.scpvp-result-crews figure {
  position: relative;
  margin: 0;
  min-height: 0;
  overflow: hidden;
  border: 2px solid #416264;
  border-radius: 1.25rem;
  background: #18242c;
}
.scpvp-result-crews figure.won {
  border-color: #d4f960;
  box-shadow: 0 0 0 2px #d4f96044;
}
.scpvp-result-crews figure > :first-child {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.scpvp-result-crews figure.lost > :first-child {
  filter: grayscale(0.7) brightness(0.7);
}
.scpvp-result-crews figcaption {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(0.4rem, 1.5vw, 1rem);
  background: linear-gradient(transparent, #09131bea 40%);
}
.scpvp-result-crews figcaption small {
  overflow: hidden;
  color: #c9f56c;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.scpvp-result-crews figcaption strong {
  font-size: clamp(0.75rem, 1.6vw, 1.2rem);
}
.scpvp-result-crews figcaption b {
  color: #f6b6a3;
  font-size: clamp(1.1rem, 2.6vw, 2rem);
  font-weight: 950;
  line-height: 1;
}
.scpvp-result-copy {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.7rem;
}
.scpvp-result-copy > small {
  color: #c9f56c;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.scpvp-result-copy p {
  color: #bdcfc9;
  font-size: 0.85rem;
}
.scpvp-result-title {
  color: #d2f364;
  font-size: clamp(1.6rem, 4vw, 3.4rem);
  font-weight: 950;
  line-height: 1;
}
.scpvp-result-title.is-loss {
  color: #f6b6a3;
}
.scpvp-result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.scpvp-result-actions > a {
  text-align: center;
}
.scpvp-result-link {
  margin-top: 0.15rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid #c9ee5a;
  border-radius: 0.4rem;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
}
@media (max-width: 690px) {
  .scpvp-top span {
    display: none;
  }
  .scpvp-result {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .scpvp-result-copy {
    gap: 0.45rem;
  }
  .scpvp-result-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .scpvp-result-actions > * {
    flex: 1 1 auto;
  }
  .scpvp-result-actions > .scpvp-primary {
    flex-basis: 100%;
  }
  .scpvp-lobby,
  .scpvp-waiting {
    grid-template-columns: 1fr;
    grid-template-rows: 42% 1fr;
  }
  .scpvp-poster-copy {
    padding: 0.6rem;
  }
  .scpvp-crew-grid button > :first-child {
    aspect-ratio: 2/1;
  }
  .scpvp-crew-grid button span {
    font-size: 0.59rem;
  }
  .scpvp-lobby-tools {
    gap: 0.4rem;
  }
  .scpvp-boss {
    width: 38%;
  }
  .scpvp-boss strong {
    font-size: 0.62rem;
  }
  .scpvp-boss small {
    display: none;
  }
  .scpvp-turn {
    font-size: 0.65rem;
  }
  .scpvp-battle {
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .scpvp-controls {
    grid-template-columns: minmax(0, 1fr);
  }
  .scpvp-actions {
    max-width: none;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .scpvp-actions p {
    flex-basis: 100%;
  }
  .scpvp-actions > button {
    flex: 1;
  }
  .scpvp-battle {
    gap: 0.3rem;
    padding: 0.3rem 0.3rem 0;
    overflow: clip;
  }
  .scpvp-versus {
    gap: 0.3rem;
  }
  .scpvp-boss {
    flex: 1 1 0;
    width: auto;
    padding: 0.15rem;
  }
  .scpvp-boss > :first-child {
    width: 2.2rem;
    height: 2.2rem;
  }
  .scpvp-boss b {
    white-space: nowrap;
    font-size: 0.7rem;
  }
  .scpvp-turn {
    flex: none;
    max-width: 5.2rem;
    line-height: 1.1;
  }
  .scpvp-turn small {
    font-size: 0.52rem;
  }
  .scpvp-field {
    padding: 0.3rem;
    gap: 0.2rem;
  }
  .scpvp-midline {
    font-size: 0.5rem;
  }
  .scpvp-controls {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.3rem;
  }
  .scpvp-actions {
    flex-wrap: nowrap;
    gap: 0.3rem;
  }
  .scpvp-actions p {
    display: none;
  }
  .scpvp-actions > button {
    padding: 0.5rem 0.4rem;
    font-size: 0.68rem;
  }
  .scpvp-actions > .scpvp-primary {
    flex: 2;
  }
  .scpvp-choice {
    flex: 2;
  }
  .scpvp-hand {
    justify-content: center;
    align-items: flex-end;
    gap: 0;
    height: 7.4rem;
    overflow: visible;
  }
  .scpvp-card {
    flex: 0 0 auto;
    width: min(29vw, 8.5rem);
    height: auto;
    max-height: none;
    margin-left: -13.5vw;
    align-self: flex-start;
    box-shadow: 0 -4px 14px #000a;
  }
  .scpvp-card:first-child {
    margin-left: 0;
  }
  .scpvp-card:hover,
  .scpvp-card:focus-visible {
    transform: translateY(-0.4rem);
  }
  .scpvp-card.selected {
    transform: translateY(-48%) scale(1.18);
    z-index: 5;
  }
}
@media (prefers-reduced-motion: reduce) {
  .scpvp-card {
    transition: none;
  }
}
</style>
