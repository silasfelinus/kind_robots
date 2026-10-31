<template>
  <section
    class="sc-stage sc-campaign"
    aria-label="Faction story mode"
    data-testid="slime-faction-campaign"
  >
    <div class="campaign-hero" :class="'crew-' + lab.activeTeam">
      <SlimeCityArtwork
        class="campaign-hero-art"
        :image-id="slimeArtId('crews', lab.activeTeam)"
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
        v-if="lab.campaignFinale"
        class="campaign-finale"
        data-testid="slime-campaign-finale"
        aria-live="polite"
      >
        <span class="campaign-overline"
          >STORY COMPLETE / 5 OF 5 RIVALS DEFEATED</span
        >
        <h3>{{ lab.campaignStory.title }}: THE END</h3>
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
          <p>{{ lab.activeChapter.scene }}</p>
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
            <span>{{ lab.campaignState.lastScene }}</span>
          </div>
        </div>
        <div class="campaign-decision">
          <span class="campaign-overline"
            >CHOOSE YOUR APPROACH · BLACKOUT RULES</span
          >
          <button
            v-for="choice in lab.activeChapter.choices"
            :key="choice.id"
            type="button"
            :data-testid="'slime-campaign-choice-' + choice.id"
            @click="lab.startCampaignBattle(choice.id)"
          >
            <span class="decision-mark">{{
              choice.id === 'conviction' ? '01' : '02'
            }}</span>
            <span class="decision-copy">
              <strong>{{ choice.label }}</strong>
              <small>{{ describeTerms(choice.terms) }}</small>
            </span>
            <span class="decision-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <div class="campaign-disclaimer">
        <span
          >{{ lab.campaignState.losses }} CAMPAIGN LOSSES · DEFEAT RETRIES ARE
          UNLIMITED</span
        >
        <span>SESSION-ONLY STORY PROGRESS · NO REAL-MONEY REWARDS</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { describeTerms } from '~/utils/slimeCity/campaign'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { useSlimeCityStore } from '~/stores/slimeCity'
import type { TeamId } from '~/utils/slimeCity/prototypes'

const lab = useSlimeCityStore()
const nextDistrictName = computed(
  () =>
    lab.districts.find((district) => district.id === lab.campaignDistrict)
      ?.name ?? 'Unknown district',
)
function teamName(id: TeamId): string {
  return lab.teams.find((team) => team.id === id)?.name ?? id
}
</script>

<style scoped>
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
  display: grid;
  gap: 0.45rem;
  align-content: start;
}
.campaign-decision button {
  display: flex;
  align-items: center;
  text-align: left;
  gap: 0.55rem;
  width: 100%;
  padding: 0.75rem;
  color: #f4f4ec;
  background: linear-gradient(120deg, #313b43, #182130);
  border: 1px solid #a1c6a2;
  border-radius: 0.55rem;
  cursor: pointer;
}
.campaign-decision button:hover,
.campaign-decision button:focus-visible {
  border-color: #effc9f;
  background: #3a4444;
}
.decision-mark {
  font-size: 1.4rem;
  font-weight: 1000;
  color: #c9d78e;
}
.decision-copy {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 0.15rem;
}
.decision-copy strong {
  font-size: 0.8rem;
}
.decision-copy small {
  color: #c7d1d8;
  font-size: 0.68rem;
}
.decision-arrow {
  font-size: 1.4rem;
  color: #d2ed9f;
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
