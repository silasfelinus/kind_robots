<template>
  <div
    class="fixed inset-0 z-[70] flex items-center justify-center bg-[#080d14]/90 p-2 backdrop-blur-sm sm:p-4"
    @click.self="emit('close')"
  >
    <section
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Earth Chronicle, recovered photographs"
      tabindex="-1"
      data-testid="memory-earth-chronicle"
      class="flex h-[min(90dvh,46rem)] w-[min(96vw,64rem)] min-h-0 flex-col overflow-hidden rounded-xl border-2 border-[#ae8d64] bg-[#1e252b] text-[#f9edce] shadow-[0_0_65px_#090b10] outline-none"
      @keydown.esc.prevent="emit('close')"
    >
      <header
        class="flex shrink-0 items-center justify-between gap-3 border-b border-[#94795a] bg-[#332d2b] px-3 py-2 sm:px-5"
      >
        <div>
          <p
            class="text-[10px] font-bold uppercase tracking-[0.25em] text-[#dfc994]"
          >
            Recovered evidence · Earth
          </p>
          <h2 class="font-serif text-xl font-black sm:text-2xl">
            The Chronicle
          </h2>
          <p class="text-xs text-[#d5c7ab]" aria-live="polite">
            {{ world.earthPhotos.length }} photograph{{
              world.earthPhotos.length === 1 ? '' : 's'
            }}
            remembered
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-[#bda077] px-3 py-2 text-sm font-bold hover:bg-[#564c43] focus-visible:outline-2 focus-visible:outline-[#ffe0a8]"
          @click="emit('close')"
        >
          Return to the world
        </button>
      </header>

      <div
        v-if="world.earthPhotos.length === 0"
        class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <span class="font-serif text-6xl text-[#b6a47f]" aria-hidden="true"
          >◫</span
        >
        <h3 class="font-serif text-2xl font-bold">No evidence yet</h3>
        <p class="max-w-md text-sm text-[#ddd0bd]">
          Some roads in Briar keep photographs of the life you left behind. Make
          choices in those scenes to preserve what you find.
        </p>
      </div>

      <div
        v-else
        class="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row"
      >
        <nav
          aria-label="Recovered photographs in Earth chronology"
          class="kr-scroll flex shrink-0 gap-2 overflow-x-auto border-b border-[#7e6c54] bg-[#22262b] p-2 sm:w-52 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r"
        >
          <button
            v-for="photo in world.earthPhotos"
            :key="photo.id"
            type="button"
            :aria-pressed="selected === photo.id"
            class="min-w-32 shrink-0 rounded-lg border p-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-[#f8dfa3] sm:min-w-0"
            :class="
              selected === photo.id
                ? 'border-[#e7c889] bg-[#514332] text-[#fff1cc]'
                : 'border-[#685e52] bg-[#303039] text-[#d6cec2]'
            "
            @click="selected = photo.id"
          >
            <span class="block font-mono text-[10px] opacity-75"
              >Evidence {{ String(photo.order).padStart(2, '0') }}</span
            >
            <strong class="mt-1 block text-sm">{{ photo.title }}</strong>
            <span class="mt-1 block opacity-80">{{
              world.earthChronicle.responses[photo.id]
                ? 'Reflection recorded'
                : 'Reflection awaiting you'
            }}</span>
          </button>
        </nav>

        <article
          v-if="active"
          :key="active.id"
          class="kr-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-5"
          :aria-label="active.title"
        >
          <div
            class="relative aspect-[16/9] max-h-[min(39dvh,22rem)] w-full shrink-0 overflow-hidden rounded-lg border-4 border-[#c1ac8a] bg-[radial-gradient(circle_at_50%_35%,#6e726b,#2b3336)] shadow-xl"
          >
            <img
              v-if="!failed[active.id]"
              :src="active.artPath"
              :alt="`Recovered photograph: ${active.title}`"
              class="h-full w-full object-cover"
              @error="failed[active.id] = true"
            />
            <div
              v-else
              class="flex h-full flex-col items-center justify-center gap-2 bg-[linear-gradient(140deg,#5a625e,#273338)] px-5 text-center"
            >
              <span
                class="font-serif text-6xl text-[#cabf9e]"
                aria-hidden="true"
                >◫</span
              >
              <p class="text-sm font-bold text-[#f7e7c6]">
                The negative has been recovered.
              </p>
              <p class="text-xs text-[#d5d4c5]">
                Its illustration is still being developed.
              </p>
            </div>
            <span
              class="absolute bottom-2 right-2 rounded bg-[#1b2027]/85 px-2 py-1 font-mono text-[10px]"
              >Earth · {{ String(active.order).padStart(2, '0') }}</span
            >
          </div>

          <div>
            <h3 class="font-serif text-xl font-bold sm:text-2xl">
              {{ active.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-[#eee0c9]">
              {{ active.caption }}
            </p>
          </div>

          <div class="rounded-lg border-l-2 border-[#b79a70] bg-[#272c30] p-3">
            <p
              class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d0ac82]"
            >
              Your interpretation
            </p>
            <p
              v-if="world.earthChronicle.responses[active.id]"
              class="mt-2 text-sm leading-relaxed"
              role="status"
            >
              {{
                world.earthChronicle.responses[active.id] === 'challenge'
                  ? active.challengeReflection
                  : active.holdReflection
              }}
            </p>
            <template v-else>
              <p class="mt-2 text-xs text-[#ddd0b9]">
                The camera records an instant, not a verdict. What do you keep
                from it?
              </p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-md border border-[#b59a70] bg-[#544231] px-3 py-2 text-left text-xs font-bold hover:bg-[#715439] focus-visible:outline-2 focus-visible:outline-[#ffe3a6]"
                  @click="world.answerEarthPhoto(active.id, 'challenge')"
                >
                  {{ active.challenge }}
                </button>
                <button
                  type="button"
                  class="rounded-md border border-[#a799b8] bg-[#43394f] px-3 py-2 text-left text-xs font-bold hover:bg-[#5b4866] focus-visible:outline-2 focus-visible:outline-[#ffe3a6]"
                  @click="world.answerEarthPhoto(active.id, 'hold')"
                >
                  {{ active.hold }}
                </button>
              </div>
            </template>
          </div>
          <div
            v-if="reappraisal"
            data-testid="memory-earth-reappraisal"
            class="rounded-lg border border-[#8eaa9b] bg-[#253b39] p-3"
          >
            <p
              class="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8dbcc]"
            >
              Evidence reconsidered
            </p>
            <h4 class="mt-1 font-serif text-lg font-bold">
              {{ reappraisal.title }}
            </h4>
            <p class="mt-2 text-sm leading-relaxed text-[#e5efe5]">
              {{ reappraisal.evidence }}
            </p>
            <p class="mt-2 text-sm leading-relaxed text-[#cbded2]">
              {{ reappraisal.reflection }}
            </p>
          </div>
          <p class="text-xs italic leading-relaxed text-[#bbb2a8]">
            Your response remains in the Chronicle across expeditions. A later
            photograph may change what you believe; it cannot erase what you
            felt here.
          </p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useMemoryWorldStore } from '~/stores/memoryWorldStore'
import { earthPhotoReappraisal } from '~/utils/memoryDungeon/chronicle'

const emit = defineEmits<{ close: [] }>()
const world = useMemoryWorldStore()
const selected = ref(world.earthPhotos[0]?.id ?? '')
const failed = ref<Record<string, boolean>>({})
const dialog = ref<HTMLElement | null>(null)
const active = computed(
  () =>
    world.earthPhotos.find((photo) => photo.id === selected.value) ??
    world.earthPhotos[0] ??
    null,
)
const reappraisal = computed(() =>
  active.value
    ? earthPhotoReappraisal(world.earthChronicle, active.value.id)
    : null,
)
onMounted(async () => {
  await nextTick()
  dialog.value?.focus()
})
</script>
