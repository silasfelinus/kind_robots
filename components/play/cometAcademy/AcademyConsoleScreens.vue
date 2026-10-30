<template>
  <div class="acs" :data-screen="screen">
    <!-- HERO -->
    <section v-if="screen === 'hero'" data-testid="academy-screen-hero">
      <div class="acs-hero">
        <div class="acs-hero-portrait">
          <img
            v-if="art(hero.portraitKeys)"
            :src="art(hero.portraitKeys)!"
            :alt="`${hero.name} as ${hero.alias}`"
          />
          <span v-else class="acs-initials">{{ initials(hero.name) }}</span>
        </div>
        <div class="acs-hero-id">
          <p class="acs-kicker">{{ hero.form.toUpperCase() }} FILE</p>
          <h2>{{ hero.alias }}</h2>
          <p class="acs-sub">
            {{ hero.name
            }}<span v-if="hero.pronouns"> · {{ hero.pronouns }}</span>
          </p>
          <p class="acs-copy">{{ hero.focus }}</p>
          <div class="acs-forms">
            <span
              v-for="form in hero.forms"
              :key="form.id"
              :class="{ current: form.current, locked: !form.unlocked }"
              >{{ form.id.toUpperCase() }} ·
              {{ form.unlocked ? form.alias : 'NOT YET EARNED' }}</span
            >
          </div>
        </div>
      </div>
      <div class="acs-grid-2">
        <article class="acs-panel">
          <h3>{{ hero.power.crest }} Power · {{ hero.power.field }}</h3>
          <p>{{ hero.power.ability }}</p>
          <p class="acs-dim">Drawback: {{ hero.power.drawback }}</p>
          <template v-if="hero.power.signature">
            <h4>{{ hero.power.signature }}</h4>
            <p>{{ hero.power.action }}</p>
            <p class="acs-dim">{{ hero.power.cost }}</p>
          </template>
          <template v-if="hero.vow">
            <h4>Vow · {{ hero.vow.name }}</h4>
            <p>{{ hero.vow.promise }}</p>
          </template>
        </article>
        <article class="acs-panel">
          <h3>Stats</h3>
          <div v-for="stat in hero.stats" :key="stat.id" class="acs-stat">
            <span>{{ stat.name }}</span>
            <span class="acs-bar"
              ><i :style="{ width: Math.min(100, stat.value * 10) + '%' }"
            /></span>
            <b>{{ stat.value }}</b>
          </div>
          <p v-if="!hero.stats.length" class="acs-dim">
            This early-slice save has no identity stats.
          </p>
        </article>
        <article class="acs-panel">
          <h3>Standing</h3>
          <dl class="acs-dl">
            <template v-for="row in hero.standings" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value >= 0 ? '+' : '' }}{{ row.value }}</dd>
            </template>
          </dl>
        </article>
        <article class="acs-panel">
          <h3>Bonds &amp; record</h3>
          <dl class="acs-dl">
            <template v-for="row in hero.bonds" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value ?? '—' }}</dd>
            </template>
            <template v-for="row in hero.record" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </template>
          </dl>
        </article>
      </div>
      <p v-if="hero.backstory" class="acs-copy acs-backstory">
        {{ hero.backstory }}
      </p>
    </section>

    <!-- FOLLOWERS -->
    <section
      v-else-if="screen === 'followers'"
      data-testid="academy-screen-followers"
    >
      <header class="acs-head">
        <h2>Your crew</h2>
        <p>
          {{ metCount }} of {{ roster.length }} people met. Feelings change with
          what you do, not with what you buy.
        </p>
      </header>
      <div class="acs-cards">
        <article
          v-for="person in roster"
          :key="person.id"
          class="acs-card"
          :class="['mood-' + person.mood, { faceDown: !person.met }]"
          data-testid="academy-follower-card"
        >
          <template v-if="person.met">
            <div class="acs-card-art">
              <img
                v-if="art(person.portraitKeys)"
                :src="art(person.portraitKeys)!"
                :alt="`${person.name}, ${person.mood} mood`"
              />
              <span v-else class="acs-initials">{{
                initials(person.name)
              }}</span>
              <em class="acs-mood">{{ moodLabel[person.mood] }}</em>
            </div>
            <h3>{{ person.name }}</h3>
            <p class="acs-sub">
              {{ person.title }} · {{ person.power
              }}<span v-if="person.pronouns"> · {{ person.pronouns }}</span>
            </p>
            <div class="acs-trust" :aria-label="`Trust ${person.trust}`">
              <i
                v-for="n in 5"
                :key="n"
                :class="{ on: n <= person.trust }"
              /><small>TRUST</small>
            </div>
            <ul v-if="person.status.length" class="acs-tags">
              <li v-for="tag in person.status" :key="tag">{{ tag }}</li>
            </ul>
            <p v-if="person.chemistry" class="acs-dim">
              Chemistry: {{ person.chemistry }}
            </p>
            <p class="acs-quote">{{ person.voice || person.note }}</p>
          </template>
          <template v-else>
            <div class="acs-card-art">
              <div class="acs-back" :class="backClass">
                <span>{{ cardBack.name }}</span>
              </div>
            </div>
            <h3>Not met yet</h3>
            <p class="acs-dim">{{ person.title }}</p>
          </template>
        </article>
      </div>
    </section>

    <!-- CASE FILE -->
    <section
      v-else-if="screen === 'casefile'"
      data-testid="academy-screen-casefile"
    >
      <template v-if="caseFile">
        <div class="acs-hero">
          <div class="acs-hero-portrait villain">
            <img
              v-if="caseFile.portraitKey && art([caseFile.portraitKey])"
              :src="art([caseFile.portraitKey])!"
              :alt="caseFile.name"
            />
            <div v-else class="acs-back" :class="backClass">
              <span>?</span>
            </div>
          </div>
          <div class="acs-hero-id">
            <p class="acs-kicker">MASTERMIND CASE FILE</p>
            <h2 data-testid="academy-casefile-name">{{ caseFile.name }}</h2>
            <p v-if="caseFile.method" class="acs-copy">
              Plan: {{ caseFile.method }}.
            </p>
            <p v-else class="acs-copy">
              Nobody has named the mastermind yet. Read the omens, then make
              your accusation between days {{ caseFile.accuseOpensOn }} and
              {{ caseFile.accuseClosesAfter }}.
            </p>
            <p v-if="caseFile.countermeasure" class="acs-copy">
              Countermeasure: {{ caseFile.countermeasure }}.
            </p>
          </div>
        </div>
        <article
          v-if="caseFile.interference?.seen"
          class="acs-panel"
          :class="{ alert: caseFile.interference.active }"
          data-testid="academy-villain-interference"
        >
          <h3>
            {{
              caseFile.interference.active
                ? 'Interference tonight'
                : 'Midweek interference'
            }}
            · {{ caseFile.interference.jams }} jammed
          </h3>
          <p>{{ caseFile.interference.text }}</p>
        </article>
        <article class="acs-panel">
          <h3>Omens collected</h3>
          <ul class="acs-omens">
            <li v-for="omen in caseFile.omens" :key="omen.day">
              <b>Day {{ omen.day }}</b> {{ omen.text }}
            </li>
          </ul>
        </article>
        <article class="acs-panel" data-testid="academy-accusation">
          <h3>Name the mastermind</h3>
          <p v-if="caseFile.suspect" class="acs-copy">
            Day {{ caseFile.suspect.day }}: you named
            {{ caseFile.suspect.name }}.
            {{
              caseFile.suspect.correct
                ? 'The evidence held.'
                : 'The evidence did not hold.'
            }}
          </p>
          <p v-else-if="!caseFile.canAccuse" class="acs-dim">
            {{
              run.day < caseFile.accuseOpensOn
                ? `The case board opens on day ${caseFile.accuseOpensOn}, after the midweek interference.`
                : run.day > caseFile.accuseClosesAfter
                  ? 'The day-15 dossier made the accusation public. The board is closed.'
                  : 'You can pin a name to the board during the day, before you choose where to go.'
            }}
          </p>
          <p v-else class="acs-dim">
            One accusation per term. The right name breaks the interference; a
            wrong one costs the city time.
          </p>
          <div class="acs-lineup">
            <button
              v-for="suspect in caseFile.lineup"
              :key="suspect.id"
              type="button"
              :disabled="!caseFile.canAccuse"
              :class="{ armed: pendingSuspect === suspect.id }"
              data-testid="academy-accuse"
              @click="accuse(suspect.id)"
            >
              <img
                v-if="art([suspect.portraitKey])"
                :src="art([suspect.portraitKey])!"
                alt=""
              />
              <span>{{
                pendingSuspect === suspect.id
                  ? 'Tap again to accuse'
                  : suspect.name
              }}</span>
            </button>
          </div>
        </article>
        <article class="acs-panel">
          <h3>Accomplices</h3>
          <ul class="acs-omens">
            <li v-for="(accomplice, i) in caseFile.accomplices" :key="i">
              <b>Day {{ accomplice.day }}</b>
              <template v-if="accomplice.name">
                {{ accomplice.name }} {{ accomplice.sabotage }} to
                {{ accomplice.motive }}.
                <em>{{
                  accomplice.status === 'exposed' ? 'EXPOSED' : 'AT LARGE'
                }}</em>
              </template>
              <template v-else>Unknown.</template>
            </li>
          </ul>
        </article>
        <article v-if="caseFile.antagonist" class="acs-panel acs-row">
          <img
            v-if="art([caseFile.antagonist.portraitKey])"
            :src="art([caseFile.antagonist.portraitKey])!"
            :alt="caseFile.antagonist.alias"
            class="acs-thumb"
          />
          <div>
            <h3>Rival antagonist · {{ caseFile.antagonist.alias }}</h3>
            <p>
              {{ caseFile.antagonist.name }}: {{ caseFile.antagonist.method }}
            </p>
          </div>
        </article>
      </template>
      <p v-else class="acs-copy">
        The first-week simulation has no live mastermind. Begin a thirty-day
        term to open a case file.
      </p>
    </section>

    <!-- SCRAPBOOK -->
    <section
      v-else-if="screen === 'scrapbook'"
      data-testid="academy-screen-scrapbook"
    >
      <header class="acs-head">
        <h2>Scrapbook</h2>
        <p>Moments you earned this term, and every ending you have reached.</p>
      </header>
      <div v-if="moments.length" class="acs-cards">
        <article
          v-for="(moment, i) in moments"
          :key="i"
          class="acs-card"
          data-testid="academy-scrapbook-moment"
        >
          <div class="acs-card-art wide">
            <img
              v-if="art(moment.artKeys)"
              :src="art(moment.artKeys)!"
              :alt="moment.title"
            />
            <div v-else class="acs-back" :class="backClass">
              <span>{{ moment.kind.toUpperCase() }}</span>
            </div>
          </div>
          <p class="acs-kicker">
            {{ moment.day ? `DAY ${moment.day}` : 'CASE' }} ·
            {{ moment.kind.toUpperCase() }}
          </p>
          <h3>{{ moment.title }}</h3>
          <p class="acs-dim">{{ moment.text }}</p>
        </article>
      </div>
      <p v-else class="acs-dim">
        Nothing yet. Visit a district, walk a patrol or make a friend.
      </p>
      <h3 class="acs-section">City notables</h3>
      <div class="acs-cards small">
        <article
          v-for="notable in notables"
          :key="notable.key"
          class="acs-card"
          :class="{ faceDown: !notable.met }"
          data-testid="academy-notable-card"
        >
          <div class="acs-card-art">
            <img
              v-if="notable.met && art(notable.artKeys)"
              :src="art(notable.artKeys)!"
              :alt="notable.name"
            />
            <div v-else class="acs-back" :class="backClass">
              <span>{{ notable.met ? notable.name : '?' }}</span>
            </div>
          </div>
          <h3>{{ notable.name }}</h3>
          <template v-if="notable.met">
            <p class="acs-dim">{{ notable.role }}</p>
            <p v-if="notable.species" class="acs-kicker">
              SPECIES · {{ notable.species.title }}
            </p>
            <p v-if="notable.stance" class="acs-kicker">
              DAY {{ notable.day }} · {{ notable.stance.toUpperCase() }}
            </p>
            <p class="acs-quote">“{{ notable.line }}”</p>
          </template>
        </article>
      </div>
      <h3 class="acs-section">Mastermind dossiers</h3>
      <div class="acs-cards small">
        <article
          v-for="dossier in dossierCards"
          :key="dossier.id"
          class="acs-card"
          :class="{ faceDown: !dossier.met }"
        >
          <div class="acs-card-art">
            <img
              v-if="dossier.met && art([dossier.portraitKey])"
              :src="art([dossier.portraitKey])!"
              :alt="dossier.name"
            />
            <div v-else class="acs-back" :class="backClass">
              <span>?</span>
            </div>
          </div>
          <h3>{{ dossier.name }}</h3>
          <p v-if="dossier.method" class="acs-dim">{{ dossier.method }}</p>
        </article>
      </div>
      <h3 class="acs-section">Endings</h3>
      <div class="acs-cards small">
        <article
          v-for="plate in plates"
          :key="plate.ending"
          class="acs-card"
          :class="{ faceDown: !plate.found }"
          data-testid="academy-ending-plate"
        >
          <div class="acs-card-art">
            <img
              v-if="plate.found && art([plate.artKey])"
              :src="art([plate.artKey])!"
              :alt="plate.ending"
            />
            <div v-else class="acs-back" :class="backClass">
              <span>{{ plate.found ? '✦' : 'LOCKED' }}</span>
            </div>
          </div>
          <h3>{{ plate.found ? plate.ending : 'Undiscovered ending' }}</h3>
          <p v-if="plate.route" class="acs-dim">{{ plate.route }}</p>
        </article>
      </div>
    </section>

    <!-- SETTINGS -->
    <section
      v-else-if="screen === 'settings'"
      data-testid="academy-screen-settings"
    >
      <header class="acs-head">
        <h2>Settings &amp; saves</h2>
        <p>{{ summary.mode }} · day {{ summary.day }} of {{ summary.days }}</p>
      </header>
      <article class="acs-panel" data-testid="academy-current-play-mode">
        <h3>Current campaign mode</h3>
        <p class="acs-dim">
          Tactical missions:
          {{
            run.campaignOptions?.tacticalMissions === false
              ? 'Narrated outcomes'
              : 'Playable battles'
          }}
        </p>
        <p class="acs-dim">
          Night patrols:
          {{
            run.campaignOptions?.nightPatrols === false
              ? 'Story decisions'
              : 'Manual patrols and dispatch'
          }}
        </p>
        <p class="acs-dim">
          These choices are saved with this term. A new term can use a different
          combination without changing this game's relationships, clues or
          endings.
        </p>
      </article>
      <article class="acs-panel">
        <h3>Text speed</h3>
        <div class="acs-segment" role="radiogroup" aria-label="Text speed">
          <button
            v-for="speed in TEXT_SPEEDS"
            :key="speed.id"
            type="button"
            role="radio"
            :aria-checked="store.settings.textSpeed === speed.id"
            :class="{ on: store.settings.textSpeed === speed.id }"
            data-testid="academy-text-speed"
            @click="store.updateSettings({ textSpeed: speed.id })"
          >
            {{ speed.label }}
          </button>
        </div>
      </article>
      <article class="acs-panel">
        <h3>Illustrations</h3>
        <label class="acs-toggle">
          <input
            type="checkbox"
            :checked="store.settings.art"
            data-testid="academy-art-toggle"
            @change="
              store.updateSettings({
                art: ($event.target as HTMLInputElement).checked,
              })
            "
          />
          <span
            >Show painted art (off uses the drawn academy and initials)</span
          >
        </label>
      </article>
      <article class="acs-panel">
        <h3>Card back</h3>
        <div class="acs-backs">
          <button
            v-for="back in CARD_BACKS"
            :key="back.id"
            type="button"
            :class="{ on: store.settings.cardBack === back.id }"
            :aria-pressed="store.settings.cardBack === back.id"
            data-testid="academy-card-back"
            @click="store.updateSettings({ cardBack: back.id })"
          >
            <span class="acs-back" :class="'back-' + back.id"
              ><span>{{ back.name }}</span></span
            >
            <small>{{ back.motto }}</small>
          </button>
        </div>
      </article>
      <article class="acs-panel">
        <h3>Save code</h3>
        <p class="acs-dim">
          {{ summary.format }} · seed {{ summary.seed }}. Your term also
          autosaves in this browser after every choice.
        </p>
        <div class="acs-actions">
          <button
            type="button"
            class="acs-button"
            data-testid="academy-export-save"
            @click="exportCode"
          >
            Show save code
          </button>
          <button
            v-if="saveCode"
            type="button"
            class="acs-button"
            @click="copyCode"
          >
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <textarea
          v-if="saveCode"
          class="acs-code"
          readonly
          :value="saveCode"
          aria-label="Your save code"
          rows="3"
        />
        <label class="acs-dim" for="acs-import">Load a save code</label>
        <textarea
          id="acs-import"
          v-model="importCode"
          class="acs-code"
          rows="3"
          placeholder="PROM1:…"
          data-testid="academy-import-save"
        />
        <div class="acs-actions">
          <button
            type="button"
            class="acs-button"
            :disabled="!importCode.trim()"
            data-testid="academy-load-save"
            @click="loadCode"
          >
            {{ confirmImport ? 'Replace current term?' : 'Load save' }}
          </button>
          <span v-if="importError" class="acs-error" role="alert">{{
            importError
          }}</span>
        </div>
      </article>
      <article class="acs-panel danger">
        <h3>Start over</h3>
        <p class="acs-dim">
          Ends this term for good. Your Yearbook, dossiers and settings stay.
        </p>
        <div class="acs-actions">
          <button
            type="button"
            class="acs-button warn"
            data-testid="academy-reset"
            @click="resetArmed = true"
          >
            Abandon this term
          </button>
          <template v-if="resetArmed">
            <button
              type="button"
              class="acs-button warn solid"
              data-testid="academy-reset-confirm"
              @click="confirmReset"
            >
              Yes, erase the save
            </button>
            <button
              type="button"
              class="acs-button"
              @click="resetArmed = false"
            >
              Keep playing
            </button>
          </template>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCometAcademyStore } from '~/stores/cometAcademyStore'
import { promArt } from '~/utils/cometAcademy/artManifest'
import {
  CARD_BACKS,
  TEXT_SPEEDS,
  endingPlates,
  followerRoster,
  heroDossier,
  notableCards,
  saveSummary,
  scrapbookMoments,
  villainCaseFile,
  villainDossiers,
  type ConsoleScreen,
  type FollowerMood,
} from '~/utils/cometAcademy/consoleScreens'
import type { AcademyRun } from '~/utils/cometAcademy/rules'

const props = defineProps<{
  screen: ConsoleScreen
  run: AcademyRun
  /** Opens Settings with the reset confirmation already armed. */
  armReset?: boolean
}>()
const emit = defineEmits<{ navigate: [screen: ConsoleScreen] }>()
const store = useCometAcademyStore()

const art = (keys: readonly string[]) =>
  store.settings.art
    ? (keys.map((key) => promArt(key)).find(Boolean) ?? null)
    : null
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
const moodLabel: Record<FollowerMood, string> = {
  positive: 'Warm',
  neutral: 'Steady',
  negative: 'Hurting',
}

const earnedForms = computed(() =>
  props.run.signature ? (store.yearbook[props.run.signature]?.forms ?? []) : [],
)
const hero = computed(() => heroDossier(props.run, earnedForms.value))
const roster = computed(() =>
  [...followerRoster(props.run)].sort((a, b) => Number(b.met) - Number(a.met)),
)
const metCount = computed(
  () => roster.value.filter((person) => person.met).length,
)
const caseFile = computed(() => villainCaseFile(props.run))
const moments = computed(() => scrapbookMoments(props.run))
const plates = computed(() =>
  endingPlates(Object.values(store.yearbook).flatMap((entry) => entry.endings)),
)
const dossierCards = computed(() => villainDossiers(store.dossiers))
const notables = computed(() => notableCards(props.run))
const summary = computed(() => saveSummary(props.run))
const cardBack = computed(
  () =>
    CARD_BACKS.find((back) => back.id === store.settings.cardBack) ??
    CARD_BACKS[0]!,
)
const backClass = computed(() => 'back-' + cardBack.value.id)

const pendingSuspect = ref<string | null>(null)
function accuse(id: string) {
  if (pendingSuspect.value !== id) {
    pendingSuspect.value = id
    return
  }
  pendingSuspect.value = null
  store.accuse(id)
}

const saveCode = ref('')
const copied = ref(false)
const importCode = ref('')
const importError = ref('')
const confirmImport = ref(false)
const resetArmed = ref(Boolean(props.armReset))
watch(
  () => props.armReset,
  (armed) => {
    if (armed) resetArmed.value = true
  },
)
watch(importCode, () => {
  confirmImport.value = false
  importError.value = ''
})

function exportCode() {
  saveCode.value = store.exportSave()
  copied.value = false
}
async function copyCode() {
  try {
    await navigator.clipboard.writeText(saveCode.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}
function loadCode() {
  if (!confirmImport.value) {
    confirmImport.value = true
    return
  }
  confirmImport.value = false
  if (store.importSave(importCode.value)) {
    importCode.value = ''
    emit('navigate', 'play')
  } else
    importError.value =
      'That code is not a valid Prom of Doom save. Nothing was changed.'
}
function confirmReset() {
  resetArmed.value = false
  store.restart()
}
</script>

<style scoped>
.acs {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  font-size: 0.8rem;
  color: #ecf2f8;
}
.acs section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.acs h2 {
  font-family: Georgia, serif;
  font-weight: 800;
  font-size: clamp(1.3rem, 2vw, 1.8rem);
  line-height: 1.05;
}
.acs h3 {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f6c89e;
}
.acs h4 {
  margin-top: 0.5rem;
  font-weight: 800;
  color: #fde7cf;
}
.acs-head p,
.acs-dim {
  color: #b5c7d6;
  font-size: 0.74rem;
  line-height: 1.45;
}
.acs-kicker {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #9ae0e4;
}
.acs-sub {
  color: #cdd9e4;
  font-size: 0.72rem;
}
.acs-copy {
  line-height: 1.5;
}
.acs-section {
  margin-top: 0.4rem;
}
.acs-hero {
  display: grid;
  grid-template-columns: minmax(6rem, 9rem) minmax(0, 1fr);
  gap: 0.85rem;
  align-items: start;
}
.acs-hero-portrait {
  aspect-ratio: 3 / 4;
  border-radius: 0.7rem;
  overflow: hidden;
  border: 1px solid #f6c89e66;
  background: #0b1122;
  display: grid;
  place-items: center;
}
.acs-hero-portrait.villain {
  border-color: #e0718c88;
}
.acs-hero-portrait img,
.acs-card-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.acs-initials {
  font-family: Georgia, serif;
  font-size: 1.6rem;
  font-weight: 800;
  color: #f6c89e;
}
.acs-hero-id {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
.acs-forms {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.acs-forms span,
.acs-tags li {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  border: 1px solid #9db0cf55;
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  color: #d8e4ee;
}
.acs-forms .current {
  border-color: #f6c89e;
  color: #ffd9b0;
}
.acs-forms .locked {
  opacity: 0.55;
}
.acs-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 0.6rem;
}
.acs-panel {
  border: 1px solid #94bac44d;
  border-radius: 0.7rem;
  background: #0b142699;
  padding: 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}
.acs-panel.alert {
  border-color: #f08aa3;
  background: #3a142899;
}
.acs-panel.danger {
  border-color: #e0718c66;
}
.acs-row {
  flex-direction: row;
  align-items: center;
  gap: 0.7rem;
}
.acs-thumb {
  width: 4rem;
  height: 4rem;
  object-fit: cover;
  border-radius: 0.5rem;
  flex-shrink: 0;
}
.acs-stat {
  display: grid;
  grid-template-columns: 4.2rem minmax(0, 1fr) 1.4rem;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.7rem;
}
.acs-bar {
  height: 0.4rem;
  border-radius: 999px;
  background: #ffffff1a;
  overflow: hidden;
}
.acs-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #9ae0e4, #f6c89e);
}
.acs-dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.2rem 0.6rem;
  font-size: 0.72rem;
}
.acs-dl dt {
  color: #b5c7d6;
}
.acs-dl dd {
  font-weight: 700;
  text-align: right;
}
.acs-backstory {
  color: #cdd9e4;
  font-size: 0.75rem;
}
.acs-cards {
  display: grid;
  align-items: start;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.6rem;
}
.acs-cards.small {
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
}
.acs-card {
  border: 1px solid #94bac44d;
  border-radius: 0.7rem;
  padding: 0.5rem;
  background: #0b142699;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}
.acs-card h3 {
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: none;
  color: #fde7cf;
}
.acs-card.mood-positive {
  border-color: #9ae0b077;
}
.acs-card.mood-negative {
  border-color: #e0718c88;
}
.acs-card.faceDown {
  opacity: 0.8;
}
.acs-card-art {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #0b1122;
  display: grid;
  place-items: center;
}
.acs-card-art.wide {
  aspect-ratio: 16 / 10;
}
.acs-mood {
  position: absolute;
  left: 0.3rem;
  bottom: 0.3rem;
  font-style: normal;
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  background: #0d1024cc;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}
.acs-trust {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}
.acs-trust i {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 100%;
  border: 1px solid #f6c89e88;
}
.acs-trust i.on {
  background: #f6c89e;
}
.acs-trust small {
  margin-left: 0.3rem;
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  color: #b5c7d6;
}
.acs-tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.acs-quote {
  font-style: italic;
  color: #cdd9e4;
  font-size: 0.7rem;
  line-height: 1.4;
}
.acs-omens {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  line-height: 1.45;
}
.acs-omens b {
  color: #9ae0e4;
  margin-right: 0.3rem;
}
.acs-omens em {
  font-style: normal;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #f6c89e;
  margin-left: 0.3rem;
}
.acs-lineup {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.4rem;
}
.acs-lineup button {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border: 1px solid #94bac466;
  border-radius: 0.55rem;
  padding: 0.3rem;
  background: #10203a;
  color: #ecf2f8;
  font-size: 0.64rem;
  font-weight: 700;
  text-align: left;
}
.acs-lineup button img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.35rem;
  filter: grayscale(0.7) contrast(1.1);
}
.acs-lineup button:not(:disabled):hover,
.acs-lineup button:focus-visible,
.acs-lineup button.armed {
  border-color: #f6c89e;
}
.acs-lineup button.armed img {
  filter: none;
}
.acs-lineup button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.acs-segment {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.acs-segment button,
.acs-button {
  border: 1px solid #94bac488;
  border-radius: 0.5rem;
  padding: 0.45rem 0.8rem;
  background: #1b2c47;
  color: #ecf7fa;
  font-weight: 700;
  font-size: 0.74rem;
  min-height: 2.25rem;
}
.acs-segment button.on {
  border-color: #f6c89e;
  background: #4a3a2e;
  color: #ffe2c2;
}
.acs-button:disabled {
  opacity: 0.5;
}
.acs-button.warn {
  border-color: #e0718c;
  color: #ffd3dc;
}
.acs-button.warn.solid {
  background: #7a2338;
}
.acs-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
.acs-error {
  color: #ffb3c1;
  font-size: 0.72rem;
}
.acs-toggle {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.acs-toggle input {
  width: 1.1rem;
  height: 1.1rem;
  accent-color: #f6c89e;
}
.acs-code {
  width: 100%;
  font-family: ui-monospace, monospace;
  font-size: 0.66rem;
  background: #060b18;
  color: #d8e4ee;
  border: 1px solid #94bac466;
  border-radius: 0.45rem;
  padding: 0.4rem;
  word-break: break-all;
}
.acs-backs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: 0.45rem;
}
.acs-backs button {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.3rem;
  border: 1px solid #94bac455;
  border-radius: 0.55rem;
  background: transparent;
  color: #b5c7d6;
  text-align: left;
}
.acs-backs button.on {
  border-color: #f6c89e;
}
.acs-backs .acs-back {
  aspect-ratio: 3 / 4;
}
.acs-back {
  width: 100%;
  height: 100%;
  min-height: 4rem;
  display: grid;
  place-items: center;
  border-radius: 0.45rem;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-align: center;
  color: #fff3e4;
  text-shadow: 0 1px 4px #000a;
}
.back-comet {
  background:
    radial-gradient(circle at 70% 25%, #ffe7b8 0 6%, transparent 7%),
    linear-gradient(200deg, transparent 40%, #ffc18a55 52%, transparent 60%),
    linear-gradient(160deg, #1c2450, #0d1024 70%);
}
.back-tassel {
  background:
    repeating-linear-gradient(90deg, #f6c89e22 0 2px, transparent 2px 10px),
    linear-gradient(180deg, #4a2c1a, #1d1410);
  color: #ffd78e;
}
.back-doom {
  background:
    radial-gradient(circle at 50% 120%, #e0718c 0 30%, transparent 55%),
    linear-gradient(180deg, #2a0f2e, #0d1024);
}
.back-blueprint {
  background:
    linear-gradient(#9ae0e422 1px, transparent 1px) 0 0 / 12px 12px,
    linear-gradient(90deg, #9ae0e422 1px, transparent 1px) 0 0 / 12px 12px,
    #0e2c4a;
  color: #c9f4f6;
}
@media (max-width: 480px) {
  .acs-hero {
    grid-template-columns: 5.5rem minmax(0, 1fr);
  }
  .acs-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .acs-cards.small,
  .acs-lineup,
  .acs-backs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
