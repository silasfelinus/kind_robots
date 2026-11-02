<template>
  <section
    class="sc-stage sc-campaign"
    aria-label="Faction story mode"
    data-testid="slime-faction-campaign"
  >
    <div class="campaign-hero" :class="'crew-' + lab.activeTeam">
      <SlimeCityArtwork
        class="campaign-hero-art"
        :image-id="heroArtId"
        :alt="lab.team.name + ' illustrated campaign poster'"
        :fallback="lab.team.insignia"
      />
      <div class="campaign-hero-ink" aria-hidden="true">
        <span class="ink-sun"></span>
        <span class="ink-tower ink-tower-a"></span>
        <span class="ink-tower ink-tower-b"></span>
        <span class="ink-figure"></span>
      </div>
      <div class="campaign-headline">
        <span class="campaign-overline"
          >SLIME CITY ORIGINAL / FACTION STORY MODE</span
        >
        <span class="campaign-serial"
          >CAMPAIGN {{ String(lab.campaignState.wins + 1).padStart(2, '0') }} /
          06</span
        >
        <h2>{{ lab.campaignStory.title }}</h2>
        <p>{{ lab.campaignStory.prologue }}</p>
        <strong class="campaign-principle">{{
          lab.campaignStory.principle
        }}</strong>
      </div>
      <div class="campaign-stamp">
        <span>FIVE RIVALS</span>
        <b>{{ lab.campaignState.wins }} / 5</b>
        <small>VICTORIES</small>
      </div>
    </div>

    <div class="campaign-body kr-scroll">
      <div class="campaign-track" aria-label="Five rival chapters">
        <div
          v-for="(chapter, index) in lab.campaignStory.chapters"
          :key="chapter.foe"
          class="campaign-step"
          :class="{
            cleared: index < lab.campaignState.wins,
            current: index === lab.campaignState.wins,
          }"
          :aria-current="index === lab.campaignState.wins ? 'step' : undefined"
          :data-testid="'slime-chapter-' + index"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ teamName(chapter.foe) }}</strong>
          <small>{{
            index < lab.campaignState.wins
              ? 'DEFEATED'
              : index === lab.campaignState.wins
                ? 'NEXT BATTLE'
                : 'LOCKED'
          }}</small>
        </div>
      </div>

      <div
        v-if="lab.campaignAftermath"
        class="campaign-rival-verdict"
        :class="lab.campaignAftermath.result === 'player' ? 'won' : 'lost'"
        aria-live="polite"
        data-testid="slime-campaign-rival-verdict"
      >
        <div class="campaign-verdict-heading">
          <strong>
            {{
              lab.campaignAftermath.result === 'player'
                ? 'AFTERMATH · VICTORY'
                : 'AFTERMATH · DEFEAT'
            }}
          </strong>
          <small>
            CHAPTER {{ lab.campaignAftermath.chapterIndex + 1 }} ·
            {{ lab.campaignAftermath.chapterTitle }}
            <template v-if="lab.campaignAftermath.approach">
              · {{ lab.campaignAftermath.approach.toUpperCase() }}
            </template>
          </small>
        </div>
        <div class="campaign-verdict-lines">
          <SlimeCityArtwork
            class="campaign-verdict-portrait"
            :image-id="slimeArtId('crews', lab.campaignAftermath.foe)"
            :alt="teamName(lab.campaignAftermath.foe) + ' rival portrait'"
            :fallback="crewInsignia(lab.campaignAftermath.foe)"
            compact
          />
          <div>
            <strong>{{ lab.campaignAftermath.rivalSpeaker }}</strong>
            <p>“{{ lab.campaignAftermath.rivalLine }}”</p>
            <div
              v-if="lab.campaignAftermath.playerLine"
              class="campaign-verdict-reply"
              data-testid="slime-campaign-player-reflection"
            >
              <small>{{ lab.campaignAftermath.playerSpeaker }}</small>
              <p>“{{ lab.campaignAftermath.playerLine }}”</p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="lab.campaignFinale"
        class="campaign-finale"
        data-testid="slime-campaign-finale"
        aria-live="polite"
      >
        <span class="campaign-overline"
          >STORY COMPLETE / 5 OF 5 RIVALS DEFEATED</span
        >
        <h3>{{ lab.campaignStory.title }}: THE END</h3>
        <SlimeCityArtwork
          v-if="endingArtId"
          class="campaign-plate"
          :image-id="endingArtId"
          :alt="lab.campaignStory.title + ' illustrated ending'"
          data-testid="slime-campaign-ending-art"
        />
        <p>{{ lab.campaignFinale }}</p>
        <small
          >All six campaigns have independent playtest progress. Story wins
          grant no account Meat, XP or pack cards.</small
        >
      </div>

      <div v-else-if="lab.activeChapter" class="campaign-mission">
        <div class="campaign-briefing">
          <span class="campaign-overline">
            CHAPTER {{ lab.campaignState.wins + 1 }} / 5 · VERSUS
            {{ teamName(lab.activeChapter.foe).toUpperCase() }}
          </span>
          <h3>{{ lab.activeChapter.title }}</h3>
          <SlimeCityArtwork
            v-if="chapterArtId"
            class="campaign-plate"
            :image-id="chapterArtId"
            :alt="lab.activeChapter.title + ' illustrated chapter scene'"
            data-testid="slime-campaign-chapter-art"
          />
          <p>{{ lab.activeChapter.scene }}</p>
          <div
            v-if="lab.campaignConversation"
            class="campaign-exchange"
            aria-label="Rival confrontation"
            data-testid="slime-campaign-conversation"
          >
            <div class="campaign-exchange-voice rival">
              <SlimeCityArtwork
                class="campaign-exchange-portrait"
                :image-id="
                  slimeArtId('crews', lab.campaignConversation.rivalTeam)
                "
                :alt="
                  teamName(lab.campaignConversation.rivalTeam) + ' portrait'
                "
                :fallback="crewInsignia(lab.campaignConversation.rivalTeam)"
                compact
              />
              <div class="campaign-exchange-lines">
                <small
                  >THE RIVAL ·
                  {{ lab.campaignConversation.rivalSpeaker }}</small
                >
                <p>{{ lab.campaignConversation.rivalLine }}</p>
                <p
                  v-if="lab.campaignConversation.rememberedChoice"
                  class="campaign-exchange-memory"
                  data-testid="slime-campaign-memory"
                >
                  {{ lab.campaignConversation.rememberedChoice }}
                </p>
              </div>
            </div>
            <div class="campaign-exchange-voice player">
              <SlimeCityArtwork
                class="campaign-exchange-portrait"
                :image-id="slimeArtId('crews', lab.activeTeam)"
                :alt="lab.team.name + ' leader portrait'"
                :fallback="lab.team.insignia"
                compact
              />
              <div class="campaign-exchange-lines">
                <small
                  >YOUR CREW ·
                  {{ lab.campaignConversation.playerSpeaker }}</small
                >
                <p>{{ lab.campaignConversation.playerLine }}</p>
                <p
                  v-if="lab.campaignConversation.retryLine"
                  class="campaign-exchange-memory"
                  data-testid="slime-campaign-rematch"
                >
                  {{ lab.campaignConversation.retryLine }}
                </p>
              </div>
            </div>
          </div>
          <button
            v-if="lab.campaignDistrict"
            type="button"
            class="campaign-find"
            data-testid="slime-find-campaign-district"
            @click="lab.findCampaignBattle()"
          >
            FOLLOW THE STORY ON THE CITY MAP · {{ nextDistrictName }} →
          </button>
          <div
            v-if="lab.campaignFavors.length"
            class="campaign-favors"
            data-testid="slime-campaign-favors"
          >
            <strong class="campaign-overline"
              >EARNED SUPPORT · CHOOSE ONE FOR THE NEXT FIGHT</strong
            >
            <div
              class="campaign-favor-grid"
              role="group"
              aria-label="Choose earned story support"
            >
              <button
                v-for="favor in lab.campaignFavors"
                :key="favor.chapterIndex"
                type="button"
                class="campaign-favor"
                :class="{
                  active: favor.chapterIndex === lab.campaignFavorIndex,
                }"
                :aria-pressed="favor.chapterIndex === lab.campaignFavorIndex"
                :data-testid="'slime-favor-' + favor.chapterIndex"
                @click="lab.selectCampaignFavor(favor.chapterIndex)"
              >
                <SlimeCityArtwork
                  class="campaign-favor-art"
                  :image-id="slimeArtId('crews', favor.ally)"
                  :alt="teamName(favor.ally) + ' earned ally portrait'"
                  :fallback="teamName(favor.ally)"
                  compact
                />
                <span class="campaign-favor-copy">
                  <small
                    >CHAPTER {{ favor.chapterIndex + 1 }} ·
                    {{ favor.choice.toUpperCase() }}</small
                  >
                  <strong>{{ favor.echo.title }}</strong>
                  <small>{{ describeTerms(favor.echo.terms) }}</small>
                </span>
              </button>
            </div>
            <div
              v-if="lab.campaignEcho"
              class="campaign-recap"
              data-testid="slime-campaign-echo"
            >
              <strong>{{ lab.campaignEcho.speaker }}</strong>
              <span>“{{ lab.campaignEcho.voice }}”</span>
              <small>{{ lab.campaignEcho.story }}</small>
            </div>
          </div>
          <div
            v-if="lab.campaignState.lastScene"
            class="campaign-recap"
            aria-live="polite"
            data-testid="slime-campaign-recap"
          >
            <strong>{{
              lab.campaignState.lastResult === 'player'
                ? 'LAST VICTORY'
                : lab.campaignState.lastResult === 'enemy'
                  ? 'LAST DEFEAT'
                  : 'LAST DRAW'
            }}</strong>
            <SlimeCityArtwork
              v-if="recapArtId"
              class="campaign-plate"
              :image-id="recapArtId"
              alt="Illustrated result of the last battle"
              data-testid="slime-campaign-recap-art"
            />
            <span>{{ lab.campaignState.lastScene }}</span>
          </div>
        </div>
        <div class="campaign-decision" :class="'tone-' + lab.team.color">
          <KrChoiceHand
            :choices="approachChoices"
            question="CHOOSE YOUR APPROACH · BLACKOUT RULES"
            :deal-key="lab.activeTeam + ':' + lab.campaignState.wins"
            testid-prefix="slime-campaign-choice"
            @play="playApproach"
          >
            <template #art="{ choice }">
              <SlimeCityArtwork
                :image-id="slimeArtId('crews', approachCrew(choice.id))"
                :alt="choice.label"
                :fallback="crewInsignia(approachCrew(choice.id))"
                compact
              />
            </template>
          </KrChoiceHand>
        </div>
      </div>
      <div class="campaign-disclaimer">
        <span
          >{{ lab.campaignState.losses }} CAMPAIGN LOSSES · DEFEAT RETRIES ARE
          UNLIMITED</span
        >
        <span>ACCOUNT-SAVED STORY · NO REAL-MONEY REWARDS</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { campaignBattleTerms, describeTerms } from '~/utils/slimeCity/campaign'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { useSlimeCityStore } from '~/stores/slimeCity'
import type { TeamId } from '~/utils/slimeCity/prototypes'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

const lab = useSlimeCityStore()
const nextDistrictName = computed(
  () =>
    lab.districts.find((district) => district.id === lab.campaignDistrict)
      ?.name ?? 'Unknown district',
)
// Story plates (conductor slime-city BLACKOUT-STORY-ROUND-2): the opening, each chapter's scene, the
// approach the last victory used (or the defeat), and the ending the decisions earned. Unrendered
// plates fall back to what the screen showed before.
function storyArt(key: string): number | null {
  return slimeArtId('story', lab.activeTeam + '/' + key)
}
const heroArtId = computed(
  () => storyArt('opening') ?? slimeArtId('crews', lab.activeTeam),
)
const chapterArtId = computed(() =>
  lab.activeChapter ? storyArt(lab.campaignState.wins + 1 + '/scene') : null,
)
const recapArtId = computed(() => {
  const state = lab.campaignState
  if (state.lastResult === 'player') {
    const choice = state.decisions[state.decisions.length - 1]
    return choice ? storyArt(state.wins + '/' + choice) : null
  }
  if (state.lastResult === 'enemy') return storyArt(state.wins + 1 + '/defeat')
  return null
})
const endingArtId = computed(() => {
  if (!lab.campaignFinale) return null
  const conviction = lab.campaignState.decisions.filter(
    (id) => id === 'conviction',
  ).length
  return storyArt(conviction >= 3 ? 'ending-triumph' : 'ending-compromise')
})
function teamName(id: TeamId): string {
  return lab.teams.find((team) => team.id === id)?.name ?? id
}
function crewInsignia(id: TeamId): string {
  return lab.teams.find((team) => team.id === id)?.insignia ?? ''
}
function approachCrew(id: string): TeamId {
  return id === 'cunning' && lab.activeChapter
    ? lab.activeChapter.foe
    : lab.activeTeam
}
const approachChoices = computed<KrHandChoice[]>(() =>
  (lab.activeChapter?.choices ?? []).map((choice) => ({
    id: choice.id,
    label: choice.label,
    chip: describeTerms(
      campaignBattleTerms(
        lab.campaignSave,
        lab.activeTeam,
        choice.terms,
        lab.campaignFavorIndex,
      ),
    ),
    badge: choice.id === 'conviction' ? 'Conviction' : 'Cunning',
  })),
)
function playApproach(choice: KrHandChoice) {
  const approach = lab.activeChapter?.choices.find(
    (option) => option.id === choice.id,
  )
  if (approach) lab.startCampaignBattle(approach.id)
}
</script>

<style scoped>
.campaign-plate {
  display: block;
  width: 100%;
  max-height: 11rem;
  aspect-ratio: 16 / 9;
  margin: 0.5rem 0;
  overflow: hidden;
  border-radius: 0.75rem;
}
.campaign-plate :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sc-campaign {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  container-type: inline-size;
  background: #11151f;
  color: #f4f4ec;
}
.campaign-hero .campaign-hero-art {
  position: absolute;
  inset: 0;
  z-index: -2;
  opacity: 0.86;
}
.campaign-hero .campaign-hero-art :deep(img) {
  object-position: center 42%;
}
.campaign-hero::after {
  position: absolute;
  inset: 0;
  z-index: -1;
  content: '';
  pointer-events: none;
  background: linear-gradient(
    90deg,
    #0d1622ec 0%,
    #0e1727b8 48%,
    #0d14206b 100%
  );
}
.campaign-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: clamp(12rem, 29cqw, 22rem);
  overflow: hidden;
  isolation: isolate;
  padding: clamp(1rem, 2cqw, 2rem);
  background: radial-gradient(
    circle at 78% 36%,
    #93decb,
    #26536b 42%,
    #101b2e 80%
  );
}
.crew-bloodfairies {
  background: radial-gradient(
    circle at 75% 35%,
    #f869aa,
    #87295b 43%,
    #1e1135 85%
  );
}
.crew-ironjaw {
  background: radial-gradient(
    circle at 75% 35%,
    #e8b660,
    #84603e 43%,
    #152c2d 85%
  );
}
.crew-riot {
  background: radial-gradient(
    circle at 75% 35%,
    #fe8759,
    #982c39 43%,
    #2a1429 85%
  );
}
.crew-undertow {
  background: radial-gradient(
    circle at 75% 35%,
    #6ce5b8,
    #136e74 43%,
    #101b2b 85%
  );
}
.crew-exchange {
  background: radial-gradient(
    circle at 75% 35%,
    #f2cf80,
    #8a633c 43%,
    #241c32 85%
  );
}
.campaign-hero-ink {
  display: none;
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.75;
}
.ink-sun {
  position: absolute;
  right: 12%;
  top: -28%;
  width: 44%;
  aspect-ratio: 1;
  border: 1rem solid #ffffff1d;
  border-radius: 50%;
  box-shadow:
    0 0 0 1.4rem #ffffff0a,
    0 0 8rem #ffffff1e;
}
.ink-tower {
  position: absolute;
  bottom: -12%;
  right: 16%;
  height: 85%;
  width: 22%;
  transform: skew(-12deg);
  background: linear-gradient(140deg, #ffffff45, #080d20 60%);
  clip-path: polygon(24% 0, 79% 9%, 100% 100%, 0 100%);
}
.ink-tower-b {
  right: 0;
  width: 17%;
  height: 62%;
  transform: skew(9deg);
}
.ink-figure {
  position: absolute;
  width: 28%;
  height: 77%;
  right: 16%;
  bottom: -15%;
  background: linear-gradient(125deg, #ffffff83, #0c1a33 48%, #090b1a);
  clip-path: polygon(
    45% 0,
    61% 1%,
    71% 18%,
    63% 29%,
    76% 45%,
    99% 72%,
    81% 81%,
    100% 100%,
    1% 100%,
    20% 69%,
    25% 43%,
    39% 29%,
    32% 14%
  );
  filter: drop-shadow(0 0 1rem #000);
}
.campaign-headline {
  display: grid;
  align-content: end;
  gap: 0.48rem;
  width: min(75%, 38rem);
  text-shadow: 0 2px 15px #080d1c;
}
.campaign-overline,
.campaign-serial {
  font-size: 0.63rem;
  font-weight: 900;
  letter-spacing: 0.14em;
}
.campaign-serial {
  color: #fff5ad;
}
.campaign-headline h2 {
  margin: 0;
  font-weight: 1000;
  font-size: clamp(1.8rem, 5cqw, 4.2rem);
  line-height: 0.91;
  letter-spacing: -0.045em;
  text-transform: uppercase;
}
.campaign-headline p {
  max-width: 35rem;
  margin: 0;
  font-size: clamp(0.72rem, 1.12cqw, 0.95rem);
  line-height: 1.36;
}
.campaign-principle {
  display: block;
  color: #fff1ad;
  font-size: 0.78rem;
  font-style: italic;
}
.campaign-stamp {
  position: absolute;
  top: 0.75rem;
  right: 0.85rem;
  display: grid;
  justify-items: center;
  gap: 0.06rem;
  padding: 0.55rem 0.7rem;
  border: 2px solid #ffffffa8;
  border-radius: 50%;
  background: #0a142e80;
  transform: rotate(9deg);
}
.campaign-stamp span,
.campaign-stamp small {
  font-size: 0.5rem;
  letter-spacing: 0.07em;
}
.campaign-stamp b {
  font-size: 1.35rem;
}
.campaign-body {
  display: grid;
  align-content: start;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  padding: 0.9rem clamp(0.75rem, 2cqw, 1.4rem);
  overflow-y: auto;
}
.campaign-track {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
}
.campaign-step {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
  padding: 0.55rem;
  background: #232a36;
  border: 1px solid #697587;
  border-bottom: 3px solid #535d71;
  opacity: 0.7;
}
.campaign-step.current {
  background: #383c28;
  border-color: #e8f39b;
  opacity: 1;
}
.campaign-step.cleared {
  background: #18382e;
  border-color: #70ce9d;
  opacity: 1;
}
.campaign-step span {
  font-size: 0.6rem;
  color: #cbd8e1;
}
.campaign-step strong {
  font-size: clamp(0.59rem, 1.1cqw, 0.8rem);
  line-height: 1.2;
}
.campaign-step small {
  font-size: 0.55rem;
  letter-spacing: 0.06em;
}
.campaign-mission {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.95fr);
  gap: 1rem;
}
.campaign-briefing h3,
.campaign-finale h3 {
  margin: 0.2rem 0 0.55rem;
  font-size: clamp(1.3rem, 2.3cqw, 2rem);
  line-height: 1;
}
.campaign-briefing p,
.campaign-finale p {
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0.35rem 0;
}
.campaign-find {
  margin-top: 0.5rem;
  padding: 0.55rem 0.8rem;
  max-width: 100%;
  text-align: left;
  border: 1px solid #dceba1;
  border-radius: 0.4rem;
  background: #243a39;
  color: #eefaaf;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.campaign-find:focus-visible {
  outline: 3px solid #f7e1ac;
  outline-offset: 2px;
}
.campaign-decision {
  --tone: #c5ff59;
  --hand-accent: var(--tone);
  --hand-accent-2: #c5ff59;
  --hand-band: #070b12;
  --hand-band-ink: #f4f4ec;
  min-width: 0;
}
.campaign-decision.tone-red {
  --tone: #fe6657;
}
.campaign-decision.tone-blue {
  --tone: #6fc8ff;
}
.campaign-decision.tone-purple {
  --tone: #d38cff;
}
.campaign-decision.tone-green {
  --tone: #c7fa62;
}
.campaign-decision.tone-gold {
  --tone: #f7c968;
}
.campaign-favors {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
}
.campaign-favor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: 0.45rem;
}
.campaign-favor {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  padding: 0.35rem;
  background: #192633;
  color: #f4f4ec;
  border: 2px solid #5a7077;
  border-radius: 0.55rem;
  cursor: pointer;
  text-align: left;
}
.campaign-favor.active {
  border-color: #f3e2a2;
  background: #354038;
}
.campaign-favor:focus-visible {
  outline: 3px solid #f5efbf;
  outline-offset: 2px;
}
.campaign-favor-art {
  flex: 0 0 4rem;
  width: 4rem;
  height: 5rem;
  overflow: hidden;
  border-radius: 0.3rem;
}
.campaign-favor-art :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.campaign-favor-copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}
.campaign-favor-copy strong {
  font-size: 0.76rem;
}
.campaign-favor-copy small {
  font-size: 0.62rem;
  color: #ced9d6;
}
.campaign-exchange {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: 0.55rem;
  margin: 0.45rem 0 0.6rem;
  min-width: 0;
}
.campaign-exchange-voice {
  display: flex;
  gap: 0.55rem;
  padding: 0.45rem;
  min-width: 0;
  border: 1px solid #54727a;
  border-radius: 0.65rem;
  background: #182b36;
  align-items: flex-start;
}
.campaign-exchange-voice.player {
  border-color: #9ab88b;
  background: #26372f;
}
.campaign-exchange-portrait {
  flex: 0 0 4rem;
  width: 4rem;
  height: 5.5rem;
  border-radius: 0.4rem;
  overflow: hidden;
}
.campaign-exchange-portrait :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.campaign-exchange-lines {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}
.campaign-exchange-lines small {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  color: #c9e5d4;
}
.campaign-exchange-lines p {
  margin: 0;
  font-size: clamp(0.78rem, 1.5cqw, 0.93rem);
  line-height: 1.35;
}
.campaign-exchange-lines .campaign-exchange-memory {
  padding-top: 0.35rem;
  border-top: 1px solid #ffffff28;
  color: #e9dca9;
}
.campaign-rival-verdict {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem;
  border: 1px solid #d1b783;
  border-left: 4px solid #e2c07e;
  border-radius: 0.7rem;
  background: #2c302d;
}
.campaign-rival-verdict.lost {
  border-color: #b9888d;
  border-left-color: #ef9ea4;
  background: #372b32;
}
.campaign-verdict-heading {
  display: grid;
  gap: 0.2rem;
}
.campaign-verdict-heading strong {
  font-size: 0.75rem;
  letter-spacing: 0.09em;
}
.campaign-verdict-heading small {
  font-size: 0.63rem;
  color: #e3d5c2;
}
.campaign-verdict-lines {
  display: grid;
  grid-template-columns: 4.7rem minmax(0, 1fr);
  align-items: start;
  gap: 0.65rem;
}
.campaign-verdict-portrait {
  width: 4.7rem;
  height: 6rem;
  overflow: hidden;
  border-radius: 0.5rem;
}
.campaign-verdict-portrait :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.campaign-verdict-lines strong,
.campaign-verdict-reply small {
  font-size: 0.68rem;
  color: #f3dfb3;
  font-weight: 800;
}
.campaign-verdict-lines p {
  font-size: 0.85rem;
  line-height: 1.4;
  margin: 0.25rem 0;
}
.campaign-verdict-reply {
  margin-top: 0.55rem;
  padding-top: 0.55rem;
  border-top: 1px solid #ffffff30;
}
.campaign-recap {
  margin-top: 0.6rem;
  padding: 0.7rem;
  display: grid;
  gap: 0.3rem;
  background: #202e38;
  border-left: 3px solid #c1df93;
}
.campaign-recap strong {
  color: #cfedab;
  font-size: 0.66rem;
  letter-spacing: 0.08em;
}
.campaign-recap span {
  font-size: 0.75rem;
}
.campaign-finale {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
  background: #293c30;
  border: 2px solid #c0e69e;
  border-radius: 0.6rem;
}
.campaign-finale small {
  color: #c3d5c2;
  font-size: 0.7rem;
}
.campaign-disclaimer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.61rem;
  letter-spacing: 0.05em;
  color: #adb9c8;
}
@container (max-width: 570px) {
  .campaign-hero {
    min-height: 13rem;
    padding: 0.75rem;
  }
  .campaign-headline {
    width: 87%;
    gap: 0.3rem;
  }
  .campaign-headline h2 {
    font-size: clamp(1.35rem, 7cqw, 2.3rem);
  }
  .campaign-headline p {
    font-size: 0.7rem;
  }
  .campaign-principle {
    font-size: 0.64rem;
  }
  .campaign-stamp {
    top: 0.35rem;
    right: 0.35rem;
    transform: scale(0.7) rotate(9deg);
    transform-origin: top right;
  }
  .campaign-step {
    padding: 0.35rem 0.2rem;
  }
  .campaign-step strong {
    font-size: 0.55rem;
    overflow-wrap: anywhere;
  }
  .campaign-step small {
    font-size: 0.46rem;
  }
  .campaign-mission {
    grid-template-columns: minmax(0, 1fr);
  }
  .campaign-hero-ink {
    opacity: 0.35;
  }
}
</style>
