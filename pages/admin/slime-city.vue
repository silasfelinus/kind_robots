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

      <div class="sc-main" :class="{ 'has-controls': lab.view === 'arena' }">
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
                            storyMissionTerms(
                              lab.city,
                              lab.districtId,
                              choice.terms,
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
        <section
          v-else-if="lab.view === 'arena'"
          class="sc-stage sc-arena-stage"
          aria-label="Prototype combat arena"
        >
          <div class="sc-arena-head">
            <div>
              <span class="sc-overline">SEED {{ lab.match.seed }}</span>
              <span
                v-if="lab.campaignBout && lab.activeChapter"
                class="sc-overline sc-bout-line"
                data-testid="slime-campaign-bout-line"
                >STORY CHAPTER {{ lab.campaignBout.index + 1 }}/5 ·
                {{ lab.activeChapter.title }}</span
              >
              <span
                v-if="lab.boutPlan"
                class="sc-overline sc-bout-line"
                data-testid="slime-bout-line"
                >RIVAL BOUT · {{ lab.boutPlan.rival.name }} ·
                {{ lab.boutPlan.street }}</span
              >
              <nav
                class="sc-mode-tabs"
                aria-label="Game mode"
                data-testid="slime-mode-tabs"
              >
                <button
                  v-for="preset in lab.modes"
                  :key="preset.id"
                  type="button"
                  :class="{ active: lab.mode === preset.id }"
                  :aria-pressed="lab.mode === preset.id"
                  :data-testid="'slime-mode-' + preset.id"
                  @click="lab.mode === preset.id || lab.chooseMode(preset.id)"
                >
                  <SlimeCityArtwork
                    class="sc-mode-paint"
                    :image-id="slimeArtId('boards', preset.id)"
                    :alt="preset.title + ' board artwork'"
                    compact
                  />
                  <strong>{{ preset.title }}</strong
                  ><small>{{ preset.size }} · {{ preset.cadence }}</small>
                </button>
              </nav>
            </div>
            <div class="sc-arena-scores">
              <span v-if="lab.mode === 'blackout'"
                >FLAG <b>{{ flagStatus }}</b></span
              >
              <template v-else>
                <span
                  >YOU <b>{{ lab.match.score[0] }}</b></span
                ><span
                  >ENEMY <b>{{ lab.match.score[1] }}</b></span
                >
              </template>
              <button
                type="button"
                class="sc-help"
                data-testid="slime-how-to-play"
                :aria-expanded="lab.guideOpen"
                @click="lab.toggleGuide()"
              >
                HOW TO PLAY
              </button>
            </div>
          </div>
          <div class="sc-arena-backdrop">
            <SlimeCityArtwork
              class="sc-board-paint"
              :image-id="slimeArtId('boards', lab.mode)"
              :alt="currentMode.title + ' painted arena background'"
              fallback="▦"
              compact
            />
            <div
              class="sc-board"
              :class="'sc-board-' + lab.mode"
              :style="{
                gridTemplateColumns:
                  'repeat(' + lab.match.width + ', minmax(0, 1fr))',
                gridTemplateRows:
                  'repeat(' + lab.match.height + ', minmax(0, 1fr))',
              }"
              role="group"
              :aria-label="currentMode.size + ' square-grid battlefield'"
            >
              <SlimeCityArtwork
                class="sc-board-floor"
                :image-id="slimeArtId('boards', lab.mode)"
                :alt="currentMode.title + ' painted board'"
                compact
              />
              <button
                v-for="cell in lab.board"
                :key="cell.x + '-' + cell.y"
                type="button"
                class="sc-tile"
                :class="{
                  home: cell.x === 0,
                  away: cell.x === lab.match.width - 1,
                  flag:
                    lab.mode === 'blackout' &&
                    cell.x === lab.sight.flag.x &&
                    cell.y === lab.sight.flag.y,
                  target:
                    lab.selectedUnit !== null || lab.selectedCard !== null,
                  lair: monsterHere(cell.x, cell.y),
                  neutral:
                    lab.mode === 'blackout' &&
                    cell.x >= 2 &&
                    cell.x < lab.match.width - 2,
                  legalMove: lab.canMoveTo(cell.x, cell.y),
                  inRange:
                    !!fighterAt(cell.x, cell.y) &&
                    lab.attackTargets.includes(fighterAt(cell.x, cell.y)!.id),
                  marked:
                    !!fighterAt(cell.x, cell.y) &&
                    lab.targetUnit === fighterAt(cell.x, cell.y)!.id,
                }"
                :data-testid="'slime-tile-' + cell.x + '-' + cell.y"
                :aria-label="cellAria(cell.x, cell.y)"
                @click="lab.touchSquare(cell.x, cell.y)"
              >
                <span
                  v-if="
                    lab.mode === 'blackout' &&
                    cell.x === lab.sight.flag.x &&
                    cell.y === lab.sight.flag.y
                  "
                  class="sc-flag"
                  >⚑</span
                >
                <span v-if="visibleTrap(cell.x, cell.y)" class="sc-trap"
                  >◇</span
                >
                <span
                  v-if="monsterHere(cell.x, cell.y)"
                  class="sc-monster"
                  data-testid="slime-monster"
                  ><span>❂</span
                  ><small>{{ lab.sight.monster?.hp }}</small></span
                >
                <span
                  v-if="fighterAt(cell.x, cell.y)"
                  class="sc-fighter"
                  :class="[
                    fighterAt(cell.x, cell.y)?.side === 'player'
                      ? 'friendly'
                      : 'hostile',
                    {
                      selected:
                        lab.selectedUnit === fighterAt(cell.x, cell.y)?.id,
                      sealed: fighterAt(cell.x, cell.y)?.hidden,
                      carrier: fighterAt(cell.x, cell.y)?.carryingFlag,
                      rooted: fighterAt(cell.x, cell.y)?.rooted,
                    },
                  ]"
                >
                  <span>{{ fighterSymbol(cell.x, cell.y) }}</span>
                  <small>{{ fighterHp(cell.x, cell.y) }}</small>
                </span>
              </button>
            </div>
            <div
              v-if="lab.previewOpen && lab.inspectedCard"
              class="sc-card-overlay"
              role="dialog"
              aria-modal="false"
              :aria-label="lab.inspectedCard.name + ' card details'"
              data-testid="slime-card-preview"
            >
              <div class="sc-card-poster" :class="'tone-' + lab.team.color">
                <SlimeCityArtwork
                  class="sc-inspected-paint"
                  :image-id="slimeArtId('cards', lab.inspectedCard.id)"
                  :alt="
                    lab.inspectedCard.name + ' illustrated collectible card'
                  "
                  :fallback="lab.inspectedCard.symbol"
                />
              </div>
              <div class="sc-card-information">
                <span class="sc-overline"
                  >{{ lab.inspectedCard.kind.toUpperCase() }} ·
                  {{ lab.inspectedCard.cost }} MANA</span
                >
                <h3>{{ lab.inspectedCard.name }}</h3>
                <p
                  v-if="lab.inspectedCard.kind === 'creature'"
                  class="sc-card-stats"
                >
                  ATK {{ lab.inspectedCard.attack }} · HP
                  {{ lab.inspectedCard.hp }} · ARMOR
                  {{ lab.inspectedCard.armor }} · MOVE
                  {{ lab.inspectedCard.ap }} · RANGE
                  {{ cardAttackRange(lab.inspectedCard) }}
                </p>
                <p>{{ lab.inspectedCard.text }}</p>
                <p
                  v-if="lab.inspectedCard.keywords?.length"
                  class="sc-card-stats"
                >
                  {{
                    lab.inspectedCard.keywords
                      .map((k) => lab.keywords[k].label)
                      .join(' · ')
                  }}
                </p>
                <p
                  v-if="lab.inspectedCard.kind === 'creature'"
                  class="sc-overline"
                >
                  Newly summoned monsters cannot attack immediately.
                </p>
                <p
                  v-if="lab.inspectedCard.cost > lab.match.mana"
                  class="sc-no-mana"
                >
                  NEEDS {{ lab.inspectedCard.cost }} MANA · YOU HAVE
                  {{ lab.match.mana }}
                </p>
                <div class="sc-card-cta">
                  <button
                    type="button"
                    data-testid="slime-card-choose-target"
                    @click="lab.closePreview()"
                  >
                    {{
                      lab.inspectedCard.cost <= lab.match.mana
                        ? 'CHOOSE TARGET →'
                        : 'BACK TO ARENA'
                    }}
                  </button>
                  <button
                    type="button"
                    class="sc-quiet"
                    @click="lab.chooseCard(lab.inspectedCard.id)"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
            <div v-if="lab.match.victor" class="sc-result" role="status">
              <strong>{{
                lab.match.victor === 'player'
                  ? 'VICTORY IN THE PIT'
                  : lab.match.victor === 'draw'
                    ? 'MUTUAL DESTRUCTION'
                    : 'THE PIT CLAIMS YOU'
              }}</strong
              ><span>{{ winLine }}</span
              ><span class="sc-result-actions"
                ><button
                  v-if="lab.lastBout || lab.lastContract || lab.lastCampaign"
                  type="button"
                  @click="
                    lab.lastCampaign ? lab.showCampaign() : lab.showCity()
                  "
                >
                  {{
                    lab.lastCampaign ? 'BACK TO STORY' : 'BACK TO THE CITY'
                  }}</button
                ><button type="button" @click="lab.reset(true)">
                  SAME SEED</button
                ><button type="button" @click="lab.reset()">
                  NEW SEED
                </button></span
              >
            </div>
            <div
              v-if="lab.guideOpen"
              class="sc-guide kr-scroll"
              role="dialog"
              aria-modal="false"
              :aria-label="'How to play ' + currentMode.title"
              data-testid="slime-guide"
            >
              <span class="sc-overline"
                >HOW TO PLAY / {{ currentMode.title }}</span
              >
              <p class="sc-guide-goal">{{ lab.guide.goal }}</p>
              <ol>
                <li v-for="step in lab.guide.steps" :key="step">{{ step }}</li>
              </ol>
              <span class="sc-overline">PROTOTYPE LIMITS</span>
              <ul>
                <li v-for="item in lab.guide.limits" :key="item">
                  {{ item }}
                </li>
              </ul>
              <p class="sc-guide-seed">
                Seed {{ lab.match.seed }}: the same seed and the same moves
                replay the same match.
              </p>
              <button
                type="button"
                data-testid="slime-guide-close"
                @click="lab.closeGuide()"
              >
                GOT IT · PLAY
              </button>
            </div>
          </div>
          <SlimeCityHand />
          <div class="sc-battle-bottom">
            <span
              >{{ lab.mode === 'bloodrush' ? 'TICK' : 'ROUND' }}
              {{ lab.match.round }}/{{ lab.match.maxRounds }} ·
              {{ lab.match.mana }} MANA<template v-if="lab.sight.debt[0]">
                · OWES {{ lab.sight.debt[0] }}</template
              ><template v-if="lab.match.overtime"> · SUDDEN DEATH</template
              ><template v-if="lab.sight.monster">
                · MONSTER {{ lab.sight.monster.hp }}/{{
                  lab.sight.monster.maxHp
                }}</template
              ></span
            >
            <span aria-live="polite">{{ lab.match.log[0] }}</span>
            <button
              v-if="lab.mode !== 'bloodrush'"
              type="button"
              :disabled="!!lab.match.victor"
              data-testid="slime-next-round"
              @click="lab.nextRound()"
            >
              END ROUND ↻
            </button>
            <button
              v-else
              type="button"
              :disabled="!!lab.match.victor"
              data-testid="slime-toggle-rush"
              @click="lab.toggleRush()"
            >
              {{ lab.running ? 'PAUSE ■' : 'RUN ▶' }}
            </button>
          </div>
        </section>

        <section
          v-else-if="lab.view === 'cards'"
          class="sc-stage sc-collection"
          aria-label="Special cards and creature collection"
        >
          <div class="sc-collection-title">
            <span class="sc-overline"
              >THE ARMORY / DECK WORKBENCH · {{ lab.progress.cards.length }}/72
              COLLECTED</span
            >
            <h2>{{ lab.team.name }}</h2>
            <p>{{ lab.team.hook }}</p>
            <p data-testid="slime-crew-pattern">
              <b>PLAY PATTERN</b> {{ lab.team.pattern }}
            </p>
            <p data-testid="slime-crew-counters">
              <b>HOW TO BEAT THEM</b> {{ lab.team.counters }}
            </p>
            <p class="sc-art-summary" data-testid="slime-art-provenance">
              ROUND ONE: {{ SLIME_CITY_ART_COUNT }} RENDERED IDS ·
              {{ art.loadedCount }} VERIFIED IN BROWSER ·
              {{ art.failedCount }} UNAVAILABLE · 24 STARTER CARDS STILL NEED
              ART
            </p>
          </div>
          <div class="sc-deck-workbench" data-testid="slime-deck-workbench">
            <div>
              <span class="sc-overline"
                >TEN-CARD LOADOUT / FOUR CREATURES / ONE SIGNATURE</span
              >
              <strong>{{ lab.currentDeck.length }}/10 DECK SLOTS FILLED</strong>
              <p aria-live="polite">
                {{
                  lab.deckMessage ||
                  (lab.replacingCard
                    ? 'Replace ' +
                      lab.cards.find((card) => card.id === lab.replacingCard)
                        ?.name +
                      ' with an owned card of the same type.'
                    : 'Select a deck card, then an owned reserve to swap. Starter cards stay playable for everyone.')
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
          <div class="sc-collection-grid kr-scroll">
            <article
              v-for="card in lab.cards"
              :key="card.id"
              class="sc-collect-card"
              :class="'tone-' + lab.team.color"
            >
              <div class="sc-collect-art">
                <SlimeCityArtwork
                  :image-id="slimeArtId('cards', card.id)"
                  :alt="card.name + ' collectible card artwork'"
                  :fallback="card.symbol"
                />
              </div>
              <div>
                <button
                  type="button"
                  class="sc-deck-card-choice"
                  :class="{
                    selected: lab.replacingCard === card.id,
                    equipped: lab.currentDeck.includes(card.id),
                  }"
                  :data-testid="'slime-deck-card-' + card.id"
                  :aria-pressed="lab.currentDeck.includes(card.id)"
                  @click="lab.selectDeckCard(card.id)"
                >
                  {{
                    lab.currentDeck.includes(card.id)
                      ? lab.replacingCard === card.id
                        ? 'CHOOSE REPLACEMENT'
                        : 'IN DECK · REPLACE'
                      : lab.isCardUnlocked(card.id)
                        ? 'OWNED RESERVE · ADD'
                        : 'LOCKED RESERVE'
                  }}
                </button>
                <span
                  >{{ lab.cardRarity(card).toUpperCase() }} ·
                  {{
                    lab.progress.cards.includes(card.id)
                      ? 'OWNED'
                      : lab.isFounderCard(card.id)
                        ? 'STARTER'
                        : 'LOCKED'
                  }}
                  · {{ card.kind.toUpperCase() }} ·
                  {{ card.cost }} MANA<template v-if="card.signature">
                    · SIGNATURE</template
                  ></span
                ><strong>{{ card.name }}</strong>
                <p>{{ card.text }}</p>
                <ul
                  v-if="(card.keywords ?? card.grants ?? []).length"
                  class="sc-keywords"
                >
                  <li
                    v-for="k in card.keywords ?? card.grants ?? []"
                    :key="k"
                    :title="lab.keywords[k].text"
                  >
                    <b>{{ lab.keywords[k].label }}</b>
                    {{ lab.keywords[k].text }}
                  </li>
                </ul>
              </div>
              <small v-if="card.kind === 'creature'"
                >ATK {{ card.attack }} / HP {{ card.hp }} / ARMOR
                {{ card.armor }} / AP {{ card.ap }}</small
              >
            </article>
          </div>
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
                <article
                  v-for="id in lab.progress.lastPack"
                  :key="id"
                  :class="'rarity-' + lab.cardRarity(cardById(id))"
                >
                  <span class="sc-pack-face">{{ cardById(id).symbol }}</span>
                  <strong>{{ cardById(id).name }}</strong>
                  <small
                    >{{ lab.cardRarity(cardById(id)).toUpperCase() }} ·
                    {{ teamName(cardById(id).team) }}</small
                  >
                </article>
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

        <aside
          v-if="lab.view === 'arena'"
          class="sc-controls"
          aria-label="Match controls"
        >
          <div class="sc-rules" data-testid="slime-rules">
            <span class="sc-overline">RULE VARIANTS · RESTART SAME SEED</span>
            <div class="sc-rule-list">
              <button
                v-for="variant in lab.variants"
                :key="variant.id"
                type="button"
                class="sc-rule"
                :class="{ on: lab.rules[variant.id] }"
                :aria-pressed="lab.rules[variant.id]"
                :title="variant.text"
                :data-testid="'slime-rule-' + variant.id"
                @click="lab.toggleRule(variant.id)"
              >
                {{ variant.label }}
              </button>
            </div>
            <small v-if="activeRules.length" class="sc-rule-note">{{
              activeRules.map((v) => v.text).join(' ')
            }}</small>
          </div>
          <template v-if="lab.view === 'arena'">
            <div class="sc-actions">
              <p v-if="lab.selected" class="sc-selected-line">
                {{ lab.unitLabel(lab.selected.cardId) }} · HP
                {{ lab.selected.hp }}/{{ lab.selected.maxHp }} · ATK
                {{ lab.selected.attack }} · ARMOR {{ lab.selected.armor }} · AP
                {{ lab.selected.ap }}/{{ lab.selected.maxAp
                }}<template v-if="lab.selected.keywords?.length">
                  ·
                  {{
                    lab.selected.keywords
                      .map((k) => lab.keywords[k].label)
                      .join(' ')
                  }}</template
                >
              </p>
              <div
                v-if="lab.mode === 'blackout' && lab.selected"
                class="sc-action-deck"
                data-testid="slime-attack-actions"
              >
                <span class="sc-overline"
                  >SELECT AN ENEMY HIGHLIGHTED IN RED TO ATTACK</span
                >
                <button
                  type="button"
                  class="sc-attack-button"
                  data-testid="slime-attack"
                  :disabled="lab.targetUnit === null"
                  @click="lab.attackSelected()"
                >
                  <span class="sc-attack-symbol">{{ attackSymbol }}</span>
                  {{ (lab.selected.attackStyle ?? 'sword').toUpperCase() }}
                  ATTACK
                  <span>{{
                    lab.targetUnit !== null
                      ? lab.attackPreview + ' DAMAGE'
                      : 'CHOOSE TARGET'
                  }}</span>
                </button>
                <small
                  v-if="
                    lab.selected.summonedRound === lab.match.round &&
                    !lab.selected.keywords?.includes('ambush')
                  "
                >
                  JUST SUMMONED · CAN MOVE, CANNOT ATTACK UNTIL NEXT ROUND
                </small>
                <small
                  v-else-if="lab.selected.attackedRound === lab.match.round"
                >
                  ALREADY ATTACKED THIS ROUND
                </small>
                <small v-else
                  >RANGE {{ lab.selected.range ?? 1 }} · MOVE AP
                  {{ lab.selected.ap }}</small
                >
              </div>
              <ol class="sc-log" aria-label="Recent events">
                <li v-for="(line, i) in lab.match.log.slice(0, 6)" :key="i">
                  {{ line }}
                </li>
              </ol>
              <button
                v-if="lab.selected?.hidden"
                class="sc-reveal"
                type="button"
                @click="lab.unmask()"
              >
                REVEAL SELECTED FIGHTER
              </button>
              <span class="sc-reset-row"
                ><button
                  class="sc-reset"
                  type="button"
                  @click="lab.reset(true)"
                >
                  SAME SEED ↺</button
                ><button class="sc-reset" type="button" @click="lab.reset()">
                  NEW SEED ↻
                </button></span
              >
            </div>
          </template>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import {
  cardAttackRange,
  cardById,
  type ViewFighter,
} from '~/utils/slimeCity/prototypes'
import { STREETS, boutTerms, storyMissionTerms } from '~/utils/slimeCity/city'
import { describeTerms } from '~/utils/slimeCity/campaign'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { slimeArtId, SLIME_CITY_ART_COUNT } from '~/utils/slimeCity/artManifest'
import { useSlimeCityArtStore } from '~/stores/slimeCityArt'

const lab = useSlimeCityStore()
const art = useSlimeCityArtStore()
const currentMode = computed(
  () => lab.modes.find((mode) => mode.id === lab.mode) || lab.modes[0]!,
)

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
const attackSymbol = computed(
  () =>
    ({
      sword: '⚔',
      arrow: '➶',
      spell: '✦',
      claw: '✥',
      hammer: '✣',
      blast: '✷',
    })[lab.selected?.attackStyle ?? 'sword'],
)
const flagStatus = computed(() => {
  const carrier = lab.sight.units.find((unit) => unit.carryingFlag)
  if (!carrier) return 'LOOSE'
  return carrier.side === 'player' ? 'YOURS' : 'TAKEN'
})
const activeRules = computed(() => lab.variants.filter((v) => lab.rules[v.id]))
function monsterHere(x: number, y: number): boolean {
  const m = lab.sight.monster
  return !!m && m.x === x && m.y === y
}
const winLine = computed(() => {
  const how = {
    flag: 'Flag carried home.',
    score: 'Breakthroughs decided it.',
    rout: 'One side was routed.',
    time: 'Round limit reached.',
    monster: 'The giant monster fell.',
  }
  return lab.match.winPath ? how[lab.match.winPath] : ''
})

// The board draws only what the player may know (lab.sight): concealed
// enemies carry no identity and enemy traps are absent.
function fighterAt(x: number, y: number): ViewFighter | undefined {
  return lab.sight.units.find((unit) => unit.x === x && unit.y === y)
}
function fighterSymbol(x: number, y: number): string {
  const unit = fighterAt(x, y)
  if (!unit) return ''
  if (!unit.cardId) return '?'
  return cardById(unit.cardId).symbol
}
function fighterHp(x: number, y: number): string {
  const unit = fighterAt(x, y)
  return unit?.hp == null ? '' : String(unit.hp)
}
function visibleTrap(x: number, y: number): boolean {
  return lab.sight.traps.some((trap) => trap.x === x && trap.y === y)
}
function cellAria(x: number, y: number): string {
  const unit = fighterAt(x, y)
  const name = unit
    ? !unit.cardId
      ? 'hidden enemy'
      : (unit.side === 'enemy' ? 'enemy ' : '') +
        cardById(unit.cardId).name +
        ', ' +
        unit.hp +
        ' hit points' +
        (unit.carryingFlag ? ', carrying the flag' : '')
    : 'empty'
  const flag =
    lab.mode === 'blackout' &&
    !unit &&
    x === lab.sight.flag.x &&
    y === lab.sight.flag.y
      ? ', flag'
      : ''
  const monster = monsterHere(x, y)
    ? 'giant monster, ' + lab.sight.monster!.hp + ' hit points'
    : ''
  return 'Square ' + (x + 1) + ', ' + (y + 1) + ': ' + (monster || name + flag)
}
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
  scrollbar-width: none;
  border: 1px solid #4d5567;
  border-radius: 0.6rem;
  background: #0e1420;
}
.sc-tabs::-webkit-scrollbar {
  display: none;
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
.sc-main.has-controls {
  grid-template-columns: minmax(0, 1fr) minmax(13rem, 18rem);
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
.sc-bout-line {
  color: #ffd34d;
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
.sc-city-selection button,
.sc-battle-bottom button,
.sc-result button {
  flex: none;
  background: #c8f960;
  border-radius: 0.3rem;
  color: #192018;
  font-size: 0.72rem;
  font-weight: 1000;
  padding: 0.65rem 0.8rem;
  letter-spacing: 0.07em;
}
.sc-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
  overflow: hidden;
  padding: 1rem 0.75rem;
  border-left: 1px solid #66738855;
  background: linear-gradient(130deg, #151e2c, #0a1019);
}
.sc-control-heading {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.sc-control-heading strong {
  font-size: 1.03rem;
  letter-spacing: 0.07em;
}
.sc-actions {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  gap: 0.5rem;
}
.sc-actions .sc-control-heading {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: 0.61rem;
  color: #bfff82;
}
.sc-reveal,
.sc-reset {
  flex: none;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #aac47d8b;
  border-radius: 0.3rem;
  color: #e7f9bc;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.sc-arena-stage {
  background: #0b1420;
}
.sc-arena-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  background: #151d2b;
  border-bottom: 1px solid #73849a77;
}
.sc-mode-tabs {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.3rem;
}
.sc-mode-tabs button {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  min-width: 7.5rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid #60708167;
  border-radius: 0.42rem;
  background: #26304477;
  text-align: left;
  color: #fff;
}
.sc-mode-tabs .sc-mode-paint {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.35;
}
.sc-mode-tabs .sc-mode-paint :deep(img) {
  object-position: center 35%;
}
.sc-mode-tabs button.active {
  border-color: #d7fc7a;
  box-shadow:
    inset 0 -3px #d7fc7a,
    0 0 18px #c5ff5933;
}
.sc-mode-tabs button.active .sc-mode-paint {
  opacity: 0.6;
}
.sc-mode-tabs strong {
  font-size: 0.85rem;
  font-weight: 1000;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 3px #000;
}
.sc-mode-tabs small {
  color: #d3ff81;
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px #000;
}
.sc-arena-scores {
  display: flex;
  gap: 1rem;
  font-size: 0.62rem;
  font-weight: 700;
}
.sc-arena-scores span {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  color: #acb8c8;
}
.sc-arena-scores b {
  font-size: 1.1rem;
  color: #d7ff7e;
}
.sc-arena-backdrop .sc-board-paint {
  position: absolute;
  inset: 0;
  opacity: 0.53;
  pointer-events: none;
}
.sc-arena-backdrop {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 0.5rem;
  overflow: hidden;
  background: radial-gradient(ellipse, #26474c 0%, #0c1e2b 70%);
  background-image:
    repeating-linear-gradient(20deg, transparent 0 30px, #ffffff04 30px 31px),
    radial-gradient(ellipse, #26474c 0%, #0c1e2b 70%);
}
.sc-board {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(100%, 68cqh);
  max-height: 100%;
  aspect-ratio: 1 / 1;
  gap: 1px;
  border: 5px solid #72899a;
  border-radius: 0.35rem;
  background: #1e2b34;
  isolation: isolate;
  box-shadow:
    0 0 0 5px #151820,
    0 16px 40px #0009;
  overflow: hidden;
}
.sc-board-gridiron,
.sc-board-bloodrush {
  width: min(100%, 105cqw);
  aspect-ratio: 2 / 1;
  max-height: 100%;
}
.sc-board .sc-board-floor {
  position: absolute;
  inset: 0;
  z-index: 0;
  font-size: 3rem;
  pointer-events: none;
}
.sc-board .sc-board-floor :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.15);
}
.sc-tile {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  /* Translucent so the painted floor reads through the grid. */
  background: #0b1a2238;
  box-shadow: inset 0 0 0 1px #00000040;
  outline-offset: -2px;
}
.sc-tile:nth-child(even) {
  background: #0b1a2252;
}
.sc-tile.home {
  box-shadow: inset 4px 0 #9af8ff6f;
}
.sc-tile.away {
  box-shadow: inset -4px 0 #ffa1a14d;
}
.sc-tile.flag {
  background: radial-gradient(#f3e48899, #34635f33 75%);
}
.sc-tile.target:hover,
.sc-tile:focus-visible {
  outline: 2px solid #d7ff69;
  z-index: 2;
}
.sc-flag {
  position: absolute;
  color: #ffe8a1;
  font-size: clamp(0.6rem, 2vw, 1.5rem);
  opacity: 0.7;
}
.sc-tile.lair {
  background: radial-gradient(circle, #ff3fbf77, #3a103766 75%);
}
.sc-monster {
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ff9be8;
  font-size: clamp(1.1rem, 3.2vw, 2.4rem);
  line-height: 1;
  text-shadow: 0 0 14px #ff3fbf;
}
.sc-monster small {
  font-size: 0.55rem;
  color: #ffd6f4;
}
.sc-fighter.rooted {
  outline: 2px dashed #8fd3ff;
  outline-offset: -3px;
}
.sc-rules {
  display: grid;
  gap: 0.3rem;
}
.sc-rule-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.sc-rule {
  padding: 0.25rem 0.45rem;
  border: 1px solid #60708167;
  border-radius: 999px;
  background: #26304477;
  color: #c9d2de;
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.sc-rule.on {
  border-color: #ff7de0;
  background: #4a1f45;
  color: #fff;
}
.sc-rule-note {
  color: #e9b9e0;
  font-size: 0.58rem;
  line-height: 1.35;
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
.sc-trap {
  position: absolute;
  right: 0;
  top: 0;
  color: #ff98b4;
  font-size: 0.8rem;
}
.sc-fighter {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 82%;
  width: 82%;
  border-radius: 25% 25% 35% 35%;
  background: linear-gradient(145deg, #68d7ef, #246e99);
  border: 2px solid #acf2ff;
  box-shadow:
    0 4px 6px #000b,
    0 0 11px #70eeff8c;
  font-size: clamp(0.7rem, 2.1cqw, 1.8rem);
  font-weight: 1000;
  color: #faffeb;
}
.sc-fighter.hostile {
  background: linear-gradient(145deg, #eb798f, #8d354e);
  border-color: #ffc3ae;
  box-shadow:
    0 4px 6px #000b,
    0 0 10px #ff686e88;
}
.sc-fighter.sealed {
  background: repeating-linear-gradient(
    35deg,
    #243346,
    #243346 5px,
    #4c5269 6px,
    #4c5269 10px
  );
  border-style: dashed;
}
.sc-fighter.selected {
  outline: 3px solid #e9ff79;
  outline-offset: 1px;
}
.sc-fighter small {
  font-size: clamp(0.45rem, 0.9cqw, 0.67rem);
  line-height: 1;
}
.sc-battle-bottom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #131c2c;
  min-height: 3.2rem;
  font-size: 0.65rem;
  color: #b8c4d0;
}
.sc-battle-bottom span:first-child {
  color: #d5ff7a;
  font-weight: 900;
  white-space: nowrap;
}
.sc-battle-bottom span:nth-child(2) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc-battle-bottom button:disabled {
  opacity: 0.5;
}
.sc-result {
  position: absolute;
  z-index: 5;
  inset: 20%;
  background: #0b1019eb;
  border: 2px solid #d3ff77;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 0 5rem #000;
}
.sc-result strong {
  font-size: clamp(1rem, 3vw, 2rem);
  text-align: center;
  color: #d9ff8b;
}
.sc-collection {
  gap: 0.5rem;
  padding: 1rem;
  background: radial-gradient(circle at 50% 0%, #413e63, #121c2b 75%);
}
.sc-collection-title h2 {
  margin: 0.2rem 0;
  font-size: clamp(1.15rem, 2.6vw, 2rem);
}
.sc-collection-title p {
  font-size: 0.78rem;
  line-height: 1.4;
  margin: 0;
  color: #cbd1df;
  max-width: 50rem;
}
.sc-collection-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.75rem;
  align-content: start;
}
.sc-collect-card {
  display: flex;
  flex-direction: column;
  min-height: 14rem;
  overflow: hidden;
  border: 1px solid var(--tone);
  border-radius: 0.5rem;
  background: #181e2d;
  box-shadow: 0 5px 16px #0007;
}
.sc-collect-art {
  overflow: hidden;
  height: clamp(8rem, 19cqw, 14rem);
  display: grid;
  place-items: center;
  min-height: 6rem;
  font-size: 4rem;
  color: var(--tone);
  text-shadow: 0 0 25px var(--tone);
  background:
    radial-gradient(circle, #ffffff25, transparent 55%),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--tone) 35%, #171b2b),
      #141b28
    );
}
.sc-art-summary {
  color: #c8f2a1 !important;
  font-size: 0.65rem !important;
  letter-spacing: 0.04em;
}
.sc-collect-card > div:nth-child(2) {
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.sc-collect-card span,
.sc-collect-card small {
  font-size: 0.57rem;
  letter-spacing: 0.06em;
  color: #c6d7df;
}
.sc-collect-card strong {
  font-size: 0.78rem;
}
.sc-collect-card p {
  font-size: 0.68rem;
  line-height: 1.4;
  margin: 0;
  color: #bfc9d5;
}
.sc-collect-card > small {
  margin-top: auto;
  padding: 0.55rem;
  background: #0f1824;
}
@container (max-width: 900px) {
  .sc-main.has-controls {
    grid-template-columns: minmax(0, 1fr) 11rem;
  }
  .sc-controls {
    padding: 0.6rem;
  }
  .sc-crew {
    width: 1.9rem;
    height: 1.9rem;
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
  .sc-main.has-controls {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .sc-controls {
    border-left: 0;
    border-top: 1px solid #607080;
    gap: 0.3rem;
    padding: 0.35rem;
  }
  .sc-controls > .sc-control-heading {
    display: none;
  }
  .sc-actions {
    max-height: 6rem;
    gap: 0.2rem;
  }
  .sc-actions > .sc-control-heading {
    display: none;
  }
  .sc-reset,
  .sc-reveal {
    display: none;
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
  .sc-arena-head {
    padding: 0.35rem;
  }
  .sc-mode-tabs button {
    min-width: 0;
    padding: 0.3rem 0.5rem;
  }
  .sc-mode-tabs strong {
    font-size: 0.66rem;
  }
  .sc-mode-tabs small {
    font-size: 0.48rem;
  }
  .sc-arena-scores {
    font-size: 0.52rem;
    gap: 0.4rem;
  }
  .sc-arena-backdrop {
    padding: 0.25rem;
  }
  .sc-board {
    width: min(100%, 75cqh);
  }
  .sc-board-bloodrush {
    width: 100%;
  }
  .sc-battle-bottom {
    min-height: 2.6rem;
    padding: 0.25rem;
    font-size: 0.53rem;
  }
  .sc-battle-bottom button {
    padding: 0.35rem;
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
.sc-help {
  padding: 0.3rem 0.55rem;
  border: 1px solid #d7fc7a99;
  border-radius: 0.3rem;
  color: #e7f9bc;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}
.sc-guide {
  position: absolute;
  z-index: 6;
  inset: 0.6rem;
  max-width: 34rem;
  margin: 0 auto;
  overflow: auto;
  padding: 0.9rem 1rem;
  border: 2px solid #d3ff77;
  border-radius: 0.5rem;
  background: #0b1019f2;
  color: #dfe6f0;
  font-size: 0.74rem;
  line-height: 1.45;
  box-shadow: 0 0 4rem #000;
}
.sc-guide-goal {
  margin: 0.4rem 0;
  color: #f2ffd0;
  font-weight: 800;
}
.sc-guide ol,
.sc-guide ul {
  margin: 0.3rem 0 0.7rem;
  padding-left: 1.2rem;
}
.sc-guide li {
  margin: 0.25rem 0;
}
.sc-guide-seed {
  color: #a6aac0;
  font-size: 0.66rem;
}
.sc-guide button,
.sc-result-actions button {
  padding: 0.45rem 0.8rem;
  border: 1px solid #d7fc7a;
  border-radius: 0.3rem;
  color: #f2ffd0;
  font-weight: 900;
  letter-spacing: 0.05em;
}
.sc-result-actions {
  display: flex;
  gap: 0.5rem;
}
.sc-result > span {
  color: #c3cbd8;
  font-size: 0.75rem;
}
.sc-fighter.carrier {
  box-shadow: 0 0 0 2px #ffd34d;
}
.sc-selected-line {
  margin: 0;
  font-size: 0.6rem;
  color: #d5ff7a;
}
.sc-log {
  margin: 0;
  padding: 0.35rem 0.5rem 0.35rem 1.2rem;
  max-height: 7.5rem;
  overflow: auto;
  border-top: 1px solid #5360726b;
  color: #aeb8c8;
  font-size: 0.6rem;
  line-height: 1.35;
  flex: none;
}
.sc-log li:first-child {
  color: #f0f4fa;
}
.sc-reset-row {
  display: flex;
  gap: 0.35rem;
  flex: none;
}
.sc-reset-row .sc-reset {
  flex: 1 1 0;
  width: auto;
  min-width: 0;
}
@container (max-width: 600px) {
  .sc-log,
  .sc-selected-line {
    display: none;
  }
  .sc-guide {
    inset: 0.2rem;
    font-size: 0.66rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sc-crew {
    transition: none;
  }
  .sc-district-pin,
  .sc-fighter {
    box-shadow: none;
  }
}
.sc-card-overlay {
  position: absolute;
  z-index: 8;
  top: 3%;
  right: 3%;
  bottom: 3%;
  width: min(31rem, 85%);
  display: grid;
  grid-template-rows: minmax(7rem, 46%) minmax(0, 1fr);
  background: #111a27f5;
  border: 2px solid #c8ff78;
  border-radius: 0.75rem;
  box-shadow:
    0 15px 70px #000e,
    0 0 35px #a3ff4755;
  overflow: auto;
}
.sc-card-poster {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 8rem;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--tone) 45%, #20263e),
    #101a27 85%
  );
}
.sc-card-poster .sc-inspected-paint {
  position: absolute;
  inset: 0;
}
.sc-card-information {
  padding: 1rem;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sc-card-information h3 {
  margin: 0;
  font-size: clamp(1.4rem, 3cqw, 2rem);
}
.sc-card-information p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}
.sc-card-information .sc-card-stats {
  color: #d9ff95;
  font-weight: 800;
}
.sc-card-information .sc-no-mana {
  color: #ffb498;
}
.sc-card-cta {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}
.sc-card-cta button {
  background: #c8ff78;
  color: #152112;
  border-radius: 0.4rem;
  padding: 0.55rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 900;
}
.sc-card-cta .sc-quiet {
  background: transparent;
  color: #e6ffd3;
  border: 1px solid #99be75;
}
@container (max-width: 600px) {
  .sc-card-overlay {
    width: 93%;
    left: 3.5%;
    right: 3.5%;
    top: 2%;
    bottom: 2%;
    grid-template-rows: minmax(4rem, 36%) minmax(0, 1fr);
  }
  .sc-card-information {
    padding: 0.65rem;
    gap: 0.25rem;
  }
}
.sc-tile.neutral {
  box-shadow: inset 0 0 0 1px #cbd3a51d;
}
.sc-tile.legalMove {
  outline: 2px dashed #79faac;
  outline-offset: -3px;
}
.sc-tile.inRange {
  outline: 3px solid #ff9174;
  outline-offset: -3px;
}
.sc-tile.marked {
  background: #ab414b;
  box-shadow: inset 0 0 0 4px #ffe5aa;
}
.sc-action-deck {
  display: grid;
  gap: 0.3rem;
  background: #1f2838;
  border: 1px solid #dc9579;
  padding: 0.5rem;
  border-radius: 0.5rem;
}
.sc-action-deck small {
  font-size: 0.64rem;
  color: #e7c79b;
}
.sc-attack-button {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(100deg, #f77d54, #a83a55);
  color: #fff;
  padding: 0.5rem;
  border-radius: 0.4rem;
  font-size: 0.7rem;
  font-weight: 950;
}
.sc-attack-button span:last-child {
  margin-left: auto;
  font-size: 0.56rem;
}
.sc-attack-button:disabled {
  opacity: 0.48;
}
.sc-attack-symbol {
  font-size: 1.6rem;
}
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}
.sc-pack-cards article {
  padding: 0.7rem;
  border: 2px solid #8682a7;
  border-radius: 0.6rem;
  display: grid;
  justify-items: center;
  gap: 0.3rem;
  min-width: 0;
  background: #29243c;
}
.sc-pack-cards .rarity-rare {
  border-color: #f7cb68;
  background: radial-gradient(circle, #6b4267, #2a2441);
}
.sc-pack-face {
  display: grid;
  place-content: center;
  width: 100%;
  min-height: 5rem;
  font-size: 3rem;
  border-radius: 0.35rem;
  background: #ffffff0b;
}
.sc-pack-cards strong {
  font-size: 0.8rem;
  text-align: center;
}
.sc-pack-cards small {
  font-size: 0.6rem;
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0.5rem 0;
  padding: 0.7rem;
  border: 1px solid #8db9aa77;
  border-radius: 0.7rem;
  background: linear-gradient(115deg, #1d3338, #202036);
}
.sc-deck-workbench p {
  margin: 0.3rem 0 0;
  max-width: 45rem;
  color: #d9e6ec;
  font-size: 0.8rem;
}
.sc-deck-workbench small {
  color: #ffb9b9;
}
.sc-deck-actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.sc-deck-actions button,
.sc-deck-card-choice {
  padding: 0.4rem 0.65rem;
  border: 1px solid #b8d6bd88;
  border-radius: 0.35rem;
  background: #244039;
  color: #f4fff7;
  font-size: 0.71rem;
  font-weight: 800;
}
.sc-deck-actions button:disabled {
  opacity: 0.5;
}
.sc-deck-card-choice {
  margin: 0.2rem 0 0.4rem;
  display: block;
  text-align: left;
}
.sc-deck-card-choice.selected {
  border-color: #ffe38b;
  background: #5a4627;
}
.sc-deck-card-choice.equipped {
  color: #e6ffe7;
}
</style>
