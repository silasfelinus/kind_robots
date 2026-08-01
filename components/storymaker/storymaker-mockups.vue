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

      <div class="flex gap-1">
        <button
          v-for="option in variants"
          :key="option.key"
          type="button"
          class="btn btn-xs rounded-lg px-2"
          :class="
            variant === option.key ? 'btn-primary' : 'btn-ghost opacity-70'
          "
          :title="option.label"
          @click="variant = option.key"
        >
          {{ option.key.toUpperCase() }}
        </button>
      </div>

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
 * only — no stores, no API, no DB (the sandbox has none). Deleted in t-003 once
 * Silas has picked a direction.
 *
 * ONE structure, THREE token sets. The six elements appear in the same order in
 * every variant so the comparison is fair, and so the point lands: the layout
 * contract is the structure, the aesthetic is the skin. Class maps follow the
 * house idiom from conductor-project-gallery-page.vue.
 *
 * No <h1> here on purpose — workspace-header already renders the page title.
 */

const IMG =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

const sceneArt = `${IMG}/mermaids-of-venice-hero.webp`
const narratorArt = `${IMG}/storymaker-card.webp`

type VariantKey = 'a' | 'b' | 'c'

const variant = ref<VariantKey>('a')
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

const variants = [
  { key: 'a' as const, label: 'Theater — a lit stage in a dark house' },
  { key: 'b' as const, label: 'Storybook — a plate tipped into warm paper' },
  {
    key: 'c' as const,
    label: 'Playground — bright, chunky, unmistakably friendly',
  },
]

const TOKENS: Record<VariantKey, Record<string, string>> = {
  /* ── A · THEATER ────────────────────────────────────────────────────────
   * Dark house, one lit stage. The art is the performer; chrome recedes to
   * near-invisible. Narration reads as surtitles beneath the stage: serif,
   * wide leading, warm cream. Choices are understated until you approach them.
   */
  a: {
    label: 'Theater — a lit stage in a dark house',
    shell: 'bg-[#0b0b0f] text-[#e8e2d6]',
    vignette:
      'bg-[radial-gradient(ellipse_at_50%_28%,rgba(255,190,110,0.16),transparent_58%)]',
    toolbar: 'border-b border-white/8 bg-black/40 backdrop-blur',
    toolbarIcon: 'text-amber-300/80',
    toolbarText: 'font-semibold tracking-wide text-[#e8e2d6]',
    toolbarMuted: 'text-[#e8e2d6]/40',
    scrollPad: 'px-4 py-6 sm:px-8 sm:py-10',
    column: 'max-w-4xl gap-8',
    plate:
      'aspect-video w-full rounded-sm shadow-[0_0_80px_-12px_rgba(255,180,90,0.35)] ring-1 ring-amber-200/15',
    plateScrim:
      'bg-[linear-gradient(to_top,rgba(11,11,15,0.92),rgba(11,11,15,0.12)_45%,transparent_70%)]',
    plateCaption: 'text-[#e8e2d6]',
    narrationRow: 'items-start',
    portraitWrap: '',
    portrait:
      'h-28 w-20 rounded-sm object-top ring-1 ring-amber-200/25 shadow-[0_10px_30px_-10px_rgba(255,180,90,0.5)] sm:h-36 sm:w-24',
    expression:
      '-bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-amber-200/30 bg-[#0b0b0f] px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.15em] text-amber-200/90',
    speakerLabel:
      'mb-2 text-[0.65rem] uppercase tracking-[0.3em] text-amber-200/60',
    narrationBox: 'space-y-4',
    narration:
      'font-serif text-lg leading-[1.85] text-[#e8e2d6]/92 sm:text-xl sm:leading-[1.9]',
    narrationSecond:
      'font-serif text-lg italic leading-[1.85] text-amber-100/70 sm:text-xl',
    dropCap: '',
    choicesWrap: 'space-y-3',
    choicesLabel: 'text-[0.65rem] uppercase tracking-[0.3em] text-[#e8e2d6]/35',
    choicesGrid: 'flex flex-col gap-2',
    choice:
      'flex items-center gap-3 rounded-sm border border-white/10 bg-white/[0.02] px-4 py-3 transition duration-300 hover:border-amber-200/45 hover:bg-amber-100/[0.06] hover:shadow-[0_0_28px_-8px_rgba(255,190,110,0.45)]',
    choiceIndex:
      'grid size-6 shrink-0 place-items-center rounded-full border border-white/15 font-serif text-xs text-amber-200/70',
    choiceLabel: 'block font-serif text-base text-[#e8e2d6]',
    choiceHint: 'mt-0.5 block text-xs italic text-[#e8e2d6]/40',
    inputWrap: 'flex items-center gap-2 border-t border-white/10 pt-4',
    input:
      'min-w-0 flex-1 border-0 border-b border-white/15 bg-transparent px-1 pb-2 font-serif text-base text-[#e8e2d6] placeholder:text-[#e8e2d6]/25 focus:border-amber-200/50 focus:outline-none',
    placeholder: 'or say something of your own…',
    send: 'flex shrink-0 items-center gap-1.5 rounded-sm border border-amber-200/30 px-3 py-1.5 text-sm text-amber-200/90 transition hover:bg-amber-100/10',
    sendLabel: 'font-serif',
    inventoryWrap: 'flex flex-wrap items-center gap-2 pt-2',
    inventoryLabel:
      'text-[0.6rem] uppercase tracking-[0.25em] text-[#e8e2d6]/30',
    chip: 'flex items-center gap-1.5 rounded-sm border border-white/10 px-2 py-1 text-xs text-[#e8e2d6]/70',
  },

  /* ── B · STORYBOOK ──────────────────────────────────────────────────────
   * Warm paper, generous margins, the art tipped in like a printed plate.
   * Drop cap, display serif, ragged-right measure held near 65ch so it reads
   * like a page rather than a panel. Buttons are ribbon tabs.
   */
  b: {
    label: 'Storybook — a plate tipped into warm paper',
    shell: 'bg-[#f7f1e3] text-[#3a3128]',
    vignette:
      'bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.7),transparent_55%)]',
    toolbar: 'border-b border-[#3a3128]/12 bg-[#f7f1e3]/90 backdrop-blur',
    toolbarIcon: 'text-[#b4653a]',
    toolbarText: 'font-semibold text-[#3a3128]',
    toolbarMuted: 'text-[#3a3128]/45',
    scrollPad: 'px-5 py-7 sm:px-10 sm:py-12',
    column: 'max-w-3xl gap-9',
    plate:
      'aspect-[3/2] w-full rounded-2xl border-[6px] border-white shadow-[0_18px_44px_-18px_rgba(58,49,40,0.5)]',
    plateScrim: '',
    plateCaption: '',
    narrationRow: 'items-start',
    portraitWrap: '',
    portrait:
      'size-20 rounded-full border-[5px] border-white object-top shadow-[0_8px_20px_-8px_rgba(58,49,40,0.55)] sm:size-24',
    expression:
      '-bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[#b4653a] px-2 py-0.5 text-[0.6rem] font-semibold lowercase text-[#f7f1e3]',
    speakerLabel: 'mb-1 font-serif text-lg font-bold text-[#b4653a]',
    narrationBox: 'space-y-4',
    narration:
      'max-w-[65ch] font-serif text-[1.0625rem] leading-[1.8] text-[#3a3128] sm:text-lg sm:leading-[1.85]',
    narrationSecond:
      'max-w-[65ch] font-serif text-[1.0625rem] italic leading-[1.8] text-[#3a3128]/75 sm:text-lg',
    dropCap:
      'float-left mr-2 mt-1 font-serif text-[3.25rem] font-bold leading-[0.8] text-[#b4653a]',
    choicesWrap: 'space-y-3',
    choicesLabel: 'font-serif text-base font-bold text-[#3a3128]/70',
    choicesGrid: 'flex flex-col gap-2.5',
    choice:
      'flex items-center gap-3 rounded-xl border-2 border-[#3a3128]/12 bg-white px-4 py-3 shadow-[0_3px_0_0_rgba(58,49,40,0.1)] transition hover:-translate-y-0.5 hover:border-[#b4653a]/50 hover:shadow-[0_6px_0_0_rgba(180,101,58,0.25)]',
    choiceIndex:
      'grid size-7 shrink-0 place-items-center rounded-full bg-[#b4653a]/12 font-serif text-sm font-bold text-[#b4653a]',
    choiceLabel: 'block font-serif text-base font-semibold text-[#3a3128]',
    choiceHint: 'mt-0.5 block font-serif text-sm italic text-[#3a3128]/55',
    inputWrap: 'flex items-center gap-2',
    input:
      'min-w-0 flex-1 rounded-xl border-2 border-[#3a3128]/15 bg-white px-4 py-2.5 font-serif text-base text-[#3a3128] placeholder:text-[#3a3128]/35 focus:border-[#b4653a]/50 focus:outline-none',
    placeholder: 'or write your own…',
    send: 'flex shrink-0 items-center gap-1.5 rounded-xl bg-[#b4653a] px-4 py-2.5 text-sm font-bold text-[#f7f1e3] shadow-[0_3px_0_0_rgba(140,76,42,1)] transition hover:-translate-y-0.5',
    sendLabel: 'font-serif',
    inventoryWrap: 'flex flex-wrap items-center gap-2',
    inventoryLabel: 'font-serif text-sm font-bold text-[#3a3128]/50',
    chip: 'flex items-center gap-1.5 rounded-full border-2 border-[#3a3128]/12 bg-white px-2.5 py-1 font-serif text-sm text-[#3a3128]/75',
  },

  /* ── C · PLAYGROUND ─────────────────────────────────────────────────────
   * Native daisyUI tokens so it inherits whatever theme the user picked.
   * Chunky, saturated, unmistakably friendly and non-threatening. Everything
   * is a big obvious target — the most accessible of the three on touch.
   */
  c: {
    label: 'Playground — bright, chunky, unmistakably friendly',
    shell: 'bg-base-200 text-base-content',
    vignette: '',
    toolbar: 'border-b-2 border-base-300 bg-base-100',
    toolbarIcon: 'text-primary',
    toolbarText: 'font-black text-base-content',
    toolbarMuted: 'text-base-content/50',
    scrollPad: 'px-4 py-5 sm:px-6 sm:py-7',
    column: 'max-w-5xl gap-5',
    plate:
      'aspect-video w-full rounded-3xl border-4 border-primary/25 shadow-lg',
    plateScrim: 'bg-[linear-gradient(to_top,rgba(0,0,0,0.35),transparent_45%)]',
    plateCaption: 'text-white',
    narrationRow: 'items-start',
    portraitWrap: '',
    portrait:
      'size-20 rounded-2xl border-4 border-secondary/40 object-top shadow-md sm:size-24',
    expression:
      '-bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-2.5 py-0.5 text-[0.65rem] font-black uppercase text-secondary-content shadow',
    speakerLabel:
      'mb-1.5 text-sm font-black uppercase tracking-wide text-secondary',
    narrationBox:
      'space-y-3 rounded-2xl border-l-8 border-primary bg-base-100 p-4 shadow-sm sm:p-5',
    narration: 'text-base leading-relaxed text-base-content sm:text-lg',
    narrationSecond:
      'text-base font-semibold leading-relaxed text-primary sm:text-lg',
    dropCap: '',
    choicesWrap: 'space-y-2.5',
    choicesLabel:
      'text-sm font-black uppercase tracking-wide text-base-content/60',
    choicesGrid: 'grid gap-2.5 md:grid-cols-3',
    choice:
      'flex items-start gap-2.5 rounded-2xl border-4 border-base-300 bg-base-100 p-3.5 transition hover:-translate-y-1 hover:border-primary hover:shadow-lg',
    choiceIndex:
      'grid size-7 shrink-0 place-items-center rounded-xl bg-primary text-sm font-black text-primary-content',
    choiceLabel: 'block font-bold leading-snug text-base-content',
    choiceHint: 'mt-1 block text-xs text-base-content/55',
    inputWrap: 'flex items-center gap-2',
    input: 'input input-bordered min-w-0 flex-1 rounded-2xl border-2 text-base',
    placeholder: 'Or type your own idea…',
    send: 'btn btn-primary flex shrink-0 items-center gap-1.5 rounded-2xl border-2',
    sendLabel: 'font-black',
    inventoryWrap: 'flex flex-wrap items-center gap-2',
    inventoryLabel:
      'text-xs font-black uppercase tracking-wide text-base-content/45',
    chip: 'flex items-center gap-1.5 rounded-full border-2 border-base-300 bg-base-100 px-2.5 py-1 text-sm font-semibold',
  },
}

const v = computed(() => TOKENS[variant.value])
</script>
