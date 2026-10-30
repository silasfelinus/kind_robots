<template>
  <main
    class="kr-surface relative h-full min-h-0 overflow-hidden gap-0"
    data-layout="console-fixed"
    data-testid="every-villain-tactics"
    aria-label="Every Villain Tactics training console"
  >
    <PlaybookKitShell :spec="EVERY_VILLAIN_TACTICS" :meter-values="meterValues">
      <div
        class="evt-console"
        :data-anim="store.settings.animation"
        :style="{ '--evt-anim': String(store.animationFactor) }"
      >
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
            <button
              class="evt-outline"
              type="button"
              data-testid="tactics-open-menu"
              @click="store.openScreen('title')"
            >
              ☰ MENU
            </button>
            <span class="evt-mission-pill">{{
              store.isPlaytest ? 'STUDIO TEST' : '01 / 06'
            }}</span>
            <button
              v-if="store.isPlaytest"
              class="evt-outline"
              type="button"
              data-testid="tactics-exit-playtest"
              @click="store.exitPlaytest()"
            >
              EXIT TEST
            </button>
            <button
              class="evt-outline"
              type="button"
              data-testid="tactics-open-studio"
              @click="store.studioOpen = true"
            >
              LEVEL STUDIO
            </button>
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
              <span class="evt-overline">{{
                store.isPlaytest
                  ? store.draft.venue.toUpperCase()
                  : 'COMET CITY ACADEMY / AUDITORIUM APPROACH'
              }}</span>
              <span class="evt-objective"
                >OBJECTIVE: {{ store.scene.headline }}</span
              >
              <span
                v-if="store.ruleLine"
                class="evt-rule-line"
                data-testid="tactics-rule-line"
                >{{ store.ruleLine }}</span
              >
            </div>

            <div class="evt-grid-wrap">
              <div
                class="evt-map"
                role="group"
                aria-label="Nine by six tactical grid"
              >
                <button
                  v-for="cell in store.boardCells"
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
                    v-if="store.isSeismicWarning(cell)"
                    class="evt-seismic-ring"
                    data-testid="tactics-seismic-warning"
                    aria-hidden="true"
                    >⚠</span
                  >
                  <span
                    v-if="store.civilianAt(cell)"
                    class="evt-civilian"
                    :class="'is-' + store.civilianAt(cell)!.status"
                    data-testid="tactics-civilian"
                    aria-hidden="true"
                    >{{
                      store.civilianAt(cell)!.status === 'lost' ? '✕' : '☺'
                    }}</span
                  >
                  <span
                    v-if="store.isPhaseWarning(cell)"
                    class="evt-phase-ring"
                    data-testid="tactics-phase-warning"
                    aria-hidden="true"
                    >◷</span
                  >
                  <span
                    v-if="store.isBurrowWarning(cell)"
                    class="evt-burrow-ring"
                    data-testid="tactics-burrow-warning"
                    aria-hidden="true"
                    >◉</span
                  >
                  <span
                    v-if="store.tileInfoAt(cell) === 'cover'"
                    class="evt-cover"
                    aria-hidden="true"
                  ></span>
                  <span
                    v-if="store.tileInfoAt(cell) === 'wall'"
                    class="evt-wall"
                    aria-hidden="true"
                  ></span>
                  <span
                    v-if="store.heightAt(cell) > 0"
                    class="evt-height"
                    aria-hidden="true"
                    >▲{{ store.heightAt(cell) }}</span
                  >
                  <span
                    v-if="fieldGlyph(cell)"
                    class="evt-field-mark"
                    data-testid="tactics-field-mark"
                    aria-hidden="true"
                    >{{ fieldGlyph(cell) }}</span
                  >
                  <span
                    v-if="store.threatAt(cell)"
                    class="evt-threat-mark"
                    data-testid="tactics-threat"
                    aria-hidden="true"
                    >👁{{ store.threatAt(cell) }}</span
                  >
                  <span
                    v-if="displayUnitAt(store.state, cell)"
                    :key="
                      displayUnitAt(store.state, cell)!.id +
                      '-' +
                      (store.state.impact?.target ===
                        displayUnitAt(store.state, cell)!.id ||
                      store.state.impact?.attacker ===
                        displayUnitAt(store.state, cell)!.id
                        ? store.state.impact?.serial
                        : 0)
                    "
                    class="evt-standee"
                    :class="{
                      'evt-friendly':
                        displayUnitAt(store.state, cell)?.team === 'squad',
                      'evt-rival':
                        displayUnitAt(store.state, cell)?.team === 'rival',
                      'evt-fallen': displayUnitAt(store.state, cell)?.hp === 0,
                      'evt-impact-hit':
                        store.state.impact?.target ===
                          displayUnitAt(store.state, cell)?.id &&
                        store.state.impact?.hit === true,
                      'evt-impact-miss':
                        store.state.impact?.target ===
                          displayUnitAt(store.state, cell)?.id &&
                        store.state.impact?.hit === false,
                      'evt-impact-strike':
                        store.state.impact?.attacker ===
                        displayUnitAt(store.state, cell)?.id,
                    }"
                  >
                    <span class="evt-card-art">
                      <span class="evt-crest" aria-hidden="true">{{
                        displayUnitAt(store.state, cell)?.lieutenantName
                          ? '◆'
                          : displayUnitAt(store.state, cell)?.henchmanType ===
                              'burrow'
                            ? '♢'
                            : '✦'
                      }}</span>
                      <span class="evt-initials">{{
                        initials(displayUnitAt(store.state, cell)!)
                      }}</span>
                    </span>
                    <span class="evt-card-label">{{
                      unitName(displayUnitAt(store.state, cell)!)
                    }}</span>
                    <span class="evt-health" aria-hidden="true">
                      <i
                        v-for="n in displayUnitAt(store.state, cell)?.maxHp ??
                        0"
                        :key="n"
                        :class="{
                          lost: n > (displayUnitAt(store.state, cell)?.hp ?? 0),
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
                GRID 09 × 06 •
                {{
                  store.isPlaytest
                    ? store.draft.title.toUpperCase()
                    : 'ROOFTOP SIMULATION'
                }}
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
                    HP · {{ unit.ap }} AP</small
                  >
                  <small
                    v-if="unit.role"
                    class="evt-role"
                    data-testid="tactics-role"
                    >{{ roleLine(unit) }}</small
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

            <button
              v-if="store.activePower"
              type="button"
              class="evt-power"
              data-testid="tactics-power"
              :class="{ chosen: store.mode === 'power' }"
              :aria-pressed="store.mode === 'power'"
              :disabled="store.state.phase !== 'active' || !!store.powerStatus"
              :title="store.activePower.rules"
              @click="store.setMode('power')"
            >
              <span class="evt-power-head">
                <span class="evt-action-icon" aria-hidden="true">✷</span>
                <b>{{ store.activePower.name.toUpperCase() }}</b>
                <small>P</small>
              </span>
              <span class="evt-power-meta"
                >{{ store.activePower.ap }} AP ·
                {{
                  store.activePower.cooldown
                    ? 'RECHARGE ' + store.activePower.cooldown
                    : 'ONCE PER BATTLE'
                }}
                ·
                {{ store.powerStatus ?? 'READY' }}</span
              >
            </button>

            <button
              v-if="store.civilianCounts"
              type="button"
              class="evt-rescue"
              data-testid="tactics-rescue"
              :disabled="!store.canRescue"
              @click="store.rescue()"
            >
              ☺ EVACUATE <small>E</small>
              <span
                >{{ store.civilianCounts.rescued }} safe ·
                {{ store.civilianCounts.waiting }} waiting ·
                {{ store.civilianCounts.lost }} lost</span
              >
            </button>

            <div class="evt-defenses" aria-label="Reaction and defense actions">
              <button
                type="button"
                class="evt-defense"
                :disabled="
                  store.state.phase !== 'active' ||
                  !store.active ||
                  store.active.ap < 1 ||
                  store.active.fired
                "
                @click="store.overwatch()"
              >
                ⌖ OVERWATCH <small>O</small>
              </button>
              <button
                type="button"
                class="evt-defense"
                :disabled="
                  store.state.phase !== 'active' ||
                  !store.active ||
                  store.active.ap < 1 ||
                  store.active.statuses.includes('guarded')
                "
                @click="store.hunker()"
              >
                ▣ HUNKER <small>H</small>
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
                v-if="store.mode === 'power' && store.activePower"
                class="evt-power-preview"
                data-testid="tactics-power-preview"
              >
                <b>{{ store.activePower.name }}</b>
                <span class="evt-power-source"
                  >{{ store.activePower.source }} ·
                  {{ roleLabel(store.activePower.role) }}</span
                >
                <p>{{ store.activePower.rules }}</p>
                <p class="evt-power-flavor">{{ store.activePower.flavor }}</p>
                <ul v-if="store.powerPreview" aria-label="Previewed effects">
                  <li v-if="store.powerPreview.chance !== null">
                    Strike chance {{ store.powerPreview.chance }}% (seeded roll)
                  </li>
                  <li
                    v-for="effect in store.powerPreview.effects"
                    :key="effect.id"
                    :class="'evt-effect-' + effect.side"
                  >
                    {{ effectLine(effect) }}
                  </li>
                  <li v-if="!store.powerPreview.effects.length">
                    No one is affected from this target.
                  </li>
                </ul>
              </div>
              <div
                v-else-if="store.aimedTarget && store.aimedTarget.hit > 0"
                class="evt-chance"
              >
                <strong>{{ store.aimedTarget.hit }}<small>%</small></strong>
                <div>
                  <b>HIT PROBABILITY</b>
                  <span
                    >BASE {{ store.aimedTarget.aim }}% · RANGE
                    {{ store.aimedTarget.range }} (−{{
                      store.aimedTarget.rangePenalty
                    }}) · COVER −{{ store.aimedTarget.cover }} · HEIGHT
                    {{ store.aimedTarget.elevation >= 0 ? '+' : ''
                    }}{{ store.aimedTarget.elevation }} · FLANK +{{
                      store.aimedTarget.flank
                    }}
                    · STATUS −{{
                      store.aimedTarget.suppressed + store.aimedTarget.guarded
                    }}
                    · DEFENSE −{{ store.aimedTarget.defense }} · MARKED +{{
                      store.aimedTarget.marked
                    }}
                  </span>
                </div>
              </div>
              <div v-else class="evt-no-shot">◌ <span>NO CLEAR SHOT</span></div>
              <p>{{ store.previewLabel }}</p>
              <div
                v-if="store.projectedTargets.length"
                class="evt-target-list"
                aria-label="Visible targets with chance from the previewed position"
                data-testid="tactics-visible-targets"
              >
                <span
                  v-for="target in store.projectedTargets"
                  :key="target.target"
                  class="evt-target-chip"
                >
                  {{ targetName(target.target) }} {{ target.hit }}%
                </span>
              </div>
              <p
                v-if="store.hoverThreat.length"
                class="evt-threat-line"
                data-testid="tactics-threat-preview"
              >
                Exposed here:
                {{
                  store.hoverThreat
                    .map(
                      (shot) =>
                        shooterName(shot.shooter) + ' ' + shot.hit + '%',
                    )
                    .join(' · ')
                }}
              </p>
              <small class="evt-preview-note"
                >Exact seeded odds. A dash spends both AP; overwatch reacts once
                to enemy movement.</small
              >
            </div>

            <div class="evt-command-foot">
              <button
                v-if="store.state.phase === 'active'"
                type="button"
                class="evt-end-turn"
                :class="{ 'is-armed': store.endTurnArmed }"
                data-testid="tactics-end-turn"
                @click="store.requestEndTurn()"
              >
                {{ store.endTurnArmed ? 'CONFIRM END TURN' : 'END TURN' }}
                <span>{{ store.endTurnArmed ? '✓' : '→' }}</span>
              </button>
              <button
                v-else
                type="button"
                class="evt-end-turn"
                @click="store.reset()"
              >
                {{ store.isPlaytest ? 'REPLAY TEST' : 'REPLAY FIRST BELL' }}
                <span>↺</span>
              </button>
              <div
                class="evt-saves"
                aria-label="Save slots"
                data-testid="tactics-saves"
              >
                <button
                  type="button"
                  class="evt-continue"
                  data-testid="tactics-continue"
                  :disabled="!store.canContinue"
                  @click="store.continueLatest()"
                >
                  CONTINUE ▸
                </button>
                <div
                  v-for="entry in store.saveSlots"
                  :key="entry.slot"
                  class="evt-save-slot"
                  data-testid="tactics-save-slot"
                >
                  <span class="evt-save-name">{{
                    entry.slot === 'auto'
                      ? 'AUTO'
                      : entry.slot.replace('slot-', 'SLOT ')
                  }}</span>
                  <small v-if="entry.summary"
                    >{{
                      entry.summary.mode === 'story' ? 'Story' : 'One-shot'
                    }}
                    · {{ entry.summary.title }} · {{ entry.summary.lead }} · R{{
                      entry.summary.turn
                    }}</small
                  >
                  <small v-else-if="entry.problem" class="evt-save-problem"
                    >Refused: {{ entry.problem }}</small
                  >
                  <small v-else>Empty</small>
                  <button
                    v-if="entry.slot !== 'auto'"
                    type="button"
                    @click="store.saveTo(entry.slot)"
                  >
                    SAVE
                  </button>
                  <button
                    type="button"
                    :disabled="!entry.summary"
                    @click="store.loadFrom(entry.slot)"
                  >
                    LOAD
                  </button>
                </div>
                <small v-if="store.saveMessage" role="status">{{
                  store.saveMessage
                }}</small>
              </div>
              <div class="evt-secondary">
                <button type="button" @click="store.reset()">RESTART</button>
                <span>SELECT • MOVE • FIRE • POWER • OVERWATCH</span>
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
          <div v-if="!store.isPlaytest" class="evt-missions">
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

        <section
          v-if="store.studioOpen"
          class="evt-studio"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evt-studio-title"
          data-testid="tactics-stage-studio"
        >
          <header class="evt-studio-header">
            <div>
              <span class="evt-overline">COMET CITY / MISSION WORKSHOP</span>
              <h2 id="evt-studio-title">THE STAGE STUDIO</h2>
              <div class="evt-studio-panes" aria-label="Studio pane">
                <button
                  type="button"
                  :aria-pressed="store.studioPane === 'map'"
                  data-testid="studio-pane-map"
                  @click="store.studioPane = 'map'"
                >
                  MAP
                </button>
                <button
                  type="button"
                  :aria-pressed="store.studioPane === 'scenes'"
                  data-testid="studio-pane-scenes"
                  @click="store.studioPane = 'scenes'"
                >
                  SCENES ({{ store.draft.script?.scenes.length ?? 0 }})
                </button>
              </div>
              <p>
                Paint terrain, place teams and test real tactical sightlines.
              </p>
            </div>
            <button
              type="button"
              class="evt-outline"
              @click="store.studioOpen = false"
            >
              CLOSE ✕
            </button>
          </header>
          <div class="evt-studio-body">
            <div class="evt-studio-tools">
              <label class="evt-studio-label" for="evt-preset"
                >STAGE STARTER</label
              >
              <select
                id="evt-preset"
                :value="store.draft.id"
                @change="
                  store.loadPreset(($event.target as HTMLSelectElement).value)
                "
              >
                <option
                  v-for="preset in store.STAGE_PRESETS"
                  :key="preset.id"
                  :value="preset.id"
                >
                  {{ preset.title }}
                </option>
              </select>
              <span class="evt-studio-label">TERRAIN BRUSH</span>
              <div class="evt-brushes">
                <button
                  v-for="brush in studioBrushes"
                  :key="brush.value"
                  type="button"
                  :aria-pressed="store.studioBrush === brush.value"
                  :class="{ chosen: store.studioBrush === brush.value }"
                  @click="store.studioBrush = brush.value"
                >
                  {{ brush.label }}
                </button>
              </div>
              <small
                >Team brushes reposition the lead squadmate or lead rival. Props
                break after their HP in shots; fire spreads one tile a round,
                water is live on even rounds, weak floors fall on their round.
                Secret and ⚡ hazard markers stay editor-only.</small
              >
            </div>
            <div v-if="store.studioPane === 'scenes'" class="evt-studio-canvas">
              <EveryVillainSceneEditor />
            </div>
            <div v-else class="evt-studio-canvas">
              <div
                class="evt-studio-board"
                role="group"
                aria-label="Editable nine by six stage map"
              >
                <button
                  v-for="cell in studioCells"
                  :key="cell.x + '-' + cell.y"
                  type="button"
                  class="evt-studio-cell"
                  :class="{
                    wall: !!store.draft.map.tiles[cell.x + ',' + cell.y]?.wall,
                    cover:
                      !!store.draft.map.tiles[cell.x + ',' + cell.y]?.cover,
                    raised:
                      !!store.draft.map.tiles[cell.x + ',' + cell.y]?.elevation,
                  }"
                  :aria-label="studioCellLabel(cell)"
                  :data-testid="'studio-cell-' + cell.x + '-' + cell.y"
                  @click="store.paintCell(cell)"
                >
                  <span v-if="studioSpawnAt(cell)" class="evt-studio-unit">{{
                    studioSpawnAt(cell)
                  }}</span>
                  <span
                    v-else-if="studioRuleGlyph(cell)"
                    data-testid="studio-rule-mark"
                    >{{ studioRuleGlyph(cell) }}</span
                  >
                  <span
                    v-else-if="
                      store.draft.map.tiles[cell.x + ',' + cell.y]?.wall
                    "
                    >▩</span
                  >
                  <span
                    v-else-if="
                      store.draft.map.tiles[cell.x + ',' + cell.y]?.cover
                    "
                    >▤</span
                  >
                  <span
                    v-else-if="
                      store.draft.secrets.some(
                        (p) => p.x === cell.x && p.y === cell.y,
                      )
                    "
                    >✦</span
                  >
                  <span
                    v-else-if="
                      store.draft.hazards.some(
                        (p) => p.x === cell.x && p.y === cell.y,
                      )
                    "
                    >⚡</span
                  >
                  <span
                    v-else-if="
                      store.draft.civilians?.some(
                        (p) => p.x === cell.x && p.y === cell.y,
                      )
                    "
                    data-testid="studio-civilian"
                    >☺</span
                  >
                  <span
                    v-else-if="
                      store.draft.map.tiles[cell.x + ',' + cell.y]?.elevation
                    "
                    >▲</span
                  >
                  <span v-else>·</span>
                </button>
              </div>
              <div class="evt-studio-legend">
                ▩ wall · ▤ directional cover · ▲ elevation · ✦ secret · ⚡
                hazard marker · ▢/▣ breakable prop · 🔥 fire · ≈ live water · ⌇
                weak floor · ⇣ wave hatch · ⚑ hold zone · S/R spawns
              </div>
            </div>
            <div class="evt-studio-details">
              <label class="evt-studio-label" for="evt-title"
                >MISSION TITLE</label
              >
              <input
                id="evt-title"
                v-model="store.draft.title"
                maxlength="80"
              />
              <label class="evt-studio-label" for="evt-objective"
                >VICTORY BRIEF</label
              >
              <textarea
                id="evt-objective"
                v-model="store.draft.objective"
                rows="3"
                maxlength="280"
              ></textarea>
              <label class="evt-studio-label" for="evt-timer">TURN LIMIT</label>
              <select id="evt-timer" v-model="store.draft.turnLimit">
                <option :value="null">No limit</option>
                <option
                  v-for="count in [5, 7, 9, 12, 15, 20]"
                  :key="count"
                  :value="count"
                >
                  {{ count }} rounds
                </option>
              </select>
              <ul
                v-if="store.studioProblems.length"
                class="evt-studio-errors"
                data-testid="studio-validation"
              >
                <li v-for="error in store.studioProblems" :key="error">
                  {{ error }}
                </li>
              </ul>
              <div
                v-else
                class="evt-studio-ready"
                data-testid="studio-validation"
              >
                ✓ Passable stage · Six legal spawns · Test ready
              </div>
              <button
                type="button"
                class="evt-studio-launch"
                :disabled="store.studioProblems.length > 0"
                data-testid="studio-playtest"
                @click="store.startPlaytest()"
              >
                ▶ PLAYTEST THIS MAP
              </button>
              <label class="evt-studio-label" for="evt-encounter"
                >RIVAL LINE-UP</label
              >
              <select
                id="evt-encounter"
                v-model="store.draft.encounter"
                data-testid="studio-encounter-select"
              >
                <option
                  v-for="entry in STAGE_ENCOUNTERS"
                  :key="entry.id ?? 'heroes'"
                  :value="entry.id ?? undefined"
                >
                  {{ entry.label }}
                </option>
              </select>
              <small
                v-if="store.draft.encounter === 'wombat-ronin'"
                data-testid="studio-encounter"
              >
                ONE-HIT TELEPORTERS · Lieutenant Teakettle's Clockwork Wombat
                Ronin mark a clock-face exit on a hero's uncovered side, then
                phase through it next turn. Occupy the exit to jam it.
              </small>
              <small
                v-else-if="store.draft.encounter === 'licensed-legends'"
                data-testid="studio-encounter"
              >
                ONE-HIT WIND-UP TOYS · Sir Cap-Permission's mascots swarm and
                block lanes. Starting a turn beside a hero, they stamp a seal
                that locks that hero's signature power for a turn.
              </small>
              <small
                v-else-if="store.draft.encounter === 'warren-wreckers'"
                data-testid="studio-encounter"
              >
                ONE-HIT ENCOUNTER · Foreman Thumpkin and Cornerstone's Warren
                Wreckers. Marked dust rings erupt on the following enemy turn,
                unless occupied.
              </small>
              <label class="evt-studio-label" for="evt-victory"
                >HOW TO WIN</label
              >
              <select
                id="evt-victory"
                data-testid="studio-victory"
                :value="store.draft.victory?.kind ?? 'defeat-all'"
                @change="
                  store.chooseVictory(
                    ($event.target as HTMLSelectElement).value as VictoryKind,
                  )
                "
              >
                <option
                  v-for="kind in victoryKinds"
                  :key="kind.value"
                  :value="kind.value"
                >
                  {{ kind.label }}
                </option>
              </select>
              <label
                v-if="
                  store.draft.victory &&
                  store.draft.victory.kind !== 'defeat-all' &&
                  store.draft.victory.kind !== 'defeat-boss'
                "
                class="evt-studio-label"
                >{{
                  store.draft.victory.kind === 'rescue'
                    ? 'CIVILIANS TO EVACUATE'
                    : 'ROUNDS'
                }}
                <input
                  type="number"
                  min="1"
                  max="40"
                  data-testid="studio-victory-amount"
                  :value="
                    store.draft.victory.kind === 'rescue'
                      ? store.draft.victory.count
                      : store.draft.victory.rounds
                  "
                  @change="
                    store.setVictoryAmount(
                      Number(($event.target as HTMLInputElement).value),
                    )
                  "
              /></label>
              <label
                v-if="store.draft.victory?.kind === 'defeat-boss'"
                class="evt-studio-label"
                >BOSS
                <select
                  :value="store.draft.victory.unit"
                  @change="
                    store.chooseBoss(($event.target as HTMLSelectElement).value)
                  "
                >
                  <option value="pip">Rival lead (pip spawn)</option>
                  <option value="vee">Rival two (vee spawn)</option>
                  <option value="remy">Rival three (remy spawn)</option>
                </select></label
              >
              <small v-if="store.draft.victory?.kind === 'hold-zone'"
                >Paint ⚑ hold-zone tiles. A round counts when a squadmate is in
                the zone and no rival is.</small
              >
              <template v-if="store.draft.waves?.length">
                <label class="evt-studio-label"
                  >WAVE ARRIVES ON ROUND
                  <input
                    type="number"
                    min="2"
                    max="40"
                    data-testid="studio-wave-round"
                    :value="store.draft.waves[0]!.round"
                    @change="
                      store.updateWave({
                        round: Number(
                          ($event.target as HTMLInputElement).value,
                        ),
                      })
                    "
                /></label>
                <label class="evt-studio-label"
                  >WAVE CREW
                  <select
                    :value="store.draft.waves[0]!.crew"
                    @change="
                      store.updateWave({
                        crew: ($event.target as HTMLSelectElement)
                          .value as WaveCrew,
                      })
                    "
                  >
                    <option
                      v-for="crew in waveCrews"
                      :key="crew.value"
                      :value="crew.value"
                    >
                      {{ crew.label }}
                    </option>
                  </select></label
                >
              </template>
              <div class="evt-drafts" data-testid="studio-drafts">
                <span class="evt-studio-label">DRAFTS &amp; SHARE CODES</span>
                <div class="evt-draft-row">
                  <input
                    v-model="store.draftName"
                    maxlength="60"
                    placeholder="Draft name"
                    aria-label="Draft name"
                  />
                  <button
                    type="button"
                    data-testid="studio-save-draft"
                    @click="store.saveDraft()"
                  >
                    SAVE
                  </button>
                </div>
                <ul v-if="store.draftLibrary.drafts.length">
                  <li
                    v-for="entry in store.draftLibrary.drafts"
                    :key="entry.name"
                  >
                    <span>{{ entry.name }}</span>
                    <button type="button" @click="store.loadDraft(entry.name)">
                      LOAD
                    </button>
                    <button
                      type="button"
                      :aria-label="'Delete draft ' + entry.name"
                      @click="store.deleteDraft(entry.name)"
                    >
                      ✕
                    </button>
                  </li>
                </ul>
                <button
                  type="button"
                  data-testid="studio-export"
                  @click="store.exportDraft()"
                >
                  EXPORT SHARE CODE
                </button>
                <textarea
                  v-if="store.shareCode"
                  :value="store.shareCode"
                  readonly
                  rows="3"
                  aria-label="Stage share code"
                  data-testid="studio-share-code"
                  @focus="($event.target as HTMLTextAreaElement).select()"
                ></textarea>
                <textarea
                  v-model="store.importText"
                  rows="2"
                  placeholder="Paste a stage code to import"
                  aria-label="Stage code to import"
                  data-testid="studio-import-text"
                ></textarea>
                <button
                  type="button"
                  data-testid="studio-import"
                  @click="store.importDraft()"
                >
                  IMPORT
                </button>
                <small v-if="store.shareMessage" role="status">{{
                  store.shareMessage
                }}</small>
              </div>
              <small
                >Uses existing seeded combat AI, pathfinding, cover, hit
                percentages and movement costs. Drafts stay in this browser;
                share codes are plain text. No server publishing.</small
              >
            </div>
          </div>
        </section>

        <section
          v-if="store.moment"
          class="evt-cinematic"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evt-scene-heading"
          data-testid="tactics-cinematic"
        >
          <div class="evt-cinematic-scenery" aria-hidden="true"></div>
          <div class="evt-cinematic-content">
            <div class="evt-cinematic-rail">
              <span class="evt-overline">{{ store.moment.kicker }}</span>
              <span>SCENE {{ store.story.seen.length + 1 }} / COMET CITY</span>
            </div>
            <h2 id="evt-scene-heading">{{ store.moment.title }}</h2>
            <div class="evt-dialogue" aria-live="polite">
              <div
                v-for="(line, index) in store.moment.lines"
                :key="index"
                class="evt-dialogue-line"
              >
                <strong>{{ line.speaker }}</strong>
                <p>{{ line.text }}</p>
              </div>
            </div>
            <div class="evt-cinematic-actions" aria-label="Story decisions">
              <button
                v-for="(choice, index) in store.moment.choices"
                :key="choice.effect"
                type="button"
                class="evt-story-choice"
                :data-testid="'tactics-story-' + choice.effect"
                @click="store.chooseStory(choice.effect)"
              >
                <span class="evt-choice-number">{{ index + 1 }}</span>
                <span class="evt-choice-body">
                  <strong>{{ choice.label }}</strong>
                  <small>{{ choice.detail }}</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
            <div class="evt-scene-progress" data-testid="tactics-story-flags">
              <span>{{ store.story.civilians }} rescued</span>
              <span>{{ store.story.evidence }} evidence</span>
              <span>{{
                store.story.mercy ? 'Mercy offered' : 'Ceasefire unresolved'
              }}</span>
            </div>
          </div>
        </section>

        <section
          v-if="store.oneShotScene"
          class="evt-cinematic"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evt-oneshot-heading"
          data-testid="tactics-oneshot-scene"
        >
          <div class="evt-cinematic-scenery" aria-hidden="true"></div>
          <div class="evt-cinematic-content">
            <div class="evt-cinematic-rail">
              <span class="evt-overline">{{ store.oneShotScene.kicker }}</span>
              <span>ONE-SHOT / COMET CITY</span>
            </div>
            <h2 id="evt-oneshot-heading">{{ store.oneShotScene.title }}</h2>
            <div class="evt-dialogue" aria-live="polite">
              <div
                v-for="(entry, index) in store.oneShotScene.lines"
                :key="index"
                class="evt-dialogue-line"
              >
                <strong>{{ entry.speaker }}</strong>
                <p>{{ entry.text }}</p>
              </div>
            </div>
            <div class="evt-cinematic-actions">
              <button
                type="button"
                class="evt-story-choice"
                data-testid="tactics-scene-continue"
                @click="store.dismissScene()"
              >
                <span class="evt-choice-number">↵</span>
                <span class="evt-choice-body"><strong>Continue</strong></span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </section>

        <section
          v-if="store.scriptScene && store.sceneWalk"
          class="evt-cinematic evt-script-scene"
          :class="[
            'camera-' + (store.sceneLines.at(-1)?.camera ?? 'wide'),
            { 'is-preview': !!store.previewSceneId },
          ]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="evt-script-heading"
          data-testid="tactics-script-scene"
        >
          <div class="evt-cinematic-scenery" aria-hidden="true"></div>
          <div class="evt-cinematic-content">
            <div class="evt-cinematic-rail">
              <span class="evt-overline">{{
                store.previewSceneId ? 'STUDIO PREVIEW' : 'STAGE SCENE'
              }}</span>
              <span>{{ store.draft.title }}</span>
            </div>
            <h2 id="evt-script-heading">{{ store.scriptScene.title }}</h2>
            <div class="evt-script-frame">
              <img
                v-if="store.sceneLines.at(-1)?.art"
                class="evt-script-portrait"
                :src="store.sceneLines.at(-1)!.art!"
                alt=""
              />
              <div class="evt-dialogue" aria-live="polite">
                <div
                  v-for="line in store.sceneLines"
                  :key="line.id"
                  class="evt-dialogue-line"
                  :data-emotion="line.emotion"
                >
                  <strong
                    >{{ line.name }}
                    <small v-if="line.role">· the {{ line.role }}</small>
                    <small v-if="line.emotion !== 'neutral'"
                      >· {{ line.emotion }}</small
                    ></strong
                  >
                  <p>{{ line.text }}</p>
                </div>
              </div>
            </div>
            <div class="evt-cinematic-actions" aria-label="Scene choices">
              <template v-if="!store.sceneWalk.done">
                <button
                  v-for="(choice, index) in store.sceneLines.at(-1)?.choices ??
                  []"
                  :key="index"
                  type="button"
                  class="evt-story-choice"
                  :data-testid="'tactics-script-choice-' + index"
                  @click="store.chooseSceneOption(index)"
                >
                  <span class="evt-choice-number">{{ index + 1 }}</span>
                  <span class="evt-choice-body"
                    ><strong>{{ choice.label }}</strong></span
                  >
                  <span aria-hidden="true">›</span>
                </button>
              </template>
              <button
                v-else
                type="button"
                class="evt-story-choice"
                data-testid="tactics-script-continue"
                @click="store.continueScene()"
              >
                <span class="evt-choice-number">↵</span>
                <span class="evt-choice-body"><strong>Continue</strong></span>
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </section>

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
          <div class="evt-roster-layout">
            <div
              class="evt-roster-grid kr-scroll"
              aria-label="Browse all 48 powers"
            >
              <button
                v-for="person in visibleRoster"
                :key="person.signature"
                type="button"
                class="evt-roster-card"
                :class="{ inspected: inspectedSignature === person.signature }"
                :aria-pressed="inspectedSignature === person.signature"
                @click="inspectedSignature = person.signature"
              >
                <span class="evt-roster-art" aria-hidden="true">
                  <span>{{ person.hero.alias.slice(0, 2).toUpperCase() }}</span>
                </span>
                <strong>{{ person.hero.alias }}</strong>
                <small>{{ person.realName }}</small>
                <span class="evt-roster-type">{{
                  person.signature.replace('-', ' / ').toUpperCase()
                }}</span>
                <span class="evt-roster-power"
                  >{{ roleLabel(rosterTactic(person.signature).role) }} ·
                  {{ rosterTactic(person.signature).name }}</span
                >
              </button>
            </div>
            <aside
              class="evt-campaign-dossier"
              data-testid="tactics-campaign-dossier"
              aria-live="polite"
            >
              <span class="evt-overline"
                >CAMPAIGN FILE / AUTHORING PREVIEW</span
              >
              <h3>{{ inspectedPerson.hero.alias }}</h3>
              <p class="evt-dossier-realname">{{ inspectedPerson.realName }}</p>
              <div
                class="evt-dossier-entry"
                data-testid="tactics-dossier-power"
              >
                <span
                  >SIGNATURE ACTIVE ·
                  {{ roleLabel(inspectedTactic.role).toUpperCase() }} ·
                  {{ inspectedProfileLine }}</span
                >
                <h4>{{ inspectedTactic.name }}</h4>
                <small>{{ inspectedTactic.source }}</small>
                <p>{{ inspectedTactic.rules }}</p>
                <p class="evt-dossier-hook">{{ inspectedTactic.flavor }}</p>
              </div>
              <div class="evt-dossier-entry">
                <span>01 · POWER ORIGIN</span>
                <h4>{{ inspectedCampaign.opening.title }}</h4>
                <small>{{ inspectedCampaign.opening.venue }}</small>
                <p>{{ inspectedCampaign.opening.inciting }}</p>
                <p class="evt-dossier-hook">
                  {{ inspectedCampaign.opening.powerUse }}
                </p>
              </div>
              <div class="evt-dossier-entry">
                <span>VILLAIN PATH · PRIVATE LAIR</span>
                <h4>{{ inspectedCampaign.lair.title }}</h4>
                <small>{{ inspectedCampaign.lair.venue }}</small>
                <p>{{ inspectedCampaign.lair.arena }}</p>
                <p class="evt-dossier-hook">
                  {{ inspectedCampaign.lair.objective }}
                </p>
              </div>
              <div class="evt-dossier-entry">
                <span>SECOND-IN-COMMAND · 4 HP DESIGN</span>
                <h4>{{ inspectedCampaign.lieutenant.name }}</h4>
                <p>{{ inspectedCampaign.lieutenant.look }}</p>
                <p class="evt-dossier-hook">
                  {{ inspectedCampaign.lieutenant.power }}
                </p>
                <small
                  >COUNTER: {{ inspectedCampaign.lieutenant.counter }}</small
                >
              </div>
              <p class="evt-dossier-status">
                Concept plans only: Henchmen: {{ inspectedHenchmen.name }} · The
                Quarry lieutenant is one playable studio demonstration, not 48
                shipped bosses or 96 playable stages. Most concepts await art
                and AI.
              </p>
              <button
                type="button"
                class="evt-dossier-select"
                data-testid="tactics-dossier-select"
                @click="store.chooseLead(inspectedSignature)"
              >
                ASSIGN AS SQUAD LEAD →
              </button>
              <div
                class="evt-comic-buttons"
                aria-label="Preview illustrated character introductions"
              >
                <button
                  v-for="role in comicPreviewRoles"
                  :key="role"
                  type="button"
                  data-testid="tactics-comic-intro-preview"
                  @click="previewComicIntro(role)"
                >
                  {{ role.toUpperCase() }} REVEAL
                </button>
              </div>
            </aside>
          </div>
        </div>
        <EveryVillainFrontMenu v-if="store.screen" />
      </div>
    </PlaybookKitShell>
    <ComicCharacterReveal
      v-if="activeComicIntro"
      :open="true"
      :intro="activeComicIntro"
      :art-src="activeComicArt"
      :allow-skip-all="true"
      @dismiss="dismissComicIntro"
      @skip-all="skipComicIntros"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { IDENTITY_CAMPAIGN_STAGES } from '~/utils/cometAcademy/identityCampaignStages'
import { VILLAIN_HENCHMEN } from '~/utils/cometAcademy/villainHenchmen'
import {
  comicIntroFor,
  type ComicIntro,
  type ComicIntroRole,
} from '~/utils/cometAcademy/comicIntroductions'
import { promArt } from '~/utils/cometAcademy/artManifest'
import type { SignaturePowerId } from '~/utils/cometAcademy/specialPowers'
import { EVERY_VILLAIN_TACTICS } from '~/utils/playbookKit/games/everyVillainTactics'
import {
  useEveryVillainTacticsStore,
  PERSPECTIVES,
} from '~/stores/everyVillainTacticsStore'
import {
  actorAt,
  displayUnitAt,
  aliasFor,
  personFor,
  type Cell,
  type Unit,
} from '~/utils/everyVillainTactics/training'
import { STAGE_ENCOUNTERS } from '~/utils/everyVillainTactics/studio'
import {
  VICTORY_LABELS,
  type VictoryKind,
  type WaveCrew,
} from '~/utils/everyVillainTactics/stageRules'
import {
  ROLE_LABELS,
  WEAPON_LABELS,
  roleProfileFor,
  tacticFor,
  type PowerEffect,
  type TacticalRole,
} from '~/utils/everyVillainTactics/powers'

const store = useEveryVillainTacticsStore()
const comicPreviewRoles: ComicIntroRole[] = [
  'hero',
  'villain',
  'henchman',
  'lieutenant',
]
const activeComicIntro = ref<ComicIntro | null>(null)
const comicQueue: ComicIntro[] = []
const seenComics = new Set<string>()
const activeComicArt = computed(() =>
  activeComicIntro.value?.artKey
    ? promArt(activeComicIntro.value.artKey)
    : null,
)
function queueComicIntro(intro: ComicIntro, replay = false) {
  if (!replay && seenComics.has(intro.key)) return
  seenComics.add(intro.key)
  comicQueue.push(intro)
  if (!activeComicIntro.value && !store.screen)
    activeComicIntro.value = comicQueue.shift() ?? null
}
watch(
  () => store.screen,
  async (screen) => {
    if (screen) return
    if (!activeComicIntro.value)
      activeComicIntro.value = comicQueue.shift() ?? null
    await nextTick()
    document.querySelector<HTMLButtonElement>('.evt-story-choice')?.focus()
  },
)
function dismissComicIntro() {
  activeComicIntro.value = comicQueue.shift() ?? null
}
function skipComicIntros() {
  comicQueue.length = 0
  activeComicIntro.value = null
}
function previewComicIntro(role: ComicIntroRole) {
  queueComicIntro(
    comicIntroFor(inspectedSignature.value as SignaturePowerId, role),
    true,
  )
}
watch(
  () =>
    store.state.units
      .filter((unit) => unit.hp > 0)
      .map((unit) =>
        [
          unit.identity,
          unit.team,
          unit.henchmanType ?? '',
          unit.lieutenantName ?? '',
        ].join(':'),
      )
      .join('|'),
  () => {
    const lead = store.players[0]
    if (lead)
      queueComicIntro(comicIntroFor(lead.identity as SignaturePowerId, 'hero'))
    for (const unit of store.enemies) {
      const role: ComicIntroRole = unit.lieutenantName
        ? 'lieutenant'
        : unit.henchmanType
          ? 'henchman'
          : 'villain'
      queueComicIntro(comicIntroFor(unit.identity as SignaturePowerId, role))
    }
  },
  { immediate: true },
)
const studioBrushes = [
  { value: 'erase', label: 'Clear' },
  { value: 'wall', label: 'Wall' },
  { value: 'half-cover', label: 'Half cover' },
  { value: 'full-cover', label: 'Full cover' },
  { value: 'rise', label: 'Raise' },
  { value: 'squad-spawn', label: 'Squad spawn' },
  { value: 'rival-spawn', label: 'Rival spawn' },
  { value: 'secret', label: 'Secret' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'civilian', label: 'Civilian' },
  { value: 'prop', label: 'Breakable prop' },
  { value: 'fire', label: 'Fire' },
  { value: 'water', label: 'Live water' },
  { value: 'collapse', label: 'Weak floor' },
  { value: 'reinforce', label: 'Wave hatch' },
  { value: 'zone', label: 'Hold zone' },
] as const
const victoryKinds = Object.entries(VICTORY_LABELS).map(([value, label]) => ({
  value: value as VictoryKind,
  label,
}))
const waveCrews: Array<{ value: WaveCrew; label: string }> = [
  { value: 'warren-wreckers', label: 'Warren Wreckers' },
  { value: 'wombat-ronin', label: 'Clockwork Wombat Ronin' },
  { value: 'licensed-legends', label: 'Licensed Legends' },
]
/** One glyph for the strongest live stage rule on a tile. */
function fieldGlyph(cell: Cell): string {
  const mark = store.fieldAt(cell)
  if (!mark) return ''
  if (mark.floor === 'rubble') return '▓'
  if (mark.fire) return '🔥'
  if (mark.hatch) return '⇣'
  if (mark.fireNext) return '♨'
  if (mark.water) return mark.water === 'live' ? '⚡' : '≈'
  if (typeof mark.floor === 'number') return '⌇' + mark.floor
  if (mark.prop) return '▣' + mark.prop.hp
  if (mark.zone) return '⚑'
  return ''
}
function fieldDescription(cell: Cell): string {
  const mark = store.fieldAt(cell)
  if (!mark) return ''
  const parts: string[] = []
  if (mark.floor === 'rubble') parts.push('collapsed floor, impassable rubble')
  if (mark.fire) parts.push('ON FIRE, 1 damage at round end')
  if (mark.fireNext)
    parts.push('fire spreads here at round end unless someone stands on it')
  if (mark.water === 'live') parts.push('LIVE water, 1 damage at round end')
  if (mark.water === 'calm') parts.push('water, live next round')
  if (typeof mark.floor === 'number')
    parts.push(
      mark.floor === 0
        ? 'weak floor, gives way at the end of this round'
        : 'weak floor, gives way in ' + mark.floor + ' round(s)',
    )
  if (mark.hatch)
    parts.push('reinforcement hatch, a rival arrives next round unless blocked')
  if (mark.prop)
    parts.push(
      'breakable ' + mark.prop.cover + ' cover, ' + mark.prop.hp + ' HP left',
    )
  if (mark.zone) parts.push('hold zone')
  return parts.length ? '. ' + parts.join('; ') : ''
}
function studioRuleGlyph(cell: Cell): string {
  const same = (p: Cell) => p.x === cell.x && p.y === cell.y
  const hazard = store.draft.activeHazards?.find(same)
  if (hazard)
    return hazard.kind === 'fire' ? '🔥' : hazard.kind === 'water' ? '≈' : '⌇'
  if (store.draft.props?.some(same))
    return store.draft.props.find(same)!.cover === 'full' ? '▣' : '▢'
  if (store.draft.waves?.some((wave) => wave.spawns.some(same))) return '⇣'
  if (
    store.draft.victory?.kind === 'hold-zone' &&
    store.draft.victory.cells.some(same)
  )
    return '⚑'
  return ''
}
const studioCells = Array.from({ length: 54 }, (_, i) => ({
  x: i % 9,
  y: Math.floor(i / 9),
}))
function studioSpawnAt(cell: Cell): string {
  const spawn = store.draft.spawns.find(
    (unit) => unit.x === cell.x && unit.y === cell.y,
  )
  return spawn
    ? ['backdraft', 'priya', 'hattie'].includes(spawn.id)
      ? 'S'
      : 'R'
    : ''
}
function studioCellLabel(cell: Cell): string {
  const details = store.draft.map.tiles[cell.x + ',' + cell.y]
  return (
    'Column ' +
    (cell.x + 1) +
    ', row ' +
    (cell.y + 1) +
    ', ' +
    (studioSpawnAt(cell) ||
      (details?.wall ? 'wall' : details?.cover ? 'cover' : 'open')) +
    '. Paint ' +
    store.studioBrush.replace('-', ' ')
  )
}
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
const inspectedSignature = ref(store.leadSignature)
const inspectedPerson = computed(
  () =>
    store.roster.find(
      (person) => person.signature === inspectedSignature.value,
    ) ?? store.roster[0]!,
)
const inspectedCampaign = computed(
  () =>
    IDENTITY_CAMPAIGN_STAGES.find(
      (entry) => entry.signature === inspectedSignature.value,
    ) ?? IDENTITY_CAMPAIGN_STAGES[0]!,
)
const inspectedHenchmen = computed(
  () =>
    VILLAIN_HENCHMEN.find(
      (entry) => entry.signature === inspectedSignature.value,
    ) ?? VILLAIN_HENCHMEN[0]!,
)
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
  return aliasFor(unit)
}
function roleLabel(role: TacticalRole): string {
  return ROLE_LABELS[role]
}
function roleLine(unit: Unit): string {
  return (
    ROLE_LABELS[unit.role!] +
    ' · ' +
    WEAPON_LABELS[unit.weapon ?? 'mid'] +
    ' · MOV ' +
    (unit.mobility ?? 3) +
    (unit.defense ? ' · DEF ' + unit.defense : '')
  )
}
function rosterTactic(signature: string) {
  return tacticFor(signature)!
}
const inspectedTactic = computed(() => rosterTactic(inspectedSignature.value))
const inspectedProfileLine = computed(() => {
  const profile = roleProfileFor(inspectedSignature.value as SignaturePowerId)
  return (
    profile.hp +
    ' HP · ' +
    WEAPON_LABELS[profile.weapon].toUpperCase() +
    ' · AIM ' +
    profile.aim +
    ' · MOV ' +
    profile.mobility +
    (profile.defense ? ' · DEF ' + profile.defense : '')
  )
})
function effectLine(effect: PowerEffect): string {
  const unit = store.state.units.find((entry) => entry.id === effect.id)
  const parts: string[] = []
  if (effect.damage) parts.push('−' + effect.damage + ' HP')
  if (effect.heal) parts.push('+' + effect.heal + ' HP')
  if (effect.ap) parts.push('+' + effect.ap + ' AP')
  if (effect.cleanse) parts.push('clears suppression')
  for (const status of effect.statuses) parts.push(status)
  if (effect.moveTo)
    parts.push(
      'moves to ' + (effect.moveTo.x + 1) + ', ' + (effect.moveTo.y + 1),
    )
  return (unit ? unitName(unit) : effect.id) + ': ' + parts.join(', ')
}
function shooterName(id: string): string {
  const unit = store.state.units.find((entry) => entry.id === id)
  return unit ? unitName(unit) : id
}
function targetName(id: string): string {
  const target = store.enemies.find((unit) => unit.id === id)
  return target ? unitName(target) : id
}
function initials(unit: Unit): string {
  return unitName(unit).slice(0, 2).toUpperCase()
}
function cellDescription(cell: Cell) {
  return baseCellDescription(cell) + fieldDescription(cell)
}
function baseCellDescription(cell: Cell) {
  const unit = actorAt(store.state, cell)
  if (store.isSeismicWarning(cell))
    return (
      'SEISMIC WARNING, column ' +
      (cell.x + 1) +
      ', row ' +
      (cell.y + 1) +
      '. Mags Hardpan will strike this zone next turn unless hit. Move away or shoot the drum.' +
      (unit
        ? ' Occupied by ' + unitName(unit) + ', ' + unit.hp + ' health.'
        : '')
    )
  const civilian = store.civilianAt(cell)
  if (civilian)
    return (
      civilian.name +
      (civilian.status === 'lost'
        ? ', pulled into the tunnels'
        : store.cellStyle(cell)['civilian-risk']
          ? ', AT RISK: a dust ring is next to them'
          : ', waiting for evacuation') +
      ', column ' +
      (cell.x + 1) +
      ', row ' +
      (cell.y + 1) +
      (unit ? '. Occupied by ' + unitName(unit) + '.' : '.')
    )
  if (store.isPhaseWarning(cell))
    return (
      'PORTAL EXIT, column ' +
      (cell.x + 1) +
      ', row ' +
      (cell.y + 1) +
      '. A wombat ronin phases here next turn. Stand on it to jam the portal.' +
      (unit ? ' Occupied by ' + unitName(unit) + '.' : '')
    )
  if (store.isBurrowWarning(cell))
    return (
      'BURROW WARNING, dust ring at column ' +
      (cell.x + 1) +
      ', row ' +
      (cell.y + 1) +
      '. Occupy to block emergence.'
    )
  if (unit)
    return unitName(unit) + ', ' + unit.team + ', ' + unit.hp + ' health'
  const exposed = store.threatAt(cell)
  if (exposed)
    return (
      'Tile ' +
      (cell.x + 1) +
      ', ' +
      (cell.y + 1) +
      ', reachable but exposed to ' +
      exposed +
      ' rival shooter' +
      (exposed > 1 ? 's' : '') +
      (store.tileInfoAt(cell) === 'cover' ? ', cover' : '')
    )
  if (store.tileInfoAt(cell) === 'wall')
    return 'Wall at column ' + (cell.x + 1) + ', row ' + (cell.y + 1)
  return (
    'Tile ' +
    (cell.x + 1) +
    ', ' +
    (cell.y + 1) +
    (store.tileInfoAt(cell) === 'cover' ? ', cover' : '') +
    (store.heightAt(cell) ? ', elevation ' + store.heightAt(cell) : '') +
    (store.cellStyle(cell).reachable ? ', reachable' : '')
  )
}
function onKey(event: KeyboardEvent) {
  if (activeComicIntro.value || store.screen) return
  if (store.oneShotScene) {
    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault()
      store.dismissScene()
    }
    return
  }
  if (store.scriptScene && store.sceneWalk) {
    const digit = ['Digit1', 'Digit2', 'Digit3'].indexOf(event.code)
    if (!store.sceneWalk.done && digit >= 0) {
      event.preventDefault()
      store.chooseSceneOption(digit)
    } else if (
      store.sceneWalk.done &&
      (event.code === 'Enter' || event.code === 'Space')
    ) {
      event.preventDefault()
      store.continueScene()
    }
    return
  }
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    store.rosterOpen ||
    store.studioOpen
  )
    return
  if (store.moment) {
    if (event.code === 'Digit1' || event.code === 'Digit2') {
      const index = event.code === 'Digit1' ? 0 : 1
      const chosen = store.moment.choices[index]
      if (chosen) {
        event.preventDefault()
        store.chooseStory(chosen.effect)
      }
    }
    return
  }
  const tag = (event.target as HTMLElement | null)?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return
  if (event.code === 'KeyM') store.setMode('move')
  else if (event.code === 'KeyF') store.setMode('fire')
  else if (event.code === 'KeyP') store.setMode('power')
  else if (event.code === 'KeyE') store.rescue()
  else if (event.code === 'KeyO') store.overwatch()
  else if (event.code === 'KeyH') store.hunker()
  else if (event.code === 'KeyR') store.reset()
  else return
}
watch(
  () => store.moment?.id,
  async (scene) => {
    if (!scene || store.screen) return
    await nextTick()
    document.querySelector<HTMLButtonElement>('.evt-story-choice')?.focus()
  },
)
onMounted(() => {
  window.addEventListener('keydown', onKey)
  store.loadPreferences()
  if (store.moment && !store.screen) {
    nextTick(() =>
      document.querySelector<HTMLButtonElement>('.evt-story-choice')?.focus(),
    )
  }
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.evt-studio-panes {
  display: flex;
  gap: 6px;
  margin: 6px 0;
}
.evt-studio-panes button {
  padding: 6px 12px;
  border: 1px solid #8193b3;
  border-radius: 6px;
  background: #263552;
  color: #e1e6f6;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.evt-studio-panes button[aria-pressed='true'] {
  border-color: #fedda2;
  color: #1b1330;
  background: #fedda2;
}
.evt-script-scene.is-preview {
  z-index: 30;
}
.evt-script-frame {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}
.evt-script-portrait {
  flex: none;
  width: clamp(80px, 16cqw, 190px);
  height: auto;
  max-height: 38cqh;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: top;
  border: 2px solid #fedda2;
  border-radius: 12px;
  box-shadow: 0 10px 30px #000a;
}
.evt-script-scene.camera-close .evt-script-portrait {
  width: clamp(100px, 22cqw, 250px);
}
.evt-script-frame .evt-dialogue {
  flex: 1;
  min-width: 0;
}
.evt-script-scene.camera-low-angle .evt-script-portrait {
  transform: perspective(500px) rotateX(-6deg) scale(1.04);
}
.evt-script-scene.camera-over-shoulder .evt-script-frame {
  flex-direction: row-reverse;
}
.evt-script-scene.camera-close .evt-cinematic-scenery {
  transform: scale(1.12);
}
.evt-dialogue-line strong small {
  font-weight: 600;
  opacity: 0.75;
  text-transform: lowercase;
}
@container (max-width: 520px) {
  .evt-script-portrait,
  .evt-script-scene.camera-close .evt-script-portrait {
    width: 72px;
  }
}
.evt-rule-line {
  display: block;
  color: #fde68a;
  font-size: 0.72rem;
  font-weight: 800;
}
.evt-field-mark {
  position: absolute;
  inset: 0.1rem 0.2rem auto auto;
  font-size: 0.8rem;
  font-weight: 900;
  color: #fff4d6;
  pointer-events: none;
  text-shadow: 0 1px 2px #000;
}
.evt-tile.on-fire {
  background-image: radial-gradient(
    circle at 50% 70%,
    rgb(249 115 22 / 0.55),
    transparent 70%
  );
}
.evt-tile.fire-next {
  box-shadow: inset 0 0 0 2px rgb(249 115 22 / 0.8);
}
.evt-tile.water-live {
  background-image: linear-gradient(
    135deg,
    rgb(56 189 248 / 0.45),
    rgb(250 204 21 / 0.3)
  );
}
.evt-tile.water-calm {
  background-image: linear-gradient(
    135deg,
    rgb(56 189 248 / 0.28),
    transparent
  );
}
.evt-tile.weak-floor {
  box-shadow: inset 0 0 0 2px rgb(168 162 158 / 0.85);
}
.evt-tile.rubble {
  background: repeating-linear-gradient(
    45deg,
    #3b3530,
    #3b3530 6px,
    #2a2622 6px,
    #2a2622 12px
  );
}
.evt-tile.hatch-warning {
  box-shadow: inset 0 0 0 3px rgb(244 63 94 / 0.9);
}
.evt-tile.hold-zone {
  outline: 2px dashed rgb(250 204 21 / 0.75);
  outline-offset: -4px;
}
.evt-tile.boss-target {
  box-shadow: inset 0 0 0 3px rgb(217 70 239 / 0.95);
}
.evt-drafts {
  display: grid;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #829fc35a;
}
.evt-drafts ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.evt-drafts li,
.evt-draft-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.evt-drafts li span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
}
.evt-drafts input,
.evt-drafts textarea {
  flex: 1;
  min-width: 0;
  font-size: 0.72rem;
}
.evt-drafts button {
  padding: 4px 8px;
  border: 1px solid #8193b3;
  border-radius: 6px;
  background: #263552;
  color: #e1e6f6;
  font-size: 0.68rem;
  font-weight: 800;
}
.evt-console[data-anim='off'] .evt-standee {
  animation: none;
  transition: none;
}
.evt-tile.exposed {
  box-shadow: inset 0 -3px 0 rgb(251 146 60 / 0.85);
}
.evt-threat-mark {
  position: absolute;
  inset: auto auto 0.1rem 0.2rem;
  color: rgb(253 186 116);
  font-size: 0.62rem;
  font-weight: 900;
  pointer-events: none;
}
.evt-threat-line {
  margin: 0.25rem 0 0;
  color: rgb(253 186 116);
  font-size: 0.72rem;
  font-weight: 700;
}
.evt-end-turn.is-armed {
  outline: 2px solid #ffe0a6;
  outline-offset: 2px;
  color: #fff4d6;
  background: linear-gradient(90deg, #b8325e, #ff7d8c);
}
.evt-civilian {
  position: absolute;
  inset: 0.15rem auto auto 0.25rem;
  font-size: 0.95rem;
  color: rgb(253 230 138);
  pointer-events: none;
}
.evt-civilian.is-lost {
  color: rgb(251 113 133);
  opacity: 0.8;
}
.evt-tile.civilian-risk {
  box-shadow: inset 0 0 0 3px rgb(251 113 133 / 0.9);
}
.evt-rescue {
  display: grid;
  gap: 0.15rem;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid rgb(253 230 138 / 0.55);
  border-radius: 0.6rem;
  background: rgb(253 230 138 / 0.08);
  color: inherit;
  text-align: left;
}
.evt-rescue span {
  font-size: 0.68rem;
  opacity: 0.8;
}
.evt-rescue:disabled {
  opacity: 0.55;
}
.evt-tile.phase-warning {
  box-shadow: inset 0 0 0 3px rgb(167 139 250 / 0.9);
}
.evt-phase-ring {
  position: absolute;
  inset: auto 0.2rem 0.1rem auto;
  color: rgb(196 181 253);
  font-size: 0.9rem;
  pointer-events: none;
}
.evt-saves {
  display: grid;
  gap: 0.3rem;
  margin: 0.5rem 0;
  font-size: 0.7rem;
}
.evt-continue {
  padding: 0.4rem 0.6rem;
  border: 1px solid rgb(125 211 252 / 0.6);
  border-radius: 0.5rem;
  background: rgb(125 211 252 / 0.12);
  color: inherit;
  letter-spacing: 0.08em;
}
.evt-continue:disabled,
.evt-save-slot button:disabled {
  opacity: 0.45;
}
.evt-save-slot {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 0.35rem;
}
.evt-save-slot small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.8;
}
.evt-save-slot button {
  padding: 0.15rem 0.4rem;
  border: 1px solid currentColor;
  border-radius: 0.35rem;
  background: transparent;
  color: inherit;
}
.evt-save-problem {
  color: rgb(251 113 133);
}
.evt-tile.power-target {
  box-shadow: inset 0 0 0 2px rgb(250 204 21 / 0.55);
}
.evt-tile.power-threat {
  background-image: linear-gradient(
    135deg,
    rgb(250 204 21 / 0.28),
    rgb(244 114 182 / 0.22)
  );
  box-shadow: inset 0 0 0 3px rgb(250 204 21 / 0.95);
}
.evt-role {
  display: block;
  opacity: 0.8;
  font-size: 0.68rem;
  letter-spacing: 0.04em;
}
.evt-power {
  display: grid;
  gap: 0.2rem;
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid rgb(250 204 21 / 0.45);
  border-radius: 0.6rem;
  background: rgb(250 204 21 / 0.08);
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.evt-power.chosen {
  background: rgb(250 204 21 / 0.22);
  border-color: rgb(250 204 21 / 0.95);
}
.evt-power:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.evt-power-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.evt-power-head small {
  margin-left: auto;
  opacity: 0.6;
}
.evt-power-meta {
  font-size: 0.68rem;
  letter-spacing: 0.05em;
  opacity: 0.8;
}
.evt-power-preview {
  display: grid;
  gap: 0.3rem;
  font-size: 0.78rem;
}
.evt-power-preview p {
  margin: 0;
}
.evt-power-source,
.evt-power-flavor {
  opacity: 0.75;
  font-size: 0.7rem;
}
.evt-power-preview ul {
  margin: 0;
  padding-left: 1rem;
}
.evt-effect-enemy {
  color: rgb(251 113 133);
}
.evt-effect-ally,
.evt-effect-self {
  color: rgb(134 239 172);
}
.evt-roster-power {
  display: block;
  font-size: 0.66rem;
  opacity: 0.8;
}
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
.evt-tile.burrow-warning {
  box-shadow:
    inset 0 0 0 3px #ffc467,
    0 0 12px #ef6b2a;
  z-index: 3;
}
.evt-tile.seismic-warning {
  box-shadow:
    inset 0 0 0 3px #f5ac5a,
    0 0 14px #d24d53;
  z-index: 3;
}
.evt-seismic-ring {
  position: absolute;
  inset: 8%;
  display: grid;
  place-items: center;
  color: #ffe0af;
  border: 2px solid #f5ac5a;
  background: #b32b466e;
  font-weight: 900;
  font-size: clamp(0.7rem, 1.7cqw, 1.45rem);
  pointer-events: none;
}
.evt-burrow-ring {
  position: absolute;
  inset: 5%;
  display: grid;
  place-items: center;
  color: #ffd092;
  border: 2px dashed #ffd092;
  border-radius: 50%;
  background: #9f422c7d;
  font-weight: 900;
  font-size: clamp(0.7rem, 1.5cqw, 1.4rem);
  pointer-events: none;
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
  transition: transform calc(0.25s * var(--evt-anim, 1)) ease;
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
.evt-comic-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-top: 8px;
}
.evt-comic-buttons button {
  padding: 7px 3px;
  font-size: 0.65rem;
  font-weight: 900;
  border: 1px solid #e8d29e;
  border-radius: 5px;
  color: #ffe8bc;
  background: #513e59;
}
.evt-comic-buttons button:focus-visible {
  outline: 3px solid #ffd48a;
  outline-offset: 2px;
}
.evt-roster-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(240px, 1fr);
  flex: 1;
  gap: 12px;
  min-height: 0;
}
.evt-roster-layout .evt-roster-grid {
  min-height: 0;
  overflow-y: auto;
}
.evt-roster-card.inspected {
  border-color: #ffdf96;
  box-shadow: inset 0 0 0 2px #ffdf9680;
}
.evt-campaign-dossier {
  min-height: 0;
  overflow-y: auto;
  border: 1px solid #b4bcdd77;
  border-radius: 10px;
  background: radial-gradient(ellipse at top, #463351, #17203c 73%);
  padding: clamp(10px, 1.6cqw, 18px);
  color: #fff5dc;
}
.evt-campaign-dossier h3 {
  font:
    900 clamp(1.15rem, 2.1cqw, 2rem) Impact,
    sans-serif;
  margin-top: 6px;
  color: #ffd99b;
}
.evt-dossier-realname {
  color: #c5d7ed;
  font-size: 0.78rem;
  margin-bottom: 10px;
}
.evt-dossier-entry {
  border-top: 1px solid #b2bcd35c;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.evt-dossier-entry > span {
  font-size: 0.65rem;
  color: #9fddf4;
  font-weight: 900;
  letter-spacing: 0.1em;
}
.evt-dossier-entry h4 {
  font-weight: 900;
  color: #ffe1a5;
  font-size: 0.9rem;
}
.evt-dossier-entry p,
.evt-dossier-entry small {
  font-size: 0.74rem;
  line-height: 1.45;
  color: #d8def1;
}
.evt-dossier-entry .evt-dossier-hook {
  color: #f9cbab;
}
.evt-dossier-status {
  padding: 8px 0;
  font-size: 0.68rem;
  line-height: 1.4;
  color: #bbcbda;
}
.evt-dossier-select {
  width: 100%;
  border-radius: 8px;
  background: #f5d28f;
  color: #161d33;
  border: 1px solid #fff0cb;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 11px;
}
@container (max-width: 650px) {
  .evt-roster-layout {
    display: flex;
    flex-direction: column;
  }
  .evt-roster-layout .evt-roster-grid {
    flex: 0 0 min(37%, 220px);
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  .evt-campaign-dossier {
    flex: 1;
  }
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
    display: block;
    grid-column: 1 / -1;
    grid-row: 5;
    min-height: 0;
    padding: 4px;
  }
  .evt-odds .evt-overline,
  .evt-odds .evt-preview-note {
    display: none;
  }
  .evt-odds .evt-chance strong {
    font-size: 1.15rem;
  }
  .evt-odds p {
    font-size: 0.58rem;
  }
  .evt-defenses {
    grid-column: 2;
    grid-row: 3;
  }
  .evt-defense {
    font-size: 0.5rem;
    padding: 3px 2px;
  }
  .evt-command-foot {
    grid-column: 2;
    grid-row: 4;
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
.evt-target-list {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
  overflow-x: auto;
  max-width: 100%;
  padding: 4px 0;
}
.evt-target-chip {
  border: 1px solid #85b9d6;
  border-radius: 4px;
  padding: 2px 5px;
  color: #d4e9ff;
  background: #152543;
  white-space: nowrap;
  font-size: 0.59rem;
  font-weight: 800;
}
.evt-height {
  position: absolute;
  right: 4px;
  top: 2px;
  color: #fbd68a;
  font-size: 0.68rem;
  text-shadow: 0 1px 3px #101426;
}
.evt-tile.elevated {
  box-shadow:
    inset 0 0 0 2px #f8c87d99,
    0 0 8px #d7ae8c3a;
}
.evt-defenses {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}
.evt-defense {
  padding: 6px 3px;
  border: 1px solid #bda6a16b;
  color: #ffe7c5;
  background: #34334d;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 850;
}
.evt-defense:hover:not(:disabled),
.evt-defense:focus-visible {
  border-color: #ffdeae;
  background: #525071;
}
.evt-defense:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.evt-defense small {
  font-size: 0.6rem;
  opacity: 0.6;
}
.evt-standee.evt-impact-strike {
  animation: evt-strike calc(0.44s * var(--evt-anim, 1)) ease-out both;
}
.evt-standee.evt-impact-hit {
  animation: evt-hit calc(0.54s * var(--evt-anim, 1)) ease-out both;
}
.evt-standee.evt-impact-miss {
  animation: evt-dodge calc(0.46s * var(--evt-anim, 1)) ease-out both;
}
.evt-standee.evt-fallen .evt-card-art {
  transform: perspective(350px) rotateY(85deg) rotateZ(8deg) scale(0.79);
  filter: grayscale(1);
  opacity: 0.42;
}
.evt-standee.evt-fallen .evt-card-label {
  color: #c7bfc8;
  text-decoration: line-through;
}
.evt-standee.evt-fallen {
  opacity: 0.6;
}
@keyframes evt-strike {
  0% {
    transform: translateX(-50%) rotateY(0deg);
  }
  37% {
    transform: translateX(-50%) translateY(-17%) rotateY(-16deg) scale(1.11);
  }
  65% {
    transform: translateX(-38%) translateY(-5%) rotateY(12deg) scale(1.07);
  }
  100% {
    transform: translateX(-50%);
  }
}
@keyframes evt-hit {
  0% {
    transform: translateX(-50%) rotateY(0);
    filter: brightness(1.8);
  }
  36% {
    transform: translateX(-50%) translateY(9%) rotateY(42deg);
    filter: brightness(2.1);
  }
  100% {
    transform: translateX(-50%);
    filter: brightness(1);
  }
}
@keyframes evt-dodge {
  0%,
  100% {
    transform: translateX(-50%);
  }
  45% {
    transform: translateX(-70%) rotateY(-15deg);
  }
}

.evt-cinematic {
  position: absolute;
  inset: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(10px, 3cqw, 44px);
  background: #04091ad9;
  overflow: auto;
}
.evt-cinematic-scenery {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, #080d20ed 2%, #121633c4 50%, #0a0f20f2 100%),
    url('/comet-city-academy/front/splash.webp') center 40% / cover;
  filter: saturate(0.8);
  pointer-events: none;
}
.evt-cinematic-content {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.3cqw, 18px);
  width: min(100%, 950px);
  max-height: 100%;
  min-height: 0;
  padding: clamp(14px, 2cqw, 28px);
  background: linear-gradient(140deg, #161b33ef, #292744f2);
  border: 1px solid #eac69e90;
  border-left: 5px solid #ffb669;
  border-radius: 14px;
  box-shadow: 0 12px 80px #000b;
  overflow-y: auto;
}
.evt-cinematic-rail {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  color: #c4b7ca;
}
.evt-cinematic-content h2 {
  font:
    900 clamp(1.5rem, 3.5cqw, 3.3rem)/1.03 Impact,
    'Arial Narrow',
    sans-serif;
  letter-spacing: 0.025em;
  color: #ffeacc;
  text-transform: uppercase;
}
.evt-dialogue {
  display: grid;
  gap: 8px;
}
.evt-dialogue-line {
  display: grid;
  grid-template-columns: minmax(70px, 124px) minmax(0, 1fr);
  gap: 12px;
  padding: 9px 12px;
  border-left: 2px solid #a6abdf;
  background: #030b2088;
}
.evt-dialogue-line strong {
  color: #ffd191;
  font-size: clamp(0.65rem, 0.9cqw, 0.82rem);
  letter-spacing: 0.1em;
}
.evt-dialogue-line p {
  font-size: clamp(0.83rem, 1.2cqw, 1.1rem);
  line-height: 1.42;
}
.evt-cinematic-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 9px;
}
.evt-story-choice {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 72px;
  padding: 12px;
  text-align: left;
  border: 1px solid #9a91b0;
  border-radius: 9px;
  color: #fef0d8;
  background: #30334f;
}
.evt-story-choice:hover,
.evt-story-choice:focus-visible {
  border-color: #ffe0a6;
  background: #444469;
  outline: 2px solid #ffe0a6;
  outline-offset: 1px;
}
.evt-choice-number {
  display: grid;
  place-items: center;
  flex: 0 0 24px;
  height: 24px;
  border: 1px solid #fdd29b;
  border-radius: 5px;
  color: #ffdca4;
}
.evt-choice-body {
  display: grid;
  gap: 3px;
  flex: 1;
}
.evt-choice-body strong {
  font-size: clamp(0.83rem, 1cqw, 1rem);
}
.evt-choice-body small {
  color: #cfcee0;
  font-size: clamp(0.7rem, 0.82cqw, 0.82rem);
}
.evt-scene-progress {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #bfc5dc;
  font-size: 0.7rem;
}
.evt-scene-progress span {
  padding: 2px 7px;
  border: 1px solid #616d88;
  border-radius: 99px;
}
@container (max-width: 640px) {
  .evt-cinematic-content {
    padding: 11px;
  }
  .evt-dialogue-line {
    display: block;
    padding: 7px;
  }
  .evt-dialogue-line strong {
    display: block;
    margin-bottom: 2px;
  }
  .evt-cinematic-actions {
    grid-template-columns: 1fr;
  }
  .evt-story-choice {
    min-height: 53px;
    padding: 8px;
  }
  .evt-cinematic-content h2 {
    font-size: 1.55rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .evt-standee.evt-impact-strike,
  .evt-standee.evt-impact-hit,
  .evt-standee.evt-impact-miss {
    animation: none;
  }
  .evt-standee,
  .evt-roster-card {
    transition: none;
  }
  .evt-tile:hover .evt-standee,
  .evt-tile.selected .evt-standee {
    transform: translateX(-50%);
  }
}

.evt-studio {
  position: absolute;
  inset: 0;
  z-index: 28;
  padding: clamp(12px, 2cqw, 28px);
  color: #fff1d8;
  background: radial-gradient(ellipse at 40% 25%, #3d375f, #10162b 75%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}
.evt-studio-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}
.evt-studio-header h2 {
  font:
    900 clamp(1.4rem, 3cqw, 3rem)/1.1 Impact,
    system-ui,
    sans-serif;
  letter-spacing: 0.08em;
  color: #ffdf9b;
}
.evt-studio-header p,
.evt-studio-details small,
.evt-studio-tools small {
  font-size: 0.74rem;
  line-height: 1.4;
  color: #d0cfe6;
}
.evt-studio-body {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: minmax(145px, 0.8fr) minmax(280px, 2.7fr) minmax(
      190px,
      1fr
    );
  gap: 14px;
}
.evt-studio-tools,
.evt-studio-details {
  display: flex;
  flex-direction: column;
  gap: 9px;
  min-height: 0;
  overflow: auto;
  background: #161e37e8;
  border: 1px solid #829fc35a;
  border-radius: 12px;
  padding: 12px;
}
.evt-studio-label {
  font-size: 0.65rem;
  font-weight: 900;
  color: #fedda2;
  letter-spacing: 0.1em;
}
.evt-studio-tools select,
.evt-studio-details select,
.evt-studio-details input,
.evt-studio-details textarea {
  width: 100%;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #7487a5;
  background: #252e4b;
  color: #fff8e8;
  font: 600 0.78rem system-ui;
}
.evt-brushes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}
.evt-brushes button {
  color: #e1e6f6;
  background: #263552;
  border: 1px solid #8193b3;
  border-radius: 6px;
  padding: 9px 4px;
  font-weight: 700;
  font-size: 0.72rem;
}
.evt-brushes button.chosen {
  color: #111b35;
  background: #a8e9fb;
  border-color: #ffdf9b;
}
.evt-studio-canvas {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 9px;
  padding: clamp(5px, 1cqw, 12px);
  border-radius: 12px;
  background: radial-gradient(ellipse, #34486b, #1b2945 73%);
  border: 1px solid #8ca9ca89;
}
.evt-studio-board {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 3px;
}
.evt-studio-cell {
  aspect-ratio: 1;
  min-width: 0;
  display: grid;
  place-items: center;
  background: #526a8e;
  border: 1px solid #b6ccdc80;
  border-radius: 4px;
  color: #daeaff;
  font-size: clamp(0.6rem, 1.7cqw, 1.4rem);
  font-weight: 900;
  cursor: crosshair;
}
.evt-studio-cell.wall {
  background: #1a223c;
  color: #ecaa90;
}
.evt-studio-cell.cover {
  background: #5e6172;
  color: #fbe4aa;
}
.evt-studio-cell.raised {
  box-shadow: inset 0 0 0 2px #a8e6ef;
}
.evt-studio-cell:focus-visible {
  outline: 3px solid #fbd47f;
  outline-offset: 1px;
}
.evt-studio-unit {
  border-radius: 50%;
  background: #aaefc5;
  color: #0c2844;
  padding: 3px 8px;
}
.evt-studio-legend {
  color: #d2cce5;
  font-size: 0.65rem;
  text-align: center;
}
.evt-studio-ready,
.evt-studio-errors {
  font-size: 0.72rem;
  line-height: 1.35;
  padding: 8px;
  border: 1px solid #88bdaa;
  border-radius: 6px;
}
.evt-studio-errors {
  color: #ffc6b0;
  border-color: #e59f94;
  padding-left: 24px;
}
.evt-studio-launch {
  color: #1d243b;
  background: #fbd47f;
  border: 1px solid #fff1c5;
  padding: 12px 8px;
  border-radius: 7px;
  font-size: 0.83rem;
  font-weight: 900;
}
.evt-studio-launch:disabled {
  opacity: 0.4;
}
@media (max-width: 770px) {
  .evt-studio {
    overflow: auto;
  }
  .evt-studio-body {
    grid-template-columns: 1fr;
    overflow: auto;
  }
  .evt-studio-canvas {
    order: -1;
  }
  .evt-brushes {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
