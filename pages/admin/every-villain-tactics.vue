<template>
  <main
    class="kr-surface h-full min-h-0 overflow-hidden gap-0"
    data-layout="console-fixed"
    data-testid="every-villain-tactics"
    aria-label="Every Villain Tactics training console"
  >
    <PlaybookKitShell :spec="EVERY_VILLAIN_TACTICS" :meter-values="meterValues">
      <div class="evt-console">
        <header class="evt-hud">
          <div class="evt-brand">
            <span class="evt-overline"
              >CAPES &amp; TASSELS / TACTICAL OPERATIONS</span
            >
            <div class="evt-title">EVERY <em>VILLAIN</em> TACTICS</div>
            <span class="evt-subtitle"
              >COMET CITY • FIRST BELL • INTERNAL TRAINING</span
            >
          </div>
          <div class="evt-hud-side">
            <span class="evt-mission-pill">01 / 06</span>
            <button
              class="evt-outline"
              type="button"
              @click="store.rosterOpen = !store.rosterOpen"
            >
              {{ store.rosterOpen ? 'CLOSE DOSSIER' : '48 HERO DOSSIERS' }}
            </button>
          </div>
        </header>

        <div class="evt-deck">
          <section
            class="evt-arena"
            aria-label="First Bell tactical battlefield"
          >
            <div class="evt-map-backdrop" aria-hidden="true"></div>
            <div class="evt-map-glow" aria-hidden="true"></div>

            <div class="evt-stage-label">
              <span class="evt-overline"
                >COMET CITY ACADEMY / AUDITORIUM APPROACH</span
              >
              <span class="evt-objective"
                >OBJECTIVE: {{ store.scene.headline }}</span
              >
            </div>

            <div class="evt-grid-wrap">
              <div
                class="evt-map"
                role="group"
                aria-label="Nine by six tactical grid"
              >
                <button
                  v-for="cell in boardCells"
                  :key="cell.x + '-' + cell.y"
                  type="button"
                  class="evt-tile"
                  :class="store.cellStyle(cell)"
                  :aria-label="cellDescription(cell)"
                  :aria-pressed="
                    store.state.selected === actorAt(store.state, cell)?.id
                  "
                  :data-testid="'tactics-tile-' + cell.x + '-' + cell.y"
                  @pointerenter="store.hover(cell)"
                  @focus="store.hover(cell)"
                  @click="store.click(cell)"
                >
                  <span
                    v-if="terrainAt(cell) === 'cover'"
                    class="evt-cover"
                    aria-hidden="true"
                  ></span>
                  <span
                    v-if="terrainAt(cell) === 'wall'"
                    class="evt-wall"
                    aria-hidden="true"
                  ></span>
                  <span
                    v-if="actorAt(store.state, cell)"
                    class="evt-standee"
                    :class="{
                      'evt-friendly':
                        actorAt(store.state, cell)?.team === 'squad',
                      'evt-rival': actorAt(store.state, cell)?.team === 'rival',
                      'evt-fallen': actorAt(store.state, cell)?.hp === 0,
                    }"
                  >
                    <span class="evt-card-art">
                      <span class="evt-crest" aria-hidden="true">✦</span>
                      <span class="evt-initials">{{
                        initials(actorAt(store.state, cell)!)
                      }}</span>
                    </span>
                    <span class="evt-card-label">{{
                      unitName(actorAt(store.state, cell)!)
                    }}</span>
                    <span class="evt-health" aria-hidden="true">
                      <i
                        v-for="n in actorAt(store.state, cell)?.maxHp ?? 0"
                        :key="n"
                        :class="{
                          lost: n > (actorAt(store.state, cell)?.hp ?? 0),
                        }"
                      ></i>
                    </span>
                  </span>
                  <span
                    v-if="
                      store.hovered?.x === cell.x &&
                      store.hovered?.y === cell.y &&
                      store.movePossible
                    "
                    class="evt-crosshair"
                    aria-hidden="true"
                    >⌖</span
                  >
                </button>
              </div>
              <div class="evt-map-edge" aria-hidden="true">
                GRID 09 × 06 • ROOFTOP SIMULATION
              </div>
            </div>

            <div class="evt-briefing" aria-live="polite">
              <div class="evt-briefing-image" aria-hidden="true"></div>
              <div>
                <span class="evt-overline"
                  >{{ perspectiveLabel }} / MISSION BRIEF</span
                >
                <h2>{{ store.scene.headline }}</h2>
                <p class="pk-prose">{{ store.scene.opening }}</p>
              </div>
            </div>

            <div class="evt-statusbar" role="status">
              <strong>{{
                store.state.phase === 'active'
                  ? 'LIVE TRAINING'
                  : store.state.phase.toUpperCase()
              }}</strong>
              <span>{{ store.state.log }}</span>
            </div>
          </section>

          <aside class="evt-command" aria-label="Squad command panel">
            <div class="evt-panel-head">
              <span class="evt-overline"
                >FIELD CONTROL / TURN {{ store.state.turn }}</span
              >
              <span class="evt-signal">● COMMAND LINK</span>
            </div>

            <div class="evt-squad" aria-label="Squad members">
              <button
                v-for="unit in store.players"
                :key="unit.id"
                class="evt-squad-card"
                type="button"
                :class="{
                  active: store.state.selected === unit.id,
                  unavailable: unit.hp <= 0,
                }"
                :disabled="unit.hp <= 0"
                :aria-pressed="store.state.selected === unit.id"
                @click="store.select(unit.id)"
              >
                <span class="evt-squad-portrait">
                  <span aria-hidden="true">✦</span>
                  <b>{{ initials(unit) }}</b>
                </span>
                <span class="evt-squad-info">
                  <b>{{ unitName(unit) }}</b>
                  <small
                    >{{ personFor(unit).realName }} · {{ unit.hp }}/{{
                      unit.maxHp
                    }}
                    HP</small
                  >
                  <span class="evt-pips"
                    ><i :class="{ spent: unit.moved }"></i
                    ><i :class="{ spent: unit.fired }"></i
                  ></span>
                </span>
              </button>
            </div>

            <div class="evt-actions">
              <button
                type="button"
                class="evt-action"
                :class="{ chosen: store.mode === 'move' }"
                :aria-pressed="store.mode === 'move'"
                :disabled="store.state.phase !== 'active'"
                @click="store.setMode('move')"
              >
                <span class="evt-action-icon">↗</span>
                MOVE <small>M</small>
              </button>
              <button
                type="button"
                class="evt-action"
                :class="{ chosen: store.mode === 'fire' }"
                :aria-pressed="store.mode === 'fire'"
                :disabled="store.state.phase !== 'active'"
                @click="store.setMode('fire')"
              >
                <span class="evt-action-icon">⌖</span>
                FIRE <small>F</small>
              </button>
            </div>

            <div class="evt-odds" aria-live="polite" data-testid="tactics-odds">
              <span class="evt-overline"
                >TACTICAL INTEL /
                {{
                  store.mode === 'move' ? 'AFTER MOVEMENT' : 'CURRENT POSITION'
                }}</span
              >
              <div
                v-if="store.aimedTarget && store.aimedTarget.hit > 0"
                class="evt-chance"
              >
                <strong>{{ store.aimedTarget.hit }}<small>%</small></strong>
                <div>
                  <b>HIT PROBABILITY</b>
                  <span
                    >BASE {{ store.aimedTarget.aim }}% · RANGE
                    {{ store.aimedTarget.range }} · COVER −{{
                      store.aimedTarget.cover
                    }}%</span
                  >
                </div>
              </div>
              <div v-else class="evt-no-shot">◌ <span>NO CLEAR SHOT</span></div>
              <p>{{ store.previewLabel }}</p>
              <small class="evt-preview-note"
                >Training odds; full cover and elevation simulation follows in
                the combat engine.</small
              >
            </div>

            <div class="evt-command-foot">
              <button
                v-if="store.state.phase === 'active'"
                type="button"
                class="evt-end-turn"
                @click="store.nextTurn()"
              >
                END TURN <span>→</span>
              </button>
              <button
                v-else
                type="button"
                class="evt-end-turn"
                @click="store.reset()"
              >
                REPLAY FIRST BELL <span>↺</span>
              </button>
              <div class="evt-secondary">
                <button type="button" @click="store.reset()">RESTART</button>
                <span>SELECT • MOVE • FIRE • END TURN</span>
              </div>
            </div>
          </aside>
        </div>

        <footer class="evt-bottom">
          <div class="evt-perspectives" aria-label="Story viewpoint preview">
            <span class="evt-overline">WHOSE STORY?</span>
            <button
              v-for="entry in perspectives"
              :key="entry.value"
              type="button"
              :aria-pressed="store.perspective === entry.value"
              :class="{ chosen: store.perspective === entry.value }"
              @click="store.choosePerspective(entry.value)"
            >
              {{ entry.label }}
            </button>
          </div>
          <div class="evt-missions">
            <span>CAMPAIGN</span>
            <strong
              v-for="(mission, index) in missions"
              :key="mission"
              :title="mission"
              :class="{ current: index === 0 }"
            >
              {{ String(index + 1).padStart(2, '0') }}
            </strong>
          </div>
        </footer>

        <div
          v-if="store.rosterOpen"
          class="evt-roster"
          role="dialog"
          aria-modal="true"
          aria-label="Choose a Prom of Doom hero"
        >
          <header class="evt-roster-head">
            <div>
              <span class="evt-overline"
                >YEARBOOK / ALL 48 PERMANENT IDENTITIES</span
              >
              <h2>Choose your lead</h2>
              <p>Each student has one name and one story worth defending.</p>
            </div>
            <button
              type="button"
              aria-label="Close character dossier"
              @click="store.rosterOpen = false"
            >
              ✕
            </button>
          </header>
          <label class="evt-search">
            <span class="sr-only">Search heroes</span>
            <input
              v-model="store.rosterSearch"
              type="search"
              placeholder="Search codenames or names…"
            />
          </label>
          <div class="evt-roster-grid kr-scroll">
            <button
              v-for="person in visibleRoster"
              :key="person.signature"
              type="button"
              class="evt-roster-card"
              @click="store.chooseLead(person.signature)"
            >
              <span class="evt-roster-art" aria-hidden="true">
                <span>{{ person.hero.alias.slice(0, 2).toUpperCase() }}</span>
              </span>
              <strong>{{ person.hero.alias }}</strong>
              <small>{{ person.realName }}</small>
              <span class="evt-roster-type">{{
                person.signature.replace('-', ' / ').toUpperCase()
              }}</span>
            </button>
          </div>
        </div>
      </div>
    </PlaybookKitShell>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { EVERY_VILLAIN_TACTICS } from '~/utils/playbookKit/games/everyVillainTactics'
import {
  useEveryVillainTacticsStore,
  PERSPECTIVES,
} from '~/stores/everyVillainTacticsStore'
import {
  actorAt,
  boardCells,
  personFor,
  terrainAt,
  type Cell,
  type Unit,
} from '~/utils/everyVillainTactics/training'

const store = useEveryVillainTacticsStore()
const perspectives = Object.entries(PERSPECTIVES).map(([value, entry]) => ({
  value: value as keyof typeof PERSPECTIVES,
  label: entry.label,
}))
const missions = [
  'First Bell',
  'Science Wing Lockdown',
  'Crosswalk Crisis',
  'Rooftop Broadcast',
  'Under-Comet Breach',
  "Prom Night: Everybody's Villain",
]
const perspectiveLabel = computed(() => store.scene.label.toUpperCase())
const meterValues = computed(() => ({
  squad: store.players.reduce((total, unit) => total + unit.hp, 0),
  rivals: store.enemies.reduce((total, unit) => total + unit.hp, 0),
  round: store.state.turn,
}))
const visibleRoster = computed(() => {
  const q = store.rosterSearch.toLowerCase().trim()
  return store.roster.filter(
    (person) =>
      !q ||
      person.realName.toLowerCase().includes(q) ||
      person.hero.alias.toLowerCase().includes(q) ||
      person.signature.includes(q),
  )
})
function unitName(unit: Unit): string {
  return personFor(unit).hero.alias
}
function initials(unit: Unit): string {
  return unitName(unit).slice(0, 2).toUpperCase()
}
function cellDescription(cell: Cell) {
  const unit = actorAt(store.state, cell)
  if (unit)
    return unitName(unit) + ', ' + unit.team + ', ' + unit.hp + ' health'
  if (terrainAt(cell) === 'wall')
    return 'Wall at column ' + (cell.x + 1) + ', row ' + (cell.y + 1)
  return (
    'Tile ' +
    (cell.x + 1) +
    ', ' +
    (cell.y + 1) +
    (terrainAt(cell) === 'cover' ? ', cover' : '') +
    (store.cellStyle(cell).reachable ? ', reachable' : '')
  )
}
function onKey(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || store.rosterOpen) return
  const tag = (event.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (event.code === 'KeyM') store.setMode('move')
  else if (event.code === 'KeyF') store.setMode('fire')
  else if (event.code === 'KeyR') store.reset()
  else return
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.evt-console {
  --cream: #fff4d6;
  --electric: #82d2f7;
  --rose: #ff7d8c;
  position: relative;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: clamp(8px, 1.1cqw, 16px);
  color: var(--cream);
  background: radial-gradient(ellipse at 48% 0%, #402d61, #131b34 61%, #080e23);
  font-family: system-ui, sans-serif;
  overflow: hidden;
  container-type: inline-size;
}
.evt-overline {
  color: #b7b3dd;
  font-size: clamp(0.55rem, 0.65cqw, 0.71rem);
  font-weight: 900;
  letter-spacing: 0.18em;
  line-height: 1.3;
}
.evt-hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid #e6dcff27;
  padding-bottom: 8px;
}
.evt-brand .evt-title {
  font-weight: 1000;
  font-family: Impact, 'Arial Narrow', sans-serif;
  font-stretch: condensed;
  letter-spacing: 0.065em;
  line-height: 1;
  font-size: clamp(1.3rem, 3.1cqw, 2.6rem);
  text-shadow: 0 2px 14px #000a;
}
.evt-brand em {
  font-style: normal;
  color: var(--rose);
}
.evt-subtitle {
  color: #d3bbdf;
  font-size: clamp(0.54rem, 0.75cqw, 0.7rem);
  font-weight: 800;
  letter-spacing: 0.1em;
}
.evt-hud-side {
  display: flex;
  align-items: center;
  gap: 9px;
}
.evt-mission-pill {
  background: #f57564;
  color: #21172b;
  border-radius: 4px;
  padding: 7px 9px;
  font: 900 13px/1 system-ui;
  white-space: nowrap;
}
.evt-outline {
  color: #f4e4fd;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  border: 1px solid #b3a3da66;
  padding: 9px;
  border-radius: 7px;
  white-space: nowrap;
  background: #171a32b0;
}
.evt-outline:hover,
.evt-outline:focus-visible {
  border-color: #f5b0d0;
  background: #3e385c;
}
.evt-deck {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(205px, 23cqw, 305px);
  gap: 10px;
  flex: 1;
  min-height: 0;
}
.evt-arena {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #c5c5fe50;
  border-radius: 12px;
  background: #141c36;
}
.evt-map-backdrop {
  position: absolute;
  inset: 0;
  opacity: 0.42;
  background: url('/comet-city-academy/front/splash.webp') center center/cover;
}
.evt-map-glow {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, #0d1325bf 0%, #12182a44 30%, #10152ad9 100%),
    radial-gradient(ellipse at 50% 58%, transparent, #090e22ce 90%);
}
.evt-stage-label {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
  padding: 10px 12px 0;
}
.evt-objective {
  font-weight: 900;
  color: #fff5cf;
  font-size: clamp(0.65rem, 0.75cqw, 0.82rem);
}
.evt-grid-wrap {
  position: relative;
  z-index: 2;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3px 9px 0;
}
.evt-map {
  position: relative;
  width: min(100%, calc(54vh * 1.5));
  max-height: 100%;
  aspect-ratio: 9 / 6;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  grid-template-rows: repeat(6, minmax(0, 1fr));
  isolation: isolate;
  transform: perspective(1100px) rotateX(8deg);
  filter: drop-shadow(0 18px 18px #0009);
  border: 2px solid #f8d19c64;
  box-shadow: 0 0 38px #75b9f027;
}
.evt-tile {
  display: grid;
  place-items: center;
  position: relative;
  min-width: 0;
  min-height: 0;
  padding: 1px;
  background: linear-gradient(145deg, #2b315bae, #263457c4);
  border: 1px solid #94cceb46;
  box-shadow: inset 0 -5px 0 #0711242b;
  cursor: crosshair;
  overflow: visible;
}
.evt-tile:nth-child(even) {
  background: linear-gradient(145deg, #353b67cc, #26324ccf);
}
.evt-tile.reachable {
  background: linear-gradient(140deg, #22476cdd, #2e5b7ba9);
  box-shadow:
    inset 0 0 0 2px #76c7ffb7,
    0 0 8px #85baff42;
  z-index: 1;
}
.evt-tile.selected {
  outline: 2px solid #ffe090;
  outline-offset: -3px;
  z-index: 4;
}
.evt-tile.sightline {
  outline: 3px solid #ffb9a0;
  outline-offset: -3px;
  z-index: 5;
}
.evt-tile:focus-visible {
  outline: 3px solid white;
  outline-offset: -3px;
  z-index: 7;
}
.evt-cover {
  width: 78%;
  height: 35%;
  align-self: end;
  margin-bottom: 4%;
  border: 2px solid #d2a479ad;
  border-radius: 3px;
  background: repeating-linear-gradient(60deg, #a8806a 0 7px, #67495a 7px 13px);
  box-shadow: 2px -4px 5px #0008;
}
.evt-wall {
  width: 90%;
  height: 94%;
  background: linear-gradient(35deg, #534a62, #a4a9ba);
  border: 2px solid #d5cbd1;
  box-shadow: 4px -3px 0 #242137;
  clip-path: polygon(0 14%, 90% 0, 100% 80%, 8% 100%);
}
.evt-crosshair {
  position: absolute;
  bottom: 3px;
  right: 4px;
  color: #fff5cb;
  text-shadow: 0 0 9px #04acf9;
  font-size: 1.1rem;
}
.evt-standee {
  position: absolute;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  width: 88%;
  height: 145%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  pointer-events: none;
  filter: drop-shadow(0 6px 4px #070d1c);
  transition: transform 0.25s ease;
}
.evt-tile:hover .evt-standee,
.evt-tile.selected .evt-standee {
  transform: translateX(-50%) translateY(-9%) scale(1.07);
}
.evt-card-art {
  border: 2px solid #b4e7ff;
  border-radius: 6px 6px 2px 2px;
  display: flex;
  flex: 1;
  width: 86%;
  position: relative;
  min-height: 0;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at 45% 25%, #abe5ef88, transparent 60%),
    linear-gradient(135deg, #33647d, #1b2c5b);
  box-shadow:
    inset 0 0 10px #8de2ff44,
    0 1px 8px #000b;
  transform: skewY(-2deg);
}
.evt-rival .evt-card-art {
  border-color: #ffbabb;
  background:
    radial-gradient(ellipse at 45% 25%, #ffc7a588, transparent 60%),
    linear-gradient(135deg, #a94a69, #36223f);
}
.evt-crest {
  position: absolute;
  top: 0;
  left: 4%;
  color: #ffe8ab;
  font-size: clamp(0.4rem, 0.7cqw, 0.8rem);
}
.evt-initials {
  font-family: Impact, 'Arial Narrow', sans-serif;
  color: #fff4e1;
  text-shadow: 2px 3px 0 #0009;
  font-size: clamp(0.63rem, 1.9cqw, 1.6rem);
  letter-spacing: 0.08em;
}
.evt-card-label {
  width: 100%;
  background: #0b1638ee;
  border: 1px solid #9bcde2;
  color: #f8f4f1;
  padding: 0 1px;
  font-size: clamp(0.34rem, 0.65cqw, 0.63rem);
  text-align: center;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.evt-rival .evt-card-label {
  border-color: #ffbabb;
  background: #4c2639;
}
.evt-health {
  display: flex;
  justify-content: center;
  gap: 2px;
  height: 4px;
  margin-top: 2px;
}
.evt-health i {
  display: block;
  width: 9px;
  max-width: 15%;
  background: #a0e9a1;
  box-shadow: 0 0 4px #a2ffc6;
}
.evt-health i.lost {
  background: #4a495a;
  box-shadow: none;
}
.evt-map-edge {
  text-align: center;
  padding-top: 4px;
  font-size: 0.54rem;
  color: #b7aac9;
  letter-spacing: 0.15em;
}
.evt-briefing {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 10px;
  min-height: 76px;
  max-height: 103px;
  border-top: 1px solid #e4d3fd24;
  padding: 7px 12px;
  background: #10162bd9;
  overflow: hidden;
}
.evt-briefing-image {
  width: 86px;
  flex: none;
  border: 1px solid #cdb89c6c;
  border-radius: 4px;
  background: url('/comet-city-academy/front/tutorial.webp') center/cover;
}
.evt-briefing h2 {
  font: 900 clamp(0.86rem, 1.3cqw, 1.28rem)/1.1 system-ui;
  color: #ffdf9b;
}
.evt-briefing p {
  font-size: clamp(0.64rem, 0.82cqw, 0.83rem);
  line-height: 1.4;
  opacity: 0.9;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.evt-statusbar {
  display: flex;
  position: relative;
  z-index: 2;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  background: #172540f0;
  border-top: 1px solid #e3faff39;
  font-size: clamp(0.64rem, 0.7cqw, 0.78rem);
  min-height: 30px;
}
.evt-statusbar strong {
  color: #a7eecb;
  white-space: nowrap;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
}
.evt-statusbar span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.evt-command {
  border: 1px solid #bbcbed50;
  min-height: 0;
  padding: 10px;
  border-radius: 12px;
  background: linear-gradient(150deg, #242e4a, #10172d);
  display: flex;
  flex-direction: column;
  gap: 9px;
  box-shadow: inset 0 1px 2px #fff2;
}
.evt-panel-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}
.evt-signal {
  color: #a1efcb;
  font-size: 0.55rem;
  font-weight: 900;
  white-space: nowrap;
  letter-spacing: 0.07em;
}
.evt-squad {
  display: grid;
  gap: 4px;
  min-height: 0;
  flex-shrink: 1;
  overflow: auto;
}
.evt-squad-card {
  display: flex;
  min-height: 53px;
  align-items: center;
  gap: 7px;
  width: 100%;
  text-align: left;
  padding: 4px;
  border: 1px solid #5e73967d;
  border-radius: 7px;
  background: #171f39d9;
  color: #fff3db;
}
.evt-squad-card.active {
  border-color: #f6d483;
  background: #374160;
  box-shadow: inset 3px 0 #ffd67d;
}
.evt-squad-card.unavailable {
  opacity: 0.45;
}
.evt-squad-portrait {
  display: grid;
  place-items: center;
  position: relative;
  flex: 0 0 44px;
  height: 44px;
  background: linear-gradient(135deg, #337c94, #353464);
  border: 1px solid #a1d9f0;
  border-radius: 5px;
  overflow: hidden;
}
.evt-squad-portrait b {
  font-family: Impact, 'Arial Narrow', sans-serif;
  font-size: 1.2rem;
  letter-spacing: 0.05em;
}
.evt-squad-portrait > span {
  position: absolute;
  left: 3px;
  top: 0;
  font-size: 0.6rem;
  color: #fee9a8;
}
.evt-squad-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.evt-squad-info b {
  font-size: 0.82rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.evt-squad-info small {
  font-size: 0.6rem;
  color: #d4cde9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.evt-pips {
  display: flex;
  gap: 3px;
  margin-top: 3px;
}
.evt-pips i {
  width: 13px;
  height: 4px;
  border-radius: 3px;
  background: #74d3ff;
}
.evt-pips i.spent {
  background: #52526c;
}
.evt-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}
.evt-action {
  color: #ecf7ff;
  background: #273856;
  border: 1px solid #7897c4;
  border-radius: 7px;
  padding: 8px 4px;
  font-weight: 900;
  font-size: 0.74rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}
.evt-action.chosen {
  color: #151d34;
  background: #a8e9fb;
  border-color: #fff4c9;
}
.evt-action:disabled {
  opacity: 0.4;
}
.evt-action-icon {
  font-size: 1.05rem;
}
.evt-action small {
  opacity: 0.65;
}
.evt-odds {
  border: 1px solid #e5ca9259;
  background: linear-gradient(145deg, #313354, #272337);
  border-radius: 7px;
  padding: 9px;
  min-height: 114px;
}
.evt-chance {
  display: flex;
  gap: 8px;
  align-items: center;
}
.evt-chance strong {
  font:
    900 clamp(1.5rem, 2.5cqw, 2.8rem)/1 Impact,
    sans-serif;
  color: #aef3da;
}
.evt-chance strong small {
  font-size: 0.55em;
}
.evt-chance div {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.66rem;
}
.evt-chance div span {
  color: #cfc9e4;
  font-size: 0.58rem;
}
.evt-no-shot {
  color: #a6b6cb;
  font: 800 1rem system-ui;
  padding: 8px 0;
}
.evt-odds p {
  font-size: 0.66rem;
  color: #fff2db;
}
.evt-preview-note {
  display: block;
  color: #b9afd0;
  font-size: 0.57rem;
  line-height: 1.35;
  margin-top: 4px;
}
.evt-command-foot {
  margin-top: auto;
  display: grid;
  gap: 7px;
}
.evt-end-turn {
  padding: 10px 12px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  color: #161e35;
  background: linear-gradient(90deg, #f6bc71, #ffe1ac);
  font-size: 0.83rem;
  font-weight: 950;
  letter-spacing: 0.08em;
}
.evt-secondary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 5px;
  font-size: 0.52rem;
  color: #bfc2dc;
  letter-spacing: 0.07em;
}
.evt-secondary button {
  border-bottom: 1px solid #bfc2dc;
  color: #f5dbda;
  font-weight: 900;
}
.evt-bottom {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 16px;
  min-height: 28px;
}
.evt-perspectives {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}
.evt-perspectives button {
  padding: 5px 8px;
  border-radius: 4px;
  border: 1px solid #686584;
  background: #1c2540;
  font-size: 0.6rem;
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 0.03em;
}
.evt-perspectives button.chosen {
  border-color: #ffbe91;
  background: #d68584;
  color: #16172f;
}
.evt-missions {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #aab6d3;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
}
.evt-missions strong {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1px solid #566789;
  border-radius: 4px;
  opacity: 0.45;
}
.evt-missions strong.current {
  background: #eabe8d;
  color: #1b1a32;
  opacity: 1;
}
.evt-roster {
  position: absolute;
  z-index: 30;
  inset: 5px;
  background: linear-gradient(150deg, #162344f8, #231930fc);
  border: 1px solid #f9cc9aa8;
  border-radius: 10px;
  box-shadow: 0 0 50px #000b;
  display: flex;
  flex-direction: column;
  padding: clamp(12px, 2cqw, 23px);
  min-height: 0;
  gap: 10px;
}
.evt-roster-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.evt-roster-head h2 {
  font:
    900 clamp(1.3rem, 2.6cqw, 2.2rem) Impact,
    sans-serif;
  letter-spacing: 0.04em;
}
.evt-roster-head p {
  font-size: 0.77rem;
  color: #e2d1e9;
}
.evt-roster-head button {
  padding: 8px 12px;
  border: 1px solid #f1bfd0;
  border-radius: 7px;
  background: #342c50;
  font-weight: 900;
}
.evt-search {
  display: flex;
}
.evt-search input {
  width: 100%;
  padding: 11px;
  border: 1px solid #6a7da7;
  background: #0b1634;
  border-radius: 7px;
  color: white;
  outline-offset: 3px;
}
.evt-roster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  align-content: start;
  gap: 9px;
  min-height: 0;
  overflow-y: auto;
}
.evt-roster-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: left;
  border: 1px solid #a699be66;
  border-radius: 7px;
  overflow: hidden;
  background: #253151;
}
.evt-roster-card:hover,
.evt-roster-card:focus-visible {
  border-color: #ffd592;
  transform: translateY(-2px);
}
.evt-roster-art {
  height: 80px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(ellipse at 55% 0%, #ffaabcaa, transparent 70%),
    linear-gradient(145deg, #4c6585, #313457);
}
.evt-roster-art span {
  font:
    900 2.7rem Impact,
    sans-serif;
  color: #ffeec6;
  text-shadow: 2px 4px 0 #122039;
}
.evt-roster-card strong {
  font-size: 0.8rem;
  padding: 5px 8px 0;
}
.evt-roster-card small {
  font-size: 0.68rem;
  padding: 0 8px;
  color: #c7e1f2;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.evt-roster-type {
  margin-top: auto;
  padding: 5px 8px 8px;
  font-size: 0.53rem;
  color: #b9a6c6;
  letter-spacing: 0.05em;
}
@container (max-width: 760px) {
  .evt-console {
    gap: 5px;
    padding: 7px;
  }
  .evt-deck {
    display: flex;
    flex-direction: column;
  }
  .evt-arena {
    flex: 1;
    min-height: 0;
  }
  .evt-map {
    width: min(100%, calc(45vh * 1.5));
  }
  .evt-command {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 1fr;
    grid-template-rows: auto auto auto;
    gap: 5px;
    flex-shrink: 0;
    padding: 6px;
  }
  .evt-panel-head {
    grid-column: 1/-1;
  }
  .evt-squad {
    grid-row: 2 / span 2;
    grid-column: 1;
    display: flex;
    gap: 4px;
    overflow: auto;
  }
  .evt-squad-card {
    min-width: 72px;
    flex-direction: column;
    text-align: center;
    padding: 2px;
    min-height: 0;
  }
  .evt-squad-portrait {
    height: 30px;
    flex-basis: 30px;
    width: 30px;
  }
  .evt-squad-info b {
    font-size: 0.55rem;
  }
  .evt-squad-info small {
    display: none;
  }
  .evt-pips {
    justify-content: center;
  }
  .evt-actions {
    grid-column: 2;
    grid-row: 2;
    align-self: end;
  }
  .evt-odds {
    display: none;
  }
  .evt-command-foot {
    grid-column: 2;
    grid-row: 3;
    margin-top: 0;
  }
  .evt-secondary {
    display: none;
  }
  .evt-briefing {
    max-height: 66px;
    min-height: 56px;
    padding: 4px 7px;
  }
  .evt-briefing-image {
    width: 48px;
  }
  .evt-briefing h2 {
    font-size: 0.78rem;
  }
  .evt-briefing p {
    -webkit-line-clamp: 2;
    font-size: 0.61rem;
  }
  .evt-stage-label {
    padding: 5px 7px 0;
  }
  .evt-objective {
    display: none;
  }
  .evt-subtitle {
    display: none;
  }
  .evt-bottom {
    justify-content: center;
  }
  .evt-missions {
    display: none;
  }
  .evt-perspectives button {
    padding: 3px 5px;
  }
  .evt-panel-head .evt-signal {
    display: none;
  }
}
@container (max-width: 430px) {
  .evt-map {
    width: min(100%, calc(38vh * 1.5));
  }
  .evt-hud-side {
    gap: 4px;
  }
  .evt-outline {
    padding: 6px;
    font-size: 0.55rem;
  }
  .evt-mission-pill {
    padding: 5px;
    font-size: 0.65rem;
  }
  .evt-briefing-image {
    display: none;
  }
  .evt-stage-label .evt-overline {
    font-size: 0.52rem;
  }
  .evt-statusbar span {
    max-width: 70vw;
  }
}
@media (prefers-reduced-motion: reduce) {
  .evt-standee,
  .evt-roster-card {
    transition: none;
  }
  .evt-tile:hover .evt-standee,
  .evt-tile.selected .evt-standee {
    transform: translateX(-50%);
  }
}
</style>
