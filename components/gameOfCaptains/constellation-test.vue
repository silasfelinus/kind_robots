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
        v-if="!assessment"
        class="scope-question-art"
        :src="questionArtwork"
        alt=""
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
          class="scope-progress"
          role="group"
          aria-label="Assessment progress"
        >
          <span
            v-for="index in 4"
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

      <template v-if="!assessment">
        <div class="scope-content" data-testid="space-couch-star-question">
          <span class="scope-episode"
            >QUESTION {{ answers.length + 1 }} OF 04</span
          >
          <span class="scope-kicker">{{
            STAR_QUESTIONS[answers.length]!.cue
          }}</span>
          <h2>{{ STAR_QUESTIONS[answers.length]!.prompt }}</h2>
          <p>
            This is a scientifically unlicensed assessment. All responses are logged
            for promotion eligibility.
          </p>
          <div class="scope-choices">
            <button
              v-for="(option, index) in STAR_QUESTIONS[answers.length]!.options"
              :key="index"
              type="button"
              :data-testid="'space-couch-star-answer-' + index"
              :class="{ 'scope-option-ready': artReady[index] }"
              @click="choose(index)"
            >
              <img
                class="scope-answer-art"
                :src="answerArtwork(index)"
                alt=""
                @load="artReady[index] = true"
                @error="artReady[index] = true"
              />
              <span class="scope-choice-number">{{
                String.fromCharCode(65 + index)
              }}</span>
              <span class="scope-choice-copy"
                ><strong>{{ option.label }}</strong
                ><small>{{ option.flavor }}</small></span
              >
              <b aria-hidden="true">↗</b>
            </button>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="scope-reveal" data-testid="space-couch-star-reveal">
          <span class="scope-episode"
            >PROVISIONAL WORKPLACE PERSONALITY CLASSIFICATION</span
          >
          <span class="scope-sign-glyph" aria-hidden="true">{{
            sign?.glyph
          }}</span>
          <h2>{{ sign?.name }}</h2>
          <strong>{{ sign?.epithet }}</strong>
          <p class="scope-hr-verdict">
            <strong>OFFICIAL PERSONNEL FINDING:</strong>
            {{ sign ? STAR_HR_VERDICTS[sign.id] : '' }}
          </p>
          <p>{{ sign?.myth }}</p>
          <p class="scope-omen">
            ✧ OFFICIAL PERFORMANCE FORECAST: {{ sign?.omen }}
          </p>
          <p class="scope-exclusive">
            CORPORATE BENEFIT: THREE EXCLUSIVE ASSIGNMENTS, NONE COVERED BY
            INSURANCE.
          </p>
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
        <button
          v-if="answers.length && !assessment"
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
        <span>COMING UP NEXT: YOUR CREW, YOUR TROUBLE</span>
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

const { largeText = false, reducedMotion = false } = defineProps<{
  largeText?: boolean
  reducedMotion?: boolean
}>()
const emit = defineEmits<{ confirm: [assessment: StarAssessment]; back: [] }>()
const answers = ref<number[]>([])
const artReady = ref<Record<number, boolean>>({})
const questionArtwork = computed(() => {
  const index = String(
    Math.min(answers.value.length + 1, STAR_QUESTIONS.length),
  ).padStart(2, '0')
  return (
    warpArt('couchscope/question-' + index) ||
    '/game-of-captains/couchscope/question-' + index + '.svg'
  )
})
function answerArtwork(optionIndex: number): string {
  const question = String(Math.min(answers.value.length + 1, 4)).padStart(2, '0')
  const answer = String.fromCharCode(97 + optionIndex)
  return (
    warpArt('couchscope/question-' + question + '-answer-' + answer) ||
    questionArtwork.value
  )
}
const assessment = computed(() => createStarAssessment(answers.value))
const sign = computed(() =>
  assessment.value ? starSignFor(assessment.value.sign) : null,
)
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
}
function previousQuestion() {
  answers.value = answers.value.slice(0, -1)
  artReady.value = {}
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
  max-width: 24ch;
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
.scope-choices {
  display: grid;
  gap: clamp(0.25rem, 0.8vh, 0.55rem);
  margin-top: clamp(0.45rem, 1.5vh, 0.9rem);
  width: 100%;
}
.scope-choices button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: clamp(0.3rem, min(0.7cqi, 0.8vh), 0.6rem);
  border: 1px solid #6e8da3;
  border-left: 3px solid #ffd197;
  border-radius: 0.35rem;
  background: #14253bdc;
  text-align: left;
}
.scope-choices button:hover,
.scope-choices button:focus-visible {
  background: #344159;
  border-color: #ffe3b7;
  outline-offset: 3px;
}
.scope-answer-art {
  flex: 0 0 clamp(3.6rem, 8cqi, 6.2rem);
  width: clamp(3.6rem, 8cqi, 6.2rem);
  height: clamp(3.2rem, 7vh, 5.5rem);
  object-fit: cover;
  border-radius: 0.25rem;
  border: 1px solid #b3a188;
}
.scope-choice-copy {
  opacity: 0;
  transition: opacity 200ms ease;
}
.scope-option-ready .scope-choice-copy {
  opacity: 1;
}
.scope-choice-number {
  color: #a7e6e9;
  font:
    800 1.2rem Georgia,
    serif;
}
.scope-choices button > span:nth-child(2) {
  flex: 1;
  display: grid;
  gap: 0.16rem;
}
.scope-choices strong {
  color: #fff5df;
  font-size: clamp(0.76rem, 1.05cqi, 0.94rem);
  line-height: 1.25;
}
.scope-choices small {
  color: #a9c3c6;
  font-size: clamp(0.62rem, 0.8cqi, 0.71rem);
  line-height: 1.25;
}
.scope-choices b {
  color: #ffd59c;
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
.scope-exclusive {
  padding: 0.5rem;
  border-left: 3px solid #8cdde0;
  background: #1a395482;
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
  .scope-choices button {
    padding: 0.52rem;
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
  .scope-choices button {
    padding: 0.32rem;
    gap: 0.35rem;
  }
  .scope-answer-art {
    flex-basis: 3.25rem;
    width: 3.25rem;
    height: 3.6rem;
  }
  .scope-choices strong {
    font-size: 0.74rem;
  }
  .scope-choices small {
    font-size: 0.61rem;
  }
  .scope-footer {
    font-size: 0.56rem;
  }
  .scope-choices {
    width: 100%;
    gap: 0.4rem;
  }
  .scope-footer span:last-child {
    display: none;
  }
}
.scope-large-text .scope-content h2 {
  font-size: clamp(1.75rem, min(3.6cqi, 5.4vh), 3.5rem);
}
.scope-large-text .scope-choices strong,
.scope-large-text .scope-content p {
  font-size: clamp(0.9rem, 1.2cqi, 1.05rem);
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
