<template>
  <div
    class="scs"
    :class="'scs-' + lab.cityScene"
    role="region"
    :aria-label="regionLabel"
    data-testid="slime-dossier"
  >
    <SlimeCityArtwork
      :key="backdrop.key"
      class="scs-backdrop"
      :image-id="backdrop.id"
      :alt="backdrop.alt"
      fallback="▧"
      compact
    />
    <div class="scs-shade" aria-hidden="true"></div>

    <div class="scs-bar">
      <button
        type="button"
        class="scs-back"
        data-testid="slime-city-back"
        @click="lab.showCityMap()"
      >
        ← CITY MAP
      </button>
      <nav v-if="tabs.length > 1" class="scs-tabs" aria-label="District scenes">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="{ active: lab.cityScene === tab.id }"
          :aria-pressed="lab.cityScene === tab.id"
          :data-testid="'slime-scene-tab-' + tab.id"
          @click="lab.enterCity(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>
      <span class="scs-place">{{ placeLine }}</span>
    </div>

    <div
      v-if="choiceEvent"
      :key="lab.cityScene"
      class="scs-body"
      :data-testid="choiceEvent.testid"
      aria-live="polite"
    >
      <article class="scs-panel kr-scroll">
        <span class="scs-overline">{{ choiceEvent.overline }}</span>
        <h2>{{ choiceEvent.story.title }}</h2>
        <p class="scs-lede">{{ choiceEvent.story.scene }}</p>
      </article>
      <div class="scs-deck">
        <KrChoiceHand
          :choices="handOf(choiceEvent.story.choices)"
          :question="choiceEvent.question"
          :deal-key="lab.cityScene + ':' + choiceEvent.story.title"
          :testid-prefix="choiceEvent.prefix"
          @play="(choice) => choiceEvent?.play(choice.id)"
        />
      </div>
    </div>

    <div
      v-else-if="lab.cityScene === 'epilogue' && lab.finaleResult"
      class="scs-body"
      data-testid="slime-city-epilogue"
      aria-live="polite"
    >
      <article class="scs-panel kr-scroll">
        <span class="scs-overline">THE END · {{ lab.team.name }}</span>
        <h2>{{ lab.finaleResult.title }}</h2>
        <p class="scs-lede">{{ lab.finaleResult.scene }}</p>
        <p class="scs-lede">{{ lab.finaleResult.legacy }}</p>
        <p class="scs-overline">
          {{ lab.city.cleared.length }} CHAMPIONS ·
          {{ lab.city.contracts.length }} CONTRACTS ·
          {{ Object.keys(lab.city.crisisChoices).length }} CRISES
        </p>
      </article>
      <div class="scs-deck">
        <div class="scs-actions">
          <button
            type="button"
            class="scs-cta"
            data-testid="slime-finale-explore"
            title="Optional contracts and unchallenged rivals remain playable."
            @click="lab.dismissFinale()"
          >
            CONTINUE EXPLORING →
          </button>
          <button
            type="button"
            class="scs-cta scs-quiet"
            data-testid="slime-finale-restart"
            title="Start a fresh session-only overworld with this crew."
            @click="lab.resetCity()"
          >
            NEW CITY RUN
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="lab.cityScene === 'story' && lab.activeChapter"
      class="scs-body"
      data-testid="slime-city-story-mission"
    >
      <article class="scs-panel kr-scroll">
        <span class="scs-overline"
          >JOURNEY · CHAPTER {{ lab.campaignState.wins + 1 }}/5 ·
          {{ lab.district.name }}</span
        >
        <h2>{{ lab.activeChapter.title }}</h2>
        <p class="scs-lede">{{ lab.activeChapter.scene }}</p>
        <figure class="scs-portrait">
          <SlimeCityArtwork
            class="scs-portrait-art"
            :image-id="slimeArtId('crews', lab.activeChapter.foe)"
            :alt="teamName(lab.activeChapter.foe) + ' rival portrait'"
            fallback="✷"
            compact
          />
          <figcaption>
            <small>CREW CLASH</small>
            <strong>{{ teamName(lab.activeChapter.foe) }}</strong>
          </figcaption>
        </figure>
        <p v-if="!lab.campaignAtDestination" class="scs-hint">
          Follow the marked streets and resolve each street story to stage this
          battle. Your choices change its opening conditions.
        </p>
        <template v-else>
          <p
            v-if="lab.campaignEcho"
            class="scs-terms"
            data-testid="slime-city-campaign-echo"
          >
            {{ lab.campaignEcho.title }} ·
            {{ describeTerms(lab.campaignEcho.terms) }}
          </p>
          <p class="scs-terms" data-testid="slime-city-local-terms">
            CITY CONSEQUENCES ·
            {{ describeTerms(boutTerms(lab.city, lab.districtId)) }}
          </p>
        </template>
      </article>
      <div class="scs-deck">
        <button
          v-if="lab.campaignJourneyCurrent || lab.campaignAllianceCurrent"
          type="button"
          class="scs-cta"
          data-testid="slime-city-faction-journey-continue"
          @click="lab.showCampaign()"
        >
          {{
            lab.campaignAllianceCurrent
              ? 'CONTINUE ALLIANCE STORY · ' + lab.journeyDeckName.toUpperCase()
              : 'CONTINUE ' + lab.campaignStory.title.toUpperCase()
          }}
        </button>
        <KrChoiceHand
          v-else-if="lab.campaignAtDestination"
          :choices="missionHand"
          question="CHOOSE YOUR APPROACH · WITH STREET CHOICES"
          :deal-key="lab.activeTeam + ':' + lab.campaignState.wins"
          testid-prefix="slime-city-mission"
          @play="(choice) => playMission(choice.id)"
        >
          <template #art="{ choice }">
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', approachCrew(choice.id))"
              :alt="choice.label"
              fallback="✷"
              compact
            />
          </template>
        </KrChoiceHand>
        <div v-else class="scs-actions">
          <button
            v-if="!lab.here && lab.route"
            type="button"
            class="scs-cta"
            data-testid="slime-walk"
            @click="lab.walk()"
          >
            WALK {{ lab.route.street.toUpperCase() }} →
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="lab.cityScene === 'contract'" class="scs-body">
      <SlimeCityDistrictContract class="scs-contract" />
    </div>

    <div v-else class="scs-body">
      <article class="scs-panel kr-scroll">
        <span class="scs-overline"
          >DISTRICT ·
          {{ statusLabel(lab.districtStatus(lab.districtId)) }}</span
        >
        <h2>{{ lab.district.name }}</h2>
        <p class="scs-lede">{{ lab.plan.scene }}</p>
        <div
          v-if="!lab.here && lab.routeSteps.length"
          class="scs-route"
          data-testid="slime-city-route"
        >
          <span class="scs-overline"
            >WAYFINDER · {{ lab.routeSteps.length }}
            {{ lab.routeSteps.length === 1 ? 'STREET' : 'STREETS' }}</span
          >
          <strong>{{ routeLabel }}</strong>
        </div>
        <figure class="scs-portrait">
          <SlimeCityArtwork
            class="scs-portrait-art"
            :image-id="slimeArtId('crews', lab.plan.rival.team)"
            :alt="lab.plan.rival.name + ' rival portrait'"
            fallback="✷"
            compact
          />
          <figcaption>
            <small
              >{{ lab.plan.rival.title }} ·
              {{ teamName(lab.plan.rival.team) }} ·
              {{ lab.storyBoutLabel(lab.plan.rival.mode) }}</small
            >
            <strong>{{ lab.plan.rival.name }}</strong>
            <em>“{{ lab.plan.rival.taunt }}”</em>
          </figcaption>
        </figure>
        <p v-if="lab.here && chosenChoice" class="scs-decided">
          <span class="scs-overline">YOUR CALL</span>
          {{ chosenChoice.label }}: {{ chosenChoice.outcome }}
        </p>
        <p v-if="lab.here && lab.blocked" class="scs-gate">
          {{ lab.blocked }}
        </p>
        <p
          v-if="lab.here && lab.campaignLegacy"
          class="scs-terms"
          data-testid="slime-rival-legacy"
        >
          CREW LEGACY · {{ lab.campaignLegacy.echo.title }} ·
          {{ describeTerms(lab.campaignLegacy.echo.terms) }}
        </p>
      </article>
      <div class="scs-deck">
        <KrChoiceHand
          v-if="lab.here && !chosenChoice && !lab.gate"
          :choices="handOf(lab.plan.choices)"
          question="MAKE YOUR CALL BEFORE THE BOUT"
          :deal-key="'district:' + lab.districtId"
          testid-prefix="slime-choice"
          @play="(choice) => lab.choose(choice.id)"
        />
        <div class="scs-actions">
          <template v-if="lab.here">
            <button
              type="button"
              class="scs-cta"
              data-testid="slime-fight-rival"
              :disabled="!!lab.blocked"
              @click="lab.fightRival()"
            >
              FIGHT {{ lab.plan.rival.name.toUpperCase() }} →
            </button>
            <button
              type="button"
              class="scs-cta scs-quiet"
              @click="lab.startDistrictMatch()"
            >
              QUICK MATCH
            </button>
          </template>
          <button
            v-else-if="lab.route"
            type="button"
            class="scs-cta"
            data-testid="slime-walk"
            @click="lab.walk()"
          >
            WALK {{ lab.route.street.toUpperCase() }} ·
            {{ nextStopName.toUpperCase() }} →
          </button>
          <span v-else class="scs-gate"
            >No route available. Choose a connected district.</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  boutTerms,
  storyMissionTerms,
  type DistrictId,
  type StreetChoice,
  type StreetStory,
} from '~/utils/slimeCity/city'
import { describeTerms } from '~/utils/slimeCity/campaign'
import { clashTermsLabel } from '~/utils/slimeCity/clashBouts'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { useSlimeCityStore, type CityScreen } from '~/stores/slimeCity'
import type { TeamId } from '~/utils/slimeCity/prototypes'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

const lab = useSlimeCityStore()

const CHOICE_ICONS = ['✦', '⚑', '✷']

function teamName(id: string): string {
  return lab.teams.find((t) => t.id === id)?.name ?? id
}
function districtName(id: string | null | undefined): string {
  return lab.districts.find((d) => d.id === id)?.name ?? ''
}
function statusLabel(status: string): string {
  return (
    {
      here: 'you are here',
      cleared: 'champion beaten',
      locked: 'gate closed',
      reachable: 'one street away',
      far: 'no direct street',
    }[status] ?? status
  )
}
function teaser(text: string): string {
  const cut = text.search(/[.(]/)
  return cut > 0 ? text.slice(0, cut + (text[cut] === '.' ? 1 : 0)) : text
}
function handOf(choices: readonly StreetChoice[]): KrHandChoice[] {
  return choices.map((choice, index) => ({
    id: choice.id,
    label: choice.label,
    hint: teaser(choice.outcome),
    details: [choice.outcome],
    icon: CHOICE_ICONS[index % CHOICE_ICONS.length],
  }))
}

const chosenChoice = computed(() =>
  lab.plan.choices.find((c) => c.id === lab.city.choices[lab.districtId]),
)
const nextStopName = computed(() => districtName(lab.route?.to))
const routeLabel = computed(() =>
  [
    districtName(lab.city.location),
    ...lab.routeSteps.map(({ to }) => districtName(to)),
  ].join(' › '),
)

const choiceEvent = computed<{
  testid: string
  overline: string
  question: string
  prefix: string
  story: StreetStory
  play: (id: string) => void
} | null>(() => {
  const here = districtName(lab.city.location).toUpperCase()
  if (lab.cityScene === 'aftermath' && lab.aftermathEvent)
    return {
      testid: 'slime-champion-aftermath',
      overline:
        'CHAMPIONSHIP AFTERMATH · ' +
        districtName(lab.city.pendingAftermath).toUpperCase(),
      question: 'WHAT BECOMES OF THE BEATEN CHAMPION?',
      prefix: 'slime-aftermath',
      story: lab.aftermathEvent,
      play: lab.chooseAftermath,
    }
  if (lab.cityScene === 'crisis' && lab.crisisEvent)
    return {
      testid: 'slime-city-crisis',
      overline:
        'CITYWIDE CRISIS · ACT ' +
        (Object.keys(lab.city.crisisChoices).length + 1) +
        '/3 · ' +
        here,
      question: 'THE WHOLE CITY IS WATCHING',
      prefix: 'slime-crisis',
      story: lab.crisisEvent,
      play: lab.chooseCrisis,
    }
  if (lab.cityScene === 'street' && lab.streetEvent)
    return {
      testid: 'slime-street-encounter',
      overline:
        'STREET STORY · ' + (lab.city.pendingStreet ?? '').toUpperCase(),
      question: 'WHAT DO YOU DO?',
      prefix: 'slime-street-choice',
      story: lab.streetEvent,
      play: lab.chooseStreet,
    }
  if (lab.cityScene === 'finale' && lab.finaleEvent)
    return {
      testid: 'slime-city-finale',
      overline: 'GRAND PIT · CITY FINALE',
      question: 'DECIDE THE FATE OF THE PIT',
      prefix: 'slime-finale',
      story: lab.finaleEvent,
      play: lab.chooseFinale,
    }
  return null
})

const tabs = computed<{ id: CityScreen; label: string }[]>(() => {
  if (lab.cityEvent) return []
  return [
    ...(lab.storyHere ? [{ id: 'story' as const, label: 'JOURNEY' }] : []),
    { id: 'district' as const, label: 'RIVAL' },
    ...(lab.contractHere ? [{ id: 'contract' as const, label: 'ENCORE' }] : []),
  ]
})

const placeLine = computed(() =>
  lab.cityEvent
    ? districtName(lab.city.location).toUpperCase() + ' · TONIGHT'
    : lab.district.name.toUpperCase() +
      ' · ' +
      statusLabel(lab.districtStatus(lab.districtId)).toUpperCase(),
)
const regionLabel = computed(() =>
  choiceEvent.value
    ? choiceEvent.value.story.title
    : lab.district.name + ' scene',
)

function storyArt(key: string): number | null {
  return slimeArtId('story', lab.activeTeam + '/' + key)
}
const backdrop = computed<{ key: string; id: number | null; alt: string }>(
  () => {
    const scene = lab.cityScene
    if (scene === 'finale' || scene === 'epilogue')
      return {
        key: 'crew-' + lab.activeTeam,
        id: slimeArtId('crews', lab.activeTeam),
        alt: lab.team.name + ' champion painting',
      }
    const place: DistrictId =
      scene === 'aftermath' && lab.city.pendingAftermath
        ? lab.city.pendingAftermath
        : scene === 'crisis' || scene === 'street'
          ? lab.city.location
          : lab.districtId
    const chapterArt =
      scene === 'story' && lab.activeChapter
        ? storyArt(lab.campaignState.wins + 1 + '/scene')
        : null
    return {
      key: chapterArt ? 'story-' + chapterArt : 'district-' + place,
      id: chapterArt ?? slimeArtId('districts', place),
      alt: chapterArt
        ? (lab.activeChapter?.title ?? '') + ' illustrated chapter scene'
        : districtName(place) + ' panoramic district artwork',
    }
  },
)

function approachCrew(id: string): TeamId {
  return id === 'cunning' && lab.activeChapter
    ? lab.activeChapter.foe
    : lab.activeTeam
}
const missionHand = computed<KrHandChoice[]>(() =>
  (lab.activeChapter?.choices ?? []).map((choice) => ({
    id: choice.id,
    label: choice.label,
    chip: clashTermsLabel(
      lab.campaignPreviewTerms(
        storyMissionTerms(lab.city, lab.districtId, choice.terms),
      ),
      lab.journeyFormat,
    ),
    badge: choice.id === 'conviction' ? 'Conviction' : 'Cunning',
  })),
)
function playMission(id: string): void {
  const approach = lab.activeChapter?.choices.find((option) => option.id === id)
  if (approach) lab.startCampaignBattle(approach.id)
}
</script>

<style scoped>
.scs {
  --scs-accent: #d5ff62;
  --scs-ink: #f4f4ec;
  position: relative;
  isolation: isolate;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  container: scs / inline-size;
  color: var(--scs-ink);
  background: #0b111b;
}
.scs-street,
.scs-aftermath,
.scs-story {
  --scs-accent: #f0b4ff;
}
.scs-crisis {
  --scs-accent: #ffb27a;
}
.scs-finale,
.scs-epilogue {
  --scs-accent: #ffd45c;
}
.scs .scs-backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
}
.scs .scs-backdrop :deep(img) {
  object-position: center 35%;
}
.scs-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(0deg, #060a10f2 0%, #060a10a8 38%, transparent 70%),
    linear-gradient(180deg, #060a10cc 0%, transparent 18%);
}
.scs-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  padding: clamp(0.5rem, 1.6cqw, 1rem) clamp(0.6rem, 2cqw, 1.4rem);
}
.scs-back {
  min-height: 2.75rem;
  padding: 0.55rem 1.1rem;
  border: 2px solid #d5ff62;
  border-radius: 0.55rem;
  background: #0b1219d9;
  color: #e8ffb0;
  font-size: 0.8rem;
  font-weight: 1000;
  letter-spacing: 0.14em;
  box-shadow: 0 0 18px #c5ff5933;
  backdrop-filter: blur(6px);
}
.scs-back:hover,
.scs-back:focus-visible {
  background: #d5ff62;
  color: #142016;
  outline: none;
}
.scs-tabs {
  display: flex;
  gap: 0.3rem;
  padding: 0.25rem;
  border: 1px solid #ffffff2e;
  border-radius: 0.6rem;
  background: #0b1219cc;
  backdrop-filter: blur(6px);
}
.scs-tabs button {
  min-height: 2.25rem;
  padding: 0.4rem 0.85rem;
  border-radius: 0.42rem;
  color: #d4dbe6;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}
.scs-tabs button.active {
  background: var(--scs-accent);
  color: #141a12;
}
.scs-place {
  margin-left: auto;
  color: #e9eef6;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-shadow: 0 2px 8px #000;
}
.scs-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  align-items: end;
  gap: clamp(0.5rem, 1.5cqw, 1.2rem);
  min-height: 0;
  padding: 0 clamp(0.6rem, 2cqw, 1.6rem) clamp(0.6rem, 2cqw, 1.4rem);
}
.scs-panel {
  align-self: end;
  max-height: 100%;
  min-height: 0;
  max-width: 46rem;
  padding: clamp(0.85rem, 2.2cqw, 1.6rem);
  border: 1px solid #ffffff24;
  border-left: 4px solid var(--scs-accent);
  border-radius: 0.9rem;
  background: #080d15d9;
  box-shadow: 0 18px 48px #000a;
  backdrop-filter: blur(6px);
}
.scs-overline {
  display: block;
  color: var(--scs-accent);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.scs-panel h2 {
  margin: 0.35rem 0 0.6rem;
  font-size: clamp(1.7rem, 4.6cqw, 3.4rem);
  font-weight: 1000;
  font-style: italic;
  line-height: 0.95;
  letter-spacing: -0.035em;
  text-transform: uppercase;
  text-shadow: 0 3px 24px #000;
}
.scs-lede {
  margin: 0 0 0.75rem;
  color: #e6ecf4;
  font-size: clamp(0.98rem, 1.6cqw, 1.2rem);
  line-height: 1.5;
}
.scs-route {
  display: grid;
  gap: 0.25rem;
  margin: 0.25rem 0 0.9rem;
  padding: 0.6rem 0.8rem;
  border-left: 3px solid #ffdc83;
  background: #ffdc8317;
}
.scs-route .scs-overline {
  color: #ffdc83;
}
.scs-route strong {
  color: #fff1c6;
  font-size: 0.95rem;
}
.scs-portrait {
  display: grid;
  grid-template-columns: clamp(4.5rem, 12cqw, 6.5rem) minmax(0, 1fr);
  align-items: center;
  gap: 0.85rem;
  margin: 0.5rem 0 0.75rem;
}
.scs-portrait .scs-portrait-art {
  aspect-ratio: 3 / 4;
  height: auto;
  border: 1px solid #ffffff3d;
  border-radius: 0.6rem;
}
.scs-portrait figcaption {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}
.scs-portrait small {
  color: #c8d2de;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.scs-portrait strong {
  color: #ffd34d;
  font-size: clamp(1.1rem, 2.2cqw, 1.5rem);
  font-weight: 1000;
  line-height: 1.05;
}
.scs-portrait em {
  color: #e7f9bc;
  font-size: 0.95rem;
}
.scs-hint,
.scs-decided {
  margin: 0.5rem 0 0;
  color: #fee5aa;
  font-size: 0.95rem;
  line-height: 1.45;
}
.scs-decided {
  color: #e7f9bc;
}
.scs-terms {
  margin: 0.4rem 0 0;
  color: #d9fbb3;
  font-size: 0.85rem;
  font-weight: 750;
}
.scs-gate {
  margin: 0.5rem 0 0;
  color: #ffb27a;
  font-size: 0.9rem;
  font-weight: 750;
}
.scs-deck {
  --hand-accent: var(--scs-accent);
  --hand-accent-2: #c5ff59;
  --hand-band: #070b12;
  --hand-band-ink: #f4f4ec;
  --hand-card-max: 10.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.7rem;
  min-width: 0;
}
.scs-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}
.scs-actions:empty {
  display: none;
}
.scs-cta {
  min-height: 3.25rem;
  padding: 0.8rem 1.5rem;
  border: 2px solid #c8f960;
  border-radius: 0.6rem;
  background: #c8f960;
  color: #142016;
  font-size: clamp(0.85rem, 1.4cqw, 1.05rem);
  font-weight: 1000;
  letter-spacing: 0.1em;
  box-shadow: 0 0 28px #c5ff5955;
  transition:
    transform 0.12s,
    box-shadow 0.12s;
}
.scs-cta:hover:not(:disabled),
.scs-cta:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 0 36px #c5ff5999;
  outline: none;
}
.scs-cta:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.scs-cta.scs-quiet {
  background: #0b1219d9;
  color: #e7f9bc;
  box-shadow: none;
  backdrop-filter: blur(6px);
}
.scs-contract {
  align-self: end;
  max-width: 52rem;
}
@container scs (min-width: 900px) {
  .scs-body {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .scs-deck {
    align-self: end;
  }
  .scs-contract {
    grid-column: 1 / -1;
  }
}
@container scs (max-width: 600px) {
  .scs-place {
    display: none;
  }
  .scs-tabs {
    flex: 1;
  }
  .scs-tabs button {
    flex: 1;
    padding-inline: 0.4rem;
    font-size: 0.64rem;
  }
  .scs-deck {
    --hand-card-max: 7rem;
  }
  .scs-actions .scs-cta {
    flex: 1 1 auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  .scs-cta {
    transition: none;
  }
}
</style>
