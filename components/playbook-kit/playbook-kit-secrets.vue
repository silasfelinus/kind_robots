<template>
  <div class="flex flex-col gap-4">
    <section v-for="act in acts" :key="act.id" class="flex flex-col gap-2">
      <p class="pf-kicker opacity-70">
        {{ actTitle(spec, act.id) }}
      </p>
      <ul class="flex flex-col gap-2">
        <li
          v-for="reveal in act.reveals"
          :key="reveal.id"
          class="pk-card border-l-2 p-3"
          :class="
            kit.isUnlocked('reveals', reveal.id)
              ? 'border-accent/40 bg-accent/10'
              : 'border-dashed border-base-content/20 bg-base-200/40'
          "
        >
          <template v-if="kit.isUnlocked('reveals', reveal.id)">
            <p
              class="pk-display flex items-center gap-1.5 text-sm font-bold text-accent"
            >
              <Icon name="kind-icon:eye" class="size-4" />
              {{ reveal.title }}
            </p>
            <p class="pk-prose mt-1 text-sm">{{ reveal.text }}</p>
            <p
              v-if="subjectNames(spec, reveal.about).length"
              class="pk-dim mt-1 text-[11px] opacity-70"
            >
              Changes how you see
              {{ subjectNames(spec, reveal.about).join(', ') }}
            </p>
          </template>
          <p
            v-else
            class="pk-dim flex items-start gap-1.5 text-sm italic opacity-75"
          >
            <Icon name="kind-icon:lock" class="mt-0.5 size-4 shrink-0" />
            {{ reveal.teaser }}
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { actTitle, subjectNames } from '~/utils/playbookKit/view'
import type { PlaybookKitSpec } from '~/utils/playbookKit/types'

const props = defineProps<{ spec: PlaybookKitSpec }>()
const kit = usePlaybookKitStore()

const acts = computed(() =>
  props.spec.acts
    .map((act) => ({
      id: act.id,
      reveals: props.spec.reveals.filter((r) => r.act === act.id),
    }))
    .filter((act) => act.reveals.length),
)
</script>
