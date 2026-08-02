<!-- /components/narrative/kr-chat-window.vue -->
<!--
  The scrolling message list, shared by every conversational surface.

  Two implementations of this existed: narrative-transcript.vue (Storybook,
  Taskmaster) and workspace-narrator.vue's `seededMessages` loop (Dreams). They
  disagreed on everything cosmetic and agreed on the substance — a list of
  turns, a speaker, an optional portrait, an optional set of follow-up choices,
  and a streaming placeholder while the model is still writing.

  SCROLL OWNERSHIP (interface-vision t-003/t-004): this component owns exactly
  ONE scroll region and nothing inside it scrolls. That is why the layout
  contract's `one-scroll` count should fall as surfaces adopt it — the surfaces
  it replaces each declared several. Give it a bounded height from the parent;
  it will not grow the page.

  Purely presentational. Streaming state, sending and choice handling all belong
  to the caller, so this drops into a narrator stage, a slide-out dock, or a bot
  chat without dragging a store with it.
-->
<template>
  <!--
    A <section> with an accessible name, NOT role="log".

    role="log" carries an implicit aria-live="polite", which would make the
    whole transcript a live region on top of the explicit sr-only status below
    — every arriving turn announced twice, once verbatim and once as a summary.
    narrative-transcript.vue learned this the hard way and its contract still
    asserts "the entire streaming transcript must not be a live region"; the
    single sr-only status region stays the only announcement channel.
  -->
  <section
    ref="scrollEl"
    class="kr-scroll flex flex-col gap-4"
    :aria-label="label"
    :aria-busy="isStreaming"
  >
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ statusAnnouncement }}
    </p>

    <div
      v-if="!turns.length && !isStreaming"
      class="rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-5 text-center text-sm text-base-content/50"
    >
      {{ emptyLabel }}
    </div>

    <article
      v-for="(turn, index) in turns"
      :key="turn.id"
      :class="['flex gap-2', turn.from === 'user' ? 'flex-row-reverse' : '']"
      :aria-labelledby="turnHeadingId(index)"
    >
      <!-- Narrator turns are numbered scenes; the reader's own turns are named
           rather than numbered, so a screen reader walking the headings hears
           the shape of the conversation instead of a run of ordinals. The
           scene number counts narrator turns only — index would drift by one
           per answer and call the third scene "Scene 5". -->
      <h3 :id="turnHeadingId(index)" class="sr-only">
        {{
          turn.from === 'user'
            ? 'Your response'
            : `Scene ${narratorTurnNumber(index)}`
        }}
      </h3>

      <img
        v-if="turn.portrait && turn.from !== 'user'"
        :src="turn.portrait"
        :alt="turn.speaker || 'Narrator'"
        class="size-8 shrink-0 rounded-full border border-base-300 bg-base-300 object-cover"
        loading="lazy"
      />

      <div
        :class="[
          'min-w-0 max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          turn.from === 'user'
            ? 'rounded-br-sm border border-secondary/30 bg-secondary/10'
            : 'rounded-bl-sm border border-base-300 bg-base-100 shadow-sm',
        ]"
      >
        <p
          v-if="turn.speaker && turn.from !== 'user'"
          class="text-[0.65rem] font-black uppercase tracking-wide text-primary/70"
        >
          {{ turn.speaker }}
        </p>

        <p
          :class="[
            'whitespace-pre-wrap text-base-content/85',
            turn.speaker && turn.from !== 'user' ? 'mt-1' : '',
            prose ? 'kr-prose' : '',
          ]"
        >
          {{ turn.text }}
        </p>

        <kr-choice-list
          v-if="turn.choices?.length"
          class="mt-3"
          layout="row"
          :choices="turn.choices"
          :disabled="isStreaming"
          :show-index="false"
          @select="emit('choose', $event, turn)"
        />

        <slot name="after-turn" :turn="turn" :index="index" />
      </div>
    </article>

    <div
      v-if="isStreaming"
      class="whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-dashed border-secondary/40 bg-base-200/40 px-4 py-3 text-sm leading-relaxed"
      aria-hidden="true"
    >
      <template v-if="visibleStreamingText">{{ visibleStreamingText }}</template>
      <span v-else class="flex items-center gap-2 text-base-content/60">
        <span
          class="loading loading-dots loading-sm motion-reduce:hidden"
          aria-hidden="true"
        />
        {{ streamingLabel }}
      </span>
    </div>

    <!-- Trailing content that belongs to the conversation rather than to any
         one turn, and must scroll WITH it: Taskmaster's quest ledger and
         completion recap, Dreams' musings. Without this the caller has to put
         them in a sibling element, which means a second scroll region — the
         exact thing this component exists to remove. -->
    <slot name="footer" />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import type { NarrativeChoice } from './kr-choice-list.vue'

export type NarrativeTurn = {
  id: string
  text: string
  /** 'narrator' renders left with a portrait; 'user' renders right. */
  from?: 'narrator' | 'user'
  speaker?: string
  portrait?: string | null
  choices?: NarrativeChoice[]
}

const props = withDefaults(
  defineProps<{
    turns: NarrativeTurn[]
    isStreaming?: boolean
    streamingText?: string
    streamingLabel?: string
    emptyLabel?: string
    label?: string
    /** Apply the 65ch reading measure. On for narration, off for chat chatter. */
    prose?: boolean
    autoScroll?: boolean
  }>(),
  {
    isStreaming: false,
    streamingText: '',
    streamingLabel: 'The narrator is building the next scene…',
    emptyLabel: 'The story will appear here once it begins.',
    label: 'Conversation',
    prose: true,
    autoScroll: true,
  },
)

const emit = defineEmits<{
  choose: [choice: NarrativeChoice, turn: NarrativeTurn]
}>()

const windowId = useId()
const scrollEl = ref<HTMLElement | null>(null)

/*
 * Hide the machine-readable state block while it is still arriving.
 *
 * Carried over from narrative-transcript.vue: the model emits a [STORY_STATE]
 * marker after the prose, and mid-stream the reader would otherwise watch a
 * half-typed `[STORY_ST` appear and disappear. Also trims a partial line that
 * is a prefix of the marker, which is the case the naive indexOf misses.
 */
const visibleStreamingText = computed(() => {
  const text = props.streamingText
  const marker = '[STORY_STATE]'
  const markerIndex = text.indexOf(marker)
  if (markerIndex >= 0) return text.slice(0, markerIndex).trimEnd()

  const lastLineBreak = text.lastIndexOf('\n')
  const partialLine = text.slice(lastLineBreak + 1).trim()
  if (partialLine.startsWith('[') && marker.startsWith(partialLine)) {
    return text.slice(0, Math.max(0, lastLineBreak)).trimEnd()
  }
  return text
})

const statusAnnouncement = computed(() => {
  if (props.isStreaming) return props.streamingLabel
  if (props.turns.length) {
    return `${props.turns.length} message${
      props.turns.length === 1 ? '' : 's'
    }. Continue to the response field when you are ready.`
  }
  return props.emptyLabel
})

function turnHeadingId(index: number): string {
  return `${windowId}-turn-${index + 1}`
}

/** 1-based position of this turn among the narrator's turns only. */
function narratorTurnNumber(index: number): number {
  let count = 0
  for (let i = 0; i <= index; i += 1) {
    if (props.turns[i]?.from !== 'user') count += 1
  }
  return count
}

// Follow the conversation as it grows. Guarded on autoScroll so a surface that
// wants the reader to stay put (reviewing an old scene) can opt out.
watch(
  () => [props.turns.length, props.streamingText],
  async () => {
    if (!props.autoScroll) return
    await nextTick()
    const el = scrollEl.value
    if (el) el.scrollTop = el.scrollHeight
  },
)
</script>
