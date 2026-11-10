<template>
  <section
    class="mx-title @container relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden"
    data-testid="monstrexx-front-page"
    aria-label="Monstrique main menu"
    @keydown.esc="closePanel"
  >
    <svg
      class="mx-painting pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 1440 860"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mx-sky" x2="0" y2="1">
          <stop offset="0" stop-color="#10182e" />
          <stop offset=".5" stop-color="#33213f" />
          <stop offset="1" stop-color="#642b56" />
        </linearGradient>
        <linearGradient id="mx-asphalt" x2="0" y2="1">
          <stop offset="0" stop-color="#241d39" />
          <stop offset="1" stop-color="#0c1625" />
        </linearGradient>
        <linearGradient id="mx-window" x2="0" y2="1">
          <stop offset="0" stop-color="#f5c699" />
          <stop offset="1" stop-color="#c36b92" />
        </linearGradient>
        <linearGradient id="mx-pink" x2="0" y2="1">
          <stop offset="0" stop-color="#ff9cbb" />
          <stop offset="1" stop-color="#e53d80" />
        </linearGradient>
        <linearGradient id="mx-iriscoat" x2="0" y2="1">
          <stop offset="0" stop-color="#bb4b76" />
          <stop offset="1" stop-color="#401e46" />
        </linearGradient>
        <filter id="mx-neon">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect width="1440" height="860" fill="url(#mx-sky)" />
      <circle cx="1160" cy="150" r="113" fill="#e3b7c7" opacity=".6" />
      <circle
        cx="1160"
        cy="150"
        r="142"
        fill="#f0a6ca"
        opacity=".18"
        filter="url(#mx-neon)"
      />
      <path
        d="M0 400L180 328L300 367L510 298L680 385L830 343L1020 376L1275 300L1440 358V860H0Z"
        fill="#191c32"
      />
      <g fill="#141b2e">
        <path d="M101 390V233H169V390M130 233V193H150V233" />
        <path d="M206 384V276H282V384M225 276V244H267V276" />
        <path d="M316 384V238H350V384M380 384V289H410V384" />
        <path d="M665 391V265H728V391M685 265V238H708V265" />
        <path
          d="M835 381V242H869V381M852 242V206"
          stroke="#171628"
          stroke-width="12"
        />
        <path d="M986 388V299H1061V388M1110 372V290H1160V372" />
      </g>
      <g opacity=".82">
        <path d="M360 415V218H1345V515H360Z" fill="#452d48" />
        <path d="M375 225H1330V377H375Z" fill="#77506a" />
        <path d="M362 219H1342L1370 248H334Z" fill="#261d33" />
        <path d="M375 383H1340" stroke="#1c1a2b" stroke-width="20" />
        <path d="M375 400H1340" stroke="#e07b9f" stroke-width="8" />
        <g v-for="unit in 6" :key="unit">
          <rect
            :x="404 + (unit - 1) * 144"
            y="254"
            width="94"
            height="102"
            fill="#252037"
            stroke="#312c40"
            stroke-width="9"
          />
          <rect
            :x="415 + (unit - 1) * 144"
            y="265"
            width="72"
            height="80"
            fill="url(#mx-window)"
          />
          <path
            :d="'M' + (451 + (unit - 1) * 144) + ' 265v80'"
            stroke="#483750"
            stroke-width="10"
          />
          <path
            :d="'M' + (406 + (unit - 1) * 144) + ' 269l90 75'"
            stroke="#f0b5ae"
            opacity=".13"
            stroke-width="6"
          />
        </g>
        <path d="M405 404H1320V510H405Z" fill="#543749" />
        <rect x="500" y="417" width="112" height="94" fill="#2c2b3b" />
        <rect x="638" y="417" width="121" height="94" fill="#2c2b3b" />
        <rect x="785" y="418" width="121" height="94" fill="#3b293d" />
        <path d="M500 416H906" stroke="#f3a7a8" stroke-width="10" />
        <rect
          x="1090"
          y="400"
          width="117"
          height="122"
          rx="7"
          fill="#3c8399"
          stroke="#102d40"
          stroke-width="13"
        />
        <rect
          x="1105"
          y="423"
          width="87"
          height="51"
          fill="#123a50"
          stroke="#adf0ee"
          stroke-width="5"
        />
        <text
          x="1121"
          y="459"
          font-size="33"
          font-weight="900"
          fill="#d8ffff"
          letter-spacing="4"
        >
          ICE
        </text>
        <path d="M416 381H1334" stroke="#2f293b" stroke-width="10" />
        <path
          d="M416 298H1334"
          stroke="#1c2634"
          stroke-width="7"
          opacity=".7"
        />
      </g>
      <g transform="translate(286 316)">
        <rect
          width="243"
          height="140"
          rx="12"
          fill="#1d162c"
          stroke="#fa79b3"
          stroke-width="11"
        />
        <rect x="8" y="8" width="226" height="124" rx="5" fill="#302040" />
        <text
          x="121"
          y="54"
          text-anchor="middle"
          font-family="Georgia, serif"
          font-style="italic"
          font-size="49"
          fill="#ffd4de"
        >
          Last Call
        </text>
        <text
          x="121"
          y="99"
          text-anchor="middle"
          font-size="25"
          font-weight="900"
          letter-spacing="4"
          fill="#7fe6e5"
        >
          MOTOR LODGE
        </text>
        <text
          x="121"
          y="123"
          text-anchor="middle"
          font-size="14"
          font-weight="800"
          letter-spacing="2"
          fill="#efb2cd"
        >
          NO REFUNDS
        </text>
      </g>
      <path d="M0 525L1440 515V860H0Z" fill="url(#mx-asphalt)" />
      <g opacity=".48" stroke-linecap="round">
        <path d="M370 560L830 574" stroke="#fe83bb" stroke-width="6" />
        <path d="M490 610L1100 633" stroke="#8cdbdf" stroke-width="8" />
        <path d="M260 708L1190 744" stroke="#d65f91" stroke-width="7" />
        <path d="M400 774L1400 795" stroke="#c5a3c5" stroke-width="5" />
        <path d="M125 829L750 842" stroke="#7e9bae" stroke-width="10" />
        <path d="M720 560L1110 570" stroke="#e9acaa" stroke-width="4" />
      </g>
      <g transform="translate(940 222)">
        <path
          d="M-100 390Q-104 210 2 190Q110 195 151 405L185 625H-161Z"
          fill="#1c172c"
          opacity=".7"
        />
        <path
          d="M-67 425Q-84 266 1 233Q73 231 122 310L178 640L-151 640Z"
          fill="url(#mx-iriscoat)"
          stroke="#1b2034"
          stroke-width="17"
        />
        <path
          d="M-67 298L-7 430L58 287L98 632H-119Z"
          fill="#542a4a"
          opacity=".72"
        />
        <path
          d="M-40 274L-12 354L24 280"
          fill="none"
          stroke="#e9abc0"
          stroke-width="13"
        />
        <path
          d="M-20 277Q-45 212-40 133Q-11 56 54 80Q96 111 72 221L48 291Z"
          fill="#201a2e"
        />
        <path
          d="M-50 171Q-66 110-34 89Q-25 56 5 57Q40 40 64 80Q112 89 100 167L86 250L61 235Q71 203 67 188L-30 208Z"
          fill="#22162a"
        />
        <path
          d="M-16 118Q28 98 60 127L70 183Q68 227 31 250Q-14 252-21 213Z"
          fill="#e3a48f"
          stroke="#492a3d"
          stroke-width="7"
        />
        <path
          d="M-10 168L12 166M39 164L58 170"
          stroke="#402634"
          stroke-width="8"
          stroke-linecap="round"
        />
        <path
          d="M0 193Q24 184 31 193"
          stroke="#6c334b"
          stroke-width="5"
          fill="none"
        />
        <path
          d="M9 215Q30 227 45 214"
          stroke="#ac4f66"
          stroke-width="8"
          fill="none"
        />
        <circle
          cx="-12"
          cy="215"
          r="10"
          fill="none"
          stroke="#f0c3af"
          stroke-width="5"
        />
        <path
          d="M-29 112Q-65 134-45 190Q-79 217-42 251M50 88Q105 112 87 190Q110 246 66 273"
          stroke="#271525"
          stroke-width="24"
          fill="none"
        />
        <path
          d="M-105 423Q-77 366-34 391L10 515L-67 550Z"
          fill="#773753"
          stroke="#301c33"
          stroke-width="14"
        />
        <path
          d="M72 391Q127 376 155 438L138 545L91 544Z"
          fill="#a0476c"
          stroke="#301c33"
          stroke-width="14"
        />
        <rect
          x="-8"
          y="496"
          width="102"
          height="82"
          rx="15"
          fill="#222939"
          stroke="#a2b1b7"
          stroke-width="10"
          transform="rotate(-8 45 535)"
        />
        <circle
          cx="43"
          cy="533"
          r="26"
          fill="#132e41"
          stroke="#d3c5c6"
          stroke-width="8"
        />
        <circle cx="43" cy="533" r="12" fill="#5488a5" />
        <rect x="4" y="484" width="36" height="20" rx="4" fill="#b6c7c5" />
      </g>
      <g transform="translate(1195 432)">
        <ellipse
          cx="110"
          cy="393"
          rx="100"
          ry="27"
          fill="#17132b"
          opacity=".7"
        />
        <path
          d="M45 334L30 390H92L104 325M134 320L146 390H206L173 320"
          fill="#302b47"
          stroke="#171c2f"
          stroke-width="9"
        />
        <path
          d="M31 342Q2 222 52 190Q112 158 175 212Q214 272 186 347Z"
          fill="#a8a0a0"
          stroke="#302d3e"
          stroke-width="13"
        />
        <path d="M53 223L96 291L151 217L174 350H37Z" fill="#544959" />
        <path d="M88 220L100 315L118 229" fill="#e5d2c3" />
        <path
          d="M39 243Q-6 243 2 330L27 347L65 267M181 244Q225 251 227 322L200 341L161 266"
          fill="#a6a0a5"
          stroke="#2d293d"
          stroke-width="12"
        />
        <path d="M21 315L24 349L57 351L56 320" fill="#e9e6d8" />
        <path d="M192 319L190 347L218 346L220 318" fill="#e9e6d8" />
        <path
          d="M54 189Q24 138 43 77Q51 24 110 21Q173 24 181 92Q191 146 153 190Z"
          fill="#dbaf98"
          stroke="#412d40"
          stroke-width="12"
        />
        <path
          d="M40 94Q17 52 64 36Q121-9 174 50L184 111L158 74L88 66L51 104Z"
          fill="#322638"
        />
        <ellipse
          cx="112"
          cy="132"
          rx="30"
          ry="24"
          fill="#d19b8b"
          stroke="#985e65"
          stroke-width="5"
        />
        <path
          d="M85 162Q106 177 140 158"
          stroke="#7e5151"
          stroke-width="5"
          fill="none"
        />
        <path
          d="M94 164V177M111 165V178M129 163V176"
          stroke="#fff3df"
          stroke-width="8"
        />
        <g fill="none" stroke="#242b42" stroke-width="11">
          <circle cx="72" cy="105" r="30" />
          <circle cx="144" cy="105" r="30" />
          <path d="M101 105H116" />
        </g>
        <g fill="#222436">
          <circle cx="74" cy="105" r="7" />
          <circle cx="142" cy="105" r="7" />
        </g>
        <path
          d="M43 170Q68 185 73 210M145 205Q168 184 179 166"
          stroke="#31263a"
          stroke-width="18"
          fill="none"
        />
        <path d="M100 235L103 262L118 239" fill="#f5b5c8" />
      </g>
    </svg>
    <div
      class="mx-vignette pointer-events-none absolute inset-0"
      aria-hidden="true"
    />
    <div
      class="mx-rain pointer-events-none absolute inset-0"
      aria-hidden="true"
    />

    <div
      v-if="!panel"
      class="mx-content relative z-10 flex min-h-0 flex-1 flex-col justify-between"
    >
      <div class="mx-brand">
        <p class="mx-eyebrow">
          A Midnight City mystery ·
          {{ audience === 'mature' ? 'mature edition' : 'general edition' }}
        </p>
        <h1 class="mx-wordmark">MONSTRIQUE</h1>
        <p class="mx-subtitle">Fame. Fangs. Very bad contracts.</p>
        <div class="mx-case-number">
          <span>CASE FILE 001</span>
          <strong>THE LAST CALL</strong>
        </div>
      </div>

      <div class="mx-menu" role="group" aria-label="Main menu">
        <button
          type="button"
          class="mx-choice mx-new"
          data-testid="monstrexx-new-game"
          @click="startNew"
        >
          <span class="mx-choice-icon"
            ><Icon name="kind-icon:play" class="size-6"
          /></span>
          <span class="min-w-0 flex-1 text-left">
            <strong>{{ confirming ? 'START OVER?' : 'NEW GAME' }}</strong>
            <small>{{
              confirming
                ? 'Press again to replace this save'
                : 'Check in at the Last Call'
            }}</small>
          </span>
        </button>
        <button
          type="button"
          class="mx-choice"
          data-testid="monstrexx-continue"
          :disabled="!story.hasSavedCase"
          @click="chooseContinue"
        >
          <span class="mx-choice-icon"
            ><Icon name="kind-icon:arrow-right" class="size-6"
          /></span>
          <span class="min-w-0 flex-1 text-left">
            <strong>CONTINUE</strong>
            <small>{{
              story.hasSavedCase
                ? 'Resume ' + currentLocation
                : 'No case on file yet'
            }}</small>
          </span>
        </button>
        <button
          type="button"
          class="mx-choice"
          data-testid="monstrexx-settings"
          @click="openPanel('settings')"
        >
          <span class="mx-choice-icon"
            ><Icon name="kind-icon:settings" class="size-6"
          /></span>
          <span class="min-w-0 flex-1 text-left">
            <strong>SETTINGS</strong>
            <small
              >Reading, sound, motion{{
                audience === 'mature' ? ' and romance' : ''
              }}</small
            >
          </span>
        </button>
        <button
          type="button"
          class="mx-choice"
          data-testid="monstrexx-scrapbook"
          @click="openPanel('scrapbook')"
        >
          <span class="mx-choice-icon"
            ><Icon name="kind-icon:book-open" class="size-6"
          /></span>
          <span class="min-w-0 flex-1 text-left">
            <strong>SCRAPBOOK</strong>
            <small
              >{{ unlockedMoments }} of {{ spec.moments.length }} memories
              collected</small
            >
          </span>
        </button>
      </div>

      <div
        class="mx-footer-line flex flex-wrap items-center justify-between gap-2"
      >
        <span>IRIS QUILL · NORB VALE · LAST CALL MOTOR LODGE</span>
        <span>{{
          props.publicEdition
            ? 'TWO EDITIONS · ONE MYSTERY'
            : 'PRIVATE EARLY ACCESS · MONSTRIQUE'
        }}</span>
      </div>
      <p v-if="story.storageWarning" class="mx-warning" role="status">
        {{ story.storageWarning }}
      </p>
    </div>

    <div
      v-else
      class="mx-modal-backdrop relative z-20 flex min-h-0 flex-1 items-center justify-end p-3 @md:p-6"
    >
      <div
        class="mx-sheet flex h-full min-h-0 w-full max-w-2xl flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        :aria-label="
          panel === 'settings' ? 'Monstrique settings' : 'Monstrique scrapbook'
        "
      >
        <div class="mx-sheet-header flex shrink-0 items-center gap-3">
          <Icon
            :name="
              panel === 'settings'
                ? 'kind-icon:settings'
                : 'kind-icon:book-open'
            "
            class="size-6"
          />
          <div class="min-w-0 flex-1">
            <p class="mx-eyebrow">MONSTRIQUE · PERSONAL FILE</p>
            <h2>{{ panel === 'settings' ? 'Settings' : 'Scrapbook' }}</h2>
          </div>
          <button
            ref="closeButton"
            type="button"
            class="mx-close"
            aria-label="Back to main menu"
            @click="closePanel"
          >
            <Icon name="kind-icon:close" class="size-5" />
          </button>
        </div>
        <div class="kr-scroll mx-sheet-scroll min-h-0 flex-1 overflow-y-auto">
          <template v-if="panel === 'settings'">
            <p class="mx-sheet-intro">
              Make the investigation comfortable. These choices are saved for
              your account.
            </p>
            <div class="mx-settings-list">
              <div v-for="key in settingKeys" :key="key" class="mx-setting">
                <span class="font-semibold">{{
                  KIT_SETTING_LABELS[key].label
                }}</span>
                <div class="mx-setting-chooser">
                  <button
                    type="button"
                    :aria-label="'Previous ' + KIT_SETTING_LABELS[key].label"
                    @click="stepSetting(key, -1)"
                  >
                    ◀
                  </button>
                  <span>{{ settingLabel(key) }}</span>
                  <button
                    type="button"
                    :aria-label="'Next ' + KIT_SETTING_LABELS[key].label"
                    @click="stepSetting(key, 1)"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
            <p class="mx-small-note">
              {{
                audience === 'mature'
                  ? 'Hiding romance changes optional content, not clues. Mature access is controlled by your account settings.'
                  : 'General edition: the full investigation without adult romance or mature keepsakes. Sign in and enable mature content for the separate optional edition.'
              }}
            </p>
            <button type="button" class="mx-reset" @click="kit.resetSettings()">
              Restore default settings
            </button>
          </template>
          <template v-else>
            <p class="mx-sheet-intro">
              Meet the faces behind the franchise, and keep the moments you've
              uncovered.
            </p>
            <div
              class="mx-scrap-tabs"
              role="group"
              aria-label="Scrapbook pages"
            >
              <button
                type="button"
                :aria-pressed="scrapTab === 'people'"
                @click="scrapTab = 'people'"
              >
                <Icon name="kind-icon:users" class="size-4" /> People
              </button>
              <button
                type="button"
                :aria-pressed="scrapTab === 'moments'"
                @click="scrapTab = 'moments'"
              >
                <Icon name="kind-icon:camera" class="size-4" /> Memories ({{
                  unlockedMoments
                }}/{{ spec.moments.length }})
              </button>
              <button
                type="button"
                :aria-pressed="scrapTab === 'albums'"
                @click="scrapTab = 'albums'"
              >
                <Icon name="kind-icon:music" class="size-4" /> Albums (7)
              </button>
            </div>
            <div class="mx-scrap-content">
              <PlaybookKitCast v-if="scrapTab === 'people'" :spec="spec" />
              <PlaybookKitScrapbook
                v-else-if="scrapTab === 'moments'"
                :spec="spec"
              />
              <MonstriqueAlbumArchive
                v-else
                :creator-mode="!props.publicEdition"
                :public-edition="!!props.publicEdition"
              />
            </div>
            <p class="mx-small-note">
              More celebrity profiles and illustrated keepsakes will unlock as
              the story expands.
            </p>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useMonstressConventionStore } from '~/stores/monstressConventionStore'
import { useMonstriquePublicStore } from '~/stores/monstriquePublicStore'
import { MONSTRIQUE_GENERAL_SPEC } from '~/utils/monstressConvention/edition'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { HOTEL_ROOMS } from '~/utils/monstressConvention/prologue'
import { MONSTRESS_CONVENTION } from '~/utils/playbookKit/games/monstressConvention'
import {
  KIT_SETTING_LABELS,
  KIT_SETTING_OPTIONS,
  type KitSettingKey,
  type KitSettings,
} from '~/utils/playbookKit/settings'

type FrontPanel = 'settings' | 'scrapbook' | null
const props = defineProps<{ panel: FrontPanel; publicEdition?: boolean }>()
const emit = defineEmits<{
  new: []
  continue: []
  panel: [value: FrontPanel]
}>()
const adminStory = useMonstressConventionStore()
const publicStory = useMonstriquePublicStore()
const story = computed(() => (props.publicEdition ? publicStory : adminStory))
const kit = usePlaybookKitStore()
const audience = computed(() =>
  props.publicEdition ? publicStory.audience : 'mature',
)
const spec = computed(() =>
  props.publicEdition && audience.value === 'general'
    ? MONSTRIQUE_GENERAL_SPEC
    : MONSTRESS_CONVENTION,
)
const confirming = ref(false)
const scrapTab = ref<'people' | 'moments' | 'albums'>('people')
const closeButton = ref<HTMLButtonElement | null>(null)
const currentLocation = computed(
  () => HOTEL_ROOMS[story.value.state.room].label,
)
const unlockedMoments = computed(
  () =>
    spec.value.moments.filter((moment) => kit.isUnlocked('moments', moment.id))
      .length,
)
const settingKeys = computed(() =>
  (Object.keys(KIT_SETTING_OPTIONS) as KitSettingKey[]).filter(
    (key) => key !== 'romance' || audience.value === 'mature',
  ),
)

watch(
  () => props.panel,
  (panel) => {
    if (panel) void nextTick(() => closeButton.value?.focus())
  },
)

function startNew(): void {
  if (story.value.hasSavedCase && !confirming.value) {
    confirming.value = true
    return
  }
  confirming.value = false
  emit('new')
}

function chooseContinue(): void {
  confirming.value = false
  if (story.value.hasSavedCase) emit('continue')
}

function openPanel(value: Exclude<FrontPanel, null>): void {
  confirming.value = false
  emit('panel', value)
}

function closePanel(): void {
  if (props.panel) emit('panel', null)
}

function settingLabel(key: KitSettingKey): string {
  return KIT_SETTING_LABELS[key].options[kit.settings[key]] ?? kit.settings[key]
}

function stepSetting(key: KitSettingKey, direction: number): void {
  const choices = KIT_SETTING_OPTIONS[key] as readonly string[]
  const at = choices.indexOf(kit.settings[key])
  const next = choices[(at + direction + choices.length) % choices.length]
  if (next) kit.setSetting(key, next as KitSettings[typeof key])
}
</script>

<style scoped>
.mx-title {
  color: #fff0e8;
  background: #17182c;
  --mx-pink: #ff8eae;
  --mx-cyan: #8ce0e2;
}
.mx-painting {
  filter: contrast(1.06) saturate(1.1);
}
.mx-vignette {
  background:
    linear-gradient(
      90deg,
      #111628f0 0%,
      #111628a8 29%,
      #1d152922 67%,
      #1613264a 100%
    ),
    linear-gradient(0deg, #0e1028f2 0%, #1d122a4d 34%, transparent 69%);
}
.mx-rain {
  opacity: 0.2;
  background: repeating-linear-gradient(
    108deg,
    transparent 0 32px,
    #e1d5fa55 32px 33px,
    transparent 33px 65px
  );
}
.mx-content {
  padding: clamp(0.75rem, 2.5cqw, 2.25rem);
  gap: 0.6rem;
}
.mx-brand {
  max-width: 62%;
  filter: drop-shadow(0 4px 15px #120b23);
}
.mx-eyebrow {
  font:
    800 clamp(0.55rem, 1cqw, 0.82rem)/1.4 system-ui,
    sans-serif;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f8b9cd;
}
.mx-wordmark {
  margin: clamp(0.15rem, 0.8cqw, 0.6rem) 0;
  width: max-content;
  max-width: 100%;
  font:
    italic 1000 clamp(2.8rem, 7.7cqw, 8.3rem)/0.91 Impact,
    Haettenschweiler,
    'Arial Narrow Bold',
    sans-serif;
  letter-spacing: -0.065em;
  transform: rotate(-3deg);
  transform-origin: left center;
  background: linear-gradient(
    #ffecdb 9%,
    #ffb9c1 31%,
    #fa528c 70%,
    #a33c77 100%
  );
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1px #ffafc8;
  text-shadow: 7px 7px 0 #351632;
}
.mx-subtitle {
  font:
    800 clamp(0.84rem, 1.9cqw, 1.5rem)/1.2 Georgia,
    serif;
  font-style: italic;
  color: #fae1d4;
}
.mx-case-number {
  display: flex;
  flex-direction: column;
  width: fit-content;
  border-left: 4px solid #8ce0e2;
  margin-top: clamp(0.6rem, 2cqh, 1.8rem);
  padding: 0.3rem 0.8rem;
  background: #121526a8;
  gap: 0.15rem;
}
.mx-case-number span {
  font: 900 0.62rem/1.2 system-ui;
  letter-spacing: 0.22em;
  color: #8ce0e2;
}
.mx-case-number strong {
  font:
    800 clamp(0.75rem, 1.4cqw, 1rem)/1.4 Georgia,
    serif;
  letter-spacing: 0.04em;
}
.mx-menu {
  display: grid;
  width: min(100%, 39rem);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(0.45rem, 1cqw, 0.85rem);
  margin-top: auto;
}
.mx-choice {
  display: flex;
  min-height: clamp(4rem, 9.3cqh, 5.9rem);
  min-width: 0;
  align-items: center;
  gap: clamp(0.45rem, 1.2cqw, 0.85rem);
  border: 1px solid #a77d9d;
  border-left: 5px solid #b45e8b;
  border-radius: 0.45rem;
  background: linear-gradient(125deg, #382342f0, #191a2bf0);
  padding: clamp(0.45rem, 1cqw, 0.85rem);
  text-shadow: 0 2px 5px #0009;
  box-shadow:
    0 5px 0 #0b1427b0,
    inset 0 1px #d6a2bb37;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}
.mx-choice:hover:not(:disabled),
.mx-choice:focus-visible {
  transform: translateY(-2px);
  border-color: #ffc7d7;
  background: linear-gradient(130deg, #72345cfa, #2d2446fa);
}
.mx-choice:focus-visible,
.mx-close:focus-visible,
.mx-setting-chooser button:focus-visible {
  outline: 3px solid #98f2ef;
  outline-offset: 3px;
}
.mx-choice:disabled {
  opacity: 0.52;
  cursor: not-allowed;
  filter: grayscale(0.6);
}
.mx-new {
  border-left-color: #ff9dbb;
  background: linear-gradient(120deg, #9b3f72eb, #3b214cea);
}
.mx-choice-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: clamp(2.5rem, 5.5cqw, 3.4rem);
  height: clamp(2.5rem, 5.5cqw, 3.4rem);
  border-radius: 0.55rem;
  background: #161b33c9;
  color: var(--mx-cyan);
  box-shadow: inset 0 0 0 1px #8ce0e255;
}
.mx-choice strong {
  display: block;
  font:
    900 clamp(0.86rem, 1.7cqw, 1.27rem)/1.1 system-ui,
    sans-serif;
  letter-spacing: 0.045em;
}
.mx-choice small {
  display: block;
  margin-top: 0.32rem;
  font:
    500 clamp(0.65rem, 1cqw, 0.76rem)/1.25 system-ui,
    sans-serif;
  color: #e8bcd6;
  text-wrap: pretty;
}
.mx-footer-line {
  padding-top: 0.25rem;
  font: 800 clamp(0.52rem, 0.75cqw, 0.63rem)/1.3 system-ui;
  letter-spacing: 0.14em;
  color: #d0afc7;
}
.mx-warning {
  background: #50243b;
  padding: 0.4rem;
  border-left: 3px solid #f8bbcf;
  font-size: 0.73rem;
}
.mx-modal-backdrop {
  background: #0d12209e;
}
.mx-sheet {
  border: 1px solid #e6a0b7;
  border-radius: 0.9rem;
  background: #211b32f8;
  box-shadow: 0 20px 65px #060d20c9;
}
.mx-sheet-header {
  border-bottom: 2px solid #954b78;
  padding: 1rem;
  background: linear-gradient(90deg, #6c335a, #25203c);
}
.mx-sheet-header h2 {
  font:
    900 clamp(1.25rem, 3cqw, 2rem)/1.15 Georgia,
    serif;
}
.mx-close {
  display: grid;
  place-items: center;
  width: 2.65rem;
  height: 2.65rem;
  flex-shrink: 0;
  border: 1px solid #f1c1ca;
  border-radius: 0.5rem;
  background: #20172b;
}
.mx-sheet-scroll {
  padding: clamp(0.75rem, 2cqw, 1.3rem);
  overscroll-behavior: contain;
}
.mx-sheet-intro {
  margin-bottom: 1rem;
  color: #f8d5df;
  font-size: 0.9rem;
  line-height: 1.5;
}
.mx-settings-list {
  display: grid;
  gap: 0.55rem;
}
.mx-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #6d4969;
  border-radius: 0.6rem;
  background: #35283e;
  font-size: 0.86rem;
}
.mx-setting-chooser {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  justify-content: space-between;
  min-width: 10rem;
}
.mx-setting-chooser span {
  text-align: center;
  font-size: 0.82rem;
  color: #b9eaec;
}
.mx-setting-chooser button {
  min-width: 2.25rem;
  min-height: 2.25rem;
  border-radius: 0.3rem;
  background: #442d4c;
  color: #ffd8e7;
}
.mx-small-note {
  margin: 1rem 0;
  border-left: 3px solid #8ce0e2;
  padding-left: 0.8rem;
  color: #decad7;
  font-size: 0.8rem;
  line-height: 1.5;
}
.mx-reset {
  padding: 0.65rem 1rem;
  border: 1px solid #b17897;
  border-radius: 0.45rem;
  font-size: 0.83rem;
}
.mx-scrap-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.mx-scrap-tabs button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #875878;
  border-radius: 0.45rem;
  padding: 0.6rem 0.8rem;
  background: #34243d;
  font-weight: 700;
  font-size: 0.82rem;
}
.mx-scrap-tabs button[aria-pressed='true'] {
  background: #8d3a67;
  border-color: #ffd3e1;
}
.mx-scrap-content {
  color: #ffedee;
}
@container (max-width: 42rem) {
  .mx-brand {
    max-width: 100%;
  }
  .mx-wordmark {
    font-size: clamp(2.65rem, 12cqw, 5.5rem);
  }
  .mx-subtitle {
    font-size: clamp(0.8rem, 3cqw, 1.2rem);
  }
  .mx-case-number {
    margin-top: 0.5rem;
  }
  .mx-menu {
    width: 100%;
  }
  .mx-choice {
    min-height: 4rem;
    padding: 0.5rem;
  }
  .mx-choice-icon {
    width: 2.3rem;
    height: 2.3rem;
  }
  .mx-choice strong {
    font-size: 0.8rem;
  }
  .mx-choice small {
    font-size: 0.62rem;
  }
  .mx-footer-line {
    font-size: 0.55rem;
  }
  .mx-vignette {
    background:
      linear-gradient(90deg, #15172ac9, #14162952),
      linear-gradient(0deg, #13142afc, transparent 82%);
  }
}
@container (max-width: 25rem) {
  .mx-choice {
    gap: 0.35rem;
  }
  .mx-choice-icon {
    width: 2rem;
    height: 2rem;
  }
  .mx-case-number strong {
    font-size: 0.66rem;
  }
  .mx-settings-list {
    gap: 0.35rem;
  }
  .mx-setting {
    padding: 0.4rem;
    gap: 0.5rem;
  }
  .mx-setting-chooser {
    min-width: 8rem;
  }
}
@container (max-height: 33rem) {
  .mx-case-number {
    display: none;
  }
  .mx-choice {
    min-height: 3.3rem;
  }
  .mx-content {
    gap: 0.25rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mx-rain {
    display: none;
  }
  .mx-choice {
    transition: none;
  }
}
</style>
