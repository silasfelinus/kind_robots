<!--
  VS. Silas, 2026-11-11 PT: "Practice is redundant. We should have a pr to
  change it entirely to Vs which lets a user to manage games between other
  users or cpu." One screen: fight the CPU now, or start, join and keep track
  of games against other players. A player game opens on the two-player board.
-->
<template>
  <section
    class="sc-stage sc-vs"
    aria-label="Slime City VS"
    data-testid="slime-vs"
  >
    <header class="vs-head">
      <h2>VS</h2>
      <SlimeCityCrewSelect label="Your crew" />
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
        <h3><span aria-hidden="true">⚔</span> VS PLAYERS</h3>
        <div class="vs-player-actions">
          <button
            type="button"
            class="vs-go"
            data-testid="slime-vs-challenge"
            :disabled="pvp.sending"
            @click="challenge"
          >
            {{ pvp.sending ? 'OPENING…' : 'NEW CHALLENGE ›' }}
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
        <p v-if="pvp.error || pvp.gamesError" class="vs-error" role="alert">
          {{ pvp.error || pvp.gamesError }}
        </p>
        <ol class="vs-games kr-scroll" aria-label="Your games against players">
          <li
            v-for="game in pvp.games"
            :key="game.id"
            :class="['is-' + game.stage, { 'my-turn': game.myTurn }]"
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
                <small>
                  {{ teamName(game.myTeam) }} vs
                  {{
                    game.rivalTeam ? teamName(game.rivalTeam) : 'an open seat'
                  }}
                </small>
              </span>
              <span v-if="game.bosses" class="vs-game-life">
                {{ game.bosses.mine }}<small>–{{ game.bosses.rival }}</small>
              </span>
            </button>
          </li>
          <li v-if="pvp.gamesLoaded && !pvp.games.length" class="vs-empty">
            No games yet. Start a challenge and send the link to a friend.
          </li>
        </ol>
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
import { TEAMS, type TeamId } from '~/utils/slimeCity/prototypes'

const lab = useSlimeCityStore()
const pvp = useSlimeCityPvpStore()
const invite = ref('')

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
  if (game.stage === 'waiting') return 'WAITING FOR A RIVAL'
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
  void navigateTo({ path: '/admin/slime-city-pvp', query: { duel: id } })
}
function joinInvite(): void {
  if (inviteId.value) open(inviteId.value)
}
async function challenge(): Promise<void> {
  const duel = await pvp.start(lab.activeTeam)
  if (duel) open(duel.id)
}
onMounted(() => {
  pvp.error = ''
  void pvp.loadGames()
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
.vs-games li > button {
  width: 100%;
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
