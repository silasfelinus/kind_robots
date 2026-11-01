<template>
  <main
    class="kr-surface cap-shell h-full min-h-0 overflow-hidden"
    :class="{
      'cap-large-type': store.preferences.largeText,
      'cap-reduce-motion': store.preferences.reducedMotion,
    }"
    data-layout="console-fixed"
    aria-label="Space Couch"
  >
    <shell-console-theme theme="space-couch" />
    <section
      v-if="atTitle"
      class="cap-menu"
      data-testid="space-couch-title-screen"
      aria-label="Space Couch main menu"
    >
      <img
        class="cap-menu-image"
        :src="menuPainting"
        alt="A red upholstered couch sails across a starfield under its invisible force bubble"
        @error="onPaintedImageError"
      />
      <div class="cap-menu-shade" aria-hidden="true" />
      <div
        v-if="titlePanel !== 'opening' && titlePanel !== 'aliens'"
        class="cap-menu-body"
      >
        <span class="cap-menu-kicker"
          >AN UNLICENSED STARSHIP PRODUCTION · EPISODE ZERO</span
        >
        <h2>SPACE <em>COUCH</em></h2>
        <p class="cap-menu-deck">
          One red couch. An invisible force bubble. A galaxy full of people who
          insist this isn't a proper spaceship.
        </p>
        <p v-if="!store.loaded" role="status">
          Retrieving the ship's incident reports…
        </p>
        <nav
          v-else-if="titlePanel === 'home'"
          class="cap-menu-actions"
          aria-label="Game menu"
        >
          <button
            v-if="run"
            type="button"
            data-testid="space-couch-continue"
            @click="atTitle = false"
          >
            CONTINUE VOYAGE <span>➜</span
            ><small
              >Chapter {{ run.chapter }} ·
              {{
                CAPTAINS.find((captain) => captain.id === run?.captain)?.name
              }}</small
            >
          </button>
          <button
            type="button"
            data-testid="space-couch-new-game"
            @click="startNewVoyage"
          >
            START NEW GAME <span>✦</span
            ><small>Choose your captain, background, Couchscope and crew</small>
          </button>
          <button
            type="button"
            data-testid="space-couch-main-settings"
            @click="titlePanel = 'settings'"
          >
            SETTINGS <span>⚙</span
            ><small>Readability and motion controls</small>
          </button>
          <button
            type="button"
            data-testid="space-couch-main-log"
            @click="titlePanel = 'log'"
          >
            CAPTAIN'S LOG <span>▤</span
            ><small>{{
              run
                ? run.log.length + ' entries in the current voyage'
                : 'No voyage recorded yet'
            }}</small>
          </button>
        </nav>
        <button
          v-if="titlePanel === 'home'"
          type="button"
          class="cap-menu-back"
          data-testid="space-couch-open-alien-scrapbook"
          @click="titlePanel = 'aliens'"
        >
          SPECIES SCRAPBOOK · {{ store.alienGuide.discovered.length }}/101 ✳
        </button>
        <div
          v-if="titlePanel === 'home' && confirmNewVoyage && run"
          class="cap-menu-confirm"
          role="alert"
        >
          <p>
            The current voyage will be replaced. The crew's paperwork will not
            survive.
          </p>
          <button type="button" @click="confirmNewVoyage = false">
            KEEP MY VOYAGE
          </button>
          <button
            type="button"
            data-testid="space-couch-confirm-new"
            @click="startNewVoyage"
          >
            REPLACE VOYAGE
          </button>
        </div>
        <section
          v-if="titlePanel === 'settings'"
          class="cap-menu-detail"
          aria-label="Game settings"
        >
          <h2>SHIP SETTINGS</h2>
          <p>Local preferences. No intergalactic committee required.</p>
          <button
            type="button"
            :aria-pressed="store.preferences.largeText"
            @click="
              store.setPreference('largeText', !store.preferences.largeText)
            "
          >
            LARGER DIALOGUE TEXT
            <b>{{ store.preferences.largeText ? 'ON' : 'OFF' }}</b>
          </button>
          <button
            type="button"
            :aria-pressed="store.preferences.reducedMotion"
            @click="
              store.setPreference(
                'reducedMotion',
                !store.preferences.reducedMotion,
              )
            "
          >
            REDUCE ANIMATION
            <b>{{ store.preferences.reducedMotion ? 'ON' : 'OFF' }}</b>
          </button>
          <button
            type="button"
            class="cap-menu-back"
            @click="titlePanel = 'home'"
          >
            ← MAIN MENU
          </button>
        </section>
        <section
          v-if="titlePanel === 'log'"
          class="cap-menu-detail"
          aria-label="Saved captain's log"
        >
          <h2>CAPTAIN'S LOG</h2>
          <template v-if="run">
            <p>
              {{
                CAPTAINS.find((captain) => captain.id === run?.captain)?.name
              }}
              · Chapter {{ run.chapter }} · Day {{ run.day ?? run.chapter }}
            </p>
            <p v-if="run.starAssessment">
              Under {{ starSignFor(run.starAssessment.sign).name }}
            </p>
            <div class="cap-menu-journal">
              <p v-if="!run.log.length">
                No incidents entered. An encouraging sign, statistically.
              </p>
              <p v-for="(entry, index) in logEntries" :key="index">
                {{ entry }}
              </p>
              <div v-if="run.log.length > 4" class="cap-menu-log-nav">
                <button
                  type="button"
                  :disabled="logPage >= Math.ceil(run.log.length / 4) - 1"
                  @click="logPage++"
                >
                  OLDER ENTRIES
                </button>
                <span
                  >{{ logPage + 1 }} / {{ Math.ceil(run.log.length / 4) }}</span
                >
                <button
                  type="button"
                  :disabled="logPage === 0"
                  @click="logPage--"
                >
                  NEWER ENTRIES
                </button>
              </div>
            </div>
          </template>
          <p v-else>No saved voyage. The logbook is magnificently blank.</p>
          <button
            type="button"
            class="cap-menu-back"
            @click="titlePanel = 'home'"
          >
            ← MAIN MENU
          </button>
        </section>
        <button
          v-if="titlePanel === 'home'"
          class="cap-opening-trigger"
          type="button"
          data-testid="space-couch-watch-opening"
          @click="titlePanel = 'opening'"
        >
          ▶ WATCH THE ILLUSTRATED OPENING
          <small>18 PAINTED SCENES · THE COUCH WILL HAVE TO DO</small>
        </button>
        <p v-else class="cap-menu-bottom">
          CAPTAIN'S CHAIR UNAVAILABLE · THE COUCH WILL HAVE TO DO
        </p>
      </div>
      <div
        v-if="titlePanel === 'aliens'"
        class="absolute inset-2 z-10 min-h-0 sm:inset-4"
      >
        <SpaceCouchAlienScrapbook
          :guide="store.alienGuide"
          :artwork="store.alienArtwork"
          @close="titlePanel = 'home'"
        />
      </div>
      <SpaceCouchOpeningReel
        v-if="titlePanel === 'opening'"
        :artwork="store.onboardingArt"
        :reduced-motion="store.preferences.reducedMotion"
        @close="titlePanel = 'home'"
        @start="startFromOpening"
      />
    </section>
    <header-page-bar v-if="!atTitle" console-theme="space-couch">
      <div class="cap-toolbar" data-testid="space-couch-header">
        <span
          class="cap-wordmark"
          :title="run ? 'Space Couch' : 'Space Couch · bridge access requested'"
          ><span class="cap-emblem">✧</span> SPACE <i>COUCH</i></span
        >
        <span
          v-if="run"
          class="cap-flight"
          :title="
            'Ship day ' + (run.day ?? run.chapter) + ', chapter ' + run.chapter
          "
          >DAY <b>{{ run.day ?? run.chapter }}</b> <span>/</span> CH
          <b>{{ run.chapter }}</b></span
        >
        <div v-if="run" class="cap-hud-row">
          <span class="cap-hud"
            >SUPPLIES <b>{{ run.supplies }}</b> <span>/</span> TRUST
            <b>{{ run.trust }}</b></span
          >
          <span class="cap-hud" aria-label="Couch force shield charge"
            >BUBBLE <b>{{ run.shieldCharge ?? 2 }}/3</b></span
          >
        </div>
        <div class="cap-actions">
          <button
            v-if="store.alienEncounterAvailable"
            type="button"
            class="cap-reset cap-signal"
            data-testid="space-couch-alien-signal"
            @click="store.lookForAlien()"
          >
            ✳ <span class="cap-signal-label">STRANGE </span>SIGNAL
          </button>
          <button
            type="button"
            class="cap-reset"
            data-testid="space-couch-return-menu"
            @click="openCouchMenu"
          >
            MENU
          </button>
          <button
            v-if="run"
            type="button"
            class="cap-reset cap-new-voyage"
            @click="openNewVoyageConfirmation"
          >
            NEW VOYAGE
          </button>
        </div>
      </div>
    </header-page-bar>
    <p v-if="store.storageWarning" class="cap-warning" role="alert">
      {{ store.storageWarning }}
    </p>
    <div
      v-if="!atTitle"
      class="cap-layout min-h-0 flex-1"
      :class="{
        'cap-layout--episode': run?.phase === 'expedition',
        'cap-layout--stars': !run && selectionScreen === 'stars',
        'cap-layout--personnel': !run && selectionScreen !== 'stars',
      }"
    >
      <section
        class="cap-stage"
        aria-label="Long red couch spacecraft protected by an invisible force bubble"
      >
        <img
          :key="stagePainting"
          class="cap-painting"
          :src="stagePainting"
          :alt="stageAlt"
          @error="onPaintedImageError"
        />
        <div class="cap-vignette" aria-hidden="true" />
        <div class="cap-overlay">
          <div class="cap-kicker">
            COUCH COMMAND // FORCE BUBBLE // POCKET ROOMS <span>•</span> CREW
            COMPLEMENT UNKNOWN
          </div>
          <template v-if="!run">
            <span class="cap-coordinate">{{
              selectionScreen === 'background'
                ? 'WHO WERE YOU BEFORE THE COUCH?'
                : selectionScreen === 'stars'
                  ? 'THE COUCHSCOPE'
                  : selectionScreen === 'captain'
                    ? 'CAPTAIN DOSSIER'
                    : 'CREW DOSSIER'
            }}</span>
            <h2 class="cap-title">
              {{
                selectionScreen === 'background'
                  ? 'Every captain has a past'
                  : selectionScreen === 'stars'
                    ? 'Your Constellation Awaits'
                    : selectionScreen === 'captain'
                      ? activeCaptain.name
                      : crewProfile(focusedCrew).name
              }}
            </h2>
            <p class="cap-tagline">
              {{
                selectionScreen === 'background'
                  ? 'The galaxy records the things you did before anyone trusted you with a couch.'
                  : selectionScreen === 'stars'
                    ? 'The stars have very specific opinions about your answers.'
                    : selectionScreen === 'captain'
                      ? CAPTAIN_DOSSIERS[selectedCaptain].voice
                      : CREW_DOSSIERS[focusedCrew].crisis
              }}
            </p>
          </template>
          <template v-else>
            <span class="cap-coordinate">{{ starName }}</span>
            <h2 class="cap-chapter">{{ headline }}</h2>
            <p class="cap-copy">{{ stageCopy }}</p>
          </template>
        </div>
        <div class="cap-starmap">
          <span>✦ 06:44:82 / STARFIELD UNKNOWN</span
          ><span>{{
            run
              ? antagonist.name.toUpperCase()
              : 'CAPTAIN’S LOG NOT YET STARTED'
          }}</span>
        </div>
      </section>
      <section class="cap-bridge" aria-live="polite">
        <div class="cap-panel-title">
          <span>{{ panelLabel }}</span
          ><span class="cap-leds"
            ><i
              v-for="n in VOYAGE_CHAPTERS"
              :key="n"
              :class="{ active: !!run && n <= run.chapter }" /></span
          ><span>⌁ LIVE</span>
        </div>
        <div
          class="cap-scroll kr-scroll"
          :class="{
            'cap-episode-scroll': run?.phase === 'expedition',
            'cap-personnel-scroll': !run && selectionScreen !== 'stars',
          }"
        >
          <div v-if="!store.loaded" class="cap-placeholder">
            Establishing a secure link to ship registry…
          </div>

          <template v-else-if="!run">
            <SpaceCouchConstellationTest
              v-if="selectionScreen === 'stars'"
              :large-text="store.preferences.largeText"
              :reduced-motion="store.preferences.reducedMotion"
              :artwork="store.onboardingArt"
              :artwork-ready="store.onboardingArtLoaded"
              @confirm="confirmStarAssessment"
              @back="selectionScreen = 'background'"
            />
            <div
              v-else
              class="cap-personnel-frame"
              :data-screen="selectionScreen"
            >
              <template v-if="selectionScreen === 'background'">
                <button
                  type="button"
                  class="cap-step-back"
                  @click="selectionScreen = 'captain'"
                >
                  ← CHANGE CAPTAIN
                </button>
                <div class="cap-heading">
                  <span>02</span>
                  <div>
                    <h2>Choose your background</h2>
                    <p>
                      Your history belongs to you. It changes your opening
                      resources and follows you into the captain's log.
                    </p>
                  </div>
                </div>
                <div class="cap-origins" data-testid="space-couch-backgrounds">
                  <button
                    v-for="origin in CAPTAIN_ORIGINS"
                    :key="origin.id"
                    type="button"
                    class="cap-origin"
                    :class="{
                      chosen: selectedOrigin === origin.id,
                      'cap-origin-ready': originReady[origin.id],
                    }"
                    :aria-pressed="selectedOrigin === origin.id"
                    @click="selectedOrigin = origin.id"
                  >
                    <img
                      v-if="store.onboardingArtLoaded"
                      class="cap-origin-art"
                      :src="
                        store.onboardingArt['origins/' + origin.id] ||
                        warpArt('origins/' + origin.id) ||
                        '/game-of-captains/space-couch-stage.svg'
                      "
                      :alt="'Art for ' + origin.name"
                      @load="markOriginReady(origin.id)"
                      @error="onOriginArtError($event, origin.id)"
                    />
                    <div
                      v-else
                      class="cap-origin-art cap-origin-art--waiting"
                      role="status"
                    >
                      REQUISITIONING ART…
                    </div>
                    <span class="cap-origin-copy"
                      ><strong>{{ origin.name }}</strong
                      ><small>{{ origin.summary }}</small
                      ><small class="cap-origin-perk">{{
                        origin.perk
                      }}</small></span
                    >
                  </button>
                </div>
                <button
                  class="cap-primary"
                  type="button"
                  :disabled="!selectedOrigin"
                  data-testid="space-couch-background-next"
                  @click="selectionScreen = 'stars'"
                >
                  REPORT TO HUMAN RESOURCES <span>➜</span>
                </button>
              </template>
              <template v-else-if="selectionScreen === 'captain'">
                <div class="cap-heading">
                  <span>01</span>
                  <div>
                    <h2>Claim your cushion</h2>
                    <p>
                      Select the captain who is about to acquire a questionable
                      background. The couch runs on personalities as much as
                      fuel.
                    </p>
                  </div>
                </div>
                <div class="cap-captains">
                  <button
                    v-for="captain in CAPTAINS"
                    :key="captain.id"
                    type="button"
                    class="cap-captain"
                    :class="{
                      chosen: captain.id === selectedCaptain,
                      'cap-captain-ready':
                        captainArtReady[captain.id] ||
                        !portrait('captain-' + captain.id),
                    }"
                    :aria-pressed="captain.id === selectedCaptain"
                    @click="selectedCaptain = captain.id"
                  >
                    <span
                      class="cap-captain-icon"
                      :data-portrait-key="'captain-' + captain.id"
                      aria-hidden="true"
                      ><img
                        v-if="portrait('captain-' + captain.id)"
                        :src="portrait('captain-' + captain.id)!"
                        alt=""
                        class="cap-portrait-img"
                        @load="captainArtReady[captain.id] = true"
                        @error="captainArtReady[captain.id] = true"
                      /><template v-else>{{
                        captain.name.split(' ').at(-1)?.slice(0, 1)
                      }}</template></span
                    >
                    <span class="cap-captain-copy"
                      ><strong>{{ captain.name }}</strong
                      ><small>{{ captain.epithet }}</small></span
                    >
                  </button>
                </div>
                <div class="cap-personnel-dossier" aria-live="polite">
                  <figure
                    class="cap-personnel-hero"
                    data-testid="space-couch-captain-hero"
                  >
                    <img
                      v-if="captainDossierPortrait"
                      :src="captainDossierPortrait"
                      :alt="
                        activeCaptain.name + ' full-size character portrait'
                      "
                      class="cap-personnel-hero-image"
                      @error="
                        onPortraitError($event, 'captain-' + selectedCaptain)
                      "
                    />
                    <div v-else class="cap-personnel-hero-fallback">
                      <strong>{{ activeCaptain.name.slice(0, 1) }}</strong>
                    </div>
                    <div
                      class="cap-expression-tabs"
                      role="group"
                      aria-label="Captain portrait expressions"
                    >
                      <button
                        v-for="expression in PORTRAIT_MOODS"
                        :key="expression"
                        type="button"
                        :aria-pressed="captainMood === expression"
                        :class="{ selected: captainMood === expression }"
                        @click="captainMood = expression"
                      >
                        {{
                          expression === 'neutral'
                            ? 'NORMAL'
                            : expression.toUpperCase()
                        }}
                      </button>
                    </div>
                    <figcaption>
                      <span>YOUR CAPTAIN</span>
                      <strong>{{ activeCaptain.name }}</strong>
                    </figcaption>
                  </figure>
                  <div class="cap-dossier-header">
                    <img
                      v-if="portrait('captain-' + selectedCaptain)"
                      :src="portrait('captain-' + selectedCaptain)!"
                      :alt="activeCaptain.name + ' portrait'"
                    />
                    <span v-else class="cap-dossier-monogram">{{
                      activeCaptain.name.slice(-1)
                    }}</span>
                    <span
                      ><strong>{{ activeCaptain.name }}</strong
                      ><small>{{ activeCaptain.epithet }}</small></span
                    >
                    <button
                      type="button"
                      data-testid="space-couch-captain-dossier-tab"
                      @click="
                        captainDossierTab =
                          captainDossierTab === 'stats'
                            ? 'history'
                            : captainDossierTab === 'history'
                              ? 'orders'
                              : 'stats'
                      "
                    >
                      {{
                        captainDossierTab === 'stats'
                          ? 'STORY ▸'
                          : captainDossierTab === 'history'
                            ? 'ORDERS ▸'
                            : 'STATS ▸'
                      }}
                    </button>
                  </div>
                  <div
                    class="cap-stats cap-personnel-essential-stats"
                    data-testid="space-couch-captain-stats"
                    aria-label="Captain statistics"
                  >
                    <div v-for="skill in SKILLS" :key="skill">
                      <small>{{ skill.toUpperCase() }}</small>
                      <strong>{{ captainStats[skill] }}</strong>
                    </div>
                  </div>
                  <template v-if="captainDossierTab === 'stats'">
                    <div class="cap-insight">
                      <strong>{{ activeCaptain.doctrine }}</strong
                      ><small
                        >Advantage: {{ activeCaptain.ability }} · Price:
                        {{ activeCaptain.cost }}</small
                      >
                    </div>
                  </template>
                  <div
                    v-else-if="captainDossierTab === 'history'"
                    class="cap-insight cap-dossier-story"
                  >
                    <strong>Personal history</strong>
                    <p>{{ CAPTAIN_DOSSIERS[selectedCaptain].history }}</p>
                    <section
                      class="cap-character-promise"
                      data-testid="couch-captain-promise"
                    >
                      <h3>{{ CAPTAIN_DOSSIERS[selectedCaptain].hook }}</h3>
                      <p>{{ CAPTAIN_DOSSIERS[selectedCaptain].oddity }}</p>
                      <strong>YOUR KIND OF TROUBLE</strong>
                      <p>
                        {{ CAPTAIN_DOSSIERS[selectedCaptain].storyPromise }}
                      </p>
                      <small>{{
                        CAPTAIN_DOSSIERS[selectedCaptain].crewSpark
                      }}</small>
                    </section>
                  </div>
                  <div v-else class="cap-insight cap-dossier-story">
                    <strong>First order and unresolved liability</strong>
                    <small
                      >First order:
                      {{ CAPTAIN_DOSSIERS[selectedCaptain].opening }}</small
                    >
                    <small
                      >Unresolved liability:
                      {{ CAPTAIN_DOSSIERS[selectedCaptain].liability }}</small
                    >
                  </div>
                </div>
                <button
                  class="cap-primary"
                  type="button"
                  data-testid="captains-choose-crew"
                  @click="selectionScreen = 'background'"
                >
                  CHOOSE YOUR BACKGROUND <span>➜</span>
                </button>
              </template>
              <template v-else>
                <button
                  class="cap-option"
                  type="button"
                  data-testid="captains-back-to-captains"
                  @click="selectionScreen = 'stars'"
                >
                  <span
                    ><b>← CHANGE STAR CHART</b
                    ><small
                      >{{ activeCaptain.name }} ·
                      {{ activeCaptain.epithet }}</small
                    ></span
                  >
                </button>
                <div class="cap-heading cap-crew-heading">
                  <span>04</span>
                  <div>
                    <h2>Appoint your crew</h2>
                    <p>
                      Choose exactly three officers from twelve. Their
                      abilities, conflicts and personal quests change the
                      routes.
                    </p>
                  </div>
                </div>
                <div
                  class="cap-crew-roster"
                  data-testid="space-couch-crew-roster"
                >
                  <div class="cap-crew-picker">
                    <button
                      v-for="member in crewPageMembers"
                      :key="member.id"
                      type="button"
                      class="cap-crew-button"
                      :class="{ chosen: chosenCrew.includes(member.id) }"
                      :aria-pressed="chosenCrew.includes(member.id)"
                      :title="
                        chosenCrew.length >= 3 &&
                        !chosenCrew.includes(member.id)
                          ? 'Release a selected officer to appoint this one'
                          : 'View dossier and toggle crew appointment'
                      "
                      @click="selectCrewForDossier(member.id)"
                    >
                      <span
                        class="cap-monogram"
                        :data-portrait-key="crewProfile(member.id).portraitKey"
                        ><img
                          v-if="portrait(crewProfile(member.id).portraitKey)"
                          :src="portrait(crewProfile(member.id).portraitKey)!"
                          alt=""
                          class="cap-portrait-img"
                        /><template v-else>{{
                          member.monogram
                        }}</template></span
                      >
                      <span
                        ><strong>{{ member.name }}</strong
                        ><small
                          >{{ member.role }} ·
                          {{ crewProfile(member.id).pronouns }}</small
                        ></span
                      ><b>{{ chosenCrew.includes(member.id) ? '✓' : '+' }}</b>
                    </button>
                  </div>
                  <nav class="cap-crew-pages" aria-label="Crew roster pages">
                    <button
                      type="button"
                      data-testid="space-couch-crew-prev"
                      :disabled="crewPage === 0"
                      @click="crewPage--"
                    >
                      ← PREVIOUS
                    </button>
                    <span
                      >ROSTER {{ crewPage + 1 }} / {{ crewPageCount }} ·
                      {{ chosenCrew.length }}/3 APPOINTED</span
                    >
                    <button
                      type="button"
                      data-testid="space-couch-crew-next"
                      :disabled="crewPage >= crewPageCount - 1"
                      @click="crewPage++"
                    >
                      NEXT SIX →
                    </button>
                  </nav>
                  <div class="cap-team-note" aria-live="polite">
                    {{
                      chosenCrew
                        .map((id) => crewProfile(id).name)
                        .join(' · ') || 'Choose three officers to take command'
                    }}
                  </div>
                </div>
                <div class="cap-personnel-dossier" aria-live="polite">
                  <figure
                    class="cap-personnel-hero"
                    data-testid="space-couch-crew-hero"
                  >
                    <img
                      v-if="crewDossierPortrait"
                      :src="crewDossierPortrait"
                      :alt="
                        crewProfile(focusedCrew).name +
                        ' full-size character portrait'
                      "
                      class="cap-personnel-hero-image"
                      @error="
                        onPortraitError(
                          $event,
                          crewProfile(focusedCrew).portraitKey,
                        )
                      "
                    />
                    <div v-else class="cap-personnel-hero-fallback">
                      <strong>{{
                        crewProfile(focusedCrew).name.slice(0, 1)
                      }}</strong>
                    </div>
                    <div
                      class="cap-expression-tabs"
                      role="group"
                      aria-label="Crew portrait expressions"
                    >
                      <button
                        v-for="expression in PORTRAIT_MOODS"
                        :key="expression"
                        type="button"
                        :aria-pressed="crewMood === expression"
                        :class="{ selected: crewMood === expression }"
                        @click="crewMood = expression"
                      >
                        {{
                          expression === 'neutral'
                            ? 'NORMAL'
                            : expression.toUpperCase()
                        }}
                      </button>
                    </div>
                    <figcaption>
                      <span>OFFICER DOSSIER</span>
                      <strong>{{ crewProfile(focusedCrew).name }}</strong>
                    </figcaption>
                  </figure>
                  <div class="cap-dossier-header">
                    <img
                      v-if="portrait(crewProfile(focusedCrew).portraitKey)"
                      :src="portrait(crewProfile(focusedCrew).portraitKey)!"
                      :alt="crewProfile(focusedCrew).name + ' portrait'"
                    />
                    <span v-else class="cap-dossier-monogram">{{
                      crewProfile(focusedCrew).name.slice(0, 1)
                    }}</span>
                    <span
                      ><strong>{{ crewProfile(focusedCrew).name }}</strong
                      ><small>{{ crewProfile(focusedCrew).role }}</small></span
                    >
                    <button
                      type="button"
                      data-testid="space-couch-crew-dossier-tab"
                      @click="
                        crewDossierTab =
                          crewDossierTab === 'history'
                            ? 'route'
                            : crewDossierTab === 'route'
                              ? 'stats'
                              : 'history'
                      "
                    >
                      {{
                        crewDossierTab === 'history'
                          ? 'ROUTE ▸'
                          : crewDossierTab === 'route'
                            ? 'SKILLS ▸'
                            : 'STORY ▸'
                      }}
                    </button>
                  </div>
                  <div
                    class="cap-stats cap-personnel-essential-stats"
                    data-testid="space-couch-crew-stats"
                    aria-label="Focused crew skills"
                  >
                    <div v-for="skill in SKILLS" :key="skill">
                      <small>{{ skill.toUpperCase() }}</small>
                      <strong>{{
                        crewProfile(focusedCrew).stats[skill]
                      }}</strong>
                    </div>
                  </div>
                  <div
                    v-if="crewDossierTab === 'history'"
                    class="cap-insight cap-dossier-story"
                  >
                    <strong
                      >{{ crewProfile(focusedCrew).name }} ·
                      {{ crewProfile(focusedCrew).culture }}</strong
                    >
                    <p>{{ CREW_DOSSIERS[focusedCrew].history }}</p>
                    <section
                      class="cap-character-promise"
                      data-testid="couch-crew-promise"
                    >
                      <h3>{{ CREW_DOSSIERS[focusedCrew].hook }}</h3>
                      <p>{{ CREW_DOSSIERS[focusedCrew].oddity }}</p>
                      <strong>THE STORY THIS CREWMATE BRINGS</strong>
                      <p>{{ CREW_DOSSIERS[focusedCrew].storyPromise }}</p>
                      <small>{{ CREW_DOSSIERS[focusedCrew].crewSpark }}</small>
                    </section>
                  </div>
                  <div
                    v-else-if="crewDossierTab === 'route'"
                    class="cap-insight cap-dossier-story"
                  >
                    <strong>Route and nemesis connection</strong>
                    <small
                      >Personal voyage:
                      {{
                        CREW_DOSSIERS[focusedCrew].itinerary.join(' → ')
                      }}</small
                    >
                    <small
                      >Enemy connection:
                      {{ CREW_DOSSIERS[focusedCrew].nemesisLink }}</small
                    >
                  </div>
                  <div v-else class="cap-insight cap-dossier-story">
                    <strong>Onboard specialty</strong>
                    <p>{{ crewProfile(focusedCrew).role }}</p>
                    <small>{{ CREW_DOSSIERS[focusedCrew].crewSpark }}</small>
                  </div>
                </div>
                <button
                  class="cap-primary"
                  type="button"
                  data-testid="captains-begin"
                  :disabled="chosenCrew.length !== 3"
                  @click="beginWithStarSign"
                >
                  TAKE COMMAND <span>➜</span>
                </button>
              </template>
            </div>
          </template>

          <template v-else-if="run.phase === 'briefing'">
            <section
              class="cap-redshirt-travel"
              data-testid="space-couch-travel-prompt"
            >
              <strong>{{
                expeditionComplete
                  ? 'ARRIVED · EXPEDITION LOGGED'
                  : 'FIRST, TRAVEL. THEN, QUESTS.'
              }}</strong>
              <p>
                {{
                  expeditionComplete
                    ? 'Your crew has returned from the world encounters. You can now staff the primary mission.'
                    : 'The couch will fold open its miniature redshirt quarters at the destination. You have a captain and three officers to distribute; everyone else is beautifully, disastrously replaceable.'
                }}
              </p>
              <button
                v-if="!expeditionComplete"
                class="cap-primary"
                type="button"
                data-testid="space-couch-travel"
                @click="store.travel()"
              >
                TRAVEL TO {{ localSystem.name.toUpperCase() }} <span>➜</span>
              </button>
              <p v-if="(run.redshirtFallen ?? []).length">
                Fallen redshirts: {{ run.redshirtFallen?.length }}. Personnel
                says they have more.
              </p>
            </section>
            <section
              class="cap-solar-circuit"
              data-testid="space-couch-solar-circuit"
              aria-label="Voyage solar-system circuit"
            >
              <header class="cap-expedition-head">
                <strong
                  >FINITE STAR CIRCUIT · {{ circuit.length }} SOLAR
                  SYSTEMS</strong
                >
                <small
                  >One territory per chapter · you may revisit familiar
                  systems</small
                >
              </header>
              <div class="cap-system-nodes">
                <div
                  v-for="system in circuit"
                  :key="system.id"
                  class="cap-system-node"
                  :class="{ active: system.id === localSystem.id }"
                >
                  <strong>{{ system.name }}</strong>
                  <small
                    >{{ system.giant }} Grand Casino ·
                    {{ system.franchise.name }}</small
                  >
                </div>
              </div>
              <p class="cap-narrative">
                <b>{{ localSystem.name }}:</b> {{ localSystem.conflict }} The
                casino, built across {{ localSystem.giant }}'s living body,
                contains the local Serendipity bar.
              </p>
            </section>
            <section
              class="cap-route-board"
              data-testid="space-couch-route-board"
              :aria-label="actLabel + ' galaxy navigation'"
            >
              <div class="cap-route-heading">
                <span>{{ actLabel.toUpperCase() }} / LOCAL DISTRICTS</span>
                <strong>CHOOSE ONE LOCAL CALL</strong>
              </div>
              <div class="cap-route-grid">
                <button
                  v-for="(call, index) in routeBoard"
                  :key="call.id"
                  type="button"
                  class="cap-route-option"
                  data-testid="space-couch-route-option"
                  :class="{ active: mission.id === call.id }"
                  :aria-pressed="mission.id === call.id"
                  @click="store.chartMission(call.id)"
                >
                  <span class="cap-route-node" aria-hidden="true">
                    {{ index + 1 }}
                  </span>
                  <span class="cap-route-text">
                    <strong>{{ call.system }}</strong>
                    <small>{{ call.title }}</small>
                  </span>
                  <span class="cap-route-arrow" aria-hidden="true">›</span>
                </button>
              </div>
              <p class="cap-route-memory" data-testid="space-couch-world-echo">
                {{ routeEcho }}
              </p>
            </section>
            <div class="cap-heading">
              <span>03</span>
              <div>
                <h2>{{ mission.title }}</h2>
                <p>{{ mission.system }} / DISTRESS CALL</p>
              </div>
            </div>
            <p class="cap-narrative">{{ mission.briefing }}</p>
            <section class="cap-instinct" data-testid="couch-captain-instinct">
              <strong>CAPTAIN'S PERSONAL BAD IDEA</strong>
              <h3>{{ captainInstinct.title }}</h3>
              <p>{{ captainInstinct.situation }}</p>
              <p class="cap-instinct-response">{{ captainReply }}</p>
              <template v-if="captainCanAct">
                <button
                  type="button"
                  class="cap-option"
                  data-testid="couch-captain-impulse"
                  :disabled="captainImpulseBlocked"
                  @click="store.captainAction('impulse')"
                >
                  <span
                    ><b>{{ captainInstinct.impulse }}</b
                    ><small>+10% mission odds; a personal cost</small></span
                  >
                </button>
                <button
                  type="button"
                  class="cap-option"
                  data-testid="couch-captain-restraint"
                  @click="store.captainAction('restraint')"
                >
                  <span
                    ><b>{{ captainInstinct.restraint }}</b
                    ><small>Safer. No tactical bonus.</small></span
                  >
                </button>
              </template>
              <p v-else class="cap-instinct-response">
                This chapter's captain decision is recorded.
              </p>
            </section>
            <div
              v-if="briefingCallbacks.length || briefingAboard.length"
              class="cap-callbacks"
              data-testid="space-couch-callbacks"
            >
              <p v-for="callback in briefingCallbacks" :key="callback.flag">
                <strong
                  >{{ callback.odds > 0 ? '+' : ''
                  }}{{ callback.odds }}%</strong
                >
                {{ callback.text }}
              </p>
              <p v-for="line in briefingAboard" :key="line">
                <strong>ABOARD</strong> {{ line }}
              </p>
            </div>
            <div class="cap-antagonist">
              <strong>ANOMALY IN THE SIGNAL</strong>
              <p>
                A persistent rival is changing events in ways your crew cannot
                yet explain.
              </p>
              <small>{{ antagonist.title }}</small>
            </div>
            <section
              class="cap-insight"
              aria-label="Couch pocket rooms and shield"
            >
              <strong>Where is the rest of the spaceship?</strong>
              <small
                >This long red couch IS the ship. Its invisible bubble keeps the
                vacuum out. Unfold one temporary room behind the backrest for
                one supply; a specialty match boosts success odds by 10%.</small
              >
              <div class="cap-crew-picker">
                <button
                  type="button"
                  class="cap-crew-button"
                  :class="{ chosen: !run.pocketRoom }"
                  :aria-pressed="!run.pocketRoom"
                  @click="store.chooseRoom(null)"
                >
                  <span
                    ><strong>Just the couch</strong
                    ><small>No room, no supply cost</small></span
                  >
                </button>
                <button
                  v-for="room in POCKET_ROOMS"
                  :key="room.id"
                  type="button"
                  class="cap-crew-button cap-pocket-room-choice"
                  :class="{ chosen: run.pocketRoom === room.id }"
                  :aria-pressed="run.pocketRoom === room.id"
                  :disabled="run.supplies < 1 && run.pocketRoom !== room.id"
                  @click="store.chooseRoom(room.id)"
                >
                  <img
                    class="cap-pocket-room-art"
                    :src="pocketRoomPainting(room.id) || COUCH_FALLBACK"
                    alt=""
                    @error="onPaintedImageError"
                  />
                  <span
                    ><strong>{{ room.name }}</strong
                    ><small>{{ room.blurb }}</small></span
                  >
                </button>
              </div>
              <button
                class="cap-option"
                type="button"
                data-testid="couch-recharge-shield"
                :disabled="run.supplies < 1 || (run.shieldCharge ?? 2) >= 3"
                @click="store.rechargeShield()"
              >
                <span
                  ><b>Recharge invisible force bubble (1 supply)</b
                  ><small
                    >Charge {{ run.shieldCharge ?? 2 }}/3. Backup life support
                    remains safe at zero, but operational odds lose 10%.</small
                  ></span
                >↗
              </button>
            </section>
            <section
              v-if="missionPreview"
              class="cap-odds"
              data-testid="captains-odds"
              aria-live="polite"
            >
              <div class="cap-odds-row">
                <strong>{{ missionPreview.chance }}% successful mission</strong
                ><span>RETURN: {{ missionPreview.durationDays }} DAYS</span>
              </div>
              <p>
                Expires in {{ missionPreview.expiresInDays }} ship day(s).
                {{ missionRule.deadline }}
              </p>
              <p
                v-for="requirement in missionPreview.requirements"
                :key="requirement.skill"
              >
                {{ requirement.skill.toUpperCase() }} {{ requirement.total }} /
                {{ requirement.required }} required
              </p>
              <p v-if="missionPreview.specialRoutes.length" class="cap-special">
                {{ missionPreview.specialRoutes.join(' ') }}
              </p>
              <p v-else>{{ missionPreview.commentary }}</p>
              <p
                v-for="blocker in missionPreview.blockers"
                :key="blocker"
                role="alert"
              >
                {{ blocker }}
              </p>
            </section>
            <div class="cap-heading cap-crew-heading">
              <span>04</span>
              <div>
                <h2>Staff the away team</h2>
                <p>
                  Assign up to three. Keep at least one officer running the
                  ship. Sending nobody is a valid remote approach.
                </p>
              </div>
            </div>
            <div class="cap-crew-picker">
              <button
                v-for="member in availableCrew"
                :key="member.id"
                class="cap-crew-button"
                type="button"
                :class="{ chosen: run.away.includes(member.id) }"
                :aria-pressed="run.away.includes(member.id)"
                :disabled="
                  unavailable(member.id) ||
                  (!run.away.includes(member.id) && run.away.length >= 3)
                "
                :title="member.quote"
                @click="toggleAway(member.id)"
              >
                <span
                  class="cap-monogram"
                  :data-portrait-key="crewProfile(member.id).portraitKey"
                  ><img
                    v-if="crewVoyagePortrait(member.id)"
                    :src="crewVoyagePortrait(member.id)!"
                    alt=""
                    class="cap-portrait-img"
                    @error="
                      onPortraitError(
                        $event,
                        crewProfile(member.id).portraitKey,
                      )
                    "
                  /><template v-else>{{ member.monogram }}</template></span
                >
                <span
                  ><strong>{{ member.name }}</strong
                  ><small>{{ member.role }}</small></span
                ><b>{{ run.away.includes(member.id) ? 'AWAY' : 'SHIP' }}</b>
              </button>
            </div>
            <div class="cap-team-note">
              AWAY: {{ run.away.length }} / 3
              <span
                >{{ run.crew.length - run.away.length }} officers aboard ·
                captain on couch</span
              >
            </div>
            <button
              class="cap-primary"
              type="button"
              data-testid="captains-launch"
              :disabled="!missionPreview?.eligible || !expeditionComplete"
              @click="store.launch()"
            >
              LAUNCH MISSION <span>➜</span>
            </button>
            <button
              class="cap-option"
              type="button"
              data-testid="captains-wait"
              @click="store.advanceDay()"
            >
              <span
                ><b>Wait one ship day</b
                ><small
                  >Deliberate further. This opportunity may expire.</small
                ></span
              >
              ↗
            </button>
          </template>

          <template v-else-if="run.phase === 'travel'">
            <div class="cap-heading">
              <span>✦</span>
              <div>
                <h2>The couch approaches {{ localSystem.name }}</h2>
                <p>
                  TRAVEL / SHIP DAY {{ run.day }} · THE MINIATURIZED BARRACKS
                </p>
              </div>
            </div>
            <section
              class="cap-redshirt-travel"
              data-testid="space-couch-transit"
            >
              <h3>{{ localSystem.name }} · {{ localSystem.casinoName }}</h3>
              <p>{{ CASINO_ORIGIN }}</p>
              <p>
                <strong>ON THE LIVING CASINO:</strong>
                {{ localSystem.franchise.name }}.
                {{ localSystem.franchise.theme }}. {{ localSystem.conflict }}
              </p>
              <h3>{{ REDSHIRT_QUARTERS.name }}</h3>
              <p>{{ run.scene }}</p>
              <p>{{ REDSHIRT_QUARTERS.description }}</p>
              <p>{{ REDSHIRT_QUARTERS.exchange }}</p>
              <strong
                >{{ (run.redshirtRoster ?? []).length }} redshirts ready · 8
                miniature bunks</strong
              >
              <button
                class="cap-primary"
                type="button"
                data-testid="space-couch-arrive"
                @click="store.arrive()"
              >
                ARRIVE AND OPEN THE ENCOUNTER BOARD <span>➜</span>
              </button>
            </section>
          </template>

          <template v-else-if="run.phase === 'expedition'">
            <SpaceCouchDailyConsole
              :run="run"
              :backdrop="stagePainting"
              :franchise-image="franchiseImage"
              :artwork="store.onboardingArt"
              :knowledge="store.redshirtKnowledge"
              @hire="store.hire()"
              @dispatch="store.deployBatch"
              @draw="store.drawDailyDeck"
              @clone-advance="store.cloneAdvance"
              @clone-print="store.clonePrint"
              @finish="store.endExpedition()"
            />
          </template>

          <template v-else-if="run.phase === 'transit'">
            <div class="cap-heading">
              <span>⌛</span>
              <div>
                <h2>Away team en route</h2>
                <p>SHIP DAY {{ run.day }} · {{ mission.system }}</p>
              </div>
            </div>
            <p class="cap-narrative">{{ run.scene }}</p>
            <p class="cap-alert">
              Expected return: day {{ run.active?.returnsDay }}. Assigned crew
              are unavailable until their return.
            </p>
            <div class="cap-crew-picker">
              <div
                v-for="id in run.active?.party ?? []"
                :key="id"
                class="cap-crew-button"
              >
                <span
                  class="cap-monogram"
                  :data-portrait-key="crewProfile(id).portraitKey"
                  ><img
                    v-if="portrait(crewProfile(id).portraitKey)"
                    :src="portrait(crewProfile(id).portraitKey)!"
                    alt=""
                    class="cap-portrait-img"
                  /><template v-else>{{
                    crewProfile(id).monogram
                  }}</template></span
                >
                <span
                  ><strong>{{ crewProfile(id).name }}</strong
                  ><small>ON MISSION</small></span
                >
              </div>
            </div>
            <button
              class="cap-primary"
              type="button"
              data-testid="captains-return-day"
              @click="store.advanceDay()"
            >
              ADVANCE SHIP DAY <span>➜</span>
            </button>
          </template>

          <template v-else-if="run.phase === 'decision'">
            <div class="cap-heading">
              <span>05</span>
              <div>
                <h2>
                  {{ featuredConsequence?.title || 'Prime contact dilemma' }}
                </h2>
                <p>
                  {{ featuredConsequence?.system || mission.system }} · COMMAND
                  AUTHORITY
                </p>
              </div>
            </div>
            <template v-if="featuredConsequence">
              <p class="cap-narrative">{{ featuredConsequence.opening }}</p>
              <p class="cap-alert">{{ featuredConsequence.conflict }}</p>
              <section
                class="cap-consequence-choices"
                data-testid="space-couch-authored-consequence"
              >
                <strong>THREE ORDERS · THREE DIFFERENT COSTS</strong>
                <p>
                  Your captain and assigned crew attempt the strongest listed
                  skill. A seeded six-sided roll decides the outcome; setbacks
                  continue the story.
                </p>
                <button
                  v-for="choice in featuredConsequence.choices"
                  :key="choice.id"
                  type="button"
                  class="cap-option cap-consequence-choice"
                  :data-consequence-choice="choice.id"
                  @click="store.decideConsequence(choice.id)"
                >
                  <span>
                    <b>{{ choice.label }}</b>
                    <small>{{ choice.approach }}</small>
                    <small
                      >CHECK
                      {{ choice.check.ability_any.join(' / ').toUpperCase() }} ·
                      DIFFICULTY {{ choice.check.difficulty }}</small
                    >
                    <small>TRADEOFF: {{ choice.cost }}</small> </span
                  >↗
                </button>
              </section>
            </template>
            <template v-else>
              <p class="cap-narrative">{{ mission.dilemma }}</p>
              <div v-if="run.report" class="cap-mission-report">
                <strong
                  >{{ run.report.result.toUpperCase() }} / MISSION
                  STATUS</strong
                >
                <span>{{ run.report.names }}</span>
                <p>{{ run.report.text }}</p>
              </div>
              <p class="cap-alert">{{ nemesisLine }}</p>
              <button
                class="cap-option"
                type="button"
                @click="store.decide('aid')"
              >
                <span
                  ><b>{{ ethicalOrders.aid }}</b
                  ><small
                    >Spend supplies; earn trust without claiming
                    authority.</small
                  ></span
                >↗
              </button>
              <button
                class="cap-option"
                type="button"
                @click="store.decide('observe')"
              >
                <span
                  ><b>{{ ethicalOrders.observe }}</b
                  ><small
                    >Preserve legal standing. Others live with the
                    result.</small
                  ></span
                >↗
              </button>
              <button
                class="cap-option"
                type="button"
                @click="store.decide('intervene')"
              >
                <span
                  ><b>{{ ethicalOrders.intervene }}</b
                  ><small
                    >Act now. Accept the outrage that follows.</small
                  ></span
                >↗
              </button>
            </template>
          </template>

          <template v-else-if="run.phase === 'debrief'">
            <div class="cap-heading">
              <span>06</span>
              <div>
                <h2>Captain’s log</h2>
                <p>One more star behind us. Another choice we cannot erase.</p>
              </div>
            </div>
            <p class="cap-narrative">{{ run.scene }}</p>
            <section
              v-if="latestConsequence"
              class="cap-consequence-receipt"
              data-testid="space-couch-consequence-receipt"
            >
              <strong>{{
                latestConsequence.succeeded
                  ? 'THE ORDER HELD'
                  : 'THE ORDER FAILED'
              }}</strong>
              <p>{{ latestConsequence.callback }}</p>
              <small
                >The consequence is recorded in your captain's log and will
                affect later worlds.</small
              >
            </section>
            <div class="cap-stats">
              <div>
                <small>SUPPLIES</small><strong>{{ run.supplies }}</strong>
              </div>
              <div>
                <small>TRUST</small><strong>{{ run.trust }}</strong>
              </div>
              <div>
                <small>INTERVENTION</small
                ><strong>{{ run.intervention }}</strong>
              </div>
              <div>
                <small>REPUTATION</small><strong>{{ run.reputation }}</strong>
              </div>
            </div>
            <section
              v-if="crewRoutes.length"
              class="cap-insight"
              data-testid="couch-crew-routes"
            >
              <strong>CREW STAR CHART · OPTIONAL PERSONAL DETOUR</strong>
              <small
                >One detour after each mission. Each officer has a three-system
                quest; your choice changes the final council. Visiting costs one
                ship day, not a mission slot.</small
              >
              <button
                v-for="id in crewRoutes"
                :key="id"
                class="cap-option"
                type="button"
                :data-route="id"
                @click="store.detour(id)"
              >
                <span>
                  <b
                    >{{ crewProfile(id).name }} ·
                    {{
                      CREW_JOURNEYS[id][run.journeyProgress?.[id] ?? 0]?.system
                    }}</b
                  >
                  <small
                    >{{
                      CREW_JOURNEYS[id][run.journeyProgress?.[id] ?? 0]?.title
                    }}
                    · Step {{ (run.journeyProgress?.[id] ?? 0) + 1 }}/3</small
                  > </span
                >↗
              </button>
            </section>
            <p v-else class="cap-alert">
              {{
                run.detourChapter === run.chapter
                  ? 'This chapter’s personal route has been recorded. Plot the next course.'
                  : 'No officer is available for a personal detour. The next destination still awaits.'
              }}
            </p>
            <section
              v-if="romanceScene"
              class="cap-romance"
              data-testid="space-couch-romance-scene"
              aria-label="Optional crew relationship conversation"
            >
              <span class="cap-romance-kicker"
                >OFF DUTY // EVERYONE MAY SAY NO</span
              >
              <h3>{{ romanceScene.title }}</h3>
              <div class="cap-romance-faces">
                <span
                  v-for="key in romanceScene.portraits"
                  :key="key"
                  class="cap-romance-face"
                >
                  <img
                    v-if="portrait(key)"
                    :src="portrait(key)!"
                    :alt="key.replace('crew-', '') + ' portrait'"
                  />
                  <span v-else>{{
                    key.replace('crew-', '').toUpperCase()
                  }}</span>
                </span>
              </div>
              <p class="cap-romance-setting">{{ romanceScene.setting }}</p>
              <p
                v-for="line in romanceScene.speakers"
                :key="line.name + line.line"
                class="cap-romance-line"
              >
                <strong>{{ line.name }}:</strong> {{ line.line }}
              </p>
              <button
                v-for="choice in romanceScene.choices"
                :key="choice.id"
                class="cap-option"
                type="button"
                :data-romance-choice="choice.id"
                @click="store.chooseRomance(choice.id)"
              >
                <span
                  ><b>{{ choice.label }}</b
                  ><small>{{ choice.cost }}</small></span
                >
                ↗
              </button>
            </section>
            <p
              v-else-if="romanceRecord?.lastChapter === run.chapter"
              class="cap-romance-outcome"
              data-testid="space-couch-romance-outcome"
              aria-live="polite"
            >
              {{ romanceRecord.result }}
            </p>
            <SpaceCouchTrioInterlude />
            <button
              class="cap-primary"
              type="button"
              data-testid="captains-next"
              @click="store.next()"
            >
              {{
                run.chapter === VOYAGE_CHAPTERS
                  ? 'APPROACH THE LAST JUMP GATE'
                  : 'PLOT NEXT COURSE'
              }}
              <span>➜</span>
            </button>
          </template>

          <template v-else-if="run.phase === 'crew-quest'">
            <div class="cap-heading">
              <span>✦</span>
              <div>
                <h2>{{ activeDetour?.title }}</h2>
                <p>
                  {{ activeDetour?.system }} · THREE-WORLD ODYSSEY
                  {{ (run.detour?.step ?? 0) + 1 }}/3
                </p>
              </div>
            </div>
            <div class="cap-grand-quest" data-testid="couch-grand-quest">
              <strong>THE IMPOSSIBLE ADVENTURE</strong>
              <div class="cap-quest-portrait-line">
                <img
                  v-if="questPortrait"
                  class="cap-quest-portrait"
                  :src="questPortrait"
                  :alt="detourCrewName + ' portrait'"
                />
                <p>{{ activeDetour?.scene }}</p>
              </div>
              <small>Next relic: {{ activeDetour?.prize }}</small>
            </div>
            <p
              v-if="!run.detour?.gambit"
              class="cap-narrative"
              aria-live="polite"
            >
              {{ run.scene }}
            </p>
            <p v-if="nemesisCrewLink" class="cap-alert">
              {{ antagonist.name }} has a personal stake in this expedition.
              Evidence collected here can change the final confrontation.
            </p>
            <template v-if="!run.detour?.gambit">
              <div class="cap-quest-phase" data-testid="couch-quest-setup">
                <strong>ACT ONE · MAKE THE PLAN</strong>
                <small
                  >Both plans uncover a nasty reversal. The captain must choose
                  again after discovering what was really at stake.</small
                >
              </div>
              <button
                type="button"
                class="cap-option"
                data-testid="couch-crew-plan-careful"
                @click="store.planDetour('careful')"
              >
                <span
                  ><b>{{ activeDetour?.careful }}</b>
                  <small
                    >A discreet opening gambit. What could possibly go
                    wrong?</small
                  ></span
                >↗
              </button>
              <button
                type="button"
                class="cap-option"
                data-testid="couch-crew-plan-bold"
                @click="store.planDetour('bold')"
              >
                <span
                  ><b>{{ activeDetour?.bold }}</b>
                  <small
                    >A spectacular opening gambit. Insurance may not cover
                    this.</small
                  ></span
                >↗
              </button>
            </template>
            <template v-else>
              <div
                class="cap-quest-phase cap-quest-reversal"
                data-testid="couch-quest-reversal"
              >
                <strong>ACT TWO · THE UNIVERSE CHANGES THE RULES</strong>
                <p aria-live="polite">{{ run.scene }}</p>
                <small
                  >Opening gambit: {{ run.detour.gambit }}. You may change
                  course when it matters most.</small
                >
              </div>
              <button
                type="button"
                class="cap-option"
                data-testid="couch-crew-careful"
                :disabled="run.supplies < 1"
                @click="store.resolveDetour('careful')"
              >
                <span
                  ><b>{{ activeDetour?.finalCareful }}</b>
                  <small
                    >Spend 1 supply · +1 trust · preserve local
                    confidence</small
                  ></span
                >↗
              </button>
              <button
                type="button"
                class="cap-option"
                data-testid="couch-crew-bold"
                @click="store.resolveDetour('bold')"
              >
                <span
                  ><b>{{ activeDetour?.finalBold }}</b>
                  <small
                    >+1 public reputation · -1 trust · more enemy
                    attention</small
                  ></span
                >↗
              </button>
            </template>
          </template>
          <template v-else-if="run.phase === 'finale'">
            <div class="cap-heading">
              <span>07</span>
              <div>
                <h2>The last jump gate</h2>
                <p>{{ antagonist.name }} has one final request.</p>
              </div>
            </div>
            <p class="cap-narrative">
              The antagonist offers you a route to safety. Every culture you met
              will inherit the terms. Your crew stands quietly at their posts,
              letting the final order belong to you.
            </p>
            <div
              v-if="counterOfficers.length"
              class="cap-insight"
              data-testid="couch-counterplay"
            >
              <strong>CREW EVIDENCE UNLOCKED</strong>
              <small
                >{{
                  counterOfficers
                    .map((id) => crewProfile(id).name)
                    .join(' and ')
                }}
                recovered two or more witnesses across the galaxy.
                {{ antagonist.name }} can now be confronted on the
                record.</small
              >
              <button
                class="cap-option"
                type="button"
                data-testid="couch-counter-ending"
                @click="store.finish('counter')"
              >
                <span
                  ><b
                    >Convene the civilian council and challenge
                    {{ antagonist.name }}</b
                  ><small
                    >Use a crew member’s earned evidence, not the captain’s
                    rank.</small
                  ></span
                >↗
              </button>
            </div>
            <button
              class="cap-option"
              type="button"
              @click="store.finish('protect')"
            >
              <span
                ><b>Defend the autonomy of the worlds</b
                ><small
                  >Refuse a bargain that turns entire civilizations into
                  collateral.</small
                ></span
              >
              ↗
            </button>
            <button
              class="cap-option"
              type="button"
              @click="store.finish('compromise')"
            >
              <span
                ><b>Accept a calculated galactic bargain</b
                ><small
                  >End the immediate crisis and carry the debt yourself.</small
                ></span
              >
              ↗
            </button>
          </template>

          <template v-else>
            <div class="cap-heading">
              <span>✦</span>
              <div>
                <h2>{{ run.ending }}</h2>
                <p data-testid="space-couch-nemesis-ending">
                  {{
                    nemesisEndingTitle
                      ? antagonist.name.toUpperCase() +
                        ' // ' +
                        nemesisEndingTitle
                      : 'A CAPTAIN IS WHAT THE CREW REMEMBERS'
                  }}
                </p>
              </div>
            </div>
            <p class="cap-narrative">{{ run.scene }}</p>
            <SpaceCouchTrioInterlude />
            <div class="cap-log">
              <strong>RECORDED CAPTAIN’S LOG</strong>
              <p v-for="(line, index) in run.log" :key="index">{{ line }}</p>
            </div>
            <PlaybookRunReview
              game="game-of-captains"
              :run="run"
              :ending="run.ending ?? 'voyage-complete'"
            />
            <button class="cap-primary" type="button" @click="restartVoyage">
              COMMAND ANOTHER VOYAGE <span>↻</span>
            </button>
          </template>
        </div>
        <footer class="cap-footer">
          <span
            >STAR CHART //
            {{ run ? mission.system.toUpperCase() : 'UNCLAIMED VESSEL' }}</span
          ><span>{{ run ? 'LOG SAVED' : 'NO TRANSMISSION' }}</span>
        </footer>
      </section>
    </div>
    <SpaceCouchAlienEncounter
      v-if="store.alienSighting || store.alienReport"
      :sighting="store.alienSighting"
      :report="store.alienReport"
      :guide="store.alienGuide"
      :artwork="store.alienArtwork"
      @choose="store.chooseAlienAction"
      @close="store.dismissAlienEncounter"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGameOfCaptainsStore } from '~/stores/gameOfCaptainsStore'
import {
  ANTAGONISTS,
  CAPTAINS,
  CREW,
  MISSIONS,
  POCKET_ROOMS,
  previewMission,
  antagonistFor,
  missionFor,
  missionBoard,
  worldEcho,
  crewDetourOptions,
  detourFor,
  counterCrew,
  type CaptainId,
  type CrewId,
} from '~/utils/gameOfCaptains/rules'
import {
  CAPTAIN_STATS,
  CREW_PROFILES,
  SKILLS,
  ruleFor,
} from '~/utils/gameOfCaptains/crewAssignments'
import {
  VOYAGE_CHAPTERS,
  VOYAGE_ORDERS,
  aboardLines,
  actName,
  earnedCallbacks,
  nemesisMove,
  type NemesisId,
} from '~/utils/gameOfCaptains/voyageMap'
import {
  NEMESIS_ENDINGS,
  type NemesisEndingVariant,
} from '~/utils/gameOfCaptains/nemesisEndings'
import { REDSHIRT_QUARTERS } from '~/utils/gameOfCaptains/expedition'
import {
  solarCircuit,
  chapterSystem,
  CASINO_ORIGIN,
} from '~/utils/gameOfCaptains/solarCircuit'

import {
  CAPTAIN_INSTINCTS,
  captainInstinctAvailable,
  captainInstinctReply,
} from '~/utils/gameOfCaptains/captainInstincts'
import { warpArt } from '~/utils/gameOfCaptains/artManifest'
import { portraitArt, voyageStageArt } from '~/utils/gameOfCaptains/artSlots'
import {
  consequenceForRun,
  consequenceAftermath,
} from '~/utils/gameOfCaptains/consequenceStories'
import {
  CAPTAIN_ORIGINS,
  type CaptainOriginId,
} from '~/utils/gameOfCaptains/captainOrigins'
import SpaceCouchOpeningReel from '~/components/gameOfCaptains/opening-reel.vue'
import SpaceCouchAlienEncounter from '~/components/gameOfCaptains/alien-encounter.vue'
import SpaceCouchAlienScrapbook from '~/components/gameOfCaptains/alien-scrapbook.vue'
import SpaceCouchDailyConsole from '~/components/gameOfCaptains/daily-console.vue'
import SpaceCouchConstellationTest from '~/components/gameOfCaptains/constellation-test.vue'
import {
  starSignFor,
  type StarAssessment,
} from '~/utils/gameOfCaptains/starSigns'
import {
  CREW_JOURNEYS,
  NEMESIS_COUNTERPLAY,
} from '~/utils/gameOfCaptains/crewJourneys'
import {
  CAPTAIN_DOSSIERS,
  CREW_DOSSIERS,
} from '~/utils/gameOfCaptains/characterDossiers'

import {
  romanceMoment,
  type RomanceVoyage,
} from '~/utils/gameOfCaptains/romance'

const store = useGameOfCaptainsStore()
const selectedCaptain = ref<CaptainId>('fluke')
const chosenCrew = ref<CrewId[]>([])
const selectionScreen = ref<'background' | 'captain' | 'stars' | 'crew'>(
  'captain',
)
const selectedOrigin = ref<CaptainOriginId | null>(null)
const originReady = ref<Record<string, boolean>>({})
const captainArtReady = ref<Record<string, boolean>>({})
function markOriginReady(id: string) {
  originReady.value[id] = true
}
function onOriginArtError(event: Event, id: string) {
  const image = event.target as HTMLImageElement
  const fallback = '/game-of-captains/space-couch-stage.svg'
  if (image.getAttribute('src') === fallback) {
    markOriginReady(id)
  } else {
    image.src = fallback
  }
}
const atTitle = ref(true)
const titlePanel = ref<'home' | 'settings' | 'log' | 'opening' | 'aliens'>(
  'home',
)
const confirmNewVoyage = ref(false)
function openCouchMenu() {
  atTitle.value = true
  titlePanel.value = 'home'
}
function openNewVoyageConfirmation() {
  openCouchMenu()
  confirmNewVoyage.value = true
}
const logPage = ref(0)
const logEntries = computed(() => {
  const entries = run.value?.log ?? []
  return entries.slice(
    Math.max(0, entries.length - 4 * (logPage.value + 1)),
    Math.max(0, entries.length - 4 * logPage.value),
  )
})
const starAssessment = ref<StarAssessment | null>(null)
const focusedCrew = ref<CrewId>('pell')
const PORTRAIT_MOODS = ['neutral', 'defiant', 'vulnerable'] as const
type PortraitMood = (typeof PORTRAIT_MOODS)[number]
const captainMood = ref<PortraitMood>('neutral')
const crewMood = ref<PortraitMood>('neutral')
const captainDossierTab = ref<'stats' | 'history' | 'orders'>('stats')
const crewDossierTab = ref<'history' | 'route' | 'stats'>('history')
const crewPage = ref(0)
const crewPageCount = Math.ceil(CREW.length / 6)
const crewPageMembers = computed(() =>
  CREW.slice(crewPage.value * 6, (crewPage.value + 1) * 6),
)
const run = computed(() => store.run)
const romanceScene = computed(() =>
  run.value ? romanceMoment(run.value) : null,
)
const romanceRecord = computed(
  () => (run.value as RomanceVoyage | null)?.romance,
)
/** A captain or crew portrait once its render ships; the monogram stands in until then. */
const portrait = (key: string) => portraitArt(key)
function portraitForMood(key: string, mood: PortraitMood): string | null {
  return (
    (mood !== 'neutral'
      ? store.onboardingArt['portraits/v2/' + key + '-' + mood]
      : null) || portrait(key)
  )
}
const captainDossierPortrait = computed(() =>
  portraitForMood('captain-' + selectedCaptain.value, captainMood.value),
)
const crewDossierPortrait = computed(() =>
  portraitForMood(crewProfile(focusedCrew.value).portraitKey, crewMood.value),
)
function crewVoyagePortrait(id: CrewId): string | null {
  const mood: PortraitMood = unavailable(id)
    ? 'vulnerable'
    : run.value?.away.includes(id)
      ? 'defiant'
      : 'neutral'
  return portraitForMood(crewProfile(id).portraitKey, mood)
}
function onPortraitError(event: Event, key: string) {
  const image = event.target as HTMLImageElement
  const fallback = portrait(key) || COUCH_FALLBACK
  if (image.getAttribute('src') !== fallback) image.src = fallback
}
const POCKET_ROOM_PAINTINGS = {
  holodeck: 'opening/09-holodeck',
  'war-room': 'opening/10-war-room',
  infirmary: 'opening/11-infirmary',
} as const
function pocketRoomPainting(id: keyof typeof POCKET_ROOM_PAINTINGS) {
  return store.onboardingArt[POCKET_ROOM_PAINTINGS[id]] || null
}
const COUCH_FALLBACK = '/game-of-captains/space-couch-stage.svg'
const paintedVoyageImage = (key: string): string | null =>
  store.onboardingArt[key] || null
const menuPainting = computed(
  () => paintedVoyageImage('opening/01-cold-open') || COUCH_FALLBACK,
)
function onPaintedImageError(event: Event) {
  const image = event.target as HTMLImageElement
  if (image.getAttribute('src') !== COUCH_FALLBACK) image.src = COUCH_FALLBACK
}
const stagePainting = computed(() => {
  if (run.value?.phase === 'ending' && run.value.consequenceEnding)
    return (
      paintedVoyageImage(run.value.consequenceEnding) ||
      voyageStageArt(run.value, paintedVoyageImage) ||
      COUCH_FALLBACK
    )
  if (latestConsequence.value)
    return (
      paintedVoyageImage(latestConsequence.value.artKey) ||
      voyageStageArt(run.value, paintedVoyageImage) ||
      COUCH_FALLBACK
    )
  // Only use newly delivered, access-filtered scene art. The older static
  // mission and antagonist pictures predate the literal red-couch redesign.
  if (run.value) {
    if (run.value.phase === 'briefing' && run.value.pocketRoom)
      return (
        pocketRoomPainting(run.value.pocketRoom) ||
        voyageStageArt(run.value, paintedVoyageImage) ||
        COUCH_FALLBACK
      )
    return voyageStageArt(run.value, paintedVoyageImage) || COUCH_FALLBACK
  }
  const key =
    selectionScreen.value === 'stars' || selectionScreen.value === 'background'
      ? ''
      : selectionScreen.value === 'captain'
        ? 'captain-' + selectedCaptain.value
        : 'crew-' + focusedCrew.value
  return (
    (selectionScreen.value === 'captain'
      ? captainDossierPortrait.value
      : selectionScreen.value === 'crew'
        ? crewDossierPortrait.value
        : portrait(key)) || COUCH_FALLBACK
  )
})
const stageAlt = computed(() =>
  latestConsequence.value
    ? 'Painted ' +
      (latestConsequence.value.succeeded ? 'success' : 'setback') +
      ' for the captain’s ' +
      latestConsequence.value.choiceId.replaceAll('-', ' ')
    : run.value?.phase === 'ending' && run.value.consequenceEnding
      ? 'Painted earned mission-consequence epilogue'
      : run.value
        ? run.value.phase === 'ending'
          ? 'Painted artwork for the voyage conclusion'
          : run.value.phase === 'finale'
            ? 'Painted encounter with the galactic antagonist'
            : 'Painted view of ' +
              mission.value.system +
              ' during the current voyage'
        : selectionScreen.value === 'stars' ||
            selectionScreen.value === 'background'
          ? 'The starry sky above the long red couch'
          : selectionScreen.value === 'captain'
            ? activeCaptain.value.name + ' selection portrait'
            : crewProfile(focusedCrew.value).name + ' selection portrait',
)
const activeCaptain = computed(() =>
  CAPTAINS.find((c) => c.id === selectedCaptain.value)!,
)
const captainInstinct = computed(
  () => CAPTAIN_INSTINCTS[run.value?.captain ?? selectedCaptain.value],
)
const captainCanAct = computed(
  () => !!run.value && captainInstinctAvailable(run.value),
)
const captainReply = computed(() =>
  run.value ? captainInstinctReply(run.value) : '',
)
const captainImpulseBlocked = computed(
  () =>
    !!run.value &&
    ((['vale', 'solace'].includes(run.value.captain) &&
      run.value.supplies < 1) ||
      (run.value.captain === 'quill' && (run.value.shieldCharge ?? 2) < 1)),
)
const mission = computed(() =>
  run.value ? missionFor(run.value) : MISSIONS[0]!,
)
const featuredConsequence = computed(() =>
  run.value ? consequenceForRun(run.value) : null,
)
const latestConsequence = computed(() =>
  run.value ? consequenceAftermath(run.value) : null,
)
const routeBoard = computed(() => (run.value ? missionBoard(run.value) : []))
const circuit = computed(() => solarCircuit(run.value?.seed ?? 1))
const localSystem = computed(() =>
  chapterSystem(run.value?.seed ?? 1, run.value?.chapter ?? 1),
)
const franchiseImage = computed(
  () =>
    paintedVoyageImage('venues/' + localSystem.value.franchise.id) ||
    warpArt('venues/' + localSystem.value.franchise.id),
)

const expeditionComplete = computed(() =>
  (run.value?.expeditionHistory ?? []).some(
    (visit) => visit.chapter === run.value?.chapter,
  ),
)

const routeEcho = computed(() => (run.value ? worldEcho(run.value) : ''))
const antagonist = computed(() =>
  run.value ? antagonistFor(run.value) : ANTAGONISTS[0]!,
)
const availableCrew = computed(() =>
  CREW.filter((person) => run.value?.crew.includes(person.id)),
)
const crewRoutes = computed(() =>
  run.value ? crewDetourOptions(run.value) : [],
)
const detourCrewName = computed(
  () =>
    CREW.find((person) => person.id === run.value?.detour?.crewId)?.name ??
    'Crew member',
)
const activeDetour = computed(() => (run.value ? detourFor(run.value) : null))
const questPortrait = computed(() => {
  const crewId = run.value?.detour?.crewId
  return crewId ? portrait(crewProfile(crewId).portraitKey) : null
})
const nemesisCrewLink = computed(
  () =>
    !!run.value?.detour &&
    (NEMESIS_COUNTERPLAY[antagonist.value.id] ?? []).includes(
      run.value.detour.crewId,
    ),
)
const counterOfficers = computed(() =>
  run.value ? counterCrew(run.value) : [],
)
const ethicalOrders = computed(() => VOYAGE_ORDERS[mission.value.id]!)
const missionRule = computed(() => ruleFor(mission.value.id))
const actLabel = computed(() => actName(run.value?.chapter ?? 1))
const briefingCallbacks = computed(() =>
  run.value
    ? earnedCallbacks(mission.value.id, run.value.worldFlags ?? [])
    : [],
)
const briefingAboard = computed(() =>
  run.value ? aboardLines(mission.value.id, run.value.crew) : [],
)
const nemesisEndingTitle = computed(() => {
  const id = run.value?.nemesisEnding
  const variant = id?.slice(antagonist.value.id.length + 1)
  return id?.startsWith(antagonist.value.id + '-')
    ? (NEMESIS_ENDINGS[antagonist.value.id as NemesisId]?.[
        variant as NemesisEndingVariant
      ]?.title ?? '')
    : ''
})
const nemesisLine = computed(() =>
  run.value ? nemesisMove(antagonist.value, run.value.chapter) : '',
)
const missionPreview = computed(() =>
  run.value?.phase === 'briefing' ? previewMission(run.value) : null,
)
const captainStats = computed(() => CAPTAIN_STATS[selectedCaptain.value])
function crewProfile(id: CrewId) {
  return CREW_PROFILES.find((person) => person.id === id)!
}
function unavailable(id: CrewId) {
  return (run.value?.injuredUntil?.[id] ?? 0) > (run.value?.day ?? 0)
}
const starName = computed(() =>
  run.value?.phase === 'ending'
    ? 'THE FINAL LOG'
    : run.value?.phase === 'crew-quest'
      ? (activeDetour.value?.system ?? 'PERSONAL ROUTE').toUpperCase()
      : mission.value.system.toUpperCase(),
)
const headline = computed(() =>
  run.value
    ? {
        briefing: mission.value.title,
        transit: 'Away Team En Route',
        decision: 'The Cost Of Knowing',
        debrief: 'Between The Stars',
        travel: 'Couch in Transit',
        expedition: 'Redshirt Deployment Board',
        'crew-quest': activeDetour.value?.title ?? 'Personal Route',
        finale: 'The Last Jump Gate',
        ending: run.value.ending ?? 'Voyage Complete',
      }[run.value.phase]
    : '',
)
const stageCopy = computed(() => {
  if (run.value?.phase === 'briefing') return mission.value.briefing
  const scene = run.value?.scene ?? ''
  if (run.value?.phase !== 'ending') return scene
  // The whole epilogue reads in the log panel; over the painting the stage
  // keeps the verdict's first two sentences so it never runs off the art.
  const sentences = scene.match(/[^.!?]+[.!?]+/g) ?? [scene]
  return sentences.slice(0, 2).join('').trim()
})
const panelLabel = computed(() =>
  run.value
    ? {
        briefing: 'STAR CHART // MISSION BRIEF',
        transit: 'EXPEDITION // RETURN CLOCK',
        decision: 'PRIME DOCTRINE // YOUR ORDER',
        debrief: 'CAPTAIN’S LOG // OUTCOME',
        travel: 'TRANSIT // NEXT WORLD',
        expedition: 'FIELD EXPEDITION // ALLOCATE PERSONNEL',
        'crew-quest': 'CREW STAR CHART // PERSONAL CONSEQUENCE',
        finale: 'LAST TRANSMISSION // FINALE',
        ending: 'CHRONICLE // A VOYAGE RECORDED',
      }[run.value.phase]
    : selectionScreen.value === 'background'
      ? '02 // BEFORE THE CAPTAINCY'
      : selectionScreen.value === 'captain'
        ? '01 // CAPTAIN SELECTION'
        : selectionScreen.value === 'stars'
          ? '03 // THE COUCHSCOPE'
          : '04 // CREW SELECTION',
)

function confirmStarAssessment(assessment: StarAssessment) {
  starAssessment.value = assessment
  selectionScreen.value = 'crew'
}
function beginWithStarSign() {
  if (
    !selectedOrigin.value ||
    !starAssessment.value ||
    chosenCrew.value.length !== 3
  )
    return
  store.begin(
    selectedCaptain.value,
    chosenCrew.value,
    starAssessment.value,
    selectedOrigin.value,
  )
}
function restartVoyage() {
  store.restart()
  starAssessment.value = null
  selectionScreen.value = 'captain'
  chosenCrew.value = []
  crewPage.value = 0
  captainDossierTab.value = 'stats'
  crewDossierTab.value = 'history'
  selectedOrigin.value = null
  atTitle.value = false
}
function startFromOpening() {
  titlePanel.value = 'home'
  startNewVoyage()
}
function startNewVoyage() {
  if (run.value && !confirmNewVoyage.value) {
    confirmNewVoyage.value = true
    return
  }
  confirmNewVoyage.value = false
  titlePanel.value = 'home'
  restartVoyage()
}
onMounted(() => {
  store.load()
  void store.loadOnboardingArt()
  void store.loadAlienArtwork()
})
useSeoMeta(
  gameLinkPreviewMeta(
    'game-of-captains',
    useRuntimeConfig().public.appBaseUrl,
  ) ?? {},
)
useHead({ title: 'Space Couch | Kind Robots' })

function selectCrewForDossier(id: CrewId) {
  focusedCrew.value = id
  toggleCrew(id)
}
function toggleCrew(id: CrewId) {
  chosenCrew.value = chosenCrew.value.includes(id)
    ? chosenCrew.value.filter((x) => x !== id)
    : chosenCrew.value.length < 3
      ? [...chosenCrew.value, id]
      : chosenCrew.value
}
function toggleAway(id: CrewId) {
  if (!run.value) return
  const current = run.value.away
  store.assign(
    current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
  )
}
</script>

<style scoped>
.cap-menu {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
  display: flex;
  align-items: center;
  background: #090e20;
}
.cap-menu-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 65% center;
  z-index: -2;
}
.cap-menu-shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    90deg,
    #080d22fa 0%,
    #080d22eb 35%,
    #080d2288 66%,
    #070d2444 100%
  );
}
.cap-menu-body {
  width: min(100%, 43rem);
  padding: clamp(1rem, 3.5cqi, 3.5rem);
  max-height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(0.35rem, 1.2vh, 0.85rem);
}
.cap-opening-trigger {
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 2.5rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid #eebc8c;
  border-radius: 0.3rem;
  background: #102439da;
  color: #fff0d9;
  font-size: clamp(0.62rem, 1cqi, 0.85rem);
  font-weight: 900;
  text-align: left;
}
.cap-opening-trigger small {
  color: #d4dfe5;
  font-size: 0.65rem;
}
.cap-opening-trigger:focus-visible {
  outline: 3px solid #ffe3aa;
  outline-offset: 2px;
}
.cap-menu-kicker,
.cap-menu-bottom {
  font-size: clamp(0.55rem, 0.8cqi, 0.77rem);
  letter-spacing: 0.16em;
  font-weight: 900;
  color: #ebc591;
}
.cap-menu h2 {
  font:
    900 clamp(3.4rem, 7.7cqi, 8rem)/0.86 Georgia,
    serif;
  letter-spacing: -0.08em;
  text-shadow: 0 5px 25px #070a18;
}
.cap-menu h2 em {
  color: #ffc59c;
  font-style: italic;
}
.cap-menu-deck {
  max-width: 44ch;
  font-size: clamp(0.81rem, 1.3cqi, 1.17rem);
  line-height: 1.4;
  color: #d9e8ed;
}
.cap-menu-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.4rem;
}
.cap-menu-actions button,
.cap-menu-detail button {
  border: 1px solid #91bbc0;
  border-left: 3px solid #fbc997;
  border-radius: 0.4rem;
  background: #14263adf;
  color: #fff2dd;
  text-align: left;
  padding: 0.85rem;
  font-weight: 900;
  font-size: clamp(0.7rem, 1.1cqi, 0.94rem);
}
.cap-menu-actions button:hover,
.cap-menu-actions button:focus-visible,
.cap-menu-detail button:hover {
  background: #2e5065;
  border-color: #ffdda7;
}
.cap-menu-actions button span {
  float: right;
  color: #ffc48e;
}
.cap-menu-actions button small {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.74em;
  font-weight: 500;
  line-height: 1.25;
  color: #c3dae0;
}
.cap-menu-detail {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.cap-menu-detail h2 {
  font:
    900 clamp(1.4rem, 2.8cqi, 2rem) Georgia,
    serif;
  color: #f8cc9c;
}
.cap-menu-detail p {
  color: #d6e1e6;
  font-size: 0.78rem;
}
.cap-menu-detail button b {
  float: right;
  color: #9ee7e7;
}
.cap-menu-detail button[aria-pressed='true'] {
  border-color: #9ee7e7;
  background: #235061;
}
.cap-menu-journal {
  flex: 1;
  min-height: 0;
  max-height: min(26vh, 13rem);
  padding: 0.25rem 0.65rem;
  border-left: 2px solid #c0a17a;
}
.cap-menu-journal p {
  margin: 0.4rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cap-menu-log-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.65rem;
}
.cap-menu-log-nav button {
  padding: 0.3rem;
}
.cap-menu-log-nav button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.cap-menu-confirm {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  background: #291f32ee;
  padding: 0.65rem;
  border: 1px solid #e5ba80;
}
.cap-menu-confirm p {
  flex-basis: 100%;
  font-size: 0.76rem;
}
.cap-menu-confirm button {
  padding: 0.45rem;
  border: 1px solid #dbb98b;
  color: #ffdeb3;
  font-size: 0.7rem;
}
.cap-menu-bottom {
  margin-top: 0.2rem;
}
.cap-origins {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}
.cap-origin {
  min-width: 0;
  display: flex;
  gap: 0.5rem;
  border: 1px solid #658796;
  background: #192c40;
  padding: 0.65rem;
  border-radius: 0.5rem;
  text-align: left;
}
.cap-origin:hover,
.cap-origin:focus-visible,
.cap-origin.chosen {
  border-color: #ffd39d;
  background: #294a56;
}
.cap-origin-glyph {
  font:
    900 1.5rem Georgia,
    serif;
  color: #f8c58f;
}
.cap-origin strong,
.cap-origin small {
  display: block;
}
.cap-origin strong {
  font-size: 0.74rem;
  color: #f9e7d1;
}
.cap-origin small {
  font-size: 0.62rem;
  line-height: 1.35;
  color: #b8cfd5;
}
.cap-origin .cap-origin-perk {
  margin-top: 0.3rem;
  color: #ffd29e;
}
.cap-step-back {
  border: 0;
  padding: 0.25rem;
  color: #ffd49d;
  font-size: 0.7rem;
  font-weight: 900;
}
.cap-reduce-motion *,
.cap-reduce-motion *::before,
.cap-reduce-motion *::after {
  animation: none !important;
  transition: none !important;
}
.cap-large-type .cap-menu-deck,
.cap-large-type .cap-origin small,
.cap-large-type .cap-insight p {
  font-size: 1rem;
}
@media (max-width: 700px) {
  .cap-menu-image {
    object-position: 72% center;
    opacity: 0.6;
  }
  .cap-menu-body {
    width: 100%;
    justify-content: center;
    padding: 1rem;
  }
  .cap-menu h2 {
    font-size: clamp(2.8rem, 12vw, 5rem);
  }
  .cap-menu-actions {
    gap: 0.4rem;
  }
  .cap-menu-actions button {
    padding: 0.6rem;
  }
  .cap-origins {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem;
  }
  .cap-origin {
    padding: 0.35rem;
  }
  .cap-origin-glyph {
    font-size: 1rem;
  }
}
@media (max-width: 450px) and (max-height: 720px) {
  .cap-menu-body {
    gap: 0.3rem;
  }
  .cap-menu h2 {
    font-size: 2.7rem;
  }
  .cap-menu-deck {
    font-size: 0.74rem;
  }
  .cap-menu-actions button {
    padding: 0.5rem;
  }
  .cap-menu-bottom {
    display: none;
  }
}
.cap-shell {
  gap: 0;
  background: #080e1d;
  color: #f5eddd;
  font-family: system-ui, sans-serif;
}
.cap-toolbar {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.25rem 0 0.5rem;
  color: var(--color-base-content);
  font-family: system-ui, sans-serif;
  font-size: 0.64rem;
  letter-spacing: 0.1em;
  font-weight: 900;
}
.cap-wordmark {
  flex: none;
  white-space: nowrap;
  font-size: 0.78rem;
}
.cap-emblem {
  color: var(--color-primary);
  font-size: 1.1rem;
}
.cap-wordmark i {
  font-size: 0.8em;
  color: var(--color-primary);
}
.cap-flight,
.cap-hud {
  flex: none;
  padding: 0.3rem 0.55rem;
  border: 1px solid var(--color-base-300);
  border-radius: var(--radius-field, 0.4rem);
  background: color-mix(in oklch, var(--color-base-200) 70%, transparent);
  white-space: nowrap;
}
.cap-flight {
  margin-left: auto;
}
.cap-hud-row {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  scrollbar-width: none;
}
.cap-hud-row::-webkit-scrollbar {
  display: none;
}
.cap-flight b,
.cap-hud b {
  color: var(--color-primary);
}
.cap-flight span,
.cap-hud span {
  margin: 0 0.2rem;
  opacity: 0.5;
}
.cap-actions {
  flex: none;
  display: flex;
  gap: 0.35rem;
}
.cap-wordmark + .cap-actions {
  margin-left: auto;
}
.cap-reset {
  border: 1px solid var(--color-base-300);
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-field, 0.4rem);
  color: var(--color-base-content);
  white-space: nowrap;
}
.cap-reset:hover {
  background: var(--color-base-300);
}
@container (max-width: 760px) {
  .cap-flight {
    display: none;
  }
  .cap-hud-row {
    margin-left: auto;
  }
}
@container (max-width: 560px) {
  .cap-wordmark {
    display: none;
  }
  .cap-signal-label {
    display: none;
  }
}
@container (max-width: 440px) {
  .cap-toolbar {
    gap: 0.3rem;
    padding-left: 0.25rem;
    font-size: 0.56rem;
  }
  .cap-new-voyage {
    display: none;
  }
}
.cap-warning {
  background: #802d2d;
  padding: 0.3rem 1rem;
  font-size: 0.75rem;
}

.cap-layout.cap-layout--personnel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}
.cap-layout--personnel > .cap-stage {
  display: none;
}
.cap-layout--personnel .cap-bridge {
  min-width: 0;
  border-left: 0;
  background:
    linear-gradient(90deg, #0d1b30f5, #11243de8 65%, #0b132adc),
    url('/game-of-captains/space-couch-stage.svg') center / cover;
}
.cap-layout--personnel .cap-personnel-scroll {
  overflow: hidden;
  min-height: 0;
  padding: clamp(0.4rem, 1.2cqi, 1rem);
  container-type: size;
}
.cap-personnel-frame {
  position: relative;
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  gap: clamp(0.3rem, 1.1cqh, 0.8rem);
  overflow: hidden;
}
.cap-personnel-frame[data-screen='background'] {
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.cap-personnel-frame[data-screen='captain'],
.cap-personnel-frame[data-screen='crew'] {
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
}
.cap-personnel-frame .cap-heading {
  grid-column: 1 / -1;
  min-height: 0;
  margin: 0;
  padding-right: 11.5rem;
}
.cap-personnel-frame[data-screen='background'] .cap-heading {
  padding-right: clamp(6rem, 23cqi, 11.5rem);
}
.cap-personnel-frame .cap-heading h2 {
  font-size: clamp(1.15rem, 2.4cqi, 2rem);
}
.cap-personnel-frame .cap-heading p {
  max-width: 70ch;
  font-size: clamp(0.68rem, 1.2cqi, 0.9rem);
  line-height: 1.25;
}
.cap-personnel-frame > .cap-step-back,
.cap-personnel-frame > .cap-option {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: auto;
  max-width: 11rem;
  margin: 0;
  padding: 0.5rem;
  font-size: 0.7rem;
  text-align: right;
}
.cap-personnel-frame > .cap-option small {
  display: none;
}
.cap-personnel-frame .cap-origins {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(0.35rem, 1.2cqh, 0.8rem);
}
.cap-personnel-frame .cap-origin {
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1.15fr) minmax(0, 0.85fr);
  overflow: hidden;
  align-items: stretch;
  padding: clamp(0.35rem, 1.5cqi, 1rem);
  gap: clamp(0.3rem, 1cqi, 0.8rem);
}
.cap-personnel-frame .cap-origin-art {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: cover;
  object-position: center;
  border-radius: 0.35rem;
}
.cap-personnel-frame .cap-origin-art--waiting {
  display: grid;
  place-items: center;
  background: #0a1c30;
  color: #bad0de;
  font-size: 0.57rem;
  letter-spacing: 0.12em;
  text-align: center;
}
.cap-personnel-frame .cap-origin-copy {
  display: grid;
  gap: 0.15rem;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}
.cap-personnel-frame .cap-origin-copy small {
  display: block;
  opacity: 0;
  transition: opacity 220ms ease;
}
.cap-personnel-frame .cap-origin-ready .cap-origin-copy small {
  opacity: 1;
}
.cap-personnel-frame .cap-origin-glyph {
  font-size: clamp(1.45rem, 3cqi, 2.6rem);
}
.cap-personnel-frame .cap-origin strong {
  font-size: clamp(0.78rem, 1.4cqi, 1.1rem);
  line-height: 1.12;
}
.cap-personnel-frame .cap-origin small {
  font-size: clamp(0.65rem, 1.05cqi, 0.88rem);
  line-height: 1.25;
}
.cap-personnel-frame .cap-primary {
  grid-column: 1 / -1;
  width: 100%;
  min-height: clamp(2.6rem, 6cqh, 3.5rem);
  margin: 0;
}
.cap-personnel-frame .cap-captains {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: clamp(0.25rem, 0.8cqh, 0.65rem);
  margin: 0;
}
.cap-personnel-frame .cap-captain {
  min-width: 0;
  min-height: 0;
  padding: clamp(0.3rem, 1cqi, 0.85rem);
  gap: 0.5rem;
}
.cap-personnel-frame .cap-captain-icon,
.cap-personnel-frame .cap-monogram {
  flex: 0 0 clamp(2rem, 4.5cqi, 3.7rem);
  width: clamp(2rem, 4.5cqi, 3.7rem);
  height: clamp(2rem, 4.5cqi, 3.7rem);
}
.cap-personnel-frame .cap-captain-copy small {
  opacity: 0;
  transition: opacity 220ms ease;
}
.cap-personnel-frame .cap-captain-ready .cap-captain-copy small {
  opacity: 1;
}
.cap-personnel-frame .cap-captain strong,
.cap-personnel-frame .cap-crew-button strong {
  font-size: clamp(0.7rem, 1.15cqi, 0.98rem);
}
.cap-personnel-frame .cap-captain small,
.cap-personnel-frame .cap-crew-button small {
  font-size: clamp(0.6rem, 0.9cqi, 0.78rem);
}
.cap-personnel-dossier {
  display: flex;
  min-height: 0;
  min-width: 0;
  flex-direction: column;
  gap: clamp(0.3rem, 0.9cqh, 0.75rem);
  overflow: hidden;
  padding: clamp(0.4rem, 1.1cqi, 0.85rem);
  border: 1px solid #91bbc399;
  border-radius: 0.8rem;
  background: linear-gradient(160deg, #1f384fe8, #172238ee);
}
.cap-dossier-header {
  display: flex;
  min-height: 0;
  align-items: center;
  gap: clamp(0.4rem, 1.1cqi, 0.85rem);
}
.cap-dossier-header img,
.cap-dossier-monogram {
  flex: 0 0 clamp(3rem, 6cqi, 6rem);
  width: clamp(3rem, 6cqi, 6rem);
  height: clamp(3rem, 6cqi, 6rem);
  object-fit: cover;
  border: 2px solid #f2c893;
  border-radius: 0.65rem;
}
.cap-dossier-monogram {
  display: grid;
  place-items: center;
  font:
    900 2rem Georgia,
    serif;
  color: #f7c994;
  background: #30465d;
}
.cap-dossier-header > span:nth-child(2) {
  min-width: 0;
  flex: 1;
}
.cap-dossier-header strong,
.cap-dossier-header small {
  display: block;
  line-height: 1.2;
}
.cap-dossier-header strong {
  color: #ffe2bc;
  font-size: clamp(0.8rem, 1.5cqi, 1.15rem);
}
.cap-dossier-header small {
  color: #bcdbdf;
  font-size: clamp(0.64rem, 0.95cqi, 0.78rem);
}
.cap-dossier-header button {
  align-self: flex-start;
  padding: 0.4rem;
  border: 1px solid #d8b887;
  border-radius: 0.3rem;
  white-space: nowrap;
  color: #ffe2b7;
  font-size: 0.65rem;
  font-weight: 900;
}
.cap-dossier-header button:hover,
.cap-dossier-header button:focus-visible,
.cap-crew-pages button:hover:not(:disabled),
.cap-crew-pages button:focus-visible {
  background: #36556a;
  outline-offset: 2px;
}
.cap-personnel-dossier .cap-insight {
  min-height: 0;
  margin: 0;
  padding: 0.4rem;
}
.cap-personnel-dossier .cap-stats {
  margin: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.cap-personnel-dossier .cap-stats > div {
  padding: clamp(0.2rem, 0.8cqh, 0.6rem);
}
.cap-personnel-dossier .cap-stats strong {
  margin-top: 0.1rem;
  font-size: clamp(0.9rem, 1.8cqi, 1.5rem);
}
.cap-personnel-dossier .cap-dossier-story p,
.cap-personnel-dossier .cap-dossier-story small {
  margin: 0.2rem 0;
  font-size: clamp(0.65rem, 0.95cqi, 0.84rem);
  line-height: 1.35;
}
.cap-crew-roster {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto auto;
  min-height: 0;
  min-width: 0;
  gap: clamp(0.2rem, 0.6cqh, 0.5rem);
}
.cap-personnel-frame .cap-crew-picker {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(0.2rem, 0.65cqh, 0.55rem);
  margin: 0;
}
.cap-personnel-frame .cap-crew-button {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  text-align: center;
  gap: clamp(0.15rem, 0.4cqh, 0.35rem);
}
.cap-personnel-frame .cap-crew-button > span:nth-child(2) {
  min-width: 0;
}
.cap-personnel-frame .cap-crew-button > b {
  position: absolute;
  right: 0.4rem;
  top: 0.4rem;
}
.cap-pocket-room-choice {
  overflow: hidden;
}
.cap-pocket-room-art {
  display: block;
  width: 100%;
  height: clamp(3.5rem, 10cqh, 7.5rem);
  border: 1px solid #d5b38a8f;
  border-radius: 0.3rem;
  object-fit: cover;
}
.cap-consequence-choices {
  display: grid;
  gap: 0.4rem;
}
.cap-consequence-choices > strong,
.cap-consequence-receipt > strong {
  color: #ffd39d;
  letter-spacing: 0.09em;
}
.cap-consequence-choices > p,
.cap-consequence-receipt > p {
  color: #d7e5eb;
  font-size: clamp(0.78rem, 1.15cqi, 0.95rem);
}
.cap-consequence-choice {
  border-left: 0.3rem solid #efb981;
}
.cap-consequence-choice small {
  display: block;
  margin-top: 0.15rem;
}
.cap-consequence-receipt {
  border: 1px solid #f1c287;
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: #102b3ee8;
}
.cap-crew-pages {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.3rem;
  color: #9de6e8;
  font-size: clamp(0.59rem, 0.95cqi, 0.76rem);
  font-weight: 900;
}
.cap-crew-pages button {
  min-height: 2rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid #88b2bd;
  border-radius: 0.3rem;
  color: #ffdbac;
}
.cap-crew-pages button:disabled {
  opacity: 0.4;
}
.cap-personnel-frame .cap-team-note {
  min-width: 0;
  line-height: 1.3;
  font-size: clamp(0.6rem, 0.92cqi, 0.75rem);
}
.cap-large-type .cap-personnel-frame .cap-crew-button strong,
.cap-large-type .cap-personnel-frame .cap-captain strong {
  font-size: clamp(0.85rem, 1.4cqi, 1.1rem);
}
@media (max-width: 650px) {
  .cap-personnel-frame[data-screen='captain'],
  .cap-personnel-frame[data-screen='crew'] {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) minmax(0, 0.55fr) auto;
  }
  .cap-personnel-frame .cap-heading {
    padding-right: 6.5rem;
  }
  .cap-personnel-frame .cap-heading p {
    display: none;
  }
  .cap-personnel-frame > .cap-step-back,
  .cap-personnel-frame > .cap-option {
    max-width: 6.2rem;
    font-size: 0.56rem;
  }
  .cap-personnel-frame .cap-origins {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
  }
  .cap-personnel-frame .cap-origin {
    padding: 0.3rem;
  }
  .cap-personnel-frame .cap-origin-glyph {
    font-size: 1.2rem;
  }
  .cap-personnel-frame .cap-captains {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .cap-personnel-frame .cap-crew-picker {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .cap-personnel-frame .cap-personnel-dossier {
    min-height: 0;
    grid-row: 3;
    grid-column: 1;
  }
  .cap-dossier-header img,
  .cap-dossier-monogram {
    flex-basis: 2.3rem;
    width: 2.3rem;
    height: 2.3rem;
  }
  .cap-personnel-dossier .cap-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.2rem;
  }
  .cap-personnel-dossier .cap-stats > div {
    padding: 0.2rem;
  }
  .cap-personnel-dossier .cap-stats strong {
    font-size: 0.9rem;
  }
  .cap-personnel-dossier .cap-dossier-story p,
  .cap-personnel-dossier .cap-dossier-story small {
    font-size: clamp(0.59rem, 2vw, 0.76rem);
    line-height: 1.2;
  }
  .cap-personnel-frame .cap-primary {
    grid-row: 4;
  }
}
@media (max-width: 420px) {
  .cap-personnel-frame .cap-origin small {
    font-size: 0.61rem;
  }
  .cap-personnel-frame .cap-captain-icon,
  .cap-personnel-frame .cap-monogram {
    flex-basis: 2rem;
    width: 2rem;
    height: 2rem;
  }
  .cap-personnel-frame .cap-crew-button small {
    display: none;
  }
  .cap-personnel-frame .cap-crew-pages {
    font-size: 0.56rem;
  }
  .cap-personnel-frame .cap-crew-pages button {
    padding: 0.3rem;
  }
}

.cap-layout.cap-layout--stars {
  display: block;
  min-height: 0;
}
.cap-layout--stars > .cap-stage {
  display: none;
}
.cap-layout--stars .cap-bridge {
  height: 100%;
  width: 100%;
  min-height: 0;
}
.cap-layout--stars .cap-scroll {
  height: 100%;
  padding: 0;
  overflow: hidden;
}
.cap-layout.cap-layout--episode {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}
.cap-layout--episode > .cap-stage {
  display: none;
}
.cap-layout--episode .cap-bridge {
  min-width: 0;
  min-height: 0;
  border-left: 0;
}
.cap-episode-scroll {
  height: 100%;
  min-height: 0;
  padding: 0 !important;
  overflow: hidden !important;
}
.cap-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(330px, 0.82fr);
  overflow: hidden;
}
.cap-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #14263a;
}
.cap-painting {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
.cap-vignette {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      0deg,
      #080c21fa 0%,
      #0a0d25b6 24%,
      #080e205e 50%,
      transparent 80%
    ),
    radial-gradient(ellipse at 30% 30%, transparent 20%, #04091677 100%);
  pointer-events: none;
}
.cap-overlay {
  position: absolute;
  left: 5%;
  right: 4%;
  bottom: 9%;
  z-index: 1;
  text-shadow: 0 4px 16px #000a;
}
.cap-kicker,
.cap-coordinate {
  color: #ffcb92;
  letter-spacing: 0.22em;
  font-size: clamp(0.53rem, 0.74vw, 0.72rem);
  font-weight: 900;
}
.cap-kicker span {
  padding: 0 0.6rem;
  color: #8ddee5;
}
.cap-title,
.cap-chapter {
  font-family: Georgia, serif;
  font-weight: 900;
  line-height: 0.93;
  letter-spacing: -0.058em;
  text-wrap: balance;
}
.cap-title {
  font-size: clamp(3.1rem, 7vw, 8rem);
  margin: 1rem 0;
}
.cap-title small {
  font-size: 0.35em;
  font-style: italic;
  color: #f0c196;
  vertical-align: middle;
  letter-spacing: -0.07em;
}
.cap-title span {
  display: block;
  color: #eec59f;
}
.cap-chapter {
  font-size: clamp(2rem, 4.4vw, 4.7rem);
  margin: 0.65rem 0;
  max-width: 680px;
}
.cap-tagline,
.cap-copy {
  font-size: clamp(0.82rem, 1.3vw, 1.12rem);
  line-height: 1.55;
  max-width: 43ch;
  color: #d5e5ed;
}
.cap-quest-portrait-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-start;
}
.cap-quest-portrait {
  width: min(30%, 7.5rem);
  max-height: 9rem;
  min-width: 4.75rem;
  flex: 0 0 auto;
  border-radius: 0.4rem;
  object-fit: cover;
  border: 1px solid #e4c49888;
}
.cap-quest-portrait-line p {
  flex: 1 1 12rem;
}
.cap-grand-quest,
.cap-quest-phase {
  padding: 0.75rem;
  display: grid;
  gap: 0.45rem;
  border: 1px solid #91b8bf7a;
  border-radius: 0.65rem;
  background: linear-gradient(150deg, #21354c, #18263b);
}
.cap-grand-quest strong,
.cap-quest-phase strong {
  color: #ffd9ac;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
}
.cap-grand-quest p,
.cap-quest-phase p {
  font-size: 0.8rem;
  line-height: 1.6;
  margin: 0;
  color: #f3eddf;
}
.cap-grand-quest small,
.cap-quest-phase small {
  color: #bed9df;
  line-height: 1.5;
}
.cap-quest-reversal {
  border-color: #f0bd80;
  background: linear-gradient(150deg, #50382d, #293046);
}
.cap-redshirt-travel,
.cap-redshirt-dorm,
.cap-solar-circuit,
.cap-casino-scene {
  border: 1px solid
    color-mix(in srgb, var(--color-primary, #e8b779) 45%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, #0e1b35 90%, transparent);
  padding: clamp(0.75rem, 2cqi, 1.15rem);
  display: grid;
  gap: 0.7rem;
}
.cap-system-nodes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.5rem;
}
.cap-system-node {
  display: grid;
  gap: 0.3rem;
  border: 1px solid #526b9a;
  border-radius: 0.55rem;
  padding: 0.65rem;
  background: #111a2b;
  opacity: 0.66;
}
.cap-system-node.active {
  opacity: 1;
  border-color: #f5be65;
  box-shadow: inset 0 0 0 1px #f5be65;
}
.cap-system-node small,
.cap-casino-description p {
  font-size: 0.83rem;
  line-height: 1.45;
}
.cap-casino-layout {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
}
.cap-casino-art {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.7rem;
  background: #142644;
  min-width: 0;
}
.cap-casino-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cap-casino-art-pending {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem;
  text-align: center;
  color: #f6d198;
  background: radial-gradient(ellipse at 68% 25%, #264d94 0, #0a1530 68%);
}
.cap-casino-art-pending strong {
  font-size: clamp(1rem, 2cqi, 1.7rem);
}
.cap-casino-art-pending small {
  opacity: 0.8;
}
.cap-venue-quests {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  gap: 0.65rem;
}
.cap-venue-actions {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.75rem;
}
.cap-venue-actions .cap-option {
  text-align: left;
  font-size: 0.8rem;
}

.cap-expedition-board {
  display: grid;
  gap: 0.7rem;
  border: 1px solid #c991857c;
  background: linear-gradient(140deg, #311d31, #172c3c);
  border-radius: 0.7rem;
  padding: 0.85rem;
}
.cap-redshirt-dorm p,
.cap-redshirt-travel p,
.cap-expedition-card p {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.55;
}
.cap-expedition-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.4rem;
}
.cap-expedition-head strong {
  color: #ffd5b4;
  font-size: 0.75rem;
}
.cap-expedition-head small {
  color: #d0e3e6;
  font-size: 0.68rem;
}
.cap-redshirt-list {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  max-height: 15rem;
  overflow-y: auto;
}
.cap-redshirt-person {
  display: grid;
  gap: 0.23rem;
  border: 1px solid #f39e8b88;
  border-left: 4px solid #fa4c59;
  border-radius: 0.4rem;
  background: #3b2835;
  padding: 0.5rem;
}
.cap-redshirt-person b {
  color: #fff0e3;
  font-size: 0.75rem;
}
.cap-redshirt-person small {
  color: #c9dadd;
  font-size: 0.65rem;
  line-height: 1.3;
}
.cap-expedition-card {
  display: grid;
  gap: 0.6rem;
  border: 1px solid #90a9b57a;
  border-radius: 0.6rem;
  padding: 0.8rem;
  background: #182f3e;
}
.cap-expedition-card.completed {
  border-color: #89cc9f;
  background: #233c3b;
}
.cap-expedition-card label {
  font-size: 0.7rem;
  font-weight: 700;
}
.cap-expedition-card select {
  width: 100%;
  padding: 0.55rem;
  background: #24394c;
  border: 1px solid #a9c8c7;
  border-radius: 0.4rem;
  color: #fff4e6;
  font-size: 0.76rem;
}
.cap-expedition-card select:focus-visible {
  outline: 2px solid #ffd5b4;
}
.cap-expedition-outcome {
  color: #ffdbb6;
  white-space: normal;
}
.cap-route-board {
  padding: 0.65rem;
  border: 1px solid #91b8bf5e;
  border-radius: 0.8rem;
  background: linear-gradient(145deg, #142a3d, #1d2939 80%);
  display: grid;
  gap: 0.5rem;
}
.cap-route-heading {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #c2dce3;
}
.cap-route-heading strong {
  color: #f2caa6;
}
.cap-route-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.45rem;
}
.cap-route-option {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 4rem;
  padding: 0.5rem;
  border: 1px solid #829eaf80;
  border-radius: 0.6rem;
  color: #ebf3f2;
  text-align: left;
  background: #243b4c;
}
.cap-route-option.active {
  border-color: #ffd09f;
  background: #5b473e;
  box-shadow: inset 0 0 0 1px #e9b48680;
}
.cap-route-option:focus-visible {
  outline: 3px solid #ffdcab;
  outline-offset: 2px;
}
.cap-route-node {
  display: grid;
  place-items: center;
  flex: 0 0 1.8rem;
  height: 1.8rem;
  border-radius: 100%;
  border: 1px solid #b9d5d9;
  color: #f9dcb4;
  font-weight: 900;
}
.cap-route-text {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}
.cap-route-text strong {
  font-size: 0.72rem;
}
.cap-route-text small {
  font-size: 0.63rem;
  line-height: 1.35;
  color: #d0dfe2;
}
.cap-route-arrow {
  margin-left: auto;
  color: #ffd09f;
  font-size: 1.35rem;
}
.cap-route-memory {
  margin: 0;
  color: #e5d6c8;
  font-size: 0.7rem;
  line-height: 1.4;
}
.cap-character-promise,
.cap-instinct {
  display: grid;
  gap: 0.45rem;
  padding: 0.85rem;
  border: 1px solid #8ec3cd7a;
  border-radius: 0.7rem;
  background: linear-gradient(135deg, #253a49, #14243d);
}
.cap-character-promise h3,
.cap-instinct h3 {
  margin: 0;
  color: #ffe3c4;
  font:
    800 1rem/1.4 Georgia,
    serif;
}
.cap-character-promise p,
.cap-instinct p {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.55;
}
.cap-character-promise strong,
.cap-instinct strong {
  color: #f9c998;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}
.cap-character-promise small,
.cap-instinct-response {
  color: #c1d8dd;
  line-height: 1.5;
}
.cap-starmap {
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: 0.7rem;
  color: #dfb99d9e;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.11em;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.cap-bridge {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  background: linear-gradient(145deg, #203447, #0e1b2d 55%, #111728);
  border-left: 2px solid #819fb27c;
}
.cap-panel-title,
.cap-footer {
  flex-shrink: 0;
  padding: 0.65rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2.2rem;
  font-size: 0.58rem;
  color: #9fbbc7;
  font-weight: 900;
  letter-spacing: 0.14em;
  border-bottom: 1px solid #86b1c34d;
}
.cap-panel-title > span:last-child {
  color: #e8c08f;
}
.cap-leds {
  display: flex;
  gap: 0.35rem;
}
.cap-leds i {
  display: block;
  width: 8px;
  height: 8px;
  border: 1px solid #95c5ce81;
  border-radius: 50%;
}
.cap-leds .active {
  background: #ffcf9f;
  box-shadow: 0 0 9px #ffc69a55;
}
.cap-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #bb9868 transparent;
  padding: clamp(0.7rem, 1.2vw, 1.35rem);
}
.cap-heading {
  display: flex;
  gap: 0.8rem;
  align-items: start;
  margin: 0.2rem 0 0.85rem;
}
.cap-heading > span {
  font-family: Georgia, serif;
  color: #efbd91;
  font-weight: 900;
  font-size: 1.9rem;
  line-height: 1;
}
.cap-heading h2 {
  font-family: Georgia, serif;
  font-size: clamp(1.12rem, 1.6vw, 1.55rem);
  font-weight: 900;
  line-height: 1.15;
}
.cap-heading p {
  color: #bbd0d8;
  font-size: 0.72rem;
  line-height: 1.45;
  margin-top: 0.3rem;
}
.cap-captain-stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0.5rem 0;
}
.cap-captain-stats > div {
  padding: 0.3rem;
}
.cap-odds {
  border: 1px solid #c6a477;
  background: #112e4199;
  padding: 0.7rem;
  border-radius: 0.65rem;
  margin: 0.7rem 0;
}
.cap-odds-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  color: #ffe0b5;
  font-weight: 900;
  font-size: 0.85rem;
}
.cap-odds p {
  font-size: 0.71rem;
  line-height: 1.5;
  color: #d1e0e3;
  margin-top: 0.3rem;
}
.cap-odds .cap-special {
  color: #ffd8a5;
  border-top: 1px solid #caac7c66;
  padding-top: 0.35rem;
}
.cap-crew-story {
  font-size: 0.67rem;
  color: #d0e1df;
  line-height: 1.5;
  margin: 0.7rem 0;
}
.cap-captains {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
}
.cap-captain {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  text-align: left;
  background: #44617435;
  border: 1px solid #91b8c06d;
  border-radius: 0.65rem;
  padding: 0.5rem;
  color: #f3efea;
}
.cap-captain.chosen,
.cap-crew-button.chosen {
  border-color: #ffd3a3;
  background: #a978635e;
}
.cap-captain:hover,
.cap-crew-button:hover:not(:disabled) {
  border-color: #f7c69a;
  background: #43677677;
}
.cap-captain-icon {
  overflow: hidden;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  border: 1px solid #e8bc9a;
  border-radius: 50%;
  font-family: Georgia, serif;
  font-weight: 900;
  font-size: 1.2rem;
  color: #ffe0ba;
  background: linear-gradient(145deg, #657994, #29364c);
}
.cap-captain strong,
.cap-crew-button strong {
  display: block;
  font-size: 0.75rem;
  line-height: 1.2;
}
.cap-captain small,
.cap-crew-button small {
  display: block;
  font-size: 0.59rem;
  color: #b7c5d2;
  line-height: 1.25;
  margin-top: 0.12rem;
}
.cap-romance {
  margin: 1rem 0;
  padding: 0.9rem;
  border: 1px solid #c7ad8999;
  border-radius: 0.75rem;
  background: linear-gradient(155deg, #213e51dd, #262438e8);
}
.cap-romance-kicker {
  color: #ffd5ab;
  font-size: 0.6rem;
  letter-spacing: 0.13em;
  font-weight: 900;
}
.cap-romance h3 {
  margin: 0.35rem 0 0.5rem;
  font:
    900 clamp(1.15rem, 2vw, 1.5rem) Georgia,
    serif;
  color: #ffe0b6;
}
.cap-romance-faces {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0.55rem 0;
}
.cap-romance-face {
  display: grid;
  place-items: center;
  min-height: 3.4rem;
  min-width: 3.4rem;
  max-width: 5.3rem;
  overflow: hidden;
  padding: 0.25rem;
  border: 1px solid #d5b68d8f;
  border-radius: 0.45rem;
  color: #ffddb5;
  font-size: 0.6rem;
  font-weight: 800;
  background: #365266;
}
.cap-romance-face img {
  width: 100%;
  height: 4rem;
  object-fit: cover;
}
.cap-romance-setting,
.cap-romance-line,
.cap-romance-outcome {
  font-size: 0.78rem;
  line-height: 1.55;
  color: #dae4e6;
}
.cap-romance-setting {
  margin-bottom: 0.5rem;
  font-style: italic;
}
.cap-romance-line {
  margin: 0.35rem 0 0.65rem;
}
.cap-romance-line strong {
  color: #ffdab0;
}
.cap-romance-outcome {
  border-left: 3px solid #efc49c;
  padding: 0.6rem 0.85rem;
  background: #39536470;
}
.cap-insight {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  border-left: 2px solid #f2c092;
  margin: 0.85rem 0.15rem;
  padding: 0.1rem 0.75rem;
}
.cap-insight strong {
  font-family: Georgia, serif;
  color: #ffdab0;
  font-size: 0.86rem;
}
.cap-insight small {
  color: #a7c6d0;
  font-size: 0.67rem;
}
.cap-crew-heading {
  margin-top: 1rem;
}
.cap-crew-picker {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.cap-crew-button {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.5rem;
  border: 1px solid #91b8c064;
  background: #36546a44;
  padding: 0.5rem;
  border-radius: 0.6rem;
  text-align: left;
  color: #f0eeec;
}
.cap-crew-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
.cap-crew-button > span:nth-child(2) {
  flex: 1;
  min-width: 0;
}
.cap-crew-button > b {
  font-size: 0.57rem;
  color: #f1c190;
}
.cap-portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  border-radius: inherit;
}
.cap-monogram {
  overflow: hidden;
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  font-size: 0.64rem;
  border-radius: 0.45rem;
  background: linear-gradient(145deg, #957e83, #3d5e78);
  font-weight: 900;
}
.cap-primary {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
  margin-top: 0.65rem;
  min-height: 2.8rem;
  border: 1px solid #fce8bf;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, #ddbb92, #e99d85);
  color: #172235;
  letter-spacing: 0.1em;
  font-size: 0.74rem;
  font-weight: 900;
  box-shadow: 0 12px 25px #0004;
}
.cap-primary:hover:not(:disabled) {
  filter: brightness(1.08);
}
.cap-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.cap-subnote,
.cap-placeholder {
  font-size: 0.66rem;
  line-height: 1.5;
  color: #9badb6;
  margin: 0.65rem 0;
}
.cap-narrative {
  font-family: Georgia, serif;
  font-size: clamp(0.87rem, 1.04vw, 1rem);
  line-height: 1.8;
  color: #f0e8de;
  margin: 1.1rem 0.1rem;
}
.cap-antagonist {
  border: 1px solid #d6989892;
  border-radius: 0.65rem;
  background: #9b495f30;
  padding: 0.7rem;
  margin: 0.8rem 0;
}
.cap-callbacks {
  border-left: 2px solid #f8c79780;
  padding: 0.2rem 0 0.2rem 0.7rem;
  margin: 0.6rem 0;
}
.cap-callbacks p {
  font-size: 0.72rem;
  line-height: 1.5;
  margin: 0.25rem 0;
  color: #e5d6c8;
}
.cap-callbacks strong {
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: #f8c797;
  margin-right: 0.3rem;
}
.cap-antagonist strong {
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  color: #ffb0ac;
}
.cap-antagonist p {
  font-size: 0.75rem;
  line-height: 1.55;
  margin: 0.3rem 0;
  color: #e2d9e4;
}
.cap-antagonist small {
  color: #f8c797;
}
.cap-team-note {
  display: flex;
  justify-content: space-between;
  color: #9cc1cf;
  font-size: 0.67rem;
  font-weight: 800;
}
.cap-team-note span {
  color: #edc397;
}
.cap-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  text-align: left;
  border: 1px solid #96bac296;
  border-radius: 0.65rem;
  background: linear-gradient(90deg, #36587594, #23344b);
  padding: 0.9rem;
  margin: 0.5rem 0;
  color: #fcf1e4;
}
.cap-option:hover {
  background: #547489;
  border-color: #f3c092;
}
.cap-option b {
  display: block;
  font-size: 0.84rem;
}
.cap-option small {
  display: block;
  font-size: 0.69rem;
  line-height: 1.5;
  color: #bbd1d9;
  margin-top: 0.2rem;
}
.cap-mission-report {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.7rem;
  border-left: 2px solid #f3c092;
  background: #ffffff0c;
}
.cap-mission-report strong {
  font-size: 0.65rem;
  letter-spacing: 0.13em;
  color: #ffce97;
}
.cap-mission-report span {
  font-size: 0.65rem;
  color: #96c9d0;
}
.cap-mission-report p {
  font-size: 0.8rem;
  line-height: 1.6;
  color: #e1e8ed;
}
.cap-alert {
  margin: 0.9rem 0;
  padding: 0.8rem;
  font-size: 0.75rem;
  line-height: 1.6;
  color: #f2d0b5;
  border: 1px solid #e4a18066;
  border-radius: 0.5rem;
  background: #7f4b4130;
}
.cap-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.4rem;
  margin: 0.8rem 0;
}
.cap-stats > div {
  background: #203950;
  border: 1px solid #769ea4;
  border-radius: 0.4rem;
  padding: 0.6rem;
  text-align: center;
}
.cap-stats small {
  display: block;
  font-size: 0.52rem;
  letter-spacing: 0.06em;
  color: #bed0d8;
}
.cap-stats strong {
  display: block;
  margin-top: 0.3rem;
  color: #ffd1a2;
  font-size: 1.4rem;
}
.cap-log {
  border-left: 2px solid #81bbc6;
  padding: 0.5rem 0.8rem;
  margin: 1.2rem 0;
  font-size: 0.75rem;
}
.cap-log strong {
  color: #f5cba2;
  font-size: 0.65rem;
  letter-spacing: 0.13em;
}
.cap-log p {
  margin: 0.6rem 0;
  line-height: 1.6;
  color: #c4d3db;
}
.cap-footer {
  border-top: 1px solid #86b1c34d;
  border-bottom: 0;
  min-height: 2rem;
}
@media (max-width: 850px) {
  .cap-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 41%) minmax(0, 59%);
  }
  .cap-layout.cap-layout--episode {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr);
  }
  .cap-bridge {
    border-left: 0;
    border-top: 2px solid #a2b2bb88;
  }
  .cap-overlay {
    bottom: 14%;
  }
  .cap-title {
    font-size: clamp(2.7rem, 8vw, 5rem);
  }
  .cap-chapter {
    font-size: clamp(2rem, 6vw, 3rem);
  }
}
@media (max-width: 450px) {
  .cap-overlay {
    bottom: 18%;
  }
  .cap-kicker {
    font-size: 0.48rem;
  }
  .cap-tagline,
  .cap-copy {
    font-size: 0.75rem;
    line-height: 1.4;
  }
  .cap-starmap {
    font-size: 0.44rem;
  }
  .cap-captain {
    padding: 0.3rem;
  }
  .cap-captain-icon {
    width: 1.6rem;
    height: 1.6rem;
    font-size: 0.9rem;
  }
  .cap-captain strong,
  .cap-crew-button strong {
    font-size: 0.67rem;
  }
  .cap-captain small,
  .cap-crew-button small {
    font-size: 0.53rem;
  }
  .cap-monogram {
    width: 1.7rem;
    height: 1.7rem;
  }
  .cap-crew-button {
    padding: 0.34rem;
  }
  .cap-panel-title,
  .cap-footer {
    font-size: 0.52rem;
  }
  .cap-scroll {
    padding: 0.7rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cap-painting {
    transition: none;
  }
}

.cap-personnel-frame[data-screen='captain'],
.cap-personnel-frame[data-screen='crew'] {
  grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr);
}
.cap-personnel-frame .cap-personnel-dossier {
  display: grid;
  grid-template-rows: minmax(0, 1.45fr) auto auto minmax(3.4rem, 0.32fr);
  gap: clamp(0.2rem, 0.65cqh, 0.5rem);
  padding: clamp(0.3rem, 0.8cqi, 0.75rem);
}
.cap-personnel-hero {
  position: relative;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  margin: 0;
  border: 1px solid #d6b88995;
  border-radius: 0.7rem;
  background: #0e2135;
}
.cap-personnel-hero-image,
.cap-personnel-hero-fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 23%;
}
.cap-personnel-hero-fallback {
  display: grid;
  place-items: center;
  background:
    linear-gradient(180deg, #1420332e, #081426d8),
    url('/game-of-captains/space-couch-stage.svg') center / cover;
}
.cap-personnel-hero-fallback strong {
  font:
    900 clamp(4rem, 12cqi, 11rem) Georgia,
    serif;
  color: #ffdfa9d9;
  text-shadow: 0 5px 30px #000a;
}
.cap-expression-tabs {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.25rem;
  max-width: 90%;
}
.cap-expression-tabs button {
  min-height: 2rem;
  padding: 0.35rem 0.45rem;
  border: 1px solid #f2c59099;
  border-radius: 0.3rem;
  background: #0a1828ee;
  color: #f4d7b7;
  font-size: clamp(0.55rem, 0.85cqi, 0.72rem);
  font-weight: 800;
}
.cap-expression-tabs button.selected {
  background: #e7ac83;
  color: #112039;
}
.cap-personnel-hero figcaption {
  position: absolute;
  inset: auto 0 0;
  display: grid;
  gap: 0.1rem;
  padding: clamp(0.5rem, 1.3cqi, 1rem);
  background: linear-gradient(0deg, #07101ff5, transparent);
  text-shadow: 0 2px 8px #000c;
}
.cap-personnel-hero figcaption span {
  color: #f6c792;
  font-size: clamp(0.55rem, 0.88cqi, 0.75rem);
  font-weight: 900;
  letter-spacing: 0.17em;
}
.cap-personnel-hero figcaption strong {
  color: #fff0dd;
  font:
    900 clamp(1rem, 2.65cqi, 2.3rem) Georgia,
    serif;
  line-height: 1;
}
.cap-personnel-frame .cap-dossier-header {
  min-height: 2rem;
}
.cap-personnel-frame .cap-dossier-header > img,
.cap-personnel-frame .cap-dossier-header > .cap-dossier-monogram {
  display: none;
}
.cap-personnel-frame .cap-personnel-essential-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.2rem;
  margin: 0;
}
.cap-personnel-frame .cap-personnel-essential-stats > div {
  padding: clamp(0.15rem, 0.5cqi, 0.45rem);
  border: 1px solid #7bb5bc62;
  border-radius: 0.4rem;
  text-align: center;
  background: #0b1a2abf;
}
.cap-personnel-frame .cap-personnel-essential-stats small {
  display: block;
  font-size: clamp(0.5rem, 0.8cqi, 0.75rem);
}
.cap-personnel-frame .cap-personnel-essential-stats strong {
  display: block;
  font-size: clamp(0.95rem, 1.8cqi, 1.5rem);
}
.cap-personnel-frame .cap-personnel-dossier .cap-insight {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}
.cap-personnel-frame .cap-crew-button {
  flex-direction: row;
  justify-content: flex-start;
  text-align: left;
}
.cap-personnel-frame .cap-crew-button > b {
  top: auto;
  bottom: 0.3rem;
}
@media (max-width: 650px) {
  .cap-personnel-frame[data-screen='captain'],
  .cap-personnel-frame[data-screen='crew'] {
    grid-template-columns: minmax(0, 0.45fr) minmax(0, 0.55fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .cap-personnel-frame .cap-personnel-dossier {
    grid-row: 2;
    grid-column: 2;
    grid-template-rows: minmax(0, 1.35fr) auto auto minmax(3.6rem, 0.3fr);
  }
  .cap-personnel-frame .cap-captains,
  .cap-personnel-frame .cap-crew-picker {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(6, minmax(0, 1fr));
  }
  .cap-personnel-frame .cap-crew-button,
  .cap-personnel-frame .cap-captain {
    flex-direction: row;
    padding: 0.2rem;
    gap: 0.2rem;
  }
  .cap-personnel-frame .cap-crew-button strong,
  .cap-personnel-frame .cap-captain strong {
    font-size: 0.65rem;
  }
  .cap-personnel-frame .cap-crew-button small,
  .cap-personnel-frame .cap-captain small {
    display: none;
  }
  .cap-personnel-frame .cap-personnel-essential-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .cap-personnel-frame .cap-personnel-essential-stats small {
    font-size: clamp(0.43rem, 1.5cqi, 0.65rem);
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }
  .cap-personnel-frame .cap-personnel-essential-stats strong {
    font-size: 1rem;
    margin-top: 0;
  }
  .cap-personnel-frame .cap-crew-pages {
    flex-wrap: wrap;
  }
}
</style>
