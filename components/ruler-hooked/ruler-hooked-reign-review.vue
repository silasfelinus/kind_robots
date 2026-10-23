<!-- The ruler is the point of view, not a portrait in the kingdom chronicle. -->
<template>
  <div class="flex flex-col gap-4">
    <header
      class="flex items-center gap-3 rounded-2xl border border-amber-300/20 bg-slate-900/85 p-3 text-amber-50"
    >
      <div
        class="flex size-14 shrink-0 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10"
      >
        <Icon name="kind-icon:crown" class="size-7 text-amber-200" />
      </div>
      <div class="min-w-0">
        <p class="font-serif text-xl font-black">{{ rulerLabel }}</p>
        <p class="text-xs text-amber-100/65">
          Your reign, your people, and the realm they inhabit.
        </p>
      </div>
    </header>

    <RulerHookedKingdomView
      :save="save"
      :bundle="store.bundle"
      :scene="store.scene"
      :regions="store.bundle.regions"
    />
  </div>
</template>

<script setup lang="ts">
import type { RunSave } from '~/types/ruler-hooked'
import { useRulerHookedStore } from '~/stores/rulerHookedStore'

const props = defineProps<{ save: RunSave }>()
const store = useRulerHookedStore()
const rulerLabel = computed(() =>
  [props.save.ruler.honorific, props.save.ruler.name].filter(Boolean).join(' '),
)
</script>
