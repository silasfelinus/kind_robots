<template>
  <section class="tower-stage sc-stage" data-testid="slime-alliance-tower">
    <SlimeCityArtwork
      class="tower-poster"
      :image-id="
        slimeArtId('crews', lab.towerRun?.deck.general ?? lab.activeTeam)
      "
      alt="The Alliance general enters the rising Grand Pit"
      :fallback="lab.team.insignia"
    />
    <div class="tower-shade" aria-hidden="true"></div>
    <header class="tower-banner">
      <div>
        <small>CLASH ALLIANCE · THE GRAND PIT</small>
        <h2>THE ASCENT</h2>
        <p v-if="lab.towerRun">
          FLOOR {{ lab.towerRun.floor + 1 }} / {{ TOWER_FLOORS }} ·
          {{ lab.towerRun.deck.general.toUpperCase() }} +
          {{ lab.towerRun.deck.ally.toUpperCase() }}
        </p>
        <p v-else>Two crews. One general. Twelve dangerous floors.</p>
      </div>
      <div class="tower-legacy">
        <strong>{{ lab.towerMeta.bestFloor }}/12</strong>
        <small>BEST · {{ lab.towerMeta.cinders }} CINDERS</small>
      </div>
    </header>

    <div v-if="!lab.towerRun" class="tower-content">
      <article class="tower-card tower-intro">
        <span class="tower-eyebrow">THE NEXT RUN</span>
        <h3>{{ lab.team.name }}</h3>
        <p>
          Take your saved 20-card Alliance into the vertical city. Each fork
          changes the fight. Spoils and surviving relics become advantages for
          another attempt.
        </p>
        <p class="tower-hint">
          Each win climbs one floor. Leaving or refreshing a fight forfeits it.
          Card spoils and Cinders are separate Tower legacy, not Meat or account
          pack cards.
        </p>
        <div class="tower-actions">
          <button
            type="button"
            class="tower-action secondary"
            @click="openArmory"
          >
            EDIT ALLIANCE DECK
          </button>
          <button
            type="button"
            class="tower-action"
            data-testid="slime-tower-begin"
            @click="lab.beginTower()"
          >
            ENTER THE PIT · 20 CARDS
          </button>
        </div>
      </article>
    </div>

    <div v-else-if="lab.towerRun.phase === 'route'" class="tower-content">
      <div class="tower-copy">
        <span class="tower-eyebrow">THE NEXT FORK</span>
        <h3>{{ floorName }}</h3>
        <p>
          {{
            lab.towerRun.relics.length
              ? 'Brass Ward follows you upward. The crowd has noticed.'
              : 'Two stairways lead to different trouble. Pick the obstacle you want to face.'
          }}
        </p>
        <small
          >SCARS {{ lab.towerRun.scars }} · GUARD {{ lab.towerRun.guard }} ·
          SPARKS {{ lab.towerRun.sparks }}</small
        >
      </div>
      <KrChoiceHand
        :choices="routeChoices"
        :deal-key="String(lab.towerRun.seed) + ':' + lab.towerRun.floor"
        question="CHOOSE THE NEXT ARENA"
        testid-prefix="slime-tower-route"
        @play="chooseRoute"
      >
        <template #art="{ choice }">
          <SlimeCityArtwork
            :image-id="slimeArtId('crews', routeFoe(choice.id))"
            :alt="choice.label"
            :fallback="crewSymbol(routeFoe(choice.id))"
            compact
          />
        </template>
      </KrChoiceHand>
    </div>

    <div v-else-if="lab.towerRun.phase === 'battle'" class="tower-content">
      <article class="tower-card">
        <span class="tower-eyebrow">FIGHT IN PROGRESS</span>
        <h3>{{ lab.towerRun.chosen?.title }}</h3>
        <p>{{ lab.towerRun.chosen?.scene }}</p>
        <button
          type="button"
          class="tower-action"
          data-testid="slime-tower-resume"
          @click="lab.view = 'clash'"
        >
          RETURN TO BATTLE
        </button>
      </article>
    </div>

    <div v-else class="tower-content">
      <div class="tower-copy">
        <span class="tower-eyebrow">{{
          lab.towerRun.phase === 'complete'
            ? 'THE GRAND PIT IS YOURS'
            : 'THE PIT CLAIMS THIS RUN'
        }}</span>
        <h3>{{ lab.towerRun.floor }} FLOORS CLEARED</h3>
        <p>
          {{
            lab.towerRewards
              ? 'The tower keeps your story in its walls. Take one card for a future ascent.'
              : 'No victories, no spoils. The pit gives nothing away.'
          }}
        </p>
        <small
          >{{ lab.towerRun.sparks }} CINDERS EARNED ·
          {{ lab.towerRun.relics.join(', ') || 'NO RELICS' }}</small
        >
      </div>
      <button
        v-if="!lab.towerRewards"
        type="button"
        class="tower-action"
        data-testid="slime-tower-retry"
        @click="lab.leaveTowerWithoutSpoils()"
      >
        TRY ANOTHER ASCENT
      </button>
      <KrChoiceHand
        v-else
        :choices="spoilChoices"
        :deal-key="'spoils:' + lab.towerRun.seed + ':' + lab.towerRun.floor"
        question="CHOOSE ONE PERMANENT TOWER CARD"
        testid-prefix="slime-tower-spoils"
        @play="chooseSpoil"
      >
        <template #art="{ choice }">
          <SlimeCityClashCardFace :card-id="choice.id" />
        </template>
      </KrChoiceHand>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { TOWER_FLOORS } from '~/utils/slimeCity/allianceTower'
import { rarityOf } from '~/utils/slimeCity/progression'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import type { TeamId } from '~/utils/slimeCity/prototypes'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

const lab = useSlimeCityStore()
const floorName = computed(
  () =>
    ['THE UNDERCITY', 'THE FOUNDRY', 'THE SPIRE'][
      Math.min(2, Math.floor((lab.towerRun?.floor ?? 0) / 4))
    ],
)
const routeChoices = computed<KrHandChoice[]>(() =>
  (lab.towerOptions ?? []).map((route) => ({
    id: route.id,
    label: route.title,
    badge: route.hazard.toUpperCase(),
    chip: route.reward,
    details: [route.scene],
  })),
)
const spoilChoices = computed<KrHandChoice[]>(() =>
  (lab.towerRewards ?? []).map((card) => ({
    id: card.id,
    label: card.name,
    chip: rarityOf(card).toUpperCase(),
    badge: 'TOWER LEGACY',
    details: [card.text],
  })),
)
function routeFoe(id: string): TeamId {
  return (
    lab.towerOptions?.find((route) => route.id === id)?.foe ?? lab.activeTeam
  )
}
function crewSymbol(id: TeamId): string {
  return lab.teams.find((team) => team.id === id)?.insignia ?? '✦'
}
function chooseRoute(choice: KrHandChoice) {
  lab.chooseTowerFloor(choice.id)
}
function chooseSpoil(choice: KrHandChoice) {
  lab.takeTowerSpoil(choice.id)
}
function openArmory() {
  lab.deckFormat = 'alliance'
  lab.showCards()
}
</script>

<style scoped>
.tower-stage {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: #0c111d;
  color: #f5f4e8;
}
.tower-poster {
  position: absolute;
  inset: 0;
  z-index: -2;
  opacity: 0.8;
}
.tower-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(90deg, #080d18e8, #080d1888 55%, #050910aa),
    linear-gradient(0deg, #070911ed, transparent 75%);
}
.tower-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: clamp(0.7rem, 2cqw, 1.25rem);
}
.tower-banner h2 {
  font-weight: 950;
  font-size: clamp(1.5rem, 4cqw, 3rem);
  letter-spacing: 0.07em;
  line-height: 1;
}
.tower-banner small,
.tower-eyebrow {
  color: #ceff72;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  font-weight: 800;
}
.tower-banner p {
  color: #efdfd1;
  font-size: 0.8rem;
  margin-top: 0.35rem;
}
.tower-legacy {
  text-align: right;
  white-space: nowrap;
}
.tower-legacy strong {
  display: block;
  font-size: 1.5rem;
}
.tower-legacy small {
  display: block;
}
.tower-content {
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: clamp(0.7rem, 2cqw, 1.3rem);
  gap: 0.75rem;
}
.tower-copy,
.tower-card {
  max-width: 44rem;
  border: 1px solid #8aa88370;
  background: #081019db;
  border-radius: 1rem;
  padding: clamp(0.9rem, 2cqw, 1.3rem);
  backdrop-filter: blur(12px);
}
.tower-card {
  margin: auto 0 0;
}
.tower-copy h3,
.tower-card h3 {
  font-size: clamp(1.3rem, 2.7cqw, 2rem);
  font-weight: 850;
}
.tower-copy p,
.tower-card p {
  font-size: clamp(0.88rem, 1.5cqw, 1rem);
  line-height: 1.45;
}
.tower-copy small,
.tower-hint {
  color: #d0e7c1;
  font-size: 0.76rem;
}
.tower-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}
.tower-action {
  border: 1px solid #bdfc7a;
  border-radius: 0.7rem;
  background: #bdfc7a;
  color: #11200f;
  font-weight: 900;
  padding: 0.8rem 1rem;
  cursor: pointer;
}
.tower-action.secondary {
  background: #1b2a29;
  color: #e5f5d8;
}
.tower-action:focus-visible {
  outline: 3px solid white;
  outline-offset: 2px;
}
@media (max-width: 600px) {
  .tower-banner {
    align-items: start;
  }
  .tower-banner h2 {
    font-size: 1.55rem;
  }
  .tower-legacy strong {
    font-size: 1.1rem;
  }
  .tower-content {
    padding: 0.55rem;
  }
  .tower-copy,
  .tower-card {
    padding: 0.7rem;
  }
}
</style>
