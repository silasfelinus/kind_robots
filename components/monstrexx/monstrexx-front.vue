<template>
  <section
    class="mx-title @container relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden"
    data-testid="monstrexx-front-page"
    aria-label="Monstrique main menu"
    @keydown.esc="closePanel"
  >
    <div
      class="mx-painting pointer-events-none absolute inset-0"
      :class="{ 'is-mature': splashIsMature }"
      aria-hidden="true"
      data-testid="monstrique-splash"
    >
      <img
        class="mx-splash is-wide"
        :src="splash.wide"
        alt=""
        decoding="async"
        fetchpriority="high"
      />
      <img
        class="mx-splash is-tall"
        :src="splash.tall"
        alt=""
        decoding="async"
      />
    </div>
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
        <button
          type="button"
          class="mx-choice"
          data-testid="monstrexx-achievements"
          @click="openPanel('achievements')"
        >
          <span class="mx-choice-icon"
            ><Icon name="kind-icon:star" class="size-6"
          /></span>
          <span class="min-w-0 flex-1 text-left">
            <strong>ACHIEVEMENTS</strong>
            <small>Badges earned on the case</small>
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
          panel === 'settings'
            ? 'Monstrique settings'
            : panel === 'achievements'
              ? 'Monstrique achievements'
              : 'Monstrique scrapbook'
        "
      >
        <div class="mx-sheet-header flex shrink-0 items-center gap-3">
          <Icon
            :name="
              panel === 'settings'
                ? 'kind-icon:settings'
                : panel === 'achievements'
                  ? 'kind-icon:star'
                  : 'kind-icon:book-open'
            "
            class="size-6"
          />
          <div class="min-w-0 flex-1">
            <p class="mx-eyebrow">MONSTRIQUE · PERSONAL FILE</p>
            <h2>
              {{
                panel === 'settings'
                  ? 'Settings'
                  : panel === 'achievements'
                    ? 'Achievements'
                    : 'Scrapbook'
              }}
            </h2>
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
              Make the investigation comfortable. Settings and case progress are
              saved in this browser for the current edition.
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
            <div class="flex flex-wrap gap-3">
              <button
                type="button"
                class="mx-reset"
                @click="kit.resetSettings()"
              >
                Restore default settings
              </button>
              <button
                type="button"
                class="mx-reset"
                :class="{ 'mx-reset-confirm': confirmingErase }"
                data-testid="monstrique-erase-progress"
                :aria-label="
                  confirmingErase
                    ? 'Confirm erase this edition case and keepsakes'
                    : 'Erase this edition case and keepsakes'
                "
                @click="forgetAll"
              >
                {{
                  confirmingErase
                    ? 'Tap again to erase this edition'
                    : 'Erase case and keepsakes'
                }}
              </button>
            </div>
            <p class="mx-small-note">
              This erases only the current edition in this browser. Other
              editions and account achievements are unaffected.
            </p>
            <p
              v-if="eraseFeedback || story.storageWarning || kit.storageWarning"
              class="mx-small-note"
              role="status"
            >
              {{ eraseFeedback || story.storageWarning || kit.storageWarning }}
            </p>
          </template>
          <template v-else-if="panel === 'achievements'">
            <p class="mx-sheet-intro">
              An investigator's reputation outlives a case. Earn badges by
              following clues, making discoveries and reaching endings.
            </p>
            <GameAchievementStrip game="monstress-convention" layout="row" />
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
              <button
                type="button"
                data-testid="monstrique-scrapbook-endings"
                :aria-pressed="scrapTab === 'endings'"
                @click="scrapTab = 'endings'"
              >
                <Icon name="kind-icon:star" class="size-4" />
                Endings ({{ unlockedEndings }}/{{ spec.endings.length }})
              </button>
            </div>
            <div class="mx-scrap-content">
              <PlaybookKitCast v-if="scrapTab === 'people'" :spec="spec" />
              <PlaybookKitScrapbook
                v-else-if="scrapTab === 'moments'"
                :spec="spec"
              />
              <PlaybookKitEndings
                v-else-if="scrapTab === 'endings'"
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useUserStore } from '~/stores/userStore'
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

type FrontPanel = 'settings' | 'scrapbook' | 'achievements' | null
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
const user = useUserStore()
onMounted(() => {
  watch(
    () => [
      user.token,
      user.showMature,
      user.isMaturityRestricted,
      audience.value,
    ],
    () => void publicStory.loadSplash(),
    { immediate: true },
  )
})
const audience = computed(() =>
  props.publicEdition ? publicStory.audience : 'mature',
)
const GENERAL_SPLASH = {
  wide: '/monstrique/front/splash-wide.webp',
  tall: '/monstrique/front/splash-tall.webp',
}
const splashIsMature = computed(
  () => audience.value === 'mature' && Boolean(publicStory.matureSplash),
)
const splash = computed(() =>
  splashIsMature.value && publicStory.matureSplash
    ? publicStory.matureSplash
    : GENERAL_SPLASH,
)
const spec = computed(() =>
  props.publicEdition && audience.value === 'general'
    ? MONSTRIQUE_GENERAL_SPEC
    : MONSTRESS_CONVENTION,
)
const confirming = ref(false)
const confirmingErase = ref(false)
const eraseFeedback = ref('')
const scrapTab = ref<'people' | 'moments' | 'albums' | 'endings'>('people')
const closeButton = ref<HTMLButtonElement | null>(null)
const currentLocation = computed(
  () => HOTEL_ROOMS[story.value.state.room].label,
)
const unlockedMoments = computed(
  () =>
    spec.value.moments.filter((moment) => kit.isUnlocked('moments', moment.id))
      .length,
)
const unlockedEndings = computed(
  () =>
    spec.value.endings.filter((ending) => kit.isUnlocked('endings', ending.id))
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
    confirmingErase.value = false
    eraseFeedback.value = ''
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
  confirmingErase.value = false
  emit('panel', value)
}

function closePanel(): void {
  confirmingErase.value = false
  if (props.panel) emit('panel', null)
}

function forgetAll(): void {
  if (!confirmingErase.value) {
    eraseFeedback.value = ''
    confirmingErase.value = true
    return
  }
  confirmingErase.value = false
  if (!story.value.forgetCase()) {
    eraseFeedback.value =
      story.value.storageWarning || 'Could not erase the case on this device.'
    return
  }
  kit.resetProgress()
  eraseFeedback.value =
    kit.storageWarning || 'This edition’s case and keepsakes were erased.'
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
  overflow: hidden;
  background: #17182c;
}
.mx-splash {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 68% 50%;
  animation: mx-drift 38s ease-in-out infinite alternate;
}
.mx-splash.is-tall {
  display: none;
  object-position: 50% 62%;
}
.mx-painting.is-mature .mx-splash {
  filter: saturate(1.12);
}
@keyframes mx-drift {
  from {
    transform: scale(1.02) translate(0, 0);
  }
  to {
    transform: scale(1.09) translate(-1.5%, -1%);
  }
}
@media (orientation: portrait) {
  .mx-splash.is-wide {
    display: none;
  }
  .mx-splash.is-tall {
    display: block;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mx-splash {
    animation: none;
  }
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
.mx-choice:last-child {
  grid-column: span 2;
}
@container (min-width: 44rem) {
  .mx-menu {
    width: min(100%, 51rem);
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .mx-choice:last-child {
    grid-column: auto;
  }
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
.mx-reset-confirm {
  border-color: #ffd3e1;
  background: #81304c;
  color: #fff4f6;
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
