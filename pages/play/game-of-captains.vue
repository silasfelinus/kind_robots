<template>
  <main
    class="kr-surface cap-shell h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    aria-label="This Means Warp"
  >
    <header class="cap-toolbar">
      <NuxtLink to="/" class="cap-home" aria-label="Return to Kind Robots home"
        >‹ <span class="hidden sm:inline">HOME</span></NuxtLink
      >
      <span class="cap-emblem">✧</span
      ><span class="cap-wordmark">THIS <i>MEANS</i> WARP</span>
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
      <button
        v-if="run"
        type="button"
        class="cap-reset"
        @click="store.restart()"
      >
        NEW VOYAGE
      </button>
    </header>
    <p v-if="store.storageWarning" class="cap-warning" role="alert">
      {{ store.storageWarning }}
    </p>
    <div class="cap-layout min-h-0 flex-1">
      <section class="cap-stage" aria-label="Illustrated bridge and starfield">
        <img
          class="cap-painting"
          src="/game-of-captains/bridge-stage.svg"
          alt="A command bridge looking toward a turbulent nebula, a distant ship and a floating planet"
        />
        <div class="cap-vignette" aria-hidden="true" />
        <div class="cap-overlay">
          <div class="cap-kicker">
            STAR COMMAND // INDEPENDENT VESSEL <span>•</span> CREW COMPLEMENT
            UNKNOWN
          </div>
          <template v-if="!run">
            <h2 class="cap-title">
              THIS <small>MEANS</small><span>WARP</span>
            </h2>
            <p class="cap-tagline">
              One ship. Six captains. Nobody read the mission brief.
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
              v-for="n in 3"
              :key="n"
              :class="{ active: !!run && n <= run.chapter }" /></span
          ><span>⌁ LIVE</span>
        </div>
        <div class="cap-scroll kr-scroll">
          <div v-if="!store.loaded" class="cap-placeholder">
            Establishing a secure link to ship registry…
          </div>

          <template v-else-if="!run">
            <div class="cap-heading">
              <span>01</span>
              <div>
                <h2>Take the chair</h2>
                <p>
                  Select a captain, then appoint your bridge officers. A ship
                  runs on personalities as much as fuel.
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
                  >{{ captain.name.split(' ').at(-1)?.slice(0, 1) }}</span
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
                :disabled="
                  chosenCrew.length >= 3 && !chosenCrew.includes(member.id)
                "
                @click="toggleCrew(member.id)"
              >
                <span
                  class="cap-monogram"
                  :data-portrait-key="crewProfile(member.id).portraitKey"
                  >{{ member.monogram }}</span
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
              {{ chosenCrew.length }} / 3 selected ·
              {{ CREW_PROFILES.length }} candidates
            </div>
            <p class="cap-crew-story">
              {{ chosenCrew.map((id) => crewProfile(id).story).join(' ') }}
            </p>
            <button
              class="cap-primary"
              type="button"
              data-testid="captains-begin"
              :disabled="chosenCrew.length !== 3"
              @click="store.begin(selectedCaptain, chosenCrew)"
            >
              TAKE COMMAND <span>➜</span>
            </button>
            <div class="cap-subnote">
              Playable three-stop voyage · Local save · Different captains,
              different costs
            </div>
          </template>

          <template v-else-if="run.phase === 'briefing'">
            <div class="cap-heading">
              <span>03</span>
              <div>
                <h2>{{ mission.title }}</h2>
                <p>{{ mission.system }} / DISTRESS CALL</p>
              </div>
            </div>
            <p class="cap-narrative">{{ mission.briefing }}</p>
            <div class="cap-antagonist">
              <strong>ANOMALY IN THE SIGNAL</strong>
              <p>
                A persistent rival is changing events in ways your crew cannot
                yet explain.
              </p>
              <small>{{ antagonist.title }}</small>
            </div>
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
                  >{{ member.monogram }}</span
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
                captain on bridge</span
              >
            </div>
            <button
              class="cap-primary"
              type="button"
              data-testid="captains-launch"
              :disabled="!missionPreview?.eligible"
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
                  >{{ crewProfile(id).monogram }}</span
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
            <p class="cap-alert">{{ antagonist.interference }}</p>
            <button
              class="cap-option"
              type="button"
              @click="store.decide('aid')"
            >
              <span
                ><b>Offer consent-based help</b
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
                ><b>Observe the non-interference rule</b
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
                ><b>Break protocol and take command</b
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
            <p class="cap-alert">
              The next destination may not agree with how you got here. That is
              what makes it a destination.
            </p>
            <button
              class="cap-primary"
              type="button"
              data-testid="captains-next"
              @click="store.next()"
            >
              {{
                run.chapter === 3
                  ? 'APPROACH THE LAST JUMP GATE'
                  : 'PLOT NEXT COURSE'
              }}
              <span>➜</span>
            </button>
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
                <p>A CAPTAIN IS WHAT THE CREW REMEMBERS</p>
              </div>
            </div>
            <p class="cap-narrative">{{ run.scene }}</p>
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
  previewMission,
  antagonistFor,
  missionFor,
  type CaptainId,
  type CrewId,
} from '~/utils/gameOfCaptains/rules'
import {
  CAPTAIN_STATS,
  CREW_PROFILES,
  SKILLS,
  ruleFor,
} from '~/utils/gameOfCaptains/crewAssignments'

const store = useGameOfCaptainsStore()
const selectedCaptain = ref<CaptainId>('fluke')
const chosenCrew = ref<CrewId[]>(['pell', 'vela', 'rue'])
const run = computed(() => store.run)
const activeCaptain = computed(() =>
  CAPTAINS.find((c) => c.id === selectedCaptain.value)!,
)
const mission = computed(() =>
  run.value ? missionFor(run.value) : MISSIONS[0]!,
)
const antagonist = computed(() =>
  run.value ? antagonistFor(run.value) : ANTAGONISTS[0]!,
)
const availableCrew = computed(() =>
  CREW.filter((person) => run.value?.crew.includes(person.id)),
)
const missionRule = computed(() => ruleFor(mission.value.id))
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
    : mission.value.system.toUpperCase(),
)
const headline = computed(() =>
  run.value
    ? {
        briefing: mission.value.title,
        transit: 'Away Team En Route',
        decision: 'The Cost Of Knowing',
        debrief: 'Between The Stars',
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
        finale: 'LAST TRANSMISSION // FINALE',
        ending: 'CHRONICLE // A VOYAGE RECORDED',
      }[run.value.phase]
    : 'PERSONNEL // COMMAND SELECTION',
)

onMounted(() => store.load())
useHead({ title: 'This Means Warp | Kind Robots' })

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
.cap-monogram {
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
