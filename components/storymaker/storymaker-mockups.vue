<!-- /components/storymaker/storymaker-mockups.vue -->
<template>
  <section
    :class="[
      'relative flex h-full min-h-0 w-full flex-col overflow-hidden',
      v.shell,
    ]"
  >
    <div
      v-if="v.vignette"
      class="pointer-events-none absolute inset-0 z-0"
      :class="v.vignette"
    />

    <header
      :class="[
        'relative z-20 flex shrink-0 flex-wrap items-center gap-2 px-3 py-2 transition-opacity duration-700',
        v.toolbar,
        lightsDown ? 'opacity-25 hover:opacity-100' : 'opacity-100',
      ]"
    >
      <Icon
        name="kind-icon:story"
        class="size-4 shrink-0"
        :class="v.toolbarIcon"
      />
      <strong class="text-sm" :class="v.toolbarText">Aesthetic mockup</strong>

      <span class="truncate text-xs" :class="v.toolbarMuted">{{
        v.label
      }}</span>

      <div class="flex-1" />

      <button
        type="button"
        class="btn btn-xs rounded-lg"
        :class="lightsDown ? 'btn-primary' : 'btn-ghost opacity-70'"
        title="Dim the chrome while a story is running"
        @click="lightsDown = !lightsDown"
      >
        <Icon name="kind-icon:sparkles" class="size-3" />
        Lights
      </button>
    </header>

    <div
      class="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      :class="v.scrollPad"
    >
      <div :class="['mx-auto flex w-full flex-col', v.column]">
        <figure :class="['relative overflow-hidden', v.plate]">
          <img
            :src="sceneArt"
            alt="The flooded piazza at moonrise"
            class="h-full w-full object-cover"
          />
          <div
            v-if="v.plateScrim"
            class="pointer-events-none absolute inset-0"
            :class="v.plateScrim"
          />

          <figcaption
            v-if="v.plateCaption"
            :class="[
              'absolute bottom-0 left-0 right-0 px-4 py-3',
              v.plateCaption,
            ]"
          >
            <span class="text-xs uppercase tracking-[0.2em] opacity-80"
              >Scene ·</span
            >
            <span class="text-xs opacity-80">
              The flooded piazza, moonrise</span
            >
          </figcaption>
        </figure>

        <div :class="['flex gap-4', v.narrationRow]">
          <div :class="['relative shrink-0', v.portraitWrap]">
            <img
              :src="narratorArt"
              alt="Wren, your narrator"
              :class="['object-cover', v.portrait]"
            />
            <span :class="['absolute whitespace-nowrap', v.expression]">
              {{ expression }}
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <p v-if="v.speakerLabel" :class="v.speakerLabel">Wren</p>

            <div :class="v.narrationBox">
              <p :class="v.narration">
                <span v-if="v.dropCap" :class="v.dropCap">{{
                  narration.charAt(0)
                }}</span
                >{{ v.dropCap ? narration.slice(1) : narration }}
              </p>

              <p :class="v.narrationSecond">{{ narrationSecond }}</p>
            </div>
          </div>
        </div>

        <div :class="v.choicesWrap">
          <p :class="v.choicesLabel">What do you do?</p>

          <div :class="v.choicesGrid">
            <button
              v-for="(choice, index) in choices"
              :key="choice.label"
              type="button"
              :class="['group text-left', v.choice]"
              @click="picked = index"
            >
              <span v-if="v.choiceIndex" :class="v.choiceIndex">{{
                index + 1
              }}</span>
              <span class="min-w-0 flex-1">
                <span :class="v.choiceLabel">{{ choice.label }}</span>
                <span v-if="choice.hint" :class="v.choiceHint">{{
                  choice.hint
                }}</span>
              </span>
              <Icon
                v-if="picked === index"
                name="kind-icon:check-circle"
                class="size-4 shrink-0"
              />
            </button>
          </div>
        </div>

        <div :class="v.inputWrap">
          <input
            v-model="freeText"
            type="text"
            :placeholder="v.placeholder"
            :class="v.input"
          />
          <button type="button" :class="v.send">
            <Icon name="kind-icon:arrow-right" class="size-4" />
            <span :class="v.sendLabel">Tell it</span>
          </button>
        </div>

        <div :class="v.inventoryWrap">
          <span :class="v.inventoryLabel">Carrying</span>
          <span v-for="item in inventory" :key="item.label" :class="v.chip">
            <img
              :src="item.src"
              :alt="item.label"
              class="size-5 rounded object-cover"
            />
            {{ item.label }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/*
 * Disposable Phase 0 mockup for conductor interface-vision/t-001. Fixture data
 * only — no stores, no API, no DB (the sandbox has none). Kept past t-003 as
 * the live reference for the chosen direction.
 *
 * Started life as one structure with three token sets; Storybook won (t-002)
 * and the other two were deleted. What it demonstrates now is the same point
 * from the other side: the layout contract is the structure, the theme is the
 * skin, and this page proves the skin comes entirely from daisyUI semantic
 * tokens — it holds no palette of its own.
 *
 * No <h1> here on purpose — workspace-header already renders the page title.
 */

const IMG =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

const sceneArt = `${IMG}/mermaids-of-venice-hero.webp`
const narratorArt = `${IMG}/storymaker-card.webp`

const lightsDown = ref(false)
const picked = ref<number | null>(null)
const freeText = ref('')

const expression = 'curious'

const narration =
  'The water has been rising since the bells stopped. You know this piazza — you crossed it a hundred times before the flood, when it was only stone and pigeons and the smell of someone frying fish badly. Now the lanterns float at chest height and something is moving beneath them, unhurried, tracing the shape of the old cathedral steps.'

const narrationSecond =
  'She surfaces without a sound. Whatever she is, she has been waiting long enough to be patient about it.'

const choices = [
  {
    label: 'Ask her what the bells meant',
    hint: 'She has been waiting to be asked something.',
  },
  {
    label: 'Offer the lantern from your coat',
    hint: 'It is the only dry thing you have left.',
  },
  {
    label: 'Say nothing and step into the water',
    hint: 'Some answers are not spoken.',
  },
]

const inventory = [
  { label: 'Rainbow butterfly', src: '/rewards/item/rainbow-butterfly.webp' },
  {
    label: 'Thundercloud in a jar',
    src: '/rewards/item/thundercloud-in-a-jar.webp',
  },
]

/*
 * The STORYBOOK token set — the chosen direction (interface-vision t-002).
 *
 * Theater and Playground were deleted rather than kept behind a switcher:
 * Silas, 2026-08-02, "I don't want to build three different layouts, we're
 * already trying to make clear decisions and have VISION."
 *
 * These are now mostly daisyUI semantic tokens rather than the hex values the
 * mockup originally hardcoded. The palette itself lives in ONE place — the
 * `storybook` theme in assets/css/tailwind.css — so this page shows what the
 * real app renders instead of a parallel copy that can drift from it.
 */
const v = {
  label: 'Storybook — a plate tipped into warm paper',
  shell: 'bg-base-200 text-base-content',
  vignette:
    'bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.7),transparent_55%)]',
  toolbar: 'border-b border-base-300 bg-base-200/90 backdrop-blur',
  toolbarIcon: 'text-primary',
  toolbarText: 'font-semibold text-base-content',
  toolbarMuted: 'text-base-content/45',
  scrollPad: 'px-5 py-7 sm:px-10 sm:py-12',
  column: 'max-w-3xl gap-9',
  // The white plate border is the "photo tipped into the page" gesture, so it
  // is base-100 (the raised surface) rather than the paper ground.
  plate:
    'aspect-[3/2] w-full rounded-2xl border-[6px] border-base-100 shadow-[0_18px_44px_-18px_rgba(58,49,40,0.5)]',
  plateScrim: '',
  plateCaption: '',
  narrationRow: 'items-start',
  portraitWrap: '',
  portrait:
    'size-20 rounded-full border-[5px] border-base-100 object-top shadow-[0_8px_20px_-8px_rgba(58,49,40,0.55)] sm:size-24',
  expression:
    '-bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-semibold lowercase text-primary-content',
  speakerLabel: 'mb-1 text-lg font-bold text-primary',
  narrationBox: 'space-y-4',
  // .kr-prose carries the 65ch measure and 1.8 leading; body type is already
  // serif from the base layer, so neither is restated here.
  narrationSecond: 'kr-prose italic text-base-content/75 sm:text-lg',
  narration: 'kr-prose text-[1.0625rem] text-base-content sm:text-lg',
  dropCap: 'kr-dropcap',
  choicesWrap: 'space-y-3',
  choicesLabel: 'text-base font-bold text-base-content/70',
  choicesGrid: 'flex flex-col gap-2.5',
  choice:
    'flex items-center gap-3 rounded-xl border-2 border-base-300 bg-base-100 px-4 py-3 shadow-[0_3px_0_0_rgba(58,49,40,0.1)] transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_6px_0_0_rgba(180,101,58,0.25)]',
  choiceIndex:
    'grid size-7 shrink-0 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary',
  choiceLabel: 'block text-base font-semibold text-base-content',
  choiceHint: 'mt-0.5 block text-sm italic text-base-content/55',
  inputWrap: 'flex items-center gap-2',
  input:
    'min-w-0 flex-1 rounded-xl border-2 border-base-300 bg-base-100 px-4 py-2.5 text-base text-base-content placeholder:text-base-content/35 focus:border-primary/50 focus:outline-none',
  placeholder: 'or write your own…',
  send: 'flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-content shadow-[0_3px_0_0_rgba(140,76,42,1)] transition hover:-translate-y-0.5',
  sendLabel: '',
  inventoryWrap: 'flex flex-wrap items-center gap-2',
  inventoryLabel: 'text-sm font-bold text-base-content/50',
  chip: 'flex items-center gap-1.5 rounded-full border-2 border-base-300 bg-base-100 px-2.5 py-1 text-sm text-base-content/75',
}


</script>
