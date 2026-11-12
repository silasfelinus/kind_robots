<template>
  <section
    class="couchscope"
    :class="{
      'scope-large-text': largeText,
      'scope-reduced-motion': reducedMotion,
    }"
    data-testid="space-couch-star-assessment"
    aria-label="Space Couch constellation personality assessment"
  >
    <div class="couchscope-sky" aria-hidden="true">
      <img
        v-if="wildMode && wildArtwork"
        :key="wildArtKey"
        class="scope-question-art scope-sign-art"
        data-testid="space-couch-wild-art"
        :src="wildArtwork"
        alt=""
        @error="wildArtFailed = true"
      />
      <img
        v-else-if="!wildMode && !assessment && artworkReady"
        class="scope-question-art"
        :src="questionArtwork"
        alt=""
        @error="onQuestionArtError"
      />
      <img
        v-else-if="!wildMode && assessment && signArtwork && !signArtFailed"
        class="scope-question-art scope-sign-art"
        data-testid="space-couch-star-sign-art"
        :src="signArtwork"
        alt=""
        @error="signArtFailed = true"
      />
      <svg v-else viewBox="0 0 480 430" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="scope-starglow">
            <stop offset="0" stop-color="#f8e5b4" stop-opacity="0.95" />
            <stop offset="1" stop-color="#84e9f1" stop-opacity="0" />
          </radialGradient>
        </defs>
        <path
          class="scope-thread"
          d="M90 318 160 252 196 292 270 202 342 223 395 112 292 89 270 202 160 252 105 124"
        />
        <path
          class="scope-thread second"
          d="M196 292 225 355 342 223 383 327"
        />
        <circle
          v-for="(point, i) in constellations"
          :key="i"
          :cx="point[0]"
          :cy="point[1]"
          :r="i % 3 === 0 ? 14 : 9"
          fill="url(#scope-starglow)"
        />
        <circle
          v-for="(point, i) in constellations"
          :key="'pin-' + i"
          :cx="point[0]"
          :cy="point[1]"
          :r="i % 3 === 0 ? 3.5 : 2.2"
          fill="#ffdfaa"
        />
      </svg>
      <div class="scope-orbit scope-orbit-one" />
      <div class="scope-orbit scope-orbit-two" />
    </div>

    <div class="scope-screen">
      <header class="scope-header">
        <span class="scope-kicker"
          >THE COUCHSCOPE · OFFICE OF CELESTIAL HUMAN RESOURCES</span
        >
        <strong>MANDATORY PERSONALITY AND LIABILITY SCREENING</strong>
        <div
          v-if="!wildMode"
          class="scope-progress"
          role="group"
          aria-label="Assessment progress"
        >
          <span
            v-for="index in STAR_QUESTIONS.length"
            :key="index"
            :class="{
              current: answers.length === index - 1,
              answered: answers.length >= index,
            }"
          >
            {{ String(index).padStart(2, '0') }}
          </span>
        </div>
      </header>

      <div
        v-if="wildMode && wildScene"
        class="scope-content scope-wild"
        data-testid="space-couch-wild-break"
      >
        <span class="scope-episode"
          >WILD BREAK · STEP {{ wildPath!.length + 1 }} OF
          {{ WILD_BREAK_STEPS }}</span
        >
        <span class="scope-kicker">{{ wildScene.kicker }}</span>
        <h2>{{ wildScene.title }}</h2>
        <p>{{ wildScene.text }}</p>
        <SpaceCouchChoiceHand
          class="scope-wild-hand"
          :choices="wildChoices"
          :deal-key="'wild-' + wildPath!.join('-')"
          testid-prefix="space-couch-wild-choice"
          @play="(choice) => chooseWild(Number(choice.id))"
        />
      </div>
      <div
        v-else-if="wildMode && wildEndingNow"
        class="scope-reveal scope-wild"
        data-testid="space-couch-wild-ending"
      >
        <span class="scope-episode"
          >WILD BREAK ENDING
          {{ String(wildBreakNumber(wildEndingNow.id)).padStart(2, '0') }} OF
          {{ WILD_BREAK_ENDING_COUNT }}</span
        >
        <h2>{{ wildEndingNow.title }}</h2>
        <p class="scope-hr-verdict">{{ wildEndingNow.text }}</p>
        <p class="scope-omen">
          ✧ No constellation. The voyage starts with
          {{ WILD_BREAK_METER_LABELS[wildEndingNow.perk.meter] }}.
        </p>
        <div
          class="scope-wild-ledger"
          role="img"
          :aria-label="
            'Wild break endings found: ' +
            foundWild.length +
            ' of ' +
            WILD_BREAK_ENDING_COUNT
          "
          data-testid="space-couch-wild-ledger"
        >
          <span
            v-for="end in WILD_BREAK_ENDINGS"
            :key="end.id"
            :class="{
              found: foundWild.includes(end.id),
              current: end.id === wildEndingNow.id,
            }"
            :title="foundWild.includes(end.id) ? end.title : 'Not yet found'"
          />
          <small
            >FOUND {{ foundWild.length }} OF
            {{ WILD_BREAK_ENDING_COUNT }}</small
          >
        </div>
        <div class="scope-final-actions">
          <button
            type="button"
            class="scope-secondary"
            data-testid="space-couch-wild-again"
            @click="startWild"
          >
            TRY ANOTHER BREAK
          </button>
          <button
            type="button"
            class="scope-confirm"
            data-testid="space-couch-wild-launch"
            @click="launchWild"
          >
            LAUNCH UNSIGNED <b>➜</b>
          </button>
        </div>
      </div>
      <template v-else-if="!assessment">
        <div class="scope-content" data-testid="space-couch-star-question">
          <span class="scope-episode"
            >QUESTION {{ answers.length + 1 }} OF
            {{ String(STAR_QUESTIONS.length).padStart(2, '0') }}</span
          >
          <span class="scope-kicker">{{
            STAR_QUESTIONS[answers.length]!.cue
          }}</span>
          <h2>{{ STAR_QUESTIONS[answers.length]!.prompt }}</h2>
          <SpaceCouchChoiceHand
            class="scope-hand"
            :choices="answerChoices"
            :deal-key="String(answers.length)"
            testid-prefix="space-couch-star-answer"
            @play="(choice) => choose(Number(choice.id))"
          >
            <template #art="{ choice }">
              <img
                v-if="artworkReady"
                class="scope-answer-art"
                :class="{ 'scope-option-ready': artReady[Number(choice.id)] }"
                :src="answerArtwork(Number(choice.id))"
                alt=""
                @load="artReady[Number(choice.id)] = true"
                @error="onAnswerArtError($event, Number(choice.id))"
              />
              <span
                v-else
                class="scope-answer-art scope-answer-art--waiting"
                aria-hidden="true"
              />
            </template>
          </SpaceCouchChoiceHand>
        </div>
      </template>
      <template v-else>
        <div class="scope-reveal" data-testid="space-couch-star-reveal">
          <span class="scope-episode">YOUR CONSTELLATION</span>
          <span
            v-if="!signArtwork || signArtFailed"
            class="scope-sign-glyph"
            aria-hidden="true"
            >{{ sign?.glyph }}</span
          >
          <h2>{{ sign?.name }}</h2>
          <strong>{{ sign?.epithet }}</strong>
          <p class="scope-hr-verdict">
            {{ sign ? STAR_HR_VERDICTS[sign.id] : '' }}
          </p>
          <p class="scope-omen">✧ {{ sign?.omen }}</p>
          <div class="scope-final-actions">
            <button
              type="button"
              class="scope-secondary"
              data-testid="space-couch-star-retake"
              @click="retakeAssessment"
            >
              CHANGE MY ANSWERS
            </button>
            <button
              type="button"
              class="scope-confirm"
              data-testid="space-couch-star-accept"
              @click="emit('confirm', assessment)"
            >
              KEEP THIS CONSTELLATION <b>➜</b>
            </button>
          </div>
        </div>
      </template>
      <footer class="scope-footer">
        <template v-if="wildMode">
          <button
            v-if="wildPath!.length"
            type="button"
            data-testid="space-couch-wild-back"
            @click="stepBackWild"
          >
            ← STEP BACK
          </button>
          <button
            type="button"
            data-testid="space-couch-wild-return"
            @click="leaveWild"
          >
            RETURN TO THE COUCHSCOPE
          </button>
        </template>
        <button
          v-else-if="answers.length && !assessment"
          type="button"
          data-testid="space-couch-star-back"
          @click="previousQuestion"
        >
          ← PREVIOUS ANSWER
        </button>
        <button
          v-else-if="!assessment"
          type="button"
          data-testid="space-couch-star-return-background"
          @click="emit('back')"
        >
          ← BACK TO BACKGROUND
        </button>
        <span v-else>ASSESSMENT RESULTS ARE NOT APPEALABLE</span>
        <button
          v-if="!wildMode"
          type="button"
          class="scope-wild-exit"
          data-testid="space-couch-wild-break-start"
          @click="startWild"
        >
          ⚡ WILD BREAK · REFUSE THE SCREENING
        </button>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { warpArt } from '~/utils/gameOfCaptains/artManifest'
import {
  STAR_QUESTIONS,
  STAR_HR_VERDICTS,
  createStarAssessment,
  starSignFor,
  type StarAssessment,
} from '~/utils/gameOfCaptains/starSigns'
import type { KrHandChoice } from '~/components/narrative/kr-choice-hand.vue'
import {
  WILD_BREAK_ENDINGS,
  WILD_BREAK_ENDING_COUNT,
  WILD_BREAK_METER_LABELS,
  WILD_BREAK_STEPS,
  createWildBreak,
  walkWildBreak,
  wildBreakEndingArtKey,
  wildBreakNumber,
  wildBreakSceneArtKey,
  type WildBreakRecord,
} from '~/utils/gameOfCaptains/wildBreak'

const {
  largeText = false,
  reducedMotion = false,
  artwork = {},
  artworkReady = true,
  wildFound = [],
} = defineProps<{
  largeText?: boolean
  reducedMotion?: boolean
  artwork?: Record<string, string>
  artworkReady?: boolean
  /** Wild break ending ids this browser has already found. */
  wildFound?: readonly string[]
}>()
const emit = defineEmits<{
  confirm: [assessment: StarAssessment]
  back: []
  wildEnding: [id: string]
  wildBreak: [record: WildBreakRecord]
}>()
const answers = ref<number[]>([])
const artReady = ref<Record<number, boolean>>({})
const signArtFailed = ref(false)
const currentQuestion = computed(
  () =>
    STAR_QUESTIONS[Math.min(answers.value.length, STAR_QUESTIONS.length - 1)]!,
)
const questionArtwork = computed(
  () =>
    artwork[currentQuestion.value.art] ||
    warpArt(currentQuestion.value.art) ||
    currentQuestion.value.fallback,
)
function answerArtwork(optionIndex: number): string {
  const key =
    currentQuestion.value.art +
    '-answer-' +
    String.fromCharCode(97 + optionIndex)
  return artwork[key] || warpArt(key) || questionArtwork.value
}
function onQuestionArtError(event: Event) {
  const image = event.target as HTMLImageElement
  const fallback = currentQuestion.value.fallback
  if (image.getAttribute('src') !== fallback) image.src = fallback
}
function onAnswerArtError(event: Event, index: number) {
  const image = event.target as HTMLImageElement
  const fallback = questionArtwork.value
  if (image.getAttribute('src') === fallback) {
    artReady.value[index] = true
  } else {
    image.src = fallback
  }
}
const answerChoices = computed<KrHandChoice[]>(() =>
  (STAR_QUESTIONS[answers.value.length]?.options ?? []).map(
    (option, index) => ({
      id: String(index),
      label: option.label,
      chip: 'Answer ' + String.fromCharCode(65 + index),
      hint: option.flavor,
    }),
  ),
)
const assessment = computed(() => createStarAssessment(answers.value))
const sign = computed(() =>
  assessment.value ? starSignFor(assessment.value.sign) : null,
)
const signArtwork = computed(() => {
  if (!sign.value) return ''
  const key = 'couchscope/sign-' + sign.value.id
  return artwork[key] || warpArt(key) || ''
})
const constellations: [number, number][] = [
  [90, 318],
  [160, 252],
  [196, 292],
  [270, 202],
  [342, 223],
  [395, 112],
  [292, 89],
  [105, 124],
  [225, 355],
  [383, 327],
]
function retakeAssessment() {
  answers.value = []
  artReady.value = {}
  signArtFailed.value = false
}
function previousQuestion() {
  answers.value = answers.value.slice(0, -1)
  artReady.value = {}
  signArtFailed.value = false
}
// The wild break: refuse the screening and take one of 32 endings instead.
const wildPath = ref<number[] | null>(null)
const wildArtFailed = ref(false)
const wildMode = computed(() => wildPath.value !== null)
const wildAt = computed(() =>
  wildPath.value ? walkWildBreak(wildPath.value) : null,
)
const wildScene = computed(() =>
  wildAt.value && 'scene' in wildAt.value ? wildAt.value.scene : null,
)
const wildEndingNow = computed(() =>
  wildAt.value && 'ending' in wildAt.value ? wildAt.value.ending : null,
)
const foundWild = computed(() => {
  const found = new Set(wildFound)
  if (wildEndingNow.value) found.add(wildEndingNow.value.id)
  return WILD_BREAK_ENDINGS.map((end) => end.id).filter((id) => found.has(id))
})
const wildArtKey = computed(() =>
  wildEndingNow.value
    ? wildBreakEndingArtKey(wildEndingNow.value.id)
    : wildScene.value
      ? wildBreakSceneArtKey(wildScene.value.id)
      : '',
)
// Until a wild-break plate is rendered, the painted screening office stands in.
const wildArtwork = computed(() => {
  if (!wildMode.value) return ''
  const own = artwork[wildArtKey.value] || warpArt(wildArtKey.value)
  if (own && !wildArtFailed.value) return own
  return artwork['couchscope/question-01'] || ''
})
const WILD_CARD_FOCUS = ['12% 50%', '38% 50%', '62% 50%', '88% 50%']
const WILD_CARD_ICONS = ['⚡', '✷', '☄', '⌁']
const wildChoices = computed<KrHandChoice[]>(() =>
  (wildScene.value?.choices ?? []).map((choice, index) => ({
    id: String(index),
    label: choice.label,
    chip: 'Break ' + String.fromCharCode(65 + index),
    hint: choice.hint,
    image: wildArtwork.value || null,
    artPosition: WILD_CARD_FOCUS[index],
    icon: WILD_CARD_ICONS[index],
  })),
)
function startWild() {
  wildPath.value = []
  wildArtFailed.value = false
}
function chooseWild(index: number) {
  if (!wildPath.value || !wildScene.value?.choices[index]) return
  wildPath.value = [...wildPath.value, index]
  wildArtFailed.value = false
  if (wildEndingNow.value) emit('wildEnding', wildEndingNow.value.id)
}
function stepBackWild() {
  if (!wildPath.value?.length) return
  wildPath.value = wildPath.value.slice(0, -1)
  wildArtFailed.value = false
}
function leaveWild() {
  wildPath.value = null
  wildArtFailed.value = false
}
function launchWild() {
  const record = wildPath.value ? createWildBreak(wildPath.value) : null
  if (record) emit('wildBreak', record)
}
function choose(index: number) {
  if (answers.value.length >= STAR_QUESTIONS.length || index < 0 || index > 2)
    return
  answers.value = [...answers.value, index]
  artReady.value = {}
}
</script>

<style scoped>
.couchscope {
  position: relative;
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  isolation: isolate;
  container-type: inline-size;
  background:
    radial-gradient(ellipse at 85% 30%, #422852 0, transparent 46%),
    radial-gradient(ellipse at 15% 80%, #173f57 0, transparent 51%), #0b1125;
  color: #fcebdd;
}
.couchscope-sky {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.88;
  background-image:
    radial-gradient(#fff8da 1px, transparent 1.5px),
    radial-gradient(#98e9f5 1px, transparent 2px);
  background-size:
    73px 83px,
    131px 167px;
  background-position:
    0 0,
    23px 19px;
}
.scope-question-art {
  position: absolute;
  right: 0;
  top: 0;
  width: 55%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 0 34px #050a1b);
  opacity: 0.96;
}
.couchscope-sky svg {
  position: absolute;
  width: min(65%, 700px);
  height: 100%;
  right: 0;
  top: 0;
  opacity: 0.72;
}
.scope-thread {
  fill: none;
  stroke: #fbe0ad;
  stroke-width: 1.5;
  stroke-dasharray: 4 8;
}
.scope-thread.second {
  stroke: #83e1e7;
  opacity: 0.7;
}
.scope-orbit {
  position: absolute;
  top: 50%;
  right: 9%;
  width: min(52vh, 40%);
  aspect-ratio: 1;
  border: 1px solid #9bd1d733;
  border-radius: 50%;
  transform: translateY(-50%);
}
.scope-orbit-two {
  width: min(65vh, 57%);
  right: 0;
  border-color: #f7db9a24;
}
.scope-screen {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  padding: clamp(0.6rem, 1.7cqi, 1.5rem);
}
.scope-header {
  flex: 0 0 auto;
}
.scope-kicker {
  color: #f4c58b;
  font-weight: 800;
  font-size: clamp(0.61rem, 1.1cqi, 0.82rem);
  letter-spacing: 0.13em;
}
.scope-header > strong {
  display: block;
  margin-top: 0.25rem;
  font:
    900 clamp(1rem, 2.4cqi, 2rem)/1.1 Georgia,
    serif;
  letter-spacing: -0.045em;
}
.scope-progress {
  display: flex;
  gap: 0.4rem;
  margin: 0.7rem 0;
}
.scope-progress span {
  width: 2.25rem;
  padding: 0.28rem;
  text-align: center;
  border: 1px solid #68818c;
  background: #0a182a;
  color: #7792a9;
  font-weight: 800;
  font-size: 0.68rem;
}
.scope-progress .answered {
  border-color: #88cdd3;
  background: #264e59;
  color: #d9ffff;
}
.scope-progress .current {
  border-color: #ffcc8a;
  color: #ffcc8a;
}
.scope-content,
.scope-reveal {
  flex: 1 1 auto;
  min-height: 0;
  width: min(52%, 47rem);
  overflow: hidden;
  padding: 0.3rem 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.scope-reveal {
  overflow-y: auto;
  justify-content: flex-start;
}
.scope-episode {
  display: block;
  color: #86e5e9;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.18em;
}
.scope-content h2,
.scope-reveal h2 {
  max-width: 30ch;
  margin: 0.25rem 0 0.4rem;
  font:
    900 clamp(1.55rem, min(3.25cqi, 5.2vh), 3.25rem)/1.04 Georgia,
    serif;
  letter-spacing: -0.045em;
  text-wrap: balance;
}
.scope-content p,
.scope-reveal p {
  max-width: 68ch;
  color: #d0dde6;
  font-size: clamp(0.75rem, 1.12cqi, 0.95rem);
  line-height: 1.35;
}
.scope-hand {
  flex: none;
  margin-top: clamp(0.45rem, 1.5vh, 0.9rem);
}
.scope-answer-art {
  object-fit: cover;
}
.scope-answer-art--waiting {
  background: #17283b;
}
.scope-hand :deep(:is(.krh-title, .krh-hint)) {
  transition: opacity 200ms ease;
}
.scope-hand
  :deep(.krh-front:not(:has(.scope-option-ready)) :is(.krh-title, .krh-hint)) {
  opacity: 0;
}
.scope-sign-glyph {
  display: block;
  margin: 0.2rem 0;
  width: max-content;
  font-size: clamp(3.4rem, 9cqi, 6.8rem);
  line-height: 1;
  color: #ffdb9c;
  text-shadow: 0 0 50px #ffbd8d66;
}
.scope-reveal h2 {
  color: #ffdda5;
}
.scope-reveal > strong {
  color: #9ce3e8;
  font-size: clamp(0.9rem, 1.7cqi, 1.24rem);
}
.scope-omen {
  font-weight: 800;
  color: #f8c58f !important;
}
.scope-hr-verdict {
  font-size: clamp(0.9rem, 1.5cqi, 1.15rem) !important;
  color: #f1e6da !important;
}
.scope-sign-art {
  object-fit: cover;
  mask-image: linear-gradient(to right, transparent, #000 18%);
}
.scope-final-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}
.scope-final-actions button {
  padding: 0.8rem 1rem;
  border: 1px solid #ebc28c;
  border-radius: 0.3rem;
  font-weight: 900;
  font-size: 0.74rem;
}
.scope-secondary {
  background: #18253b;
  color: #f9d6a8;
}
.scope-confirm {
  background: #e8b97f;
  color: #132039;
}
.scope-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.6rem;
  border-top: 1px solid #556d84;
  color: #97aebd;
  font-size: 0.61rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.scope-wild-exit {
  color: #ff9f8a !important;
  letter-spacing: 0.1em;
}
.scope-wild-hand {
  flex: none;
  margin-top: clamp(0.45rem, 1.5vh, 0.9rem);
}
.scope-wild h2 {
  color: #ffcfb8;
}
.scope-wild-ledger {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.22rem;
  margin-top: 0.8rem;
  max-width: 26rem;
}
.scope-wild-ledger span {
  width: 0.62rem;
  height: 0.62rem;
  border: 1px solid #5d7489;
  border-radius: 50%;
  background: #0b1628;
}
.scope-wild-ledger span.found {
  border-color: #ffb48f;
  background: #f29b78;
}
.scope-wild-ledger span.current {
  box-shadow: 0 0 0 2px #ffe2b8;
}
.scope-wild-ledger small {
  flex-basis: 100%;
  margin-top: 0.3rem;
  color: #f4c58b;
  font-weight: 900;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
}
.scope-footer button {
  min-height: 2rem;
  color: #ffdbad;
  text-align: left;
}
@media (max-width: 900px) {
  .scope-question-art {
    width: 100%;
    height: 45%;
    object-fit: contain;
    object-position: top center;
    opacity: 0.92;
    mask-image: linear-gradient(to bottom, #000 65%, transparent);
  }
  .scope-content,
  .scope-reveal {
    width: 100%;
  }
  .scope-screen {
    background: linear-gradient(
      180deg,
      #09162b8a 0%,
      #09162b50 32%,
      #09162be6 57%,
      #09162bf4 100%
    );
  }
  .scope-content h2,
  .scope-reveal h2 {
    font-size: clamp(1.55rem, min(5.5cqi, 5vh), 2.8rem);
  }
  .scope-content p {
    font-size: 0.82rem;
  }
}
@media (max-width: 660px) {
  .scope-screen {
    padding: 0.7rem;
  }
  .couchscope-sky svg {
    width: 100%;
    opacity: 0.3;
  }
  .scope-header > strong {
    font-size: 1rem;
  }
  .scope-progress {
    margin: 0.4rem 0;
  }
  .scope-content h2,
  .scope-reveal h2 {
    font-size: clamp(1.35rem, min(6.5cqi, 4.2vh), 2rem);
  }
  .scope-header > strong {
    margin: 0;
  }
  .scope-content p {
    font-size: 0.7rem;
    line-height: 1.2;
  }
  .scope-footer {
    font-size: 0.56rem;
  }
  .scope-footer span:last-child {
    display: none;
  }
}
.scope-large-text .scope-content h2 {
  font-size: clamp(1.75rem, min(3.6cqi, 5.4vh), 3.5rem);
}
.scope-large-text .scope-content p {
  font-size: clamp(0.9rem, 1.2cqi, 1.05rem);
}
.scope-large-text .scope-hand {
  --hand-text-scale: 1.4;
}
.scope-reduced-motion * {
  animation: none !important;
  transition: none !important;
}
@media (max-height: 560px) {
  .scope-content {
    justify-content: flex-start;
    overflow-y: auto;
  }
  .scope-header > strong {
    font-size: 0.95rem;
  }
  .scope-progress {
    margin: 0.25rem 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .couchscope {
    scroll-behavior: auto;
  }
}
</style>
