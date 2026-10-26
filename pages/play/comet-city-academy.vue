<template>
  <main
    class="kr-surface cca-shell h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    aria-label="Capes & Tassels: Prom of Doom game"
  >
    <header class="cca-topbar">
      <NuxtLink to="/" class="cca-home" aria-label="Return to Kind Robots home"
        >‹ <span class="hidden sm:inline">HOME</span></NuxtLink
      >
      <span class="cca-insignia">✦</span>
      <span class="cca-top-title">CAPES <b>&amp; TASSELS</b></span>
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
    <div class="cca-layout min-h-0 flex-1">
      <section class="cca-stage" aria-label="Illustrated academy scene">
        <img
          src="/comet-city-academy/academy-stage.svg"
          alt="The towers of Comet City Academy beneath a glowing comet and a purple sunset"
          class="cca-scenery"
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
              CHAPTER {{ run.day.toString().padStart(2, '0') }} / THE FIRST WEEK
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
            <span v-for="n in 7" :key="n" :class="{ filled: n <= run.day }" />
          </div>
          <span class="cca-serial">C.C.A. // 07</span>
        </div>
        <div class="cca-pane kr-scroll">
          <template v-if="!store.loaded">
            <p class="cca-muted">Loading your academy record…</p>
          </template>
          <template v-else-if="!run">
            <div class="cca-heading">
              <span>01</span>
              <div>
                <h2>Shape your power</h2>
                <p>How it moves, what it controls, and the vow you make.</p>
              </div>
            </div>
            <p class="cca-selection-label">STEP 1 · FORM / HOW IT WORKS</p>
            <div class="cca-power-grid">
              <button
                v-for="form in POWER_FORMS"
                :key="form.id"
                type="button"
                class="cca-power cca-power-compact"
                :class="{ chosen: selectedForm === form.id }"
                :aria-pressed="selectedForm === form.id"
                @click="selectedForm = form.id"
              >
                <strong>{{ form.name }}</strong>
                <small>{{ form.mechanic }}</small>
              </button>
            </div>
            <p class="cca-selection-label">
              STEP 2 · AFFINITY / WHAT IT CONTROLS
            </p>
            <div class="cca-power-grid cca-affinity-grid">
              <button
                v-for="affinity in POWER_AFFINITIES"
                :key="affinity.id"
                type="button"
                class="cca-power cca-power-compact"
                :class="{ chosen: selectedElement === affinity.id }"
                :aria-pressed="selectedElement === affinity.id"
                @click="selectedElement = affinity.id"
              >
                <strong>{{ affinity.name }}</strong>
              </button>
            </div>
            <div
              class="cca-power-detail"
              data-testid="academy-signature-detail"
            >
              <strong>{{ currentSignature.name }}</strong>
              <p>{{ currentSignature.training }}</p>
              <small>Limit: {{ currentSignature.cost }}</small>
              <p class="cca-signature-tradeoff">
                {{ currentSignature.special_route.trigger }}
              </p>
            </div>
            <details
              class="cca-identity-preview"
              data-testid="academy-identity-preview"
            >
              <summary>
                <strong
                  >{{ currentIdentity.realName }} ·
                  {{ currentIdentity.student.alias }}</strong
                >
                <small>
                  HERO: {{ currentIdentity.hero.alias }} · VILLAIN:
                  {{ currentIdentity.villain.alias }}
                </small>
              </summary>
              <p class="cca-identity-caveat">{{ currentIdentity.backstory }}</p>
              <div class="cca-identity-triad">
                <div>
                  <small>STUDENT / SIDEKICK</small>
                  <strong>{{ currentIdentity.student.alias }}</strong>
                  <p>{{ currentIdentity.student.conflict }}</p>
                </div>
                <div>
                  <small>HERO</small>
                  <strong>{{ currentIdentity.hero.alias }}</strong>
                  <p>{{ currentIdentity.hero.method }}</p>
                </div>
                <div>
                  <small>VILLAIN</small>
                  <strong>{{ currentIdentity.villain.alias }}</strong>
                  <p>{{ currentIdentity.villain.method }}</p>
                </div>
              </div>
              <p class="cca-selection-label">
                EXPLORE THIS PERSON'S POSSIBLE STORY
              </p>
              <div class="cca-storylens-tabs">
                <button
                  v-for="viewpoint in viewpointOptions"
                  :key="viewpoint"
                  type="button"
                  class="cca-small"
                  :aria-pressed="selectedViewpoint === viewpoint"
                  @click="selectedViewpoint = viewpoint"
                >
                  {{ viewpoint === 'protagonist' ? 'PLAY AS' : 'MEET AS NPC' }}
                </button>
                <button
                  v-for="alignment in alignmentOptions"
                  :key="alignment"
                  type="button"
                  class="cca-small"
                  :aria-pressed="selectedAllegiance === alignment"
                  @click="selectedAllegiance = alignment"
                >
                  {{ alignment === 'hero' ? 'HERO FUTURE' : 'VILLAIN FUTURE' }}
                </button>
              </div>
              <p class="cca-identity-caveat">
                {{ currentIdentityStory.setup }}
              </p>
              <p class="cca-identity-caveat">
                {{ currentIdentityStory.decision }}
              </p>
              <p class="cca-selection-label">RELATIONSHIP PATHS CAN OVERLAP</p>
              <div class="cca-storylens-tabs">
                <button
                  v-for="bond in bondOptions"
                  :key="bond"
                  type="button"
                  class="cca-small"
                  :aria-pressed="selectedBonds.includes(bond)"
                  @click="toggleBond(bond)"
                >
                  {{ bond.toUpperCase() }}
                </button>
              </div>
              <p
                v-for="(scene, index) in currentIdentityStory.bondScenes"
                :key="index"
                class="cca-identity-caveat"
              >
                {{ scene }}
              </p>
              <p class="cca-identity-caveat">
                Preview only: the full thirty-day relationship and evolution
                quests are still in production. Romance is never required to
                become a hero or save the city.
              </p>
            </details>
            <details
              class="cca-identity-preview"
              data-testid="academy-crossover-roster"
            >
              <summary>
                VISITORS FROM OTHER WORLDS · {{ GUEST_IDENTITIES.length }}
              </summary>
              <article
                v-for="visitor in GUEST_IDENTITIES"
                :key="visitor.id"
                class="cca-crossover"
              >
                <strong>{{ visitor.realName }}</strong>
                <small>{{ visitor.source }} · {{ visitor.signature }}</small>
                <p>{{ visitor.backstory }}</p>
                <p>
                  {{ visitor.student.alias }} → {{ visitor.hero.alias }} /
                  {{ visitor.villain.alias }}
                </p>
                <small>{{ visitor.hero.method }}</small>
              </article>
            </details>
            <p class="cca-selection-label">STEP 3 · VOW / YOUR APPROACH</p>
            <div class="cca-vow-grid">
              <button
                v-for="vow in POWER_VOWS"
                :key="vow.id"
                type="button"
                class="cca-power cca-power-compact"
                :class="{ chosen: selectedVow === vow.id }"
                :aria-pressed="selectedVow === vow.id"
                @click="selectedVow = vow.id"
              >
                <strong>{{ vow.name }}</strong>
              </button>
            </div>
            <p class="cca-vow-detail">{{ activeVow.promise }}</p>
            <details class="cca-future-preview">
              <summary>A possible Prom of Doom consequence</summary>
              <p>{{ currentSignature.finales[selectedVow] }}</p>
            </details>
            <button
              class="cca-primary"
              type="button"
              data-testid="academy-begin"
              @click="
                store.begin(
                  currentSignature.legacy,
                  currentSignature.id,
                  selectedVow,
                )
              "
            >
              ENTER WITH {{ currentSignature.name.toUpperCase() }}
              <span>➜</span>
            </button>
            <p class="cca-under">
              48 signature powers · The first-week training is playable. The
              real thirty-day Prom of Doom is in development.
            </p>
          </template>

          <template v-else-if="run.phase === 'dispatch'">
            <div class="cca-heading">
              <span>02</span>
              <div>
                <h2>Simulation desk</h2>
                <p>
                  Choose up to three volunteers for each call. A student cannot
                  be in two places at once.
                </p>
              </div>
            </div>
            <article
              v-for="incident in store.incidents"
              :key="incident.id"
              class="cca-incident"
            >
              <div class="cca-incident-name">
                <strong>{{ incident.title }}</strong
                ><span>RISK {{ incident.risk }} / 06</span>
              </div>
              <div class="cca-incident-location">
                {{ incident.site }} · TRAINING SIMULATION
              </div>
              <p>{{ incident.briefing }}</p>
              <div class="cca-roster">
                <button
                  v-for="student in STUDENTS"
                  :key="student.id"
                  type="button"
                  class="cca-roster-button"
                  :class="{
                    active: isSelected(incident.id, student.id),
                    unavailable: isAssignedElsewhere(incident.id, student.id),
                  }"
                  :disabled="
                    isAssignedElsewhere(incident.id, student.id) ||
                    (!isSelected(incident.id, student.id) &&
                      teamFor(incident.id).length >= 3)
                  "
                  :aria-pressed="isSelected(incident.id, student.id)"
                  :title="student.note"
                  @click="toggleStudent(incident.id, student.id)"
                >
                  <span class="cca-avatar">{{ student.portrait }}</span>
                  <span class="cca-roster-name">{{
                    student.name.split(' ')[0]
                  }}</span>
                </button>
              </div>
              <div class="cca-crew-count">
                TEAM ASSIGNED {{ teamFor(incident.id).length }} / 3
                <span>✦ Skill match changes outcomes</span>
              </div>
            </article>
            <button
              class="cca-primary"
              type="button"
              data-testid="academy-dispatch"
              :disabled="!run.assignments.length"
              @click="store.dispatch()"
            >
              RUN TRAINING SIMULATIONS <span>➜</span>
            </button>
          </template>

          <template v-else-if="run.phase === 'campus'">
            <div class="cca-heading">
              <span>03</span>
              <div>
                <h2>{{ campusEncounter.title }}</h2>
                <p>{{ campusEncounter.location }} · AFTER CLASS</p>
              </div>
            </div>
            <p class="cca-story">{{ campusEncounter.scene }}</p>
            <div class="cca-report-mini">
              <strong>AFTER-ACTION REPORT</strong
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
                <h2>After the bell</h2>
                <p>The simulation has ended. The consequences haven't.</p>
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
                run.day === 7
                  ? 'FACE THE PROM-NIGHT SIMULATION'
                  : 'ADVANCE TO NEXT DAY'
              }}
              <span>➜</span>
            </button>
          </template>

          <template v-else-if="run.phase === 'finale'">
            <div class="cca-heading">
              <span>05</span>
              <div>
                <h2>Prom-Night Simulation</h2>
                <p>The final rehearsal shows how prom could end very badly.</p>
              </div>
            </div>
            <p class="cca-story">
              Your first-week final is a simulated prom-night catastrophe. The
              real graduation is still weeks away. Your classmates are waiting
              for orders. You can protect them, or seize the machine behind the
              whole spectacle.
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
              <span>Save the classmates, even if the school expels you</span> ↗
            </button>
            <button
              type="button"
              class="cca-choice"
              @click="store.end('command')"
            >
              <span>Take the catastrophe engine for yourself</span> ↗
            </button>
          </template>

          <template v-else>
            <div class="cca-heading">
              <span>✦</span>
              <div>
                <h2>{{ run.ending }}</h2>
                <p>YOUR FIRST-WEEK YEARBOOK</p>
              </div>
            </div>
            <p class="cca-story">{{ run.scene }}</p>
            <div class="cca-report-mini">
              <strong>CHRONICLE</strong
              ><span v-for="(line, i) in run.log.slice(-10)" :key="i">{{
                line
              }}</span>
            </div>
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
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCometAcademyStore } from '~/stores/cometAcademyStore'
import {
  identityFor,
  identityStoryFor,
  type CharacterViewpoint,
  type CharacterAllegiance,
  type CharacterBond,
} from '~/utils/cometAcademy/identityArcs'
import { GUEST_IDENTITIES } from '~/utils/cometAcademy/guestIdentities'
import {
  STUDENTS,
  encounterFor,
  type StudentId,
} from '~/utils/cometAcademy/rules'
import {
  POWER_FORMS,
  POWER_AFFINITIES,
  POWER_VOWS,
  signatureFor,
  type PowerFormId,
  type PowerAffinityId,
  type PowerVowId,
} from '~/utils/cometAcademy/specialPowers'

const store = useCometAcademyStore()
const selectedForm = ref<PowerFormId>('impact')
const selectedElement = ref<PowerAffinityId>('fire')
const selectedVow = ref<PowerVowId>('shelter')
const viewpointOptions: CharacterViewpoint[] = ['protagonist', 'antagonist']
const alignmentOptions: CharacterAllegiance[] = ['hero', 'villain']
const bondOptions: CharacterBond[] = ['sidekick', 'partner', 'romance']
const selectedViewpoint = ref<CharacterViewpoint>('protagonist')
const selectedAllegiance = ref<CharacterAllegiance>('hero')
const selectedBonds = ref<CharacterBond[]>([])
const run = computed(() => store.run)
const currentSignature = computed(() =>
  signatureFor(selectedForm.value, selectedElement.value),
)
const currentIdentity = computed(() => identityFor(currentSignature.value.id))
const currentIdentityStory = computed(() =>
  identityStoryFor(
    currentIdentity.value,
    selectedViewpoint.value,
    selectedAllegiance.value,
    selectedBonds.value,
  ),
)
const activeVow = computed(() =>
  POWER_VOWS.find((vow) => vow.id === selectedVow.value)!,
)
const campusEncounter = computed(() =>
  run.value ? encounterFor(run.value) : encounterFor({ day: 1 } as never),
)
const panelLabel = computed(() =>
  run.value
    ? {
        dispatch: 'TRAINING // ASSIGNMENT BOARD',
        campus: 'CAMPUS // ENCOUNTER DRAW',
        debrief: 'RESULTS // DAY REPORT',
        finale: 'PROM // FINAL EXAM',
        ending: 'YEARBOOK // COMPLETED RUN',
      }[run.value.phase]
    : 'NEW STUDENT // POWER SELECTION',
)
const sceneTitle = computed(() =>
  run.value
    ? {
        dispatch: 'The Call To Action',
        campus: campusEncounter.value.title,
        debrief: 'What Comes After',
        finale: 'The Night of the Comet',
        ending: run.value.ending ?? 'Yearbook',
      }[run.value.phase]
    : '',
)
const stageCopy = computed(() =>
  run.value?.phase === 'campus'
    ? campusEncounter.value.scene
    : (run.value?.scene ?? ''),
)
onMounted(() => store.load())
useHead({ title: 'Capes & Tassels: Prom of Doom | Kind Robots' })

function toggleBond(bond: CharacterBond): void {
  selectedBonds.value = selectedBonds.value.includes(bond)
    ? selectedBonds.value.filter((current) => current !== bond)
    : [...selectedBonds.value, bond]
}

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
.cca-affinity-grid {
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
.cca-power-detail {
  padding: 0.8rem 0.25rem;
  min-height: 5.5rem;
}
.cca-power-detail strong {
  color: #ffd1a0;
}
.cca-power-detail p {
  font-size: 0.83rem;
  color: #e1e7f1;
  line-height: 1.5;
  margin: 0.3rem 0;
}
.cca-power-detail small {
  color: #a8b9c6;
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
.cca-identity-triad {
  display: grid;
  gap: 0.55rem;
}
.cca-identity-triad > div {
  border-left: 2px solid #e4ab83;
  padding-left: 0.6rem;
}
.cca-identity-triad small {
  display: block;
  color: #a3cbd6;
  font-size: 0.59rem;
  letter-spacing: 0.09em;
}
.cca-identity-triad strong {
  color: #ffe0b9;
  font-size: 0.88rem;
}
.cca-identity-triad p,
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
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.3rem;
  margin: 0.65rem 0;
}
.cca-roster-button {
  min-width: 0;
  border: 1px solid #9caec364;
  background: #34445e9c;
  color: #fff0e1;
  padding: 0.3rem 0.1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 0.15rem;
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
.cca-avatar {
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
