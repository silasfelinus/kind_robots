<template>
  <section
    class="sc-stage sc-campaign"
    :class="'crew-' + lab.activeTeam"
    aria-label="Slime City journey"
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
          >JOURNEY · CHAPTER
          {{ String(lab.campaignState.wins + 1).padStart(2, '0') }} / 05</span
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
        class="campaign-format"
        role="note"
        aria-label="Story bout format"
        data-testid="slime-story-format"
      >
        <SlimeCityCrewSelect label="Journey crew" />
        <button
          type="button"
          :aria-pressed="lab.journeyFormat === 'solo'"
          data-testid="slime-journey-solo"
          @click="lab.setJourneyFormat('solo')"
        >
          SOLO
        </button>
        <button
          type="button"
          :aria-pressed="lab.journeyFormat === 'alliance'"
          data-testid="slime-journey-alliance"
          @click="lab.setJourneyFormat('alliance')"
        >
          ALLIANCE
        </button>
        <select
          v-if="lab.journeyFormat === 'alliance'"
          :value="lab.journeyDeckId ?? ''"
          aria-label="Choose your saved alliance deck"
          data-testid="slime-journey-deck-select"
          @change="onJourneyDeckChange"
        >
          <option value="">Current alliance</option>
          <option
            v-for="deck in lab.library.filter(
              (item) =>
                item.general === lab.activeTeam &&
                lab.libraryDeckReady(item.id),
            )"
            :key="deck.id"
            :value="deck.id"
          >
            {{ deck.name }}
          </option>
        </select>
        <button
          type="button"
          :title="'Edit ' + lab.journeyDeckName"
          data-testid="slime-story-deck"
          @click="lab.showJourneyDeck()"
        >
          EDIT DECK
        </button>
        <button
          type="button"
          title="Explore the same journey through the city map"
          data-testid="slime-journey-map"
          @click="lab.showCityMap()"
        >
          CITY MAP
        </button>
        <button
          type="button"
          :aria-pressed="lab.endingsOpen"
          title="Every ending you have found, and a scrapbook page for each finished run"
          data-testid="slime-endings-toggle"
          @click="lab.endingsOpen = !lab.endingsOpen"
        >
          ENDINGS {{ lab.endingsFound.length }}
        </button>
      </div>
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

    <SlimeCityEndings v-if="lab.endingsOpen" />

    <div
      v-else-if="aftermathShown"
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
          v-if="lab.campaignAllianceAftermath"
          class="campaign-recap"
          data-testid="slime-alliance-aftermath"
        >
          <strong>WHAT YOUR ALLY CHANGED</strong>
          <p>{{ lab.campaignAllianceAftermath }}</p>
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
      <div
        v-if="lab.campaignRewardChoices"
        class="campaign-deck campaign-card-draft"
      >
        <span class="campaign-overline"
          >A SPOIL FROM THE FIGHT · CHOOSE ONE</span
        >
        <KrChoiceHand
          :choices="cardRewardChoices"
          question="KEEP ONE CARD FOR YOUR STORY DECK"
          :deal-key="lab.activeTeam + ':reward:' + lab.campaignState.wins"
          testid-prefix="slime-campaign-card-reward"
          @play="pickStoryReward"
        >
          <template #art="{ choice }">
            <SlimeCityClashCardFace :card-id="choice.id" />
          </template>
        </KrChoiceHand>
      </div>
      <div v-else class="campaign-deck">
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
        <div
          v-if="lab.campaignAllianceFinale"
          class="campaign-voice player"
          data-testid="slime-alliance-earned-ending"
        >
          <SlimeCityArtwork
            class="campaign-voice-portrait"
            :image-id="slimeArtId('crews', lab.campaignAllianceFinale.ally)"
            :alt="teamName(lab.campaignAllianceFinale.ally) + ' ally portrait'"
            :fallback="crewInsignia(lab.campaignAllianceFinale.ally)"
            compact
          />
          <div>
            <small>
              ALLIANCE ENDING ·
              {{ teamName(lab.campaignAllianceFinale.ally) }} ·
              {{ lab.campaignAllianceFinale.chaptersTogether }}/5 CHAPTERS
            </small>
            <strong>{{ lab.campaignAllianceFinale.title }}</strong>
            <p>{{ lab.campaignAllianceFinale.story }}</p>
          </div>
        </div>
        <small class="campaign-note"
          >Each crew has its own saved journey. Verified Clash battles can earn
          account rewards; story-only card choices stay in this run.</small
        >
      </article>
      <div
        v-if="lab.campaignLegacy"
        class="campaign-deck"
        :class="'tone-' + lab.team.color"
        data-testid="slime-campaign-legacy"
      >
        <SlimeCityFavors
          heading="CREW LEGACY · CARRIED INTO DISTRICT RIVALS AND CONTRACTS"
        />
        <p class="campaign-legacy-terms">
          <strong>{{ lab.campaignLegacy.echo.title }}</strong> ·
          {{ describeTerms(lab.campaignLegacy.echo.terms) }}
        </p>
        <p
          v-if="finishedTrophy"
          class="campaign-legacy-terms"
          data-testid="slime-campaign-trophy-unlocked"
        >
          <strong>UNLOCKED</strong> · {{ finishedTrophy.trophy }} · title “{{
            finishedTrophy.title
          }}” · {{ finishedTrophy.frame.name }} card back. Kept on your account;
          no cards or Meat.
        </p>
      </div>
      <div class="campaign-deck">
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
            type="button"
            class="campaign-cta"
            data-testid="slime-campaign-open-endings"
            @click="lab.endingsOpen = true"
          >
            ENDINGS GALLERY &amp; SCRAPBOOK →
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="lab.campaignJourneyCurrent && lab.activeChapter"
      class="campaign-scene campaign-journey"
      data-testid="slime-faction-journey-scene"
    >
      <article class="campaign-panel kr-scroll" aria-live="polite">
        <span class="campaign-overline">
          {{ lab.campaignStory.title }} · ACT {{ lab.campaignState.wins + 1 }} /
          5 · SCENE
          {{
            (lab.campaignState.journey?.[lab.campaignState.wins]?.length ?? 0) +
            1
          }}
          / 3
        </span>
        <h3>{{ lab.campaignJourneyCurrent.title }}</h3>
        <div class="campaign-voice player">
          <SlimeCityArtwork
            class="campaign-voice-portrait"
            :image-id="slimeArtId('crews', lab.activeTeam)"
            :alt="lab.campaignJourneyCurrent.speaker"
            :fallback="lab.team.insignia"
            compact
          />
          <div>
            <small>{{ lab.campaignJourneyCurrent.speaker }}</small>
            <p class="campaign-lede">{{ lab.campaignJourneyText }}</p>
          </div>
        </div>
        <div
          v-if="lab.campaignJourneyOutcome"
          class="campaign-recap"
          data-testid="slime-faction-journey-consequence"
        >
          <strong>WHAT YOUR LAST CHOICE CHANGED</strong>
          <p>{{ lab.campaignJourneyOutcome }}</p>
        </div>
      </article>
      <div class="campaign-deck" :class="'tone-' + lab.team.color">
        <div
          v-if="lab.activeTeam === 'bloodfairies'"
          class="campaign-recap"
          data-testid="slime-bloodfairy-chorus"
        >
          <strong
            >CALL & RESPONSE ·
            {{ lab.bloodfairyChorus.stage.toUpperCase() }}</strong
          >
          <p>
            {{ lab.bloodfairyChorus.voices }} VOICES ·
            {{ lab.bloodfairyChorus.volume }} VOLUME · THE CHOIR REMEMBERS
          </p>
          <small v-if="lab.bloodfairyStageThree"
            >LEVEL 3 REVEAL · PREVIEW ONLY. Earn these evolutions by playing
            Riot Choir in CLASH.</small
          >
        </div>
        <div
          v-if="lab.activeTeam === 'ironjaw'"
          class="campaign-recap"
          data-testid="slime-ironjaw-shift"
        >
          <strong
            >THE SHIFT · {{ lab.ironjawShift.stage.toUpperCase() }}</strong
          >
          <p>
            {{ lab.ironjawShift.solidarity }} SOLIDARITY ·
            {{ lab.ironjawShift.heat }} HEAT · COLD BLOOD, WARM FLOOR
          </p>
        </div>
        <div
          v-if="lab.activeTeam === 'riot'"
          class="campaign-recap"
          data-testid="slime-riot-show"
        >
          <strong
            >THE SHOW ·
            {{ lab.riotShow.stage.replace('-', ' ').toUpperCase() }}</strong
          >
          <p>
            {{ lab.riotShow.safety }} SAFETY ·
            {{ lab.riotShow.spectacle }} SPECTACLE · THE AUDIENCE IS PART OF THE
            SHOW
          </p>
        </div>
        <div
          v-if="lab.activeTeam === 'undertow'"
          class="campaign-recap"
          data-testid="slime-undertow-signal"
        >
          <strong
            >THE SIGNAL · {{ lab.undertowSignal.signal.toUpperCase() }}</strong
          >
          <p>
            {{ lab.undertowSignal.truth }} TRUTH ·
            {{ lab.undertowSignal.leverage }} LEVERAGE · THE DRAINS HEAR
            EVERYTHING
          </p>
        </div>
        <div
          v-if="lab.activeTeam === 'exchange'"
          class="campaign-recap"
          data-testid="slime-exchange-appetite"
        >
          <strong
            >THE BOOK OF FLESH ·
            {{ lab.exchangeAppetite.rite.toUpperCase() }}</strong
          >
          <p>
            {{ lab.exchangeAppetite.mercy }} MERCY ·
            {{ lab.exchangeAppetite.appetite }} APPETITE · THE THING BELOW IS
            LISTENING
          </p>
        </div>
        <span class="campaign-overline"
          >{{ lab.campaignStory.title.toUpperCase() }} · YOUR DECISION</span
        >
        <KrChoiceHand
          :key="lab.activeTeam + ':' + lab.campaignJourneyCurrent.id"
          :choices="campaignJourneyChoices"
          :animate="false"
          :deal-key="
            lab.activeTeam +
            ':journey:' +
            lab.campaignState.wins +
            ':' +
            (lab.campaignState.journey?.[lab.campaignState.wins]?.length ?? 0)
          "
          question="CHOOSE WHAT HAPPENS NEXT"
          testid-prefix="slime-faction-journey-choice"
          @play="playCampaignJourney"
        >
          <template #art="{ choice }">
            <SlimeCityClashCardFace
              v-if="lab.bloodfairyStageThree"
              card-id="s1-riot-choir"
              :level="3"
              :pick="choice.id === 'left' ? 0 : 1"
              :preview="true"
            />
            <SlimeCityArtwork
              v-else
              :image-id="
                slimeArtId(
                  'crews',
                  choice.id === 'left'
                    ? lab.activeTeam
                    : (lab.activeChapter?.foe ?? lab.activeTeam),
                )
              "
              :alt="choice.label"
              :fallback="
                crewInsignia(
                  choice.id === 'left'
                    ? lab.activeTeam
                    : (lab.activeChapter?.foe ?? lab.activeTeam),
                )
              "
              compact
            />
          </template>
        </KrChoiceHand>
      </div>
    </div>

    <div
      v-else-if="lab.campaignAllianceCurrent && lab.activeChapter"
      class="campaign-scene campaign-journey"
      data-testid="slime-alliance-story-scene"
    >
      <article class="campaign-panel kr-scroll" aria-live="polite">
        <span class="campaign-overline">
          JOURNEY · ALLIANCE CHAPTER {{ lab.campaignState.wins + 1 }} / 5
        </span>
        <h3>{{ lab.campaignAllianceCurrent.title }}</h3>
        <div class="campaign-voice player">
          <SlimeCityArtwork
            class="campaign-voice-portrait"
            :image-id="slimeArtId('crews', lab.campaignAllianceCurrent.ally)"
            :alt="teamName(lab.campaignAllianceCurrent.ally) + ' ally portrait'"
            :fallback="crewInsignia(lab.campaignAllianceCurrent.ally)"
            compact
          />
          <div>
            <small>{{ lab.campaignAllianceCurrent.speaker }}</small>
            <p class="campaign-lede">{{ lab.campaignAllianceCurrent.text }}</p>
          </div>
        </div>
      </article>
      <div class="campaign-deck" :class="'tone-' + lab.team.color">
        <span class="campaign-overline">CHOOSE THE PARTNERSHIP'S PRICE</span>
        <KrChoiceHand
          :key="lab.campaignAllianceCurrent.id"
          :choices="allianceChoices"
          :animate="false"
          :deal-key="lab.campaignAllianceCurrent.id"
          question="HOW WILL THESE CREWS WORK TOGETHER?"
          testid-prefix="slime-alliance-story-choice"
          @play="playCampaignAlliance"
        >
          <template #art="{ choice }">
            <SlimeCityArtwork
              :image-id="
                slimeArtId(
                  'crews',
                  choice.id === 'protect'
                    ? lab.selectedJourneyAlliance.ally
                    : lab.activeTeam,
                )
              "
              :alt="choice.label"
              :fallback="crewInsignia(lab.selectedJourneyAlliance.ally)"
              compact
            />
          </template>
        </KrChoiceHand>
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
        <p
          v-if="allyChapterLine"
          class="campaign-variant"
          data-testid="slime-journey-alliance-branch"
        >
          {{ allyChapterLine }}
        </p>
        <div
          v-if="lab.geneRiotOutcome && lab.activeTeam === 'catgirls'"
          class="campaign-recap"
          data-testid="slime-faction-journey-last-decision"
        >
          <strong>THE PRICE OF YOUR DECISION</strong>
          <p>{{ lab.geneRiotOutcome }}</p>
        </div>
        <section
          v-if="lab.chapterField"
          class="campaign-field"
          :class="'objective-' + lab.chapterField.objective"
          aria-label="The battlefield"
          data-testid="slime-campaign-field"
        >
          <small>THE BATTLEFIELD · {{ lab.chapterField.label }}</small>
          <strong>{{ lab.chapterField.title }}</strong>
          <p>{{ lab.chapterField.briefing }}</p>
          <ul v-if="lab.chapterField.applies">
            <li v-for="line in lab.chapterField.lines" :key="line">
              {{ line }}
            </li>
          </ul>
          <p v-else class="campaign-field-note">
            This historical battlefield briefing is from Legacy mode. Your
            actual showdown uses your chosen Journey deck; your decisions change
            starting boss life.
          </p>
        </section>
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
        <SlimeCityFavors heading="EARNED SUPPORT · NEXT FIGHT" />
        <KrChoiceHand
          :choices="approachChoices"
          question="CHOOSE YOUR APPROACH · SOLO CLASH"
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
import { describeTerms } from '~/utils/slimeCity/campaign'
import { finaleArtSlugs } from '~/utils/slimeCity/endings'
import { clashTermsLabel } from '~/utils/slimeCity/clashBouts'

import { rarityOf } from '~/utils/slimeCity/progression'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { useSlimeCityStore } from '~/stores/slimeCity'
import {
  CREW_TROPHIES,
  crewTrophyUnlocked,
} from '~/utils/slimeCity/crewTrophies'
import type { TeamId } from '~/utils/slimeCity/prototypes'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'

const lab = useSlimeCityStore()
/** The active crew's trophy once its campaign is finished (slime-city/t-061). */
const finishedTrophy = computed(() =>
  crewTrophyUnlocked(lab.activeTeam, lab.endingsFound)
    ? CREW_TROPHIES[lab.activeTeam]
    : null,
)
function onJourneyDeckChange(event: Event): void {
  lab.selectJourneyDeck((event.target as HTMLSelectElement).value)
}
const nextDistrictName = computed(
  () =>
    lab.districts.find((district) => district.id === lab.campaignDistrict)
      ?.name ?? 'Unknown district',
)
const allyChapterLine = computed(() => {
  if (lab.journeyFormat !== 'alliance' || !lab.activeChapter) return null
  if (lab.campaignAllianceConsequence) return lab.campaignAllianceConsequence
  const ally = teamName(lab.selectedJourneyAlliance.ally)
  return lab.selectedJourneyAlliance.ally === lab.activeChapter.foe
    ? ally +
        ' defectors join your crew, facing their former comrades in this chapter.'
    : ally +
        ' joins your crew for this chapter. Their fighters change the battle, not the story you have already written.'
})
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
  // The journey ending the final choice earned has its own plate; until one is
  // rendered the finale keeps the triumph/compromise plate.
  for (const slug of finaleArtSlugs(lab.campaignSave, lab.activeTeam)) {
    const id = slimeArtId('story', slug)
    if (id) return id
  }
  return null
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
const campaignJourneyChoices = computed<KrHandChoice[]>(() =>
  (lab.campaignJourneyCurrent?.choices ?? []).map((option) => ({
    id: option.id,
    label: option.label,
    chip:
      lab.activeTeam === 'bloodfairies'
        ? option.id === 'left'
          ? 'ADD A VOICE'
          : 'TURN UP THE VOLUME'
        : lab.activeTeam === 'ironjaw'
          ? option.id === 'left'
            ? 'SHARE THE WARM FLOOR'
            : 'TURN UP THE HEAT'
          : lab.activeTeam === 'riot'
            ? option.id === 'left'
              ? 'KEEP THE CROWD SAFE'
              : 'MAKE IT BIGGER'
            : lab.activeTeam === 'undertow'
              ? option.id === 'left'
                ? 'TELL THE TRUTH'
                : 'KEEP THE LEVERAGE'
              : lab.activeTeam === 'exchange'
                ? option.id === 'left'
                  ? 'FORGIVE THE DEBT'
                  : 'FEED THE HUNGER'
                : option.id === 'left'
                  ? 'HELP THE CREW'
                  : 'TAKE THE RISK',
    badge: lab.bloodfairyStageThree
      ? option.id === 'left'
        ? 'LV 3 · WALL OF SOUND'
        : 'LV 3 · BACKUP SINGERS'
      : undefined,
    details: ['A choice that carries into later scenes and battles.'],
  })),
)
function playCampaignJourney(choice: KrHandChoice) {
  if (choice.id === 'left' || choice.id === 'right')
    lab.chooseCampaignJourneyBeat(choice.id)
}
const allianceChoices = computed<KrHandChoice[]>(() =>
  (lab.campaignAllianceCurrent?.choices ?? []).map((choice) => ({
    id: choice.id,
    label: choice.label,
    chip: choice.terms,
  })),
)
function playCampaignAlliance(choice: KrHandChoice) {
  if (choice.id === 'protect' || choice.id === 'gamble')
    lab.chooseCampaignAlliance(choice.id)
}
const approachChoices = computed<KrHandChoice[]>(() =>
  (lab.activeChapter?.choices ?? []).map((choice) => ({
    id: choice.id,
    label: choice.label,
    chip: clashTermsLabel(
      lab.campaignPreviewTerms(choice.terms),
      lab.journeyFormat,
    ),
    badge: choice.id === 'conviction' ? 'Conviction' : 'Cunning',
  })),
)
const cardRewardChoices = computed<KrHandChoice[]>(() =>
  (lab.campaignRewardChoices ?? []).map((card) => ({
    id: card.id,
    label: card.name,
    chip: rarityOf(card).toUpperCase(),
    badge: card.team === lab.activeTeam ? 'CREW REWARD' : 'MERCENARY',
    details: [card.text],
  })),
)
function pickStoryReward(choice: KrHandChoice) {
  lab.chooseCampaignCardReward(choice.id)
}
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
.campaign-variant {
  margin: 0.4rem 0;
  color: #c5ff59;
  font-size: 0.76rem;
  font-weight: 700;
}
.campaign-format {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.campaign-format span,
.campaign-format select,
.campaign-format button {
  padding: 0.35rem 0.5rem;
  border: 1px solid #ffffff55;
  border-radius: 0.4rem;
  background: #0a142ecc;
  color: #d8e2f2;
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.campaign-format select {
  flex: 1 1 7rem;
  max-width: 10rem;
  min-width: 0;
  cursor: pointer;
}
.campaign-format button[aria-pressed='true'] {
  border-color: #ffffff;
  background: #f4f7ff;
  color: #0a142e;
}
.campaign-format .campaign-parity[aria-pressed='true'] {
  border-color: #c5ff59;
  background: #c5ff59;
}
.campaign-format button:disabled {
  opacity: 0.5;
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
.campaign-field {
  display: grid;
  gap: 0.3rem;
  margin-top: 0.8rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid #ffffff2e;
  border-left: 4px solid var(--campaign-accent);
  background: #0b111bd9;
}
.campaign-field small {
  color: var(--campaign-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.campaign-field strong {
  font-size: 1.05rem;
  letter-spacing: 0.06em;
}
.campaign-field p {
  margin: 0;
  line-height: 1.45;
}
.campaign-field ul {
  display: grid;
  gap: 0.2rem;
  margin: 0.2rem 0 0;
  padding-left: 1.1rem;
  color: #dfe7e4;
  font-size: 0.88rem;
  line-height: 1.4;
}
.campaign-field-note {
  color: #ced9d6;
  font-size: 0.85rem;
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
.campaign-legacy-terms {
  margin: 0;
  color: #f4f4ec;
  font-size: 0.82rem;
  line-height: 1.35;
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
  .campaign-format {
    order: 4;
    flex: 1 1 100%;
  }
  .campaign-format button {
    flex: 1;
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
