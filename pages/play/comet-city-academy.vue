<template>
  <main
    class="kr-surface cca-shell relative h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    aria-label="Prom of Doom game"
  >
    <header v-if="run" class="cca-topbar">
      <NuxtLink to="/" class="cca-home" aria-label="Return to Kind Robots home"
        >‹ <span class="hidden sm:inline">HOME</span></NuxtLink
      >
      <span class="cca-insignia">✦</span>
      <span class="cca-top-title">PROM <b>OF DOOM</b></span>
      <span class="cca-top-detail">{{
        run ? 'YEAR 01 / DAY ' + run.day : 'ADMISSIONS OPEN'
      }}</span>
      <span v-if="run" class="cca-score"
        >INFLUENCE {{ run.influence >= 0 ? '+' : '' }}{{ run.influence }}
        <span class="cca-separator">/</span> THREAT {{ run.danger }}</span
      >
      <button
        v-if="run"
        type="button"
        class="cca-small"
        @click="store.restart()"
      >
        NEW TERM
      </button>
    </header>

    <div v-if="store.storageWarning" class="cca-warning" role="alert">
      {{ store.storageWarning }}
    </div>
    <AcademyOpening
      v-if="store.loaded && !run"
      :yearbook="store.yearbook"
      @start="startFromOpening"
    />
    <div v-else-if="run" class="cca-layout min-h-0 flex-1">
      <section class="cca-stage" aria-label="Illustrated academy scene">
        <img
          :src="stageScenery"
          alt="The towers of Comet City Academy beneath a glowing comet and a purple sunset"
          class="cca-scenery"
        />
        <img
          v-if="villainPortrait"
          :src="villainPortrait"
          alt="The mastermind behind the Prom of Doom"
          class="cca-villain-inset"
        />
        <div class="cca-stage-grain" aria-hidden="true" />
        <div class="cca-stage-content">
          <div class="cca-eyebrow">
            THE CITY IS WATCHING <span>✦</span> YOUR STORY BEGINS
          </div>
          <template v-if="!run">
            <h2 class="cca-big-title">CAPES <span>&amp; TASSELS</span></h2>
            <p class="cca-intro">
              Prom of Doom · Your final month begins with a very strange first
              week.
            </p>
          </template>
          <template v-else>
            <p class="cca-chapter">
              CHAPTER {{ run.day.toString().padStart(2, '0') }} /
              {{
                run.flowVersion === 3
                  ? 'THE LAST THIRTY DAYS'
                  : 'THE FIRST WEEK'
              }}
            </p>
            <h2 class="cca-scene-title">{{ sceneTitle }}</h2>
            <p class="cca-scene-copy">{{ stageCopy }}</p>
          </template>
        </div>
        <div class="cca-stage-foot">
          <span>✧ COMET CITY — CAMPUS DISTRICT</span>
          <span>{{
            run ? run.phase.toUpperCase() : 'EST. BEFORE YOUR PARENTS WERE BORN'
          }}</span>
        </div>
      </section>

      <section class="cca-console" aria-live="polite">
        <div class="cca-console-top">
          <span class="cca-caption">{{ panelLabel }}</span>
          <div
            v-if="run"
            class="cca-day-lights"
            aria-label="Seven day countdown"
          >
            <span
              v-for="n in run.flowVersion === 3 ? 30 : 7"
              :key="n"
              :class="{ filled: n <= run.day }"
            />
          </div>
          <span class="cca-serial">C.C.A. // 07</span>
        </div>
        <div class="cca-pane kr-scroll">
          <AcademyTacticalFight
            v-if="store.tactical && run"
            :battle="store.tactical"
            :rival-name="
              run.day < 15
                ? 'UNKNOWN CHALLENGER'
                : (opponent?.hero.alias ?? 'THE RIVAL')
            "
            :mission="
              store.incidents.find(
                (incident) => incident.id === store.tactical?.caseId,
              )?.title ?? 'NIGHT PATROL'
            "
            :opening="tacticalOpening(run)"
            :role="tacticalRoleFor(run)"
            @cell="store.battleClick"
            @mode="store.battleMode"
            @turn="store.battleTurn"
            @counter="store.battleCounter"
            @parley="store.battleParley"
            @support="store.battleSupport"
            @retreat="store.battleRetreat"
            @finish="store.battleResolve"
          />
          <template v-else-if="!store.loaded">
            <p class="cca-muted">Loading your academy record…</p>
          </template>
          <template v-else-if="run.phase === 'map'">
            <div class="cca-heading">
              <span>02</span>
              <div>
                <h2>Choose where the day begins</h2>
                <p>One story per day. The places you skip may matter later.</p>
              </div>
            </div>
            <p v-if="run.flowVersion === 3" class="cca-under">
              DAY {{ run.day }} / 30 · CASE FILE:
              {{ run.day < 15 ? 'UNKNOWN MASTERMIND' : mastermind?.name }}
              <span
                v-if="run.day >= 15 && opponent"
                data-testid="academy-villain-identity"
              >
                · ANTAGONIST {{ opponent.villain.alias }} ({{
                  opponent.realName
                }})
              </span>
            </p>
            <div
              v-if="run.flowVersion === 3 && run.signature && run.day === 1"
              class="cca-report-mini"
              data-testid="academy-recommended-rival"
            >
              <strong
                >RECOMMENDED RIVAL ·
                {{ recommendedRivalFor(run.signature).hero.alias }}</strong
              >
              <span>{{
                recommendedRivalFor(run.signature).student.conflict
              }}</span>
              <span
                >The current campaign still allows a different seeded
                antagonist. Your rival has their own agency and can become the
                hero if you turn villain.</span
              >
              <button
                type="button"
                class="cca-choice"
                :disabled="
                  run.opponentSignature ===
                  recommendedRivalFor(run.signature).signature
                "
                @click="store.recommendRival()"
              >
                {{
                  run.opponentSignature ===
                  recommendedRivalFor(run.signature).signature
                    ? 'RECOMMENDED RIVAL SELECTED'
                    : 'CHOOSE THIS RIVALRY FOR YOUR STORY'
                }}
              </button>
            </div>
            <div
              v-if="run.playerEvolution"
              class="cca-report-mini"
              data-testid="academy-evolution-dossier"
            >
              <strong
                >MY IDENTITY:
                {{ currentPlayer?.[currentForm]?.alias ?? 'STUDENT' }} ·
                {{ currentForm.toUpperCase() }}</strong
              >
              <span
                >PROTECT {{ run.playerEvolution.protect }} · EXPLOIT
                {{ run.playerEvolution.exploit }} · TWO CHOICES EARN A
                MANTLE</span
              >
              <span v-if="run.day < 16">First public reckoning: day 16</span>
              <span v-else-if="run.day < 23"
                >Next chance to choose or change: day 23</span
              >
            </div>
            <div
              v-if="run.flowVersion === 3 && run.signature"
              class="cca-report-mini"
              data-testid="academy-personal-story-progress"
            >
              <strong
                >YOUR UNIQUE STORY · {{ run.identityHistory?.length ?? 0 }} / 4
                CHAPTERS</strong
              >
              <span
                >{{ personalCounterpart(run.signature).realName }} has an
                independent stake in your choices.</span
              >
              <span
                >PERSONAL MILESTONES · DAYS
                {{ PERSONAL_CHAPTER_DAYS.join(' / ') }}</span
              >
            </div>
            <div
              v-if="run.flowVersion === 3 && run.vow"
              class="cca-report-mini"
              data-testid="academy-vow-journal"
            >
              <strong
                >MY STORY · {{ run.vow.toUpperCase() }} ·
                {{ run.vowHistory?.length ?? 0 }} / 5 CHAPTERS</strong
              >
              <span>{{ routeMemoryLine(run.vowHistory) }}</span>
              <span>
                PROMISE REPUTATION
                {{ routeStanding(run.vowHistory) >= 0 ? '+' : ''
                }}{{ routeStanding(run.vowHistory) }} ·
                {{
                  nextRouteDay
                    ? 'NEXT CHAPTER: DAY ' + nextRouteDay
                    : 'CHAPTERS COMPLETE'
                }}
              </span>
            </div>
            <p
              v-if="run.flowVersion === 3 && run.day >= 8"
              class="cca-under"
              data-testid="academy-plot-status"
            >
              {{ run.plotEvidence?.length ?? 0 }} / 3 accomplice operations
              exposed ·
              {{
                run.betrayal
                  ? 'BETRAYAL: ' + run.betrayal.status.toUpperCase()
                  : 'TRUST REPORT: OPEN'
              }}
            </p>
            <div
              v-if="run.flowVersion === 3 && injuredStudents.length"
              class="cca-report-mini"
              aria-label="Infirmary roster"
            >
              <strong>INFIRMARY: USE YOUR DAY ACTION TO RECOVER</strong>
              <button
                v-for="student in injuredStudents"
                :key="student.id"
                type="button"
                class="cca-choice"
                @click="store.heal(student.id)"
              >
                Treat {{ student.name }} before night patrol ↗
              </button>
              <button
                v-for="student in visitableStudents"
                :key="'visit-' + student.id"
                type="button"
                class="cca-choice"
                data-testid="academy-infirmary-visit"
                @click="store.social(student.id, 'visit')"
              >
                Sit with {{ student.name }} while they recover ↗
              </button>
            </div>
            <button
              v-if="socialDayAvailable"
              class="cca-choice"
              type="button"
              data-testid="academy-social-switch"
              @click="toggleRelationships"
            >
              <span>{{
                showRelationships
                  ? 'RETURN TO THE CITY MAP'
                  : 'SPEND DAYLIGHT WITH A CLASSMATE'
              }}</span>
              <span>↗</span>
            </button>
            <div
              v-if="socialPanelActive && run.relationships"
              class="cca-report-mini"
              data-testid="academy-social-panel"
            >
              <strong>RELATIONSHIPS / ONE DAYTIME ACTION</strong>
              <span
                >Making a promise here replaces exploring a city location today.
                Every classmate can decline, change terms or leave.</span
              >
              <div
                v-for="offer in triadOfferList"
                :key="offer.arc.id"
                class="cca-report-mini"
                data-testid="academy-triad-panel"
              >
                <strong
                  >{{ offer.title.toUpperCase() }} · THREE-WAY TALK</strong
                >
                <span>{{ offer.premise }}</span>
                <strong>{{ offer.beat.title }}</strong>
                <span>{{ offer.beat.scene }}</span>
                <span v-if="offer.waiting">{{ offer.waiting }}</span>
                <button
                  v-for="option in offer.options"
                  :key="option.id"
                  class="cca-choice"
                  type="button"
                  data-testid="academy-triad-choice"
                  @click="store.negotiate(offer.arc.id, option.id)"
                >
                  <span>{{ option.label }}</span
                  ><span>↗</span>
                </button>
              </div>
              <div class="cca-map-tabs" aria-label="Choose classmate">
                <button
                  v-for="person in socialRoster"
                  :key="person.id"
                  type="button"
                  :class="{ chosen: selectedSocialId === person.id }"
                  :aria-pressed="selectedSocialId === person.id"
                  @click="selectedSocialId = person.id"
                >
                  {{ person.name }}
                </button>
              </div>
              <strong>{{ selectedSocialProfile?.dilemma }}</strong>
              <span v-if="run.relationships.connections[selectedSocialId]">
                TRUST
                {{
                  run.relationships.connections[selectedSocialId]?.trust ?? 0
                }}
                ·
                {{
                  run.relationships.partner === selectedSocialId
                    ? 'FIELD PARTNER · '
                    : ''
                }}
                {{
                  run.relationships.sidekick === selectedSocialId
                    ? 'SIDEKICK · '
                    : ''
                }}
                {{
                  run.relationships.romance === selectedSocialId
                    ? 'ROMANCE · '
                    : ''
                }}
                {{
                  run.relationships.connections[selectedSocialId]
                    ?.courtingDay !== undefined &&
                  run.relationships.romance !== selectedSocialId
                    ? 'EXPLORING RELATIONSHIP · '
                    : ''
                }}
              </span>
              <span
                v-if="selectedSocialProfile"
                data-testid="academy-social-chemistry"
                >MUTUAL AFFINITY · YOUR TRUST
                {{
                  run.relationships.connections[selectedSocialId]?.trust ?? 0
                }}/5 · {{ chemistryLabel }} ·
                {{ selectedChemistry.reason }}</span
              >
              <span v-if="selectedSocialProfile"
                >{{ selectedSocialProfile.pronouns.toUpperCase() }} ·
                {{ selectedSocialProfile.voice }}</span
              >
              <span>{{ selectedSocialProfile?.boundary }}</span>
              <button
                v-for="choice in socialActionOptions"
                :key="choice.id"
                class="cca-choice"
                type="button"
                data-testid="academy-social-choice"
                @click="store.social(selectedSocialId, choice.id)"
              >
                <span>{{ choice.label }}</span
                ><span>↗</span>
              </button>
              <span v-if="!socialActionOptions.length"
                >This person cannot spend time together today. A betrayal may
                have changed the roster.</span
              >
            </div>
            <div
              v-if="!socialPanelActive"
              class="cca-map-tabs"
              aria-label="Map view"
            >
              <button
                type="button"
                :aria-pressed="mapView === 'campus'"
                :class="{ chosen: mapView === 'campus' }"
                @click="mapView = 'campus'"
              >
                CAMPUS / SOUTHEAST
              </button>
              <button
                type="button"
                :aria-pressed="mapView === 'town'"
                :class="{ chosen: mapView === 'town' }"
                @click="mapView = 'town'"
              >
                COMET CITY / NORTHWEST
              </button>
            </div>
            <div
              v-if="!socialPanelActive"
              class="cca-map"
              data-testid="academy-map"
              :aria-label="
                mapView === 'campus'
                  ? 'Academy and northwest city border'
                  : 'Comet City and southeast academy'
              "
            >
              <div class="cca-map-watermark" aria-hidden="true">
                {{ mapView === 'campus' ? 'ACADEMY' : 'COMET CITY' }}
              </div>
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                class="cca-map-roads"
                aria-hidden="true"
              >
                <line
                  v-for="road in mapRoads"
                  :key="road.id"
                  :x1="road.x1"
                  :y1="road.y1"
                  :x2="road.x2"
                  :y2="road.y2"
                />
              </svg>
              <button
                v-for="site in mapNodes"
                :key="site.id"
                type="button"
                class="cca-map-pin"
                :class="[site.district, { explored: !canVisitSite(site.id) }]"
                :style="{ left: site.left + '%', top: site.top + '%' }"
                :disabled="!canVisitSite(site.id)"
                :title="site.name"
                :aria-label="site.name + ': ' + site.teaser"
                @click="store.visit(site.id)"
              >
                <span class="cca-map-dot" aria-hidden="true">{{
                  site.district === 'academy' ? '✦' : '◆'
                }}</span>
                <span class="cca-map-name">{{ site.name }}</span>
              </button>
              <span class="cca-map-compass" aria-hidden="true">N ↑</span>
            </div>
            <p class="cca-map-legend">
              ✦ Academy &nbsp; ◆ City &nbsp; · &nbsp;
              {{ run.visitedSites?.length ?? 0 }} unique landmarks explored
              <span class="cca-map-trust">
                ACADEMY {{ run.academyStanding ?? 0 }} · CITY
                {{ run.cityStanding ?? 0 }}
              </span>
            </p>
            <div
              class="cca-map-sites"
              data-testid="academy-map-sites"
              aria-label="Available neighborhood story choices"
            >
              <button
                v-for="site in mapNodes"
                :key="'choice-' + site.id"
                type="button"
                class="cca-map-site-choice"
                :disabled="!canVisitSite(site.id)"
                @click="store.visit(site.id)"
              >
                <strong>{{ site.name }}</strong>
                <small>{{
                  !canVisitSite(site.id) ? 'RETURN NEXT WEEK' : site.teaser
                }}</small>
              </button>
            </div>
          </template>

          <template v-else-if="run.phase === 'dispatch'">
            <div class="cca-heading">
              <span>02</span>
              <div>
                <h2>
                  {{
                    run.flowVersion === 3
                      ? 'NIGHT PATROL / HEROES ON CALL'
                      : run.day <= 2
                        ? 'Simulation desk'
                        : 'Night dispatch'
                  }}
                </h2>
                <p>
                  {{
                    run.patrolOpening === 1 && run.day <= 2
                      ? 'Tonight it is just you and your thoughts. Choose which emergency you answer.'
                      : run.patrolOpening === 1 && run.day === 3
                        ? 'Your friend is on the line. Split to attempt both calls, or combine your strengths to save one perfectly.'
                        : 'Lead one call yourself; your earned allies can handle other calls. Some incidents may go unanswered.'
                  }}
                </p>
              </div>
            </div>
            <section
              v-if="run.patrolOpening === 1 && run.day >= 4"
              class="cca-patrol-board"
              data-testid="academy-night-district-patrol"
              aria-label="Neighborhood night patrol"
            >
              <div class="cca-patrol-heading">
                <strong>✦ WALK THE BLOCK · OPTIONAL PATROL</strong>
                <small
                  >Choose a neighborhood instead of a major call. Your allies
                  can still answer other emergencies.</small
                >
              </div>
              <div
                class="cca-patrol-zones"
                role="group"
                aria-label="Comet City patrol neighborhoods"
              >
                <button
                  v-for="zone in PATROL_ZONES"
                  :key="zone.id"
                  type="button"
                  :class="{
                    active: patrolZone === zone.id,
                    chosen: run.nightPatrol?.zone === zone.id,
                  }"
                  :aria-pressed="patrolZone === zone.id"
                  @click="patrolZone = zone.id"
                >
                  <strong>{{ zone.title }}</strong>
                  <small>{{ zone.hook }}</small>
                </button>
              </div>
              <div v-if="patrolScene" class="cca-patrol-story">
                <strong>{{ patrolScene.title }}</strong>
                <p>{{ patrolScene.scene }}</p>
                <div class="cca-patrol-decisions">
                  <button
                    v-for="option in patrolChoices"
                    :key="option.id"
                    type="button"
                    class="cca-choice"
                    :class="{ active: run.nightPatrol?.choiceId === option.id }"
                    :aria-pressed="run.nightPatrol?.choiceId === option.id"
                    data-testid="academy-night-patrol-choice"
                    @click="store.patrol(patrolZone, option.id)"
                  >
                    {{ option.label }}
                    <span v-if="option.id.endsWith('-secret')"
                      >✦ HIDDEN ROUTE</span
                    >
                  </button>
                </div>
                <small
                  v-if="run.nightPatrol"
                  data-testid="academy-night-patrol-selected"
                >
                  PATROL LOCKED IN · {{ run.nightPatrol.zone.toUpperCase() }} ·
                  Choose a mission to change your plan
                </small>
              </div>
            </section>
            <article
              v-for="incident in store.incidents"
              :key="incident.id"
              class="cca-incident"
            >
              <div class="cca-incident-name">
                <strong>{{ incident.title }}</strong
                ><span
                  >NEEDS {{ statForField(incident.need).toUpperCase() }} · RISK
                  {{ incident.risk }} / 06</span
                >
              </div>
              <div class="cca-incident-location">
                {{ incident.site }} ·
                {{
                  incident.allegiance.toUpperCase() +
                  ' / ' +
                  (run.flowVersion === 3 || run.day > 2
                    ? 'REAL NIGHT PATROL'
                    : 'TRAINING SIMULATION')
                }}
              </div>
              <p>
                {{
                  run.flowVersion === 3 || run.day > 2
                    ? (realNightCase(incident.id)?.briefing ??
                      incident.briefing)
                    : incident.briefing
                }}
              </p>
              <div
                v-if="run.patrolOpening === 1 && run.day === 3"
                class="cca-report-mini"
                data-testid="academy-third-night-decision"
              >
                <strong>THE THIRD NIGHT · AN IMPOSSIBLE CHOICE</strong>
                <span
                  >Take {{ incident.title }} yourself and decide how to use your
                  first friend.</span
                >
                <button
                  type="button"
                  class="cca-choice"
                  @click="store.planCrisis(incident.id, 'split')"
                >
                  SPLIT UP · attempt both rescues
                </button>
                <button
                  type="button"
                  class="cca-choice"
                  @click="store.planCrisis(incident.id, 'concentrate')"
                >
                  STAY TOGETHER · guarantee the best rescue here, abandon the
                  other
                </button>
              </div>
              <button
                v-if="run.flowVersion === 3"
                type="button"
                class="cca-choice"
                :aria-pressed="run.playerCaseId === incident.id"
                data-testid="academy-lead-patrol"
                @click="store.lead(incident.id)"
              >
                <span>
                  {{
                    run.playerCaseId === incident.id
                      ? '✦ YOU ARE LEADING THIS PATROL'
                      : 'TAKE THIS CALL YOURSELF'
                  }}
                  <small
                    >Choose where your own powers, risks and choices go
                    tonight.</small
                  >
                </span>
                <span>↗</span>
              </button>
              <div
                v-if="
                  run.playerCaseId === incident.id &&
                  expandedMissionFor(incident.id)
                "
                class="cca-mission-tactics"
                data-testid="academy-mission-tactics"
              >
                <strong>YOUR DECISION · HOW DO YOU INTERVENE?</strong>
                <p>
                  Saving lives first offers better odds. Investigating the cause
                  is riskier but can uncover evidence for a later case in this
                  neighborhood.
                </p>
                <div class="cca-mission-tactics-grid">
                  <button
                    type="button"
                    class="cca-choice"
                    :aria-pressed="
                      (run.missionApproach ?? 'rescue') === 'rescue'
                    "
                    :class="{
                      active: (run.missionApproach ?? 'rescue') === 'rescue',
                    }"
                    data-testid="academy-mission-rescue"
                    @click="store.missionTactic(incident.id, 'rescue')"
                  >
                    <strong>RESCUE FIRST</strong>
                    {{ expandedMissionFor(incident.id)?.tactics.rescue }}
                  </button>
                  <button
                    type="button"
                    class="cca-choice"
                    :aria-pressed="run.missionApproach === 'investigate'"
                    :class="{ active: run.missionApproach === 'investigate' }"
                    data-testid="academy-mission-investigate"
                    @click="store.missionTactic(incident.id, 'investigate')"
                  >
                    <strong>CHASE THE EVIDENCE</strong>
                    {{ expandedMissionFor(incident.id)?.tactics.investigate }}
                  </button>
                </div>
                <small
                  >Casebook evidence recovered:
                  {{ run.missionClues?.length ?? 0 }}. Matching powers and
                  earlier district clues may reveal a hidden resolution after
                  your mission succeeds.</small
                >
              </div>
              <div
                class="cca-roster"
                data-testid="academy-quest-poster-row"
                role="group"
                :aria-label="'Heroes available for ' + incident.title"
              >
                <button
                  v-for="student in onCall"
                  :key="student.id"
                  type="button"
                  class="cca-roster-button"
                  :class="{
                    active: isSelected(incident.id, student.id),
                    unavailable:
                      isAssignedElsewhere(incident.id, student.id) ||
                      !store.available(student.id),
                  }"
                  :disabled="
                    isAssignedElsewhere(incident.id, student.id) ||
                    !store.available(student.id) ||
                    (!isSelected(incident.id, student.id) &&
                      teamFor(incident.id).length >= 3)
                  "
                  :aria-pressed="isSelected(incident.id, student.id)"
                  :title="missionReaction(student.id, incident.id).line"
                  @click="toggleStudent(incident.id, student.id)"
                >
                  <span class="cca-poster-art">
                    <img
                      v-if="reactionPortrait(student.id, incident.id)"
                      :src="reactionPortrait(student.id, incident.id)!"
                      alt=""
                      class="cca-avatar-img"
                    />
                    <span v-else class="cca-poster-initials">{{
                      student.portrait
                    }}</span>
                    <span
                      class="cca-expression"
                      :class="
                        'mood-' + missionReaction(student.id, incident.id).mood
                      "
                      :aria-label="
                        missionReaction(student.id, incident.id).mood +
                        ' reaction'
                      "
                    >
                      {{ reactionEmoji(student.id, incident.id) }}
                    </span>
                  </span>
                  <span class="cca-roster-name">{{
                    student.name.split(' ')[0]
                  }}</span>
                  <span class="cca-poster-role">{{ student.title }}</span>
                  <span class="cca-poster-reaction">{{
                    missionReaction(student.id, incident.id).line
                  }}</span>
                </button>
              </div>
              <div class="cca-crew-count" data-testid="academy-quest-odds">
                <strong
                  >{{ run.playerCaseId === incident.id ? 'YOU + ' : '' }}TEAM
                  {{ teamFor(incident.id).length }}/3</strong
                >
                <strong>{{
                  teamFor(incident.id).length ||
                  run.playerCaseId === incident.id
                    ? dispatchChance(run, incident.id, teamFor(incident.id)) +
                      '% CHANCE OF SUCCESS'
                    : 'CHOOSE HEROES TO SEE ODDS'
                }}</strong>
              </div>
              <p class="cca-odds-note">
                Estimated chance of at least a partial success. Complete success
                is harder; injuries and city standing can change the odds.
              </p>
              <div
                v-if="missionRoute(incident.id, teamFor(incident.id))"
                class="cca-special-route"
                data-testid="academy-special-mission-route"
              >
                <strong
                  >✦ SPECIAL ROUTE:
                  {{
                    missionRoute(incident.id, teamFor(incident.id))?.label
                  }}</strong
                >
                <span
                  >This team unlocks an alternative solution with an improved
                  chance of success.</span
                >
              </div>
            </article>
            <button
              v-if="emergencyBackup"
              class="cca-choice"
              type="button"
              data-testid="academy-emergency-backup"
              @click="store.requestBackup()"
            >
              <span>
                CALL THE CITY FOR BACKUP · {{ emergencyBackup.name }}
                <small
                  >Gain a willing volunteer for tonight. Costs goodwill and
                  raises danger.</small
                >
              </span>
              <span>↗</span>
            </button>
            <button
              v-if="
                run.flowVersion === 3 &&
                run.day >= 4 &&
                run.signature &&
                run.opponentSignature &&
                run.playerCaseId &&
                !run.tacticalHistory?.some((entry) => entry.day === run?.day)
              "
              class="cca-choice"
              type="button"
              data-testid="academy-launch-tactical"
              @click="store.startBattle()"
            >
              <span>
                ✦ PLAY THE TACTICAL FIGHT ·
                {{
                  run.day < 15 ? 'YOUR ORIGIN MISSION' : opponent?.hero.alias
                }}
                <small
                  >Move your squad on a cover-and-line-of-sight battlefield. The
                  actual victory or defeat replaces the automatic result for
                  your personally led call.</small
                >
              </span>
              <span>↗</span>
            </button>
            <button
              class="cca-primary"
              type="button"
              data-testid="academy-dispatch"
              :disabled="
                run.patrolOpening === 1
                  ? !run.playerCaseId && !run.nightPatrol
                  : !run.assignments.length
              "
              @click="store.dispatch()"
            >
              {{
                run.flowVersion === 2
                  ? run.day <= 2
                    ? 'RUN NIGHT SIMULATIONS'
                    : 'SEND NIGHT TEAMS'
                  : 'TAKE THE NIGHT PATROL'
              }}
              <span>➜</span>
            </button>
          </template>

          <template v-else-if="run.phase === 'campus'">
            <div class="cca-heading">
              <span>03</span>
              <div>
                <h2>{{ campusEncounter.title }}</h2>
                <p>
                  {{ campusEncounter.location }} ·
                  {{
                    run.flowVersion === 2
                      ? 'DAYTIME EXPLORATION'
                      : 'AFTER CLASS'
                  }}
                </p>
              </div>
            </div>
            <p
              v-if="run.playerEvolution && (run.day === 16 || run.day === 23)"
              class="cca-under"
              data-testid="academy-identity-choice"
            >
              PUBLIC IDENTITY RECKONING · YOUR PRIOR CHOICES UNLOCK AVAILABLE
              MANTLES
            </p>
            <p
              v-if="
                run.flowVersion === 3 &&
                run.signature &&
                PERSONAL_CHAPTER_DAYS.some((day) => day === run?.day)
              "
              class="cca-under"
              data-testid="academy-personal-identity-chapter"
            >
              CHARACTER-LED STORY · {{ run.identityHistory?.length ?? 0 }} / 4
              PRIOR CHAPTERS ·
              {{ personalCounterpart(run.signature).realName }} HAS THEIR OWN
              AGENDA
            </p>
            <p class="cca-story">{{ campusEncounter.scene }}</p>
            <div
              v-if="possibleRecruit"
              class="cca-recruit-offer"
              data-testid="academy-contact-encounter"
            >
              <div class="cca-recruit-portrait">
                <img
                  v-if="studentPortrait(possibleRecruit.id)"
                  :src="studentPortrait(possibleRecruit.id)!"
                  alt=""
                />
                <span v-else>{{ possibleRecruit.portrait }}</span>
              </div>
              <div>
                <strong
                  >NEW CONTACT /
                  {{ possibleRecruit.origin.toUpperCase() }}</strong
                >
                <h3>{{ possibleRecruit.name }}</h3>
                <p>{{ possibleRecruit.title }} · {{ possibleRecruit.note }}</p>
                <button
                  type="button"
                  class="cca-choice"
                  @click="store.recruit(possibleRecruit.id)"
                >
                  Invite {{ possibleRecruit.name }} onto the call roster (spend
                  the day) →
                </button>
              </div>
            </div>
            <div v-if="run.flowVersion !== 2" class="cca-report-mini">
              <strong>AFTER-ACTION REPORT</strong>
              ><span v-for="report in run.reports" :key="report.caseId"
                >{{ report.title }} · {{ report.grade.toUpperCase() }}</span
              >
            </div>
            <button
              v-for="option in campusEncounter.options"
              :key="option.id"
              class="cca-choice"
              type="button"
              @click="store.choose(option.id)"
            >
              <span>{{ option.label }}</span
              ><span>↗</span>
            </button>
          </template>

          <template v-else-if="run.phase === 'debrief'">
            <div class="cca-heading">
              <span>04</span>
              <div>
                <h2>
                  {{
                    run.flowVersion === 3 || run.flowVersion === 2
                      ? 'Night debrief'
                      : 'After the bell'
                  }}
                </h2>
                <p>Every choice and every teammate leaves a trace.</p>
              </div>
            </div>
            <p class="cca-story">{{ run.scene }}</p>
            <article
              v-for="report in run.reports"
              :key="report.caseId"
              class="cca-report"
            >
              <div>
                <strong>{{ report.title }}</strong
                ><span :class="'cca-grade-' + report.grade">{{
                  report.grade
                }}</span>
              </div>
              <small>{{ report.names }}</small>
              <p>{{ report.text }}</p>
            </article>
            <button
              class="cca-primary"
              type="button"
              data-testid="academy-next"
              @click="store.next()"
            >
              {{
                (run.flowVersion === 3 ? run.day === 29 : run.day === 7)
                  ? run.flowVersion === 3
                    ? 'ENTER THE REAL PROM OF DOOM'
                    : 'FACE THE PROM-NIGHT SIMULATION'
                  : 'ADVANCE TO NEXT DAY'
              }}
              <span>➜</span>
            </button>
          </template>

          <template v-else-if="run.phase === 'finale'">
            <div class="cca-heading">
              <span>05</span>
              <div>
                <h2>
                  {{
                    run.flowVersion === 3
                      ? 'PROM OF DOOM: THE FOURTH DANCE'
                      : 'Prom-Night Simulation'
                  }}
                </h2>
                <p>
                  {{
                    run.flowVersion === 3
                      ? 'The catastrophe is real.'
                      : 'The final rehearsal shows how prom could end very badly.'
                  }}
                </p>
              </div>
            </div>
            <p class="cca-story">
              <template v-if="run.flowVersion === 3">{{ run.scene }}</template>
              <template v-else
                >Your first-week final is a simulated prom-night catastrophe.
                The real graduation is still weeks away. Your classmates are
                waiting for orders. You can protect them, or seize the machine
                behind the whole spectacle.</template
              >
            </p>
            <div class="cca-final-stats">
              <span
                >INFLUENCE <b>{{ run.influence }}</b></span
              ><span
                >THREAT <b>{{ run.danger }}</b></span
              >
            </div>
            <button
              type="button"
              class="cca-choice"
              @click="store.end('protect')"
            >
              <span>{{
                run.flowVersion === 3
                  ? 'Evacuate the guests immediately'
                  : 'Save the classmates, even if the school expels you'
              }}</span>
              ↗
            </button>
            <button
              type="button"
              class="cca-choice"
              @click="store.end('command')"
            >
              <span>{{
                run.flowVersion === 3
                  ? 'Seize the shield console'
                  : 'Take the catastrophe engine for yourself'
              }}</span>
              ↗
            </button>
            <button
              v-if="run.flowVersion === 3"
              type="button"
              class="cca-choice"
              @click="store.end('share')"
            >
              <span>Give every neighborhood a shield key</span> ↗
            </button>
            <button
              v-if="run.flowVersion === 3"
              type="button"
              class="cca-choice"
              @click="store.end('evacuate')"
            >
              <span>Destroy the transmitter and carry out the injured</span> ↗
            </button>
          </template>

          <template v-else>
            <div class="cca-heading">
              <span>✦</span>
              <div>
                <h2>{{ run.ending }}</h2>
                <p>
                  {{
                    run.flowVersion === 3
                      ? 'THIRTY-DAY GRADUATION CHRONICLE'
                      : 'YOUR FIRST-WEEK YEARBOOK'
                  }}
                </p>
              </div>
            </div>
            <p class="cca-story">{{ run.scene }}</p>
            <div class="cca-report-mini">
              <strong>CHRONICLE</strong
              ><span v-for="(line, i) in run.log.slice(-10)" :key="i">{{
                line
              }}</span>
            </div>
            <PlaybookRunReview
              game="comet-city-academy"
              :run="run"
              :ending="run.ending ?? 'graduated'"
            />
            <button class="cca-primary" type="button" @click="store.restart()">
              BEGIN ANOTHER TERM <span>↻</span>
            </button>
          </template>
        </div>
        <footer class="cca-footer">
          <span>✧ DECISIONS ARE REMEMBERED</span
          ><span>{{ run ? 'AUTO-SAVED' : 'NEW GAME' }}</span>
        </footer>
      </section>
    </div>
    <ComicCharacterReveal
      v-if="storyComicIntro"
      :open="showVillainComic"
      :intro="storyComicIntro"
      :art-src="storyComicArt"
      @dismiss="showVillainComic = false"
    />
  </main>
</template>

<script setup lang="ts">
import {
  SOCIAL_CAST,
  SOCIAL_DAYS,
  compatibilityFor,
  socialChoices,
} from '~/utils/cometAcademy/relationships'
import { computed, onMounted, ref, watch } from 'vue'
import { comicIntroFor } from '~/utils/cometAcademy/comicIntroductions'
import AcademyOpening from '~/components/play/cometAcademy/AcademyOpening.vue'
import AcademyTacticalFight from '~/components/play/cometAcademy/AcademyTacticalFight.vue'
import {
  recommendedRivalFor,
  tacticalOpening,
  tacticalRoleFor,
} from '~/utils/cometAcademy/tacticalInterlude'
import { fieldFor, identityFor } from '~/utils/cometAcademy/identityArcs'
import type { PlayerForm } from '~/utils/cometAcademy/protagonistEvolution'
import { campaignVillain } from '~/utils/cometAcademy/campaign'
import { useCometAcademyStore } from '~/stores/cometAcademyStore'
import { realNightCase } from '~/utils/cometAcademy/nightCases'
import { expandedMissionFor } from '~/utils/cometAcademy/expandedNightCases'
import {
  PATROL_ZONES,
  patrolSceneFor,
  type PatrolZoneId,
} from '~/utils/cometAcademy/nightPatrols'
import {
  openingRouteDays,
  routeMemoryLine,
  routeStanding,
} from '~/utils/cometAcademy/openingRoutes'
import { promArt } from '~/utils/cometAcademy/artManifest'
import {
  personalCounterpart,
  PERSONAL_CHAPTER_DAYS,
} from '~/utils/cometAcademy/identitySerial'
import {
  missionReaction,
  missionRoute,
} from '~/utils/cometAcademy/missionTeams'
import {
  academyStageArt,
  academyVillainArt,
  studentArtKey,
} from '~/utils/cometAcademy/artSlots'
import {
  projectCitySites,
  projectedCityRoads,
  type CityView,
  type SiteId,
} from '~/utils/cometAcademy/cityMap'
import {
  STUDENTS,
  academyTriadOffers,
  socialContextFor,
  encounterFor,
  dispatchChance,
  knownContacts,
  nightPatrolBeat,
  patrolOptionsFor,
  recruitableContact,
  emergencyContact,
  type StudentId,
} from '~/utils/cometAcademy/rules'
import {
  STATS,
  type LegacyPowerId,
  type SignaturePowerId,
  type PowerVowId,
} from '~/utils/cometAcademy/specialPowers'

const store = useCometAcademyStore()
const showRelationships = ref(false)
const selectedSocialId = ref<StudentId>('mina')
const mapView = ref<CityView>('campus')
const patrolZone = ref<PatrolZoneId>('academy')
const mapNodes = computed(() => projectCitySites(mapView.value))
const mapRoads = computed(() => projectedCityRoads(mapView.value))
const run = computed(() => store.run)
const onCall = computed(() =>
  run.value
    ? STUDENTS.filter((person) => knownContacts(run.value!).includes(person.id))
    : [],
)
const emergencyBackup = computed(() =>
  run.value ? emergencyContact(run.value) : null,
)
const possibleRecruit = computed(() =>
  run.value ? recruitableContact(run.value) : null,
)
const nextRouteDay = computed(() => {
  const state = run.value
  return state?.vow
    ? (openingRouteDays(state.vow).find((day) => day >= state.day) ?? null)
    : null
})
const socialDayAvailable = computed(() => {
  const current = run.value
  return (
    current?.flowVersion === 3 && SOCIAL_DAYS.some((day) => day === current.day)
  )
})
const socialPanelActive = computed(() =>
  Boolean(showRelationships.value && socialDayAvailable.value),
)
const selectedSocialProfile = computed(() =>
  SOCIAL_CAST.find((p) => p.id === selectedSocialId.value),
)
const socialRoster = computed(() =>
  SOCIAL_CAST.map((profile) =>
    STUDENTS.find((person) => person.id === profile.id)!,
  ),
)
const socialActionOptions = computed(() =>
  run.value?.relationships
    ? socialChoices(
        run.value.relationships,
        selectedSocialId.value,
        run.value.day,
        socialContextFor(run.value, selectedSocialId.value),
      )
    : [],
)
const selectedChemistry = computed(() =>
  run.value
    ? compatibilityFor(
        selectedSocialId.value,
        socialContextFor(run.value, selectedSocialId.value),
      )
    : { chemistry: 'curious' as const, reason: '' },
)
const chemistryLabel = computed(() => {
  if (!selectedSocialProfile.value?.romanceable) return 'PLATONIC'
  return {
    kindred: 'KINDRED SPIRITS',
    curious: 'CURIOUS',
    wary: 'WARY · ONE MORE HONEST TALK BEFORE A DATE',
    closed: 'NOT RIGHT NOW',
  }[selectedChemistry.value.chemistry]
})
const triadOfferList = computed(() =>
  run.value ? academyTriadOffers(run.value) : [],
)

const stageScenery = computed(
  () => academyStageArt(run.value) ?? '/comet-city-academy/academy-stage.svg',
)
const villainPortrait = computed(() => academyVillainArt(run.value))
/** A student's portrait once its render ships; initials stand in until then. */
/** A student's own portrait, else their neutral mission-reaction face. */
const studentPortrait = (id: string) =>
  promArt(studentArtKey(id)) ?? promArt(studentArtKey(id) + '-neutral')
const mastermind = computed(() =>
  run.value?.flowVersion === 3
    ? campaignVillain(run.value.seed, run.value.mastermind)
    : null,
)
const currentPlayer = computed(() =>
  run.value?.signature ? identityFor(run.value.signature) : null,
)
const currentForm = computed(
  () => run.value?.playerEvolution?.form ?? 'student',
)
const opponent = computed(() =>
  run.value?.opponentSignature
    ? identityFor(run.value.opponentSignature)
    : null,
)
const showVillainComic = ref(false)
const seenVillainComics = new Set<string>()
const storyComicIntro = computed(() =>
  run.value?.opponentSignature
    ? comicIntroFor(run.value.opponentSignature, 'villain')
    : null,
)
const storyComicArt = computed(() =>
  storyComicIntro.value?.artKey ? promArt(storyComicIntro.value.artKey) : null,
)
watch(
  () => [run.value?.day, run.value?.opponentSignature, run.value?.flowVersion],
  () => {
    if (!run.value || run.value.flowVersion !== 3 || run.value.day < 15) return
    const intro = storyComicIntro.value
    if (intro && !seenVillainComics.has(intro.key)) {
      seenVillainComics.add(intro.key)
      showVillainComic.value = true
    }
  },
)
const injuredStudents = computed(() =>
  run.value?.flowVersion === 3
    ? STUDENTS.filter(
        (s) => (run.value?.injuries?.[s.id] ?? 0) > (run.value?.day ?? 0),
      )
    : [],
)
const visitableStudents = computed(() =>
  injuredStudents.value.filter(
    (student) =>
      run.value?.relationships &&
      socialChoices(
        run.value.relationships,
        student.id,
        run.value.day,
        socialContextFor(run.value, student.id),
      ).some((choice) => choice.id === 'visit'),
  ),
)
function canVisitSite(id: SiteId) {
  if (!run.value) return false
  if (run.value.flowVersion === 3)
    return (run.value.visitedDays?.[id] ?? -7) <= run.value.day - 7
  return !run.value.visitedSites?.includes(id)
}
function statForField(field: LegacyPowerId): string {
  return STATS.find((stat) => stat.field === field)?.name ?? field
}
const campusEncounter = computed(() =>
  run.value ? encounterFor(run.value) : encounterFor({ day: 1 } as never),
)
const panelLabel = computed(() =>
  run.value
    ? {
        map: 'DAY // EXPLORE THE CITY',
        dispatch: [2, 3].includes(run.value.flowVersion ?? 0)
          ? 'NIGHT // PATROL BOARD'
          : 'TRAINING // ASSIGNMENT BOARD',
        campus: 'CAMPUS // ENCOUNTER DRAW',
        debrief: 'RESULTS // DAY REPORT',
        finale:
          run.value.flowVersion === 3
            ? 'PROM // REAL CATASTROPHE'
            : 'PROM // FINAL EXAM',
        ending: 'YEARBOOK // COMPLETED RUN',
      }[run.value.phase]
    : 'NEW STUDENT // POWER SELECTION',
)
const patrolScene = computed(() =>
  run.value?.patrolOpening === 1 && run.value.day >= 4
    ? patrolSceneFor(run.value.seed, run.value.day, patrolZone.value)
    : null,
)
const patrolChoices = computed(() =>
  run.value && patrolScene.value
    ? patrolOptionsFor(run.value, patrolZone.value)
    : [],
)
const nightBeat = computed(() =>
  run.value ? nightPatrolBeat(run.value) : null,
)
const sceneTitle = computed(() =>
  run.value
    ? {
        map: 'Choose Your Ground',
        dispatch: nightBeat.value?.title ?? 'The Call To Action',
        campus: campusEncounter.value.title,
        debrief: 'What Comes After',
        finale:
          run.value.flowVersion === 3
            ? 'The Fourth Dance'
            : 'The Night of the Comet',
        ending: run.value.ending ?? 'Yearbook',
      }[run.value.phase]
    : '',
)
const stageCopy = computed(() =>
  run.value?.phase === 'campus'
    ? campusEncounter.value.scene
    : run.value?.phase === 'dispatch' && nightBeat.value
      ? nightBeat.value.text
      : (run.value?.scene ?? ''),
)
function startFromOpening(selection: {
  signature: SignaturePowerId
  vow: PowerVowId
  form: PlayerForm
  firstWeek: boolean
}) {
  const power = fieldFor(selection.signature)
  if (selection.firstWeek)
    store.beginFirstWeek(power, selection.signature, selection.vow)
  else store.begin(power, selection.signature, selection.vow, selection.form)
}

onMounted(() => store.load())
useSeoMeta(
  gameLinkPreviewMeta(
    'comet-city-academy',
    useRuntimeConfig().public.appBaseUrl,
  ) ?? {},
)
useHead({ title: 'Prom of Doom | Capes & Tassels | Kind Robots' })

function teamFor(caseId: string): StudentId[] {
  return (
    run.value?.assignments.find((entry) => entry.caseId === caseId)?.students ??
    []
  )
}

function isSelected(caseId: string, id: StudentId): boolean {
  return teamFor(caseId).includes(id)
}

function isAssignedElsewhere(caseId: string, id: StudentId): boolean {
  return (
    run.value?.assignments.some(
      (entry) => entry.caseId !== caseId && entry.students.includes(id),
    ) ?? false
  )
}

function toggleRelationships() {
  if (!showRelationships.value)
    selectedSocialId.value =
      onCall.value.find((person) =>
        SOCIAL_CAST.some((profile) => profile.id === person.id),
      )?.id ?? 'mina'
  showRelationships.value = !showRelationships.value
}
function reactionEmoji(id: StudentId, caseId: string): string {
  const mood = missionReaction(id, caseId).mood
  return mood === 'positive' ? '☺' : mood === 'negative' ? '☹' : '•'
}
function reactionPortrait(id: StudentId, caseId: string): string | null {
  const mood = missionReaction(id, caseId).mood
  return promArt(studentArtKey(id) + '-' + mood) ?? studentPortrait(id)
}

function toggleStudent(caseId: string, id: StudentId): void {
  if (!run.value) return
  const current = teamFor(caseId)
  store.assign(
    caseId,
    current.includes(id)
      ? current.filter((student) => student !== id)
      : [...current, id],
  )
}
</script>

<style scoped>
.cca-shell {
  color: #fff6eb;
  background: #0d1024;
  font-family: system-ui, sans-serif;
  gap: 0;
}
.cca-topbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.65rem;
  padding: 0.3rem 0.75rem;
  border-bottom: 1px solid #7d8da53f;
  background: #111629;
  flex-shrink: 0;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  font-weight: 800;
}
.cca-top-title {
  white-space: nowrap;
}
.cca-top-title b {
  color: #ffc18a;
}
.cca-home,
.cca-small {
  border: 1px solid #ffffff36;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  color: #fce6cf;
  background: #ffffff0b;
}
.cca-insignia {
  color: #f6b779;
  font-size: 1.4rem;
}
.cca-top-detail {
  margin-left: auto;
  color: #aeafc6;
}
.cca-score {
  color: #c1e3e9;
  white-space: nowrap;
}
.cca-separator {
  color: #f4b28f;
  margin: 0 0.3rem;
}
.cca-small:hover,
.cca-home:hover {
  background: #ffffff28;
}
.cca-warning {
  padding: 0.3rem 1rem;
  background: #7c312e;
  color: #fff;
  font-size: 0.75rem;
}
.cca-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  overflow: hidden;
}
.cca-stage {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #2e3056;
}
.cca-scenery {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  filter: saturate(1.04) contrast(1.04);
}
.cca-stage:after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(0deg, #0e1229f7 0%, #11132785 21%, transparent 70%),
    linear-gradient(90deg, #13162750, transparent 70%);
  pointer-events: none;
}
.cca-stage-grain {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 40%,
    transparent 23%,
    #100f347a 95%
  );
  pointer-events: none;
  z-index: 1;
}
.cca-stage-content {
  position: absolute;
  z-index: 2;
  bottom: 8%;
  left: 5%;
  right: 5%;
  text-shadow: 0 3px 15px #0e122a;
}
.cca-eyebrow,
.cca-chapter {
  font-size: clamp(0.55rem, 0.85vw, 0.77rem);
  font-weight: 800;
  letter-spacing: 0.24em;
  color: #f9cc9b;
}
.cca-eyebrow span {
  margin: 0 0.5rem;
  color: #9ae0e4;
}
.cca-big-title,
.cca-scene-title {
  font-family: Georgia, serif;
  font-weight: 900;
  text-wrap: balance;
  line-height: 0.92;
  letter-spacing: -0.065em;
  max-width: 700px;
}
.cca-big-title {
  font-size: clamp(2.6rem, 6.3vw, 7.1rem);
  margin: 0.7rem 0;
}
.cca-big-title span {
  display: block;
  color: #ffd4a8;
  font-size: 0.85em;
}
.cca-scene-title {
  font-size: clamp(2rem, 4vw, 4.7rem);
  margin: 0.65rem 0;
}
.cca-intro,
.cca-scene-copy {
  font-size: clamp(0.9rem, 1.3vw, 1.2rem);
  line-height: 1.5;
  max-width: 46ch;
  color: #f4eef4;
}
.cca-stage-foot {
  position: absolute;
  z-index: 2;
  bottom: 0.8rem;
  left: 5%;
  right: 5%;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.62rem;
  letter-spacing: 0.13em;
  font-weight: 800;
  color: #ffe0bf99;
}
.cca-console {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: linear-gradient(165deg, #242f45, #11182c 60%, #12182a);
  border-left: 1px solid #c8d8e34a;
}
.cca-console-top,
.cca-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2.35rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #ffffff24;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  font-weight: 800;
  color: #cbd8e4;
  flex-shrink: 0;
}
.cca-serial {
  color: #f3b881;
}
.cca-day-lights {
  display: flex;
  gap: 0.25rem;
}
.cca-day-lights span {
  width: 0.4rem;
  height: 0.4rem;
  border: 1px solid #aab8c580;
  border-radius: 100%;
}
.cca-day-lights .filled {
  background: #f6bf87;
  box-shadow: 0 0 7px #f6bf877d;
}
.cca-pane {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: clamp(0.75rem, 1.2vw, 1.35rem);
  scrollbar-width: thin;
  scrollbar-color: #e4af8370 transparent;
}
.cca-heading {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  margin-bottom: 0.85rem;
}
.cca-heading > span {
  font-size: 1.8rem;
  font-weight: 800;
  font-family: Georgia, serif;
  color: #edb987;
  line-height: 1;
}
.cca-heading h2 {
  font-size: clamp(1.15rem, 1.7vw, 1.6rem);
  font-family: Georgia, serif;
  font-weight: bold;
  line-height: 1.1;
}
.cca-heading p {
  color: #b8cad8;
  font-size: 0.76rem;
  line-height: 1.45;
  margin-top: 0.25rem;
}
.cca-selection-label {
  margin: 0.65rem 0 0.45rem;
  color: #ffd1a0;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.09em;
}
.cca-power-compact {
  min-height: 3.1rem;
  padding: 0.45rem 0.3rem;
}
.cca-power-compact small {
  color: #cad7e5;
  font-size: 0.58rem;
  line-height: 1.2;
}
.cca-power-grid.cca-affinity-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.cca-vow-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
}
.cca-vow-detail,
.cca-future-preview {
  margin: 0.5rem 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #e1e7f1;
}
.cca-future-preview {
  border: 1px solid #aac5d859;
  border-radius: 0.5rem;
  padding: 0.5rem;
}
.cca-future-preview summary {
  cursor: pointer;
  color: #ffd1a0;
}
.cca-power-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.4rem;
}
.cca-power {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: #37425d70;
  border: 1px solid #99adba55;
  border-radius: 0.7rem;
  min-height: 5.4rem;
  padding: 0.4rem;
  color: #eaf2f4;
  transition: 0.18s;
}
.cca-power:hover,
.cca-power:focus-visible {
  border-color: #ffe5b9;
}
.cca-power.chosen {
  background: linear-gradient(140deg, #84635199, #244f6f99);
  border: 2px solid #ffcc95;
  box-shadow: inset 0 0 20px #f6c89528;
}
.cca-power-glyph {
  font-size: 1.7rem;
  color: #fbdab2;
}
.cca-power strong {
  font-size: 0.73rem;
  text-align: center;
}
.cca-pick {
  min-height: 4.6rem;
  padding: 0.45rem 0.35rem;
  gap: 0.15rem;
}
.cca-pick-small {
  min-height: 3.3rem;
}
.cca-pick-glyph {
  font-size: 1.15rem;
  line-height: 1;
}
.cca-pick small {
  color: #cad7e5;
  font-size: 0.56rem;
  line-height: 1.2;
  text-align: center;
}
.cca-dossier {
  margin: 0.75rem 0;
  padding: 0.75rem;
  border: 1px solid #ffcb9666;
  border-radius: 0.8rem;
  background: linear-gradient(160deg, #2a1f3acc, #0f1d30e6);
}
.cca-dossier-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}
.cca-dossier-crest {
  font-size: 1.45rem;
  white-space: nowrap;
}
.cca-dossier-head small {
  display: block;
  color: #a3cbd6;
  font-size: 0.6rem;
  letter-spacing: 0.09em;
}
.cca-dossier-head h3 {
  color: #ffe0b9;
  font-family: Georgia, serif;
  font-size: 1.25rem;
  font-weight: bold;
  line-height: 1.1;
}
.cca-dossier-story,
.cca-dossier-power,
.cca-dossier-field {
  margin: 0.45rem 0;
  color: #d1ddeb;
  font-size: 0.74rem;
  line-height: 1.45;
}
.cca-dossier-power strong {
  color: #ffd1a0;
}
.cca-dossier-power span,
.cca-dossier-field {
  color: #a8c4d2;
}
.cca-persona-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: 0.45rem;
}
.cca-persona {
  --persona: #8fd3c7;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.5rem;
  border: 1px solid #ffffff1f;
  border-top: 3px solid var(--persona);
  border-radius: 0.6rem;
  background: #0b1424b3;
}
.cca-persona-hero {
  --persona: #ffcb96;
}
.cca-persona-villain {
  --persona: #e9789a;
}
.cca-persona > small {
  color: var(--persona);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.1em;
}
.cca-persona > strong {
  color: #fff3e3;
  font-size: 0.92rem;
  line-height: 1.15;
}
.cca-focus {
  align-self: flex-start;
  padding: 0.08rem 0.45rem;
  border: 1px solid #ffffff30;
  border-radius: 999px;
  background: #ffffff12;
  color: #e6edf5;
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cca-stats {
  display: grid;
  gap: 0.15rem;
  margin: 0.25rem 0;
}
.cca-stats li {
  display: grid;
  grid-template-columns: 3.3rem repeat(5, minmax(0, 1fr));
  align-items: center;
  gap: 2px;
}
.cca-stats span {
  color: #b8cad8;
  font-size: 0.56rem;
}
.cca-stats i {
  height: 0.38rem;
  border-radius: 2px;
  background: #ffffff1a;
}
.cca-stats i.on {
  background: var(--persona);
}
.cca-persona p {
  color: #d1ddeb;
  font-size: 0.66rem;
  line-height: 1.38;
}
.cca-storylens-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.5rem;
}
.cca-storylens-tabs .cca-small[aria-pressed='true'] {
  border-color: #ffcb96;
  color: #ffcb96;
}
.cca-crossover {
  padding: 0.6rem 0;
  border-bottom: 1px solid #98b8cc55;
}
.cca-crossover strong,
.cca-crossover small {
  display: block;
}
.cca-crossover p {
  margin: 0.3rem 0;
  font-size: 0.69rem;
  line-height: 1.45;
}
.cca-identity-preview {
  padding: 0.65rem;
  border: 1px solid #98b8cc66;
  border-radius: 0.7rem;
  background: #121e32b8;
}
.cca-identity-preview summary {
  cursor: pointer;
  color: #ffe0b9;
  font-size: 0.78rem;
}
.cca-identity-preview summary small {
  display: block;
  color: #b2d5cb;
  font-size: 0.66rem;
}
.cca-identity-caveat {
  margin: 0.2rem 0 0;
  color: #d1ddeb;
  font-size: 0.69rem;
  line-height: 1.4;
}
.cca-identity-caveat {
  margin-top: 0.65rem;
  color: #b2d5cb;
}

.cca-primary {
  width: 100%;
  min-height: 2.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: linear-gradient(95deg, #f7c28d, #df8d81);
  border: 1px solid #ffdfb3;
  color: #1d2338;
  border-radius: 0.55rem;
  padding: 0.75rem 1rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  font-size: 0.73rem;
  box-shadow: 0 10px 25px #0006;
}
.cca-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}
.cca-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.cca-under,
.cca-muted {
  margin-top: 0.8rem;
  font-size: 0.67rem;
  color: #a4b6c9;
  line-height: 1.5;
}
.cca-mission-tactics {
  padding: 0.65rem;
  margin: 0.45rem 0;
  border: 1px solid #d9b96c88;
  border-radius: 0.7rem;
  background: #162a3acb;
  display: grid;
  gap: 0.45rem;
}
.cca-mission-tactics > p,
.cca-mission-tactics > small {
  font-size: 0.78rem;
  line-height: 1.4;
  color: #dae3e9;
}
.cca-mission-tactics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
}
.cca-mission-tactics-grid .cca-choice {
  display: grid;
  align-content: start;
  gap: 0.3rem;
  font-size: 0.78rem;
  text-align: left;
}
.cca-mission-tactics-grid .cca-choice.active {
  border-color: #d9b96c;
  background: #34445e;
}
@media (max-width: 650px) {
  .cca-mission-tactics-grid {
    grid-template-columns: 1fr;
  }
}
.cca-patrol-board {
  border: 1px solid #8bc8d466;
  background: linear-gradient(135deg, #102738e8, #151a33f0);
  border-radius: 0.8rem;
  padding: 0.7rem;
  margin-bottom: 0.7rem;
}
.cca-patrol-heading {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.cca-patrol-heading small {
  color: #c7dbe4;
  max-width: 32rem;
}
.cca-patrol-zones {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.35rem;
}
.cca-patrol-zones button {
  text-align: left;
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #9db0cf50;
  background: #071625a6;
  display: grid;
  gap: 0.2rem;
}
.cca-patrol-zones button.active,
.cca-patrol-zones button.chosen {
  border-color: #eecb82;
  background: #34455f;
}
.cca-patrol-zones button strong {
  font-size: 0.78rem;
}
.cca-patrol-zones button small {
  color: #aebfc9;
  font-size: 0.69rem;
}
.cca-patrol-story {
  margin-top: 0.55rem;
  display: grid;
  gap: 0.35rem;
}
.cca-patrol-story p {
  font-size: 0.84rem;
  line-height: 1.45;
  color: #e5edf5;
}
.cca-patrol-decisions {
  display: grid;
  gap: 0.35rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.cca-patrol-decisions button {
  font-size: 0.83rem;
  justify-content: space-between;
}
@media (max-width: 650px) {
  .cca-patrol-zones,
  .cca-patrol-decisions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.cca-incident {
  padding: 0.75rem;
  margin-bottom: 0.7rem;
  background: #ffffff0a;
  border: 1px solid #b4b9ca46;
  border-radius: 0.8rem;
}
.cca-incident-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
}
.cca-incident-name strong {
  font-family: Georgia, serif;
  font-size: 1.05rem;
}
.cca-incident-name span {
  font-size: 0.62rem;
  font-weight: 800;
  color: #ffc291;
}
.cca-incident-location {
  margin: 0.2rem 0 0.45rem;
  color: #93c9d0;
  font-weight: 800;
  font-size: 0.58rem;
  letter-spacing: 0.1em;
}
.cca-incident p,
.cca-report p {
  font-size: 0.75rem;
  line-height: 1.5;
  color: #d6dce7;
}
.cca-roster {
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  gap: 0.45rem;
  padding-bottom: 0.35rem;
  margin: 0.65rem 0;
}
.cca-roster-button {
  flex: 0 0 clamp(5.2rem, 19%, 7rem);
  min-width: 0;
  border: 1px solid #9caec364;
  background: #34445e9c;
  color: #fff0e1;
  padding: 0.3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 0.15rem;
}
.cca-poster-art {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: clamp(5.3rem, 13vh, 8.7rem);
  border-radius: 0.35rem;
  overflow: hidden;
  background: linear-gradient(145deg, #75618b, #22324d);
}
.cca-poster-initials {
  font:
    900 1.7rem Georgia,
    serif;
  color: #f9ddc4;
}
.cca-expression {
  position: absolute;
  right: 0.2rem;
  bottom: 0.2rem;
  padding: 0 0.28rem;
  border-radius: 50%;
  background: #192338d9;
  font-size: 1.1rem;
}
.cca-expression.mood-positive {
  color: #97ead9;
}
.cca-expression.mood-negative {
  color: #ffac9e;
}
.cca-expression.mood-neutral {
  color: #ffdf9b;
}
.cca-poster-role {
  font-size: 0.53rem;
  color: #eccda9;
  text-align: center;
  min-height: 1.5rem;
}
.cca-poster-reaction {
  font-size: 0.53rem;
  line-height: 1.2;
  text-align: center;
  color: #d8ddea;
  min-height: 2.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cca-odds-note {
  font-size: 0.66rem;
  color: #c5d1dd;
  margin: 0.3rem 0 0.6rem;
}
.cca-special-route,
.cca-recruit-offer {
  border: 1px solid #e6be8480;
  background: #3b354b;
  border-radius: 0.6rem;
  padding: 0.6rem;
  margin: 0.5rem 0;
  font-size: 0.75rem;
}
.cca-special-route {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.cca-special-route strong {
  color: #ffd3a8;
}
.cca-recruit-offer {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.cca-recruit-offer h3 {
  font:
    800 1.1rem Georgia,
    serif;
}
.cca-recruit-portrait {
  flex: 0 0 6rem;
  height: 8rem;
  display: grid;
  place-items: center;
  font:
    800 1.4rem Georgia,
    serif;
  background: #55445e;
  border-radius: 0.5rem;
  overflow: hidden;
}
.cca-recruit-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (max-width: 480px) {
  .cca-roster-button {
    flex-basis: 6rem;
  }
  .cca-recruit-portrait {
    flex-basis: 4rem;
    height: 5rem;
  }
}
.cca-roster-button.active {
  border-color: #ffc897;
  background: #a66d6799;
}
.cca-roster-button.unavailable {
  opacity: 0.28;
}
.cca-roster-button:disabled {
  cursor: not-allowed;
}
.cca-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  border-radius: inherit;
}
.cca-villain-inset {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 2;
  width: clamp(4.5rem, 18%, 9rem);
  aspect-ratio: 1;
  object-fit: cover;
  border: 2px solid rgb(255 255 255 / 0.7);
  border-radius: 0.6rem;
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.45);
}
.cca-avatar {
  overflow: hidden;
  font-family: Georgia, serif;
  display: grid;
  place-items: center;
  border-radius: 50%;
  width: 1.85rem;
  height: 1.85rem;
  background: linear-gradient(145deg, #a4bdc5, #555979);
  font-weight: 900;
  font-size: 0.6rem;
}
.cca-roster-name {
  font-size: 0.58rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
}
.cca-crew-count {
  display: flex;
  justify-content: space-between;
  font-size: 0.57rem;
  color: #b7c3d5;
  letter-spacing: 0.06em;
}
.cca-crew-count span {
  color: #efba95;
}
.cca-story {
  font-size: clamp(0.92rem, 1.13vw, 1.03rem);
  line-height: 1.8;
  color: #f2e6dd;
  font-family: Georgia, serif;
  margin: 1.2rem 0;
}
.cca-report-mini {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-left: 2px solid #ba95aa;
  padding: 0.7rem;
  margin-bottom: 1rem;
  font-size: 0.72rem;
  color: #b5cddc;
}
.cca-report-mini strong {
  color: #f6c89e;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
}
.cca-choice {
  width: 100%;
  display: flex;
  justify-content: space-between;
  text-align: left;
  gap: 0.7rem;
  padding: 0.8rem;
  margin: 0.5rem 0;
  border: 1px solid #94bac488;
  border-radius: 0.65rem;
  background: linear-gradient(95deg, #274c6075, #243250);
  font-size: 0.83rem;
  line-height: 1.5;
  color: #ecf7fa;
}
.cca-choice:hover,
.cca-choice:focus-visible {
  border-color: #f9cc9b;
  background: #405d74;
}
.cca-report {
  background: #ffffff0c;
  padding: 0.7rem;
  border-radius: 0.6rem;
  margin: 0.5rem 0;
}
.cca-report > div {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.cca-report strong {
  font-size: 0.85rem;
}
.cca-report small {
  display: block;
  margin: 0.15rem 0;
  color: #a9cad5;
}
.cca-report [class^='cca-grade'] {
  text-transform: uppercase;
  font-size: 0.6rem;
  font-weight: 800;
  color: #ffc392;
}
.cca-final-stats {
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid #ffffff38;
  font-size: 0.74rem;
}
.cca-final-stats b {
  color: #ffcb93;
  font-size: 1.3rem;
  margin-left: 0.4rem;
}
.cca-map-tabs {
  display: flex;
  gap: 0.35rem;
  margin: 0.6rem 0;
}
.cca-map-tabs button {
  flex: 1;
  padding: 0.55rem 0.35rem;
  border: 1px solid #9bb4c37a;
  border-radius: 0.4rem;
  font-size: 0.61rem;
  font-weight: 800;
}
.cca-map-tabs button.chosen {
  color: #101c2d;
  background: #f6bc90;
}
.cca-map {
  position: relative;
  width: 100%;
  min-height: 240px;
  height: clamp(240px, 43vh, 410px);
  overflow: hidden;
  isolation: isolate;
  border: 1px solid #7ba7bb;
  border-radius: 0.75rem;
  background:
    radial-gradient(ellipse at 78% 77%, #926e81a6, transparent 45%),
    repeating-linear-gradient(31deg, #7191a014 0 2px, transparent 2px 20px),
    linear-gradient(135deg, #1f3b57, #253e47 60%, #312d53);
}
.cca-map-watermark {
  position: absolute;
  left: 7%;
  bottom: 10%;
  opacity: 0.14;
  font:
    900 clamp(1.4rem, 4vw, 3rem) Georgia,
    serif;
  letter-spacing: 0.15em;
}
.cca-map-roads {
  position: absolute;
  inset: 0;
  height: 100%;
  width: 100%;
  pointer-events: none;
}
.cca-map-roads line {
  stroke: #9fd0c6;
  stroke-width: 0.7;
  stroke-dasharray: 1.7 0.8;
  vector-effect: non-scaling-stroke;
  opacity: 0.72;
}
.cca-map-pin {
  position: absolute;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0.1rem;
  color: #fdf0df;
  background: #15263de8;
  border: 1px solid #b3cad5;
  border-radius: 50%;
  font-weight: 800;
}
.cca-map-pin.city {
  border-color: #d9a7ce;
}
.cca-map-pin.explored {
  opacity: 0.35;
}
.cca-map-pin:focus-visible,
.cca-map-pin:not(:disabled):hover {
  outline: 2px solid #ffe0a9;
  z-index: 3;
}
.cca-map-dot {
  color: #ffcd97;
  font-size: 1rem;
}
.cca-map-name {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.2rem 0.35rem;
  color: #fff3df;
  background: #14243dec;
  border-radius: 0.25rem;
  font-size: 0.58rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
}
.cca-map-pin:focus-visible .cca-map-name,
.cca-map-pin:not(:disabled):hover .cca-map-name {
  opacity: 1;
}
.cca-map-compass {
  position: absolute;
  right: 0.65rem;
  top: 0.55rem;
  font-weight: 900;
  font-size: 0.75rem;
}
.cca-map-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.35rem;
  color: #c6dce8;
  font-size: 0.69rem;
  margin: 0.65rem 0;
}
.cca-map-trust {
  color: #ffe0b9;
  font-weight: 800;
}
.cca-map-sites {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
  padding-bottom: 0.65rem;
}
.cca-map-site-choice {
  min-width: 0;
  min-height: 3.9rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid #7da2b1a6;
  border-radius: 0.45rem;
  background: #14253ccc;
  text-align: left;
}
.cca-map-site-choice strong {
  display: block;
  color: #ffe0b9;
  font-size: 0.73rem;
}
.cca-map-site-choice small {
  display: block;
  margin-top: 0.15rem;
  color: #bad4da;
  font-size: 0.64rem;
  line-height: 1.25;
}
.cca-map-site-choice:disabled {
  opacity: 0.45;
}
.cca-map-site-choice:not(:disabled):hover,
.cca-map-site-choice:focus-visible {
  outline: 2px solid #ffe0a9;
  background: #2a4661;
}
.cca-footer {
  min-height: 2rem;
  border-top: 1px solid #ffffff24;
  border-bottom: 0;
  color: #a7b6c8;
}
@media (max-width: 850px) {
  .cca-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 42%) minmax(0, 58%);
  }
  .cca-console {
    border-left: 0;
    border-top: 1px solid #b6a1ad65;
  }
  .cca-stage-content {
    bottom: 12%;
  }
  .cca-big-title {
    font-size: clamp(2.3rem, 8vw, 4.5rem);
  }
  .cca-scene-title {
    font-size: clamp(1.8rem, 6.5vw, 3rem);
  }
  .cca-top-detail {
    display: none;
  }
  .cca-score {
    margin-left: auto;
  }
  .cca-top-title {
    font-size: 0.62rem;
  }
}
@media (max-width: 440px) {
  .cca-topbar {
    gap: 0.4rem;
    padding: 0.3rem 0.35rem;
  }
  .cca-top-title {
    font-size: 0.55rem;
  }
  .cca-score {
    font-size: 0.5rem;
  }
  .cca-stage-content {
    bottom: 17%;
  }
  .cca-stage-foot {
    font-size: 0.44rem;
  }
  .cca-eyebrow {
    font-size: 0.5rem;
  }
  .cca-intro,
  .cca-scene-copy {
    font-size: 0.74rem;
    line-height: 1.35;
  }
  .cca-roster {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .cca-roster-button {
    flex-direction: row;
    justify-content: center;
  }
  .cca-power {
    min-height: 3.3rem;
  }
  .cca-power-glyph {
    font-size: 1.2rem;
  }
  .cca-power strong {
    font-size: 0.64rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cca-power,
  .cca-scenery {
    transition: none;
  }
}
</style>
