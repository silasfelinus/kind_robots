<template>
  <main
    class="kr-surface cap-shell h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    aria-label="Space Couch"
  >
    <header class="cap-toolbar">
      <NuxtLink to="/" class="cap-home" aria-label="Return to Kind Robots home"
        >‹ <span class="hidden sm:inline">HOME</span></NuxtLink
      >
      <span class="cap-emblem">✧</span
      ><span class="cap-wordmark">SPACE <i>COUCH</i></span>
      <span class="cap-flight">{{
        run
          ? 'SHIP DAY ' +
            (run.day ?? run.chapter) +
            ' // CHAPTER ' +
            run.chapter
          : 'BRIDGE ACCESS REQUESTED'
      }}</span>
      <span v-if="run" class="cap-hud"
        >SUPPLIES <b>{{ run.supplies }}</b> <span>/</span> TRUST
        <b>{{ run.trust }}</b></span
      >
      <span v-if="run" class="cap-hud" aria-label="Couch force shield charge"
        >BUBBLE <b>{{ run.shieldCharge ?? 2 }}/3</b></span
      >
      <button v-if="run" type="button" class="cap-reset" @click="restartVoyage">
        NEW VOYAGE
      </button>
    </header>
    <p v-if="store.storageWarning" class="cap-warning" role="alert">
      {{ store.storageWarning }}
    </p>
    <div
      class="cap-layout min-h-0 flex-1"
      :class="{
        'cap-layout--episode': run?.phase === 'expedition',
        'cap-layout--stars': !run && selectionScreen === 'stars',
      }"
    >
      <section
        class="cap-stage"
        aria-label="Long red couch spacecraft protected by an invisible force bubble"
      >
        <img class="cap-painting" :src="stagePainting" :alt="stageAlt" />
        <div class="cap-vignette" aria-hidden="true" />
        <div class="cap-overlay">
          <div class="cap-kicker">
            COUCH COMMAND // FORCE BUBBLE // POCKET ROOMS <span>•</span> CREW
            COMPLEMENT UNKNOWN
          </div>
          <template v-if="!run">
            <span class="cap-coordinate">{{
              selectionScreen === 'stars'
                ? 'THE COUCHSCOPE'
                : selectionScreen === 'captain'
                  ? 'CAPTAIN DOSSIER'
                  : 'CREW DOSSIER'
            }}</span>
            <h2 class="cap-title">
              {{
                selectionScreen === 'stars'
                  ? 'Your Constellation Awaits'
                  : selectionScreen === 'captain'
                    ? activeCaptain.name
                    : crewProfile(focusedCrew).name
              }}
            </h2>
            <p class="cap-tagline">
              {{
                selectionScreen === 'stars'
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
          :class="{ 'cap-episode-scroll': run?.phase === 'expedition' }"
        >
          <div v-if="!store.loaded" class="cap-placeholder">
            Establishing a secure link to ship registry…
          </div>

          <template v-else-if="!run">
            <SpaceCouchConstellationTest
              v-if="selectionScreen === 'stars'"
              @confirm="confirmStarAssessment"
            />
            <template v-else-if="selectionScreen === 'captain'">
              <div class="cap-heading">
                <span>01</span>
                <div>
                  <h2>Claim your cushion</h2>
                  <p>
                    Select a captain, then appoint your bridge officers. The
                    couch runs on personalities as much as fuel.
                  </p>
                </div>
              </div>
              <div class="cap-captains">
                <button
                  v-for="captain in CAPTAINS"
                  :key="captain.id"
                  type="button"
                  class="cap-captain"
                  :class="{ chosen: captain.id === selectedCaptain }"
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
                    /><template v-else>{{
                      captain.name.split(' ').at(-1)?.slice(0, 1)
                    }}</template></span
                  >
                  <span
                    ><strong>{{ captain.name }}</strong
                    ><small>{{ captain.epithet }}</small></span
                  >
                </button>
              </div>
              <div class="cap-insight">
                <strong>{{ activeCaptain.doctrine }}</strong
                ><small
                  >Advantage: {{ activeCaptain.ability }} · Price:
                  {{ activeCaptain.cost }}</small
                >
              </div>
              <div
                class="cap-stats cap-captain-stats"
                aria-label="Captain statistics"
              >
                <div v-for="skill in SKILLS" :key="skill">
                  <small>{{ skill.toUpperCase() }}</small
                  ><strong>{{ captainStats[skill] }}</strong>
                </div>
              </div>
              <div class="cap-insight">
                <strong>Personal history</strong>
                <p>{{ CAPTAIN_DOSSIERS[selectedCaptain].history }}</p>
                <small
                  >First order:
                  {{ CAPTAIN_DOSSIERS[selectedCaptain].opening }}</small
                >
                <small
                  >Unresolved liability:
                  {{ CAPTAIN_DOSSIERS[selectedCaptain].liability }}</small
                >
              </div>
              <button
                class="cap-primary"
                type="button"
                data-testid="captains-choose-crew"
                @click="selectionScreen = 'crew'"
              >
                APPOINT YOUR CREW <span>➜</span>
              </button>
            </template>
            <template v-else>
              <button
                class="cap-option"
                type="button"
                data-testid="captains-back-to-captains"
                @click="selectionScreen = 'captain'"
              >
                <span
                  ><b>← CHANGE CAPTAIN</b
                  ><small
                    >{{ activeCaptain.name }} ·
                    {{ activeCaptain.epithet }}</small
                  ></span
                >
              </button>
              <div class="cap-heading cap-crew-heading">
                <span>02</span>
                <div>
                  <h2>Appoint your crew</h2>
                  <p>
                    Choose exactly three officers from twelve. Their abilities,
                    conflicts and personal quests change the routes.
                  </p>
                </div>
              </div>
              <div class="cap-crew-picker">
                <button
                  v-for="member in CREW"
                  :key="member.id"
                  type="button"
                  class="cap-crew-button"
                  :class="{ chosen: chosenCrew.includes(member.id) }"
                  :aria-pressed="chosenCrew.includes(member.id)"
                  :title="
                    chosenCrew.length >= 3 && !chosenCrew.includes(member.id)
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
                    /><template v-else>{{ member.monogram }}</template></span
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
              <div class="cap-team-note">
                ✧ {{ chosenStarSign?.name }} · {{ chosenCrew.length }} / 3
                selected · {{ CREW_PROFILES.length }} candidates ·
                {{
                  chosenCrew.length === 3
                    ? 'Unselect an officer to appoint a different one'
                    : 'Choose your complement'
                }}
              </div>
              <div class="cap-insight" aria-live="polite">
                <strong
                  >{{ crewProfile(focusedCrew).name }} ·
                  {{ crewProfile(focusedCrew).culture }}</strong
                >
                <p>{{ CREW_DOSSIERS[focusedCrew].history }}</p>
                <small
                  >Personal voyage:
                  {{ CREW_DOSSIERS[focusedCrew].itinerary.join(' → ') }}</small
                >
                <small
                  >Enemy connection:
                  {{ CREW_DOSSIERS[focusedCrew].nemesisLink }}</small
                >
                <div class="cap-stats" aria-label="Focused crew skills">
                  <div v-for="skill in SKILLS" :key="skill">
                    <small>{{ skill.toUpperCase() }}</small>
                    <strong>{{ crewProfile(focusedCrew).stats[skill] }}</strong>
                  </div>
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
              <div class="cap-subnote">
                Playable three-stop voyage · Full multi-world personal quests
                are still in development
              </div>
            </template>
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
                  class="cap-crew-button"
                  :class="{ chosen: run.pocketRoom === room.id }"
                  :aria-pressed="run.pocketRoom === room.id"
                  :disabled="run.supplies < 1 && run.pocketRoom !== room.id"
                  @click="store.chooseRoom(room.id)"
                >
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
                    v-if="portrait(crewProfile(member.id).portraitKey)"
                    :src="portrait(crewProfile(member.id).portraitKey)!"
                    alt=""
                    class="cap-portrait-img"
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
                <h2>Prime contact dilemma</h2>
                <p>{{ mission.system }} · COMMAND AUTHORITY</p>
              </div>
            </div>
            <p class="cap-narrative">{{ mission.dilemma }}</p>
            <div v-if="run.report" class="cap-mission-report">
              <strong
                >{{ run.report.result.toUpperCase() }} / MISSION STATUS</strong
              ><span>{{ run.report.names }}</span>
              <p>{{ run.report.text }}</p>
            </div>
            <p class="cap-alert">
              {{ nemesisLine }}
            </p>
            <button
              class="cap-option"
              type="button"
              @click="store.decide('aid')"
            >
              <span
                ><b>{{ ethicalOrders.aid }}</b
                ><small
                  >Spend supplies; earn trust without claiming authority.</small
                ></span
              >
              ↗
            </button>
            <button
              class="cap-option"
              type="button"
              @click="store.decide('observe')"
            >
              <span
                ><b>{{ ethicalOrders.observe }}</b
                ><small
                  >Preserve legal standing. Others live with the result.</small
                ></span
              >
              ↗
            </button>
            <button
              class="cap-option"
              type="button"
              @click="store.decide('intervene')"
            >
              <span
                ><b>{{ ethicalOrders.intervene }}</b
                ><small>Act now. Accept the outrage that follows.</small></span
              >
              ↗
            </button>
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
            <button class="cap-primary" type="button" @click="store.restart()">
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

import { warpArt } from '~/utils/gameOfCaptains/artManifest'
import { portraitArt } from '~/utils/gameOfCaptains/artSlots'
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
const selectionScreen = ref<'stars' | 'captain' | 'crew'>('stars')
const starAssessment = ref<StarAssessment | null>(null)
const chosenStarSign = computed(() =>
  starAssessment.value ? starSignFor(starAssessment.value.sign) : null,
)
const focusedCrew = ref<CrewId>('pell')
const run = computed(() => store.run)
const romanceScene = computed(() =>
  run.value ? romanceMoment(run.value) : null,
)
const romanceRecord = computed(
  () => (run.value as RomanceVoyage | null)?.romance,
)
/** A captain or crew portrait once its render ships; the monogram stands in until then. */
const portrait = (key: string) => portraitArt(key)
const stagePainting = computed(() => {
  if (run.value) return '/game-of-captains/space-couch-stage.svg'
  const key =
    selectionScreen.value === 'stars'
      ? ''
      : selectionScreen.value === 'captain'
        ? 'captain-' + selectedCaptain.value
        : 'crew-' + focusedCrew.value
  return portrait(key) || '/game-of-captains/space-couch-stage.svg'
})
const stageAlt = computed(() =>
  run.value
    ? 'Four travelers aboard a red couch in space, surrounded by an invisible protective force bubble'
    : selectionScreen.value === 'stars'
      ? 'The starry sky above the long red couch'
      : selectionScreen.value === 'captain'
        ? activeCaptain.value.name + ' selection portrait'
        : crewProfile(focusedCrew.value).name + ' selection portrait',
)
const activeCaptain = computed(() =>
  CAPTAINS.find((c) => c.id === selectedCaptain.value)!,
)
const mission = computed(() =>
  run.value ? missionFor(run.value) : MISSIONS[0]!,
)
const routeBoard = computed(() => (run.value ? missionBoard(run.value) : []))
const circuit = computed(() => solarCircuit(run.value?.seed ?? 1))
const localSystem = computed(() =>
  chapterSystem(run.value?.seed ?? 1, run.value?.chapter ?? 1),
)
const franchiseImage = computed(() =>
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
const stageCopy = computed(() =>
  run.value?.phase === 'briefing'
    ? mission.value.briefing
    : (run.value?.scene ?? ''),
)
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
    : 'PERSONNEL // COMMAND SELECTION',
)

function confirmStarAssessment(assessment: StarAssessment) {
  starAssessment.value = assessment
  selectionScreen.value = 'captain'
}
function beginWithStarSign() {
  if (!starAssessment.value || chosenCrew.value.length !== 3) return
  store.begin(selectedCaptain.value, chosenCrew.value, starAssessment.value)
}
function restartVoyage() {
  store.restart()
  starAssessment.value = null
  selectionScreen.value = 'stars'
  chosenCrew.value = []
}
onMounted(() => store.load())
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
.cap-shell {
  gap: 0;
  background: #080e1d;
  color: #f5eddd;
  font-family: system-ui, sans-serif;
}
.cap-toolbar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 2.75rem;
  flex-shrink: 0;
  padding: 0.3rem 0.75rem;
  background: #101b2d;
  border-bottom: 2px solid #bca07a64;
  font-size: 0.64rem;
  letter-spacing: 0.1em;
  font-weight: 900;
}
.cap-home,
.cap-reset {
  border: 1px solid #b8babb6e;
  padding: 0.34rem 0.65rem;
  border-radius: 5px;
  color: #ffe2bc;
  white-space: nowrap;
}
.cap-home:hover,
.cap-reset:hover {
  background: #416074;
}
.cap-emblem {
  color: #eebf8b;
  font-size: 1.3rem;
}
.cap-wordmark {
  white-space: nowrap;
}
.cap-wordmark i {
  font-size: 0.8em;
  color: #efbb84;
}
.cap-flight {
  margin-left: auto;
  color: #91bac3;
}
.cap-hud {
  white-space: nowrap;
  color: #e7ecf0;
}
.cap-hud b {
  color: #ffce99;
}
.cap-hud span {
  margin: 0 0.3rem;
  color: #60849d;
}
.cap-warning {
  background: #802d2d;
  padding: 0.3rem 1rem;
  font-size: 0.75rem;
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
  .cap-flight {
    display: none;
  }
  .cap-hud {
    margin-left: auto;
  }
}
@media (max-width: 450px) {
  .cap-toolbar {
    gap: 0.35rem;
    padding: 0.35rem 0.4rem;
  }
  .cap-wordmark {
    font-size: 0.55rem;
  }
  .cap-hud {
    font-size: 0.52rem;
  }
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
</style>
