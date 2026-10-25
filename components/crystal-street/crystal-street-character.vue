<template>
  <article
    class="cs-card overflow-hidden"
    :class="compact ? '' : '@3xl:grid @3xl:grid-cols-[minmax(0,2fr)_3fr]'"
    data-testid="cs-character"
  >
    <div class="relative bg-black">
      <img
        :key="portrait"
        :src="portrait"
        :alt="character?.art ?? look?.art ?? ''"
        class="w-full object-cover object-top"
        :class="compact ? 'aspect-[3/4] max-h-80' : 'aspect-[2/3]'"
        @error="portraitFailed = true"
      />
      <span
        v-if="synergy"
        class="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
        :class="
          synergy.typecast
            ? 'bg-accent text-accent-content'
            : 'bg-secondary text-secondary-content'
        "
        data-testid="cs-synergy"
        >{{ synergy.typecast ? 'Typecast' : 'Against type' }}</span
      >
    </div>
    <div class="space-y-2 p-3">
      <p class="cs-kicker">{{ look?.name }} · {{ clique?.name }}</p>
      <h3
        class="cs-display text-2xl leading-tight"
        data-testid="cs-character-title"
      >
        {{ character?.title ?? clique?.name }}
      </h3>
      <p v-if="name" class="text-sm font-semibold">
        {{ name
        }}<span v-if="pronouns" class="opacity-70"> · {{ pronouns }}</span>
      </p>
      <p v-if="character" class="text-sm italic opacity-85">
        {{ character.tagline }}
      </p>
      <ul
        v-if="synergy"
        class="flex flex-wrap gap-1"
        aria-label="Style bonuses"
      >
        <li
          v-for="b in synergy.bonuses"
          :key="b.style"
          class="rounded-full border border-primary/40 px-2 py-0.5 text-[11px] font-semibold"
        >
          {{ STYLE_LABELS[b.style] }} +{{ b.amount }}
          <span class="opacity-70">· {{ b.why }}</span>
        </li>
      </ul>
      <p v-if="synergy" class="text-xs leading-snug opacity-75">
        {{
          synergy.typecast
            ? `Your look and your clique both play it ${STYLE_LABELS[look!.style].toLowerCase()}, so you double down on it.`
            : `Nobody expects ${STYLE_LABELS[look!.style].toLowerCase()} from ${clique!.name.toLowerCase()}: you add the clique's ${STYLE_LABELS[clique!.style].toLowerCase()} side too.`
        }}
        Style bonuses add to every choice played that way.
      </p>
      <p v-if="character && !compact" class="text-sm leading-relaxed">
        {{ character.bio }}
      </p>
      <p v-if="character" class="cs-quote text-sm">
        “{{ character.catchphrase }}”
      </p>
      <dl
        v-if="clique"
        class="grid grid-cols-3 gap-1 text-center text-[11px]"
        aria-label="Starting skills"
      >
        <div
          v-for="(label, key) in SKILL_LABELS"
          :key="key"
          class="rounded-lg bg-base-content/5 px-1 py-1"
        >
          <dt class="opacity-70">{{ label }}</dt>
          <dd class="text-base font-black">
            {{ (skills ?? clique.skills)[key] }}
          </dd>
        </div>
      </dl>
      <details v-if="character && compact" class="text-sm">
        <summary class="cursor-pointer font-semibold">Their story</summary>
        <p class="mt-1 leading-relaxed">{{ character.bio }}</p>
      </details>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  SKILL_LABELS,
  STYLE_LABELS,
  archetypeById,
  avatarById,
  characterFor,
  synergyOf,
} from '~/utils/crystalStreet/rules'
import type { Skill } from '~/utils/crystalStreet/types'

const props = defineProps<{
  avatar: string | null | undefined
  archetype: string
  name?: string
  pronouns?: string
  /** The run's live skills; the clique's starting skills otherwise. */
  skills?: Record<Skill, number>
  compact?: boolean
}>()

const look = computed(() => avatarById(props.avatar ?? ''))
const clique = computed(() => archetypeById(props.archetype))
const character = computed(() => characterFor(props.avatar, props.archetype))
const synergy = computed(() => synergyOf(props.avatar, props.archetype))

// The character's own portrait, falling back to the look until it is painted.
const portraitFailed = ref(false)
watch(character, () => (portraitFailed.value = false))
const portrait = computed(() =>
  character.value && !portraitFailed.value
    ? `/crystal-street/characters/${character.value.id}.webp`
    : `/crystal-street/avatars/${props.avatar}.webp`,
)
</script>
