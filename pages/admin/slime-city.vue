<template>
  <main
    class="kr-surface slime-lab h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    data-testid="slime-city-lab"
  >
    <div class="sc-shell">
      <header-page-bar console-theme="slime-city">
        <div class="sc-header" data-testid="slime-city-header">
          <div
            class="sc-brand"
            title="Kind Robots / Combat Systems Lab 001 — working title"
          >
            <div class="sc-wordmark">SLIME <span>CITY</span></div>
          </div>
          <div
            class="sc-crew-picker"
            role="group"
            aria-label="Choose your crew"
            data-testid="slime-crew-picker"
          >
            <button
              v-for="team in lab.teams"
              :key="team.id"
              type="button"
              class="sc-crew"
              :class="[
                'tone-' + team.color,
                { chosen: lab.activeTeam === team.id },
              ]"
              :title="team.name"
              :aria-label="team.name"
              :aria-pressed="lab.activeTeam === team.id"
              :data-testid="'slime-crew-' + team.id"
              @click="lab.chooseTeam(team.id)"
            >
              <SlimeCityArtwork
                :image-id="slimeArtId('crews', team.id)"
                :alt="team.name + ' crew emblem'"
                :fallback="team.insignia"
                compact
              />
            </button>
          </div>
          <nav class="sc-tabs" aria-label="Laboratory views">
            <button
              type="button"
              :class="{ active: lab.view === 'city' }"
              @click="lab.showCity()"
            >
              CITY
            </button>
            <button
              type="button"
              :class="{ active: lab.view === 'arena' }"
              @click="lab.view = 'arena'"
            >
              ARENA
            </button>
            <button
              type="button"
              :class="{ active: lab.view === 'campaign' }"
              data-testid="slime-campaign-tab"
              @click="lab.showCampaign()"
            >
              STORY
            </button>
            <button
              type="button"
              :class="{ active: lab.view === 'cards' }"
              @click="lab.showCards()"
            >
              CARDS
            </button>
            <button
              type="button"
              :class="{ active: lab.view === 'rewards' }"
              data-testid="slime-rewards-tab"
              @click="lab.showRewards()"
            >
              REWARDS
            </button>
          </nav>
          <div
            class="sc-hud"
            :title="
              lab.progressLoaded
                ? 'Meat earned in Slime City'
                : 'Sign in to keep Slime City progress'
            "
          >
            <span class="sc-led"></span>
            <button
              v-if="lab.storyError"
              type="button"
              class="sc-story-reload"
              :title="lab.storyError"
              :aria-label="
                'Story save unavailable. ' +
                lab.storyError +
                ' Reload saved story.'
              "
              @click="lab.hydrateStory()"
            >
              STORY SYNC ERROR · RELOAD
            </button>
            <strong v-else>{{
              lab.progressLoaded ? lab.progress.meat + ' MEAT' : 'SIGN IN'
            }}</strong>
          </div>
        </div>
      </header-page-bar>

      <div class="sc-main">
        <section
          v-if="lab.view === 'city'"
          class="sc-stage"
          aria-label="Slime City district map"
        >
          <div class="sc-city">
            <SlimeCityArtwork
              class="sc-district-paint"
              :image-id="slimeArtId('districts', lab.districtId)"
              :alt="lab.district.name + ' panoramic district artwork'"
              fallback="▧"
            />
            <div class="sc-moon"></div>
            <div class="sc-skyline sc-skyline-back"></div>
            <div class="sc-skyline sc-skyline-front"></div>
            <div class="sc-road"></div>
            <div class="sc-city-overline">THE CITY IS THE ARENA</div>
            <svg
              class="sc-streets"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                v-for="street in streetLines"
                :key="street.name"
                :x1="street.x1"
                :y1="street.y1"
                :x2="street.x2"
                :y2="street.y2"
                :class="{
                  open: street.open,
                  witnessed: street.witnessed,
                  planned: street.planned,
                }"
              />
            </svg>
            <button
              v-for="place in lab.districts"
              :key="place.id"
              type="button"
              class="sc-district"
              :class="[
                'is-' + lab.districtStatus(place.id),
                {
                  picked: lab.districtId === place.id,
                  mission: lab.campaignDistrict === place.id,
                },
              ]"
              :style="{ left: place.x + '%', top: place.y + '%' }"
              :aria-pressed="lab.districtId === place.id"
              :aria-label="
                place.name +
                ', ' +
                statusLabel(lab.districtStatus(place.id)) +
                (lab.campaignDistrict === place.id
                  ? ', next faction story mission'
                  : '')
              "
              :data-testid="'slime-district-' + place.id"
              @click="lab.visit(place.id)"
            >
              <span class="sc-district-pin">{{
                pinSymbol(lab.districtStatus(place.id))
              }}</span>
              <span class="sc-district-label">{{ place.name }}</span>
            </button>
          </div>
          <div class="sc-city-selection kr-scroll" data-testid="slime-dossier">
            <article
              v-if="lab.aftermathEvent"
              class="sc-street-encounter"
              data-testid="slime-champion-aftermath"
              aria-live="polite"
            >
              <span class="sc-overline"
                >CHAMPIONSHIP AFTERMATH · {{ lab.district.name }}</span
              >
              <h2>{{ lab.aftermathEvent.title }}</h2>
              <p class="sc-scene">{{ lab.aftermathEvent.scene }}</p>
              <div class="sc-choices">
                <button
                  v-for="choice in lab.aftermathEvent.choices"
                  :key="choice.id"
                  type="button"
                  :data-testid="'slime-aftermath-' + choice.id"
                  @click="lab.chooseAftermath(choice.id)"
                >
                  <strong>{{ choice.label }}</strong>
                  <small>{{ choice.outcome }}</small>
                </button>
              </div>
            </article>
            <article
              v-else-if="lab.crisisEvent"
              class="sc-street-encounter"
              data-testid="slime-city-crisis"
              aria-live="polite"
            >
              <span class="sc-overline">
                CITYWIDE CRISIS · ACT
                {{ Object.keys(lab.city.crisisChoices).length + 1 }}/3
              </span>
              <h2>{{ lab.crisisEvent.title }}</h2>
              <p class="sc-scene">{{ lab.crisisEvent.scene }}</p>
              <div class="sc-choices">
                <button
                  v-for="choice in lab.crisisEvent.choices"
                  :key="choice.id"
                  type="button"
                  :data-testid="'slime-crisis-' + choice.id"
                  @click="lab.chooseCrisis(choice.id)"
                >
                  <strong>{{ choice.label }}</strong>
                  <small>{{ choice.outcome }}</small>
                </button>
              </div>
            </article>
            <article
              v-else-if="lab.streetEvent"
              class="sc-street-encounter"
              data-testid="slime-street-encounter"
              aria-live="polite"
            >
              <span class="sc-overline"
                >STREET STORY · {{ lab.city.pendingStreet }}</span
              >
              <h2>{{ lab.streetEvent.title }}</h2>
              <p class="sc-scene">{{ lab.streetEvent.scene }}</p>
              <div class="sc-choices">
                <button
                  v-for="choice in lab.streetEvent.choices"
                  :key="choice.id"
                  type="button"
                  :data-testid="'slime-street-choice-' + choice.id"
                  @click="lab.chooseStreet(choice.id)"
                >
                  <strong>{{ choice.label }}</strong>
                  <small>{{ choice.outcome }}</small>
                </button>
              </div>
            </article>
            <article
              v-else-if="lab.finaleEvent"
              class="sc-street-encounter sc-city-finale"
              data-testid="slime-city-finale"
              aria-live="polite"
            >
              <div class="sc-finale-portrait">
                <SlimeCityArtwork
                  :image-id="slimeArtId('crews', lab.activeTeam)"
                  :alt="lab.team.name + ' champion painting'"
                  fallback="✷"
                  compact
                />
                <span class="sc-overline">GRAND PIT · CITY FINALE</span>
              </div>
              <h2>{{ lab.finaleEvent.title }}</h2>
              <p class="sc-scene">{{ lab.finaleEvent.scene }}</p>
              <div class="sc-choices">
                <button
                  v-for="choice in lab.finaleEvent.choices"
                  :key="choice.id"
                  type="button"
                  :data-testid="'slime-finale-' + choice.id"
                  @click="lab.chooseFinale(choice.id)"
                >
                  <strong>{{ choice.label }}</strong>
                  <small>{{ choice.outcome }}</small>
                </button>
              </div>
            </article>
            <article
              v-else-if="lab.finaleResult && !lab.finaleDismissed"
              class="sc-street-encounter sc-city-finale"
              data-testid="slime-city-epilogue"
              aria-live="polite"
            >
              <div class="sc-finale-portrait">
                <SlimeCityArtwork
                  :image-id="slimeArtId('crews', lab.activeTeam)"
                  :alt="lab.team.name + ' victory portrait'"
                  fallback="✷"
                  compact
                />
                <span class="sc-overline">THE END · {{ lab.team.name }}</span>
              </div>
              <h2>{{ lab.finaleResult.title }}</h2>
              <p class="sc-scene">{{ lab.finaleResult.scene }}</p>
              <p class="sc-scene">{{ lab.finaleResult.legacy }}</p>
              <p class="sc-overline">
                {{ lab.city.cleared.length }} CHAMPIONS ·
                {{ lab.city.contracts.length }} CONTRACTS ·
                {{ Object.keys(lab.city.crisisChoices).length }} CRISES
              </p>
              <div class="sc-choices">
                <button
                  type="button"
                  data-testid="slime-finale-explore"
                  @click="lab.dismissFinale()"
                >
                  <strong>CONTINUE EXPLORING</strong>
                  <small
                    >Optional contracts and unchallenged rivals remain
                    playable.</small
                  >
                </button>
                <button
                  type="button"
                  data-testid="slime-finale-restart"
                  @click="lab.resetCity()"
                >
                  <strong>NEW CITY RUN</strong>
                  <small
                    >Start a fresh session-only overworld with this crew.</small
                  >
                </button>
              </div>
            </article>
            <template v-else>
              <div
                v-if="!lab.here && lab.routeSteps.length"
                class="sc-route"
                data-testid="slime-city-route"
                aria-live="polite"
              >
                <span class="sc-overline"
                  >WAYFINDER · {{ lab.routeSteps.length }}
                  {{ lab.routeSteps.length === 1 ? 'STREET' : 'STREETS' }}</span
                >
                <strong>{{ routeLabel }}</strong>
                <small
                  >Next: {{ lab.route?.street }} · {{ nextStopName }}</small
                >
              </div>
              <article
                v-if="
                  lab.activeChapter && lab.campaignDistrict === lab.districtId
                "
                class="sc-story-mission"
                data-testid="slime-city-story-mission"
              >
                <div class="sc-mission-poster">
                  <SlimeCityArtwork
                    :image-id="slimeArtId('crews', lab.activeChapter.foe)"
                    :alt="teamName(lab.activeChapter.foe) + ' rival portrait'"
                    fallback="✷"
                    compact
                  />
                  <span class="sc-mission-poster-label">
                    <small>CREW CLASH / {{ lab.district.name }}</small>
                    <strong>{{ teamName(lab.activeChapter.foe) }}</strong>
                  </span>
                </div>
                <span class="sc-overline"
                  >CREW STORY · CHAPTER {{ lab.campaignState.wins + 1 }}/5 ·
                  {{ teamName(lab.activeChapter.foe) }}</span
                >
                <strong>{{ lab.activeChapter.title }}</strong>
                <p class="sc-scene">{{ lab.activeChapter.scene }}</p>
                <span v-if="!lab.campaignAtDestination" class="sc-mission-hint">
                  Follow the marked streets and resolve each street story to
                  stage this battle. Your choices change its opening conditions.
                </span>
                <div v-else class="sc-mission-ready">
                  <p
                    v-if="lab.campaignEcho"
                    class="sc-mission-terms"
                    data-testid="slime-city-campaign-echo"
                  >
                    {{ lab.campaignEcho.title }} ·
                    {{ describeTerms(lab.campaignEcho.terms) }}
                  </p>
                  <p
                    class="sc-mission-terms"
                    data-testid="slime-city-local-terms"
                  >
                    CITY CONSEQUENCES ·
                    {{ describeTerms(boutTerms(lab.city, lab.districtId)) }}
                  </p>
                  <div class="sc-choices">
                    <button
                      v-for="choice in lab.activeChapter.choices"
                      :key="choice.id"
                      type="button"
                      :data-testid="'slime-city-mission-' + choice.id"
                      @click="lab.startCampaignBattle(choice.id)"
                    >
                      <strong>{{ choice.label }}</strong>
                      <small
                        >WITH STREET CHOICES ·
                        {{
                          describeTerms(
                            campaignBattleTerms(
                              lab.campaignSave,
                              lab.activeTeam,
                              storyMissionTerms(
                                lab.city,
                                lab.districtId,
                                choice.terms,
                              ),
                              lab.campaignFavorIndex,
                            ),
                          )
                        }}</small
                      >
                    </button>
                  </div>
                </div>
              </article>
              <p class="sc-overline">
                {{ lab.district.name }} /
                {{ statusLabel(lab.districtStatus(lab.districtId)) }}
              </p>
              <p class="sc-scene">{{ lab.plan.scene }}</p>
              <p class="sc-rival">
                <strong>{{ lab.plan.rival.name }}</strong>
                · {{ lab.plan.rival.title }} ·
                {{ teamName(lab.plan.rival.team) }} ·
                {{ modeTitle(lab.plan.rival.mode) }}
                <em>“{{ lab.plan.rival.taunt }}”</em>
              </p>
              <template v-if="lab.here">
                <div v-if="chosenChoice" class="sc-decided">
                  <span class="sc-overline">YOUR CALL</span>
                  {{ chosenChoice.label }}: {{ chosenChoice.outcome }}
                </div>
                <div v-else-if="!lab.gate" class="sc-choices">
                  <button
                    v-for="choice in lab.plan.choices"
                    :key="choice.id"
                    type="button"
                    :data-testid="'slime-choice-' + choice.id"
                    @click="lab.choose(choice.id)"
                  >
                    <strong>{{ choice.label }}</strong>
                    <small>{{ choice.outcome }}</small>
                  </button>
                </div>
                <p v-if="lab.blocked" class="sc-gate">{{ lab.blocked }}</p>
                <span class="sc-city-actions">
                  <button
                    type="button"
                    data-testid="slime-fight-rival"
                    :disabled="!!lab.blocked"
                    @click="lab.fightRival()"
                  >
                    FIGHT {{ lab.plan.rival.name.toUpperCase() }} →
                  </button>
                  <button
                    type="button"
                    class="sc-quiet"
                    @click="lab.startDistrictMatch()"
                  >
                    QUICK MATCH
                  </button>
                </span>
                <SlimeCityDistrictContract />
              </template>
              <span v-else class="sc-city-actions">
                <button
                  v-if="lab.route"
                  type="button"
                  data-testid="slime-walk"
                  @click="lab.walk()"
                >
                  WALK {{ lab.route.street.toUpperCase() }} ·
                  {{ nextStopName.toUpperCase() }} →
                </button>
                <span v-else class="sc-gate"
                  >No route available. Choose a connected district.</span
                >
              </span>
            </template>
            <div class="sc-city-nav" aria-label="Crew destinations">
              <button
                type="button"
                data-testid="slime-city-story-shortcut"
                @click="lab.showCampaign()"
              >
                CREW STORY · {{ lab.campaignState.wins }}/5
              </button>
              <button
                type="button"
                data-testid="slime-city-cards-shortcut"
                @click="lab.showCards()"
              >
                INSPECT DECK · {{ lab.cards.length }} CARDS
              </button>
              <button
                v-if="lab.finaleResult && lab.finaleDismissed"
                type="button"
                data-testid="slime-city-revisit-ending"
                @click="lab.revisitFinale()"
              >
                REVISIT THE ENDING
              </button>
            </div>
          </div>
        </section>

        <SlimeCityCampaign v-else-if="lab.view === 'campaign'" />
        <SlimeCityArena v-else-if="lab.view === 'arena'" />

        <section
          v-else-if="lab.view === 'cards'"
          class="sc-stage sc-collection"
          aria-label="Special cards and creature collection"
        >
          <div
            class="sc-deck-workbench"
            :class="'tone-' + lab.team.color"
            data-testid="slime-deck-workbench"
          >
            <div
              class="sc-deck-meter"
              :title="
                lab.currentDeck.length +
                ' of 10 deck slots filled · four creatures, one signature, up to three mercenaries'
              "
            >
              <strong>{{ lab.currentDeck.length }}<small>/10</small></strong>
              <span class="sc-deck-pips" aria-hidden="true"
                ><i
                  v-for="slot in 10"
                  :key="slot"
                  :class="{ on: slot <= lab.currentDeck.length }"
              /></span>
            </div>
            <div class="sc-deck-status">
              <span class="sc-overline"
                >ARMORY · {{ lab.team.name }} ·
                {{ lab.progress.cards.length }}/{{
                  lab.collectionSize
                }}
                COLLECTED</span
              >
              <p aria-live="polite">
                {{
                  lab.deckMessage ||
                  (swapSource
                    ? 'Now tap an owned ' +
                      swapSource.kind +
                      ' to replace ' +
                      swapSource.name +
                      '.'
                    : 'Tap a deck card, then an owned reserve of the same type.')
                }}
              </p>
              <small v-if="lab.currentDeckProblems.length" role="alert">{{
                lab.currentDeckProblems.join(' · ')
              }}</small>
            </div>
            <div class="sc-deck-actions">
              <button
                type="button"
                data-testid="slime-deck-restore"
                @click="lab.restoreFounderDeck()"
              >
                RESTORE FOUNDER
              </button>
              <button
                type="button"
                data-testid="slime-deck-practice"
                :disabled="lab.currentDeckProblems.length > 0"
                @click="lab.testCustomDeck()"
              >
                PRACTICE DECK
              </button>
            </div>
          </div>
          <details class="sc-collection-title">
            <summary>
              <span class="sc-overline"
                >CREW DOSSIER · {{ lab.team.motto }}</span
              >
            </summary>
            <p>{{ lab.team.hook }}</p>
            <p data-testid="slime-crew-pattern">
              <b>PLAY PATTERN</b> {{ lab.team.pattern }}
            </p>
            <p data-testid="slime-crew-counters">
              <b>HOW TO BEAT THEM</b> {{ lab.team.counters }}
            </p>
            <p class="sc-art-summary" data-testid="slime-art-provenance">
              {{ SLIME_CITY_ART_COUNT }} RENDERED IDS ·
              {{ art.loadedCount }} VERIFIED IN BROWSER ·
              {{ art.failedCount }} UNAVAILABLE · 24 STARTER CARDS STILL NEED
              ART
            </p>
          </details>
          <ul
            class="sc-collection-grid kr-scroll"
            :class="{ swapping: !!swapSource }"
            aria-label="Crew and mercenary cards"
          >
            <li
              v-for="card in lab.cards"
              :key="card.id"
              class="sc-collect"
              :class="[
                'is-' + deckState(card),
                {
                  'is-selected': lab.replacingCard === card.id,
                  'is-eligible': canSwapIn(card),
                },
              ]"
            >
              <SlimeCityCard :card="card">
                <span class="sc-collect-ribbon">{{ deckLabel(card) }}</span>
              </SlimeCityCard>
              <button
                type="button"
                class="sc-collect-pick"
                :data-testid="'slime-deck-card-' + card.id"
                :aria-pressed="lab.currentDeck.includes(card.id)"
                :aria-label="card.name + ', ' + deckLabel(card).toLowerCase()"
                @click="lab.selectDeckCard(card.id)"
              />
            </li>
          </ul>
        </section>

        <section
          v-else
          class="sc-stage sc-progression"
          aria-label="Slime City progression and card packs"
          data-testid="slime-progression"
        >
          <div class="sc-progression-top">
            <div>
              <span class="sc-overline"
                >THE GUTTER EXCHANGE / VIRTUAL-ONLY ECONOMY</span
              >
              <h2>FIGHT. EARN. COLLECT.</h2>
              <p>
                All six ten-card starter decks stay available. Your XP, Meat,
                owned cards, and challenges are saved to your Kind Robots
                account.
              </p>
            </div>
            <div class="sc-progress-hud">
              <strong>LVL {{ lab.level }}</strong>
              <span>{{ lab.progress.xp }} / {{ lab.nextLevel }} XP</span>
              <b>{{ lab.progress.meat }} MEAT</b>
            </div>
          </div>
          <div class="sc-progression-scroll kr-scroll">
            <p v-if="lab.progressBusy" class="sc-progress-alert" role="status">
              Syncing with your Kind Robots account…
            </p>
            <p
              v-if="lab.progressError"
              class="sc-progress-alert sc-progress-error"
              role="alert"
            >
              {{ lab.progressError }}
            </p>
            <div class="sc-reward-columns">
              <div class="sc-reward-panel">
                <span class="sc-overline">THE PIT PAYS</span>
                <strong>VS CPU BOUNTIES</strong>
                <p>
                  Victory: 80 XP + 45 Meat. Draw: 35 XP + 15 Meat. Loss: 25 XP +
                  10 Meat. Base payouts for the first 10 completed bouts per
                  Pacific day.
                </p>
                <p>
                  {{ lab.progress.wins }} W / {{ lab.progress.losses }} L /
                  {{ lab.progress.draws }} D ·
                  {{ lab.progress.daily.paidBattles }}/10 PAID BOUTS TODAY
                </p>
                <button
                  type="button"
                  data-testid="slime-fight-for-meat"
                  :disabled="lab.progressBusy || !lab.progressLoaded"
                  @click="lab.startCpuBattle()"
                >
                  START REWARDED CPU BATTLE →
                </button>
                <small aria-live="polite">{{
                  lab.progressError || lab.progress.lastReward
                }}</small>
              </div>
              <div class="sc-reward-panel sc-shop-panel">
                <span class="sc-overline">THE PACK SHOP</span>
                <strong>STREET PACK</strong>
                <div class="sc-pack-art" aria-hidden="true">
                  <span>★</span><b>SLIME CITY</b
                  ><small>1 GUARANTEED RARE</small>
                </div>
                <p>
                  Three NEW cards. Exactly one rare, plus two common/uncommon.
                  No duplicates. Random from the 60-card unowned pool, until
                  sold out.
                </p>
                <p>
                  COLLECTION {{ lab.progress.cards.length }}/60 ·
                  {{ lab.progress.opened }} PACKS OPENED
                </p>
                <button
                  type="button"
                  data-testid="slime-buy-pack"
                  :disabled="!lab.packAffordable || lab.progressBusy"
                  @click="lab.purchasePack()"
                >
                  BUY PACK · {{ lab.packPrice }} MEAT
                </button>
                <small v-if="!lab.packAffordable"
                  >Earn more Meat, or the guaranteed-rare pool is
                  exhausted.</small
                >
              </div>
            </div>
            <div
              v-if="lab.progress.lastPack.length"
              class="sc-reward-panel"
              data-testid="slime-pack-reveal"
            >
              <strong>YOUR LATEST PACK</strong>
              <div class="sc-pack-cards">
                <SlimeCityCard
                  v-for="id in lab.progress.lastPack"
                  :key="id"
                  :card="cardById(id)"
                >
                  <template #footer>
                    <small>{{
                      cardById(id).team === 'mercenary'
                        ? 'HIRES WITH ANY CREW'
                        : teamName(cardById(id).team)
                    }}</small>
                  </template>
                </SlimeCityCard>
              </div>
            </div>
            <div class="sc-reward-panel">
              <span class="sc-overline"
                >RESET AT MIDNIGHT PACIFIC / MONDAY FOR WEEKLIES</span
              >
              <strong>DAILY & WEEKLY BOUNTIES</strong>
              <div class="sc-challenge-grid">
                <article
                  v-for="quest in lab.challengeList"
                  :key="quest.id"
                  class="sc-challenge"
                >
                  <span
                    >{{ quest.period.toUpperCase() }} · {{ quest.value }}/{{
                      quest.target
                    }}</span
                  >
                  <strong>{{ quest.title }}</strong>
                  <p>{{ quest.description }}</p>
                  <small>+{{ quest.meat }} MEAT · +{{ quest.xp }} XP</small>
                  <button
                    type="button"
                    :disabled="
                      !quest.ready || lab.progressBusy || !lab.progressLoaded
                    "
                    :data-testid="'slime-claim-' + quest.id"
                    @click="lab.claimReward(quest.id)"
                  >
                    {{
                      quest.claimed
                        ? 'CLAIMED ✓'
                        : quest.ready
                          ? 'CLAIM REWARD'
                          : 'IN PROGRESS'
                    }}
                  </button>
                </article>
              </div>
            </div>
            <small class="sc-progression-note"
              >All XP, Meat, collection and challenge claims are account-bound
              in Kind Robots’ database. Only server-issued CPU matches award
              rewards. No cash, paid card packs, or trading. Public launch
              remains gated.</small
            >
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { cardById, type Card } from '~/utils/slimeCity/prototypes'
import { STREETS, boutTerms, storyMissionTerms } from '~/utils/slimeCity/city'
import { campaignBattleTerms, describeTerms } from '~/utils/slimeCity/campaign'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { slimeArtId, SLIME_CITY_ART_COUNT } from '~/utils/slimeCity/artManifest'
import { useSlimeCityArtStore } from '~/stores/slimeCityArt'

const lab = useSlimeCityStore()
const art = useSlimeCityArtStore()

const hereName = computed(
  () => lab.districts.find((d) => d.id === lab.city.location)?.name ?? 'here',
)
const chosenChoice = computed(() =>
  lab.plan.choices.find((c) => c.id === lab.city.choices[lab.districtId]),
)
const streetLines = computed(() =>
  STREETS.map(([a, b, name]) => {
    const from = lab.districts.find((d) => d.id === a)!
    const to = lab.districts.find((d) => d.id === b)!
    return {
      name,
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      open: a === lab.city.location || b === lab.city.location,
      witnessed: !!lab.city.streetChoices[name],
      planned: lab.routeSteps.some((step) => step.street === name),
    }
  }),
)
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
function pinSymbol(status: string): string {
  return (
    { here: '●', cleared: '✓', locked: '✕', reachable: '◆', far: '◇' }[
      status
    ] ?? '◆'
  )
}
function teamName(id: string): string {
  return lab.teams.find((t) => t.id === id)?.name ?? id
}
const swapSource = computed(() =>
  lab.cards.find((card) => card.id === lab.replacingCard),
)
function deckState(card: Card): 'deck' | 'owned' | 'starter' | 'locked' {
  if (lab.currentDeck.includes(card.id)) return 'deck'
  if (lab.progress.cards.includes(card.id)) return 'owned'
  return lab.isFounderCard(card.id) ? 'starter' : 'locked'
}
function deckLabel(card: Card): string {
  if (lab.replacingCard === card.id) return 'SWAPPING OUT'
  if (canSwapIn(card)) return 'SWAP IN'
  return {
    deck: 'IN DECK',
    owned: 'OWNED',
    starter: 'STARTER',
    locked: 'LOCKED',
  }[deckState(card)]
}
function canSwapIn(card: Card): boolean {
  const source = swapSource.value
  return (
    !!source &&
    !source.signature &&
    source.kind === card.kind &&
    !lab.currentDeck.includes(card.id) &&
    lab.isCardUnlocked(card.id)
  )
}
function modeTitle(id: string): string {
  return lab.modes.find((m) => m.id === id)?.title ?? id
}
const nextStopName = computed(
  () => lab.districts.find((d) => d.id === lab.route?.to)?.name ?? '',
)
const routeLabel = computed(() =>
  [
    hereName.value,
    ...lab.routeSteps.map(
      ({ to }) => lab.districts.find((d) => d.id === to)?.name ?? to,
    ),
  ].join(' › '),
)
onMounted(() => lab.hydrateProgression())
onUnmounted(() => {
  lab.dispose()
  art.clear()
})
</script>

<style scoped>
.slime-lab {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #f7f2e8;
  background: #090d16;
  font-family: system-ui, sans-serif;
  container-type: size;
}
.sc-shell {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: radial-gradient(
    ellipse at 65% 0%,
    #29314c 0%,
    #101724 48%,
    #0a0e16 80%
  );
}
.sc-header {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.25rem 0 0.5rem;
  color: #eef2f8;
}
.sc-overline {
  display: block;
  color: #a6aac0;
  font-size: 0.61rem;
  letter-spacing: 0.2em;
  font-weight: 850;
  text-transform: uppercase;
}
.sc-brand {
  flex: none;
}
.sc-brand .sc-wordmark {
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.6rem);
  font-weight: 1000;
  line-height: 1;
  letter-spacing: -0.065em;
  font-style: italic;
  white-space: nowrap;
  text-shadow: 0 0 25px #f35c5944;
}
.sc-brand .sc-wordmark span {
  color: #c3ff55;
}
.sc-tabs {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  gap: 0.3rem;
  margin-inline: auto;
  padding: 0.2rem;
  overflow-x: auto;
  /* Never a hidden scrollbar: it once clipped REWARDS off the end of the
     strip with nothing to say a fifth tab existed (Silas, 2026-11-02). */
  scrollbar-width: thin;
  scrollbar-color: #4d5567 transparent;
  border: 1px solid #4d5567;
  border-radius: 0.6rem;
  background: #0e1420;
}
.sc-tabs button {
  flex: none;
  min-width: 4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.42rem;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #afb8c5;
}
.sc-tabs button.active {
  background: #c5ff59;
  color: #142016;
  box-shadow: 0 0 18px #c5ff5944;
}
.sc-hud {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: #afbad1;
  white-space: nowrap;
}
.sc-hud strong {
  padding: 0.45rem 0.7rem;
  color: #dfff93;
  background: #19271c;
  border: 1px solid #7ba74a77;
  border-radius: 0.3rem;
}
.sc-story-reload {
  max-width: 11rem;
  padding: 0.45rem 0.5rem;
  border: 1px solid #f6ad6588;
  border-radius: 0.3rem;
  background: #3f281a;
  color: #ffdab4;
  font-size: 0.59rem;
  font-weight: 800;
  white-space: normal;
  text-align: center;
}
.sc-led {
  height: 0.4rem;
  width: 0.4rem;
  border-radius: 100%;
  background: #adfa6a;
  box-shadow: 0 0 8px #adfa6a;
}
.sc-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  flex: 1;
  min-height: 0;
}
.sc-crew-picker {
  flex: none;
  display: flex;
  gap: 0.25rem;
  padding: 0.2rem;
  border: 1px solid #4d5567;
  border-radius: 0.6rem;
  background: #0e1420;
}
.sc-crew {
  overflow: hidden;
  flex: none;
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  font-size: 1.3rem;
  border-radius: 0.42rem;
  border: 2px solid transparent;
  background: radial-gradient(#ffffff44, transparent 70%), var(--tone);
  color: #0b1222;
  opacity: 0.62;
  filter: saturate(0.7);
  transition:
    opacity 0.12s,
    transform 0.12s,
    border-color 0.12s;
}
.sc-crew:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.sc-crew.chosen {
  opacity: 1;
  filter: none;
  border-color: var(--tone);
  box-shadow: 0 0 14px color-mix(in srgb, var(--tone) 70%, transparent);
}
.tone-red {
  --tone: #fe6657;
}
.tone-blue {
  --tone: #6fc8ff;
}
.tone-purple {
  --tone: #d38cff;
}
.tone-green {
  --tone: #c7fa62;
}
.tone-gold {
  --tone: #f7c968;
}
.sc-stage {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: #151f2d;
}
.sc-city .sc-district-paint {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.82;
}
.sc-city .sc-district-paint :deep(img) {
  object-position: center center;
}
.sc-city .sc-skyline {
  opacity: 0.32;
}
.sc-city {
  flex: 1;
  min-height: 0;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    radial-gradient(circle at 73% 12%, #ee5c9366, transparent 34%),
    linear-gradient(175deg, #3d2960 2%, #28304b 37%, #102e36 72%, #06171c 100%);
}
.sc-moon {
  position: absolute;
  right: 17%;
  top: 9%;
  width: 9rem;
  height: 9rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #feee9e, #d796b5 65%, #ff5381);
  box-shadow: 0 0 5rem #dc43917a;
  opacity: 0.8;
}
.sc-skyline {
  position: absolute;
  inset: 0;
  clip-path: polygon(
    0 48%,
    7% 48%,
    7% 23%,
    13% 23%,
    13% 41%,
    20% 41%,
    20% 14%,
    27% 14%,
    27% 36%,
    35% 36%,
    35% 29%,
    42% 29%,
    42% 39%,
    52% 39%,
    52% 10%,
    59% 10%,
    59% 34%,
    64% 34%,
    64% 21%,
    71% 21%,
    71% 45%,
    77% 45%,
    77% 18%,
    84% 18%,
    84% 40%,
    91% 40%,
    91% 31%,
    100% 31%,
    100% 100%,
    0 100%
  );
}
.sc-skyline-back {
  top: 8%;
  background:
    repeating-linear-gradient(90deg, transparent 0 12px, #e2d88618 13px 16px),
    linear-gradient(#533a60, #182635);
  filter: drop-shadow(0 -7px 10px #fc658560);
}
.sc-skyline-front {
  top: 31%;
  background:
    repeating-linear-gradient(
      90deg,
      #182d33 0 7px,
      #668075 8px 9px,
      #16242f 12px 20px
    ),
    linear-gradient(#192534, #0b1820);
  opacity: 0.96;
  transform: scaleX(-1);
}
.sc-road {
  position: absolute;
  inset: 50% -30% -45%;
  transform: perspective(250px) rotateX(57deg);
  border: 18px solid #d7fa7b66;
  background: repeating-linear-gradient(
    90deg,
    #172834 0 16%,
    #24333b 16% 17%,
    #182a35 18% 32%
  );
  box-shadow: 0 0 36px #c4ff5740;
}
.sc-city-overline {
  position: absolute;
  left: 1.7rem;
  top: 1.3rem;
  color: #e1fc9c;
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  font-weight: 950;
  text-shadow: 0 2px 15px #090a10;
}
.sc-district {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  gap: 0.2rem;
  color: #fff;
}
.sc-district-pin {
  display: grid;
  place-items: center;
  height: 2.2rem;
  width: 2.2rem;
  border: 2px solid #edfcba;
  border-radius: 0.4rem;
  background: #1a2923e8;
  box-shadow:
    0 0 0 5px #c4ff3522,
    0 0 19px #c4ff3577;
  color: #c5ff69;
  transform: rotate(45deg);
  font-size: 1rem;
}
.sc-district-label {
  max-width: 8rem;
  text-align: center;
  padding: 0.2rem 0.38rem;
  background: #09111fda;
  border-radius: 0.2rem;
  border: 1px solid #a9b3b944;
  font-size: 0.61rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-shadow: 0 2px 3px #000;
}
.sc-district:hover .sc-district-pin,
.sc-district.picked .sc-district-pin {
  background: #d5ff62;
  color: #1c2b27;
  box-shadow: 0 0 25px #d5ff62;
}
.sc-city-selection {
  position: absolute;
  z-index: 3;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 1rem;
  border: 1px solid #d5f9a566;
  background: #0c1821ed;
  backdrop-filter: blur(8px);
  border-radius: 0.55rem;
}
.sc-city-selection p {
  margin: 0;
  font-size: 0.8rem;
}
.sc-city-selection {
  position: relative;
  inset: auto;
  flex: none;
  flex-direction: column;
  align-items: stretch;
  max-height: 34%;
  overflow: auto;
  margin: 0.5rem;
}
.sc-streets {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.sc-streets line {
  stroke: #9fb4c055;
  stroke-width: 0.5;
  stroke-dasharray: 1.4 1;
  vector-effect: non-scaling-stroke;
}
.sc-streets line.open {
  stroke: #d5ff62;
  stroke-width: 2.5;
  stroke-dasharray: none;
}
.sc-district.mission .sc-district-pin {
  outline: 3px solid #f9bcff;
  outline-offset: 6px;
}
.sc-district.is-here .sc-district-pin {
  background: #ffd34d;
  color: #2a1c05;
}
.sc-district.is-cleared .sc-district-pin {
  border-color: #7dffb0;
  color: #7dffb0;
}
.sc-district.is-locked .sc-district-pin {
  opacity: 0.55;
  border-style: dashed;
}
.sc-street-encounter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-left: 3px solid #f0b4ff;
  padding: 0.3rem 0.35rem 0.3rem 0.8rem;
  background: linear-gradient(90deg, #592b7442, transparent 80%);
}
.sc-city-finale {
  border-left-color: #ffd45c;
  background: linear-gradient(90deg, #6b4d1547, transparent 85%);
}
.sc-city-finale h2 {
  color: #ffe29b;
}
.sc-finale-portrait {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 4rem;
}
.sc-finale-portrait > :first-child {
  width: clamp(4rem, 16%, 6rem);
  height: 4rem;
  flex: 0 0 auto;
  overflow: hidden;
  border: 1px solid #ffdf81;
  border-radius: 0.4rem;
}
.sc-finale-portrait .sc-overline {
  color: #ffe29b;
}
.sc-street-encounter h2 {
  margin: 0;
  color: #f1c6ff;
  letter-spacing: 0.055em;
  font-size: clamp(1rem, 2cqw, 1.4rem);
  font-weight: 900;
}
.sc-street-encounter .sc-choices button {
  border-color: #d9a2ee;
  min-width: 0;
}
.sc-streets line.witnessed {
  stroke: #e6a7ff;
  stroke-width: 2.5;
  stroke-dasharray: none;
}
.sc-streets line.planned {
  stroke: #ffdc83;
  stroke-width: 3.5;
  stroke-dasharray: none;
}
.sc-scene {
  color: #dbe3ee;
  line-height: 1.4;
}
.sc-rival {
  font-size: 0.72rem !important;
  color: #b8c4d0;
}
.sc-rival strong {
  color: #ffd34d;
}
.sc-rival em {
  display: block;
  color: #e7f9bc;
}
.sc-choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.4rem;
}
.sc-city-selection .sc-choices button {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
  background: #1c2a36;
  color: #f2f6fa;
  border: 1px solid #d5ff6288;
  letter-spacing: 0.02em;
}
.sc-choices small {
  font-weight: 500;
  color: #b8c4d0;
  font-size: 0.66rem;
  line-height: 1.3;
}
.sc-story-mission {
  display: grid;
  gap: 0.35rem;
  padding: 0.65rem 0.75rem;
  border-left: 3px solid #e6a7ff;
  background: linear-gradient(110deg, #542c624d, #172332b8);
}
.sc-mission-poster {
  position: relative;
  width: 100%;
  height: clamp(7rem, 16cqw, 12rem);
  overflow: hidden;
  border: 1px solid #dba9ff80;
  border-radius: 0.4rem;
}
.sc-mission-poster :deep(.slime-art img) {
  object-position: center 30%;
}
.sc-mission-poster-label {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 0.15rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(transparent, #0e1223ef 28%);
  color: #fce5ff;
  text-shadow: 0 1px 6px #080b15;
}
.sc-mission-poster-label small {
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}
.sc-mission-poster-label strong {
  font-size: clamp(0.8rem, 1.7cqw, 1.2rem);
}
.sc-mission-ready {
  display: grid;
  gap: 0.35rem;
}
.sc-mission-terms {
  color: #d9fbb3;
  font-size: 0.67rem;
  font-weight: 750;
}
.sc-story-mission > strong {
  font-size: 1rem;
  color: #f9d5ff;
}
.sc-mission-hint {
  color: #fee5aa;
  font-size: 0.72rem;
}
.sc-route {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.55rem 0.7rem;
  border-left: 3px solid #ffdc83;
  background: #ffdc8315;
}
.sc-route strong {
  font-size: 0.8rem;
  line-height: 1.35;
  color: #fff1c6;
}
.sc-route small {
  color: #cdd9e2;
  font-size: 0.7rem;
}
.sc-city-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  border-top: 1px solid #6b778466;
  padding-top: 0.55rem;
}
.sc-city-selection .sc-city-nav button {
  background: #283348;
  color: #e7f9bc;
  border: 1px solid #b5ca8c99;
}
.sc-decided {
  font-size: 0.72rem;
  color: #e7f9bc;
}
.sc-gate {
  color: #ffb27a;
  font-size: 0.7rem;
}
.sc-city-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
.sc-city-selection button:disabled {
  opacity: 0.45;
}
.sc-city-selection button.sc-quiet {
  background: transparent;
  color: #e7f9bc;
  border: 1px solid #d5ff6288;
}
.sc-city-selection button {
  flex: none;
  background: #c8f960;
  border-radius: 0.3rem;
  color: #192018;
  font-size: 0.72rem;
  font-weight: 1000;
  padding: 0.65rem 0.8rem;
  letter-spacing: 0.07em;
}
.sc-keywords {
  margin: 0.2rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.15rem;
  font-size: 0.58rem;
  color: #d9e5ec;
}
.sc-keywords b {
  color: var(--tone);
  letter-spacing: 0.06em;
}
.sc-collection {
  gap: 0.4rem;
  padding: 0.5rem 0.6rem 0;
  background:
    radial-gradient(ellipse at 50% -10%, #413e63, transparent 60%),
    radial-gradient(ellipse at 50% 120%, #1c3a3a, transparent 55%), #0f1622;
}
.sc-collection-title {
  flex: none;
  padding: 0 0.35rem;
}
.sc-collection-title summary {
  cursor: pointer;
  list-style: none;
}
.sc-collection-title summary::-webkit-details-marker {
  display: none;
}
.sc-collection-title summary .sc-overline {
  display: inline-block;
  font-size: 0.56rem;
}
.sc-collection-title summary .sc-overline::before {
  content: '▸ ';
  color: #c5ff59;
}
.sc-collection-title[open] summary .sc-overline::before {
  content: '▾ ';
}
.sc-collection-title p {
  font-size: 0.74rem;
  line-height: 1.4;
  margin: 0.25rem 0 0;
  color: #cbd1df;
  max-width: 56rem;
}
.sc-collection-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 10.5rem), 1fr));
  gap: 0.9rem 0.75rem;
  align-content: start;
  align-items: start;
  margin: 0;
  padding: 0.5rem 0.35rem 1.25rem;
  list-style: none;
}
@container (min-width: 1100px) {
  .sc-collection-grid {
    grid-template-columns: repeat(auto-fill, minmax(12.5rem, 1fr));
    gap: 1.1rem 0.9rem;
  }
}
.sc-collect {
  position: relative;
  min-width: 0;
  transition:
    transform 0.18s cubic-bezier(0.2, 0.9, 0.25, 1.2),
    filter 0.18s,
    opacity 0.18s;
}
.sc-collect.is-deck {
  filter: drop-shadow(0 0 6px #c5ff5966);
}
.sc-collect:hover,
.sc-collect:focus-within {
  z-index: 1;
  transform: translateY(-3px);
  filter: drop-shadow(0 0 10px #c5ff5973);
}
.sc-collect.is-locked .scc {
  filter: saturate(0.3) brightness(0.78);
}
.sc-collection-grid.swapping .sc-collect:not(.is-eligible, .is-selected) {
  opacity: 0.45;
}
.sc-collect.is-eligible {
  filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 10px #6fe7ff);
}
.sc-collect.is-selected {
  transform: translateY(-4px) scale(1.02);
  filter: drop-shadow(0 0 1px #fff) drop-shadow(0 0 14px #f8ffad);
}
.sc-collect-ribbon {
  padding: 0.28em 0.6em;
  border-radius: 0.3em;
  background: #0b1019e6;
  border: 1px solid #ffffff3a;
  color: #dfe7f2;
  font-size: max(0.5rem, 3.6cqw);
  font-weight: 950;
  letter-spacing: 0.12em;
  white-space: nowrap;
  box-shadow: 0 2px 6px #000a;
}
.is-deck .sc-collect-ribbon {
  background: #c5ff59;
  border-color: #efffc4;
  color: #142016;
}
.is-owned .sc-collect-ribbon {
  border-color: #6fc8ff99;
  color: #bfe6ff;
}
.is-starter .sc-collect-ribbon {
  color: #f6dfa7;
}
.is-selected .sc-collect-ribbon {
  background: #f8ffad;
  color: #2a2410;
}
.is-eligible .sc-collect-ribbon {
  background: #6fe7ff;
  border-color: #dff9ff;
  color: #06222b;
}
.sc-collect-pick {
  position: absolute;
  inset: 0;
  z-index: 3;
  width: 100%;
  border: 0;
  border-radius: 0.9rem;
  background: transparent;
  cursor: pointer;
}
.sc-collect-pick:focus-visible {
  outline: 3px solid #c5ff59;
  outline-offset: 3px;
}
.sc-art-summary {
  color: #c8f2a1 !important;
  font-size: 0.65rem !important;
  letter-spacing: 0.04em;
}
@container (max-width: 900px) {
  .sc-crew {
    width: 1.9rem;
    height: 1.9rem;
  }
}
/*
  ALL FIVE VIEW TABS, ALWAYS. Silas, 2026-11-02: "worried that the city arena
  story cards section is not showing everything." It wasn't -- the docked bar
  (often ~600px wide beside the site icons) gave the tabs what the six full-size
  crew badges left over, and REWARDS scrolled out of sight. In that middle band
  the crews fold into a 3x2 grid of small badges instead, which frees ~170px.
  Below 600px the header already wraps the crews onto their own row.
*/
@container (min-width: 601px) and (max-width: 960px) {
  .sc-crew-picker {
    display: grid;
    grid-template-columns: repeat(3, auto);
    gap: 2px;
    padding: 2px;
    border-radius: 0.4rem;
  }
  .sc-crew {
    width: 1.15rem;
    height: 1.15rem;
    border-width: 1px;
    border-radius: 0.25rem;
  }
  .sc-crew:hover {
    transform: none;
  }
  .sc-tabs button {
    min-width: 0;
    padding: 0.4rem 0.6rem;
    letter-spacing: 0.08em;
  }
}
@container (max-width: 600px) {
  .sc-header {
    padding: 0.2rem 0.25rem 0.2rem 0.6rem;
    gap: 0.4rem;
  }
  .sc-hud {
    display: none;
  }
  .sc-tabs button {
    padding: 0.35rem 0.5rem;
    min-width: 3rem;
    font-size: 0.57rem;
  }
  .sc-header {
    flex-wrap: wrap;
    row-gap: 0.3rem;
  }
  .sc-crew-picker {
    order: 2;
    width: 100%;
    justify-content: center;
  }
  .sc-crew {
    width: 2rem;
    height: 2rem;
  }
  .sc-city-selection {
    margin: 0.3rem;
    padding: 0.4rem;
    gap: 0.25rem;
  }
  .sc-city-selection p {
    font-size: 0.62rem;
  }
  .sc-city-selection button {
    padding: 0.45rem;
    font-size: 0.57rem;
  }
  .sc-district-pin {
    height: 1.3rem;
    width: 1.3rem;
    font-size: 0.55rem;
  }
  .sc-district-label {
    font-size: 0.43rem;
    max-width: 5rem;
  }
  .sc-city-overline {
    left: 0.4rem;
    top: 0.4rem;
    font-size: 0.55rem;
  }
}
@container (max-width: 680px) {
  .sc-brand {
    display: none;
  }
}
@container (max-width: 420px) {
  .sc-header {
    padding-left: 0.25rem;
  }
  .sc-tabs {
    flex: 1 1 auto;
  }
  .sc-tabs button {
    flex: 1 0 auto;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sc-crew {
    transition: none;
  }
  .sc-district-pin {
    box-shadow: none;
  }
}
/*
  CARD DETAIL LIVES IN THE SIDE COLUMN. Silas, 2026-11-02: "the slime city card
  should appear on the right side open space, not overlaid onto the map." It
  was an absolute overlay inside the board backdrop and hid the arena; it now
  heads the match-controls column, which scrolls while a card is open. On a
  phone-width console the column folds under the board, so there (and only
  there) it floats over the stage again -- see the 600px block below.
*/

.sc-progression {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: radial-gradient(ellipse at top, #29233e, #101322 73%);
}
.sc-progression-top {
  padding: clamp(0.7rem, 2cqw, 1.4rem);
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}
.sc-progression-top h2 {
  margin: 0.2rem 0;
  font-size: clamp(1.4rem, 3.4cqw, 2.8rem);
  letter-spacing: -0.025em;
}
.sc-progression-top p {
  margin: 0;
  max-width: 45rem;
  font-size: 0.8rem;
  color: #cfcae5;
}
.sc-progress-hud {
  display: grid;
  text-align: right;
  flex-shrink: 0;
  gap: 0.2rem;
}
.sc-progress-hud strong {
  color: #c8ff78;
  font-size: 1.3rem;
}
.sc-progress-hud span {
  font-size: 0.66rem;
}
.sc-progress-hud b {
  color: #ffd66e;
}
.sc-progression-scroll {
  padding: 0 1rem 1rem;
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 0.7rem;
}
.sc-reward-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.7rem;
}
.sc-reward-panel {
  display: grid;
  align-content: start;
  gap: 0.5rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid #8070a3;
  border-radius: 0.7rem;
  background: #191c30e8;
}
.sc-reward-panel > strong {
  font-size: 1.2rem;
}
.sc-reward-panel p {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.4;
  color: #e2dfea;
}
.sc-reward-panel > small {
  font-size: 0.67rem;
  color: #cfcde3;
}
.sc-reward-panel > button,
.sc-challenge button {
  border-radius: 0.4rem;
  border: 1px solid #c8ff78;
  background: #c8ff78;
  color: #19221a;
  font-size: 0.78rem;
  font-weight: 900;
  padding: 0.6rem;
}
.sc-reward-panel button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #454a5b;
  color: #d2d3de;
}
.sc-pack-art {
  min-height: 8rem;
  display: grid;
  place-content: center;
  text-align: center;
  background: radial-gradient(circle at center, #954cbd, #36224a 72%);
  border: 3px double #e9b6ff;
  border-radius: 0.55rem;
  transform: rotate(-1deg);
}
.sc-pack-art span {
  font-size: 3rem;
  line-height: 1;
  color: #f4d27d;
  text-shadow: 0 0 16px #ffe38d;
}
.sc-pack-art b {
  font-size: 1.3rem;
  letter-spacing: 0.12em;
}
.sc-pack-art small {
  color: #ffd88b;
  font-size: 0.65rem;
}
.sc-pack-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr));
  align-items: start;
  gap: 0.9rem;
  width: 100%;
  max-width: 48rem;
}
.sc-pack-cards small {
  color: #cfcde3;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-align: center;
}
.sc-challenge-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}
.sc-challenge {
  background: #29273c;
  border: 1px solid #65607c;
  border-radius: 0.5rem;
  padding: 0.6rem;
  display: grid;
  align-content: start;
  gap: 0.3rem;
}
.sc-challenge > span,
.sc-challenge > small {
  color: #f5d9a5;
  font-size: 0.65rem;
}
.sc-challenge strong {
  font-size: 0.9rem;
}
.sc-challenge p {
  font-size: 0.7rem;
}
.sc-progression-note {
  color: #a5a1b9;
  font-size: 0.64rem;
}
@container (max-width: 700px) {
  .sc-reward-columns {
    grid-template-columns: 1fr;
  }
  .sc-progression-top {
    padding: 0.65rem;
  }
  .sc-challenge-grid {
    grid-template-columns: 1fr;
  }
  .sc-progression-scroll {
    padding: 0 0.6rem 0.7rem;
  }
}
.sc-progress-alert {
  margin: 0;
  padding: 0.5rem 0.75rem;
  background: #35405a;
  border: 1px solid #9ab7d8;
  font-size: 0.75rem;
  border-radius: 0.4rem;
}
.sc-progress-error {
  background: #4b233a;
  border-color: #ff8db3;
}
.sc-deck-workbench {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.35rem 0.4rem 0.35rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--tone) 40%, #4d5567);
  border-radius: 0.6rem;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--tone) 18%, transparent),
      transparent 40%
    ),
    #0e1420e6;
  box-shadow:
    inset 0 -1px 0 color-mix(in srgb, var(--tone) 55%, transparent),
    0 6px 18px #0007;
}
.sc-deck-meter {
  flex: none;
  display: grid;
  justify-items: center;
  gap: 0.2rem;
}
.sc-deck-meter strong {
  color: #fff;
  font-size: 1.15rem;
  font-weight: 1000;
  line-height: 1;
}
.sc-deck-meter strong small {
  color: #a6aac0;
  font-size: 0.62rem;
}
.sc-deck-pips {
  display: grid;
  grid-template-columns: repeat(5, 0.42rem);
  gap: 2px;
}
.sc-deck-pips i {
  height: 0.28rem;
  border-radius: 1px;
  background: #ffffff1f;
}
.sc-deck-pips i.on {
  background: var(--tone);
  box-shadow: 0 0 4px var(--tone);
}
.sc-deck-status {
  flex: 1;
  min-width: 0;
}
.sc-deck-status .sc-overline {
  font-size: 0.54rem;
  letter-spacing: 0.16em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sc-deck-workbench p {
  margin: 0.1rem 0 0;
  color: #e4edf3;
  font-size: 0.74rem;
  line-height: 1.3;
}
.sc-deck-workbench small {
  display: block;
  color: #ffb9b9;
  font-size: 0.64rem;
}
.sc-deck-actions {
  flex: none;
  display: flex;
  gap: 0.35rem;
}
.sc-deck-actions button {
  padding: 0.45rem 0.65rem;
  border: 1px solid #b8d6bd66;
  border-radius: 0.4rem;
  background: #1b2a2c;
  color: #e9f6ee;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
.sc-deck-actions button[data-testid='slime-deck-practice'] {
  border-color: #c5ff59;
  background: #c5ff59;
  color: #142016;
  box-shadow: 0 0 14px #c5ff5944;
}
.sc-deck-actions button:disabled {
  opacity: 0.5;
}
@container (max-width: 600px) {
  .sc-deck-workbench {
    flex-wrap: wrap;
    gap: 0.35rem 0.55rem;
  }
  .sc-deck-status {
    flex-basis: calc(100% - 4rem);
  }
  .sc-deck-actions {
    flex: 1 1 100%;
  }
  .sc-deck-actions button {
    flex: 1;
  }
}
</style>
