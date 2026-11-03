<template>
  <section
    class="sc-stage sc-campaign"
    :class="'crew-' + lab.activeTeam"
    aria-label="Faction story mode"
    data-testid="slime-faction-campaign"
  >
    <SlimeCityArtwork
      :key="backdrop.key"
      class="campaign-backdrop"
      :image-id="backdrop.id"
      :alt="backdrop.alt"
      :fallback="lab.team.insignia"
      compact
      :data-testid="backdrop.testid ?? undefined"
    />
    <div class="campaign-shade" aria-hidden="true"></div>

    <div class="campaign-strip">
      <div class="campaign-title" :title="lab.campaignStory.principle">
        <span class="campaign-overline"
          >FACTION STORY · CAMPAIGN
          {{ String(lab.campaignState.wins + 1).padStart(2, '0') }} / 06</span
        >
        <h2>{{ lab.campaignStory.title }}</h2>
      </div>
      <ol class="campaign-track" aria-label="Five rival chapters">
        <li
          v-for="(chapter, index) in lab.campaignStory.chapters"
          :key="chapter.foe"
          class="campaign-step"
          :class="{
            cleared: index < lab.campaignState.wins,
            current: index === lab.campaignState.wins,
          }"
          :aria-current="index === lab.campaignState.wins ? 'step' : undefined"
          :title="
            teamName(chapter.foe) +
            ' · ' +
            (index < lab.campaignState.wins
              ? 'DEFEATED'
              : index === lab.campaignState.wins
                ? 'NEXT BATTLE'
                : 'LOCKED')
          "
          :data-testid="'slime-chapter-' + index"
        >
          <SlimeCityArtwork
            class="campaign-step-art"
            :image-id="slimeArtId('crews', chapter.foe)"
            :alt="teamName(chapter.foe) + ' rival portrait'"
            :fallback="String(index + 1)"
            compact
          />
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
        </li>
      </ol>
      <div
        class="campaign-stamp"
        :title="
          lab.campaignState.losses +
          ' campaign losses. Defeat retries are unlimited. Account-saved story; no real-money rewards.'
        "
      >
        <b>{{ lab.campaignState.wins }}/5</b>
        <small>VICTORIES</small>
      </div>
    </div>

    <div
      v-if="aftermathShown"
      class="campaign-scene"
      :class="lab.campaignAftermath?.result === 'player' ? 'won' : 'lost'"
    >
      <article class="campaign-panel kr-scroll" aria-live="polite">
        <div
          v-if="lab.campaignAftermath"
          class="campaign-rival-verdict"
          data-testid="slime-campaign-rival-verdict"
        >
          <span class="campaign-overline">
            CHAPTER {{ lab.campaignAftermath.chapterIndex + 1 }} ·
            {{ lab.campaignAftermath.chapterTitle }}
            <template v-if="lab.campaignAftermath.approach">
              · {{ lab.campaignAftermath.approach.toUpperCase() }}
            </template>
          </span>
          <h3>
            {{
              lab.campaignAftermath.result === 'player'
                ? 'AFTERMATH · VICTORY'
                : 'AFTERMATH · DEFEAT'
            }}
          </h3>
          <div class="campaign-voice rival">
            <SlimeCityArtwork
              class="campaign-voice-portrait"
              :image-id="slimeArtId('crews', lab.campaignAftermath.foe)"
              :alt="teamName(lab.campaignAftermath.foe) + ' rival portrait'"
              :fallback="crewInsignia(lab.campaignAftermath.foe)"
              compact
            />
            <div>
              <small>{{ lab.campaignAftermath.rivalSpeaker }}</small>
              <p>“{{ lab.campaignAftermath.rivalLine }}”</p>
            </div>
          </div>
          <div
            v-if="lab.campaignAftermath.playerLine"
            class="campaign-voice player"
            data-testid="slime-campaign-player-reflection"
          >
            <SlimeCityArtwork
              class="campaign-voice-portrait"
              :image-id="slimeArtId('crews', lab.activeTeam)"
              :alt="lab.team.name + ' leader portrait'"
              :fallback="lab.team.insignia"
              compact
            />
            <div>
              <small>{{ lab.campaignAftermath.playerSpeaker }}</small>
              <p>“{{ lab.campaignAftermath.playerLine }}”</p>
            </div>
          </div>
        </div>
        <div
          v-if="lab.campaignState.lastScene"
          class="campaign-recap"
          data-testid="slime-campaign-recap"
        >
          <strong>{{
            lab.campaignState.lastResult === 'player'
              ? 'LAST VICTORY'
              : lab.campaignState.lastResult === 'enemy'
                ? 'LAST DEFEAT'
                : 'LAST DRAW'
          }}</strong>
          <p>{{ lab.campaignState.lastScene }}</p>
        </div>
      </article>
      <div class="campaign-deck">
        <button
          type="button"
          class="campaign-cta"
          data-testid="slime-campaign-continue"
          @click="lab.continueCampaign()"
        >
          {{
            lab.campaignFinale
              ? 'SEE THE ENDING →'
              : lab.campaignState.lastResult === 'player'
                ? 'NEXT CHAPTER →'
                : 'TRY AGAIN →'
          }}
        </button>
      </div>
    </div>

    <div
      v-else-if="lab.campaignFinale"
      class="campaign-scene"
      data-testid="slime-campaign-finale"
      aria-live="polite"
    >
      <article class="campaign-panel kr-scroll">
        <span class="campaign-overline"
          >STORY COMPLETE / 5 OF 5 RIVALS DEFEATED</span
        >
        <h3>{{ lab.campaignStory.title }}: THE END</h3>
        <p class="campaign-lede">{{ lab.campaignFinale }}</p>
        <small class="campaign-note"
          >All six campaigns have independent playtest progress. Story wins
          grant no account Meat, XP or pack cards.</small
        >
      </article>
      <div v-if="hasAftermath" class="campaign-deck">
        <button
          type="button"
          class="campaign-cta campaign-quiet"
          data-testid="slime-campaign-last-bout"
          @click="lab.showCampaignAftermath()"
        >
          LAST BOUT
        </button>
      </div>
    </div>

    <div v-else-if="lab.activeChapter" class="campaign-scene">
      <article class="campaign-panel kr-scroll">
        <span class="campaign-overline">
          CHAPTER {{ lab.campaignState.wins + 1 }} / 5 · VERSUS
          {{ teamName(lab.activeChapter.foe).toUpperCase() }}
        </span>
        <h3>{{ lab.activeChapter.title }}</h3>
        <p v-if="lab.campaignState.wins === 0" class="campaign-prologue">
          {{ lab.campaignStory.prologue }}
        </p>
        <p class="campaign-lede">{{ lab.activeChapter.scene }}</p>
        <div
          v-if="lab.campaignConversation"
          class="campaign-exchange"
          aria-label="Rival confrontation"
          data-testid="slime-campaign-conversation"
        >
          <div class="campaign-voice rival">
            <SlimeCityArtwork
              class="campaign-voice-portrait"
              :image-id="
                slimeArtId('crews', lab.campaignConversation.rivalTeam)
              "
              :alt="teamName(lab.campaignConversation.rivalTeam) + ' portrait'"
              :fallback="crewInsignia(lab.campaignConversation.rivalTeam)"
              compact
            />
            <div>
              <small
                >THE RIVAL · {{ lab.campaignConversation.rivalSpeaker }}</small
              >
              <p>{{ lab.campaignConversation.rivalLine }}</p>
              <p
                v-if="lab.campaignConversation.rememberedChoice"
                class="campaign-memory"
                data-testid="slime-campaign-memory"
              >
                {{ lab.campaignConversation.rememberedChoice }}
              </p>
            </div>
          </div>
          <div class="campaign-voice player">
            <SlimeCityArtwork
              class="campaign-voice-portrait"
              :image-id="slimeArtId('crews', lab.activeTeam)"
              :alt="lab.team.name + ' leader portrait'"
              :fallback="lab.team.insignia"
              compact
            />
            <div>
              <small
                >YOUR CREW · {{ lab.campaignConversation.playerSpeaker }}</small
              >
              <p>{{ lab.campaignConversation.playerLine }}</p>
              <p
                v-if="lab.campaignConversation.retryLine"
                class="campaign-memory"
                data-testid="slime-campaign-rematch"
              >
                {{ lab.campaignConversation.retryLine }}
              </p>
            </div>
          </div>
        </div>
        <div
          v-if="lab.campaignEcho"
          class="campaign-recap"
          data-testid="slime-campaign-echo"
        >
          <strong>{{ lab.campaignEcho.speaker }}</strong>
          <p>“{{ lab.campaignEcho.voice }}”</p>
          <small>{{ lab.campaignEcho.story }}</small>
        </div>
      </article>
      <div class="campaign-deck" :class="'tone-' + lab.team.color">
        <div
          v-if="lab.campaignFavors.length"
          class="campaign-favors"
          role="group"
          aria-label="Choose earned story support"
          data-testid="slime-campaign-favors"
        >
          <span class="campaign-overline">EARNED SUPPORT · NEXT FIGHT</span>
          <div class="campaign-favor-row">
            <button
              v-for="favor in lab.campaignFavors"
              :key="favor.chapterIndex"
              type="button"
              class="campaign-favor"
              :class="{
                active: favor.chapterIndex === lab.campaignFavorIndex,
              }"
              :aria-pressed="favor.chapterIndex === lab.campaignFavorIndex"
              :title="
                'Chapter ' +
                (favor.chapterIndex + 1) +
                ' · ' +
                favor.choice +
                ' · ' +
                describeTerms(favor.echo.terms)
              "
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
              <strong>{{ favor.echo.title }}</strong>
            </button>
          </div>
        </div>
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
        <div class="campaign-actions">
          <button
            v-if="hasAftermath"
            type="button"
            class="campaign-cta campaign-quiet"
            data-testid="slime-campaign-last-bout"
            @click="lab.showCampaignAftermath()"
          >
            LAST BOUT
          </button>
          <button
            v-if="lab.campaignDistrict"
            type="button"
            class="campaign-cta"
            data-testid="slime-find-campaign-district"
            @click="lab.findCampaignBattle()"
          >
            FOLLOW THE STORY · {{ nextDistrictName.toUpperCase() }} →
          </button>
        </div>
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
const hasAftermath = computed(
  () => !!lab.campaignAftermath || !!lab.campaignState.lastScene,
)
const aftermathShown = computed(
  () => lab.campaignScreen === 'aftermath' && hasAftermath.value,
)
// Story plates (conductor slime-city BLACKOUT-STORY-ROUND-2): the opening, each chapter's scene, the
// approach the last victory used (or the defeat), and the ending the decisions earned. Each screen
// paints its own plate across the whole stage; unrendered plates fall back to the crew's art.
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
const backdrop = computed<{
  key: string
  id: number | null
  alt: string
  testid: string | null
}>(() => {
  const plate = (id: number | null, alt: string, testid: string) =>
    id ? { key: 'plate-' + id, id, alt, testid } : null
  const chosen = aftermathShown.value
    ? plate(
        recapArtId.value,
        'Illustrated result of the last battle',
        'slime-campaign-recap-art',
      )
    : lab.campaignFinale
      ? plate(
          endingArtId.value,
          lab.campaignStory.title + ' illustrated ending',
          'slime-campaign-ending-art',
        )
      : plate(
          chapterArtId.value,
          (lab.activeChapter?.title ?? '') + ' illustrated chapter scene',
          'slime-campaign-chapter-art',
        )
  return (
    chosen ?? {
      key: 'hero-' + lab.activeTeam,
      id: heroArtId.value,
      alt: lab.team.name + ' illustrated campaign poster',
      testid: null,
    }
  )
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
.sc-stage.sc-campaign {
  --campaign-accent: #c5ff59;
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  container: campaign / inline-size;
  background: #11151f;
  color: #f4f4ec;
}
.sc-campaign .campaign-backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
}
.sc-campaign .campaign-backdrop :deep(img) {
  object-position: center 38%;
}
.campaign-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(0deg, #060a10f2 0%, #060a10a8 40%, transparent 72%),
    linear-gradient(180deg, #060a10e0 0%, #060a1066 16%, transparent 30%);
}
.sc-campaign.crew-bloodfairies {
  --campaign-accent: #f869aa;
}
.sc-campaign.crew-ironjaw {
  --campaign-accent: #e8b660;
}
.sc-campaign.crew-riot {
  --campaign-accent: #fe8759;
}
.sc-campaign.crew-undertow {
  --campaign-accent: #6ce5b8;
}
.sc-campaign.crew-exchange {
  --campaign-accent: #f2cf80;
}
.campaign-strip {
  display: flex;
  align-items: center;
  gap: clamp(0.6rem, 2cqw, 1.4rem);
  padding: clamp(0.5rem, 1.6cqw, 1rem) clamp(0.6rem, 2cqw, 1.4rem);
}
.campaign-title {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
  flex: 1 1 auto;
}
.campaign-overline {
  display: block;
  color: var(--campaign-accent);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.campaign-title h2 {
  margin: 0;
  overflow: hidden;
  font-size: clamp(1.1rem, 2.6cqw, 1.9rem);
  font-weight: 1000;
  font-style: italic;
  line-height: 1;
  letter-spacing: -0.035em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  text-shadow: 0 2px 15px #080d1c;
}
.campaign-track {
  display: flex;
  gap: 0.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.campaign-step {
  position: relative;
  width: clamp(2.4rem, 5cqw, 3.4rem);
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border: 2px solid #ffffff3d;
  border-radius: 0.45rem;
  opacity: 0.55;
  filter: grayscale(0.8);
}
.campaign-step.current {
  border-color: var(--campaign-accent);
  opacity: 1;
  filter: none;
  box-shadow: 0 0 16px
    color-mix(in srgb, var(--campaign-accent) 55%, transparent);
}
.campaign-step.cleared {
  border-color: #70ce9d;
  opacity: 0.9;
  filter: none;
}
.campaign-step .campaign-step-art {
  position: absolute;
  inset: 0;
}
.campaign-step span {
  position: absolute;
  inset: auto 0 0;
  padding: 0.1rem;
  background: #060a10cc;
  font-size: 0.55rem;
  font-weight: 900;
  text-align: center;
}
.campaign-stamp {
  display: grid;
  justify-items: center;
  flex: none;
  padding: 0.45rem 0.7rem;
  border: 2px solid #ffffffa8;
  border-radius: 0.6rem;
  background: #0a142ecc;
}
.campaign-stamp b {
  font-size: 1.3rem;
  line-height: 1;
}
.campaign-stamp small {
  font-size: 0.5rem;
  letter-spacing: 0.12em;
}
.campaign-scene {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  align-items: end;
  gap: clamp(0.5rem, 1.5cqw, 1.2rem);
  min-height: 0;
  padding: 0 clamp(0.6rem, 2cqw, 1.6rem) clamp(0.6rem, 2cqw, 1.4rem);
}
.campaign-panel {
  align-self: end;
  max-height: 100%;
  min-height: 0;
  max-width: 46rem;
  padding: clamp(0.85rem, 2.2cqw, 1.6rem);
  border: 1px solid #ffffff24;
  border-left: 4px solid var(--campaign-accent);
  border-radius: 0.9rem;
  background: #080d15d9;
  box-shadow: 0 18px 48px #000a;
  backdrop-filter: blur(6px);
}
.campaign-panel h3 {
  margin: 0.35rem 0 0.6rem;
  font-size: clamp(1.7rem, 4.6cqw, 3.4rem);
  font-weight: 1000;
  font-style: italic;
  line-height: 0.95;
  letter-spacing: -0.035em;
  text-transform: uppercase;
  text-shadow: 0 3px 24px #000;
}
.campaign-lede,
.campaign-prologue {
  margin: 0 0 0.8rem;
  font-size: clamp(0.98rem, 1.6cqw, 1.2rem);
  line-height: 1.5;
  color: #e6ecf4;
}
.campaign-prologue {
  color: #fff1ad;
  font-style: italic;
}
.campaign-note {
  color: #c3d5c2;
  font-size: 0.78rem;
}
.campaign-exchange {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 0.6rem;
  margin: 0.4rem 0 0.8rem;
}
.campaign-rival-verdict {
  display: grid;
  gap: 0.6rem;
}
.campaign-voice {
  display: grid;
  grid-template-columns: clamp(3.8rem, 9cqw, 5rem) minmax(0, 1fr);
  align-items: start;
  gap: 0.7rem;
  padding: 0.6rem;
  border: 1px solid #54727a;
  border-radius: 0.75rem;
  background: #182b36cc;
}
.campaign-voice.player {
  border-color: #9ab88b;
  background: #26372fcc;
}
.campaign-voice .campaign-voice-portrait {
  aspect-ratio: 3 / 4;
  height: auto;
  border-radius: 0.5rem;
}
.campaign-voice small {
  color: #c9e5d4;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}
.campaign-voice p {
  margin: 0.25rem 0 0;
  font-size: clamp(0.95rem, 1.5cqw, 1.1rem);
  line-height: 1.45;
}
.campaign-voice .campaign-memory {
  padding-top: 0.4rem;
  border-top: 1px solid #ffffff28;
  color: #e9dca9;
}
.campaign-recap {
  display: grid;
  gap: 0.3rem;
  margin-top: 0.8rem;
  padding: 0.75rem 0.9rem;
  border-left: 3px solid #c1df93;
  background: #202e38cc;
}
.campaign-recap strong {
  color: #cfedab;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}
.campaign-recap p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.45;
}
.campaign-recap small {
  color: #ced9d6;
  font-size: 0.8rem;
}
.campaign-scene.lost .campaign-panel {
  border-left-color: #ef9ea4;
}
.campaign-deck {
  --tone: #c5ff59;
  --hand-accent: var(--tone);
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
.campaign-deck.tone-red {
  --tone: #fe6657;
}
.campaign-deck.tone-blue {
  --tone: #6fc8ff;
}
.campaign-deck.tone-purple {
  --tone: #d38cff;
}
.campaign-deck.tone-green {
  --tone: #c7fa62;
}
.campaign-deck.tone-gold {
  --tone: #f7c968;
}
.campaign-favors {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}
.campaign-favor-row {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  scrollbar-width: thin;
}
.campaign-favor {
  display: flex;
  align-items: center;
  flex: none;
  gap: 0.5rem;
  max-width: 14rem;
  min-height: 3.25rem;
  padding: 0.3rem 0.7rem 0.3rem 0.3rem;
  border: 2px solid #5a7077;
  border-radius: 0.6rem;
  background: #192633d9;
  color: #f4f4ec;
  text-align: left;
}
.campaign-favor.active {
  border-color: #f3e2a2;
  background: #354038e6;
  box-shadow: 0 0 16px #f3e2a255;
}
.campaign-favor:focus-visible {
  outline: 3px solid #f5efbf;
  outline-offset: 2px;
}
.campaign-favor .campaign-favor-art {
  flex: 0 0 2.4rem;
  width: 2.4rem;
  height: 2.8rem;
  border-radius: 0.35rem;
}
.campaign-favor strong {
  overflow: hidden;
  font-size: 0.78rem;
  line-height: 1.2;
}
.campaign-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.6rem;
}
.campaign-cta {
  align-self: flex-end;
  min-height: 3.25rem;
  padding: 0.8rem 1.4rem;
  border: 2px solid var(--campaign-accent);
  border-radius: 0.6rem;
  background: var(--campaign-accent);
  color: #121812;
  font-size: clamp(0.82rem, 1.4cqw, 1.02rem);
  font-weight: 1000;
  letter-spacing: 0.1em;
  box-shadow: 0 0 28px
    color-mix(in srgb, var(--campaign-accent) 40%, transparent);
}
.campaign-cta:hover,
.campaign-cta:focus-visible {
  outline: none;
  box-shadow: 0 0 38px
    color-mix(in srgb, var(--campaign-accent) 70%, transparent);
}
.campaign-cta.campaign-quiet {
  background: #0b1219d9;
  color: #f4f4ec;
  box-shadow: none;
}
@container campaign (min-width: 900px) {
  .campaign-scene {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
}
@container campaign (max-width: 600px) {
  .campaign-strip {
    flex-wrap: wrap;
    row-gap: 0.4rem;
  }
  .campaign-title {
    flex-basis: calc(100% - 5rem);
  }
  .campaign-track {
    order: 3;
    flex: 1 1 100%;
    justify-content: space-between;
  }
  .campaign-step {
    width: auto;
    flex: 1 1 0;
    aspect-ratio: auto;
    height: 2.2rem;
  }
  .campaign-deck {
    --hand-card-max: 7rem;
  }
  .campaign-actions .campaign-cta {
    flex: 1 1 auto;
  }
}
</style>
