<template>
  <main
    class="kr-surface slime-lab h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    data-testid="slime-city-lab"
  >
    <div class="sc-shell">
      <header-page-bar
        v-if="!(lab.view === 'clash' && narrowScreen)"
        console-theme="slime-city"
      >
        <div class="sc-header" data-testid="slime-city-header">
          <nav class="sc-tabs" aria-label="Slime City modes">
            <button
              type="button"
              :class="{ active: lab.view === 'home' }"
              data-testid="slime-home-tab"
              @click="lab.view = 'home'"
            >
              HOME
            </button>
            <button
              type="button"
              :class="{ active: activeMode === 'vs' }"
              data-testid="slime-vs-tab"
              title="Fight the CPU, or start and track games against other players"
              @click="lab.showVs()"
            >
              VS
            </button>
            <button
              type="button"
              :class="{ active: activeMode === 'journey' }"
              data-testid="slime-journey-tab"
              title="One branching story, your choice of Solo or Alliance deck, with a city to explore"
              @click="lab.showCampaign()"
            >
              JOURNEY
            </button>
            <button
              type="button"
              :class="{ active: activeMode === 'tower' }"
              data-testid="slime-tower-tab"
              @click="lab.showTower()"
            >
              TOWER
            </button>
            <button
              type="button"
              :class="{ active: activeMode === 'collection' }"
              data-testid="slime-collection-tab"
              @click="lab.showCards()"
            >
              COLLECTION
            </button>
            <SlimeCitySoundToggle class="sc-tab-sound" />
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
        <SlimeCitySplash v-if="lab.view === 'home'" data-testid="slime-home" />
        <section
          v-else-if="lab.view === 'settings'"
          class="sc-stage sc-settings kr-scroll"
          aria-label="Slime City settings"
          data-testid="slime-settings"
        >
          <h2 class="sc-settings-heading">GAME SETTINGS</h2>
          <p>
            Choose how the next Clash starts. Your choice is remembered on this
            device. Your current fight is not affected.
          </p>
          <fieldset>
            <legend>DEFAULT CLASH DECK</legend>
            <button
              type="button"
              :aria-pressed="lab.clashFormat === 'solo'"
              @click="setDefaultFormat('solo')"
            >
              SOLO · 20 CARDS
            </button>
            <button
              type="button"
              :aria-pressed="lab.clashFormat === 'alliance'"
              @click="setDefaultFormat('alliance')"
            >
              ALLIANCE · 20 CARDS
            </button>
          </fieldset>
          <fieldset data-testid="slime-settings-sound">
            <legend>SOUND</legend>
            <button
              type="button"
              :aria-pressed="sound.sound"
              data-testid="slime-settings-sound-all"
              @click="sound.setSound(!sound.sound)"
            >
              ALL SOUND · {{ sound.sound ? 'ON' : 'OFF' }}
            </button>
            <button
              type="button"
              :aria-pressed="sound.music"
              :disabled="!sound.sound"
              data-testid="slime-settings-music"
              @click="sound.setMusic(!sound.music)"
            >
              MUSIC · {{ sound.music ? 'ON' : 'OFF' }}
            </button>
            <button
              type="button"
              :aria-pressed="sound.effects"
              :disabled="!sound.sound"
              data-testid="slime-settings-effects"
              @click="sound.setEffects(!sound.effects)"
            >
              EFFECTS · {{ sound.effects ? 'ON' : 'OFF' }}
            </button>
          </fieldset>
          <p class="sc-settings-collection">
            Everyone starts with {{ lab.baseCollectionSize }} base cards: each
            crew's twenty-card starter deck and twenty mercenaries. Every other
            card is earned in play or from Meat packs.
          </p>
          <p>
            Tap a collection card to inspect its rules and evolutions. Every
            Clash deck contains exactly 20 unique cards.
          </p>
          <button
            type="button"
            class="sc-settings-back"
            @click="lab.view = 'home'"
          >
            BACK TO TITLE
          </button>
        </section>
        <section
          v-else-if="lab.view === 'city'"
          class="sc-stage"
          :aria-label="
            lab.cityScene === 'map'
              ? 'Slime City district map'
              : 'Slime City scene'
          "
        >
          <div
            v-if="lab.cityScene === 'map'"
            class="sc-city"
            data-testid="slime-city-map"
          >
            <SlimeCityArtwork
              class="sc-district-paint"
              :image-id="slimeArtId('districts', lab.districtId)"
              :alt="lab.district.name + ' panoramic district artwork'"
              fallback="▧"
              compact
            />
            <div class="sc-moon"></div>
            <div class="sc-skyline sc-skyline-back"></div>
            <div class="sc-skyline sc-skyline-front"></div>
            <div class="sc-road"></div>
            <div class="sc-city-overline">THE CITY IS THE ARENA</div>
            <div class="sc-map-field">
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
            <nav class="sc-city-nav" aria-label="Crew destinations">
              <button
                type="button"
                data-testid="slime-city-story-shortcut"
                @click="lab.showCampaign()"
              >
                CONTINUE JOURNEY · {{ lab.campaignState.wins }}/5
              </button>
              <button
                type="button"
                data-testid="slime-city-cards-shortcut"
                @click="lab.showCards()"
              >
                DECK · {{ lab.cards.length }}
              </button>
              <button
                v-if="lab.finaleResult && lab.finaleDismissed"
                type="button"
                data-testid="slime-city-revisit-ending"
                @click="lab.revisitFinale()"
              >
                REVISIT THE ENDING
              </button>
            </nav>
            <div
              class="sc-map-hud"
              data-testid="slime-city-map-hud"
              aria-live="polite"
            >
              <div class="sc-map-caption">
                <span class="sc-overline">{{ mapCaption.overline }}</span>
                <strong>{{ mapCaption.title }}</strong>
                <small
                  v-if="!lab.cityEvent && !lab.here && lab.routeSteps.length"
                  data-testid="slime-city-route"
                  >{{ routeLabel }}</small
                >
                <small v-else-if="!lab.cityEvent && lab.storyHere"
                  >JOURNEY · CHAPTER {{ lab.campaignState.wins + 1 }}/5 WAITS
                  HERE</small
                >
              </div>
              <div class="sc-map-actions">
                <button
                  v-if="lab.cityEvent || lab.here"
                  type="button"
                  class="sc-map-cta"
                  data-testid="slime-city-enter"
                  @click="lab.enterCity(lab.storyHere ? 'story' : 'district')"
                >
                  {{ mapCaption.cta }} →
                </button>
                <template v-else>
                  <button
                    v-if="lab.route"
                    type="button"
                    class="sc-map-cta"
                    data-testid="slime-walk"
                    @click="lab.walk()"
                  >
                    WALK {{ lab.route.street.toUpperCase() }} →
                  </button>
                  <span v-else class="sc-gate"
                    >No route available. Choose a connected district.</span
                  >
                  <button
                    type="button"
                    class="sc-map-cta sc-quiet"
                    data-testid="slime-city-dossier"
                    @click="lab.enterCity(lab.storyHere ? 'story' : 'district')"
                  >
                    DOSSIER
                  </button>
                </template>
              </div>
            </div>
          </div>
          <SlimeCityScene v-else />
        </section>

        <SlimeCityCampaign v-else-if="lab.view === 'campaign'" />
        <SlimeCityVs v-else-if="lab.view === 'vs'" />
        <SlimeCityTower v-else-if="lab.view === 'tower'" />
        <SlimeCityClash v-else-if="lab.view === 'clash'" />

        <section
          v-else-if="lab.view === 'cards'"
          class="sc-stage sc-collection"
          aria-label="Special cards and creature collection"
        >
          <div class="sc-collection-nav" aria-label="Collection sections">
            <button type="button" class="active" aria-current="page">
              YOUR CARDS
            </button>
            <button
              type="button"
              data-testid="slime-rewards-tab"
              @click="lab.showRewards()"
            >
              BOUNTIES &amp; REWARDS
            </button>
            <button
              v-if="lab.deckFormat === 'solo'"
              type="button"
              class="sc-solo-back"
              data-testid="slime-solo-deck-back"
              @click="lab.showCampaign()"
            >
              ← JOURNEY · {{ lab.team.name }} DECK
            </button>
            <span
              >LEVEL {{ lab.level }} · {{ lab.progress.cards.length }} /
              {{ lab.collectionSize }} OWNED</span
            >
          </div>
          <div class="sc-collection-body kr-scroll">
            <section
              class="sc-shelf"
              aria-label="Decks"
              data-testid="slime-deck-library"
            >
              <div class="sc-shelf-group" aria-label="Your decks">
                <span class="sc-shelf-label">YOUR DECKS</span>
                <button
                  v-for="deck in lab.library"
                  :key="deck.id"
                  type="button"
                  class="sc-shelf-deck"
                  :class="{ chosen: lab.libraryId === deck.id }"
                  :aria-pressed="lab.libraryId === deck.id"
                  :title="deck.name"
                  :data-testid="'slime-library-' + deck.id"
                  @click="lab.selectLibraryDeck(deck.id)"
                >
                  <span class="sc-shelf-art" aria-hidden="true">
                    <SlimeCityArtwork
                      :image-id="slimeArtId('crews', deck.general)"
                      :alt="teamName(deck.general)"
                      compact
                    />
                    <SlimeCityArtwork
                      class="is-ally"
                      :image-id="slimeArtId('crews', deck.ally)"
                      :alt="teamName(deck.ally)"
                      compact
                    />
                  </span>
                  <b>{{ deck.name }}</b>
                  <small>{{
                    lab.libraryDeckReady(deck.id)
                      ? '20'
                      : deck.cards.length + '/' + ALLIANCE_DECK_SIZE
                  }}</small>
                </button>
                <button
                  v-for="team in lab.customSoloTeams"
                  :key="'solo-' + team"
                  type="button"
                  class="sc-shelf-deck"
                  :class="{ chosen: lab.activeSoloDeck === team }"
                  :aria-pressed="lab.activeSoloDeck === team"
                  :title="'Your ' + teamName(team) + ' Solo deck'"
                  :data-testid="'slime-solo-deck-' + team"
                  @click="lab.selectSoloDeck(team)"
                >
                  <span class="sc-shelf-art solo" aria-hidden="true">
                    <SlimeCityArtwork
                      :image-id="slimeArtId('crews', team)"
                      :alt="teamName(team)"
                      compact
                    />
                  </span>
                  <b>{{ teamName(team).split(' ')[0] }}</b>
                  <small>SOLO</small>
                </button>
                <button
                  v-if="lab.library.length < lab.libraryMax"
                  type="button"
                  class="sc-shelf-deck is-new"
                  data-testid="slime-library-new"
                  @click="lab.newLibraryDeck()"
                >
                  ＋ NEW
                </button>
              </div>
              <div
                class="sc-shelf-group is-starters"
                :class="{ open: startersOpen }"
                aria-label="Starter decks"
              >
                <button
                  type="button"
                  class="sc-shelf-label"
                  :aria-expanded="startersOpen"
                  data-testid="slime-starters-toggle"
                  @click="startersOpen = !startersOpen"
                >
                  STARTER DECKS
                </button>
                <button
                  v-for="deck in lab.starterDecks"
                  :key="deck.id"
                  type="button"
                  class="sc-shelf-deck"
                  :class="{ chosen: lab.activeStarterId === deck.id }"
                  :aria-pressed="lab.activeStarterId === deck.id"
                  :title="
                    deck.name +
                    (deck.ally ? ' Alliance starter' : ' Solo starter')
                  "
                  :data-testid="'slime-starter-' + deck.id"
                  @click="lab.dealStarterDeck(deck.general, deck.ally)"
                >
                  <span
                    class="sc-shelf-art"
                    :class="{ solo: !deck.ally }"
                    aria-hidden="true"
                  >
                    <SlimeCityArtwork
                      :image-id="slimeArtId('crews', deck.general)"
                      :alt="teamName(deck.general)"
                      compact
                    />
                    <SlimeCityArtwork
                      v-if="deck.ally"
                      class="is-ally"
                      :image-id="slimeArtId('crews', deck.ally)"
                      :alt="teamName(deck.ally)"
                      compact
                    />
                  </span>
                  <b>{{ deck.name }}</b>
                  <small>{{ deck.ally ? 'ALLY' : 'SOLO' }}</small>
                </button>
              </div>
            </section>

            <section
              class="sc-builder"
              :class="'tone-' + lab.team.color"
              :aria-label="
                lab.deckFormat === 'alliance' ? 'Alliance deck' : 'Solo deck'
              "
              data-testid="slime-deck-builder"
            >
              <div
                class="sc-builder-pick"
                role="group"
                aria-label="Choose your general"
                data-testid="slime-general-picker"
              >
                <span class="sc-builder-label">GENERAL</span>
                <button
                  v-for="team in lab.teams"
                  :key="team.id"
                  type="button"
                  class="sc-face"
                  :aria-pressed="lab.activeTeam === team.id"
                  :title="team.name"
                  :aria-label="team.name + ' as general'"
                  :data-testid="'slime-general-' + team.id"
                  @click="lab.chooseTeam(team.id)"
                >
                  <SlimeCityArtwork
                    :image-id="slimeArtId('crews', team.id)"
                    :alt="team.name"
                    :fallback="team.insignia"
                    compact
                  />
                </button>
              </div>
              <div
                class="sc-builder-pick"
                role="group"
                aria-label="Solo, or choose a second faction"
                data-testid="slime-ally-picker"
              >
                <span class="sc-builder-label">SECOND FACTION</span>
                <button
                  type="button"
                  class="sc-face is-solo"
                  :aria-pressed="lab.deckFormat === 'solo'"
                  title="Solo: one faction and the mercenaries"
                  data-testid="slime-deck-type-solo"
                  @click="lab.setDeckAlly(null)"
                >
                  SOLO
                </button>
                <button
                  v-for="ally in allyChoices"
                  :key="ally.id"
                  type="button"
                  class="sc-face"
                  :aria-pressed="
                    lab.deckFormat === 'alliance' &&
                    lab.currentAlliance.ally === ally.id
                  "
                  :title="ally.name + ' as your second faction'"
                  :aria-label="ally.name + ' as your second faction'"
                  :data-testid="'slime-ally-' + ally.id"
                  @click="lab.setDeckAlly(ally.id)"
                >
                  <SlimeCityArtwork
                    :image-id="slimeArtId('crews', ally.id)"
                    :alt="ally.name"
                    :fallback="ally.insignia"
                    compact
                  />
                </button>
              </div>
              <div
                v-if="lab.deckFormat === 'alliance'"
                class="sc-builder-bar"
                data-testid="slime-alliance-workbench"
              >
                <strong
                  class="sc-builder-count"
                  :class="{
                    full:
                      lab.currentAlliance.cards.length === ALLIANCE_DECK_SIZE,
                  }"
                  >{{ lab.currentAlliance.cards.length
                  }}<small>/{{ ALLIANCE_DECK_SIZE }}</small></strong
                >
                <input
                  v-if="libraryEntry"
                  class="sc-library-name"
                  :value="libraryEntry.name"
                  maxlength="32"
                  aria-label="Deck name"
                  data-testid="slime-library-name"
                  @change="
                    lab.renameLibraryDeck(
                      libraryEntry.id,
                      ($event.target as HTMLInputElement).value,
                    )
                  "
                />
                <b v-else class="sc-builder-name"
                  >{{ lab.team.name.split(' ')[0] }} +
                  {{ teamName(lab.currentAlliance.ally).split(' ')[0] }}</b
                >
                <span class="sc-builder-powers">
                  <span
                    class="sc-power-chip"
                    :title="generalPower.name + ': ' + generalPower.text"
                    data-testid="slime-alliance-power"
                    >{{ generalPower.symbol }} {{ generalPower.name }}</span
                  >
                  <span
                    class="sc-power-chip"
                    :title="allyPower.name + ': ' + allyPower.text"
                    >{{ allyPower.symbol }} {{ allyPower.name }}</span
                  >
                </span>
                <small
                  class="sc-builder-note"
                  :class="{ problem: lab.currentAllianceProblems.length }"
                  aria-live="polite"
                  >{{
                    lab.currentAllianceProblems.length
                      ? lab.currentAllianceProblems.join(' · ')
                      : lab.deckMessage
                  }}</small
                >
                <span class="sc-builder-actions">
                  <button
                    type="button"
                    title="Save a copy you can edit"
                    data-testid="slime-library-copy"
                    :disabled="lab.library.length >= lab.libraryMax"
                    @click="lab.copyCurrentDeck()"
                  >
                    COPY
                  </button>
                  <button
                    v-if="libraryEntry"
                    type="button"
                    :class="{ armed: deleteArmed === libraryEntry.id }"
                    data-testid="slime-library-delete"
                    @click="confirmDelete(libraryEntry.id)"
                  >
                    {{ deleteArmed === libraryEntry.id ? 'SURE?' : 'DELETE' }}
                  </button>
                  <button
                    type="button"
                    class="go"
                    data-testid="slime-alliance-play"
                    @click="lab.playAllianceClash()"
                  >
                    PLAY ›
                  </button>
                </span>
              </div>
              <div
                v-else
                class="sc-builder-bar"
                data-testid="slime-solo-workbench"
              >
                <strong
                  class="sc-builder-count"
                  :class="{ full: lab.currentSolo.length === 20 }"
                  >{{ lab.currentSolo.length }}<small>/20</small></strong
                >
                <b class="sc-builder-name"
                  >{{ lab.team.name.split(' ')[0] }} · SOLO</b
                >
                <span class="sc-builder-powers">
                  <span
                    class="sc-power-chip"
                    :title="generalPower.name + ': ' + generalPower.text"
                    >{{ generalPower.symbol }} {{ generalPower.name }}</span
                  >
                </span>
                <small
                  class="sc-builder-note"
                  :class="{ problem: lab.currentSoloProblems.length }"
                  aria-live="polite"
                  >{{
                    lab.currentSoloProblems.length
                      ? lab.currentSoloProblems.join(' · ')
                      : lab.deckMessage
                  }}</small
                >
                <span class="sc-builder-actions">
                  <button
                    type="button"
                    class="go"
                    data-testid="slime-solo-play"
                    @click="lab.playClashFormat('solo')"
                  >
                    PLAY ›
                  </button>
                </span>
              </div>
            </section>
            <div class="sc-collection-tools">
              <div
                class="sc-evolution"
                role="group"
                aria-label="Show every card at a Clash level"
                data-testid="slime-evolution-levels"
              >
                <span>EVOLUTION</span>
                <button
                  v-for="n in CLASH_MAX_LEVEL"
                  :key="n"
                  type="button"
                  :aria-pressed="evolutionLevel === n"
                  :data-testid="'slime-evolution-' + n"
                  :title="
                    n === 1
                      ? 'How each card enters a match'
                      : 'Each card after it has been played ' +
                        (n - 1) +
                        (n === 2 ? ' time' : ' times')
                  "
                  @click="evolutionLevel = n"
                >
                  LV {{ n }}
                </button>
              </div>
              <div
                class="sc-card-filters"
                role="group"
                aria-label="Filter collection cards"
                data-testid="slime-card-filters"
              >
                <button
                  v-for="filter in collectionFilters"
                  :key="filter.id"
                  type="button"
                  :aria-pressed="collectionFilter === filter.id"
                  @click="collectionFilter = filter.id"
                >
                  {{ filter.label }}
                </button>
                <button
                  v-if="lockedCount"
                  type="button"
                  class="sc-locked-toggle"
                  :aria-pressed="showLocked"
                  title="Cards you can still earn from play and packs"
                  data-testid="slime-show-locked"
                  @click="showLocked = !showLocked"
                >
                  🔒 LOCKED · {{ lockedCount }}
                </button>
              </div>
            </div>
            <ul
              v-if="lab.deckFormat === 'alliance'"
              class="sc-collection-grid"
              aria-label="General, ally and mercenary cards"
              data-testid="slime-alliance-grid"
            >
              <li
                v-for="card in filteredAllianceCards"
                :key="card.id"
                class="sc-collect"
                :class="'is-' + allianceState(card)"
              >
                <span class="sc-clash-tile">
                  <SlimeCityClashCardFace
                    :card-id="card.id"
                    :level="evolutionLevel"
                  />
                  <button
                    v-if="allianceState(card) !== 'locked'"
                    type="button"
                    class="sc-collect-ribbon sc-collect-quick"
                    :aria-label="
                      (allianceState(card) === 'deck' ? 'Take out ' : 'Add ') +
                      card.name
                    "
                    :data-testid="'slime-quick-' + card.id"
                    @click="lab.toggleAllianceCard(card.id)"
                  >
                    {{ allianceLabel(card) }}
                  </button>
                  <span v-else class="sc-collect-ribbon">{{
                    allianceLabel(card)
                  }}</span>
                </span>
                <button
                  type="button"
                  class="sc-collect-pick"
                  :data-testid="'slime-alliance-card-' + card.id"
                  :aria-pressed="lab.currentAlliance.cards.includes(card.id)"
                  :aria-label="
                    'Inspect ' +
                    card.name +
                    ', ' +
                    allianceLabel(card).toLowerCase()
                  "
                  @click="inspectId = card.id"
                />
              </li>
            </ul>
            <ul
              v-else
              class="sc-collection-grid"
              aria-label="Faction and mercenary cards"
              data-testid="slime-solo-grid"
            >
              <li
                v-for="card in filteredSoloCards"
                :key="card.id"
                class="sc-collect"
                :class="'is-' + soloState(card)"
              >
                <span class="sc-clash-tile">
                  <SlimeCityClashCardFace
                    :card-id="card.id"
                    :level="evolutionLevel"
                  />
                  <button
                    v-if="soloState(card) !== 'locked'"
                    type="button"
                    class="sc-collect-ribbon sc-collect-quick"
                    :aria-label="
                      (soloState(card) === 'deck' ? 'Take out ' : 'Add ') +
                      card.name
                    "
                    :data-testid="'slime-quick-' + card.id"
                    @click="lab.toggleSoloCard(card.id)"
                  >
                    {{ soloLabel(card) }}
                  </button>
                  <span v-else class="sc-collect-ribbon">{{
                    soloLabel(card)
                  }}</span>
                </span>
                <button
                  type="button"
                  class="sc-collect-pick"
                  :data-testid="'slime-solo-card-' + card.id"
                  :aria-pressed="lab.currentSolo.includes(card.id)"
                  :aria-label="
                    'Inspect ' +
                    card.name +
                    ', ' +
                    soloLabel(card).toLowerCase()
                  "
                  @click="inspectId = card.id"
                />
              </li>
            </ul>
          </div>
          <SlimeCityDeckHand @inspect="inspectId = $event" />
        </section>

        <section
          v-else
          class="sc-stage sc-progression"
          aria-label="Slime City progression and card packs"
          data-testid="slime-progression"
        >
          <div class="sc-collection-nav" aria-label="Collection sections">
            <button
              type="button"
              data-testid="slime-gallery-tab"
              @click="lab.showCards()"
            >
              YOUR CARDS
            </button>
            <button type="button" class="active" aria-current="page">
              BOUNTIES &amp; REWARDS
            </button>
            <span>LEVEL {{ lab.level }} · {{ lab.progress.meat }} MEAT</span>
          </div>
          <div class="sc-progression-top">
            <div>
              <span class="sc-overline">YOUR COLLECTION · BOUNTIES</span>
              <h2>THE PIT PAYS</h2>
              <p>
                Signed-in fights against the CPU (VS, Journey and Tower) pay XP
                and Meat: the server replays every move before it pays, and
                those fights fill your daily and weekly bounties. Spend Meat on
                packs for cards beyond your base collection.
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
            <!-- Packs only matter in TRICKLE (Silas, 2026-11-04: "hide the pack
                 shop in all cards mode"). -->
            <div
              class="sc-reward-columns"
              :class="{ 'is-single': lab.unlockMode !== 'trickle' }"
            >
              <div class="sc-reward-panel">
                <SlimeCityArtwork
                  class="sc-bounty-art"
                  :image-id="slimeArtId('crews', lab.activeTeam)"
                  :alt="lab.team.name + ' bounty crew artwork'"
                  :fallback="lab.team.insignia"
                  compact
                />
                <strong>CLASH VS CPU · REWARDS</strong>
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
                  @click="lab.playClashFormat()"
                >
                  PLAY CLASH FOR REWARDS →
                </button>
                <small aria-live="polite">{{
                  lab.progressError || lab.progress.lastReward
                }}</small>
                <small
                  v-if="lab.unlockMode !== 'trickle'"
                  data-testid="slime-pack-open"
                  >Every card is open in your Armory. Switch it to TRICKLE to
                  unlock cards from Meat packs instead.</small
                >
              </div>
              <div
                v-if="lab.unlockMode === 'trickle'"
                class="sc-reward-panel sc-shop-panel"
                data-testid="slime-pack-shop"
              >
                <span class="sc-overline">THE PACK SHOP</span>
                <strong>STREET PACK</strong>
                <div class="sc-pack-art" aria-hidden="true">
                  <span>★</span><b>SLIME CITY</b
                  ><small>1 GUARANTEED RARE</small>
                </div>
                <p>
                  Three different cards from the {{ PACK_POOL.length }} cards
                  beyond the starters: one rare, two common or uncommon. A card
                  you already own can come again; each duplicate refunds
                  {{ PACK_DUPLICATE_REFUND }} Meat.
                </p>
                <p>
                  COLLECTION {{ lab.progress.cards.length }}/{{
                    lab.collectionSize
                  }}
                  ·
                  {{ lab.progress.opened }} PACKS OPENED
                </p>
                <button
                  type="button"
                  data-testid="slime-buy-pack"
                  :disabled="!lab.packAffordable || lab.progressBusy"
                  @click="buyPack"
                >
                  BUY PACK · {{ lab.packPrice }} MEAT
                </button>
                <small v-if="!lab.packAffordable"
                  >Earn more Meat from fights and bounties.</small
                >
              </div>
            </div>
            <div
              v-if="
                lab.unlockMode === 'trickle' && lab.progress.lastPack.length
              "
              class="sc-reward-panel"
              data-testid="slime-pack-reveal"
            >
              <strong>YOUR LATEST PACK</strong>
              <p data-testid="slime-pack-result">
                {{ lab.progress.lastReward }}
              </p>
              <div class="sc-pack-cards">
                <figure
                  v-for="id in lab.progress.lastPack"
                  :key="id"
                  class="sc-pack-card"
                >
                  <span class="sc-clash-tile">
                    <SlimeCityClashCardFace :card-id="id" />
                  </span>
                  <figcaption>
                    {{
                      cardById(id).team === 'mercenary'
                        ? 'HIRES WITH ANY CREW'
                        : teamName(cardById(id).team)
                    }}
                  </figcaption>
                </figure>
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
            <div class="sc-reward-panel" data-testid="slime-evergreen">
              <span class="sc-overline">NEVER RESET · CLAIM ONCE</span>
              <strong>EVERGREEN MISSIONS</strong>
              <div class="sc-challenge-grid">
                <article
                  v-for="mission in lab.evergreenList"
                  :key="mission.id"
                  class="sc-challenge"
                  :class="{ 'is-claimed': mission.claimed }"
                >
                  <span
                    >MISSION · {{ mission.value }}/{{ mission.target }}</span
                  >
                  <strong>{{ mission.title }}</strong>
                  <p>{{ mission.description }}</p>
                  <small>+{{ mission.meat }} MEAT · +{{ mission.xp }} XP</small>
                  <button
                    type="button"
                    :disabled="
                      !mission.ready || lab.progressBusy || !lab.progressLoaded
                    "
                    :data-testid="'slime-claim-' + mission.id"
                    @click="lab.claimReward(mission.id)"
                  >
                    {{
                      mission.claimed
                        ? 'CLAIMED ✓'
                        : mission.ready
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
    <div
      v-if="inspectCard"
      class="sc-inspect-backdrop"
      @click.self="inspectId = null"
    >
      <section
        class="sc-inspect-panel"
        role="dialog"
        aria-modal="true"
        :aria-label="inspectCard.name + ' card details'"
        data-testid="slime-card-inspector"
      >
        <header class="sc-inspect-head">
          <span>
            <small>{{
              inspectCard.team === 'mercenary'
                ? 'MERCENARY · ANY CREW'
                : teamName(inspectCard.team)
            }}</small>
            <h2>{{ inspectCard.name }}</h2>
          </span>
          <button
            type="button"
            class="sc-inspect-close"
            data-testid="slime-inspect-close"
            @click="inspectId = null"
          >
            CLOSE ×
          </button>
        </header>
        <SlimeCityCardEvolutions
          class="sc-inspect-evolutions"
          :card-id="inspectCard.id"
        />
        <footer class="sc-inspect-foot">
          <button
            type="button"
            class="sc-inspect-action"
            data-testid="slime-inspect-deck-action"
            @click="
              lab.deckFormat === 'alliance'
                ? lab.toggleAllianceCard(inspectCard.id)
                : lab.toggleSoloCard(inspectCard.id)
            "
          >
            {{ inspectInDeck ? 'REMOVE FROM DECK' : 'ADD TO DECK' }}
          </button>
          <p aria-live="polite">{{ lab.deckMessage }}</p>
        </footer>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useNavStore } from '@/stores/navStore'
import { cardById, type Card } from '~/utils/slimeCity/prototypes'
import { factionPower } from '~/utils/slimeCity/factionPowers'
import { CLASH_MAX_LEVEL } from '~/utils/slimeCity/clash'
import { ALLIANCE_DECK_SIZE } from '~/utils/slimeCity/alliance'
import { STREETS } from '~/utils/slimeCity/city'
import { PACK_DUPLICATE_REFUND, PACK_POOL } from '~/utils/slimeCity/progression'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { useSlimeCitySoundStore } from '~/stores/slimeCitySound'
import { slimeMusicFor } from '~/utils/slimeCity/sound'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { useSlimeCityArtStore } from '~/stores/slimeCityArt'

const lab = useSlimeCityStore()
/**
 * Silas, 2026-11-11 PT, on an iPhone: in battle mode "there should be at most
 * one row of a header". On a phone the fight drops the mode bar (the fight's
 * own strip has the way back out), so only the site header remains.
 */
const narrowScreen = ref(false)
let narrowQuery: MediaQueryList | null = null
function syncNarrow(): void {
  narrowScreen.value = !!narrowQuery?.matches
}
/** The header keeps Slime City's theme even while the bar is dropped. */
const navStore = useNavStore()
let themeId = 0
onMounted(() => {
  lab.hydrateClashFormat()
  themeId = navStore.registerConsoleTheme('slime-city')
  narrowQuery = window.matchMedia('(max-width: 600px)')
  syncNarrow()
  narrowQuery.addEventListener('change', syncNarrow)
})
onUnmounted(() => {
  narrowQuery?.removeEventListener('change', syncNarrow)
  navStore.releasePageBar(themeId)
  sound.detach()
})
/** Silas, 2026-11-14 PT: music on the menus and in the fight, effects in play, and a way to turn it off. */
const sound = useSlimeCitySoundStore()
onMounted(() => sound.attach())
watch(
  () => slimeMusicFor(lab.view, sound.tense),
  (music) => sound.setScene(music),
  { immediate: true },
)
watch(
  () => lab.view,
  () => sound.cue('nav'),
)
async function buyPack(): Promise<void> {
  const opened = lab.progress.opened
  await lab.purchasePack()
  if (lab.progress.opened > opened) sound.cue('pack')
}
const art = useSlimeCityArtStore()

const hereName = computed(
  () => lab.districts.find((d) => d.id === lab.city.location)?.name ?? 'here',
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
/**
 * Silas, 2026-11-10 PT: "clash, city, and campaign ... can be condensed to
 * Solo (story) and Campaign (Alliance). then tower as a separate mode, and
 * then collection" and "Practice can also go in the tab and be what is
 * currently clash". A Clash fight lights the tab of the mode that launched it.
 */
const activeMode = computed(() => {
  const view = lab.view
  if (view === 'clash') {
    const kind = lab.clashLaunch.kind
    if (kind === 'campaign' || kind === 'rival' || kind === 'contract')
      return 'journey'
    if (kind === 'tower') return 'tower'
    return 'vs'
  }
  if (view === 'campaign' || view === 'city') return 'journey'
  if (view === 'tower') return 'tower'
  if (view === 'cards' || view === 'rewards') return 'collection'
  return view
})
/** Settings: the format the next Clash and the deck builder start in. */
function setDefaultFormat(format: 'solo' | 'alliance'): void {
  lab.setDefaultClashFormat(format)
}
/** Phones fold the starter decks behind their label. */
const startersOpen = ref(false)
/** The library deck in the builder, if one is chosen. */
const libraryEntry = computed(
  () => lab.library.find((deck) => deck.id === lab.libraryId) ?? null,
)
/** Deleting a library deck takes two taps. */
const deleteArmed = ref<string | null>(null)
function confirmDelete(id: string): void {
  if (deleteArmed.value === id) {
    lab.deleteLibraryDeck(id)
    deleteArmed.value = null
  } else deleteArmed.value = id
}
const generalPower = computed(() => factionPower(lab.activeTeam))
const allyPower = computed(() => factionPower(lab.currentAlliance.ally))
/** Collection cards show their Clash face at the chosen evolution level. */
const evolutionLevel = ref(1)
const collectionFilters = [
  { id: 'all', label: 'ALL ELIGIBLE' },
  { id: 'faction', label: 'FACTIONS' },
  { id: 'mercenary', label: 'MERCENARIES' },
] as const
const collectionFilter = ref<(typeof collectionFilters)[number]['id']>('all')
const inspectId = ref<string | null>(null)
const inspectCard = computed(() =>
  inspectId.value
    ? (lab.allianceCards.find((card) => card.id === inspectId.value) ??
      lab.soloCards.find((card) => card.id === inspectId.value) ??
      null)
    : null,
)
const inspectInDeck = computed(() =>
  inspectCard.value
    ? lab.deckFormat === 'alliance'
      ? lab.currentAlliance.cards.includes(inspectCard.value.id)
      : lab.currentSolo.includes(inspectCard.value.id)
    : false,
)
/**
 * Silas, 2026-11-11 PT: "I'm seeing too many cards. I am an admin, but I
 * should be treated to the same limited layout to earn." The grid shows the
 * cards you own (and anything already in the deck); locked cards stay out
 * of sight unless you choose to look.
 */
const showLocked = ref(false)
const inCurrentDeck = (card: Card): boolean =>
  lab.deckFormat === 'alliance'
    ? lab.currentAlliance.cards.includes(card.id)
    : lab.currentSolo.includes(card.id)
const byFilter = (card: Card): boolean =>
  collectionFilter.value === 'all'
    ? true
    : collectionFilter.value === 'mercenary'
      ? card.team === 'mercenary'
      : card.team !== 'mercenary'
const filterCards = (cards: Card[]): Card[] =>
  cards.filter(
    (card) =>
      byFilter(card) &&
      (showLocked.value || lab.isCardUnlocked(card.id) || inCurrentDeck(card)),
  )
const lockedCount = computed(
  () =>
    (lab.deckFormat === 'alliance' ? lab.allianceCards : lab.soloCards).filter(
      (card) =>
        byFilter(card) && !lab.isCardUnlocked(card.id) && !inCurrentDeck(card),
    ).length,
)
const filteredAllianceCards = computed(() => filterCards(lab.allianceCards))
const filteredSoloCards = computed(() => filterCards(lab.soloCards))
const allyChoices = computed(() =>
  lab.teams.filter((team) => team.id !== lab.activeTeam),
)
function allianceState(card: Card): 'deck' | 'open' | 'locked' {
  if (lab.currentAlliance.cards.includes(card.id)) return 'deck'
  return lab.isCardUnlocked(card.id) ? 'open' : 'locked'
}
function allianceLabel(card: Card): string {
  const state = allianceState(card)
  if (state === 'deck')
    return card.team === lab.currentAlliance.general
      ? 'IN DECK · GENERAL'
      : card.team === 'mercenary'
        ? 'IN DECK · MERC'
        : 'IN DECK'
  return state === 'open' ? '+ ADD' : 'LOCKED'
}
function soloState(card: Card): 'deck' | 'open' | 'locked' {
  if (lab.currentSolo.includes(card.id)) return 'deck'
  return lab.isCardUnlocked(card.id) ? 'open' : 'locked'
}
function soloLabel(card: Card): string {
  const state = soloState(card)
  if (state === 'deck')
    return card.team === 'mercenary' ? 'IN DECK · MERC' : 'IN DECK'
  return state === 'open' ? '+ ADD' : 'LOCKED'
}
const MAP_EVENT_CAPTIONS = {
  aftermath: ['CHAMPIONSHIP AFTERMATH', 'SETTLE THE AFTERMATH'],
  crisis: ['CITYWIDE CRISIS', 'ANSWER THE CRISIS'],
  street: ['STREET STORY', 'PLAY THE STREET STORY'],
  finale: ['GRAND PIT · CITY FINALE', 'ENTER THE GRAND PIT'],
  epilogue: ['THE END', 'SEE THE ENDING'],
} as const
const mapCaption = computed(() => {
  const event = lab.cityEvent
  if (event) {
    const [overline, cta] = MAP_EVENT_CAPTIONS[event]
    const story =
      lab.aftermathEvent ??
      lab.crisisEvent ??
      lab.streetEvent ??
      lab.finaleEvent ??
      lab.finaleResult
    return {
      overline: overline + ' · ' + hereName.value,
      title: story?.title ?? '',
      cta,
    }
  }
  return {
    overline: statusLabel(lab.districtStatus(lab.districtId)),
    title: lab.district.name,
    cta: lab.storyHere ? 'FOLLOW THE STORY' : 'ENTER DISTRICT',
  }
})
const routeLabel = computed(() =>
  [
    hereName.value,
    ...lab.routeSteps.map(
      ({ to }) => lab.districts.find((d) => d.id === to)?.name ?? to,
    ),
  ].join(' › '),
)
onMounted(() => lab.hydrateProgression())
/** The two-player board links back here with ?vs=1. */
const route = useRoute()
onMounted(() => {
  if (route.query.vs) lab.showVs()
})
onUnmounted(() => {
  lab.dispose()
  art.clear()
})
</script>

<style scoped>
.slime-lab {
  position: relative;
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
  /* Never scroll, never clip (Silas, 2026-11-02 and 2026-11-10: "we should
     never scroll except in collection card etc"): the tabs wrap instead. */
  flex-wrap: wrap;
  justify-content: center;
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
.sc-tabs .sc-legacy-toggle {
  opacity: 0.8;
  border: 1px solid #60727c55;
}
.sc-tabs .sc-legacy-select {
  flex: none;
  appearance: auto;
  min-width: 5.7rem;
  padding: 0.37rem 0.5rem;
  border: 1px solid #566478;
  border-radius: 0.4rem;
  color: #d4dfd8;
  background: #192332;
  font-size: 0.66rem;
  font-weight: 850;
  letter-spacing: 0.065em;
  cursor: pointer;
}
.sc-tabs .sc-legacy-select:focus-visible {
  outline: 2px solid #c5ff59;
}
.sc-collection-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.65rem;
  border-bottom: 1px solid #44585c;
  background: #101f29;
}
.sc-collection-nav button {
  border: 1px solid #586e68;
  border-radius: 0.35rem;
  padding: 0.45rem 0.75rem;
  background: #24383b;
  font-size: 0.74rem;
  font-weight: 850;
}
.sc-collection-nav button.active {
  background: #c5ff59;
  border-color: #c5ff59;
  color: #0d211b;
}
.sc-collection-nav span {
  margin-left: auto;
  font-size: 0.65rem;
  color: #a9ddca;
}
.sc-bounty-art {
  flex: none;
  width: 100%;
  height: clamp(80px, 13vh, 156px);
  border-radius: 0.45rem;
}
.sc-bounty-art :deep(img) {
  object-position: center 35%;
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
/* The map is its own full-stage screen: nodes sit in a field above the
   one-line HUD, so no district ever hides under the caption. */
.sc-map-field {
  position: absolute;
  z-index: 2;
  inset: 3.6rem 2.5rem 7.5rem;
}
.sc-map-hud {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: clamp(0.6rem, 2.5cqh, 1.4rem);
  transform: translateX(-50%);
  width: min(calc(100% - 1.2rem), 50rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.8rem 0.75rem 1.2rem;
  border: 1px solid #d5f9a566;
  border-radius: 0.9rem;
  background: #0a1520e6;
  box-shadow: 0 14px 44px #000b;
  backdrop-filter: blur(8px);
}
.sc-map-caption {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}
.sc-map-caption .sc-overline {
  color: #e1fc9c;
  font-size: 0.68rem;
}
.sc-map-caption strong {
  overflow: hidden;
  font-size: clamp(1.25rem, 3.2cqw, 2.1rem);
  font-weight: 1000;
  font-style: italic;
  line-height: 1;
  letter-spacing: -0.035em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.sc-map-caption small {
  overflow: hidden;
  color: #ffe9b0;
  font-size: 0.78rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc-map-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sc-map-cta {
  min-height: 3.25rem;
  padding: 0.8rem 1.4rem;
  border: 2px solid #c8f960;
  border-radius: 0.6rem;
  background: #c8f960;
  color: #142016;
  font-size: clamp(0.82rem, 1.3cqw, 1.02rem);
  font-weight: 1000;
  letter-spacing: 0.1em;
  box-shadow: 0 0 28px #c5ff5955;
}
.sc-map-cta:hover,
.sc-map-cta:focus-visible {
  box-shadow: 0 0 38px #c5ff59aa;
  outline: none;
}
.sc-map-cta.sc-quiet {
  background: transparent;
  color: #e7f9bc;
  box-shadow: none;
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
.sc-city-nav {
  position: absolute;
  z-index: 3;
  top: 0.9rem;
  right: 0.9rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;
  max-width: 60%;
}
.sc-city-nav button {
  min-height: 2.5rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid #b5ca8c99;
  border-radius: 0.5rem;
  background: #0b1219d9;
  color: #e7f9bc;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  backdrop-filter: blur(6px);
}
.sc-city-nav button:hover,
.sc-city-nav button:focus-visible {
  border-color: #d5ff62;
  outline: none;
}
.sc-gate {
  color: #ffb27a;
  font-size: 0.8rem;
  font-weight: 750;
}
.sc-collection {
  overflow: clip;
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
/*
  Silas, 2026-11-10 PT (tablet): "The header is massive and doesn't scroll."
  Everything under the YOUR CARDS row scrolls as one region: the deck panel
  and dossier scroll away, the evolution/filter toolbar sticks to the top.
*/
.sc-collection-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.sc-locked-toggle {
  opacity: 0.85;
}
/*
  Silas, 2026-11-11 PT: "that layout above the gallery is cluttered and extra
  ... prebuilt decks, one for each faction solo and a smattering of matchups
  ... It should have pictures for each faction, not just svg icons. Art
  forward. But economical." One deck shelf, two picture rows, one slim bar.
*/
.sc-shelf {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.9rem;
}
.sc-shelf-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
}
.sc-shelf-label,
.sc-builder-label {
  flex: none;
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #a6c7bc;
}
.sc-shelf-deck {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 12rem;
  padding: 0.2rem 0.45rem 0.2rem 0.2rem;
  border: 1px solid #4d5567;
  border-radius: 0.6rem;
  background: #0e1420d9;
  color: #eef2f8;
  cursor: pointer;
}
.sc-shelf-deck.chosen {
  border-color: #c5ff59;
  box-shadow: 0 0 12px #c5ff5944;
}
.sc-shelf-deck.is-new {
  border-style: dashed;
  padding: 0.45rem 0.7rem;
  color: #c5ff59;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.sc-shelf-deck b {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.66rem;
  font-weight: 900;
}
.sc-shelf-deck small {
  flex: none;
  font-size: 0.52rem;
  font-weight: 900;
  color: #c5ff59;
}
.sc-shelf-art {
  position: relative;
  flex: none;
  width: 2.5rem;
  height: 2rem;
}
.sc-shelf-art :deep(.slime-art) {
  position: absolute;
  width: 1.75rem;
  height: 1.55rem;
  margin: 0;
  overflow: hidden;
  border-radius: 0.35rem;
  border: 2px solid #0e1420;
}
.sc-shelf-art :deep(.slime-art:first-child) {
  top: 0;
  left: 0;
}
.sc-shelf-art :deep(.slime-art:last-child:not(:first-child)) {
  right: 0;
  bottom: 0;
}
.sc-shelf-art.solo :deep(.slime-art:first-child) {
  width: 100%;
  height: 100%;
}
.sc-shelf-art :deep(img),
.sc-face :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sc-builder {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 1rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid #4d6a5f;
  border-radius: 0.8rem;
  background: #0f1a1fd9;
}
.sc-builder-pick {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.sc-face {
  flex: none;
  width: 2.9rem;
  height: 2.9rem;
  padding: 0;
  overflow: hidden;
  border: 2px solid #3d4f55;
  border-radius: 0.55rem;
  background: #16262b;
  color: #eef2f8;
  cursor: pointer;
  opacity: 0.72;
  transition:
    opacity 0.15s,
    transform 0.15s,
    border-color 0.15s;
}
.sc-face :deep(.slime-art) {
  width: 100%;
  height: 100%;
  margin: 0;
}
.sc-face:hover {
  opacity: 1;
}
.sc-face[aria-pressed='true'] {
  opacity: 1;
  border-color: #c5ff59;
  box-shadow: 0 0 12px #c5ff5966;
  transform: translateY(-1px);
}
.sc-face.is-solo {
  font-size: 0.58rem;
  font-weight: 950;
  letter-spacing: 0.08em;
}
.sc-builder-bar {
  flex: 1 1 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
  min-width: 0;
}
.sc-builder-count {
  flex: none;
  font-size: 1.35rem;
  font-weight: 1000;
  font-style: italic;
  line-height: 1;
  color: #ffd6a1;
}
.sc-builder-count.full {
  color: #c5ff59;
}
.sc-builder-count small {
  font-size: 0.55em;
  color: #a6c7bc;
}
.sc-builder-bar .sc-library-name {
  width: 11rem;
}
.sc-builder-name {
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.sc-builder-powers {
  display: flex;
  gap: 0.3rem;
}
.sc-power-chip {
  padding: 0.2rem 0.45rem;
  border: 1px solid #ffd76a77;
  border-radius: 0.45rem;
  color: #ffe9a8;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.sc-builder-note {
  flex: 1 1 10rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.66rem;
  color: #b9cfc7;
}
.sc-builder-note.problem {
  color: #ffb4bd;
}
.sc-builder-actions {
  display: flex;
  gap: 0.3rem;
  margin-left: auto;
}
.sc-builder-actions button {
  padding: 0.4rem 0.7rem;
  border: 1px solid #586e68;
  border-radius: 0.5rem;
  background: #24383b;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.sc-builder-actions button.armed {
  border-color: #ff6f7a;
  background: #4b1f26;
  color: #ffd6dc;
}
.sc-builder-actions button.go {
  border-color: #c5ff59;
  background: #c5ff59;
  color: #12200c;
}
button.sc-shelf-label {
  padding: 0;
  border: 0;
  background: none;
  cursor: default;
}
@container (max-width: 600px) {
  .sc-shelf-deck b,
  .sc-shelf-deck:not(.is-new) small {
    display: none;
  }
  button.sc-shelf-label {
    padding: 0.35rem 0.55rem;
    border: 1px solid #4d5567;
    border-radius: 0.5rem;
    background: #0e1420;
    cursor: pointer;
  }
  button.sc-shelf-label::after {
    content: ' ▸';
  }
  .is-starters.open button.sc-shelf-label::after {
    content: ' ▾';
  }
  .is-starters:not(.open) .sc-shelf-deck {
    display: none;
  }
  .sc-face {
    width: 2.5rem;
    height: 2.5rem;
  }
  .sc-builder {
    gap: 0.35rem;
  }
  .sc-builder-label {
    flex-basis: 100%;
  }
  .sc-builder-pick {
    flex-wrap: wrap;
  }
}
.sc-solo-back {
  border-color: #c5ff59 !important;
  color: #e9ffd0;
}
.sc-library-name {
  width: 100%;
  min-width: 0;
  padding: 0.3rem 0.45rem;
  border: 1px solid #586e68;
  border-radius: 0.4rem;
  background: #070b12;
  color: #f7f2e8;
  font-size: 0.8rem;
  font-weight: 800;
}
.sc-collection-tools {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  padding: 0.35rem 0.35rem;
  border-radius: 0.6rem;
  background: #0f1622f2;
  backdrop-filter: blur(6px);
}
.sc-collection-tools .sc-card-filters {
  flex: 1 1 auto;
  min-width: 0;
  justify-content: flex-end;
  margin: 0;
}
.sc-collection-grid {
  flex: none;
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
.sc-pack-card {
  margin: 0;
  min-width: 0;
}
.sc-pack-card figcaption {
  margin-top: 0.3rem;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-align: center;
  color: #c9e3dc;
}
.sc-clash-tile {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 0.9rem;
  container-type: inline-size;
}
.sc-clash-tile .sc-collect-ribbon {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  z-index: 2;
}
/*
  The ribbon is a one-tap add / take-out above the inspect button. The tile is
  a size container (its own stacking context), so the whole tile rises above
  the inspect button and lets every tap but the ribbon's fall through to it.
*/
.sc-collect .sc-clash-tile {
  z-index: 4;
  pointer-events: none;
}
.sc-clash-tile .sc-collect-quick {
  z-index: 4;
  pointer-events: auto;
  cursor: pointer;
  font-family: inherit;
}
.sc-clash-tile .sc-collect-quick:hover {
  border-color: #c5ff59;
}
.sc-evolution {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.sc-evolution span {
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #c9e3dc;
}
.sc-evolution button {
  padding: 0.25rem 0.6rem;
  border: 1px solid #ffffff33;
  border-radius: 999px;
  background: #0b1a1fcc;
  color: inherit;
  font-size: 0.66rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  cursor: pointer;
}
.sc-evolution button[aria-pressed='true'] {
  border-color: #ffd76a;
  background: #ffd76a26;
  color: #ffe9a8;
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
/*
  ALL FIVE VIEW TABS, ALWAYS. Silas, 2026-11-02: "worried that the city arena
  story cards section is not showing everything." It wasn't -- the docked bar
  (often ~600px wide beside the site icons) squeezed the tabs, so in that
  middle band they tighten instead. The header no longer carries a crew picker
  (Silas, 2026-11-11 PT: "that top selector is often redundant and sometimes
  confusing"); Journey, Practice and Collection each pick their own crew.
*/
@container (min-width: 601px) and (max-width: 960px) {
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
  .sc-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
  }
  .sc-tabs button {
    padding: 0.35rem 0.4rem;
    min-width: 0;
    font-size: 0.57rem;
    letter-spacing: 0.06em;
  }
  .sc-header {
    flex-wrap: wrap;
    row-gap: 0.3rem;
  }
  .sc-map-field {
    inset: 3.4rem 1.4rem 9.6rem;
  }
  .sc-map-hud {
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
    padding: 0.65rem;
  }
  .sc-map-actions .sc-map-cta {
    flex: 1 1 auto;
    min-height: 2.9rem;
    padding: 0.65rem 0.8rem;
  }
  .sc-map-actions .sc-gate {
    flex: 1 1 100%;
  }
  .sc-city-nav {
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    max-width: none;
  }
  .sc-city-nav button {
    min-height: 2.2rem;
    padding: 0.35rem 0.55rem;
    font-size: 0.6rem;
  }
  .sc-district-pin {
    height: 1.7rem;
    width: 1.7rem;
    font-size: 0.75rem;
  }
  .sc-district-label {
    font-size: 0.55rem;
    max-width: 5.5rem;
  }
  .sc-city-overline {
    display: none;
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
.sc-reward-columns.is-single {
  grid-template-columns: minmax(0, 1fr);
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
.sc-challenge.is-claimed {
  opacity: 0.6;
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
.sc-deck-pips.is-twenty {
  grid-template-columns: repeat(10, 0.42rem);
}
.sc-power-line b {
  display: block;
  color: #ffd76a;
  letter-spacing: 0.04em;
}
.sc-ally-picker button {
  min-width: 2.2rem;
}
.sc-deck-workbench {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.7rem;
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
  flex: 1 1 16rem;
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
/* The actions wrap under the status instead of squeezing it into a sliver
   (Silas, 2026-11-09 PT, on the Alliance armory at tablet width). */
.sc-deck-actions {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
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
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
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
/* Card unlocks: ALL CARDS (default) or TRICKLE, one segmented switch. */
.sc-unlocks {
  display: flex;
  border: 1px solid #b8d6bd66;
  border-radius: 0.4rem;
  overflow: hidden;
}
.sc-deck-actions .sc-unlocks button {
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #b8d6bd;
}
.sc-deck-actions .sc-unlocks button[aria-pressed='true'] {
  background: #e9f6ee;
  color: #142016;
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
    flex-wrap: wrap;
  }
  .sc-deck-actions button {
    flex: 1;
  }
  /* The unlock switch takes its own row on phones. */
  .sc-deck-actions .sc-unlocks {
    flex: 1 1 100%;
  }
  .sc-deck-status .sc-overline {
    white-space: normal;
  }
}

.sc-card-filters {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.35rem 0.65rem;
}
.sc-card-filters button {
  flex: 0 0 auto;
  padding: 0.4rem 0.8rem;
  border: 1px solid #a2d4be88;
  border-radius: 0.6rem;
  background: #142932;
  color: #f1f8f1;
  font-size: 0.75rem;
  font-weight: 900;
}
.sc-card-filters button[aria-pressed='true'] {
  background: #c5ff59;
  color: #122416;
}
/*
  Silas, 2026-11-11 PT (iPad): "Layout issues with the card display." The
  portrait was a 2:3 box as wide as its column, taller than the panel, so the
  panel scrolled and the card's top was cut off, and its rules were printed a
  second time beside it. Now every evolution shows as a whole card, sized to
  the room the backdrop has (a size container), with no duplicate text.
*/
.sc-inspect-backdrop {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: #020910e8;
  padding: 1rem;
  container-type: size;
}
.sc-inspect-panel {
  width: min(100%, 60rem);
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem;
  border: 1px solid #98c9ac;
  border-radius: 1.2rem;
  background: #10202b;
  overflow: hidden;
  box-shadow: 0 0 3rem #000b;
}
.sc-inspect-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}
.sc-inspect-head small {
  font-size: 0.7rem;
  font-weight: 900;
  color: #bcff61;
  letter-spacing: 0.08em;
}
.sc-inspect-head h2 {
  margin: 0.1rem 0 0;
  font-size: clamp(1.3rem, 4cqw, 2.2rem);
  line-height: 1.1;
  font-weight: 950;
}
.sc-inspect-evolutions {
  --evo-w: calc(min(60rem, 100cqw) - 2rem);
  --evo-h: calc(100cqh - 11rem);
  --evo-max: 17rem;
  --evo-min: 9.5rem;
}
.sc-inspect-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.9rem;
}
.sc-inspect-foot p {
  flex: 1 1 12rem;
  margin: 0;
  font-size: 0.8rem;
  color: #c9dbd4;
}
.sc-inspect-close,
.sc-inspect-action {
  flex: none;
  padding: 0.7rem 0.9rem;
  border: 1px solid #a2d4be88;
  border-radius: 0.6rem;
  background: #142932;
  color: #f1f8f1;
  font-size: 0.75rem;
  font-weight: 900;
}
.sc-inspect-action {
  flex: 1 1 14rem;
  border-color: #c5ff59;
  background: #c5ff59;
  color: #122416;
}
@container (max-width: 580px) {
  .sc-inspect-panel {
    padding: 0.6rem;
    gap: 0.6rem;
  }
}

.sc-settings {
  padding: clamp(1rem, 4vw, 3rem);
  background: radial-gradient(ellipse at 50% 0%, #273f41, #0a101b 70%);
  overflow: auto;
}
.sc-settings-heading {
  font-size: clamp(1.5rem, 4vw, 3rem);
  font-weight: 950;
  color: #c5ff59;
}
.sc-settings p {
  color: #d6e6dd;
  max-width: 42rem;
  margin: 0.8rem 0 1.3rem;
}
.sc-settings fieldset {
  border: 1px solid #638478;
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}
.sc-settings legend {
  padding: 0 0.5rem;
  font-weight: 900;
}
.sc-settings button[aria-pressed='true'] {
  background: #c5ff59;
  color: #0d211b;
}
.sc-settings button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
