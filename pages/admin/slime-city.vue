<template>
  <main
    class="kr-surface slime-lab h-full min-h-0 overflow-hidden"
    data-layout="console-fixed"
    data-testid="slime-city-lab"
  >
    <div class="sc-shell">
      <header class="sc-header">
        <div class="sc-brand">
          <span class="sc-overline">KIND ROBOTS / COMBAT SYSTEMS LAB 001</span>
          <div class="sc-wordmark">
            SLIME <span>CITY</span><small> working title</small>
          </div>
        </div>
        <nav class="sc-tabs" aria-label="Laboratory views">
          <button
            type="button"
            :class="{ active: lab.view === 'city' }"
            @click="lab.showCity()"
          >
            CITY
          </button>
          <button
            type="button"
            :class="{ active: lab.view === 'arena' }"
            @click="lab.view = 'arena'"
          >
            ARENA
          </button>
          <button
            type="button"
            :class="{ active: lab.view === 'campaign' }"
            data-testid="slime-campaign-tab"
            @click="lab.showCampaign()"
          >
            STORY
          </button>
          <button
            type="button"
            :class="{ active: lab.view === 'cards' }"
            @click="lab.showCards()"
          >
            CARDS
          </button>
        </nav>
        <div class="sc-hud">
          <span class="sc-led"></span> PRIVATE PLAYTEST <strong>0 MEAT</strong>
        </div>
      </header>

      <div class="sc-main">
        <aside class="sc-roster" aria-label="Teams">
          <p class="sc-overline">THE SIX CREWS</p>
          <div class="sc-team-list">
            <button
              v-for="team in lab.teams"
              :key="team.id"
              type="button"
              class="sc-team"
              :class="[
                'tone-' + team.color,
                { chosen: lab.activeTeam === team.id },
              ]"
              :aria-pressed="lab.activeTeam === team.id"
              @click="lab.chooseTeam(team.id)"
            >
              <span class="sc-emblem">{{ team.insignia }}</span>
              <span class="sc-team-text"
                ><strong>{{ team.name }}</strong
                ><small>{{ team.motto }}</small></span
              >
            </button>
          </div>
          <div class="sc-profile">
            <div class="sc-big-emblem" :class="'tone-' + lab.team.color">
              {{ lab.team.insignia }}
            </div>
            <p class="sc-overline">THE {{ lab.team.district }}</p>
            <strong>{{ lab.team.name }}</strong>
            <p>{{ lab.team.hook }}</p>
          </div>
        </aside>

        <section
          v-if="lab.view === 'city'"
          class="sc-stage"
          aria-label="Slime City district map"
        >
          <div class="sc-city">
            <div class="sc-moon"></div>
            <div class="sc-skyline sc-skyline-back"></div>
            <div class="sc-skyline sc-skyline-front"></div>
            <div class="sc-road"></div>
            <div class="sc-city-overline">THE CITY IS THE ARENA</div>
            <svg
              class="sc-streets"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                v-for="street in streetLines"
                :key="street.name"
                :x1="street.x1"
                :y1="street.y1"
                :x2="street.x2"
                :y2="street.y2"
                :class="{ open: street.open, witnessed: street.witnessed }"
              />
            </svg>
            <button
              v-for="place in lab.districts"
              :key="place.id"
              type="button"
              class="sc-district"
              :class="[
                'is-' + lab.districtStatus(place.id),
                { picked: lab.districtId === place.id },
              ]"
              :style="{ left: place.x + '%', top: place.y + '%' }"
              :aria-pressed="lab.districtId === place.id"
              :aria-label="
                place.name + ', ' + statusLabel(lab.districtStatus(place.id))
              "
              :data-testid="'slime-district-' + place.id"
              @click="lab.visit(place.id)"
            >
              <span class="sc-district-pin">{{
                pinSymbol(lab.districtStatus(place.id))
              }}</span>
              <span class="sc-district-label">{{ place.name }}</span>
            </button>
          </div>
          <div class="sc-city-selection kr-scroll" data-testid="slime-dossier">
            <article
              v-if="lab.streetEvent"
              class="sc-street-encounter"
              data-testid="slime-street-encounter"
              aria-live="polite"
            >
              <span class="sc-overline"
                >STREET STORY · {{ lab.city.pendingStreet }}</span
              >
              <h2>{{ lab.streetEvent.title }}</h2>
              <p class="sc-scene">{{ lab.streetEvent.scene }}</p>
              <div class="sc-choices">
                <button
                  v-for="choice in lab.streetEvent.choices"
                  :key="choice.id"
                  type="button"
                  :data-testid="'slime-street-choice-' + choice.id"
                  @click="lab.chooseStreet(choice.id)"
                >
                  <strong>{{ choice.label }}</strong>
                  <small>{{ choice.outcome }}</small>
                </button>
              </div>
            </article>
            <template v-else>
              <p class="sc-overline">
                {{ lab.district.name }} /
                {{ statusLabel(lab.districtStatus(lab.districtId)) }}
              </p>
              <p class="sc-scene">{{ lab.plan.scene }}</p>
              <p class="sc-rival">
                <strong>{{ lab.plan.rival.name }}</strong>
                · {{ lab.plan.rival.title }} ·
                {{ teamName(lab.plan.rival.team) }} ·
                {{ modeTitle(lab.plan.rival.mode) }}
                <em>“{{ lab.plan.rival.taunt }}”</em>
              </p>
              <template v-if="lab.here">
                <div v-if="chosenChoice" class="sc-decided">
                  <span class="sc-overline">YOUR CALL</span>
                  {{ chosenChoice.label }}: {{ chosenChoice.outcome }}
                </div>
                <div v-else-if="!lab.gate" class="sc-choices">
                  <button
                    v-for="choice in lab.plan.choices"
                    :key="choice.id"
                    type="button"
                    :data-testid="'slime-choice-' + choice.id"
                    @click="lab.choose(choice.id)"
                  >
                    <strong>{{ choice.label }}</strong>
                    <small>{{ choice.outcome }}</small>
                  </button>
                </div>
                <p v-if="lab.blocked" class="sc-gate">{{ lab.blocked }}</p>
                <span class="sc-city-actions">
                  <button
                    type="button"
                    data-testid="slime-fight-rival"
                    :disabled="!!lab.blocked"
                    @click="lab.fightRival()"
                  >
                    FIGHT {{ lab.plan.rival.name.toUpperCase() }} →
                  </button>
                  <button
                    type="button"
                    class="sc-quiet"
                    @click="lab.startDistrictMatch()"
                  >
                    QUICK MATCH
                  </button>
                </span>
                <SlimeCityDistrictContract />
              </template>
              <span v-else class="sc-city-actions">
                <button
                  v-if="lab.route"
                  type="button"
                  data-testid="slime-walk"
                  @click="lab.walk()"
                >
                  WALK {{ lab.route.street.toUpperCase() }} →
                </button>
                <span v-else class="sc-gate"
                  >No street from {{ hereName }} reaches here. Walk the lit
                  streets.</span
                >
              </span>
            </template>
          </div>
          <div class="sc-stage-foot">
            <span
              >NIGHT {{ lab.city.nights }} · HEAT {{ lab.city.heat }}/{{
                lab.heatLimit
              }}
              · STANDING {{ lab.standing }} · CHAMPIONS
              {{ lab.city.cleared.length }}/7 · STREET STORIES
              {{ lab.streetProgress }}/9 · CONTRACTS
              {{ lab.city.contracts.length }}/7</span
            ><span>{{ lab.city.log[0] }}</span>
          </div>
        </section>

        <SlimeCityCampaign v-else-if="lab.view === 'campaign'" />
        <section
          v-else-if="lab.view === 'arena'"
          class="sc-stage sc-arena-stage"
          aria-label="Prototype combat arena"
        >
          <div class="sc-arena-head">
            <div>
              <span class="sc-overline"
                >PROTOTYPE {{ currentModeIndex }} / 03 · SEED
                {{ lab.match.seed }}</span
              >
              <span
                v-if="lab.campaignBout && lab.activeChapter"
                class="sc-overline sc-bout-line"
                data-testid="slime-campaign-bout-line"
                >STORY CHAPTER {{ lab.campaignBout.index + 1 }}/5 ·
                {{ lab.activeChapter.title }}</span
              >
              <span
                v-if="lab.boutPlan"
                class="sc-overline sc-bout-line"
                data-testid="slime-bout-line"
                >RIVAL BOUT · {{ lab.boutPlan.rival.name }} ·
                {{ lab.boutPlan.street }}</span
              >
              <h2>
                {{ currentMode.title }}
                <small
                  >{{ currentMode.size }} · {{ currentMode.cadence }}</small
                >
              </h2>
            </div>
            <div class="sc-arena-scores">
              <span v-if="lab.mode === 'blackout'"
                >FLAG <b>{{ flagStatus }}</b></span
              >
              <template v-else>
                <span
                  >YOU <b>{{ lab.match.score[0] }}</b></span
                ><span
                  >ENEMY <b>{{ lab.match.score[1] }}</b></span
                >
              </template>
              <button
                type="button"
                class="sc-help"
                data-testid="slime-how-to-play"
                :aria-expanded="lab.guideOpen"
                @click="lab.toggleGuide()"
              >
                HOW TO PLAY
              </button>
            </div>
          </div>
          <div class="sc-arena-backdrop">
            <div
              class="sc-board"
              :class="'sc-board-' + lab.mode"
              :style="{
                gridTemplateColumns:
                  'repeat(' + lab.match.width + ', minmax(0, 1fr))',
                gridTemplateRows:
                  'repeat(' + lab.match.height + ', minmax(0, 1fr))',
              }"
              role="group"
              :aria-label="currentMode.size + ' square-grid battlefield'"
            >
              <button
                v-for="cell in lab.board"
                :key="cell.x + '-' + cell.y"
                type="button"
                class="sc-tile"
                :class="{
                  home: cell.x === 0,
                  away: cell.x === lab.match.width - 1,
                  flag:
                    lab.mode === 'blackout' &&
                    cell.x === lab.sight.flag.x &&
                    cell.y === lab.sight.flag.y,
                  target:
                    lab.selectedUnit !== null || lab.selectedCard !== null,
                  lair: monsterHere(cell.x, cell.y),
                  neutral:
                    lab.mode === 'blackout' &&
                    cell.x >= 2 &&
                    cell.x < lab.match.width - 2,
                  legalMove: lab.canMoveTo(cell.x, cell.y),
                  inRange:
                    !!fighterAt(cell.x, cell.y) &&
                    lab.attackTargets.includes(fighterAt(cell.x, cell.y)!.id),
                  marked:
                    !!fighterAt(cell.x, cell.y) &&
                    lab.targetUnit === fighterAt(cell.x, cell.y)!.id,
                }"
                :data-testid="'slime-tile-' + cell.x + '-' + cell.y"
                :aria-label="cellAria(cell.x, cell.y)"
                @click="lab.touchSquare(cell.x, cell.y)"
              >
                <span
                  v-if="
                    lab.mode === 'blackout' &&
                    cell.x === lab.sight.flag.x &&
                    cell.y === lab.sight.flag.y
                  "
                  class="sc-flag"
                  >⚑</span
                >
                <span v-if="visibleTrap(cell.x, cell.y)" class="sc-trap"
                  >◇</span
                >
                <span
                  v-if="monsterHere(cell.x, cell.y)"
                  class="sc-monster"
                  data-testid="slime-monster"
                  ><span>❂</span
                  ><small>{{ lab.sight.monster?.hp }}</small></span
                >
                <span
                  v-if="fighterAt(cell.x, cell.y)"
                  class="sc-fighter"
                  :class="[
                    fighterAt(cell.x, cell.y)?.side === 'player'
                      ? 'friendly'
                      : 'hostile',
                    {
                      selected:
                        lab.selectedUnit === fighterAt(cell.x, cell.y)?.id,
                      sealed: fighterAt(cell.x, cell.y)?.hidden,
                      carrier: fighterAt(cell.x, cell.y)?.carryingFlag,
                      rooted: fighterAt(cell.x, cell.y)?.rooted,
                    },
                  ]"
                >
                  <span>{{ fighterSymbol(cell.x, cell.y) }}</span>
                  <small>{{ fighterHp(cell.x, cell.y) }}</small>
                </span>
              </button>
            </div>
            <div
              v-if="lab.previewOpen && lab.inspectedCard"
              class="sc-card-overlay"
              role="dialog"
              aria-modal="false"
              :aria-label="lab.inspectedCard.name + ' card details'"
              data-testid="slime-card-preview"
            >
              <div class="sc-card-poster" :class="'tone-' + lab.team.color">
                <span class="sc-card-poster-art">{{
                  lab.inspectedCard.symbol
                }}</span>
                <span class="sc-overline"
                  >ILLUSTRATION PENDING · {{ lab.team.name }}</span
                >
              </div>
              <div class="sc-card-information">
                <span class="sc-overline"
                  >{{ lab.inspectedCard.kind.toUpperCase() }} ·
                  {{ lab.inspectedCard.cost }} MANA</span
                >
                <h3>{{ lab.inspectedCard.name }}</h3>
                <p
                  v-if="lab.inspectedCard.kind === 'creature'"
                  class="sc-card-stats"
                >
                  ATK {{ lab.inspectedCard.attack }} · HP
                  {{ lab.inspectedCard.hp }} · ARMOR
                  {{ lab.inspectedCard.armor }} · MOVE
                  {{ lab.inspectedCard.ap }} · RANGE
                  {{ cardAttackRange(lab.inspectedCard) }}
                </p>
                <p>{{ lab.inspectedCard.text }}</p>
                <p
                  v-if="lab.inspectedCard.keywords?.length"
                  class="sc-card-stats"
                >
                  {{
                    lab.inspectedCard.keywords
                      .map((k) => lab.keywords[k].label)
                      .join(' · ')
                  }}
                </p>
                <p
                  v-if="lab.inspectedCard.kind === 'creature'"
                  class="sc-overline"
                >
                  Newly summoned monsters cannot attack immediately.
                </p>
                <p
                  v-if="lab.inspectedCard.cost > lab.match.mana"
                  class="sc-no-mana"
                >
                  NEEDS {{ lab.inspectedCard.cost }} MANA · YOU HAVE
                  {{ lab.match.mana }}
                </p>
                <div class="sc-card-cta">
                  <button
                    type="button"
                    data-testid="slime-card-choose-target"
                    @click="lab.closePreview()"
                  >
                    {{
                      lab.inspectedCard.cost <= lab.match.mana
                        ? 'CHOOSE TARGET →'
                        : 'BACK TO ARENA'
                    }}
                  </button>
                  <button
                    type="button"
                    class="sc-quiet"
                    @click="lab.chooseCard(lab.inspectedCard.id)"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>
            <div v-if="lab.match.victor" class="sc-result" role="status">
              <strong>{{
                lab.match.victor === 'player'
                  ? 'VICTORY IN THE PIT'
                  : lab.match.victor === 'draw'
                    ? 'MUTUAL DESTRUCTION'
                    : 'THE PIT CLAIMS YOU'
              }}</strong
              ><span>{{ winLine }}</span
              ><span class="sc-result-actions"
                ><button
                  v-if="lab.lastBout || lab.lastContract || lab.lastCampaign"
                  type="button"
                  @click="lab.lastCampaign ? lab.showCampaign() : lab.showCity()"
                >
                  {{ lab.lastCampaign ? 'BACK TO STORY' : 'BACK TO THE CITY' }}</button
                ><button type="button" @click="lab.reset(true)">
                  SAME SEED</button
                ><button type="button" @click="lab.reset()">
                  NEW SEED
                </button></span
              >
            </div>
            <div
              v-if="lab.guideOpen"
              class="sc-guide kr-scroll"
              role="dialog"
              aria-modal="false"
              :aria-label="'How to play ' + currentMode.title"
              data-testid="slime-guide"
            >
              <span class="sc-overline"
                >HOW TO PLAY / {{ currentMode.title }}</span
              >
              <p class="sc-guide-goal">{{ lab.guide.goal }}</p>
              <ol>
                <li v-for="step in lab.guide.steps" :key="step">{{ step }}</li>
              </ol>
              <span class="sc-overline">PROTOTYPE LIMITS</span>
              <ul>
                <li v-for="item in lab.guide.limits" :key="item">
                  {{ item }}
                </li>
              </ul>
              <p class="sc-guide-seed">
                Seed {{ lab.match.seed }}: the same seed and the same moves
                replay the same match.
              </p>
              <button
                type="button"
                data-testid="slime-guide-close"
                @click="lab.closeGuide()"
              >
                GOT IT · PLAY
              </button>
            </div>
          </div>
          <div class="sc-battle-bottom">
            <span
              >{{ lab.mode === 'bloodrush' ? 'TICK' : 'ROUND' }}
              {{ lab.match.round }}/{{ lab.match.maxRounds }} ·
              {{ lab.match.mana }} MANA<template v-if="lab.sight.debt[0]">
                · OWES {{ lab.sight.debt[0] }}</template
              ><template v-if="lab.match.overtime"> · SUDDEN DEATH</template
              ><template v-if="lab.sight.monster">
                · MONSTER {{ lab.sight.monster.hp }}/{{
                  lab.sight.monster.maxHp
                }}</template
              ></span
            >
            <span aria-live="polite">{{ lab.match.log[0] }}</span>
            <button
              v-if="lab.mode !== 'bloodrush'"
              type="button"
              :disabled="!!lab.match.victor"
              data-testid="slime-next-round"
              @click="lab.nextRound()"
            >
              END ROUND ↻
            </button>
            <button
              v-else
              type="button"
              :disabled="!!lab.match.victor"
              data-testid="slime-toggle-rush"
              @click="lab.toggleRush()"
            >
              {{ lab.running ? 'PAUSE ■' : 'RUN ▶' }}
            </button>
          </div>
        </section>

        <section
          v-else
          class="sc-stage sc-collection"
          aria-label="Special cards and creature collection"
        >
          <div class="sc-collection-title">
            <span class="sc-overline">THE ARMORY / PROTOTYPE CARDS</span>
            <h2>{{ lab.team.name }}</h2>
            <p>{{ lab.team.hook }}</p>
            <p data-testid="slime-crew-pattern">
              <b>PLAY PATTERN</b> {{ lab.team.pattern }}
            </p>
            <p data-testid="slime-crew-counters">
              <b>HOW TO BEAT THEM</b> {{ lab.team.counters }}
            </p>
          </div>
          <div class="sc-collection-grid kr-scroll">
            <article
              v-for="card in lab.cards"
              :key="card.id"
              class="sc-collect-card"
              :class="'tone-' + lab.team.color"
            >
              <div class="sc-collect-art">{{ card.symbol }}</div>
              <div>
                <span
                  >{{ card.kind.toUpperCase() }} · {{ card.cost }} MANA<template
                    v-if="card.signature"
                  >
                    · SIGNATURE</template
                  ></span
                ><strong>{{ card.name }}</strong>
                <p>{{ card.text }}</p>
                <ul
                  v-if="(card.keywords ?? card.grants ?? []).length"
                  class="sc-keywords"
                >
                  <li
                    v-for="k in card.keywords ?? card.grants ?? []"
                    :key="k"
                    :title="lab.keywords[k].text"
                  >
                    <b>{{ lab.keywords[k].label }}</b>
                    {{ lab.keywords[k].text }}
                  </li>
                </ul>
              </div>
              <small v-if="card.kind === 'creature'"
                >ATK {{ card.attack }} / HP {{ card.hp }} / ARMOR
                {{ card.armor }} / AP {{ card.ap }}</small
              >
            </article>
          </div>
        </section>

        <aside class="sc-controls" aria-label="Playtest controls">
          <div class="sc-control-heading">
            <span class="sc-overline">CHOOSE THE RULES</span
            ><strong>THREE WAYS TO DIE</strong>
          </div>
          <div class="sc-mode-list">
            <button
              v-for="preset in lab.modes"
              :key="preset.id"
              type="button"
              class="sc-mode"
              :class="{
                active: lab.mode === preset.id && lab.view === 'arena',
              }"
              :data-testid="'slime-mode-' + preset.id"
              @click="lab.chooseMode(preset.id)"
            >
              <strong>{{ preset.title }}</strong
              ><span>{{ preset.size }} / {{ preset.cadence }}</span
              ><small
                >{{
                  preset.id === 'blackout'
                    ? 'MAIN GAME · '
                    : preset.id === 'bloodrush'
                      ? 'ARCADE · '
                      : 'EXPERIMENT · '
                }}{{ preset.subtitle }}</small
              >
            </button>
          </div>
          <div
            v-if="lab.view === 'arena'"
            class="sc-rules"
            data-testid="slime-rules"
          >
            <span class="sc-overline">RULE VARIANTS · RESTART SAME SEED</span>
            <div class="sc-rule-list">
              <button
                v-for="variant in lab.variants"
                :key="variant.id"
                type="button"
                class="sc-rule"
                :class="{ on: lab.rules[variant.id] }"
                :aria-pressed="lab.rules[variant.id]"
                :title="variant.text"
                :data-testid="'slime-rule-' + variant.id"
                @click="lab.toggleRule(variant.id)"
              >
                {{ variant.label }}
              </button>
            </div>
            <small v-if="activeRules.length" class="sc-rule-note">{{
              activeRules.map((v) => v.text).join(' ')
            }}</small>
          </div>
          <template v-if="lab.view === 'arena'">
            <div class="sc-actions">
              <div class="sc-control-heading">
                <span class="sc-overline">{{
                  lab.mode === 'blackout'
                    ? 'YOUR FOUR-CARD HAND'
                    : 'ARCADE CARD RACK'
                }}</span
                ><span>AVAILABLE {{ lab.match.mana }} MANA</span>
              </div>
              <div class="sc-hand">
                <button
                  v-for="card in lab.mode === 'blackout' ? lab.hand : lab.cards"
                  :key="card.id"
                  type="button"
                  class="sc-hand-card"
                  :class="[
                    {
                      selected: lab.selectedCard === card.id,
                      unavailable:
                        card.cost > lab.match.mana || !lab.ready(card.id),
                    },
                    'tone-' + lab.team.color,
                  ]"
                  :data-testid="'slime-card-' + card.id"
                  :aria-pressed="lab.selectedCard === card.id"
                  @click="lab.chooseCard(card.id)"
                >
                  <span class="sc-card-symbol">{{ card.symbol }}</span>
                  <span
                    ><strong>{{ card.name }}</strong
                    ><small>{{ card.kind }}</small></span
                  >
                  <b>{{ card.cost }}</b>
                  <i v-if="!lab.ready(card.id)" class="sc-resting">USED</i>
                </button>
              </div>
              <p
                v-if="lab.mode === 'blackout'"
                class="sc-hand-count"
                data-testid="slime-deck-count"
              >
                DRAW {{ lab.match.piles.player.length }} · DISCARD
                {{ lab.match.discards.player.length }} · NEXT DEAL ON END ROUND
              </p>
              <p v-if="lab.selected" class="sc-selected-line">
                {{ lab.unitLabel(lab.selected.cardId) }} · HP
                {{ lab.selected.hp }}/{{ lab.selected.maxHp }} · ATK
                {{ lab.selected.attack }} · ARMOR {{ lab.selected.armor }} · AP
                {{ lab.selected.ap }}/{{ lab.selected.maxAp
                }}<template v-if="lab.selected.keywords?.length">
                  ·
                  {{
                    lab.selected.keywords
                      .map((k) => lab.keywords[k].label)
                      .join(' ')
                  }}</template
                >
              </p>
              <div
                v-if="lab.mode === 'blackout' && lab.selected"
                class="sc-action-deck"
                data-testid="slime-attack-actions"
              >
                <span class="sc-overline"
                  >SELECT AN ENEMY HIGHLIGHTED IN RED TO ATTACK</span
                >
                <button
                  type="button"
                  class="sc-attack-button"
                  data-testid="slime-attack"
                  :disabled="lab.targetUnit === null"
                  @click="lab.attackSelected()"
                >
                  <span class="sc-attack-symbol">{{ attackSymbol }}</span>
                  {{ (lab.selected.attackStyle ?? 'sword').toUpperCase() }}
                  ATTACK
                  <span>{{
                    lab.targetUnit !== null
                      ? lab.attackPreview + ' DAMAGE'
                      : 'CHOOSE TARGET'
                  }}</span>
                </button>
                <small
                  v-if="
                    lab.selected.summonedRound === lab.match.round &&
                    !lab.selected.keywords?.includes('ambush')
                  "
                >
                  JUST SUMMONED · CAN MOVE, CANNOT ATTACK UNTIL NEXT ROUND
                </small>
                <small
                  v-else-if="lab.selected.attackedRound === lab.match.round"
                >
                  ALREADY ATTACKED THIS ROUND
                </small>
                <small v-else
                  >RANGE {{ lab.selected.range ?? 1 }} · MOVE AP
                  {{ lab.selected.ap }}</small
                >
              </div>
              <ol class="sc-log" aria-label="Recent events">
                <li v-for="(line, i) in lab.match.log.slice(0, 6)" :key="i">
                  {{ line }}
                </li>
              </ol>
              <button
                v-if="lab.selected?.hidden"
                class="sc-reveal"
                type="button"
                @click="lab.unmask()"
              >
                REVEAL SELECTED FIGHTER
              </button>
              <span class="sc-reset-row"
                ><button
                  class="sc-reset"
                  type="button"
                  @click="lab.reset(true)"
                >
                  SAME SEED ↺</button
                ><button class="sc-reset" type="button" @click="lab.reset()">
                  NEW SEED ↻
                </button></span
              >
            </div>
          </template>
          <div v-else class="sc-brief">
            <span class="sc-overline">RULES FIELD NOTES</span>
            <p>{{ currentMode.detail }}</p>
            <p>{{ lab.guide.goal }}</p>
            <p>
              Pick a crew, test a board, and swap teams. These are reversible
              local simulations; no Meat, inventory or online match is saved.
            </p>
          </div>
        </aside>
      </div>
      <footer class="sc-footer">
        <span>SLIME CITY / EXPERIMENTAL INTERNAL BUILD</span
        ><span>{{
          lab.view === 'arena'
            ? 'Tap a card, then a tile. Select a fighter and an adjacent square to move in Blackout. HOW TO PLAY explains each format.'
            : 'Six team identities. One city. Three test rulesets.'
        }}</span>
      </footer>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import {
  cardAttackRange,
  cardById,
  type ViewFighter,
} from '~/utils/slimeCity/prototypes'
import { STREETS } from '~/utils/slimeCity/city'
import { useSlimeCityStore } from '~/stores/slimeCity'

const lab = useSlimeCityStore()
const currentMode = computed(
  () => lab.modes.find((mode) => mode.id === lab.mode) || lab.modes[0]!,
)
const currentModeIndex = computed(() =>
  String(lab.modes.findIndex((mode) => mode.id === lab.mode) + 1).padStart(
    2,
    '0',
  ),
)

const hereName = computed(
  () => lab.districts.find((d) => d.id === lab.city.location)?.name ?? 'here',
)
const chosenChoice = computed(() =>
  lab.plan.choices.find((c) => c.id === lab.city.choices[lab.districtId]),
)
const streetLines = computed(() =>
  STREETS.map(([a, b, name]) => {
    const from = lab.districts.find((d) => d.id === a)!
    const to = lab.districts.find((d) => d.id === b)!
    return {
      name,
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      open: a === lab.city.location || b === lab.city.location,
      witnessed: !!lab.city.streetChoices[name],
    }
  }),
)
function statusLabel(status: string): string {
  return (
    {
      here: 'you are here',
      cleared: 'champion beaten',
      locked: 'gate closed',
      reachable: 'one street away',
      far: 'no direct street',
    }[status] ?? status
  )
}
function pinSymbol(status: string): string {
  return (
    { here: '●', cleared: '✓', locked: '✕', reachable: '◆', far: '◇' }[
      status
    ] ?? '◆'
  )
}
function teamName(id: string): string {
  return lab.teams.find((t) => t.id === id)?.name ?? id
}
function modeTitle(id: string): string {
  return lab.modes.find((m) => m.id === id)?.title ?? id
}
const attackSymbol = computed(
  () =>
    ({
      sword: '⚔',
      arrow: '➶',
      spell: '✦',
      claw: '✥',
      hammer: '✣',
      blast: '✷',
    })[lab.selected?.attackStyle ?? 'sword'],
)
const flagStatus = computed(() => {
  const carrier = lab.sight.units.find((unit) => unit.carryingFlag)
  if (!carrier) return 'LOOSE'
  return carrier.side === 'player' ? 'YOURS' : 'TAKEN'
})
const activeRules = computed(() => lab.variants.filter((v) => lab.rules[v.id]))
function monsterHere(x: number, y: number): boolean {
  const m = lab.sight.monster
  return !!m && m.x === x && m.y === y
}
const winLine = computed(() => {
  const how = {
    flag: 'Flag carried home.',
    score: 'Breakthroughs decided it.',
    rout: 'One side was routed.',
    time: 'Round limit reached.',
    monster: 'The giant monster fell.',
  }
  return lab.match.winPath ? how[lab.match.winPath] : ''
})

// The board draws only what the player may know (lab.sight): concealed
// enemies carry no identity and enemy traps are absent.
function fighterAt(x: number, y: number): ViewFighter | undefined {
  return lab.sight.units.find((unit) => unit.x === x && unit.y === y)
}
function fighterSymbol(x: number, y: number): string {
  const unit = fighterAt(x, y)
  if (!unit) return ''
  if (!unit.cardId) return '?'
  return cardById(unit.cardId).symbol
}
function fighterHp(x: number, y: number): string {
  const unit = fighterAt(x, y)
  return unit?.hp == null ? '' : String(unit.hp)
}
function visibleTrap(x: number, y: number): boolean {
  return lab.sight.traps.some((trap) => trap.x === x && trap.y === y)
}
function cellAria(x: number, y: number): string {
  const unit = fighterAt(x, y)
  const name = unit
    ? !unit.cardId
      ? 'hidden enemy'
      : (unit.side === 'enemy' ? 'enemy ' : '') +
        cardById(unit.cardId).name +
        ', ' +
        unit.hp +
        ' hit points' +
        (unit.carryingFlag ? ', carrying the flag' : '')
    : 'empty'
  const flag =
    lab.mode === 'blackout' &&
    !unit &&
    x === lab.sight.flag.x &&
    y === lab.sight.flag.y
      ? ', flag'
      : ''
  const monster = monsterHere(x, y)
    ? 'giant monster, ' + lab.sight.monster!.hp + ' hit points'
    : ''
  return 'Square ' + (x + 1) + ', ' + (y + 1) + ': ' + (monster || name + flag)
}
onUnmounted(() => lab.dispose())
</script>

<style scoped>
.slime-lab {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #f7f2e8;
  background: #090d16;
  font-family: system-ui, sans-serif;
  container-type: size;
}
.sc-shell {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: radial-gradient(
    ellipse at 65% 0%,
    #29314c 0%,
    #101724 48%,
    #0a0e16 80%
  );
}
.sc-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid #69708255;
  background: #080c16ef;
}
.sc-overline {
  display: block;
  color: #a6aac0;
  font-size: 0.61rem;
  letter-spacing: 0.2em;
  font-weight: 850;
  text-transform: uppercase;
}
.sc-brand .sc-wordmark {
  margin: 0;
  font-size: clamp(1.25rem, 2.7vw, 2.5rem);
  font-weight: 1000;
  line-height: 1;
  letter-spacing: -0.065em;
  font-style: italic;
  text-shadow: 0 0 25px #f35c5944;
}
.sc-brand .sc-wordmark span {
  color: #c3ff55;
}
.sc-brand .sc-wordmark small {
  display: inline-block;
  color: #999eb4;
  font-size: 0.53rem;
  letter-spacing: 0.03em;
  font-style: normal;
  font-weight: 500;
}
.sc-tabs {
  display: flex;
  gap: 0.35rem;
  padding: 0.25rem;
  border: 1px solid #4d5567;
  border-radius: 0.7rem;
  background: #0e1420;
}
.sc-tabs button {
  min-width: 4.2rem;
  padding: 0.55rem 0.8rem;
  border-radius: 0.46rem;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #afb8c5;
}
.sc-tabs button.active {
  background: #c5ff59;
  color: #142016;
  box-shadow: 0 0 18px #c5ff5944;
}
.sc-hud {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  color: #afbad1;
  white-space: nowrap;
}
.sc-hud strong {
  padding: 0.45rem 0.7rem;
  color: #dfff93;
  background: #19271c;
  border: 1px solid #7ba74a77;
  border-radius: 0.3rem;
}
.sc-led {
  height: 0.4rem;
  width: 0.4rem;
  border-radius: 100%;
  background: #adfa6a;
  box-shadow: 0 0 8px #adfa6a;
}
.sc-main {
  display: grid;
  grid-template-columns: minmax(11rem, 16rem) minmax(0, 1fr) minmax(
      13rem,
      18rem
    );
  flex: 1;
  min-height: 0;
}
.sc-roster {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1rem 0.7rem 1rem 1rem;
  background: linear-gradient(130deg, #171d2b, #0d121c);
  border-right: 1px solid #66738855;
}
.sc-team-list {
  display: flex;
  flex-direction: column;
  gap: 0.37rem;
  overflow: auto;
  min-height: 0;
  padding-right: 0.2rem;
}
.sc-team {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-align: left;
  padding: 0.55rem;
  border-radius: 0.5rem;
  border: 1px solid #ffffff22;
  background: #22273788;
  color: #fff;
  min-height: 3.7rem;
  transition:
    transform 0.12s,
    border 0.12s;
}
.sc-team:hover {
  transform: translateX(2px);
  border-color: #fff7;
}
.sc-team.chosen {
  border-color: var(--tone);
  background: color-mix(in srgb, var(--tone) 20%, #141c29);
}
.sc-emblem {
  flex: none;
  display: grid;
  place-items: center;
  width: 2.3rem;
  height: 2.5rem;
  font-size: 1.65rem;
  border-radius: 0.35rem;
  background: radial-gradient(#ffffff44, transparent 70%), var(--tone);
  color: #0b1222;
  text-shadow: 0 0 10px #fff;
}
.sc-team-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.15rem;
}
.sc-team-text strong {
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  line-height: 1.1;
}
.sc-team-text small {
  font-size: 0.64rem;
  color: #b6c0d2;
  line-height: 1.2;
}
.sc-profile {
  margin-top: auto;
  flex: none;
  padding: 0.7rem;
  border: 1px solid #5c6b7d55;
  border-radius: 0.55rem;
  background: #111724;
}
.sc-profile .sc-big-emblem {
  float: right;
  display: grid;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  font-size: 2.2rem;
  color: var(--tone);
  background: #ffffff0a;
  border: 1px solid currentColor;
  border-radius: 50%;
}
.sc-profile strong {
  display: block;
  font-size: 0.78rem;
  margin-top: 0.35rem;
}
.sc-profile p:last-child {
  font-size: 0.68rem;
  line-height: 1.45;
  color: #b7c0d0;
  max-height: 5rem;
  overflow: auto;
}
.tone-red {
  --tone: #fe6657;
}
.tone-blue {
  --tone: #6fc8ff;
}
.tone-purple {
  --tone: #d38cff;
}
.tone-green {
  --tone: #c7fa62;
}
.tone-gold {
  --tone: #f7c968;
}
.sc-stage {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: #151f2d;
}
.sc-city {
  flex: 1;
  min-height: 0;
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    radial-gradient(circle at 73% 12%, #ee5c9366, transparent 34%),
    linear-gradient(175deg, #3d2960 2%, #28304b 37%, #102e36 72%, #06171c 100%);
}
.sc-moon {
  position: absolute;
  right: 17%;
  top: 9%;
  width: 9rem;
  height: 9rem;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #feee9e, #d796b5 65%, #ff5381);
  box-shadow: 0 0 5rem #dc43917a;
  opacity: 0.8;
}
.sc-skyline {
  position: absolute;
  inset: 0;
  clip-path: polygon(
    0 48%,
    7% 48%,
    7% 23%,
    13% 23%,
    13% 41%,
    20% 41%,
    20% 14%,
    27% 14%,
    27% 36%,
    35% 36%,
    35% 29%,
    42% 29%,
    42% 39%,
    52% 39%,
    52% 10%,
    59% 10%,
    59% 34%,
    64% 34%,
    64% 21%,
    71% 21%,
    71% 45%,
    77% 45%,
    77% 18%,
    84% 18%,
    84% 40%,
    91% 40%,
    91% 31%,
    100% 31%,
    100% 100%,
    0 100%
  );
}
.sc-skyline-back {
  top: 8%;
  background:
    repeating-linear-gradient(90deg, transparent 0 12px, #e2d88618 13px 16px),
    linear-gradient(#533a60, #182635);
  filter: drop-shadow(0 -7px 10px #fc658560);
}
.sc-skyline-front {
  top: 31%;
  background:
    repeating-linear-gradient(
      90deg,
      #182d33 0 7px,
      #668075 8px 9px,
      #16242f 12px 20px
    ),
    linear-gradient(#192534, #0b1820);
  opacity: 0.96;
  transform: scaleX(-1);
}
.sc-road {
  position: absolute;
  inset: 50% -30% -45%;
  transform: perspective(250px) rotateX(57deg);
  border: 18px solid #d7fa7b66;
  background: repeating-linear-gradient(
    90deg,
    #172834 0 16%,
    #24333b 16% 17%,
    #182a35 18% 32%
  );
  box-shadow: 0 0 36px #c4ff5740;
}
.sc-city-overline {
  position: absolute;
  left: 1.7rem;
  top: 1.3rem;
  color: #e1fc9c;
  font-size: 0.75rem;
  letter-spacing: 0.25em;
  font-weight: 950;
  text-shadow: 0 2px 15px #090a10;
}
.sc-district {
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  gap: 0.2rem;
  color: #fff;
}
.sc-district-pin {
  display: grid;
  place-items: center;
  height: 2.2rem;
  width: 2.2rem;
  border: 2px solid #edfcba;
  border-radius: 0.4rem;
  background: #1a2923e8;
  box-shadow:
    0 0 0 5px #c4ff3522,
    0 0 19px #c4ff3577;
  color: #c5ff69;
  transform: rotate(45deg);
  font-size: 1rem;
}
.sc-district-label {
  max-width: 8rem;
  text-align: center;
  padding: 0.2rem 0.38rem;
  background: #09111fda;
  border-radius: 0.2rem;
  border: 1px solid #a9b3b944;
  font-size: 0.61rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-shadow: 0 2px 3px #000;
}
.sc-district:hover .sc-district-pin,
.sc-district.picked .sc-district-pin {
  background: #d5ff62;
  color: #1c2b27;
  box-shadow: 0 0 25px #d5ff62;
}
.sc-city-selection {
  position: absolute;
  z-index: 3;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 1rem;
  border: 1px solid #d5f9a566;
  background: #0c1821ed;
  backdrop-filter: blur(8px);
  border-radius: 0.55rem;
}
.sc-city-selection p {
  margin: 0;
  font-size: 0.8rem;
}
.sc-city-selection {
  position: relative;
  inset: auto;
  flex: none;
  flex-direction: column;
  align-items: stretch;
  max-height: 46%;
  overflow: auto;
  margin: 0.5rem;
}
.sc-streets {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.sc-streets line {
  stroke: #9fb4c055;
  stroke-width: 0.5;
  stroke-dasharray: 1.4 1;
  vector-effect: non-scaling-stroke;
}
.sc-streets line.open {
  stroke: #d5ff62;
  stroke-width: 2.5;
  stroke-dasharray: none;
}
.sc-district.is-here .sc-district-pin {
  background: #ffd34d;
  color: #2a1c05;
}
.sc-district.is-cleared .sc-district-pin {
  border-color: #7dffb0;
  color: #7dffb0;
}
.sc-district.is-locked .sc-district-pin {
  opacity: 0.55;
  border-style: dashed;
}
.sc-street-encounter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-left: 3px solid #f0b4ff;
  padding: 0.3rem 0.35rem 0.3rem 0.8rem;
  background: linear-gradient(90deg, #592b7442, transparent 80%);
}
.sc-street-encounter h2 {
  margin: 0;
  color: #f1c6ff;
  letter-spacing: 0.055em;
  font-size: clamp(1rem, 2cqw, 1.4rem);
  font-weight: 900;
}
.sc-street-encounter .sc-choices button {
  border-color: #d9a2ee;
  min-width: 0;
}
.sc-streets line.witnessed {
  stroke: #e6a7ff;
  stroke-width: 2.5;
  stroke-dasharray: none;
}
.sc-scene {
  color: #dbe3ee;
  line-height: 1.4;
}
.sc-rival {
  font-size: 0.72rem !important;
  color: #b8c4d0;
}
.sc-rival strong {
  color: #ffd34d;
}
.sc-rival em {
  display: block;
  color: #e7f9bc;
}
.sc-choices {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.4rem;
}
.sc-city-selection .sc-choices button {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: left;
  background: #1c2a36;
  color: #f2f6fa;
  border: 1px solid #d5ff6288;
  letter-spacing: 0.02em;
}
.sc-choices small {
  font-weight: 500;
  color: #b8c4d0;
  font-size: 0.66rem;
  line-height: 1.3;
}
.sc-decided {
  font-size: 0.72rem;
  color: #e7f9bc;
}
.sc-gate {
  color: #ffb27a;
  font-size: 0.7rem;
}
.sc-bout-line {
  color: #ffd34d;
}
.sc-city-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}
.sc-city-selection button:disabled {
  opacity: 0.45;
}
.sc-city-selection button.sc-quiet {
  background: transparent;
  color: #e7f9bc;
  border: 1px solid #d5ff6288;
}
.sc-city-selection button,
.sc-battle-bottom button,
.sc-result button {
  flex: none;
  background: #c8f960;
  border-radius: 0.3rem;
  color: #192018;
  font-size: 0.72rem;
  font-weight: 1000;
  padding: 0.65rem 0.8rem;
  letter-spacing: 0.07em;
}
.sc-stage-foot {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.4rem 0.8rem;
  background: #101823;
  color: #9ba4b1;
  font-size: 0.58rem;
  letter-spacing: 0.06em;
}
.sc-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 0;
  overflow: hidden;
  padding: 1rem 0.75rem;
  border-left: 1px solid #66738855;
  background: linear-gradient(130deg, #151e2c, #0a1019);
}
.sc-control-heading {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.sc-control-heading strong {
  font-size: 1.03rem;
  letter-spacing: 0.07em;
}
.sc-mode-list {
  display: grid;
  gap: 0.4rem;
}
.sc-mode {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.16rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #60708167;
  background: #26304477;
  border-radius: 0.4rem;
  text-align: left;
  min-height: 3.7rem;
}
.sc-mode.active {
  border-color: #d7fc7a;
  background: linear-gradient(100deg, #435b30, #1c2c30);
  box-shadow: inset 3px 0 #d7fc7a;
}
.sc-mode strong {
  color: #fff;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
}
.sc-mode span {
  color: #d3ff81;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.sc-mode small {
  color: #b4bdcc;
  font-size: 0.66rem;
}
.sc-brief {
  margin-top: auto;
  color: #c3cbd8;
  font-size: 0.73rem;
  line-height: 1.5;
  border-top: 1px solid #5360726b;
  padding-top: 0.8rem;
}
.sc-brief p {
  margin: 0.45rem 0;
}
.sc-actions {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  gap: 0.5rem;
}
.sc-actions .sc-control-heading {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  font-size: 0.61rem;
  color: #bfff82;
}
.sc-hand {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  overflow: auto;
  min-height: 0;
  align-content: start;
}
.sc-hand-card {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 3.15rem;
  padding: 0.3rem;
  border: 1px solid #596b8277;
  border-radius: 0.4rem;
  background: linear-gradient(
    125deg,
    color-mix(in srgb, var(--tone) 25%, #14202c),
    #131a26
  );
  text-align: left;
  position: relative;
}
.sc-hand-card.selected {
  border-color: #f8ffad;
  box-shadow:
    inset 0 0 0 1px #ffffb6,
    0 0 12px #c2ff5877;
}
.sc-hand-card.unavailable {
  opacity: 0.55;
}
.sc-hand-card .sc-card-symbol {
  font-size: 1.3rem;
  color: var(--tone);
}
.sc-hand-card span:nth-child(2) {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}
.sc-hand-card strong {
  font-size: 0.63rem;
  line-height: 1.15;
}
.sc-hand-card small {
  font-size: 0.58rem;
  color: #acbad0;
}
.sc-hand-card b {
  position: absolute;
  top: 0.15rem;
  right: 0.2rem;
  color: #daff8e;
  font-size: 0.7rem;
}
.sc-reveal,
.sc-reset {
  flex: none;
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #aac47d8b;
  border-radius: 0.3rem;
  color: #e7f9bc;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}
.sc-arena-stage {
  background: #0b1420;
}
.sc-arena-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  background: #151d2b;
  border-bottom: 1px solid #73849a77;
}
.sc-arena-head h2 {
  margin: 0.12rem 0 0;
  font-size: clamp(1.1rem, 2vw, 1.65rem);
  font-weight: 1000;
  letter-spacing: -0.025em;
}
.sc-arena-head h2 small {
  font-size: 0.58rem;
  color: #b5bdcd;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.sc-arena-scores {
  display: flex;
  gap: 1rem;
  font-size: 0.62rem;
  font-weight: 700;
}
.sc-arena-scores span {
  display: flex;
  flex-direction: column;
  gap: 0.16rem;
  color: #acb8c8;
}
.sc-arena-scores b {
  font-size: 1.1rem;
  color: #d7ff7e;
}
.sc-arena-backdrop {
  position: relative;
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: 0.5rem;
  overflow: hidden;
  background: radial-gradient(ellipse, #26474c 0%, #0c1e2b 70%);
  background-image:
    repeating-linear-gradient(20deg, transparent 0 30px, #ffffff04 30px 31px),
    radial-gradient(ellipse, #26474c 0%, #0c1e2b 70%);
}
.sc-board {
  display: grid;
  width: min(100%, 68cqh);
  max-height: 100%;
  aspect-ratio: 1 / 1;
  gap: 2px;
  border: 5px solid #72899a;
  border-radius: 0.35rem;
  background: #1e2b34;
  box-shadow:
    0 0 0 5px #151820,
    0 16px 40px #0009;
  overflow: hidden;
}
.sc-board-gridiron,
.sc-board-bloodrush {
  width: min(100%, 105cqw);
  aspect-ratio: 2 / 1;
  max-height: 100%;
}
.sc-tile {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  background: linear-gradient(155deg, #3d5d62, #2a454d);
  outline-offset: -2px;
}
.sc-tile:nth-child(odd) {
  background: linear-gradient(155deg, #426468, #34505a);
}
.sc-tile.home {
  box-shadow: inset 4px 0 #9af8ff6f;
}
.sc-tile.away {
  box-shadow: inset -4px 0 #ffa1a14d;
}
.sc-tile.flag {
  background: radial-gradient(#f3e48880, #34635f);
}
.sc-tile.target:hover,
.sc-tile:focus-visible {
  outline: 2px solid #d7ff69;
  z-index: 2;
}
.sc-flag {
  position: absolute;
  color: #ffe8a1;
  font-size: clamp(0.6rem, 2vw, 1.5rem);
  opacity: 0.7;
}
.sc-tile.lair {
  background: radial-gradient(circle, #ff3fbf66, #3a1037 75%);
}
.sc-monster {
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #ff9be8;
  font-size: clamp(1.1rem, 3.2vw, 2.4rem);
  line-height: 1;
  text-shadow: 0 0 14px #ff3fbf;
}
.sc-monster small {
  font-size: 0.55rem;
  color: #ffd6f4;
}
.sc-fighter.rooted {
  outline: 2px dashed #8fd3ff;
  outline-offset: -3px;
}
.sc-rules {
  display: grid;
  gap: 0.3rem;
}
.sc-rule-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.sc-rule {
  padding: 0.25rem 0.45rem;
  border: 1px solid #60708167;
  border-radius: 999px;
  background: #26304477;
  color: #c9d2de;
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}
.sc-rule.on {
  border-color: #ff7de0;
  background: #4a1f45;
  color: #fff;
}
.sc-rule-note {
  color: #e9b9e0;
  font-size: 0.58rem;
  line-height: 1.35;
}
.sc-keywords {
  margin: 0.2rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.15rem;
  font-size: 0.58rem;
  color: #d9e5ec;
}
.sc-keywords b {
  color: var(--tone);
  letter-spacing: 0.06em;
}
.sc-trap {
  position: absolute;
  right: 0;
  top: 0;
  color: #ff98b4;
  font-size: 0.8rem;
}
.sc-fighter {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 82%;
  width: 82%;
  border-radius: 25% 25% 35% 35%;
  background: linear-gradient(145deg, #68d7ef, #246e99);
  border: 2px solid #acf2ff;
  box-shadow:
    0 4px 6px #000b,
    0 0 11px #70eeff8c;
  font-size: clamp(0.7rem, 2.1cqw, 1.8rem);
  font-weight: 1000;
  color: #faffeb;
}
.sc-fighter.hostile {
  background: linear-gradient(145deg, #eb798f, #8d354e);
  border-color: #ffc3ae;
  box-shadow:
    0 4px 6px #000b,
    0 0 10px #ff686e88;
}
.sc-fighter.sealed {
  background: repeating-linear-gradient(
    35deg,
    #243346,
    #243346 5px,
    #4c5269 6px,
    #4c5269 10px
  );
  border-style: dashed;
}
.sc-fighter.selected {
  outline: 3px solid #e9ff79;
  outline-offset: 1px;
}
.sc-fighter small {
  font-size: clamp(0.45rem, 0.9cqw, 0.67rem);
  line-height: 1;
}
.sc-battle-bottom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #131c2c;
  min-height: 3.2rem;
  font-size: 0.65rem;
  color: #b8c4d0;
}
.sc-battle-bottom span:first-child {
  color: #d5ff7a;
  font-weight: 900;
  white-space: nowrap;
}
.sc-battle-bottom span:nth-child(2) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc-battle-bottom button:disabled {
  opacity: 0.5;
}
.sc-result {
  position: absolute;
  z-index: 5;
  inset: 20%;
  background: #0b1019eb;
  border: 2px solid #d3ff77;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 0 5rem #000;
}
.sc-result strong {
  font-size: clamp(1rem, 3vw, 2rem);
  text-align: center;
  color: #d9ff8b;
}
.sc-collection {
  gap: 0.5rem;
  padding: 1rem;
  background: radial-gradient(circle at 50% 0%, #413e63, #121c2b 75%);
}
.sc-collection-title h2 {
  margin: 0.2rem 0;
  font-size: clamp(1.15rem, 2.6vw, 2rem);
}
.sc-collection-title p {
  font-size: 0.78rem;
  line-height: 1.4;
  margin: 0;
  color: #cbd1df;
  max-width: 50rem;
}
.sc-collection-grid {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.75rem;
  align-content: start;
}
.sc-collect-card {
  display: flex;
  flex-direction: column;
  min-height: 14rem;
  overflow: hidden;
  border: 1px solid var(--tone);
  border-radius: 0.5rem;
  background: #181e2d;
  box-shadow: 0 5px 16px #0007;
}
.sc-collect-art {
  display: grid;
  place-items: center;
  min-height: 6rem;
  font-size: 4rem;
  color: var(--tone);
  text-shadow: 0 0 25px var(--tone);
  background:
    radial-gradient(circle, #ffffff25, transparent 55%),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--tone) 35%, #171b2b),
      #141b28
    );
}
.sc-collect-card > div:nth-child(2) {
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.sc-collect-card span,
.sc-collect-card small {
  font-size: 0.57rem;
  letter-spacing: 0.06em;
  color: #c6d7df;
}
.sc-collect-card strong {
  font-size: 0.78rem;
}
.sc-collect-card p {
  font-size: 0.68rem;
  line-height: 1.4;
  margin: 0;
  color: #bfc9d5;
}
.sc-collect-card > small {
  margin-top: auto;
  padding: 0.55rem;
  background: #0f1824;
}
.sc-footer {
  display: flex;
  justify-content: space-between;
  flex: none;
  padding: 0.35rem 1rem;
  gap: 1rem;
  border-top: 1px solid #5d6a7855;
  background: #080d15;
  color: #9bacbf;
  font-size: 0.57rem;
  letter-spacing: 0.09em;
}
@container (max-width: 900px) {
  .sc-main {
    grid-template-columns: 9rem minmax(0, 1fr) 11rem;
  }
  .sc-profile {
    display: none;
  }
  .sc-team {
    min-height: 3rem;
  }
  .sc-team-text small {
    display: none;
  }
  .sc-team-text strong {
    font-size: 0.61rem;
  }
  .sc-emblem {
    height: 2rem;
    width: 1.7rem;
    font-size: 1.1rem;
  }
  .sc-roster,
  .sc-controls {
    padding: 0.6rem;
  }
  .sc-hand {
    grid-template-columns: 1fr;
  }
  .sc-mode {
    min-height: 2.8rem;
    padding: 0.4rem;
  }
  .sc-mode small {
    display: none;
  }
}
@container (max-width: 600px) {
  .sc-header {
    padding: 0.3rem 0.6rem;
    gap: 0.4rem;
  }
  .sc-hud {
    display: none;
  }
  .sc-brand .sc-wordmark {
    font-size: 1.15rem;
  }
  .sc-brand .sc-wordmark small,
  .sc-brand .sc-overline {
    display: none;
  }
  .sc-tabs button {
    padding: 0.35rem 0.5rem;
    min-width: 3rem;
    font-size: 0.57rem;
  }
  .sc-main {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;
  }
  .sc-roster {
    padding: 0.24rem 0.4rem;
    border-right: 0;
    border-bottom: 1px solid #607080;
    gap: 0;
  }
  .sc-roster > .sc-overline {
    display: none;
  }
  .sc-team-list {
    display: flex;
    flex-direction: row;
    gap: 0.28rem;
    max-width: 100%;
    overflow-x: auto;
    padding: 0;
  }
  .sc-team {
    flex: 0 0 auto;
    min-height: 2.25rem;
    padding: 0.2rem 0.4rem;
  }
  .sc-team-text strong {
    font-size: 0.56rem;
    max-width: 6rem;
  }
  .sc-emblem {
    width: 1.5rem;
    height: 1.5rem;
  }
  .sc-controls {
    border-left: 0;
    border-top: 1px solid #607080;
    gap: 0.3rem;
    padding: 0.35rem;
  }
  .sc-controls > .sc-control-heading {
    display: none;
  }
  .sc-mode-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.25rem;
  }
  .sc-mode {
    min-height: 2rem;
    padding: 0.25rem 0.4rem;
  }
  .sc-mode span {
    font-size: 0.5rem;
  }
  .sc-mode strong {
    font-size: 0.58rem;
  }
  .sc-brief {
    display: none;
  }
  .sc-actions {
    max-height: 6rem;
    gap: 0.2rem;
  }
  .sc-actions > .sc-control-heading {
    display: none;
  }
  .sc-hand {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    max-height: 3.5rem;
  }
  .sc-hand-card {
    flex: 0 0 7.2rem;
    min-height: 2.65rem;
  }
  .sc-reset,
  .sc-reveal {
    display: none;
  }
  .sc-city-selection {
    margin: 0.3rem;
    padding: 0.4rem;
    gap: 0.25rem;
  }
  .sc-city-selection p {
    font-size: 0.62rem;
  }
  .sc-city-selection button {
    padding: 0.45rem;
    font-size: 0.57rem;
  }
  .sc-district-pin {
    height: 1.3rem;
    width: 1.3rem;
    font-size: 0.55rem;
  }
  .sc-district-label {
    font-size: 0.43rem;
    max-width: 5rem;
  }
  .sc-city-overline {
    left: 0.4rem;
    top: 0.4rem;
    font-size: 0.55rem;
  }
  .sc-arena-head {
    padding: 0.35rem;
  }
  .sc-arena-head h2 {
    font-size: 1rem;
  }
  .sc-arena-scores {
    font-size: 0.52rem;
    gap: 0.4rem;
  }
  .sc-arena-backdrop {
    padding: 0.25rem;
  }
  .sc-board {
    width: min(100%, 75cqh);
  }
  .sc-board-gridiron,
  .sc-board-bloodrush {
    width: 100%;
  }
  .sc-battle-bottom {
    min-height: 2.6rem;
    padding: 0.25rem;
    font-size: 0.53rem;
  }
  .sc-battle-bottom button {
    padding: 0.35rem;
    font-size: 0.55rem;
  }
  .sc-stage-foot {
    display: none;
  }
  .sc-footer {
    display: none;
  }
}
.sc-help {
  padding: 0.3rem 0.55rem;
  border: 1px solid #d7fc7a99;
  border-radius: 0.3rem;
  color: #e7f9bc;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}
.sc-guide {
  position: absolute;
  z-index: 6;
  inset: 0.6rem;
  max-width: 34rem;
  margin: 0 auto;
  overflow: auto;
  padding: 0.9rem 1rem;
  border: 2px solid #d3ff77;
  border-radius: 0.5rem;
  background: #0b1019f2;
  color: #dfe6f0;
  font-size: 0.74rem;
  line-height: 1.45;
  box-shadow: 0 0 4rem #000;
}
.sc-guide-goal {
  margin: 0.4rem 0;
  color: #f2ffd0;
  font-weight: 800;
}
.sc-guide ol,
.sc-guide ul {
  margin: 0.3rem 0 0.7rem;
  padding-left: 1.2rem;
}
.sc-guide li {
  margin: 0.25rem 0;
}
.sc-guide-seed {
  color: #a6aac0;
  font-size: 0.66rem;
}
.sc-guide button,
.sc-result-actions button {
  padding: 0.45rem 0.8rem;
  border: 1px solid #d7fc7a;
  border-radius: 0.3rem;
  color: #f2ffd0;
  font-weight: 900;
  letter-spacing: 0.05em;
}
.sc-result-actions {
  display: flex;
  gap: 0.5rem;
}
.sc-result > span {
  color: #c3cbd8;
  font-size: 0.75rem;
}
.sc-fighter.carrier {
  box-shadow: 0 0 0 2px #ffd34d;
}
.sc-resting {
  position: absolute;
  bottom: 0.15rem;
  right: 0.25rem;
  font-size: 0.5rem;
  font-style: normal;
  color: #ffb27a;
}
.sc-selected-line {
  margin: 0;
  font-size: 0.6rem;
  color: #d5ff7a;
}
.sc-log {
  margin: 0;
  padding: 0.35rem 0.5rem 0.35rem 1.2rem;
  max-height: 7.5rem;
  overflow: auto;
  border-top: 1px solid #5360726b;
  color: #aeb8c8;
  font-size: 0.6rem;
  line-height: 1.35;
  flex: none;
}
.sc-log li:first-child {
  color: #f0f4fa;
}
.sc-reset-row {
  display: flex;
  gap: 0.35rem;
  flex: none;
}
.sc-reset-row .sc-reset {
  flex: 1 1 0;
  width: auto;
  min-width: 0;
}
@container (max-width: 600px) {
  .sc-log,
  .sc-selected-line {
    display: none;
  }
  .sc-guide {
    inset: 0.2rem;
    font-size: 0.66rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sc-team {
    transition: none;
  }
  .sc-district-pin,
  .sc-fighter {
    box-shadow: none;
  }
}
.sc-card-overlay {
  position: absolute;
  z-index: 8;
  top: 3%;
  right: 3%;
  bottom: 3%;
  width: min(31rem, 85%);
  display: grid;
  grid-template-rows: minmax(7rem, 46%) minmax(0, 1fr);
  background: #111a27f5;
  border: 2px solid #c8ff78;
  border-radius: 0.75rem;
  box-shadow:
    0 15px 70px #000e,
    0 0 35px #a3ff4755;
  overflow: auto;
}
.sc-card-poster {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 8rem;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--tone) 45%, #20263e),
    #101a27 85%
  );
}
.sc-card-poster-art {
  font-size: clamp(4rem, 9cqw, 8rem);
  color: var(--tone);
  text-shadow: 0 0 30px var(--tone);
}
.sc-card-information {
  padding: 1rem;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sc-card-information h3 {
  margin: 0;
  font-size: clamp(1.4rem, 3cqw, 2rem);
}
.sc-card-information p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}
.sc-card-information .sc-card-stats {
  color: #d9ff95;
  font-weight: 800;
}
.sc-card-information .sc-no-mana {
  color: #ffb498;
}
.sc-card-cta {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}
.sc-card-cta button {
  background: #c8ff78;
  color: #152112;
  border-radius: 0.4rem;
  padding: 0.55rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 900;
}
.sc-card-cta .sc-quiet {
  background: transparent;
  color: #e6ffd3;
  border: 1px solid #99be75;
}
.sc-hand-count {
  color: #bbd1a0;
  font-size: 0.65rem;
}
@container (max-width: 600px) {
  .sc-card-overlay {
    width: 93%;
    left: 3.5%;
    right: 3.5%;
    top: 2%;
    bottom: 2%;
    grid-template-rows: minmax(4rem, 36%) minmax(0, 1fr);
  }
  .sc-card-information {
    padding: 0.65rem;
    gap: 0.25rem;
  }
}
.sc-tile.neutral {
  box-shadow: inset 0 0 0 1px #cbd3a51d;
}
.sc-tile.legalMove {
  outline: 2px dashed #79faac;
  outline-offset: -3px;
}
.sc-tile.inRange {
  outline: 3px solid #ff9174;
  outline-offset: -3px;
}
.sc-tile.marked {
  background: #ab414b;
  box-shadow: inset 0 0 0 4px #ffe5aa;
}
.sc-action-deck {
  display: grid;
  gap: 0.3rem;
  background: #1f2838;
  border: 1px solid #dc9579;
  padding: 0.5rem;
  border-radius: 0.5rem;
}
.sc-action-deck small {
  font-size: 0.64rem;
  color: #e7c79b;
}
.sc-attack-button {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(100deg, #f77d54, #a83a55);
  color: #fff;
  padding: 0.5rem;
  border-radius: 0.4rem;
  font-size: 0.7rem;
  font-weight: 950;
}
.sc-attack-button span:last-child {
  margin-left: auto;
  font-size: 0.56rem;
}
.sc-attack-button:disabled {
  opacity: 0.48;
}
.sc-attack-symbol {
  font-size: 1.6rem;
}
</style>
