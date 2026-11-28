<template>
  <section
    class="mc-console @container flex h-full min-h-0 w-full flex-col overflow-hidden text-white"
    data-testid="monstrexx-point-click"
    @keydown.esc="closeOverlay"
    @pointerdown.capture="sound.unlock()"
    @keydown.capture="sound.unlock()"
  >
    <div
      v-if="screen === 'title'"
      class="mc-opening relative flex min-h-0 flex-1 flex-col"
    >
      <div class="mc-night relative min-h-0 flex-1 overflow-hidden">
        <div class="mc-moon" aria-hidden="true" />
        <div class="mc-motel" aria-hidden="true">
          <div class="mc-windows">
            <span v-for="n in 8" :key="n" class="mc-window" />
          </div>
          <div class="mc-marquee">
            <span class="mc-marquee-top">LAST CALL MOTOR LODGE</span>
            <strong>LAST <span>CALL</span></strong>
            <small>ONE NIGHT ONLY · ROOMS STILL AVAILABLE</small>
          </div>
          <div class="mc-entrance" />
        </div>
        <div class="mc-opening-title">
          <p class="mc-eyebrow">A MIDNIGHT CITY MYSTERY</p>
          <h1>Monstrique</h1>
          <p class="mc-tagline">
            Everybody's a monster. Somebody's a murderer.
          </p>
        </div>
        <div class="mc-rain" aria-hidden="true" />
      </div>
      <div
        class="mc-title-footer flex shrink-0 flex-wrap items-center justify-between gap-3 p-3"
      >
        <span class="mc-caption">CHAPTER ONE · THE LAST CALL</span>
        <button
          type="button"
          class="mc-action-primary"
          data-testid="monstress-start"
          @click="begin"
        >
          <Icon name="kind-icon:home" class="size-5" />
          CHECK IN
        </button>
      </div>
    </div>

    <div
      v-else-if="screen === 'intro'"
      class="mc-opening flex min-h-0 flex-1 flex-col"
      data-testid="monstrexx-cold-open"
    >
      <MonstriqueCutscenePlayer
        :cutscene="openingScene"
        :director="!publicEdition"
        end-label="Investigate motel"
        @done="screen = 'stage'"
      />
    </div>

    <template v-else>
      <div
        class="mc-action-bar flex shrink-0 flex-wrap items-center gap-2 px-3 py-2"
      >
        <div class="min-w-0 flex-1">
          <p class="mc-eyebrow">
            {{ room.floor === 2 ? 'SECOND FLOOR' : 'GROUND FLOOR' }}
          </p>
          <h2 class="mc-location truncate">{{ room.label }}</h2>
        </div>
        <span
          class="mc-score"
          data-testid="monstrique-score"
          :title="'Score: ' + score + ' of ' + scoreMax"
        >
          <small class="hidden @md:inline">SCORE</small>
          <strong>{{ score }}</strong
          ><span class="hidden @md:inline">/{{ scoreMax }}</span>
          <em v-if="scoreGain" :key="scoreBump" class="mc-score-gain"
            >+{{ scoreGain }}</em
          >
        </span>
        <button
          type="button"
          class="mc-actor-chip"
          @click="story.switchActor()"
        >
          <span class="mc-portrait" :class="'is-' + story.state.actor">
            {{ story.state.actor === 'iris' ? 'I' : 'N' }}
          </span>
          <span class="text-left">
            <strong>{{
              story.state.actor === 'iris' ? 'IRIS' : 'NORB'
            }}</strong>
            <small>SWAP <span aria-hidden="true">⇄</span></small>
          </span>
        </button>
        <button
          type="button"
          class="mc-icon-button"
          :aria-pressed="drawer === 'case'"
          aria-label="Case notebook"
          title="Case notebook"
          @click="toggleDrawer('case')"
        >
          <Icon name="kind-icon:book-open" class="size-5" />
          <span class="mc-count">{{ story.state.evidence.length }}</span>
        </button>
        <button
          type="button"
          class="mc-icon-button"
          :aria-pressed="drawer === 'map'"
          aria-label="Hotel floor map"
          title="Hotel floor map"
          @click="toggleDrawer('map')"
        >
          <Icon name="kind-icon:map" class="size-5" />
        </button>
      </div>

      <div
        class="mc-scene relative min-h-0 flex-1 overflow-hidden"
        :data-room="story.state.room"
        :aria-label="
          room.label +
          '. Arrow keys cycle objects. W, A, S and D walk. Tap the floor to walk.'
        "
        tabindex="0"
        @click="walkTo"
        @keydown.left.prevent="selectAdjacent(-1)"
        @keydown.right.prevent="selectAdjacent(1)"
        @keydown="stepByKey"
      >
        <img
          v-if="backdrop"
          :src="backdrop.src"
          alt=""
          aria-hidden="true"
          class="mc-ambient absolute inset-0 size-full object-cover"
        />
        <div
          ref="worldEl"
          class="mc-world absolute"
          data-testid="monstrique-stage-world"
          :style="worldStyle"
        >
          <img
            v-if="backdrop"
            :key="backdrop.src"
            :src="backdrop.src"
            :alt="backdrop.alt"
            class="mc-backdrop absolute inset-0 size-full object-cover"
            data-testid="monstrique-room-backdrop"
            :data-art-image="backdrop.artImageId"
          />
          <svg
            v-else
            class="mc-painted-scene absolute inset-0 size-full"
            data-testid="monstrique-room-fallback"
            viewBox="0 0 1000 580"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="mc-wall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#2e314e" />
                <stop offset="1" stop-color="#75515b" />
              </linearGradient>
              <linearGradient id="mc-windowlight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ffc693" />
                <stop offset="1" stop-color="#a35b89" />
              </linearGradient>
              <linearGradient id="mc-floor" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#2e253b" />
                <stop offset="1" stop-color="#5f2e47" />
              </linearGradient>
            </defs>
            <rect width="1000" height="580" fill="url(#mc-wall)" />
            <path d="M0 375L1000 360V580H0Z" fill="url(#mc-floor)" />
            <path d="M0 370L1000 356" stroke="#c29b99" stroke-width="11" />
            <rect
              x="85"
              y="110"
              width="250"
              height="265"
              fill="#31273c"
              stroke="#bb9a98"
              stroke-width="24"
            />
            <rect
              x="110"
              y="130"
              width="200"
              height="218"
              fill="url(#mc-windowlight)"
            />
            <path d="M208 130V348" stroke="#402f4e" stroke-width="15" />
            <rect
              x="760"
              y="105"
              width="160"
              height="266"
              fill="#44334a"
              stroke="#b09b99"
              stroke-width="20"
            />
            <circle cx="840" cy="250" r="8" fill="#e9c9a9" />
            <path
              d="M395 380V235Q510 185 650 230V378Z"
              fill="#55344e"
              stroke="#bc9399"
              stroke-width="18"
            />
            <path d="M425 312H615" stroke="#b68c8f" stroke-width="12" />
            <path d="M500 0V75" stroke="#c6ada3" stroke-width="9" />
            <path d="M410 70H585L615 120H380Z" fill="#d7bcb4" />
            <circle cx="500" cy="115" r="35" fill="#ffe4bb" opacity=".8" />
            <g v-if="story.state.room === 'convention-center'">
              <path d="M0 0H130L170 360H20Z" fill="#842a58" />
              <path d="M880 0H1000V370H840Z" fill="#842a58" />
              <rect x="330" y="375" width="420" height="145" fill="#5f314d" />
              <path d="M320 380H755" stroke="#eabf8d" stroke-width="13" />
            </g>
          </svg>
          <div class="mc-shadow absolute inset-0" aria-hidden="true" />
          <div
            class="mc-cast pointer-events-none absolute inset-0"
            data-testid="monstrique-stage-cast"
            aria-hidden="true"
          >
            <template v-for="actor in stageNpcs" :key="actor.hotspot">
              <div
                v-if="actor.figure"
                class="mc-figure absolute"
                :class="{
                  'is-ghost': actor.figure.float,
                  'is-talking': speaker === actor.character,
                }"
                :style="{
                  left: actor.x + '%',
                  top: actor.y + '%',
                  height: actor.height + '%',
                  zIndex: Math.round(actor.y),
                }"
                :data-character="actor.character"
                data-testid="monstrique-stage-figure"
              >
                <img
                  :src="actor.figure.src"
                  :alt="actor.figure.alt"
                  :width="actor.figure.width"
                  :height="actor.figure.height"
                  class="mc-figure-art"
                  :style="
                    actor.cut
                      ? { clipPath: 'inset(0 0 ' + actor.cut * 100 + '% 0)' }
                      : undefined
                  "
                />
              </div>
              <MonstriqueCharacterSprite
                v-else
                class="mc-npc absolute"
                :class="{ 'is-marked': actor.marked }"
                :style="{
                  left: actor.x + '%',
                  top: actor.y + '%',
                  height: actor.height + '%',
                  zIndex: Math.round(actor.y),
                }"
                :character="actor.character"
                :mood="speaker === actor.character ? speakerMood : undefined"
                :talking="speaker === actor.character"
                :facing="actor.x > iris.x ? 'left' : 'right'"
              />
            </template>
            <div
              v-if="showNorbFollower"
              class="mc-germ-zone absolute"
              :style="walkerStyle(norb, 0, followMs)"
            />
            <MonstriqueCharacterSprite
              v-if="showNorbFollower"
              class="mc-walker absolute"
              :style="walkerStyle(norb, 0.68, followMs)"
              character="norb"
              :mood="speaker === 'norb' ? speakerMood : 'annoyed'"
              :talking="speaker === 'norb'"
              :facing="norb.x > iris.x ? 'left' : 'right'"
            />
            <MonstriqueCharacterSprite
              class="mc-walker absolute"
              data-testid="monstrique-iris-walker"
              :data-walking="walking ? 'true' : 'false'"
              :style="walkerStyle(iris, 1, walkMs)"
              character="iris"
              :mood="speaker === 'iris' ? speakerMood : 'smirk'"
              :talking="speaker === 'iris'"
              :facing="irisFacing"
            />
          </div>

          <button
            v-for="hotspot in room.hotspots"
            :key="hotspot.id"
            type="button"
            class="mc-hotspot absolute"
            :class="{ 'is-selected': selected === hotspot.id }"
            :style="{ left: hotspot.x + '%', top: hotspot.y + '%' }"
            :aria-pressed="selected === hotspot.id"
            :aria-label="'Inspect ' + hotspot.label"
            @click="selectHotspot(hotspot.id)"
          >
            <span class="mc-hotspot-pip"
              ><Icon name="kind-icon:search" class="size-4"
            /></span>
            <span class="mc-hotspot-name">{{ hotspot.label }}</span>
          </button>
        </div>
        <p class="mc-scene-stamp">
          {{ room.floor === 2 ? 'UPSTAIRS' : 'LAST CALL' }}
        </p>

        <aside
          v-if="drawer"
          class="mc-drawer absolute inset-y-0 right-0 z-20 flex flex-col"
        >
          <header class="mc-drawer-header flex items-center gap-2">
            <strong>{{
              drawer === 'case' ? 'CASE NOTEBOOK' : 'HOTEL MAP'
            }}</strong>
            <button
              type="button"
              class="ml-auto rounded-md p-2"
              aria-label="Close drawer"
              @click="drawer = null"
            >
              <Icon name="kind-icon:close" />
            </button>
          </header>
          <div class="kr-scroll min-h-0 flex-1 overflow-y-auto p-3">
            <template v-if="drawer === 'case'">
              <h3 class="mc-eyebrow">
                EVIDENCE · {{ story.state.evidence.length }}
              </h3>
              <ul class="mc-note-list">
                <li v-for="clue in story.state.evidence" :key="clue">
                  <Icon name="kind-icon:camera" class="size-4 shrink-0" />
                  {{ EVIDENCE[clue] ?? clue }}
                </li>
                <li v-if="!story.state.evidence.length">
                  No evidence collected. Yet.
                </li>
              </ul>
              <h3 class="mc-eyebrow mt-4">CONVERSATION TOPICS</h3>
              <ul class="mc-note-list">
                <li v-for="topic in story.state.topics" :key="topic">
                  <Icon name="kind-icon:book-open" class="size-4 shrink-0" />
                  {{ TOPICS[topic] ?? topic }}
                </li>
              </ul>
              <h3 v-if="audience === 'mature'" class="mc-eyebrow mt-4">
                GOOD GRACES
              </h3>
              <ul
                v-if="audience === 'mature'"
                class="mc-note-list"
                data-testid="monstrique-graces"
              >
                <li v-for="(grace, who) in GRACES" :key="who">
                  <Icon name="kind-icon:heart" class="size-4 shrink-0" />
                  <span class="flex-1">{{ grace.name }}</span>
                  <span
                    class="mc-hearts"
                    :aria-label="
                      (story.state.gratitude[who] ?? 0) + ' of ' + grace.max
                    "
                  >
                    <span
                      v-for="n in grace.max"
                      :key="n"
                      :class="{
                        'is-on': n <= (story.state.gratitude[who] ?? 0),
                      }"
                      >♥</span
                    >
                  </span>
                </li>
                <li>
                  <Icon name="kind-icon:hand" class="size-4 shrink-0" />
                  <span class="flex-1">Times Norb said no</span>
                  <strong>{{ story.state.rebuffs }}</strong>
                </li>
              </ul>
            </template>
            <template v-else>
              <h3 class="mc-eyebrow">EXITS FROM {{ room.label }}</h3>
              <div class="flex flex-col gap-2 pt-3">
                <button
                  v-for="exit in room.exits"
                  :key="exit"
                  type="button"
                  class="mc-exit"
                  @click="go(exit)"
                >
                  <Icon name="kind-icon:map" class="size-4" />
                  {{ HOTEL_ROOMS[exit].label }}
                </button>
              </div>
              <template v-if="shortcuts.length">
                <h3 class="mc-eyebrow mt-4">SHORTCUTS</h3>
                <div
                  class="flex flex-col gap-2 pt-3"
                  data-testid="monstrique-map-shortcuts"
                >
                  <button
                    v-for="shortcut in shortcuts"
                    :key="shortcut"
                    type="button"
                    class="mc-exit"
                    @click="shortcutTo(shortcut)"
                  >
                    <Icon name="kind-icon:map" class="size-4" />
                    {{ HOTEL_ROOMS[shortcut].label }}
                  </button>
                </div>
              </template>
            </template>
          </div>
        </aside>
      </div>

      <div
        class="mc-dialogue flex min-h-0 shrink-0 items-start gap-3 px-3 py-3"
        aria-live="polite"
      >
        <div
          class="mc-dialogue-portrait"
          :class="'is-' + (speaker ?? 'narrator')"
          data-testid="monstrique-speaker-portrait"
        >
          <img
            v-if="speakerPortrait"
            :src="speakerPortrait.src"
            :alt="speakerPortrait.alt"
            class="size-full object-cover"
            data-testid="monstrique-painted-portrait"
          />
          <MonstriqueCharacterSprite
            v-else-if="speaker"
            class="mc-bust size-full"
            bust
            :character="speaker"
            :mood="speakerMood"
          />
          <Icon v-else name="kind-icon:book-open" class="size-6" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="mc-eyebrow">
            {{ speaker ? CHARACTER_MODELS[speaker].name : 'Narrator' }}
          </p>
          <p class="mc-line">{{ story.currentLine }}</p>
        </div>
      </div>
      <div v-if="selected && activeHotspot" class="mc-verbs shrink-0 px-3 py-2">
        <div class="flex flex-wrap items-center gap-2">
          <strong class="mc-target mr-auto">{{ activeHotspot.label }}</strong>
          <button
            v-if="held"
            type="button"
            class="mc-verb is-held"
            data-testid="monstrique-use-held"
            @click="useHeld"
          >
            <Icon name="kind-icon:gift" class="size-4" />
            Use {{ ITEMS[held] ?? held }}
          </button>
          <button
            v-for="verb in activeHotspot.verbs.filter((v) => v !== 'ask')"
            :key="verb"
            type="button"
            class="mc-verb"
            :title="verb"
            @click="story.takeAction({ verb, target: selected! })"
          >
            <Icon :name="verbIcon(verb)" class="size-4" />
            {{ verb }}
          </button>
        </div>
        <div
          v-if="activeTopics.length"
          class="flex flex-wrap gap-2 border-t border-white/10 pt-2"
        >
          <button
            v-for="topic in activeTopics"
            :key="topic"
            type="button"
            class="mc-topic"
            @click="story.takeAction({ verb: 'ask', target: selected!, topic })"
          >
            <Icon name="kind-icon:book-open" class="size-3" />
            {{ TOPICS[topic] ?? topic }}
          </button>
        </div>
      </div>

      <footer
        class="mc-footer flex min-h-0 shrink-0 items-center gap-2 px-3 py-2"
      >
        <button type="button" class="mc-verb" @click="toggleDrawer('map')">
          <Icon name="kind-icon:map" class="size-4" /> Exits
        </button>
        <div
          class="mc-inventory flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
        >
          <span class="mc-eyebrow shrink-0">INVENTORY</span>
          <button
            v-for="item in story.state.inventory"
            :key="item"
            type="button"
            class="mc-item"
            :class="{ 'is-held': held === item }"
            :aria-pressed="held === item"
            :title="
              'Hold ' +
              (ITEMS[item] ?? item) +
              ', then pick a hotspot or another inventory item to combine'
            "
            @click="pickInventory(item)"
          >
            <Icon
              :name="
                item === 'camera' ? 'kind-icon:camera' : 'kind-icon:book-open'
              "
              class="size-4"
            />
            {{ ITEMS[item] ?? item }}
          </button>
        </div>
        <button type="button" class="mc-verb" @click="emit('menu')">
          <Icon name="kind-icon:home" class="size-4" />
          <span class="hidden @md:inline">Title</span>
        </button>
      </footer>
      <div
        v-if="story.activeCutscene"
        class="mc-cutscene-layer absolute inset-0 z-40"
      >
        <MonstriqueCutscenePlayer
          :cutscene="story.activeCutscene"
          :director="!publicEdition"
          end-label="Back to the case"
          @done="story.finishCutscene()"
        />
      </div>
      <div
        v-if="story.state.ending"
        class="mc-ending absolute inset-0 z-30 grid place-items-center p-5"
        data-testid="monstrique-ending-plate"
      >
        <img
          v-if="endingPlate"
          :src="endingPlate.src"
          :alt="endingPlate.alt"
          class="mc-ending-plate absolute inset-0 size-full object-cover"
        />
        <div class="mc-ending-card max-w-lg space-y-4 text-center">
          <p class="mc-eyebrow">CHAPTER ONE · THE LAST CALL</p>
          <h2 class="text-3xl font-bold">{{ endingTitle }}</h2>
          <p class="text-lg">{{ story.currentLine }}</p>
          <p
            class="mc-ending-route text-sm"
            data-testid="monstrique-ending-route"
          >
            {{ endingRoute }} This case is in your case files on the title
            scrapbook.
          </p>
          <button class="mc-action-primary" type="button" @click="begin">
            NEW CASE
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMonstressConventionStore } from '~/stores/monstressConventionStore'
import { useMonstriquePublicStore } from '~/stores/monstriquePublicStore'
import {
  roomForAudience,
  travelForAudience,
} from '~/utils/monstressConvention/edition'
import {
  approachPoint,
  entryPoint,
  figureHeight,
  findPath,
  followerPoint,
  nearestWalkable,
  shortcutRooms,
  type StagePoint,
} from '~/utils/monstressConvention/navigation'
import {
  availableTopics,
  caseScore,
  EVIDENCE,
  GRACES,
  HOTEL_ROOMS,
  ITEMS,
  maxScore,
  TOPICS,
  type RoomId,
  type Verb,
} from '~/utils/monstressConvention/prologue'
import {
  CHARACTER_MODELS,
  modelForHotspot,
  speakerOf,
  type MonstriqueCharacterId,
} from '~/utils/monstrique/characterModels'
import { coldOpen } from '~/utils/monstrique/cutscenes'
import {
  STAGE_MARKS,
  backdropFor,
  figureFor,
  portraitFor,
} from '~/utils/monstrique/stageArt'
import { MONSTRESS_CONVENTION } from '~/utils/playbookKit/games/monstressConvention'
import { ENDING_ROUTE_NOTES } from '~/utils/monstressConvention/runHistory'
import { useMonstriqueSoundStore } from '~/stores/monstriqueSoundStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { monstriqueCuesFor, monstriqueMoodFor } from '~/utils/monstrique/sound'

const props = defineProps<{
  entry?: 'new' | 'continue'
  publicEdition?: boolean
}>()
const adminStory = useMonstressConventionStore()
const publicStory = useMonstriquePublicStore()
const story = computed(() => (props.publicEdition ? publicStory : adminStory))
const audience = computed(() =>
  props.publicEdition ? publicStory.audience : 'mature',
)
const emit = defineEmits<{ menu: [] }>()
const screen = ref<'title' | 'intro' | 'stage'>(
  props.entry === 'continue' ? 'stage' : 'intro',
)
const openingScene = computed(() => coldOpen(audience.value))
const reachedEnding = computed(() =>
  MONSTRESS_CONVENTION.endings.find(
    (ending) => ending.id === story.value.state.ending,
  ),
)
const endingTitle = computed(() => reachedEnding.value?.title ?? 'Case Closed')
const endingRoute = computed(() =>
  story.value.state.ending ? ENDING_ROUTE_NOTES[story.value.state.ending] : '',
)
const endingPlate = computed(() => {
  const art = reachedEnding.value?.art
  return art?.src ? { src: art.src, alt: art.alt ?? '' } : null
})
const drawer = ref<'case' | 'map' | null>(null)
const selected = ref<string | null>(null)
const held = ref<string | null>(null)
const iris = ref<StagePoint>(entryPoint(story.value.state.room))
const worldEl = ref<HTMLElement | null>(null)
const walkMs = ref(0)
const walking = ref(false)
const facing = ref<'left' | 'right'>('right')
let walkTimer: ReturnType<typeof setTimeout> | null = null
let reducedMotion = false
const room = computed(() =>
  roomForAudience(story.value.state.room, audience.value),
)
const activeHotspot = computed(() =>
  room.value.hotspots.find((hotspot) => hotspot.id === selected.value),
)
const activeTopics = computed(() =>
  selected.value ? availableTopics(story.value.state, selected.value) : [],
)
const score = computed(() => caseScore(story.value.state))
const scoreMax = computed(() => maxScore(audience.value))
const scoreGain = ref(0)
const scoreBump = ref(0)
watch(score, (now, before) => {
  scoreGain.value = now > before ? now - before : 0
  scoreBump.value += 1
})

const speaker = computed<MonstriqueCharacterId | null>(
  () => speakerOf(story.value.currentLine)?.id ?? null,
)
const speakerMood = computed(() => {
  const line = story.value.currentLine
  if (speaker.value === 'norb')
    return /not|never|biohazard|contaminat|germ|wash/i.test(line)
      ? 'recoil'
      : 'deduce'
  if (/!/.test(line)) return 'shock'
  if (/darling|honey|sweet|cute|kiss/i.test(line)) return 'smirk'
  return 'neutral'
})

const backdrop = computed(() => backdropFor(story.value.state.room))
const speakerPortrait = computed(() =>
  speaker.value ? portraitFor(speaker.value, speakerMood.value) : null,
)
const worldStyle = computed(() => ({
  '--focus': String(iris.value.x / 100),
  transitionDuration: walkMs.value + 'ms',
}))

const stageNpcs = computed(() =>
  room.value.hotspots.flatMap((hotspot) => {
    const model = modelForHotspot(hotspot.id)
    if (!model) return []
    const mark = backdrop.value ? STAGE_MARKS[hotspot.id] : undefined
    const figure = mark ? figureFor(model.id) : null
    return [
      mark
        ? {
            hotspot: hotspot.id,
            character: model.id,
            x: mark.x,
            y: mark.y,
            height:
              figureHeight(story.value.state.room, mark.y) *
              model.sprite.height,
            cut: mark.cut ?? 0,
            figure,
            marked: true,
          }
        : {
            hotspot: hotspot.id,
            character: model.id,
            x: hotspot.x,
            y: Math.max(hotspot.y, 40 * model.sprite.height + 2),
            height: 46 * model.sprite.height,
            cut: 0,
            figure: null,
            marked: false,
          },
    ]
  }),
)
const irisFacing = computed(() =>
  !walking.value && activeHotspot.value
    ? activeHotspot.value.x < iris.value.x
      ? 'left'
      : 'right'
    : facing.value,
)
const showNorbFollower = computed(
  () => !stageNpcs.value.some((actor) => actor.character === 'norb'),
)
const norb = computed(() => followerPoint(story.value.state.room, iris.value))
const followMs = computed(() => (walkMs.value ? walkMs.value + 180 : 0))
const shortcuts = computed(() => {
  if (drawer.value !== 'map') return []
  const state = story.value.state
  const step = (here: typeof state, destination: RoomId) =>
    travelForAudience(here, destination, audience.value)
  return shortcutRooms(state, step).filter(
    (destination) => !room.value.exits.includes(destination),
  )
})

function walkerStyle(
  point: StagePoint,
  stature: number,
  ms: number,
): Record<string, string> {
  const style: Record<string, string> = {
    left: point.x + '%',
    top: point.y + '%',
    transitionDuration: ms + 'ms',
  }
  if (stature) style.zIndex = String(Math.round(point.y))
  if (stature)
    style.height = stature * figureHeight(story.value.state.room, point.y) + '%'
  return style
}

function stopWalking(): void {
  if (walkTimer) clearTimeout(walkTimer)
  walkTimer = null
  walking.value = false
}

function stepAlong(path: StagePoint[]): void {
  const next = path.shift()
  if (!next) {
    walkMs.value = 0
    walking.value = false
    walkTimer = null
    return
  }
  const from = iris.value
  if (Math.abs(next.x - from.x) > 0.5)
    facing.value = next.x < from.x ? 'left' : 'right'
  const ms = reducedMotion
    ? 0
    : Math.round(Math.hypot(next.x - from.x, next.y - from.y) * 16)
  walking.value = ms > 0
  walkMs.value = ms
  iris.value = next
  walkTimer = setTimeout(() => stepAlong(path), ms)
}

function walkToPoint(target: StagePoint): void {
  stopWalking()
  stepAlong(findPath(story.value.state.room, iris.value, target))
}

watch(
  () => story.value.state.room,
  (next, previous) => {
    stopWalking()
    walkMs.value = 0
    iris.value = entryPoint(next, previous)
  },
)
watch(activeHotspot, (hotspot) => {
  if (hotspot) walkToPoint(approachPoint(story.value.state.room, hotspot))
})

onMounted(() => {
  reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  if (props.entry === 'continue') screen.value = 'stage'
  else if (props.entry === 'new') screen.value = 'intro'
  else if (story.value.state.transcript.length > 1) screen.value = 'stage'
})
onBeforeUnmount(stopWalking)

const sound = useMonstriqueSoundStore()
const kit = usePlaybookKitStore()
watch(
  () =>
    monstriqueMoodFor(
      story.value.activeCutscene ? null : story.value.state,
      screen.value === 'stage',
    ),
  (mood) => sound.setMood(mood),
  { immediate: true },
)
watch(
  () => story.value.state,
  (next, previous) => {
    if (previous && next !== previous)
      sound.play(monstriqueCuesFor(previous, next))
  },
)
watch(
  () => kit.settings.sound,
  (setting) => sound.setEnabled(setting !== 'off'),
  { immediate: true },
)
function onVisibility(): void {
  sound.setHidden(document.visibilityState === 'hidden')
}
onMounted(() => document.addEventListener('visibilitychange', onVisibility))
onBeforeUnmount(() =>
  document.removeEventListener('visibilitychange', onVisibility),
)

function begin(): void {
  story.value.begin()
  selected.value = null
  held.value = null
  drawer.value = null
  stopWalking()
  walkMs.value = 0
  iris.value = entryPoint(story.value.state.room)
  screen.value = 'intro'
}

function selectHotspot(id: string): void {
  selected.value = selected.value === id ? null : id
}

function walkTo(event: MouseEvent): void {
  const target = event.target as Element | null
  if (target?.closest('button, aside')) return
  const stage = worldEl.value ?? (event.currentTarget as HTMLElement)
  const bounds = stage.getBoundingClientRect()
  if (bounds.width === 0 || bounds.height === 0) return
  selected.value = null
  drawer.value = null
  walkToPoint(
    nearestWalkable(story.value.state.room, {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    }),
  )
}

function stepByKey(event: KeyboardEvent): void {
  const moves: Record<string, [number, number]> = {
    w: [0, -7],
    a: [-8, 0],
    s: [0, 7],
    d: [8, 0],
  }
  const move = moves[event.key.toLowerCase()]
  if (!move || drawer.value || event.metaKey || event.ctrlKey || event.altKey)
    return
  event.preventDefault()
  selected.value = null
  walkToPoint(
    nearestWalkable(story.value.state.room, {
      x: Math.min(97, Math.max(3, iris.value.x + move[0])),
      y: Math.min(98, Math.max(2, iris.value.y + move[1])),
    }),
  )
}

function selectAdjacent(direction: -1 | 1): void {
  if (drawer.value || room.value.hotspots.length === 0) return
  const spots = room.value.hotspots
  const current = spots.findIndex((spot) => spot.id === selected.value)
  const start = current < 0 ? (direction === 1 ? -1 : 0) : current
  selected.value = spots[(start + direction + spots.length) % spots.length]!.id
}

function pickInventory(item: string): void {
  if (held.value && held.value !== item) {
    story.value.takeAction({ verb: 'combine', item: held.value, target: item })
    held.value = null
    return
  }
  held.value = held.value === item ? null : item
}

function closeOverlay(): void {
  if (drawer.value) drawer.value = null
  else if (held.value) held.value = null
  else selected.value = null
}

function useHeld(): void {
  if (!held.value || !selected.value) return
  story.value.takeAction({
    verb: 'use',
    target: selected.value,
    item: held.value,
  })
  if (!story.value.state.inventory.includes(held.value)) held.value = null
}

function go(destination: RoomId): void {
  story.value.move(destination)
  selected.value = null
  drawer.value = null
}

function shortcutTo(destination: RoomId): void {
  story.value.travelTo(destination)
  selected.value = null
  drawer.value = null
}

function toggleDrawer(value: 'case' | 'map'): void {
  drawer.value = drawer.value === value ? null : value
  selected.value = null
}

function verbIcon(verb: Verb): string {
  const icons: Record<Verb, string> = {
    walk: 'kind-icon:map',
    look: 'kind-icon:eye',
    talk: 'kind-icon:book-open',
    take: 'kind-icon:hand',
    use: 'kind-icon:hand',
    photograph: 'kind-icon:camera',
    ask: 'kind-icon:book-open',
    flirt: 'kind-icon:heart',
  }
  return icons[verb]
}
</script>

<style scoped>
.mc-console {
  position: relative;
  font-family: ui-sans-serif, system-ui, sans-serif;
  background: #121a2b;
}
.mc-cast {
  z-index: 3;
}
.mc-npc {
  translate: -50% -86%;
}
.mc-npc.is-marked {
  translate: -50% -100%;
}
.mc-world {
  --world-w: min(calc(100cqw / 0.5), calc(100cqh * 1.75 / 0.94));
  --world-h: calc(var(--world-w) / 1.75);
  --world-o: max(0px, calc(var(--world-w) - 100cqw));
  width: var(--world-w);
  height: var(--world-h);
  left: calc(
    (100cqw - var(--world-w)) / 2 +
      clamp(
        calc(var(--world-o) / -2),
        calc(var(--world-w) * (0.5 - var(--focus, 0.5))),
        calc(var(--world-o) / 2)
      )
  );
  top: calc(
    min(0px, 100cqh - var(--world-h)) + max(0px, (100cqh - var(--world-h)) / 2)
  );
  transition-property: left;
  transition-timing-function: linear;
}
.mc-ambient {
  filter: blur(1.5rem) brightness(0.45) saturate(1.1);
  transform: scale(1.15);
}
.mc-figure {
  translate: -50% -100%;
}
.mc-figure-art {
  display: block;
  width: auto;
  height: 100%;
  max-width: none;
  transform-origin: 50% 100%;
  filter: drop-shadow(0 0.4rem 0.5rem rgb(0 0 0 / 0.45));
}
.mc-figure.is-ghost {
  opacity: 0.9;
  animation: mc-float 3.6s ease-in-out infinite;
}
.mc-figure.is-ghost .mc-figure-art {
  filter: drop-shadow(0 0 0.8rem rgb(190 210 255 / 0.7));
}
.mc-figure.is-talking .mc-figure-art {
  animation: mc-talk 0.55s ease-in-out infinite alternate;
}
@keyframes mc-float {
  50% {
    transform: translateY(-2.5%);
  }
}
@keyframes mc-talk {
  to {
    transform: scale(1.015, 0.99);
  }
}
.mc-walker {
  translate: -50% -100%;
  transition-property: left, top, height;
  transition-timing-function: linear;
}
.mc-germ-zone {
  width: 16%;
  aspect-ratio: 4 / 1;
  translate: -50% -50%;
  border: 2px dashed rgb(242 214 75 / 0.55);
  border-radius: 50%;
  transition-property: left, top;
  transition-timing-function: linear;
}
.mc-score {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.3rem 0.6rem;
  border-radius: 0.65rem;
  background: #1b1526;
  border: 1px solid #7d5366;
  font-variant-numeric: tabular-nums;
}
.mc-score small {
  font-size: 0.55rem;
  font-weight: 850;
  letter-spacing: 0.18em;
  opacity: 0.7;
}
.mc-score strong {
  font-size: 1rem;
  color: #ffd84d;
}
.mc-score span {
  font-size: 0.7rem;
  opacity: 0.7;
}
.mc-score-gain {
  position: absolute;
  right: 0.2rem;
  top: -0.9rem;
  font-style: normal;
  font-weight: 900;
  color: #ffd84d;
  animation: mc-gain 1.4s ease-out forwards;
}
.mc-bust {
  background: radial-gradient(circle at 50% 40%, #ffffff22, transparent 70%);
}
@keyframes mc-gain {
  to {
    translate: 0 -0.9rem;
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mc-walker,
  .mc-germ-zone,
  .mc-world {
    transition: none;
  }
  .mc-figure.is-ghost,
  .mc-figure.is-talking .mc-figure-art {
    animation: none;
  }
  .mc-score-gain {
    animation: none;
  }
}
.mc-eyebrow,
.mc-caption,
.mc-target,
.mc-scene-stamp {
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.mc-opening {
  background: radial-gradient(circle at 75% 10%, #51415a, #10182a 75%);
}
.mc-night {
  isolation: isolate;
}
.mc-moon {
  position: absolute;
  width: 11rem;
  aspect-ratio: 1;
  right: 10%;
  top: 9%;
  border-radius: 50%;
  background: #e9c5a8;
  box-shadow: 0 0 7rem #c18b9a55;
}
.mc-motel {
  position: absolute;
  width: min(84%, 67rem);
  height: 65%;
  left: 8%;
  bottom: 0;
  background: linear-gradient(#564355, #241b32);
  border: 0.45rem solid #37283c;
  transform: skewY(-3deg);
  box-shadow:
    0 0 0 1rem #201b2c,
    0 -1rem 5rem #0008;
}
.mc-windows {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6% 7%;
  position: absolute;
  inset: 9% 6% 28%;
}
.mc-window {
  background: #daa5a1;
  border: 0.4rem solid #292437;
  box-shadow: inset 0 0 3rem #543449;
}
.mc-marquee {
  position: absolute;
  z-index: 1;
  left: 4%;
  top: 20%;
  width: 69%;
  transform: rotate(-2deg);
  padding: 1.1rem;
  text-align: center;
  background: #1b1426;
  border: 0.25rem solid #ff84b4;
  box-shadow:
    0 0 2rem #fa5790a0,
    inset 0 0 1.2rem #a24f6680;
}
.mc-marquee-top {
  display: block;
  font-size: clamp(0.56rem, 1.4vw, 1rem);
  letter-spacing: 0.22em;
  color: #ffc3d7;
}
.mc-marquee strong {
  display: block;
  font-size: clamp(1.8rem, 4.7vw, 5.5rem);
  letter-spacing: -0.05em;
  color: #ff9abf;
  text-shadow: 0 0 1rem #fe55a9;
}
.mc-marquee strong span {
  color: #ffdc9c;
}
.mc-marquee small {
  font-size: clamp(0.45rem, 1vw, 0.85rem);
  color: #ffd3d3;
}
.mc-entrance {
  position: absolute;
  width: 17%;
  height: 31%;
  left: 43%;
  bottom: 0;
  background: #181627;
  border: 0.7rem solid #cca8ac;
}
.mc-opening-title {
  position: absolute;
  z-index: 2;
  inset: auto 5% 7%;
  text-shadow: 0 0.3rem 2rem #050716;
}
.mc-opening-title h1 {
  margin: 0.6rem 0;
  font-family: Georgia, serif;
  font-weight: 900;
  font-size: clamp(3.5rem, 8vw, 8rem);
  letter-spacing: -0.08em;
  line-height: 0.84;
}
.mc-opening-title h1 em {
  color: #ff8fba;
  font-style: normal;
}
.mc-tagline {
  font-size: clamp(0.8rem, 1.6vw, 1.2rem);
  color: #ffe0cb;
  font-weight: 700;
}
.mc-rain {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    108deg,
    #ffffff14 0 1px,
    transparent 1px 33px
  );
  opacity: 0.6;
  pointer-events: none;
}
.mc-title-footer,
.mc-action-bar,
.mc-footer {
  background: #191523;
  border-top: 1px solid #7d5366;
}
.mc-action-primary {
  display: inline-flex;
  gap: 0.6rem;
  align-items: center;
  justify-content: center;
  border: 0.15rem solid #ffd0b2;
  padding: 0.75rem 1.35rem;
  background: #a83e71;
  color: white;
  font-weight: 900;
  letter-spacing: 0.12em;
  border-radius: 0.6rem;
  box-shadow: 0 0.35rem 0 #4f2346;
}
.mc-location {
  font-family: Georgia, serif;
  font-size: clamp(1.1rem, 2.2vw, 1.65rem);
  font-weight: 800;
}
.mc-actor-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #915b73;
  padding: 0.25rem 0.5rem;
  border-radius: 0.8rem;
  background: #31283b;
}
.mc-actor-chip strong,
.mc-actor-chip small {
  display: block;
  font-size: 0.65rem;
  letter-spacing: 0.13em;
}
.mc-actor-chip small {
  opacity: 0.65;
}
.mc-portrait,
.mc-dialogue-portrait {
  display: grid;
  place-items: center;
  background: linear-gradient(120deg, #7e3256, #d895a7);
  color: white;
  font:
    800 1.4rem Georgia,
    serif;
  border-radius: 0.65rem;
}
.mc-portrait {
  width: 2.25rem;
  height: 2.25rem;
}
.mc-portrait.is-iris,
.mc-dialogue-portrait.is-iris {
  background: linear-gradient(120deg, #326870, #b5d2c5);
  color: #173744;
}
.mc-icon-button {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 2.6rem;
  height: 2.6rem;
  border-radius: 0.65rem;
  background: #322b43;
  border: 1px solid #7d5366;
}
.mc-count {
  position: absolute;
  right: -0.3rem;
  top: -0.3rem;
  font-size: 0.6rem;
  padding: 0 0.25rem;
  border-radius: 1rem;
  background: #ad4878;
}
.mc-scene {
  container-type: size;
  background: #20253a;
}
.mc-painted-scene {
  filter: saturate(0.9) contrast(1.07);
}
.mc-shadow {
  background: linear-gradient(
    180deg,
    #0e122344 0%,
    transparent 27%,
    transparent 64%,
    #080917a6 100%
  );
}
.mc-scene-stamp {
  position: absolute;
  left: 1rem;
  top: 0.8rem;
  opacity: 0.55;
  text-shadow: 0 2px 10px black;
}
.mc-hotspot {
  z-index: 4;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-direction: column;
  min-width: 2.65rem;
}
.mc-hotspot-pip {
  display: grid;
  place-items: center;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 999px;
  border: 2px solid #ffdbbe;
  background: #391d40db;
  box-shadow: 0 0 1rem #ff83ad7a;
}
.mc-hotspot-name {
  border-radius: 0.4rem;
  background: #171324e0;
  padding: 0.2rem 0.45rem;
  font-size: 0.67rem;
  font-weight: 800;
  white-space: nowrap;
}
.mc-hotspot.is-selected .mc-hotspot-pip {
  background: #ac3d78;
  outline: 3px solid #fff6;
}
.mc-dialogue {
  background: #251b32;
  border-top: 2px solid #93627a;
  min-height: 4.3rem;
  max-height: 6rem;
  overflow: hidden;
}
.mc-dialogue-portrait {
  width: 3.5rem;
  height: 3.5rem;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid #e0b7ad;
}
.mc-line {
  font-family: Georgia, serif;
  font-size: clamp(0.82rem, 1.4vw, 1.15rem);
  line-height: 1.35;
}
.mc-verbs {
  background: #231c2f;
  border-top: 1px solid #5e4159;
}
.mc-verb,
.mc-topic,
.mc-exit,
.mc-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  font-size: 0.75rem;
  border: 1px solid #806078;
  padding: 0.44rem 0.6rem;
  border-radius: 0.65rem;
  background: #392b49;
  text-transform: capitalize;
}
.mc-verb:hover,
.mc-topic:hover,
.mc-exit:hover {
  background: #8a3f6d;
}
.mc-topic {
  background: #3c4252;
}
.mc-inventory {
  scrollbar-width: thin;
}
.mc-item {
  background: #45364d;
}
.mc-item.is-held,
.mc-verb.is-held {
  background: #a83e71;
  border-color: #ffd0b2;
}
.mc-hearts {
  letter-spacing: 0.15em;
  color: #6d5370;
}
.mc-hearts .is-on {
  color: #ff8fba;
}
.mc-drawer {
  width: min(84%, 23rem);
  background: #211c2d;
  border-left: 2px solid #ad7990;
  box-shadow: -1rem 0 2rem #0008;
}
.mc-drawer-header {
  padding: 0.85rem;
  border-bottom: 1px solid #95637d;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
}
.mc-note-list {
  padding-top: 0.7rem;
  display: grid;
  gap: 0.4rem;
}
.mc-note-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.55rem;
  background: #3a304a;
  border-radius: 0.55rem;
  font-size: 0.82rem;
}
.mc-exit {
  text-align: left;
  white-space: normal;
}
.mc-ending {
  background: #100f22ed;
}
.mc-ending-plate {
  opacity: 0.6;
}
.mc-ending-route {
  color: #ffd9e4;
  opacity: 0.85;
}
.mc-ending-card {
  position: relative;
  background: #342338e8;
  border: 2px solid #e2a5ba;
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 0 5rem #f36a9b35;
}
.mc-action-primary:focus-visible,
.mc-verb:focus-visible,
.mc-hotspot:focus-visible,
.mc-icon-button:focus-visible,
.mc-exit:focus-visible {
  outline: 3px solid #ffe4c7;
  outline-offset: 3px;
}
@container (max-width: 36rem) {
  .mc-hotspot-name {
    display: none;
  }
  .mc-marquee {
    top: 10%;
    width: 82%;
  }
  .mc-opening-title {
    bottom: 12%;
  }
  .mc-title-footer {
    justify-content: center;
  }
  .mc-caption {
    display: none;
  }
  .mc-verbs {
    max-height: 9rem;
    overflow-y: auto;
  }
  .mc-actor-chip strong {
    font-size: 0.6rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mc-rain {
    display: none;
  }
}
</style>
