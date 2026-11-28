<!--
  VS. Silas, 2026-11-11 PT: "Practice is redundant. We should have a pr to
  change it entirely to Vs which lets a user to manage games between other
  users or cpu." One screen: fight the CPU now, or start, join and keep track
  of games against other players. A player game opens on the two-player board.
  Silas, 2026-11-11 PT: "You should be able to challenge players on your
  friends list. And they should get notified. That should be the assumed
  method, with help to invite friend via email or username." Friends first,
  then a username / email invite box; share links are the fallback.
-->
<template>
  <section
    class="sc-stage sc-vs"
    aria-label="Slime City VS"
    data-testid="slime-vs"
  >
    <div
      class="vs-roster"
      role="group"
      aria-label="Choose your faction"
      data-testid="slime-vs-roster"
    >
      <button
        v-for="team in lab.teams"
        :key="team.id"
        type="button"
        class="vs-crew"
        :aria-pressed="lab.activeTeam === team.id"
        :title="team.name"
        :data-testid="'slime-vs-crew-' + team.id"
        @click="selectCrew(team.id)"
      >
        <SlimeCityArtwork
          :image-id="slimeArtId('crews', team.id)"
          alt=""
          :fallback="team.insignia"
          compact
        />
        <span>{{ team.name }}</span>
      </button>
    </div>

    <div class="vs-columns kr-panes">
      <div class="vs-left">
        <article
          class="vs-showcase"
          aria-live="polite"
          data-testid="slime-vs-faction"
        >
          <div class="vs-cover">
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', lab.activeTeam)"
              :alt="lab.team.name + ' faction poster'"
              :fallback="lab.team.insignia"
              compact
            />
          </div>
          <div class="vs-faction-copy">
            <small class="vs-label">{{ lab.team.district }} · YOUR CREW</small>
            <h2>{{ lab.team.name }}</h2>
            <em>{{ lab.team.motto }}</em>
            <button
              type="button"
              class="vs-power-button"
              data-testid="slime-vs-faction-power"
              aria-haspopup="dialog"
              @click="powerDialog?.showModal()"
            >
              <small>SIGNATURE POWER</small>
              <b>{{ power.symbol }} {{ power.name }} ›</b>
            </button>
          </div>
        </article>
        <article class="vs-card vs-cpu" data-testid="slime-vs-cpu">
          <h3>VS CPU</h3>
          <span class="vs-label">USES YOUR MATCH DECK</span>
          <p class="vs-note">
            {{
              lab.cpuRewardsAvailable && lab.progressLoaded
                ? 'CPU wins pay XP and Meat and count toward bounties.'
                : 'CPU practice is free. Fair player duels pay Meat.'
            }}
          </p>
          <div
            v-if="lab.vsBout"
            class="vs-resume"
            data-testid="slime-vs-resume-panel"
          >
            <p class="vs-note">
              Unfinished match vs {{ teamName(lab.vsBout.launch.enemy) }} ·
              {{
                lab.vsBout.launch.format === 'alliance' ? 'ALLIANCE' : 'FACTION'
              }}
              · {{ lab.vsBout.commands.length }} moves in
            </p>
            <div class="vs-resume-row">
              <button
                type="button"
                class="vs-go"
                data-testid="slime-vs-resume-cpu"
                :disabled="lab.progressBusy"
                @click="lab.resumeVsBout()"
              >
                RESUME MATCH ›
              </button>
              <button
                type="button"
                class="vs-go is-quiet"
                data-testid="slime-vs-forget-cpu"
                @click="lab.forgetVsBout()"
              >
                ABANDON
              </button>
            </div>
          </div>
          <button
            type="button"
            class="vs-go"
            :class="{ 'is-quiet': lab.vsBout }"
            data-testid="slime-vs-fight-cpu"
            :disabled="lab.progressBusy || !duelDeck"
            @click="duelDeck && lab.playClashFormat(duelDeck.format, duelDeck)"
          >
            FIGHT THE CPU ›
          </button>
        </article>
      </div>

      <article class="vs-card vs-players" data-testid="slime-vs-players">
        <h3>
          <span aria-hidden="true">⚔</span> VS PLAYERS
          <small
            v-if="pvp.gamesLoaded"
            class="vs-record"
            :aria-label="
              pvp.tally.win +
              ' wins, ' +
              pvp.tally.loss +
              ' losses, ' +
              pvp.tally.draw +
              ' draws'
            "
            data-testid="slime-vs-record"
            >{{ pvp.tally.win }}W · {{ pvp.tally.loss }}L ·
            {{ pvp.tally.draw }}D</small
          >
        </h3>
        <SlimeCityDuelDeckPicker
          v-model="duelDeck"
          :team="lab.activeTeam"
          shared
        />
        <section
          class="vs-friends"
          aria-label="Challenge a friend"
          data-testid="slime-vs-friends"
        >
          <span class="vs-label">CHALLENGE A FRIEND</span>
          <ul v-if="pvp.friends.length" class="vs-friend-row">
            <li v-for="friend in pvp.friends" :key="friend.id">
              <button
                type="button"
                class="vs-friend"
                :disabled="pvp.sending || !duelDeck"
                :title="'Challenge ' + friend.username"
                :data-testid="'slime-vs-friend-' + friend.id"
                @click="challengeFriend(friend.id)"
              >
                <span class="vs-avatar" aria-hidden="true">
                  <img
                    v-if="avatarOf(friend)"
                    :src="avatarOf(friend)"
                    alt=""
                    loading="lazy"
                  />
                  <template v-else>{{ initialOf(friend.username) }}</template>
                </span>
                <b>{{ friend.username }}</b>
                <small>{{
                  pvp.sending && challenging === friend.id
                    ? 'SENDING…'
                    : 'CHALLENGE ›'
                }}</small>
              </button>
            </li>
          </ul>
          <p v-else-if="pvp.friendsLoaded" class="vs-hint">
            No friends yet. Find a player by username, or invite one by email.
          </p>
        </section>
        <button
          type="button"
          class="vs-more"
          aria-haspopup="dialog"
          @click="optionsDialog?.showModal()"
        >
          FIND / INVITE · NOTIFICATIONS ›
        </button>
        <p v-if="pvp.error || pvp.gamesError" class="vs-error" role="alert">
          {{ pvp.error || pvp.gamesError }}
        </p>
        <ol class="vs-games" aria-label="Your games against players">
          <template v-if="pvp.openDuels.length">
            <li class="vs-list-label">OPEN CHALLENGES · ANYONE CAN JOIN</li>
            <li
              v-for="duel in pvp.openDuels"
              :key="duel.id"
              class="is-open-duel"
              :data-testid="'slime-vs-open-' + duel.id"
            >
              <button type="button" @click="open(duel.id)">
                <SlimeCityArtwork
                  :image-id="slimeArtId('crews', duel.hostTeam)"
                  :alt="teamName(duel.hostTeam)"
                  fallback="⚔"
                  compact
                />
                <span class="vs-game-text">
                  <b>{{ duel.hostName.toUpperCase() }} WANTS A FIGHT</b>
                  <small>They bring {{ teamName(duel.hostTeam) }}</small>
                </span>
                <span class="vs-game-join">JOIN ›</span>
              </button>
            </li>
            <li v-if="activeGames.length" class="vs-list-label">YOUR GAMES</li>
          </template>
          <li
            v-for="game in activeGames"
            :key="game.id"
            :class="[
              'is-' + game.stage,
              { 'my-turn': game.myTurn || game.incoming },
            ]"
            :data-testid="'slime-vs-game-' + game.id"
          >
            <button type="button" @click="open(game.id)">
              <SlimeCityArtwork
                :image-id="slimeArtId('crews', game.rivalTeam ?? game.myTeam)"
                :alt="
                  game.rivalTeam ? teamName(game.rivalTeam) : 'Open challenge'
                "
                :fallback="game.rivalTeam ? '⚔' : '?'"
                compact
              />
              <span class="vs-game-text">
                <b>{{ statusOf(game) }}</b>
                <small v-if="game.incoming && game.rivalTeam">
                  They bring {{ teamName(game.rivalTeam) }} · tap to pick your
                  crew
                </small>
                <small v-else>
                  {{ teamName(game.myTeam) }} vs
                  {{
                    game.rivalTeam ? teamName(game.rivalTeam) : 'an open seat'
                  }}
                  {{ game.rivalName ? '· ' + game.rivalName : '' }}
                </small>
              </span>
              <span v-if="game.bosses" class="vs-game-life">
                {{ game.bosses.mine }}<small>–{{ game.bosses.rival }}</small>
              </span>
            </button>
            <button
              v-if="game.stage === 'waiting'"
              type="button"
              class="vs-cancel"
              :class="{ armed: cancelArmed === game.id }"
              :disabled="pvp.sending"
              :aria-label="
                (game.incoming ? 'Decline challenge from ' : 'Cancel duel ') +
                (game.rivalName ?? '')
              "
              :data-testid="'slime-vs-cancel-' + game.id"
              @click="cancelGame(game.id)"
            >
              {{
                cancelArmed === game.id
                  ? 'SURE?'
                  : game.incoming
                    ? 'DECLINE'
                    : 'CANCEL'
              }}
            </button>
          </li>
          <li
            v-if="
              pvp.gamesLoaded && !activeGames.length && !pvp.openDuels.length
            "
            class="vs-empty"
          >
            No active games. Challenge a friend or post an open challenge.
          </li>
        </ol>
      </article>
    </div>
    <dialog ref="powerDialog" class="vs-dialog" aria-label="Faction power">
      <div class="vs-dialog-head">
        <h3>{{ lab.team.name }}</h3>
        <button type="button" @click="powerDialog?.close()">CLOSE</button>
      </div>
      <p>{{ lab.team.hook }}</p>
      <section class="vs-power">
        <span class="vs-label">SIGNATURE POWER · ONCE PER MATCH</span>
        <h3>{{ power.symbol }} {{ power.name }}</h3>
        <p>{{ power.text }}</p>
        <p><b>OVERCHARGED:</b> {{ power.overcharge }}</p>
        <small>{{ OVERCHARGE_RULE }}</small>
      </section>
    </dialog>
    <dialog ref="optionsDialog" class="vs-dialog" aria-label="Match options">
      <div class="vs-dialog-head">
        <h3>CHALLENGES &amp; NOTIFICATIONS</h3>
        <button type="button" @click="optionsDialog?.close()">CLOSE</button>
      </div>
      <SlimeCityTurnEmailPreference />
      <form
        class="vs-join vs-find"
        data-testid="slime-vs-find"
        @submit.prevent="findOrInvite"
      >
        <input
          v-model="lookup"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          placeholder="Username or email"
          aria-label="Find a player by username, or invite by email"
          data-testid="slime-vs-lookup"
        />
        <button
          type="submit"
          :disabled="!lookup.trim() || pvp.searching"
          data-testid="slime-vs-lookup-go"
        >
          {{ isEmail ? 'EMAIL INVITE' : pvp.searching ? '…' : 'FIND' }}
        </button>
      </form>
      <ul
        v-if="pvp.players.length || pvp.searchMessage || mailNote"
        class="vs-found"
        aria-live="polite"
      >
        <li v-for="player in pvp.players" :key="player.id">
          <span class="vs-avatar" aria-hidden="true">
            <img
              v-if="avatarOf(player)"
              :src="avatarOf(player)"
              alt=""
              loading="lazy"
            />
            <template v-else>{{ initialOf(player.username) }}</template>
          </span>
          <b>{{ player.username }}</b>
          <button
            type="button"
            :disabled="
              requested.includes(player.id) ||
              player.allowFriendRequests === false
            "
            :data-testid="'slime-vs-add-' + player.id"
            @click="addFriend(player.id)"
          >
            {{
              requested.includes(player.id)
                ? 'REQUEST SENT'
                : player.allowFriendRequests === false
                  ? 'NOT ACCEPTING'
                  : 'ADD FRIEND'
            }}
          </button>
        </li>
        <li v-if="pvp.searchMessage" class="vs-hint">
          {{ pvp.searchMessage }}
        </li>
        <li v-if="mailNote" class="vs-hint">{{ mailNote }}</li>
      </ul>
      <div class="vs-player-actions">
        <button
          type="button"
          class="vs-go"
          title="Listed here for any player to join"
          data-testid="slime-vs-open-challenge"
          :disabled="pvp.sending || !duelDeck"
          @click="challenge(true)"
        >
          OPEN CHALLENGE ›
        </button>
        <button
          type="button"
          class="vs-go is-quiet"
          title="Only someone with your link can join"
          data-testid="slime-vs-challenge"
          :disabled="pvp.sending || !duelDeck"
          @click="challenge(false)"
        >
          PRIVATE LINK ›
        </button>
        <form class="vs-join" @submit.prevent="joinInvite">
          <input
            v-model="invite"
            type="text"
            inputmode="url"
            placeholder="Paste an invite link"
            aria-label="Invite link or code"
            data-testid="slime-vs-invite"
          />
          <button
            type="submit"
            :disabled="!inviteId"
            data-testid="slime-vs-join"
          >
            JOIN
          </button>
        </form>
      </div>
      <p v-if="pvp.error" class="vs-error" role="alert">{{ pvp.error }}</p>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { useSlimeCityPvpStore } from '~/stores/slimeCityPvp'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { factionPower, OVERCHARGE_RULE } from '~/utils/slimeCity/factionPowers'
import type { ClashRewardSetup } from '~/utils/slimeCity/clashRewards'
import type { PvpGameSummary } from '~/utils/slimeCity/pvp'
import type { PvpPlayer } from '~/stores/slimeCityPvp'
import { TEAMS, type TeamId } from '~/utils/slimeCity/prototypes'

const lab = useSlimeCityStore()
const pvp = useSlimeCityPvpStore()
const invite = ref('')
const lookup = ref('')
const mailNote = ref('')
const challenging = ref<number | null>(null)
const requested = ref<number[]>([])

const power = computed(() => factionPower(lab.activeTeam))
const activeGames = computed(() =>
  pvp.games.filter(
    (game) => game.stage === 'waiting' || game.stage === 'battle',
  ),
)
function selectCrew(id: TeamId): void {
  if (id !== lab.activeTeam) lab.chooseTeam(id)
}

const powerDialog = ref<HTMLDialogElement | null>(null)
const optionsDialog = ref<HTMLDialogElement | null>(null)
function teamName(id: TeamId): string {
  return TEAMS.find((team) => team.id === id)?.name ?? id
}
function statusOf(game: PvpGameSummary): string {
  const rival = game.rivalName?.toUpperCase() ?? ''
  if (game.incoming) return (rival || 'A FRIEND') + ' CHALLENGED YOU'
  if (game.stage === 'waiting')
    return rival
      ? 'WAITING FOR ' + rival
      : game.open
        ? 'OPEN · WAITING FOR ANYONE'
        : 'PRIVATE LINK · WAITING'
  return game.myTurn
    ? 'YOUR TURN · ROUND ' + game.round
    : 'THEIR TURN · ROUND ' + game.round
}
/** An invite is a link with ?duel=<id>, or the bare id. */
const inviteId = computed(() => {
  const text = invite.value.trim()
  const match = text.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  )
  return match?.[0] ?? ''
})
function open(id: string): void {
  void navigateTo({ path: '/play/slime-city-pvp', query: { duel: id } })
}
function joinInvite(): void {
  if (inviteId.value) open(inviteId.value)
}
const duelDeck = ref<ClashRewardSetup | null>(null)
async function challenge(isPublic: boolean): Promise<void> {
  if (!duelDeck.value) return
  const duel = await pvp.start(lab.activeTeam, {
    isPublic,
    deck: duelDeck.value,
  })
  if (duel) await Promise.all([pvp.loadGames(), pvp.loadOpen()])
}
/** Cancelling a duel or declining a challenge takes two taps. */
const cancelArmed = ref<string | null>(null)
async function cancelGame(id: string): Promise<void> {
  if (cancelArmed.value !== id) {
    cancelArmed.value = id
    return
  }
  cancelArmed.value = null
  await pvp.cancel(id)
}
/** Challenge a friend: they get a notification that opens the duel. */
async function challengeFriend(friendId: number): Promise<void> {
  if (!duelDeck.value) return
  challenging.value = friendId
  const duel = await pvp.start(lab.activeTeam, {
    friendId,
    deck: duelDeck.value,
  })
  challenging.value = null
  if (duel) await pvp.loadGames()
}
function initialOf(name: string): string {
  return (name.trim()[0] ?? '?').toUpperCase()
}
/** Only real image paths; anything else falls back to the initial. */
function avatarOf(player: PvpPlayer): string {
  const src = player.avatarImage ?? ''
  return /^(https:\/\/|\/)/.test(src) ? src : ''
}
const isEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lookup.value.trim()),
)
/**
 * No mail service here: an email invite opens the player's own mail app with
 * a written invitation. A username searches the opt-in player directory.
 */
async function findOrInvite(): Promise<void> {
  mailNote.value = ''
  if (isEmail.value) {
    const link = location.origin + '/play/slime-city'
    const subject = 'Fight me in Slime City'
    const body =
      'I challenge you to a Slime City duel. Make a Kind Robots account, ' +
      'add me as a friend, and pick a crew:\n\n' +
      link
    location.href =
      'mailto:' +
      encodeURIComponent(lookup.value.trim()) +
      '?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body)
    mailNote.value =
      'Your mail app has the invite. Once they join and accept your friend request, challenge them here.'
    return
  }
  await pvp.findPlayers(lookup.value)
}
async function addFriend(userId: number): Promise<void> {
  if (await pvp.addFriend(userId)) requested.value.push(userId)
}
// Sign-in can land after mount; the saved match belongs to one account.
watch(
  () => [lab.progressLoaded, lab.storyLoaded],
  () => lab.hydrateVsBout(),
)
onMounted(() => {
  // An unfinished CPU match on this device can be picked up after a reload.
  lab.hydrateVsBout()
  pvp.error = ''
  void pvp.loadGames()
  void pvp.loadFriends()
  void pvp.loadOpen()
})
</script>

<style scoped>
.sc-vs {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.6rem;
  box-sizing: border-box;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 0%, #2b4a3f99, transparent 60%), #0a0f16;
  color: #eef4ee;
}
.vs-roster {
  flex: none;
  display: grid;
  grid-template-columns: repeat(6, minmax(5rem, 1fr));
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.15rem;
}
.vs-crew {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  padding: 0.3rem;
  border: 2px solid #4d6a5f;
  border-radius: 0.6rem;
  background: #132227;
  color: inherit;
  text-align: left;
  font: inherit;
  font-size: clamp(0.62rem, 1.3cqw, 0.85rem);
  font-weight: 900;
  line-height: 1.1;
  cursor: pointer;
}
.vs-crew[aria-pressed='true'] {
  border-color: #c5ff59;
  background: #26382a;
  box-shadow: inset 0 0 0 1px #c5ff59;
}
.vs-crew:focus-visible {
  outline: 2px solid #c5ff59;
  outline-offset: -2px;
}
.vs-crew :deep(.slime-art) {
  flex: none;
  width: clamp(1.8rem, 4cqw, 3.2rem);
  height: clamp(1.8rem, 4cqw, 3.2rem);
  border-radius: 0.35rem;
}
.vs-crew span {
  min-width: 0;
  overflow-wrap: anywhere;
}
.vs-left {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.vs-showcase {
  flex: 1 1 0;
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  border: 2px solid #a6e33c;
  border-radius: 0.9rem;
  background: #101c22;
}
.vs-cover {
  min-height: 0;
  min-width: 0;
}
.vs-cover :deep(img) {
  object-position: center;
  object-fit: cover;
}
.vs-faction-copy {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.55rem;
  font-size: 0.75rem;
  line-height: 1.35;
}
.vs-faction-copy h2 {
  margin: 0;
  color: #c5ff59;
  font-size: clamp(0.9rem, 2cqw, 1.5rem);
  font-weight: 1000;
  font-style: italic;
  line-height: 1.05;
}
.vs-faction-copy p {
  margin: 0;
}
.vs-faction-copy em {
  color: #c5ff59;
  font-weight: 800;
}
.vs-power {
  display: grid;
  gap: 0.35rem;
  padding: 0.6rem;
  border: 1px solid #a6e33c;
  border-radius: 0.45rem;
  background: #16262b;
}
.vs-power h3 {
  margin: 0;
  color: #c5ff59;
  font-weight: 950;
  font-size: 1.05em;
}
.vs-power small {
  color: #a6c7bc;
  font-size: 0.85em;
}
.vs-columns {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  gap: 0.6rem;
}
.vs-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.75rem;
  border: 1px solid #4d6a5f;
  border-radius: 0.9rem;
  background: #0f1a1fe8;
}
.vs-cpu {
  flex: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 0.4rem;
}
.vs-cpu .vs-cpu-deck,
.vs-cpu .vs-deck,
.vs-cpu .vs-note,
.vs-cpu .vs-resume {
  grid-column: 1 / -1;
}
.vs-cpu > .vs-go {
  grid-column: 1 / -1;
  margin: 0;
  padding: 0.55rem;
}
.vs-players {
  overflow: hidden;
}
.vs-players .vs-games {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}
.vs-power-button,
.vs-more,
.vs-dialog-head button {
  border: 1px solid #586e68;
  border-radius: 0.45rem;
  background: #16262b;
  color: #c5ff59;
  padding: 0.35rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 850;
  cursor: pointer;
}
.vs-power-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}
.vs-power-button small {
  font-size: 0.6rem;
}
.vs-more {
  flex: none;
}
.vs-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(32rem, 92vw);
  max-height: 85dvh;
  overflow-y: auto;
  padding: 1rem;
  border: 1px solid #a6e33c;
  border-radius: 0.85rem;
  background: #101c22;
  color: #e7f3ee;
}
.vs-dialog[open] {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.vs-dialog::backdrop {
  background: #080c13bd;
}
.vs-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.vs-dialog-head h3 {
  font-weight: 900;
  color: #c5ff59;
}
.vs-card h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 950;
  letter-spacing: 0.12em;
}
.vs-record {
  margin-left: 0.4rem;
  padding: 0.05rem 0.4rem;
  border: 1px solid #5c7d72;
  border-radius: 999px;
  color: #c9ee5a;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.vs-format {
  display: flex;
  gap: 0.3rem;
}
.vs-format button,
.vs-join button {
  flex: 1;
  padding: 0.45rem 0.6rem;
  border: 1px solid #586e68;
  border-radius: 0.5rem;
  background: #16262b;
  color: inherit;
  font: inherit;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  cursor: pointer;
}
.vs-format button[aria-pressed='true'] {
  border-color: #c5ff59;
  background: #c5ff59;
  color: #12200c;
}
.vs-deck {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.55rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  color: #a6c7bc;
}
.vs-deck select,
.vs-join input {
  min-width: 0;
  padding: 0.45rem 0.5rem;
  border: 1px solid #586e68;
  border-radius: 0.5rem;
  background: #070b12;
  color: #f3f7f2;
  font: inherit;
  font-size: 0.78rem;
}
.vs-note {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.35;
  color: #b9cfc7;
}
.vs-go {
  margin-top: auto;
  padding: 0.75rem 0.9rem;
  border: 0;
  border-radius: 0.7rem;
  background: linear-gradient(180deg, #d8ff7c, #a6e33c);
  color: #13210a;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 1000;
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow: 0 0 18px #c5ff5944;
}
.vs-go:disabled,
.vs-join button:disabled {
  opacity: 0.55;
  cursor: default;
}
.vs-player-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.vs-player-actions .vs-go {
  margin-top: 0;
  flex: 1 1 10rem;
}
.vs-join {
  flex: 2 1 14rem;
  display: flex;
  gap: 0.35rem;
  margin: 0;
}
.vs-join input {
  flex: 1;
}
.vs-join button {
  flex: none;
}
.vs-label {
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #a6c7bc;
}
.vs-friends {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}
.vs-friend-row {
  display: flex;
  gap: 0.4rem;
  margin: 0;
  padding: 0 0 0.2rem;
  list-style: none;
  overflow-x: auto;
}
.vs-friend {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  width: 5.4rem;
  padding: 0.45rem 0.3rem;
  border: 1px solid #c5ff5977;
  border-radius: 0.7rem;
  background: #16262b;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.vs-friend:hover {
  border-color: #c5ff59;
  box-shadow: 0 0 12px #c5ff5944;
}
.vs-friend b {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-weight: 900;
}
.vs-friend small {
  font-size: 0.55rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  color: #c5ff59;
}
.vs-avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6fb5, #6fd3ff);
  color: #0a0f16;
  font-size: 1rem;
  font-weight: 1000;
}
.vs-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.vs-hint {
  margin: 0;
  font-size: 0.7rem;
  color: #a6c7bc;
}
.vs-find {
  flex: none;
}
.vs-found {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.vs-found li:not(.vs-hint) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.vs-found li .vs-avatar {
  width: 1.8rem;
  height: 1.8rem;
  font-size: 0.8rem;
}
.vs-found b {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.75rem;
}
.vs-found button {
  padding: 0.35rem 0.55rem;
  border: 1px solid #c5ff59;
  border-radius: 0.5rem;
  background: #24383b;
  color: #c5ff59;
  font: inherit;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  cursor: pointer;
}
.vs-found button:disabled {
  border-color: #586e68;
  color: #a6c7bc;
  cursor: default;
}
.vs-link-play {
  flex: none;
  font-size: 0.7rem;
  color: #a6c7bc;
}
.vs-link-play summary {
  cursor: pointer;
  font-weight: 850;
  letter-spacing: 0.06em;
}
.vs-link-play .vs-player-actions {
  margin-top: 0.4rem;
}
.vs-error {
  margin: 0;
  font-size: 0.72rem;
  color: #ffb4bd;
}
.vs-games {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.vs-games li:not(.vs-empty, .vs-list-label) {
  display: flex;
  gap: 0.35rem;
}
.vs-games li > button:first-child {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.35rem 0.55rem 0.35rem 0.35rem;
  border: 1px solid #3d5550;
  border-radius: 0.6rem;
  background: #132227;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.vs-games li.my-turn > button {
  border-color: #c5ff59;
  box-shadow: 0 0 12px #c5ff5944;
}
.vs-games :deep(.slime-art) {
  flex: none;
  width: 2.4rem;
  height: 2.4rem;
  margin: 0;
  overflow: hidden;
  border-radius: 0.45rem;
}
.vs-games :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.vs-game-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.vs-game-text b {
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.08em;
}
.vs-games li.my-turn .vs-game-text b {
  color: #c5ff59;
}
.vs-game-text small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.66rem;
  color: #a6c7bc;
}
.vs-game-life {
  flex: none;
  font-size: 1.05rem;
  font-weight: 1000;
  font-style: italic;
}
.vs-game-life small {
  font-size: 0.7rem;
  color: #ffb4bd;
}
.vs-games li > .vs-cancel {
  flex: none;
  padding: 0 0.6rem;
  border: 1px solid #586e68;
  border-radius: 0.6rem;
  background: #1a2226;
  color: #c7d6d0;
  font: inherit;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  cursor: pointer;
}
.vs-games li > .vs-cancel.armed {
  border-color: #ff6f7a;
  background: #4b1f26;
  color: #ffd6dc;
}
.vs-list-label {
  padding: 0.2rem 0.1rem 0;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #a6c7bc;
}
.vs-games li.is-open-duel > button {
  border-color: #6fd3ff88;
}
.vs-game-join {
  flex: none;
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  color: #6fd3ff;
}
.vs-resume {
  display: grid;
  gap: 0.4rem;
  margin-top: auto;
}
.vs-resume-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.vs-resume-row .vs-go {
  margin-top: 0;
  flex: 1 1 8rem;
}
.vs-go.is-quiet {
  background: #24383b;
  color: #e7f3ee;
  box-shadow: none;
  border: 1px solid #586e68;
}
.vs-empty {
  padding: 0.6rem;
  border: 1px dashed #3d5550;
  border-radius: 0.6rem;
  font-size: 0.75rem;
  color: #a6c7bc;
}
@container (max-width: 1000px) {
  .vs-crew {
    flex-direction: column;
    text-align: center;
  }
}
@container (max-width: 640px) {
  .sc-vs {
    gap: 0.4rem;
    padding: 0.4rem;
  }
  .vs-columns {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 0.85fr) minmax(0, 1.15fr);
    gap: 0.4rem;
  }
  .vs-left {
    gap: 0.4rem;
  }
  .vs-showcase {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .vs-card {
    gap: 0.4rem;
    padding: 0.55rem;
  }
  .vs-cpu .vs-note {
    display: none;
  }
  .vs-faction-copy em {
    display: none;
  }
  .vs-power-button {
    flex-wrap: wrap;
    padding: 0.25rem;
  }
  .vs-players {
    overflow-y: auto;
  }
  .vs-players .vs-games {
    flex: 1 0 auto;
  }
  .vs-players .vs-go {
    padding: 0.55rem;
  }
}
</style>
