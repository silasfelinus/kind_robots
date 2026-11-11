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
    <header class="vs-head">
      <h2>VS</h2>
      <SlimeCityCrewSelect label="Your crew" align="right" />
    </header>

    <div class="vs-columns">
      <article class="vs-card vs-cpu" data-testid="slime-vs-cpu">
        <SlimeCityArtwork
          class="vs-cpu-art"
          :image-id="slimeArtId('boards', 'pitworks-blackout')"
          alt=""
          fallback=""
          compact
        />
        <h3><span aria-hidden="true">🤖</span> VS CPU</h3>
        <div class="vs-format" role="group" aria-label="Deck format">
          <button
            type="button"
            :aria-pressed="lab.clashFormat === 'solo'"
            data-testid="slime-vs-solo"
            @click="lab.clashFormat = 'solo'"
          >
            SOLO
          </button>
          <button
            type="button"
            :aria-pressed="lab.clashFormat === 'alliance'"
            data-testid="slime-vs-alliance"
            @click="lab.clashFormat = 'alliance'"
          >
            ALLIANCE
          </button>
        </div>
        <label v-if="lab.clashFormat === 'alliance'" class="vs-deck">
          <span>DECK</span>
          <select
            :value="lab.libraryId ?? ''"
            data-testid="slime-vs-deck"
            @change="pickDeck"
          >
            <option value="">{{ lab.team.name }} starter alliance</option>
            <option v-for="deck in readyDecks" :key="deck.id" :value="deck.id">
              {{ deck.name }}
            </option>
          </select>
        </label>
        <p class="vs-note">
          {{
            lab.progressLoaded
              ? 'Signed in: wins pay XP and Meat and count toward bounties.'
              : 'Sign in to earn XP and Meat from CPU wins.'
          }}
        </p>
        <button
          type="button"
          class="vs-go"
          data-testid="slime-vs-fight-cpu"
          :disabled="lab.progressBusy"
          @click="lab.playClashFormat()"
        >
          FIGHT THE CPU ›
        </button>
      </article>

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
                :disabled="pvp.sending"
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
        <p v-if="pvp.error || pvp.gamesError" class="vs-error" role="alert">
          {{ pvp.error || pvp.gamesError }}
        </p>
        <ol class="vs-games kr-scroll" aria-label="Your games against players">
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
            <li v-if="pvp.games.length" class="vs-list-label">YOUR GAMES</li>
          </template>
          <li
            v-for="game in pvp.games"
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
            v-if="pvp.gamesLoaded && !pvp.games.length && !pvp.openDuels.length"
            class="vs-empty"
          >
            No games yet. Challenge a friend above, or post an open challenge.
          </li>
        </ol>
        <details class="vs-link-play">
          <summary>Open challenge, or a private link</summary>
          <div class="vs-player-actions">
            <button
              type="button"
              class="vs-go"
              title="Listed here for any player to join"
              data-testid="slime-vs-open-challenge"
              :disabled="pvp.sending"
              @click="challenge(true)"
            >
              OPEN CHALLENGE ›
            </button>
            <button
              type="button"
              class="vs-go is-quiet"
              title="Only someone with your link can join"
              data-testid="slime-vs-challenge"
              :disabled="pvp.sending"
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
        </details>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { useSlimeCityPvpStore } from '~/stores/slimeCityPvp'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
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

const readyDecks = computed(() =>
  lab.library.filter(
    (deck) => deck.general === lab.activeTeam && lab.libraryDeckReady(deck.id),
  ),
)
function pickDeck(event: Event): void {
  const id = (event.target as HTMLSelectElement).value
  if (id) lab.selectLibraryDeck(id)
}
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
  if (game.stage === 'finished')
    return game.result === 'win'
      ? 'YOU WON'
      : game.result === 'loss'
        ? 'YOU LOST'
        : 'DRAW'
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
async function challenge(isPublic: boolean): Promise<void> {
  const duel = await pvp.start(lab.activeTeam, { isPublic })
  if (duel) open(duel.id)
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
  challenging.value = friendId
  const duel = await pvp.start(lab.activeTeam, { friendId })
  challenging.value = null
  if (duel) open(duel.id)
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
onMounted(() => {
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
.vs-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}
.vs-head h2 {
  margin: 0;
  font-size: clamp(1.6rem, 6cqw, 2.6rem);
  font-weight: 1000;
  font-style: italic;
  letter-spacing: -0.04em;
  color: #c5ff59;
  text-shadow: 0 0 22px #c5ff5955;
}
.vs-columns {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
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
.vs-cpu-art {
  position: absolute;
  inset: 0;
  z-index: -1;
  margin: 0;
  opacity: 0.28;
  pointer-events: none;
}
.vs-cpu-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
.vs-games li.is-finished > button {
  opacity: 0.75;
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
@container (max-width: 640px) {
  .sc-vs {
    gap: 0.4rem;
    padding: 0.4rem;
  }
  .vs-head h2 {
    font-size: 1.5rem;
  }
  .vs-columns {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.4rem;
  }
  .vs-card {
    gap: 0.4rem;
    padding: 0.55rem;
  }
  .vs-cpu {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'title title'
      'format go'
      'deck deck';
    align-items: center;
  }
  .vs-cpu h3 {
    grid-area: title;
  }
  .vs-cpu .vs-format {
    grid-area: format;
  }
  .vs-cpu .vs-deck {
    grid-area: deck;
  }
  .vs-cpu .vs-go {
    grid-area: go;
  }
  .vs-cpu .vs-deck > span,
  .vs-cpu .vs-note {
    display: none;
  }
  .vs-cpu .vs-go {
    margin: 0;
    padding: 0.6rem;
  }
  .vs-players .vs-go {
    padding: 0.55rem;
  }
}
</style>
