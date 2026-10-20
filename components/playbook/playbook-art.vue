<template>
  <span class="block overflow-hidden bg-neutral">
    <EcotoneScene
      v-if="scene"
      :kind="scene as SceneKind"
      :art="art ?? undefined"
      :label="title"
      class="absolute inset-0"
    />
    <template v-else>
      <img
        v-if="store.cover && !coverBroken"
        :src="store.cover"
        alt=""
        loading="lazy"
        decoding="async"
        class="absolute inset-0 size-full scale-110 object-cover blur-[1.5px] saturate-[.7]"
        @error="coverBroken = true"
      />
      <span
        class="absolute inset-0 bg-gradient-to-br"
        :class="TINT[kind ?? 'spine']"
      />
      <Icon
        v-if="!artUrl || broken"
        :name="ICON[kind ?? 'spine']"
        class="absolute inset-0 m-auto size-1/4 max-h-14 max-w-14 text-white/45 drop-shadow"
      />
      <img
        v-if="artUrl && !broken"
        :key="artUrl"
        :src="artUrl"
        :alt="title"
        loading="lazy"
        decoding="async"
        class="absolute inset-0 size-full object-cover transition-opacity duration-500"
        :class="loaded ? 'opacity-100' : 'opacity-0'"
        :style="{ objectPosition: focus }"
        @load="loaded = true"
        @error="broken = true"
      />
    </template>
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePlaybookStore } from '~/stores/playbookStore'
import type { SceneKind } from '~/utils/ecotone/content'
import type { NodeKind } from '~/utils/playbook/types'

// A beat's picture in the Playbook Manager: Ecotone's code-drawn scene with any
// painting over it, or another game's own art fading in over that game's key
// art tinted by the kind of beat. Until a beat has art (or while it loads) the
// tinted key art holds its place, so no slot is ever a blank box.
const props = defineProps<{
  title: string
  scene?: string
  art?: string | null
  artUrl?: string | null
  kind?: NodeKind
  /** CSS object-position, for portraits whose faces sit high. */
  focus?: string
}>()

const store = usePlaybookStore()
const broken = ref(false)
const loaded = ref(false)
const coverBroken = ref(false)
watch(
  () => props.artUrl,
  () => {
    broken.value = false
    loaded.value = false
  },
)
watch(
  () => store.cover,
  () => (coverBroken.value = false),
)

const TINT: Record<NodeKind, string> = {
  opening: 'from-violet-500/45 to-violet-950/70',
  spine: 'from-emerald-500/35 to-emerald-950/70',
  fork: 'from-sky-500/40 to-sky-950/70',
  encounter: 'from-amber-400/40 to-amber-950/70',
  crossroads: 'from-orange-400/40 to-orange-950/70',
  boss: 'from-red-500/40 to-red-950/70',
  quest: 'from-teal-400/40 to-teal-950/70',
  follower: 'from-fuchsia-500/40 to-fuchsia-950/70',
  thread: 'from-indigo-500/40 to-indigo-950/70',
  ending: 'from-rose-400/40 to-rose-950/70',
}

const ICON: Record<NodeKind, string> = {
  opening: 'kind-icon:sparkles',
  spine: 'kind-icon:git-branch',
  fork: 'kind-icon:map',
  encounter: 'kind-icon:image',
  crossroads: 'kind-icon:git-branch',
  boss: 'kind-icon:flag',
  quest: 'kind-icon:map',
  follower: 'kind-icon:user',
  thread: 'kind-icon:link',
  ending: 'kind-icon:star',
}
</script>
