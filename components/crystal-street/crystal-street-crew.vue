<template>
  <section
    class="kr-panes grid-cols-1 gap-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
    aria-label="Your crew"
  >
    <div class="kr-pane cs-frame">
      <div class="kr-toolbar px-3 pt-3">
        <h2 class="cs-display text-xl">
          {{
            run
              ? `Crew ${run.crew.length}/${CREW_LIMIT}`
              : 'Friends of Crystal Street'
          }}
        </h2>
        <div class="join ml-auto">
          <button
            v-for="f in ['portrait', 'poster'] as const"
            :key="f"
            type="button"
            class="btn join-item btn-xs"
            :class="format === f ? 'btn-primary' : 'btn-ghost'"
            @click="format = f"
          >
            {{ f === 'portrait' ? 'Portraits' : 'Posters' }}
          </button>
        </div>
      </div>
      <div class="kr-pane-scroll p-3">
        <ul class="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">
          <li v-for="c in friends" :key="c.id">
            <button
              type="button"
              class="cs-card w-full text-left"
              :class="[
                selected === c.id ? 'ring-2 ring-primary' : '',
                inCrew(c.id) || !run ? '' : 'opacity-60',
              ]"
              @click="selected = c.id"
            >
              <crystal-street-portrait
                :companion="c"
                :emotion="
                  run && inCrew(c.id) ? emotionOf(run, c.id) : 'neutral'
                "
                :format="format"
                :frame="format === 'poster' ? 'aspect-[2/3]' : 'aspect-[4/5]'"
                :shaken="!!run?.shaken.includes(c.id as CompanionId)"
              />
              <span class="mt-1 block truncate text-sm font-semibold">{{
                c.name
              }}</span>
              <span
                class="block truncate text-[11px] uppercase tracking-wider opacity-70"
                >{{
                  inCrew(c.id)
                    ? run?.shaken.includes(c.id as CompanionId)
                      ? 'Shaken till dawn'
                      : 'In your crew'
                    : met(c.id)
                      ? 'Went home'
                      : locationById(c.location)?.name
                }}</span
              >
            </button>
          </li>
        </ul>
      </div>
    </div>

    <aside v-if="focus" class="kr-pane cs-frame">
      <div class="kr-pane-scroll space-y-3 p-3">
        <crystal-street-portrait
          class="mx-auto w-full max-w-60"
          :companion="focus"
          :emotion="focusEmotion"
          :format="format"
          :frame="format === 'poster' ? 'aspect-[2/3]' : 'aspect-[4/5]'"
        />
        <div>
          <h3 class="cs-display text-xl leading-tight">{{ focus.name }}</h3>
          <p class="text-[11px] uppercase tracking-wider opacity-70">
            {{ focus.pronouns }} · {{ focus.age }} · {{ focus.role }}
          </p>
        </div>
        <p class="cs-quote">“{{ focus.emotions[focusEmotion].line }}”</p>
        <div class="flex flex-wrap gap-1" role="group" aria-label="Moods">
          <button
            v-for="e in EMOTIONS"
            :key="e"
            type="button"
            class="cs-pill"
            :class="focusEmotion === e ? 'cs-pill-good' : ''"
            @click="previewEmotion = e"
          >
            {{ e }}
          </button>
        </div>
        <p class="text-sm leading-relaxed">{{ focus.bio }}</p>
        <p class="text-sm">
          <strong>{{ focus.perk.name }}.</strong> {{ focus.perk.text }}
        </p>
        <p class="text-xs uppercase tracking-wider opacity-75">
          Helps with {{ focus.skills.map((s) => SKILL_LABELS[s]).join(' & ') }}
        </p>
        <button
          v-if="inCrew(focus.id)"
          type="button"
          class="btn btn-sm btn-outline rounded-2xl"
          :disabled="!!run?.pending"
          @click="store.dismiss(focus.id as CompanionId)"
        >
          Send {{ shortName(focus.name) }} home for now
        </button>
      </div>
    </aside>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import {
  COMPANIONS,
  CREW_LIMIT,
  SKILL_LABELS,
  companionById,
  emotionOf,
  locationById,
  shortName,
} from '~/utils/crystalStreet/rules'
import { EMOTIONS, type Emotion } from '~/utils/crystalStreet/types'
import type { CompanionId } from '~/utils/crystalStreet/ids'

// roster: browse every friend from the main menu, outside any week.
const props = defineProps<{ roster?: boolean }>()
const store = useCrystalStreetStore()
const run = computed(() => (props.roster ? null : store.run))
const format = ref<'portrait' | 'poster'>('portrait')
const selected = ref<string>(run.value?.crew[0] ?? COMPANIONS[0]!.id)
const previewEmotion = ref<Emotion | null>(null)
watch(selected, () => (previewEmotion.value = null))

const inCrew = (id: string) => !!run.value?.crew.includes(id as CompanionId)
const met = (id: string) => !!run.value?.flags.includes(`recruit:${id}`)
const friends = computed(() =>
  [...COMPANIONS].sort(
    (a, b) =>
      Number(inCrew(b.id)) - Number(inCrew(a.id)) ||
      Number(met(b.id)) - Number(met(a.id)),
  ),
)
const focus = computed(() => companionById(selected.value))
const focusEmotion = computed<Emotion>(
  () =>
    previewEmotion.value ??
    (run.value && focus.value && inCrew(focus.value.id)
      ? emotionOf(run.value, focus.value.id)
      : 'neutral'),
)
</script>
