<template>
  <section class="space-daily" data-testid="space-couch-daily-console">
    <header class="daily-opening">
      <img
        :src="backdrop"
        alt="The red couch sails inside its protective bubble"
      />
      <div class="daily-opening-content">
        <span class="daily-eyebrow"
          >SPACE COUCH PRESENTS · EPISODE {{ run.chapter }} · SHIP DAY
          {{ run.day ?? run.chapter }}</span
        >
        <h2>{{ majorDone ? 'The Plot Thickens' : 'Assign the Cast' }}</h2>
        <p>{{ episodeIncitingEvent(run) }}</p>
      </div>
      <span class="daily-on-air">● ON AIR</span>
    </header>
    <SpaceCouchCloneLab
      :run="run"
      @advance="emit('cloneAdvance', $event)"
      @print="emit('clonePrint', $event)"
    />

    <template v-if="!majorDone">
      <div class="daily-body">
        <aside
          class="daily-cast"
          data-testid="space-couch-redshirt-dorm"
          aria-label="Personnel cards"
        >
          <div class="daily-section-head">
            <strong>THE CAST</strong>
            <span>{{ (run.redshirtRoster ?? []).length }} REDSHIRTS</span>
          </div>
          <p class="daily-instruction">
            Pick a personnel card, then put it on a quest. A name on a red shirt
            is not a résumé.
          </p>
          <div
            class="daily-cast-stack"
            role="group"
            aria-label="Available personnel cards"
          >
            <button
              v-for="actor in actors"
              :key="actor.id"
              type="button"
              class="daily-actor"
              :class="{
                selected: selectedLead === actor.id,
                busy: busyLeads.includes(actor.id),
              }"
              :disabled="busyLeads.includes(actor.id)"
              :aria-pressed="selectedLead === actor.id"
              data-testid="space-couch-expedition-lead"
              @click="selectedLead = actor.id"
            >
              <span class="daily-actor-face">
                <img v-if="actor.image" :src="actor.image" alt="" />
                <span v-else>{{ actor.initial }}</span>
              </span>
              <span class="daily-actor-text">
                <b>{{ actor.name }}</b>
                <small>{{ actor.subtitle }}</small>
              </span>
              <b class="daily-actor-stats">{{
                actor.revealed ? actor.rank : '??'
              }}</b>
            </button>
          </div>
          <button
            type="button"
            class="daily-hire"
            data-testid="space-couch-hire"
            :disabled="
              (run.redshirtRoster ?? []).length >= 12 ||
              (run.supplies < 1 && (run.redshirtRoster ?? []).length > 0)
            "
            @click="emit('hire')"
          >
            + RECRUIT ·
            {{
              (run.redshirtRoster ?? []).length ? '1 SUPPLY' : 'FREE EMERGENCY'
            }}
          </button>
        </aside>

        <section
          class="daily-quest-zone"
          data-testid="space-couch-encounter-board"
          aria-label="Quest assignment board"
        >
          <div class="daily-section-head">
            <strong>QUESTS ON THE BOARD</strong>
            <span
              >{{ completeCount }}/{{ encounters.length }} RESOLVED ·
              {{ majorCount }} MAIN</span
            >
          </div>
          <div class="daily-quest-grid">
            <button
              v-for="enc in encounters"
              :key="enc.id"
              type="button"
              class="daily-quest"
              :class="{
                'daily-major': enc.priority === 'major',
                'daily-resolved': completed(enc.id),
                'daily-planned': !!assignments[enc.id],
              }"
              :disabled="completed(enc.id) || !selectedLead"
              :aria-label="
                'Assign ' +
                (selectedLead ? actorName(selectedLead) : 'personnel') +
                ' to ' +
                enc.title
              "
              data-testid="space-couch-encounter"
              @click="assign(enc.id)"
            >
              <span class="daily-quest-top">
                <span>{{
                  enc.priority === 'major' ? '★ FEATURE QUEST' : '✦ SIDE PLOT'
                }}</span>
                <b
                  >{{ questDuration(run, enc.id) }} DAY{{
                    questDuration(run, enc.id) > 1 ? 'S' : ''
                  }}</b
                >
              </span>
              <strong>{{ enc.title }}</strong>
              <p>{{ enc.setup }}</p>
              <span class="daily-skill"
                >REQUIRES {{ enc.skill.toUpperCase() }}</span
              >
              <span class="daily-slot">
                <template v-if="completed(enc.id)">
                  <b>{{ completionResult(enc.id) }}</b>
                  <small>{{
                    (
                      run.expeditionVisit?.results.find(
                        (r) => r.encounterId === enc.id,
                      )?.outcome ?? ''
                    ).slice(0, 125)
                  }}</small>
                </template>
                <template v-else>
                  <b>{{
                    assignments[enc.id]
                      ? actorName(assignments[enc.id]!)
                      : '+ PLACE CARD HERE'
                  }}</b>
                  <small>
                    {{
                      assignments[enc.id]
                        ? questOdds(run, enc, assignments[enc.id]!) === null
                          ? 'SUCCESS ODDS CLASSIFIED · FIELD TEST REQUIRED'
                          : 'FORECAST ' +
                            questOdds(run, enc, assignments[enc.id]!) +
                            '%'
                        : 'Tap with a personnel card selected'
                    }}
                  </small>
                </template>
              </span>
            </button>
          </div>
          <footer class="daily-action-row">
            <span
              >{{
                pendingMain === 0
                  ? 'Main assignments ready'
                  : pendingMain + ' main quests need a card'
              }}
              · Side quests optional</span
            >
            <button
              type="button"
              data-testid="space-couch-expedition-deploy"
              :disabled="!batchReady"
              @click="dispatchAll"
            >
              SEND THE CAST <span>➜</span>
            </button>
          </footer>
        </section>
      </div>
    </template>

    <template v-else>
      <section class="daily-decks" data-testid="space-couch-daily-decks">
        <div class="daily-section-head">
          <strong>THE AFTERNOON ENCOUNTER DECKS</strong>
          <span>QUESTS FIRST · DRAW IN ORDER</span>
        </div>
        <div
          class="daily-deck-row"
          role="group"
          aria-label="Episode encounter decks"
        >
          <button
            v-for="(deck, index) in requiredDecks"
            :key="deck"
            type="button"
            class="daily-deck"
            :class="{
              'daily-deck-turned': episodeDeckDone(run, deck),
              'daily-deck-next': nextDeck === deck,
            }"
            :disabled="
              !!flipped || episodeDeckDone(run, deck) || nextDeck !== deck
            "
            :aria-label="'Draw ' + deckName(deck) + ' encounter'"
            :data-testid="
              deck === 'casino'
                ? 'space-couch-casino-quest'
                : deck === 'serendipity'
                  ? 'space-couch-serendipity-quest'
                  : 'space-couch-deck-' + deck
            "
            @click="flipped = deck"
          >
            <span class="daily-deck-number">{{
              String(index + 1).padStart(2, '0')
            }}</span>
            <span class="daily-deck-symbol">{{ deckSymbol(deck) }}</span>
            <strong>{{ deckName(deck) }}</strong>
            <small>{{
              episodeDeckDone(run, deck)
                ? '✓ RESOLVED'
                : nextDeck === deck
                  ? 'TURN THIS CARD'
                  : 'FACE DOWN'
            }}</small>
          </button>
        </div>
        <article
          v-if="flipped && nextDeck === flipped"
          class="daily-reveal"
          aria-live="polite"
        >
          <div
            class="daily-reveal-art"
            data-testid="space-couch-blue-giant-casino"
          >
            <img
              v-if="flipped !== 'casino' || !franchiseImage"
              :src="backdrop"
              alt="Space Couch episode backdrop"
            />
            <img
              v-else
              :src="franchiseImage"
              alt="A Serendipity venue built inside a casino on a living blue giant"
            />
          </div>
          <div class="daily-reveal-content">
            <span class="daily-eyebrow"
              >{{ deckName(flipped) }} · THE DAY'S RANDOM DRAW</span
            >
            <h3>{{ episodeCard(run, flipped).title }}</h3>
            <p>{{ episodeCard(run, flipped).setup }}</p>
            <small>{{ episodeCard(run, flipped).link }}</small>
            <div class="daily-decisions">
              <button
                v-for="choice in EPISODE_CHOICES"
                :key="choice.id"
                type="button"
                :data-testid="'space-couch-choose-' + choice.id"
                @click="decide(flipped!, choice.id)"
              >
                <b>{{ choice.label }}</b
                ><small>{{ choice.cost }}</small>
              </button>
            </div>
          </div>
        </article>
        <div v-else-if="lastDraw" class="daily-recap" aria-live="polite">
          <strong>PREVIOUSLY, ON SPACE COUCH...</strong>
          <p>{{ lastDraw.result }}</p>
          <span
            >{{ episodeDraws(run).length }} / {{ requiredDecks.length }} DECKS
            RESOLVED</span
          >
        </div>
        <div v-else class="daily-recap">
          <strong>AND NOW, THE SECOND HALF OF TONIGHT'S PROGRAM</strong>
          <p>
            The planet, casino and Serendipity each have a separate deck. The
            recurring villain gets a guest-star credit every other episode.
          </p>
        </div>
        <footer class="daily-action-row">
          <span>{{ episodeStinger(run) }}</span>
          <button
            type="button"
            data-testid="space-couch-expedition-finish"
            :disabled="!episodeDecksDone(run)"
            @click="emit('finish')"
          >
            {{
              episodeDecksDone(run)
                ? 'CONTINUE THE VOYAGE ➜'
                : 'FINISH THE DECKS FIRST'
            }}
          </button>
        </footer>
      </section>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SpaceCouchCloneLab from '~/components/gameOfCaptains/clone-lab.vue'
import {
  cloneGeneration,
  type CloneChoice,
} from '~/utils/gameOfCaptains/cloneSaga'
import type { VoyageRun } from '~/utils/gameOfCaptains/rules'
import { CAPTAINS, CREW } from '~/utils/gameOfCaptains/rules'
import {
  CAPTAIN_STATS,
  CREW_PROFILES,
} from '~/utils/gameOfCaptains/crewAssignments'
import { REDSHIRT_BY_ID } from '~/utils/gameOfCaptains/redshirts'
import {
  currentExpedition,
  expeditionBusy,
} from '~/utils/gameOfCaptains/expedition'
import { portraitArt } from '~/utils/gameOfCaptains/artSlots'
import {
  EPISODE_CHOICES,
  episodeCard,
  episodeDecks,
  episodeDeckDone,
  episodeDecksDone,
  episodeDraws,
  episodeIncitingEvent,
  episodeMajorComplete,
  episodeStinger,
  observedRedshirt,
  questDuration,
  questOdds,
  type EpisodeAssignment,
  type EpisodeChoice,
  type EpisodeDeck,
  type EpisodeQuestResult,
} from '~/utils/gameOfCaptains/episodeConsole'

const props = defineProps<{
  run: VoyageRun
  backdrop: string
  franchiseImage: string | null
}>()
const emit = defineEmits<{
  hire: []
  dispatch: [assignments: EpisodeAssignment[]]
  draw: [deck: EpisodeDeck, choice: EpisodeChoice]
  finish: []
  cloneAdvance: [choice: CloneChoice]
  clonePrint: [id: string]
}>()
const selectedLead = ref<string>('captain')
const assignments = ref<Record<string, string>>({})
const flipped = ref<EpisodeDeck | null>(null)
watch(
  () => props.run.chapter,
  () => {
    assignments.value = {}
    flipped.value = null
    selectedLead.value = 'captain'
  },
)
const encounters = computed(() => currentExpedition(props.run))
const busyLeads = computed(() => expeditionBusy(props.run))
const majorDone = computed(() => episodeMajorComplete(props.run))
const majorCount = computed(
  () => encounters.value.filter((enc) => enc.priority === 'major').length,
)
const completeCount = computed(
  () => props.run.expeditionVisit?.results.length ?? 0,
)
const requiredDecks = computed(() => episodeDecks(props.run))
const nextDeck = computed(() =>
  requiredDecks.value.find((deck) => !episodeDeckDone(props.run, deck)),
)
const lastDraw = computed(() => episodeDraws(props.run).at(-1))
const actors = computed(() => [
  {
    id: 'captain',
    name: CAPTAINS.find((c) => c.id === props.run.captain)?.name ?? 'Captain',
    subtitle: 'COMMAND · FULL DOSSIER',
    image: portraitArt('captain-' + props.run.captain),
    revealed: true,
    rank: String(Math.max(...Object.values(CAPTAIN_STATS[props.run.captain]))),
    initial: '★',
  },
  ...CREW.filter((crew) => props.run.crew.includes(crew.id)).map((crew) => ({
    id: crew.id,
    name: crew.name,
    subtitle: crew.role.toUpperCase() + ' · ' + crew.talent,
    image: portraitArt(crew.portraitKey),
    revealed: true,
    rank: String(
      Math.max(
        ...Object.values(CREW_PROFILES.find((p) => p.id === crew.id)!.stats),
      ),
    ),
    initial: crew.monogram,
  })),
  ...(props.run.redshirtRoster ?? []).map((id) => {
    const person = REDSHIRT_BY_ID[id]!
    const revealed = observedRedshirt(props.run, id)
    const generation = cloneGeneration(props.run, id)
    return {
      id,
      name: generation ? person.name + ' · GEN ' + generation : person.name,
      subtitle:
        (generation ? 'CLONE · ' : 'REDSHIRT · ') +
        (revealed
          ? 'FIELD-TESTED ' + person.talent.toUpperCase()
          : 'APTITUDE SEALED'),
      image: null,
      revealed,
      rank: revealed ? String(person.stats[person.talent]) : '??',
      initial: '✦',
    }
  }),
])
function actorName(id: string): string {
  return actors.value.find((actor) => actor.id === id)?.name ?? id
}
function completed(id: string): boolean {
  return !!props.run.expeditionVisit?.results.some(
    (record) => record.encounterId === id,
  )
}
function completionResult(id: string) {
  const item = props.run.expeditionVisit?.results.find(
    (record) => record.encounterId === id,
  ) as
    | (NonNullable<VoyageRun['expeditionVisit']>['results'][number] &
        EpisodeQuestResult)
    | undefined
  return (
    (item?.successful ? '✓ SUCCESS' : '✕ COMPLICATION') +
    ' · ' +
    actorName(item?.lead ?? '') +
    ' · ' +
    (item?.durationDays ?? 1) +
    ' DAY(S)'
  )
}
function assign(encounterId: string) {
  const chosen = selectedLead.value
  if (!chosen || busyLeads.value.includes(chosen) || completed(encounterId))
    return
  const next = Object.fromEntries(
    Object.entries(assignments.value).filter(([, lead]) => lead !== chosen),
  )
  next[encounterId] = chosen
  assignments.value = next
}
const pendingMain = computed(
  () =>
    encounters.value.filter(
      (enc) =>
        enc.priority === 'major' &&
        !completed(enc.id) &&
        !assignments.value[enc.id],
    ).length,
)
const batchReady = computed(
  () =>
    pendingMain.value === 0 &&
    Object.keys(assignments.value).some((id) => !completed(id)),
)
function dispatchAll() {
  if (!batchReady.value) return
  const batch = encounters.value
    .filter((enc) => !completed(enc.id) && assignments.value[enc.id])
    .map((enc) => ({ encounterId: enc.id, lead: assignments.value[enc.id]! }))
  emit('dispatch', batch)
  assignments.value = {}
}
function deckName(deck: EpisodeDeck) {
  return {
    planet: 'THE PLANET',
    casino: 'SPACE CASINO',
    serendipity: 'SERENDIPITY',
    constellation: 'YOUR STAR SIGN QUEST',
    nemesis: 'SPECIAL GUEST VILLAIN',
  }[deck]
}
function deckSymbol(deck: EpisodeDeck) {
  return {
    planet: '◉',
    casino: '♢',
    serendipity: '✦',
    constellation: '✧',
    nemesis: '☠',
  }[deck]
}
function decide(deck: EpisodeDeck, choice: EpisodeChoice) {
  emit('draw', deck, choice)
  flipped.value = null
}
</script>

<style scoped>
.space-daily {
  position: relative;
  height: 100%;
  min-height: 0;
  width: 100%;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #f9e9d3;
  background: radial-gradient(
    ellipse at 65% 0,
    #33466c 0,
    #12182f 47%,
    #080d20 100%
  );
  font-family: system-ui, sans-serif;
}
.daily-opening {
  position: relative;
  flex: 0 0 auto;
  min-height: clamp(7rem, 19cqi, 11rem);
  max-height: 27%;
  overflow: hidden;
  border-bottom: 2px solid #dbab72;
  background: #1b2544;
}
.daily-opening > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 44%;
  opacity: 0.54;
}
.daily-opening::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    #0e1228f5 0,
    #0e1228d0 46%,
    transparent 100%
  );
  pointer-events: none;
}
.daily-opening-content {
  position: relative;
  z-index: 1;
  padding: clamp(0.7rem, 2.5cqi, 1.6rem);
  max-width: min(70%, 50rem);
}
.daily-eyebrow,
.daily-on-air,
.daily-section-head,
.daily-quest-top,
.daily-skill {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.daily-eyebrow {
  color: #ffe0a2;
}
.daily-opening h2 {
  font:
    900 clamp(1.45rem, 4cqi, 3rem)/1 Georgia,
    serif;
  margin: 0.35rem 0 0.45rem;
  text-transform: uppercase;
  letter-spacing: -0.04em;
}
.daily-opening p {
  font-size: clamp(0.7rem, 1.25cqi, 0.94rem);
  line-height: 1.4;
  max-width: 65ch;
  margin: 0;
}
.daily-on-air {
  position: absolute;
  right: 1rem;
  top: 1rem;
  z-index: 1;
  color: #ff9a82;
  text-shadow: 0 0 18px #fa3c66;
}
.daily-body {
  display: grid;
  grid-template-columns: minmax(11rem, 25%) minmax(0, 1fr);
  gap: 0.7rem;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.75rem;
}
.daily-cast,
.daily-quest-zone,
.daily-decks {
  min-height: 0;
  border: 1px solid #7d819c;
  border-radius: 0.7rem;
  background: #101b36e8;
}
.daily-cast,
.daily-quest-zone {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.daily-section-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.4rem;
  padding: 0.65rem 0.8rem;
  color: #ffd9aa;
  border-bottom: 1px solid #8c83a077;
  background: #2d274c;
}
.daily-section-head span {
  color: #bfd0e5;
}
.daily-instruction {
  margin: 0.55rem 0.75rem;
  color: #ccd8e6;
  font-size: 0.7rem;
  line-height: 1.4;
}
.daily-cast-stack {
  overflow-y: auto;
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 0.4rem;
  padding: 0.55rem;
}
.daily-actor {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  padding: 0.35rem 0.5rem;
  border: 1px solid #697b99;
  border-radius: 0.4rem;
  background: #222945;
  text-align: left;
  color: #fff4dc;
  cursor: pointer;
}
.daily-actor.selected {
  border-color: #ffc67c;
  box-shadow: inset 0 0 0 2px #ffc67c;
  background: #553a46;
}
.daily-actor.busy {
  opacity: 0.4;
  cursor: not-allowed;
}
.daily-actor-face {
  flex: 0 0 2.7rem;
  height: 2.7rem;
  display: grid;
  place-items: center;
  border-radius: 0.25rem;
  background: #a84a4a;
  font-size: 1.4rem;
  overflow: hidden;
}
.daily-actor-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.daily-actor-text {
  display: grid;
  gap: 0.18rem;
  flex: 1;
  min-width: 0;
}
.daily-actor-text b {
  font-size: 0.77rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.daily-actor-text small {
  font-size: 0.61rem;
  color: #b5d6e7;
}
.daily-actor-stats {
  font-size: 0.75rem;
  color: #ffe09d;
}
.daily-hire {
  margin: 0.5rem;
  flex: 0 0 auto;
  border: 1px solid #e79a84;
  border-radius: 0.4rem;
  padding: 0.5rem;
  background: #532938;
  color: #ffe4c5;
  font-size: 0.68rem;
  font-weight: 900;
}
.daily-quest-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
  padding: 0.55rem;
  overflow-y: auto;
  min-height: 0;
  flex: 1;
  align-content: start;
}
.daily-quest {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-height: 11rem;
  padding: 0.65rem;
  border: 1px solid #68768f;
  border-top: 4px solid #7592be;
  border-radius: 0.5rem;
  background: linear-gradient(153deg, #2d3559, #17233c);
  color: #f6ebdc;
  text-align: left;
  cursor: pointer;
}
.daily-quest.daily-major {
  border-top-color: #f7ac68;
}
.daily-quest.daily-planned {
  box-shadow: inset 0 0 0 1px #ffc682;
}
.daily-quest.daily-resolved {
  border-top-color: #78bd9c;
  background: #213a3c;
}
.daily-quest-top {
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
  color: #ffc794;
}
.daily-quest > strong {
  font:
    bold 1.05rem/1.2 Georgia,
    serif;
}
.daily-quest p {
  font-size: 0.72rem;
  line-height: 1.4;
  color: #d2dce8;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}
.daily-skill {
  color: #a7d9ea;
  margin-top: auto;
}
.daily-slot {
  display: grid;
  gap: 0.18rem;
  padding: 0.55rem;
  border: 1px dashed #f2c07b;
  border-radius: 0.3rem;
  background: #11152690;
}
.daily-slot b {
  font-size: 0.73rem;
  color: #ffe3b2;
}
.daily-slot small {
  font-size: 0.64rem;
  line-height: 1.3;
  color: #d2dce8;
}
.daily-action-row {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  border-top: 1px solid #a6a9b37b;
  padding: 0.6rem 0.8rem;
  background: #181c32;
}
.daily-action-row span {
  font-size: 0.7rem;
  color: #c7d9e8;
  line-height: 1.4;
}
.daily-action-row button {
  flex: 0 0 auto;
  background: #ebae73;
  color: #1c1b2a;
  border-radius: 0.35rem;
  font-weight: 900;
  padding: 0.7rem 0.9rem;
  font-size: 0.7rem;
}
.daily-action-row button:disabled,
.daily-hire:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.daily-decks {
  flex: 1;
  margin: 0.75rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.daily-deck-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.6rem;
  padding: 0.7rem;
}
.daily-deck {
  display: grid;
  place-items: center;
  gap: 0.3rem;
  min-height: 7.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 2px solid #997b92;
  background: repeating-linear-gradient(
    135deg,
    #2a3454 0,
    #2a3454 8px,
    #38456e 8px,
    #38456e 10px
  );
  color: #ffe1a9;
  text-align: center;
}
.daily-deck:disabled {
  opacity: 0.52;
}
.daily-deck.daily-deck-next {
  border-color: #ffc57d;
  opacity: 1;
  box-shadow: 0 0 13px #ecaa7a88;
}
.daily-deck.daily-deck-turned {
  border-color: #7fc8a8;
  background: #203c3b;
  opacity: 0.8;
}
.daily-deck-number {
  justify-self: start;
  font-size: 0.6rem;
}
.daily-deck-symbol {
  font-size: 2rem;
}
.daily-deck strong {
  font-size: 0.74rem;
}
.daily-deck small {
  font-size: 0.6rem;
}
.daily-reveal {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 35%) minmax(0, 1fr);
  gap: 0.75rem;
  padding: 0 0.75rem 0.75rem;
}
.daily-reveal-art {
  min-height: 0;
  overflow: hidden;
  border-radius: 0.6rem;
  background: #131e34;
}
.daily-reveal-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.daily-reveal-content {
  overflow-y: auto;
  min-height: 0;
  padding: 0.5rem;
}
.daily-reveal-content h3 {
  font:
    900 clamp(1.2rem, 2.8cqi, 2rem)/1.08 Georgia,
    serif;
  margin: 0.5rem 0;
}
.daily-reveal-content p {
  font-size: 0.87rem;
  line-height: 1.5;
}
.daily-reveal-content small {
  color: #a6d6e5;
}
.daily-decisions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}
.daily-decisions button {
  display: grid;
  gap: 0.2rem;
  padding: 0.65rem;
  border: 1px solid #d8aa77;
  border-radius: 0.4rem;
  background: #3b334b;
  color: #ffe5bb;
  text-align: left;
  font-size: 0.74rem;
}
.daily-decisions button small {
  font-size: 0.63rem;
}
.daily-recap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.2rem;
  display: grid;
  align-content: center;
  gap: 0.6rem;
  text-align: center;
}
.daily-recap strong {
  font:
    900 clamp(1rem, 2.2cqi, 1.55rem) Georgia,
    serif;
}
.daily-recap p {
  font-size: 0.86rem;
  line-height: 1.5;
  color: #d1e4eb;
  max-width: 75ch;
  margin: auto;
}
.daily-recap span {
  font-size: 0.7rem;
  color: #ffe1ac;
}
@container (max-width: 740px) {
  .daily-body {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(7rem, 26%) minmax(0, 1fr);
    padding: 0.45rem;
    gap: 0.45rem;
  }
  .daily-cast-stack {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .daily-cast {
    min-height: 0;
  }
  .daily-actor {
    min-width: 8.8rem;
    max-width: 10.5rem;
  }
  .daily-actor-face {
    flex-basis: 2rem;
    height: 2rem;
  }
  .daily-instruction {
    display: none;
  }
  .daily-quest {
    min-height: 9rem;
  }
  .daily-opening-content {
    max-width: 86%;
  }
  .daily-deck {
    min-height: 5.5rem;
  }
  .daily-deck-symbol {
    font-size: 1.3rem;
  }
  .daily-deck strong {
    font-size: 0.59rem;
  }
  .daily-reveal {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .daily-reveal-art {
    max-height: 7rem;
    min-height: 5rem;
  }
}
@container (max-width: 420px) {
  .daily-opening {
    min-height: 6rem;
    max-height: 20%;
  }
  .daily-opening-content {
    padding: 0.45rem;
  }
  .daily-opening h2 {
    font-size: 1.3rem;
  }
  .daily-opening p {
    font-size: 0.64rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .daily-on-air {
    display: none;
  }
  .daily-section-head {
    font-size: 0.53rem;
    padding: 0.35rem 0.45rem;
  }
  .daily-quest-grid {
    gap: 0.3rem;
    padding: 0.3rem;
  }
  .daily-quest {
    padding: 0.35rem;
    min-height: 8rem;
  }
  .daily-quest > strong {
    font-size: 0.8rem;
  }
  .daily-quest p {
    font-size: 0.62rem;
    -webkit-line-clamp: 2;
  }
  .daily-quest-top,
  .daily-skill,
  .daily-slot small {
    font-size: 0.52rem;
  }
  .daily-slot {
    padding: 0.3rem;
  }
  .daily-action-row {
    padding: 0.35rem;
  }
  .daily-action-row span {
    font-size: 0.58rem;
  }
  .daily-action-row button {
    font-size: 0.62rem;
    padding: 0.5rem;
  }
  .daily-deck-row {
    gap: 0.25rem;
    padding: 0.3rem;
  }
  .daily-deck {
    padding: 0.2rem;
  }
  .daily-decisions {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .daily-deck,
  .daily-actor {
    transition: none;
  }
}
</style>
