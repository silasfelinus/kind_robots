<template>
  <section
    ref="root"
    class="evf"
    :class="'evf-on-' + store.screen"
    role="dialog"
    aria-modal="true"
    aria-labelledby="evf-heading"
    data-testid="tactics-front-menu"
  >
    <img
      v-if="backdrop"
      class="evf-backdrop"
      :src="backdrop"
      alt=""
      aria-hidden="true"
    />
    <div class="evf-shade" aria-hidden="true" />

    <div v-if="store.screen === 'title'" class="evf-title">
      <div class="evf-logo">
        <span class="evf-kicker"
          >CAPES &amp; TASSELS · PROM OF DOOM: CROSSFIRE</span
        >
        <h1 id="evf-heading" class="evf-wordmark">
          EVERY <em>VILLAIN</em> TACTICS
        </h1>
        <p class="evf-tagline">
          Everyone is the villain in somebody else’s story.
        </p>
      </div>
      <nav class="evf-menu" aria-label="Main menu" data-roving="vertical">
        <button
          type="button"
          class="evf-item is-primary"
          data-testid="front-new-story"
          @click="store.openScreen('story')"
        >
          <span class="evf-item-label">New Story</span>
          <small>Mission 01 · First Bell · Hero or Villain</small>
        </button>
        <button
          type="button"
          class="evf-item"
          data-testid="front-continue"
          :disabled="!store.latestSummary"
          @click="store.continueLatest()"
        >
          <span class="evf-item-label">Continue</span>
          <small>{{ continueLine }}</small>
        </button>
        <button
          type="button"
          class="evf-item"
          data-testid="front-one-shot"
          @click="store.openScreen('oneshot')"
        >
          <span class="evf-item-label">One-Shot</span>
          <small
            >Picnic Panic and {{ oneShots.length - 1 }} stage battles</small
          >
        </button>
        <button
          type="button"
          class="evf-item"
          data-testid="front-settings"
          @click="store.openScreen('settings')"
        >
          <span class="evf-item-label">Settings</span>
          <small>{{ settingsLine }}</small>
        </button>
        <button
          type="button"
          class="evf-item"
          data-testid="front-scrapbook"
          @click="store.openScreen('scrapbook')"
        >
          <span class="evf-item-label">Scrapbook</span>
          <small
            >{{ unlockedCount }} of {{ store.scrapbookView.length }} moments
            witnessed</small
          >
        </button>
        <button
          type="button"
          class="evf-item is-quiet"
          data-testid="front-console"
          @click="store.openScreen(null)"
        >
          <span class="evf-item-label">Tactics console</span>
          <small>Current battle, level studio and dossiers</small>
        </button>
      </nav>
      <p v-if="store.saveMessage" class="evf-status" role="status">
        {{ store.saveMessage }}
      </p>
      <p class="evf-foot">Internal admin preview · not a public release</p>
    </div>

    <div v-else class="evf-panel">
      <header class="evf-panel-head">
        <button
          type="button"
          class="evf-back"
          data-testid="front-back"
          @click="store.openScreen('title')"
        >
          ◂ <span>Menu</span>
        </button>
        <div>
          <span class="evf-kicker">{{ panelKicker }}</span>
          <h2 id="evf-heading">{{ panelTitle }}</h2>
        </div>
      </header>

      <div
        v-if="store.screen === 'story' || store.screen === 'oneshot'"
        class="evf-body kr-scroll evf-setup"
      >
        <p class="evf-lede">
          Build your power, reveal your fighter, choose Hero or Villain. Your
          scripted rival and support squad join the mission automatically.
        </p>
        <div class="evf-identity-steps">
          <section aria-labelledby="evf-origin-title">
            <h3 id="evf-origin-title" class="evf-label">
              01 / Your power origin
            </h3>
            <div
              class="evf-power-grid"
              role="radiogroup"
              aria-label="Power origin"
              data-roving="horizontal"
            >
              <button
                v-for="option in POWER_ORIGINS"
                :key="option.id"
                type="button"
                class="evf-power-option"
                role="radio"
                :aria-checked="selectedOrigin === option.id"
                :data-testid="'front-origin-' + option.id"
                @click="selectedOrigin = option.id"
              >
                <img
                  v-if="art('origins/' + option.id)"
                  :src="art('origins/' + option.id)!"
                  alt=""
                  loading="lazy"
                />
                <span v-else aria-hidden="true">{{ option.glyph }}</span>
                <strong>{{ option.name }}</strong>
              </button>
            </div>
          </section>
          <section aria-labelledby="evf-affinity-title">
            <h3 id="evf-affinity-title" class="evf-label">
              02 / Your affinity
            </h3>
            <div
              class="evf-power-grid"
              role="radiogroup"
              aria-label="Power affinity"
              data-roving="horizontal"
            >
              <button
                v-for="option in POWER_AFFINITIES"
                :key="option.id"
                type="button"
                class="evf-power-option"
                role="radio"
                :aria-checked="selectedAffinity === option.id"
                :data-testid="'front-affinity-' + option.id"
                @click="selectedAffinity = option.id"
              >
                <img
                  v-if="art('affinities/' + option.id)"
                  :src="art('affinities/' + option.id)!"
                  alt=""
                  loading="lazy"
                />
                <span v-else aria-hidden="true">{{ option.glyph }}</span>
                <strong>{{ option.name }}</strong>
              </button>
            </div>
          </section>
        </div>
        <section
          class="evf-identity-reveal"
          data-testid="front-character-reveal"
          aria-live="polite"
        >
          <div class="evf-reveal-art">
            <img
              v-if="revealArtwork"
              :src="revealArtwork"
              :alt="leadAlias + ' comic portrait'"
            />
            <span v-else class="evf-art-fallback" aria-hidden="true">✷</span>
          </div>
          <div class="evf-reveal-copy">
            <span class="evf-kicker">YOUR FIGHTER / ISSUE 01</span>
            <h3>{{ leadAlias }}</h3>
            <p>{{ selectedIdentity?.realName }} · {{ signaturePower.name }}</p>
            <p class="evf-reveal-power">{{ signaturePower.action }}</p>
            <small data-testid="front-lead-note">{{ leadNote }}</small>
            <small
              >Support and foil are assigned with the mission, not chosen in
              advance.</small
            >
          </div>
        </section>
        <h3 class="evf-label">03 / Your story</h3>
        <div
          class="evf-views"
          role="radiogroup"
          aria-label="Story viewpoint"
          data-roving="horizontal"
        >
          <button
            v-for="view in views"
            :key="view.id"
            type="button"
            role="radio"
            class="evf-view"
            :aria-checked="pickedView === view.id"
            :data-testid="'front-view-' + view.id"
            @click="pickedView = view.id"
          >
            <img v-if="view.art" :src="view.art" alt="" loading="lazy" />
            <span v-else class="evf-art-fallback" aria-hidden="true">✦</span>
            <span class="evf-view-text">
              <strong>{{ view.label }}</strong>
              <small>{{ view.headline }}</small>
            </span>
          </button>
        </div>
        <p class="evf-foil-note" data-testid="front-foil-note">
          First Bell foil: {{ foilAlias }} · supporting cast joins
          automatically.
        </p>
        <template v-if="store.screen === 'oneshot'">
          <h3 class="evf-label">04 / Pick a battlefield</h3>
          <div class="evf-stages">
            <button
              v-for="stage in oneShots"
              :key="stage.id"
              type="button"
              class="evf-stage"
              :data-testid="'front-oneshot-' + stage.id"
              @click="store.startOneShot(stage.id, pickedLead, pickedView)"
            >
              <img
                v-if="art(stage.art)"
                :src="art(stage.art)!"
                alt=""
                loading="lazy"
              />
              <span v-else class="evf-art-fallback" aria-hidden="true">✦</span>
              <span class="evf-stage-text">
                <small class="evf-kicker">{{ stage.tag }}</small>
                <strong>{{ stage.title }}</strong>
                <span>{{ stage.objective }}</span>
              </span>
            </button>
          </div>
        </template>
      </div>

      <div
        v-else-if="store.screen === 'settings'"
        class="evf-body kr-scroll evf-settings"
      >
        <fieldset class="evf-field">
          <legend class="evf-label">Animation speed</legend>
          <div
            class="evf-segments"
            role="radiogroup"
            aria-label="Animation speed"
            data-roving="horizontal"
          >
            <button
              v-for="speed in ANIMATION_SPEEDS"
              :key="speed.id"
              type="button"
              role="radio"
              :aria-checked="store.settings.animation === speed.id"
              :data-testid="'front-anim-' + speed.id"
              @click="store.updateSettings({ animation: speed.id })"
            >
              {{ speed.label }}
            </button>
          </div>
          <small
            >Card strikes, hits and dodges. Your system’s reduced-motion setting
            always wins.</small
          >
        </fieldset>
        <label class="evf-toggle">
          <input
            type="checkbox"
            data-testid="front-confirm-end-turn"
            :checked="store.settings.confirmEndTurn"
            @change="
              store.updateSettings({
                confirmEndTurn: ($event.target as HTMLInputElement).checked,
              })
            "
          />
          <span>
            <strong>Confirm before ending the turn</strong>
            <small>End Turn asks for a second press.</small>
          </span>
        </label>
        <label class="evf-toggle">
          <input
            type="checkbox"
            data-testid="front-threat-preview"
            :checked="store.settings.threatPreview"
            @change="
              store.updateSettings({
                threatPreview: ($event.target as HTMLInputElement).checked,
              })
            "
          />
          <span>
            <strong>Show threat preview</strong>
            <small
              >Marks reachable tiles that rival shooters can see, with their
              exact odds.</small
            >
          </span>
        </label>
        <div class="evf-danger">
          <template v-if="confirming === 'defaults'">
            <p role="alert">Restore the default settings?</p>
            <button
              type="button"
              data-testid="front-confirm-yes"
              @click="confirmReset"
            >
              Yes, restore
            </button>
            <button
              type="button"
              data-testid="front-confirm-cancel"
              @click="confirming = null"
            >
              Cancel
            </button>
          </template>
          <template v-else-if="confirming === 'erase'">
            <p role="alert">
              Erase all four save slots and every scrapbook page? This cannot be
              undone.
            </p>
            <button
              type="button"
              class="is-danger"
              data-testid="front-confirm-yes"
              @click="confirmReset"
            >
              Yes, erase everything
            </button>
            <button
              type="button"
              data-testid="front-confirm-cancel"
              @click="confirming = null"
            >
              Cancel
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              data-testid="front-reset-settings"
              @click="confirming = 'defaults'"
            >
              Restore default settings
            </button>
            <button
              type="button"
              class="is-danger"
              data-testid="front-erase-progress"
              @click="confirming = 'erase'"
            >
              Erase saves and scrapbook
            </button>
          </template>
        </div>
      </div>

      <div v-else-if="store.screen === 'scrapbook'" class="evf-body kr-scroll">
        <p class="evf-lede">
          Pages and scores are earned from completed, verified battle saves.
          Repeat saves of the same outcome cannot earn the result twice.
        </p>
        <div
          v-if="store.battleResults.length"
          class="evf-pages"
          data-testid="front-score-results"
        >
          <article
            v-for="result in store.battleResults.slice(0, 6)"
            :key="result.id"
            class="evf-page"
          >
            <div class="evf-page-text">
              <small class="evf-kicker">
                {{ result.mode === 'story' ? 'STORY' : 'ONE-SHOT' }} ·
                {{ result.outcome.toUpperCase() }}
              </small>
              <strong>{{ result.stage }} · {{ result.total }} points</strong>
              <span
                >{{ result.turns }} rounds · {{ result.medals.length }} earned
                medals</span
              >
              <small>
                {{
                  result.lines
                    .filter((line) => line.points > 0)
                    .map((line) => line.label + ' +' + line.points)
                    .join(' · ')
                }}
              </small>
            </div>
          </article>
        </div>
        <div class="evf-pages" data-testid="front-scrapbook-pages">
          <article
            v-for="page in store.scrapbookView"
            :key="page.id"
            class="evf-page"
            :class="{ 'is-locked': !page.record }"
            :data-testid="'scrapbook-' + page.id"
            tabindex="0"
            :aria-label="
              page.record
                ? page.chapter + ': ' + page.title
                : page.chapter + ': moment not yet witnessed'
            "
          >
            <img
              v-if="page.record && art(page.art)"
              :src="art(page.art)!"
              alt=""
              loading="lazy"
            />
            <span v-else class="evf-art-fallback" aria-hidden="true">{{
              page.record ? '✦' : '?'
            }}</span>
            <div class="evf-page-text">
              <small class="evf-kicker">{{ page.chapter }}</small>
              <strong>{{
                page.record ? page.title : 'Not yet witnessed'
              }}</strong>
              <span v-if="page.record">{{ page.caption }}</span>
              <small v-if="page.record"
                >{{ page.leadAlias }} ·
                {{ viewLabel(page.record.perspective) }} ·
                {{ dateLabel(page.record.at) }}</small
              >
            </div>
          </article>
        </div>
      </div>

      <footer v-if="store.screen === 'story'" class="evf-panel-foot">
        <button
          type="button"
          class="evf-go"
          data-testid="front-begin-story"
          @click="store.startStory(pickedView, pickedLead)"
        >
          Begin First Bell as {{ leadAlias }} ▸
        </button>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { promArt } from '~/utils/cometAcademy/artManifest'
import { scriptedFoilFor } from '~/utils/everyVillainTactics/training'
import {
  POWER_ORIGINS,
  POWER_AFFINITIES,
  signatureFor,
  type PowerOriginId,
  type PowerAffinityId,
} from '~/utils/cometAcademy/specialPowers'
import {
  ANIMATION_SPEEDS,
  PERSPECTIVE_ART,
  PLAYABLE_PERSPECTIVES,
  oneShotStages,
} from '~/utils/everyVillainTactics/frontMenu'
import {
  PERSPECTIVES,
  useEveryVillainTacticsStore,
  type TacticalPerspective,
} from '~/stores/everyVillainTacticsStore'

const store = useEveryVillainTacticsStore()
const root = ref<HTMLElement | null>(null)
const playableView = (view: TacticalPerspective): TacticalPerspective =>
  PLAYABLE_PERSPECTIVES.includes(view) ? view : 'hero'
const pickedView = ref<TacticalPerspective>(playableView(store.perspective))
const selectedOrigin = ref<PowerOriginId>(
  store.leadSignature.split('-')[0] as PowerOriginId,
)
const selectedAffinity = ref<PowerAffinityId>(
  store.leadSignature.split('-')[1] as PowerAffinityId,
)
const signaturePower = computed(() =>
  signatureFor(selectedOrigin.value, selectedAffinity.value),
)
const pickedLead = computed(() => signaturePower.value.id)
const selectedIdentity = computed(() =>
  store.roster.find((person) => person.signature === pickedLead.value),
)
const assignedFoil = computed(() => scriptedFoilFor(pickedLead.value))
const foilAlias = computed(
  () =>
    store.roster.find((person) => person.signature === assignedFoil.value)
      ?.villain.alias ?? 'the rival',
)
const revealArtwork = computed(
  () =>
    promArt(
      'identities/' + pickedLead.value + '/outcomes/' + pickedView.value,
    ) ?? promArt('identities/' + pickedLead.value + '/student'),
)
const confirming = ref<'defaults' | 'erase' | null>(null)
const oneShots = oneShotStages()

const art = (key: string) => promArt(key)
const BACKDROPS: Record<string, string> = {
  title: 'front/splash-v2',
  story: 'encounters/the-fire-drill-that-wasnt',
  oneshot: 'districts/waterfront-market',
  settings: 'districts/engineering-workshop',
  scrapbook: 'front/splash',
}
const backdrop = computed(() => promArt(BACKDROPS[store.screen ?? 'title']!))
const views = computed(() =>
  PLAYABLE_PERSPECTIVES.map((id) => ({
    id,
    label: PERSPECTIVES[id].label,
    headline: PERSPECTIVES[id].headline,
    art: promArt(
      'identities/' + pickedLead.value + '/outcomes/' + PERSPECTIVE_ART[id],
    ),
  })),
)
const leadAlias = computed(
  () =>
    selectedIdentity.value?.[
      pickedView.value === 'villain' ? 'villain' : 'hero'
    ].alias ?? 'your lead',
)
const leadNote = computed(
  () =>
    signaturePower.value.name +
    ' is ready for battle. All 48 power identities are playable with the shared First Bell encounters; personalized six-mission scripts remain in production.',
)
const continueLine = computed(() => {
  const s = store.latestSummary
  if (!s) return 'No saved battle yet'
  return (
    (s.mode === 'story' ? 'Story' : 'One-shot') +
    ' · ' +
    s.title +
    ' · ' +
    s.lead +
    ' · Round ' +
    s.turn +
    (s.phase === 'active' ? '' : ' · ' + s.phase)
  )
})
const settingsLine = computed(
  () =>
    'Animation ' +
    (ANIMATION_SPEEDS.find((s) => s.id === store.settings.animation)?.label ??
      '') +
    ' · ' +
    (store.settings.confirmEndTurn ? 'confirm end turn' : 'instant end turn'),
)
const unlockedCount = computed(
  () => store.scrapbookView.filter((page) => page.record).length,
)
const panelKicker = computed(
  () =>
    ({
      story: 'NEW STORY · MISSION 01 OF 06',
      oneshot: 'ONE-SHOT BATTLES',
      settings: 'CONSOLE SETTINGS',
      scrapbook: 'SCRAPBOOK · MOMENTS FROM YOUR SAVES',
    })[store.screen as 'story'] ?? '',
)
const panelTitle = computed(
  () =>
    ({
      story: 'First Bell',
      oneshot: 'Choose a battle',
      settings: 'Settings',
      scrapbook: 'Scrapbook',
    })[store.screen as 'story'] ?? '',
)
function viewLabel(view: TacticalPerspective) {
  return PERSPECTIVES[view].label
}
function dateLabel(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}
function confirmReset() {
  if (confirming.value === 'defaults') store.resetSettings()
  else if (confirming.value === 'erase') store.eraseProgress()
  confirming.value = null
}

/** Arrow keys move focus within a menu, radio row or card grid. */
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && store.screen !== 'title') {
    event.preventDefault()
    if (confirming.value) confirming.value = null
    else store.openScreen('title')
    return
  }
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
  if (!keys.includes(event.key)) return
  const target = event.target as HTMLElement | null
  const group = target?.closest<HTMLElement>('[data-roving]')
  if (!group) return
  const items = [
    ...group.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
  ]
  const index = items.indexOf(target as HTMLButtonElement)
  if (index < 0) return
  const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
  const next = items[(index + (forward ? 1 : -1) + items.length) % items.length]
  event.preventDefault()
  next?.focus()
}
async function focusScreen() {
  await nextTick()
  const el = root.value
  if (!el) return
  const preferred =
    el.querySelector<HTMLElement>('[aria-checked="true"]') ??
    el.querySelector<HTMLElement>('.evf-item:not(:disabled)') ??
    el.querySelector<HTMLElement>('.evf-body button, .evf-body [tabindex]')
  preferred?.focus()
}
watch(confirming, async (value) => {
  if (!value) return
  await nextTick()
  root.value
    ?.querySelector<HTMLElement>('[data-testid="front-confirm-cancel"]')
    ?.focus()
})
watch(
  () => store.screen,
  () => {
    confirming.value = null
    pickedView.value = playableView(store.perspective)
    selectedOrigin.value = store.leadSignature.split('-')[0] as PowerOriginId
    selectedAffinity.value = store.leadSignature.split(
      '-',
    )[1] as PowerAffinityId
    focusScreen()
  },
)
onMounted(() => {
  window.addEventListener('keydown', onKey)
  focusScreen()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.evf,
.evf *,
.evf *::before,
.evf *::after {
  box-sizing: border-box;
}
.evf {
  --ink: #fff8ec;
  --muted: #f5d7eb;
  --rose: #ff4485;
  --gold: #ffe46b;
  --panel: #21144bea;
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  color: var(--ink);
  background: #1c0d42;
  overflow: hidden;
  font-family: system-ui, sans-serif;
}
.evf-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
  filter: saturate(1.6) contrast(1.12);
  animation: evf-drift calc(24s * var(--evt-anim, 1)) ease-in-out infinite
    alternate;
}
.evf-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, #070b1df2 0%, #0a0f25c4 42%, #0a0f2533 75%),
    linear-gradient(0deg, #070b1de6 0%, transparent 45%);
}
.evf-on-title .evf-shade {
  background:
    repeating-radial-gradient(
      circle at 82% 36%,
      transparent 0 11px,
      #ffdf5933 12px 15px
    ),
    linear-gradient(100deg, #271057f2 0%, #571d8db5 43%, #fc4f6429 85%),
    linear-gradient(0deg, #160c40e3 0%, transparent 58%);
}
.evf-title {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: clamp(12px, 3cqh, 28px);
  width: min(620px, 100%);
  padding: clamp(16px, 4cqw, 56px);
  animation: evf-rise calc(0.7s * var(--evt-anim, 1)) ease-out both;
}
.evf-kicker {
  display: block;
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.evf-wordmark {
  margin: 0.3rem 0 0;
  font:
    1000 clamp(2.2rem, 6.4cqw, 4.8rem) / 0.92 Impact,
    'Arial Narrow',
    sans-serif;
  letter-spacing: 0.05em;
  color: #fff07c;
  -webkit-text-stroke: 1px #2b1257;
  text-shadow:
    3px 4px 0 #241044,
    6px 8px 0 #05aeca,
    0 12px 34px #000e;
}
.evf-wordmark em {
  display: block;
  font-style: normal;
  color: #ff559f;
}
.evf-tagline {
  margin: 0.6rem 0 0;
  color: var(--gold);
  font-weight: 700;
  font-style: italic;
}
.evf-menu {
  display: grid;
  gap: 8px;
}
.evf-item {
  display: grid;
  gap: 2px;
  min-height: 52px;
  padding: 10px 16px;
  text-align: left;
  color: var(--ink);
  border: 2px solid #ffc7f077;
  border-left: 6px solid #69e8f0;
  border-radius: 6px;
  background: linear-gradient(105deg, #3c1668ef, #1c235adf);
  backdrop-filter: blur(4px);
  transition: transform calc(0.15s * var(--evt-anim, 1)) ease;
}
.evf-item.is-primary {
  border-left-color: #ffe46b;
  background: linear-gradient(105deg, #e52b73ed, #672ac5ee);
}
.evf-item.is-quiet {
  background: #0c1027b8;
}
.evf-item-label {
  font:
    900 1.25rem/1.1 Impact,
    'Arial Narrow',
    sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.evf-item small {
  color: var(--muted);
  font-size: 0.75rem;
}
.evf-item:hover:not(:disabled),
.evf-item:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
  border-left-color: var(--gold);
  transform: translateX(6px);
}
.evf-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.evf-status,
.evf-foot {
  margin: 0;
  font-size: 0.72rem;
  color: var(--muted);
}
.evf-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-height: 0;
  padding: clamp(12px, 3cqw, 40px);
  animation: evf-rise calc(0.45s * var(--evt-anim, 1)) ease-out both;
}
.evf-panel-head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.evf-panel-head h2 {
  margin: 0;
  font:
    1000 clamp(1.6rem, 4cqw, 3rem) / 1 Impact,
    'Arial Narrow',
    sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.evf-back {
  flex: none;
  min-height: 44px;
  padding: 8px 14px;
  color: var(--ink);
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid #b3a3da77;
  border-radius: 10px;
  background: #121732e6;
}
.evf-back:hover,
.evf-back:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
.evf-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 4px 12px;
}
.evf-lede {
  max-width: 62ch;
  margin: 0 0 12px;
  color: #ece3ff;
}
.evf-label {
  margin: 14px 0 8px;
  color: var(--gold);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.evf-note {
  margin: -2px 0 8px;
  max-width: 70ch;
  font-size: 0.85rem;
  color: var(--muted);
}
.evf-views {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.evf-view,
.evf-stage,
.evf-page {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  text-align: left;
  color: var(--ink);
  border: 1px solid #b3a3da55;
  border-radius: 14px;
  background: var(--panel);
}
.evf-view img {
  aspect-ratio: 16 / 10;
  object-position: center 20%;
}
.evf-view img,
.evf-stage img,
.evf-page img,
.evf-view .evf-art-fallback,
.evf-stage .evf-art-fallback,
.evf-page .evf-art-fallback {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}
.evf-art-fallback {
  display: grid;
  place-items: center;
  font:
    900 1.6rem Impact,
    sans-serif;
  color: #b3a3da;
  background: radial-gradient(circle at 50% 40%, #3d375f, #151a33);
}
.evf-view-text,
.evf-stage-text,
.evf-page-text {
  display: grid;
  gap: 3px;
  padding: 10px 12px 12px;
}
.evf-view-text strong,
.evf-stage-text strong,
.evf-page-text strong {
  font:
    900 1.05rem/1.15 Impact,
    'Arial Narrow',
    sans-serif;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.evf-view-text small,
.evf-stage-text small,
.evf-page-text small,
.evf-stage-text span,
.evf-page-text span {
  color: var(--muted);
  font-size: 0.78rem;
}
.evf-view[aria-checked='true'],
.evf-lead[aria-checked='true'] {
  border-color: var(--gold);
  box-shadow:
    0 0 0 2px var(--gold),
    0 10px 30px #0008;
}
.evf-view:hover,
.evf-view:focus-visible,
.evf-stage:hover,
.evf-stage:focus-visible,
.evf-page:focus-visible,
.evf-lead:hover,
.evf-lead:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
.evf-leads {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 92px;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 4px 10px;
}
.evf-lead {
  display: grid;
  gap: 4px;
  padding: 4px;
  color: var(--ink);
  border: 1px solid #b3a3da44;
  border-radius: 12px;
  background: var(--panel);
}
.evf-lead img,
.evf-lead .evf-art-fallback {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: top;
  border-radius: 8px;
}
.evf-lead small {
  overflow: hidden;
  font-size: 0.68rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.evf-stages,
.evf-pages {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  gap: 12px;
}
.evf-page.is-locked {
  border-style: dashed;
  opacity: 0.72;
}
.evf-settings {
  display: grid;
  align-content: start;
  gap: 14px;
  max-width: 720px;
}
.evf-field {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}
.evf-field small {
  color: var(--muted);
  font-size: 0.78rem;
}
.evf-segments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.evf-segments button,
.evf-danger button {
  min-height: 44px;
  padding: 8px 16px;
  color: var(--ink);
  font-weight: 800;
  border: 1px solid #b3a3da77;
  border-radius: 10px;
  background: #171c3a;
}
.evf-segments button[aria-checked='true'] {
  color: #1b1330;
  border-color: var(--gold);
  background: var(--gold);
}
.evf-segments button:focus-visible,
.evf-danger button:focus-visible,
.evf-toggle:focus-within {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
.evf-toggle {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #b3a3da44;
  border-radius: 12px;
  background: var(--panel);
  cursor: pointer;
}
.evf-toggle input {
  width: 22px;
  height: 22px;
  margin-top: 2px;
  accent-color: #ffd98a;
}
.evf-toggle span {
  display: grid;
  gap: 2px;
}
.evf-toggle small {
  color: var(--muted);
}
.evf-danger {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #b3a3da33;
}
.evf-danger p {
  flex-basis: 100%;
  margin: 0;
  color: var(--gold);
  font-weight: 700;
}
.evf-danger .is-danger {
  border-color: #ff7d8caa;
  color: #ffd2d8;
  background: #3a1426;
}
.evf-panel-foot {
  display: flex;
  justify-content: flex-end;
}
.evf-go {
  min-height: 52px;
  padding: 12px 22px;
  color: #1b1330;
  font:
    900 1.1rem/1 Impact,
    'Arial Narrow',
    sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(90deg, var(--gold), #ff9fb0);
  box-shadow: 0 10px 30px #0009;
}
.evf-go:focus-visible,
.evf-go:hover {
  outline: 3px solid #fff;
  outline-offset: 2px;
}
@keyframes evf-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes evf-drift {
  from {
    transform: scale(1.02);
  }
  to {
    transform: scale(1.08) translateX(-1.5%);
  }
}
@container (max-width: 760px) {
  .evf-views {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .evf-title {
    width: 100%;
    justify-content: flex-start;
  }
  .evf-shade,
  .evf-on-title .evf-shade {
    background: linear-gradient(0deg, #070b1df5 35%, #0a0f2599 100%);
  }
  .evf-go {
    width: 100%;
  }
}
@container (max-width: 460px) {
  .evf-item {
    min-height: 48px;
    padding: 8px 12px;
  }
  .evf-item-label {
    font-size: 1.05rem;
  }
  .evf-panel-head h2 {
    font-size: 1.5rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .evf-backdrop,
  .evf-title,
  .evf-panel {
    animation: none;
  }
  .evf-item {
    transition: none;
  }
}

.evf-setup {
  display: grid;
  align-content: start;
  gap: 8px;
}
.evf-identity-steps {
  display: grid;
  gap: 8px;
}
.evf-power-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(91px, 1fr);
  gap: 8px;
  padding: 4px 4px 10px;
  overflow-x: auto;
}
.evf-power-option {
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 5px;
  min-height: 94px;
  padding: 6px;
  color: #fff7df;
  background: #2b1d5ae9;
  border: 2px solid #965cd5;
  border-radius: 8px;
  font-size: 0.72rem;
}
.evf-power-option img,
.evf-power-option > span {
  width: 100%;
  height: 58px;
  object-fit: cover;
  border-radius: 4px;
  background: linear-gradient(130deg, #f05f8d, #4cdcea);
}
.evf-power-option > span {
  display: grid;
  place-items: center;
  font-size: 1.8rem;
}
.evf-power-option[aria-checked='true'] {
  border-color: #fff07e;
  background: #6e1fa0;
  box-shadow: inset 0 0 0 2px #f9db81;
}
.evf-power-option:focus-visible {
  outline: 3px solid #88efff;
  outline-offset: 2px;
}
.evf-identity-reveal {
  display: grid;
  grid-template-columns: clamp(104px, 24cqw, 240px) minmax(0, 1fr);
  gap: clamp(8px, 2cqw, 22px);
  min-height: 165px;
  overflow: hidden;
  border: 3px solid #ffe275;
  border-radius: 8px;
  background: linear-gradient(120deg, #b32977e9, #252c72ef 75%);
}
.evf-reveal-art {
  min-height: 155px;
  background: #612473;
}
.evf-reveal-art img,
.evf-reveal-art .evf-art-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
}
.evf-reveal-copy {
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 10px;
}
.evf-reveal-copy h3 {
  margin: 0;
  font:
    900 clamp(1.35rem, 3cqw, 2.5rem)/1 Impact,
    'Arial Narrow',
    sans-serif;
  color: #ffe47d;
  text-transform: uppercase;
}
.evf-reveal-copy p {
  margin: 0;
  font-size: clamp(0.76rem, 1.1cqw, 0.96rem);
  line-height: 1.35;
}
.evf-reveal-power {
  color: #d2f9ff;
}
.evf-reveal-copy small,
.evf-foil-note {
  color: #f8def9;
  font-size: 0.74rem;
}
.evf-foil-note {
  margin: 0;
}
@container (max-width: 480px) {
  .evf-identity-reveal {
    grid-template-columns: 110px minmax(0, 1fr);
  }
  .evf-reveal-copy {
    padding: 6px;
  }
}
</style>
