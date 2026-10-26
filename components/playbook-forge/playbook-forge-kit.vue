<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <PlaybookKitShell :spec="spec" :meter-values="meters">
      <div class="@container p-2 @lg:p-3">
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))] items-start gap-3"
        >
          <section class="pf-panel overflow-hidden" aria-label="Stage">
            <button
              type="button"
              class="group relative block aspect-video w-full overflow-hidden"
              title="Play the trailer"
              @click="kit.playTrailer()"
            >
              <PlaybookKitArt
                :art="spec.keyArt"
                tone="primary"
                icon="kind-icon:sparkles"
                class="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
              />
              <span
                class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"
              />
              <span
                class="absolute inset-x-3 top-3 flex items-center gap-2 text-white"
              >
                <span class="badge badge-primary badge-sm">{{
                  TIER_INFO[spec.tier].label
                }}</span>
                <span
                  class="text-[10px] uppercase tracking-[.2em] text-white/80"
                  >{{ spec.trailer.tagline }}</span
                >
              </span>
              <span
                class="absolute bottom-3 left-3 flex items-center gap-2 text-white"
              >
                <span
                  class="grid size-10 place-items-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-primary"
                >
                  <Icon name="kind-icon:play" class="size-5" />
                </span>
                <span class="text-left text-sm font-semibold"
                  >Watch the trailer</span
                >
              </span>
            </button>
            <div class="flex flex-col gap-3 p-3">
              <label
                v-if="KIT_PLAYBOOKS.length > 1"
                class="flex items-center gap-2 text-xs font-semibold"
              >
                Playbook
                <select
                  v-model="selected"
                  class="pf-field select-sm flex-1 py-1"
                >
                  <option
                    v-for="entry in KIT_PLAYBOOKS"
                    :key="entry.id"
                    :value="entry.id"
                  >
                    {{ entry.title }} · {{ TIER_INFO[entry.tier].label }}
                  </option>
                </select>
              </label>
              <p class="pk-prose">{{ spec.premise }}</p>
              <ol class="flex flex-wrap gap-1.5">
                <li
                  v-for="act in spec.acts"
                  :key="act.id"
                  class="pf-kicker border border-base-content/15 px-2 py-1 text-[0.6rem]"
                  :title="act.blurb"
                >
                  <span class="font-bold">Act {{ act.id }}</span> ·
                  {{ act.title }}
                </li>
              </ol>
              <div class="pf-help flex flex-col gap-2">
                <span class="pf-kicker opacity-70">Rehearse a run</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    data-nav
                    class="pf-label btn btn-sm btn-ghost pf-focusable"
                    :disabled="!nextMoment"
                    @click="live('moments', nextMoment)"
                  >
                    <Icon name="kind-icon:camera" class="size-4" />
                    Live a moment
                  </button>
                  <button
                    type="button"
                    data-nav
                    class="pf-label btn btn-sm btn-ghost pf-focusable"
                    :disabled="!nextReveal"
                    @click="live('reveals', nextReveal)"
                  >
                    <Icon name="kind-icon:eye" class="size-4" />
                    Uncover a secret
                  </button>
                  <button
                    type="button"
                    data-nav
                    class="pf-label btn btn-sm btn-ghost pf-focusable"
                    :disabled="!nextEnding"
                    @click="live('endings', nextEnding)"
                  >
                    <Icon name="kind-icon:star" class="size-4" />
                    Reach an ending
                  </button>
                </div>
                <ul v-if="spec.meters.length" class="flex flex-col gap-1">
                  <li
                    v-for="meter in spec.meters"
                    :key="meter.id"
                    class="flex items-center gap-2 text-xs"
                  >
                    <span class="w-28 truncate">{{ meter.label }}</span>
                    <input
                      type="range"
                      class="range range-xs range-primary flex-1"
                      :min="meter.min"
                      :max="meter.max"
                      :value="meters[meter.id] ?? meter.start"
                      :aria-label="meter.label"
                      @input="setMeter(meter.id, $event)"
                    />
                    <span class="w-6 text-right font-bold tabular-nums">{{
                      meters[meter.id] ?? meter.start
                    }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section class="pf-panel p-4" aria-label="Complexity budget">
            <PlaybookKitBudget :spec="spec" />
          </section>
        </div>
      </div>
    </PlaybookKitShell>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import {
  usePlaybookKitStore,
  type KitPane,
  type KitUnlockKind,
} from '~/stores/playbookKitStore'
import { TIER_INFO } from '~/utils/playbookKit/budget'
import { KIT_PLAYBOOKS, kitPlaybook } from '~/utils/playbookKit/games'
import { visibleMoments } from '~/utils/playbookKit/view'

// The Playbook Kit console, hosted by the Forge (conductor playbook-kit
// t-001): rehearse a kit game's moments, reveals and endings against its
// settings, meters and complexity budget.
const kit = usePlaybookKitStore()
const forge = usePlaybookForgeStore()
const selected = computed({
  get: () => kitPlaybook(forge.kitId)?.id ?? KIT_PLAYBOOKS[0]!.id,
  set: (id: string) => forge.openKit(id),
})
const spec = computed(() => kitPlaybook(selected.value) ?? KIT_PLAYBOOKS[0]!)
const meters = ref<Record<string, number>>({})

watch(selected, () => (meters.value = {}))

const nextMoment = computed(
  () =>
    visibleMoments(spec.value, kit.settings).find(
      (m) => !kit.isUnlocked('moments', m.id),
    )?.id,
)
const nextReveal = computed(
  () => spec.value.reveals.find((r) => !kit.isUnlocked('reveals', r.id))?.id,
)
const nextEnding = computed(
  () => spec.value.endings.find((e) => !kit.isUnlocked('endings', e.id))?.id,
)

const PANE_FOR: Record<KitUnlockKind, KitPane> = {
  moments: 'scrapbook',
  reveals: 'secrets',
  endings: 'endings',
}

function live(kind: KitUnlockKind, id: string | undefined) {
  if (!id) return
  kit.unlock(kind, id)
  kit.openPane(PANE_FOR[kind])
}

function setMeter(id: string, event: Event) {
  meters.value = {
    ...meters.value,
    [id]: Number((event.target as HTMLInputElement).value),
  }
}
</script>
