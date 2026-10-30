<template>
  <section
    class="prom-opening"
    :class="{ 'prom-calm': reducedMotion }"
    aria-label="Prom of Doom opening"
  >
    <div v-if="screen === 'title'" class="prom-cover">
      <img
        v-if="cover"
        :src="cover"
        alt="Comet City at dusk, awaiting its graduating superheroes"
        class="prom-cover-image"
      />
      <div class="prom-cover-copy">
        <p class="prom-series">
          CAPES &amp; TASSELS <span>· A COMET CITY STORY</span>
        </p>
        <p class="prom-kicker">30 DAYS TO GRADUATION. ONE VERY BAD PROM.</p>
        <h1>PROM <span>OF</span> DOOM</h1>
        <p class="prom-tagline">
          Secret identities. Public disasters. Love triangles with collateral
          damage. The last month of school is going to be murder on your social
          calendar.
        </p>
      </div>
      <div class="prom-cover-actions" aria-label="Main menu">
        <button
          type="button"
          class="prom-start"
          data-testid="academy-new-game"
          @click="beginNewGame"
        >
          <span aria-hidden="true">✦</span> NEW GAME
        </button>
        <button type="button" @click="screen = 'yearbook'">
          <span aria-hidden="true">▣</span> YEARBOOK
          <small v-if="historyCount">{{ historyCount }} EXPLORED</small>
        </button>
        <button type="button" data-testid="academy-opening-scrapbook" @click="screen = 'scrapbook'">SCRAPBOOK</button>
        <NuxtLink to="/admin/every-villain-tactics" class="prom-tactical-link" data-testid="academy-opening-tactical">⚔ TACTICAL MODE <small>SKIRMISH PREVIEW</small></NuxtLink>
        <button type="button" data-testid="academy-opening-settings" @click="screen = 'settings'">
          <span aria-hidden="true">⚙</span> SETTINGS
        </button>
        <button type="button" @click="openHelp">
          <span aria-hidden="true">?</span> TUTORIAL
        </button>
      </div>
    </div>

    <template v-else>
      <header class="prom-toolbar">
        <button type="button" aria-label="Previous screen" @click="back">
          ‹
        </button>
        <span>CAPES &amp; TASSELS <b>/ PROM OF DOOM</b></span>
        <small>{{ chapter }}</small>
      </header>
      <div
        v-if="screen === 'origin' || screen === 'affinity'"
        class="prom-choice-stage"
      >
        <div class="prom-showcase" :class="'prom-' + selectedOrigin">
          <img v-if="choiceArtwork" :src="choiceArtwork" alt="" />
          <div class="prom-showcase-copy">
            <span class="prom-issue"
              >ORIGIN STORY // {{ screen === 'origin' ? '01' : '02' }}</span
            >
            <div class="prom-emblem">
              <img :src="promArt((screen === 'origin' ? 'origins/' : 'affinities/') + (screen === 'origin' ? selectedOrigin : selectedAffinity)) ?? ''" alt="" />
            </div>
            <h2>
              {{
                screen === 'origin' ? activeOrigin.name : activeAffinity.name
              }}
            </h2>
            <p>
              {{
                screen === 'origin' ? activeOrigin.source : activeAffinity.theme
              }}
            </p>
            <strong>{{
              screen === 'origin'
                ? activeOrigin.complication
                : activeAffinity.risk
            }}</strong>
          </div>
        </div>
        <div class="prom-chooser">
          <p class="prom-eyebrow">
            {{
              screen === 'origin'
                ? '01 / WHERE IT CAME FROM'
                : '02 / WHAT IT ANSWERS TO'
            }}
          </p>
          <h2>
            {{
              screen === 'origin'
                ? 'Choose your origin'
                : 'Choose your affinity'
            }}
          </h2>
          <div
            class="prom-options"
            :class="{ 'prom-eight': screen === 'affinity' }"
          >
            <button
              v-for="option in screen === 'origin'
                ? POWER_ORIGINS
                : POWER_AFFINITIES"
              :key="option.id"
              type="button"
              :class="{
                active:
                  screen === 'origin'
                    ? selectedOrigin === option.id
                    : selectedAffinity === option.id,
              }"
              :aria-pressed="
                screen === 'origin'
                  ? selectedOrigin === option.id
                  : selectedAffinity === option.id
              "
              :data-testid="
                screen === 'origin'
                  ? 'academy-origin-option'
                  : 'academy-affinity-option'
              "
              @click="selectOption(option.id)"
            >
              <img class="prom-option-icon" :src="promArt((screen === 'origin' ? 'origins/' : 'affinities/') + option.id) ?? ''" alt="" loading="lazy" />
              <strong>{{ option.name }}</strong>
              <small>{{ 'source' in option ? option.source : option.theme }}</small>
            </button>
          </div>
          <button
            class="prom-next"
            type="button"
            :data-testid="
              screen === 'origin'
                ? 'academy-origin-next'
                : 'academy-affinity-next'
            "
            @click="screen = screen === 'origin' ? 'affinity' : 'dossier'"
          >
            {{
              screen === 'origin' ? 'CHOOSE MY AFFINITY' : 'REVEAL MY IDENTITY'
            }}
            <span>➜</span>
          </button>
        </div>
      </div>

      <div
        v-else-if="screen === 'dossier' || screen === 'yearbook-detail'"
        class="prom-card-room"
      >
        <div class="prom-trading-card">
          <div class="prom-card-art">
            <img v-if="personaArtwork" :src="personaArtwork" alt="" />
            <div v-else class="prom-card-placeholder" aria-hidden="true">
              <span>{{ activeOrigin.glyph }}</span
              ><span>{{ activeAffinity.glyph }}</span>
            </div>
            <span class="prom-card-corner"
              >C.C.A. TRADING CARDS · #{{ signatureNumber }}</span
            >
          </div>
          <div class="prom-card-body">
            <small
              >{{ selectedForm.toUpperCase() }} /
              {{ selectedPersona.focus.toUpperCase() }}</small
            >
            <h2>{{ selectedPersona.alias }}</h2>
            <p class="prom-legal">
              {{ identity.realName }} · {{ identity.pronouns }}
            </p>
            <p>{{ identity.backstory }}</p>
            <p class="prom-ability">
              <b>{{ currentSignature.name }}:</b> {{ currentSignature.action }}.
              Cost: {{ currentSignature.cost }}.
            </p>
            <p>{{ personaDescription }}</p>
            <div class="prom-stat-grid" aria-label="Character statistics">
              <div v-for="stat in STATS" :key="stat.id" class="prom-stat">
                <span>{{ stat.name }}</span>
                <span :aria-label="selectedPersona.stats[stat.id] + ' of 5'">
                  <i
                    v-for="n in 5"
                    :key="n"
                    :class="{ filled: n <= selectedPersona.stats[stat.id] }"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="prom-card-choices">
          <p class="prom-eyebrow">
            {{
              screen === 'yearbook-detail'
                ? 'YEARBOOK / COLLECTIBLE IDENTITY'
                : '03 / ONE HERO, THREE PATHS'
            }}
          </p>
          <h2>{{ identity.realName }}</h2>
          <p
            v-if="previous"
            class="prom-returning"
            data-testid="academy-returning-hero"
          >
            ★ RETURNING CHARACTER · {{ previous.plays }}
            {{ previous.plays === 1 ? 'PREVIOUS RUN' : 'PREVIOUS RUNS' }}
            <span v-if="previous.endings.length">
              · {{ previous.endings.length }} ENDINGS FOUND</span
            >
          </p>
          <p v-else>
            Your name stays yours. Your alliances, methods and reputation are
            still unwritten.
          </p>
          <div class="prom-form-choices" data-testid="academy-persona-triad">
            <button
              v-for="form in forms"
              :key="form"
              type="button"
              :class="{ active: selectedForm === form }"
              :disabled="form !== 'student' && !unlockedForms.includes(form)"
              :aria-pressed="selectedForm === form"
              @click="chooseForm(form)"
            >
              <span>{{
                form === 'student' ? 'STUDENT / SIDEKICK' : form.toUpperCase()
              }}</span>
              <strong>{{ identity[form].alias }}</strong>
              <small>{{
                form === 'student' || unlockedForms.includes(form)
                  ? 'PLAYABLE'
                  : 'UNLOCK THIS ROLE IN A CAMPAIGN'
              }}</small>
            </button>
          </div>
          <button
            type="button"
            class="prom-comic-preview"
            data-testid="academy-comic-intro-preview"
            @click="showComicIntro = true"
          >
            ✦ VIEW COMIC-BOOK REVEAL
          </button>
          <p class="prom-card-note">
            {{
              selectedForm === 'student'
                ? 'Begin with the mistakes, friendships and choices that define the future.'
                : 'New Game Plus: play the same character through a different role and story.'
            }}
          </p>
          <button
            class="prom-next"
            type="button"
            data-testid="academy-dossier-next"
            @click="screen = 'vow'"
          >
            {{
              screen === 'yearbook-detail'
                ? 'REPLAY THIS IDENTITY'
                : 'CHOOSE MY STORY'
            }}
            <span>➜</span>
          </button>
        </div>
      </div>

      <div v-else-if="screen === 'vow'" class="prom-route-room">
        <div class="prom-route-heading">
          <p class="prom-eyebrow">04 / THREE STORIES. ONE IMPOSSIBLE MONTH.</p>
          <h2>What will you do when nobody agrees?</h2>
          <p>
            Each promise draws you into a different series of adventures, allies
            and consequences. Your choice is an intention, not a permanent
            alignment lock.
          </p>
        </div>
        <div class="prom-routes">
          <button
            v-for="route in routes"
            :key="route.id"
            type="button"
            :class="{ active: selectedVow === route.id }"
            :aria-pressed="selectedVow === route.id"
            @click="selectedVow = route.id"
          >
            <img
              v-if="promArt('vows/' + route.id)"
              class="prom-route-art"
              :src="promArt('vows/' + route.id)!"
              alt=""
            />
            <span class="prom-route-number">{{ route.number }}</span>
            <h3>{{ route.title }}</h3>
            <strong>{{ route.headline }}</strong>
            <p>{{ route.hook }}</p>
            <small>{{ route.promise }}</small>
          </button>
        </div>
        <button
          class="prom-next"
          type="button"
          data-testid="academy-confirm"
          @click="confirmIdentity"
        >
          CONFIRM {{ selectedPersona.alias.toUpperCase() }} ·
          {{ activeVow.name.toUpperCase() }} <span>➜</span>
        </button>
      </div>

      <div v-else-if="screen === 'tutorial'" class="prom-info-room">
        <p class="prom-eyebrow">THE UNOFFICIAL COMET CITY SURVIVAL GUIDE</p>
        <h2>
          {{
            launchOnTutorial
              ? 'Your first day starts now.'
              : 'How to survive the last month.'
          }}
        </h2>
        <div class="prom-guide-grid">
          <article>
            <strong>DAYLIGHT</strong>
            <p>
              Explore the academy or town. Who you meet, help or alienate
              changes the next chapter.
            </p>
          </article>
          <article>
            <strong>AFTER DARK</strong>
            <p>
              Take patrol cases, choose heroic, rogue or villainous methods, and
              assign teams of one to three.
            </p>
          </article>
          <article>
            <strong>THE PRICE</strong>
            <p>
              Injuries, loyalty, alliances, evidence and public consequences
              follow you into prom night.
            </p>
          </article>
        </div>
        <div v-if="launchOnTutorial" class="prom-mode-choices" data-testid="academy-new-game-mode">
          <strong>HOW DO YOU WANT TO PLAY?</strong>
          <p>The same thirty-day story, relationships and consequences in every mode.</p>
          <label class="prom-setting">
            <span><b>Tactical missions</b><small>Command cover-based battles, or let choices decide the outcome through narrated scenes.</small></span>
            <input v-model="tacticalMissions" type="checkbox" :disabled="firstWeek" data-testid="academy-new-game-tactical-toggle" />
          </label>
          <label class="prom-setting">
            <span><b>Night patrol management</b><small>Assign crews and explore districts, or play story-first nighttime decisions instead.</small></span>
            <input v-model="nightPatrols" type="checkbox" :disabled="firstWeek" data-testid="academy-new-game-patrol-toggle" />
          </label>
          <small v-if="firstWeek">The legacy seven-day simulation keeps its original rules.</small>
        </div>
        <p class="prom-card-note">
          Thirty days. A different mastermind each run. Your decisions are saved
          automatically.
        </p>
        <button
          v-if="launchOnTutorial"
          class="prom-next"
          type="button"
          data-testid="academy-begin"
          @click="launch"
        >
          START {{ selectedPersona.alias.toUpperCase() }}'S CAMPAIGN
          <span>➜</span>
        </button>
        <button
          v-else
          class="prom-next"
          type="button"
          @click="screen = 'title'"
        >
          BACK TO TITLE <span>➜</span>
        </button>
      </div>

      <div
        v-else-if="screen === 'yearbook'"
        class="prom-info-room prom-yearbook"
      >
        <p class="prom-eyebrow">YEARBOOK / CLASSIFIED SCHOOL RECORDS</p>
        <h2>Faces you have been.</h2>
        <p v-if="!historyCount">
          No students explored yet. Every new game earns its own place in the
          yearbook.
        </p>
        <div v-else class="prom-yearbook-list">
          <button
            v-for="entry in explored"
            :key="entry.id"
            type="button"
            class="prom-yearbook-entry"
            data-testid="academy-yearbook-character"
            @click="openYearbookCard(entry.id)"
          >
            <span class="prom-yearbook-avatar" aria-hidden="true">★</span>
            <strong>{{ entry.name }}</strong>
            <span>{{ entry.plays }} RUNS · {{ entry.alias }}</span>
            <small>
              {{
                entry.forms.length
                  ? entry.forms.join(' / ').toUpperCase() + ' UNLOCKED'
                  : 'STUDENT DISCOVERED'
              }}
              · {{ entry.endings.length }} ENDINGS
            </small>
            <span class="prom-yearbook-open">OPEN CHARACTER CARD ›</span>
          </button>
        </div>
      </div>

      <div v-else-if="screen === 'scrapbook'" class="prom-info-room prom-yearbook" data-testid="academy-opening-scrapbook-screen">
        <p class="prom-eyebrow">SCRAPBOOK / RECOVERED STORIES</p>
        <h2>What the yearbook remembers.</h2>
        <p v-if="!historyCount">Your scrapbook is empty. Start a term to collect identities and endings.</p>
        <div v-else class="prom-yearbook-list">
          <article v-for="entry in explored" :key="entry.id" class="prom-yearbook-entry">
            <img v-if="promArt('identities/' + entry.id + '/student')" class="prom-scrapbook-art" :src="promArt('identities/' + entry.id + '/student')!" alt="" />
            <strong>{{ entry.name }}</strong>
            <small>{{ entry.plays }} TERMS · {{ entry.forms.join(', ') || 'STUDENT' }}</small>
            <p>{{ entry.endings.length ? entry.endings.join(' · ') : 'The ending is still unwritten.' }}</p>
          </article>
        </div>
        <p class="prom-card-note">During a term, the full Scrapbook tracks discoveries, relationships, secrets and places you've visited.</p>
      </div>
      <div v-else-if="screen === 'settings'" class="prom-info-room">
        <p class="prom-eyebrow">OPTIONS / BEFORE THE FIRST BELL</p>
        <h2>Make it yours.</h2>
        <label class="prom-setting">
          <span>Reduce opening animation</span>
          <input v-model="reducedMotion" type="checkbox" />
        </label>
        <label class="prom-setting">
          <span
            >Play the original seven-day simulation instead of the thirty-day
            campaign</span
          >
          <input
            v-model="firstWeek"
            type="checkbox"
            :disabled="selectedForm !== 'student'"
          />
        </label>
        <p class="prom-card-note">
          Your campaign is autosaved on this device. Returning characters and
          earned identities appear in the Yearbook.
        </p>
        <div class="prom-setting prom-save-import">
          <label for="prom-title-import"
            >Continue a term from a save code</label
          >
          <textarea
            id="prom-title-import"
            v-model="importCode"
            rows="3"
            placeholder="PROM1:…"
            data-testid="academy-title-import-save"
          />
          <button
            type="button"
            class="prom-next"
            :disabled="!importCode.trim()"
            data-testid="academy-title-load-save"
            @click="loadSaveCode"
          >
            LOAD SAVE <span>➜</span>
          </button>
          <span v-if="importError" class="prom-import-error" role="alert">{{
            importError
          }}</span>
        </div>
      </div>
    </template>
    <ComicCharacterReveal
      :open="showComicIntro"
      :intro="currentComicIntro"
      :art-src="comicArt"
      @dismiss="showComicIntro = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { comicIntroFor } from '~/utils/cometAcademy/comicIntroductions'
import { identityFor } from '~/utils/cometAcademy/identityArcs'
import { identityArtKey } from '~/utils/cometAcademy/artSlots'
import { promArt } from '~/utils/cometAcademy/artManifest'
import {
  POWER_AFFINITIES,
  POWER_ORIGINS,
  POWER_VOWS,
  STATS,
  signatureFor,
  type PowerAffinityId,
  type PowerOriginId,
  type PowerVowId,
  type SignaturePowerId,
} from '~/utils/cometAcademy/specialPowers'
import type { PlayerForm } from '~/utils/cometAcademy/protagonistEvolution'
import {
  useCometAcademyStore,
  type AcademyYearbook,
} from '~/stores/cometAcademyStore'

const props = defineProps<{ yearbook: AcademyYearbook }>()
const emit = defineEmits<{
  start: [
    selection: {
      signature: SignaturePowerId
      vow: PowerVowId
      form: PlayerForm
      firstWeek: boolean
      tacticalMissions: boolean
      nightPatrols: boolean
    },
  ]
}>()
type Screen =
  | 'title'
  | 'origin'
  | 'affinity'
  | 'dossier'
  | 'vow'
  | 'tutorial'
  | 'yearbook'
  | 'scrapbook'
  | 'yearbook-detail'
  | 'settings'
const screen = ref<Screen>('title')
const fromYearbook = ref(false)
const selectedOrigin = ref<PowerOriginId>('accident')
const selectedAffinity = ref<PowerAffinityId>('fire')
const selectedForm = ref<PlayerForm>('student')
const selectedVow = ref<PowerVowId>('shelter')
const launchOnTutorial = ref(false)
const reducedMotion = ref(false)
const firstWeek = ref(false)
const tacticalMissions = ref(true)
const nightPatrols = ref(true)
const forms: PlayerForm[] = ['student', 'hero', 'villain']
// A save code exported before NEW TERM (or on another device) can resume from
// the title; the page swaps to the console as soon as the run exists.
const store = useCometAcademyStore()
const importCode = ref('')
const importError = ref('')
watch(importCode, () => (importError.value = ''))
function loadSaveCode() {
  if (store.importSave(importCode.value)) importCode.value = ''
  else
    importError.value =
      'That code is not a valid Prom of Doom save. Nothing was changed.'
}
const showComicIntro = ref(false)
const seenComicIntro = new Set<string>()
const currentComicIntro = computed(() =>
  comicIntroFor(
    currentSignature.value.id,
    selectedForm.value === 'villain' ? 'villain' : 'hero',
  ),
)
const comicArt = computed(() =>
  currentComicIntro.value.artKey
    ? promArt(currentComicIntro.value.artKey)
    : null,
)
const cover =
  promArt('front/splash-v2') ??
  promArt('front/dashboard-highlight') ??
  promArt('front/splash')
const currentSignature = computed(() =>
  signatureFor(selectedOrigin.value, selectedAffinity.value),
)
// Declared after currentSignature: the getter runs during setup, and reading
// the computed before its declaration crashed the whole New Game screen.
watch(
  () => [screen.value, selectedForm.value, currentSignature.value.id],
  () => {
    if (screen.value !== 'dossier' && screen.value !== 'yearbook-detail') return
    const key = currentComicIntro.value.key
    if (!seenComicIntro.has(key)) {
      seenComicIntro.add(key)
      showComicIntro.value = true
    }
  },
)
const identity = computed(() => identityFor(currentSignature.value.id))
const activeOrigin = computed(() =>
  POWER_ORIGINS.find((option) => option.id === selectedOrigin.value)!,
)
const activeAffinity = computed(() =>
  POWER_AFFINITIES.find((option) => option.id === selectedAffinity.value)!,
)
const activeVow = computed(() =>
  POWER_VOWS.find((option) => option.id === selectedVow.value)!,
)
const previous = computed(() => props.yearbook[currentSignature.value.id])
const unlockedForms = computed(() => previous.value?.forms ?? [])
const selectedPersona = computed(() => identity.value[selectedForm.value])
const personaDescription = computed(() =>
  selectedForm.value === 'student'
    ? identity.value.student.conflict
    : selectedForm.value === 'hero'
      ? identity.value.hero.method
      : identity.value.villain.method,
)
const personaArtwork = computed(() =>
  promArt(identityArtKey(currentSignature.value.id, selectedForm.value)),
)
const choiceArtwork = computed(
  () =>
    promArt(
      screen.value === 'origin'
        ? 'origins/' + selectedOrigin.value
        : 'affinities/' + selectedAffinity.value,
    ) ??
    promArt('front/dashboard-highlight') ??
    cover,
)
const signatureNumber = computed(
  () =>
    POWER_ORIGINS.findIndex((x) => x.id === selectedOrigin.value) * 8 +
    POWER_AFFINITIES.findIndex((x) => x.id === selectedAffinity.value) +
    1,
)
const historyCount = computed(() => Object.keys(props.yearbook).length)
const explored = computed(() =>
  Object.entries(props.yearbook)
    .map(([id, entry]) => ({
      id,
      name: identityFor(id as SignaturePowerId).realName,
      alias: identityFor(id as SignaturePowerId).student.alias,
      ...entry,
    }))
    .sort((a, b) => b.plays - a.plays),
)
const chapter = computed(
  () =>
    ({
      origin: '01 / ORIGIN',
      affinity: '02 / AFFINITY',
      dossier: '03 / IDENTITY',
      vow: '04 / THE CHOICE',
      tutorial: '05 / TUTORIAL',
      yearbook: 'YEARBOOK',
      scrapbook: 'SCRAPBOOK',
      'yearbook-detail': 'YEARBOOK / CHARACTER CARD',
      settings: 'SETTINGS',
      title: 'WELCOME',
    })[screen.value],
)
const routes = [
  {
    id: 'shelter' as const,
    number: 'I',
    title: 'Shelter',
    headline: 'The people nobody came back for',
    hook: 'A missing school bus, an impossible rescue, and the friend whose name never appears on the casualty list.',
    promise: POWER_VOWS[0]!.promise,
  },
  {
    id: 'unmask' as const,
    number: 'II',
    title: 'Unmask',
    headline: 'The academy knows who did it',
    hook: 'A perfect student vanishes from the yearbook. The faculty says there never was one. You have the photograph.',
    promise: POWER_VOWS[1]!.promise,
  },
  {
    id: 'claim' as const,
    number: 'III',
    title: 'Claim',
    headline: 'Someone has to take the city',
    hook: 'An anonymous benefactor offers you control of the night patrol. Every favor comes with a name attached.',
    promise: POWER_VOWS[2]!.promise,
  },
]
function beginNewGame() {
  fromYearbook.value = false
  screen.value = 'origin'
}
function openYearbookCard(id: string) {
  const [origin, affinity] = id.split('-')
  if (
    !POWER_ORIGINS.some((entry) => entry.id === origin) ||
    !POWER_AFFINITIES.some((entry) => entry.id === affinity)
  )
    return
  selectedOrigin.value = origin as PowerOriginId
  selectedAffinity.value = affinity as PowerAffinityId
  selectedForm.value = 'student'
  fromYearbook.value = true
  screen.value = 'yearbook-detail'
}
function chooseForm(form: PlayerForm) {
  selectedForm.value = form
  if (form !== 'student') firstWeek.value = false
}
function selectOption(id: string) {
  if (screen.value === 'origin') selectedOrigin.value = id as PowerOriginId
  if (screen.value === 'affinity')
    selectedAffinity.value = id as PowerAffinityId
  selectedForm.value = 'student'
}
function openHelp() {
  launchOnTutorial.value = false
  screen.value = 'tutorial'
}
function confirmIdentity() {
  launchOnTutorial.value = true
  screen.value = 'tutorial'
}
function back() {
  const previousScreen: Partial<Record<Screen, Screen>> = {
    origin: 'title',
    affinity: 'origin',
    dossier: 'affinity',
    vow: fromYearbook.value ? 'yearbook-detail' : 'dossier',
    tutorial: launchOnTutorial.value ? 'vow' : 'title',
    yearbook: 'title',
    scrapbook: 'title',
    'yearbook-detail': 'yearbook',
    settings: 'title',
  }
  screen.value = previousScreen[screen.value] ?? 'title'
}
function launch() {
  emit('start', {
    signature: currentSignature.value.id,
    vow: selectedVow.value,
    form: selectedForm.value,
    firstWeek: firstWeek.value,
    tacticalMissions: firstWeek.value || tacticalMissions.value,
    nightPatrols: firstWeek.value || nightPatrols.value,
  })
}
</script>

<style scoped>
.prom-comic-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 9px 0;
  padding: 8px 14px;
  border: 2px solid #ffe0a2;
  background: #5b294b;
  color: #ffecc6;
  font-weight: 900;
  letter-spacing: 0.04em;
  border-radius: 5px;
}
.prom-opening {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  color: #fff4e9;
  background: #11142b;
  font-family: system-ui, sans-serif;
}
.prom-opening button {
  cursor: pointer;
  color: inherit;
}
.prom-opening button:focus-visible {
  outline: 3px solid #ffe49e;
  outline-offset: 2px;
}
.prom-opening button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}
.prom-cover {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: radial-gradient(
    circle at 70% 10%,
    #e97095 0,
    #34335b 54%,
    #14132b 100%
  );
}
.prom-cover-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 37%;
  filter: saturate(1.55) contrast(1.08);
}
.prom-cover:after {
  position: absolute;
  inset: 0;
  content: '';
  pointer-events: none;
  background:
    linear-gradient(
      0deg,
      #0e1024 0,
      #0e1024df 21%,
      #18143035 58%,
      #2b0d4f44 100%
    ),
    linear-gradient(110deg, #141026bb, transparent 74%);
}
.prom-cover-copy {
  position: relative;
  z-index: 1;
  padding: clamp(1rem, 3vw, 2.5rem);
  max-width: 780px;
  text-shadow: 0 3px 12px #0c1026;
}
.prom-series {
  font-weight: 900;
  letter-spacing: 0.23em;
  color: #ffd6b3;
  font-size: clamp(0.6rem, 1vw, 0.8rem);
}
.prom-series span {
  color: #e2ecfb;
}
.prom-kicker {
  margin-top: 0.9rem;
  font-weight: 800;
  color: #ffd69f;
  letter-spacing: 0.13em;
  font-size: clamp(0.7rem, 1vw, 0.92rem);
}
.prom-cover h1 {
  font-family: Georgia, serif;
  font-weight: 900;
  letter-spacing: -0.065em;
  line-height: 0.84;
  font-size: clamp(3.7rem, 9vw, 9rem);
  margin: 0.5rem 0 0.8rem;
}
.prom-cover h1 span {
  color: #ffae9f;
  font-size: 0.55em;
  font-style: italic;
}
.prom-tagline {
  max-width: 58ch;
  font-size: clamp(0.85rem, 1.3vw, 1.14rem);
}
.prom-cover-actions {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 2fr repeat(5, 1fr);
  gap: 0.5rem;
  padding: 0.7rem clamp(1rem, 3vw, 2.5rem) 1rem;
  background: #111527e6;
  border-top: 1px solid #fac5a766;
}
.prom-cover-actions button {
  padding: 0.9rem 0.4rem;
  background: #3d3554;
  border: 1px solid #bd8b9e77;
  border-radius: 0.55rem;
  font-weight: 900;
  font-size: clamp(0.7rem, 1vw, 0.93rem);
  white-space: nowrap;
}
.prom-cover-actions button span {
  display: inline-block;
  font-size: 1.2em;
  margin-right: 0.35rem;
  color: #ffd0a0;
}
.prom-cover-actions .prom-start,
.prom-next {
  background: linear-gradient(100deg, #f8b66c, #ed8798);
  color: #1d1b33;
  border: none;
}
.prom-cover-actions small {
  display: block;
  font-size: 0.57rem;
  margin-top: 0.25rem;
}
.prom-cover-actions .prom-tactical-link {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0.75rem 0.3rem;
  background: #39395c;
  color: #fff2e4;
  border: 1px solid #bd8b9e77;
  border-radius: 0.55rem;
  text-align: center;
  text-decoration: none;
  font-weight: 900;
  font-size: 0.8rem;
}
.prom-cover-actions .prom-tactical-link small { font-size: 0.55rem; }
.prom-mode-choices {
  display: grid;
  gap: 0.55rem;
  margin: 0.8rem 0;
  padding: 0.9rem;
  background: #251f3c;
  border: 1px solid #d6a58b;
  border-radius: 0.7rem;
}
.prom-mode-choices .prom-setting { margin: 0; }
.prom-mode-choices small { display: block; opacity: 0.85; }
.prom-option-icon { width: 3.1rem; height: 3.1rem; object-fit: cover; border: 1px solid #dcb7a2; border-radius: 0.45rem; }
.prom-scrapbook-art { width: 5rem; height: 5rem; border-radius: 0.5rem; object-fit: cover; }
.prom-emblem img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.prom-toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 0 0 auto;
  min-height: 2.9rem;
  padding: 0.3rem 1rem;
  background: #0d1023;
  border-bottom: 1px solid #c6a0bb62;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  font-weight: 800;
}
.prom-toolbar button {
  border: 1px solid #b8b2d377;
  border-radius: 0.3rem;
  padding: 0.1rem 0.65rem;
  font-size: 1.4rem;
}
.prom-toolbar b {
  color: #ffbd9c;
}
.prom-toolbar small {
  margin-left: auto;
  color: #f9d5a7;
}
.prom-choice-stage {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
.prom-showcase {
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: radial-gradient(circle at 54% 38%, #ea8c81, #6c4671 50%, #1b203a);
}
.prom-showcase.prom-tech {
  background: radial-gradient(circle at 54% 38%, #69ceca, #2d617c 50%, #152439);
}
.prom-showcase.prom-alien {
  background: radial-gradient(circle at 54% 38%, #b6ea97, #6d568c 50%, #162039);
}
.prom-showcase.prom-psychic {
  background: radial-gradient(circle at 54% 38%, #dc97ed, #4f3c85 50%, #171b35);
}
.prom-showcase img {
  height: 100%;
  width: 100%;
  object-fit: cover;
  opacity: 0.6;
  filter: saturate(1.4) contrast(1.1);
}
.prom-showcase:after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, #10142d 0%, #11142a55 60%, transparent);
}
.prom-showcase-copy {
  position: absolute;
  z-index: 1;
  left: 7%;
  right: 7%;
  bottom: 7%;
  text-shadow: 0 2px 12px #111228;
}
.prom-showcase-copy h2 {
  font:
    900 clamp(2.3rem, 4.8vw, 5rem)/0.99 Georgia,
    serif;
  margin: 0.35rem 0;
}
.prom-showcase-copy p {
  font-size: 1rem;
  margin-bottom: 0.4rem;
}
.prom-showcase-copy strong {
  color: #ffccaa;
  font-size: 0.8rem;
  font-weight: 600;
}
.prom-emblem {
  display: inline-grid;
  place-items: center;
  width: clamp(5rem, 10vw, 8rem);
  height: clamp(5rem, 10vw, 8rem);
  background: #111429b8;
  border: 3px solid #fac79c;
  border-radius: 50%;
  font-size: clamp(2.7rem, 5vw, 4rem);
}
.prom-issue,
.prom-eyebrow {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  color: #ffc995;
}
.prom-chooser {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  padding: clamp(0.9rem, 2vw, 2rem);
}
.prom-chooser h2,
.prom-card-choices h2,
.prom-route-heading h2,
.prom-info-room h2 {
  font:
    800 clamp(1.5rem, 3vw, 2.5rem)/1.1 Georgia,
    serif;
  margin: 0.55rem 0;
}
.prom-explainer {
  font-size: 0.85rem;
  color: #ccd7e6;
  margin-bottom: 0.8rem;
}
.prom-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}
.prom-options button {
  min-height: 5.1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.3rem;
  background: #ffffff12;
  border: 1px solid #a5b9c28a;
  border-radius: 0.55rem;
  padding: 0.4rem;
  font-size: 0.81rem;
  text-align: center;
}
.prom-options button span {
  font-size: 1.65rem;
}
.prom-options button.active,
.prom-form-choices button.active,
.prom-routes button.active {
  border: 2px solid #ffcc97;
  background: linear-gradient(130deg, #6d4565aa, #38536a99);
}
.prom-next {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.95rem 1.2rem;
  margin-top: auto;
  border-radius: 0.55rem;
  font-size: 0.83rem;
  font-weight: 900;
  letter-spacing: 0.035em;
  color: #1b1734 !important;
}
.prom-next span {
  font-size: 1.3rem;
}
.prom-card-room {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 0.8rem;
  padding: 0.8rem;
  overflow: hidden;
}
.prom-trading-card {
  min-height: 0;
  display: grid;
  grid-template-columns: 44% 56%;
  overflow: hidden;
  border: 3px solid #d9a469;
  border-radius: 1rem;
  background: linear-gradient(145deg, #563251, #262641 48%, #16263b);
  box-shadow: inset 0 0 0 3px #2e243b;
}
.prom-card-art {
  position: relative;
  background: radial-gradient(circle at 45% 38%, #9c618d, #202b48 75%);
  min-height: 0;
}
.prom-card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.prom-card-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: clamp(3.4rem, 8vw, 6rem);
}
.prom-card-corner {
  position: absolute;
  bottom: 0.7rem;
  left: 0.4rem;
  background: #121424ce;
  padding: 0.25rem;
  font-size: 0.54rem;
  letter-spacing: 0.1em;
}
.prom-card-body {
  min-width: 0;
  padding: clamp(0.6rem, 1.5vw, 1.3rem);
  overflow: auto;
  font-size: 0.81rem;
  line-height: 1.45;
}
.prom-card-body small {
  font-weight: 900;
  letter-spacing: 0.1em;
  color: #fbc892;
}
.prom-card-body h2 {
  font:
    900 clamp(1.75rem, 3.5vw, 3.1rem)/0.98 Georgia,
    serif;
  margin: 0.4rem 0;
}
.prom-card-body p {
  margin: 0.55rem 0;
}
.prom-card-body .prom-legal {
  color: #c9dce7;
}
.prom-ability {
  background: #14273f;
  padding: 0.65rem;
  border-left: 3px solid #f0b686;
}
.prom-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.45rem;
  margin-top: 0.85rem;
}
.prom-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.67rem;
}
.prom-stat > span:last-child {
  display: flex;
  gap: 0.16rem;
}
.prom-stat i {
  display: block;
  width: 16%;
  height: 0.42rem;
  border-radius: 0.2rem;
  background: #ffffff24;
}
.prom-stat i.filled {
  background: #94dedc;
}
.prom-card-choices {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: auto;
  padding: 1rem;
}
.prom-card-choices > p {
  font-size: 0.8rem;
}
.prom-returning {
  border: 1px solid #f1c77d;
  background: #8e5e3b55;
  padding: 0.65rem;
  color: #ffe0a5;
  font-weight: 700;
}
.prom-form-choices {
  display: grid;
  gap: 0.55rem;
  margin: 0.8rem 0;
}
.prom-form-choices button {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.6rem;
  border: 1px solid #a8b7cc67;
  border-radius: 0.55rem;
  background: #ffffff0f;
}
.prom-form-choices button span {
  font-size: 0.59rem;
  color: #ffd1a7;
  letter-spacing: 0.12em;
}
.prom-form-choices button strong {
  font-size: 1rem;
}
.prom-form-choices button small {
  font-size: 0.57rem;
}
.prom-card-note {
  font-size: 0.8rem;
  color: #cad4e5;
  line-height: 1.4;
  padding: 0.6rem 0;
}
.prom-route-room {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: clamp(0.8rem, 2vw, 2rem);
  gap: 1rem;
}
.prom-route-heading p:last-child {
  color: #cbd6e4;
  max-width: 70ch;
  font-size: 0.86rem;
}
.prom-routes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  min-height: 0;
  flex: 1;
}
.prom-routes button {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: clamp(0.7rem, 1.4vw, 1.3rem);
  overflow: auto;
  min-height: 0;
  background: #ffffff0e;
  border: 1px solid #94b7ca6d;
  border-radius: 0.75rem;
}
.prom-route-art {
  width: 100%;
  aspect-ratio: 16 / 9;
  flex: none;
  object-fit: cover;
  border-radius: 0.5rem;
}
.prom-route-number {
  color: #f8b57d;
  font:
    800 2rem Georgia,
    serif;
}
.prom-routes h3 {
  font:
    800 clamp(1.5rem, 2.5vw, 2.5rem) Georgia,
    serif;
}
.prom-routes strong {
  color: #ffd2a1;
}
.prom-routes p,
.prom-routes small {
  font-size: 0.8rem;
}
.prom-routes small {
  color: #aebdd0;
}
.prom-info-room {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: clamp(1rem, 4vw, 3rem);
}
.prom-guide-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin: 2rem 0 1rem;
}
.prom-guide-grid article,
.prom-yearbook-entry {
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
  text-align: left;
  border: 1px solid #e4b58e74;
  border-radius: 0.7rem;
  padding: 1rem;
  background: linear-gradient(145deg, #543455, #282d4c);
}
.prom-yearbook-entry:hover,
.prom-yearbook-entry:focus-visible {
  border-color: #ffcf9b;
  background: #543d62;
}
.prom-yearbook-avatar {
  font-size: 1.7rem;
  color: #ffbb94;
}
.prom-yearbook-open {
  color: #ffd3a4;
  letter-spacing: 0.1em;
  font-weight: 900;
  font-size: 0.65rem;
}
.prom-yearbook-list article {
  padding: 1rem;
  border: 1px solid #e4b58e74;
  background: #33304b;
  border-radius: 0.7rem;
}
.prom-guide-grid strong {
  color: #ffd1a0;
}
.prom-guide-grid p {
  font-size: 0.85rem;
  margin-top: 0.7rem;
}
.prom-yearbook-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.65rem;
  margin-top: 1rem;
}
.prom-yearbook-list article {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.prom-yearbook-list article span,
.prom-yearbook-list article small {
  color: #ffd1a0;
  font-size: 0.64rem;
}
.prom-yearbook-list article p {
  font-size: 0.75rem;
}
.prom-setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  max-width: 570px;
  margin: 1rem 0;
  border: 1px solid #a8b9c67a;
  border-radius: 0.6rem;
  padding: 1rem;
}
.prom-save-import {
  flex-direction: column;
  align-items: stretch;
}
.prom-save-import textarea {
  width: 100%;
  min-height: 4.5rem;
  border: 1px solid #a8b9c67a;
  border-radius: 0.4rem;
  background: #0e1424;
  color: #f4e8da;
  padding: 0.5rem;
  font:
    0.75rem ui-monospace,
    monospace;
  resize: vertical;
}
.prom-save-import .prom-next:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.prom-import-error {
  color: #ffac9e;
  font-size: 0.8rem;
}
.prom-setting input {
  width: 1.25rem;
  height: 1.25rem;
  accent-color: #f2b78b;
}
.prom-calm * {
  animation: none !important;
  transition: none !important;
}
@media (max-width: 850px) {
  .prom-choice-stage {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(30%, 43%) minmax(0, 1fr);
  }
  .prom-showcase-copy h2 {
    font-size: 2rem;
  }
  .prom-showcase-copy p,
  .prom-showcase-copy strong {
    font-size: 0.7rem;
  }
  .prom-emblem {
    width: 3rem;
    height: 3rem;
    font-size: 1.5rem;
  }
  .prom-chooser {
    padding: 0.65rem;
  }
  .prom-chooser h2 {
    font-size: 1.4rem;
  }
  .prom-options {
    grid-template-columns: repeat(3, 1fr);
  }
  .prom-options button {
    min-height: 3.8rem;
  }
  .prom-options button span {
    font-size: 1.25rem;
  }
  .prom-card-room {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 55%) minmax(0, 45%);
  }
  .prom-trading-card {
    grid-template-columns: 38% 62%;
  }
  .prom-card-body {
    font-size: 0.7rem;
  }
  .prom-card-body h2 {
    font-size: 1.6rem;
  }
  .prom-card-choices {
    padding: 0.3rem;
  }
  .prom-card-choices h2 {
    font-size: 1.4rem;
  }
  .prom-form-choices {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.3rem;
  }
  .prom-form-choices button {
    padding: 0.35rem;
    font-size: 0.7rem;
  }
  .prom-form-choices button strong {
    font-size: 0.8rem;
  }
  .prom-form-choices button small {
    font-size: 0.52rem;
  }
  .prom-routes {
    gap: 0.35rem;
  }
  .prom-routes button {
    padding: 0.5rem;
  }
  .prom-routes p,
  .prom-routes small {
    font-size: 0.68rem;
  }
  .prom-route-number {
    font-size: 1.3rem;
  }
  .prom-routes h3 {
    font-size: 1.1rem;
  }
  .prom-guide-grid {
    grid-template-columns: 1fr;
    margin: 0.7rem 0;
  }
}
@media (max-width: 450px) {
  .prom-cover h1 {
    font-size: clamp(3rem, 14vw, 4.8rem);
  }
  .prom-cover-actions {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.25rem;
    padding: 0.5rem 0.3rem;
  }
  .prom-cover-actions button {
    font-size: 0.58rem;
    padding: 0.65rem 0.15rem;
  }
  .prom-cover-actions button span {
    display: block;
    margin: 0;
    font-size: 1.3rem;
  }
  .prom-cover-actions button small {
    display: none;
  }
  .prom-toolbar {
    padding: 0.3rem 0.5rem;
    font-size: 0.58rem;
  }
  .prom-toolbar b {
    display: none;
  }
  .prom-chooser h2 {
    font-size: 1.2rem;
  }
  .prom-options button {
    font-size: 0.64rem;
    min-height: 3.2rem;
  }
  .prom-showcase-copy {
    bottom: 5%;
  }
  .prom-card-room {
    gap: 0.35rem;
    padding: 0.35rem;
    grid-template-rows: minmax(0, 52%) minmax(0, 48%);
  }
  .prom-card-body {
    padding: 0.45rem;
    font-size: 0.64rem;
  }
  .prom-card-body h2 {
    font-size: 1.3rem;
  }
  .prom-stat-grid {
    gap: 0.25rem;
  }
  .prom-route-room {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  .prom-route-heading h2 {
    font-size: 1.15rem;
  }
  .prom-route-heading p:last-child {
    font-size: 0.7rem;
  }
  .prom-routes {
    grid-template-columns: 1fr;
    overflow: auto;
  }
  .prom-routes button {
    min-height: 8.5rem;
  }
  .prom-next {
    font-size: 0.74rem;
    padding: 0.7rem;
  }
}
</style>
