<template>
  <dialog
    ref="sheet"
    class="modal"
    aria-labelledby="endings-gallery-heading"
    @close="emit('close')"
  >
    <div
      class="modal-box flex max-h-[90dvh] max-w-4xl flex-col gap-3 p-3 sm:p-4"
    >
      <div class="flex shrink-0 items-center justify-between gap-3">
        <p
          id="endings-gallery-heading"
          class="font-mono text-sm font-black uppercase tracking-widest"
        >
          Endings on file · {{ found }} of {{ ENDINGS.length }}
        </p>
        <button type="button" class="btn btn-ghost btn-sm" @click="close">
          Close
        </button>
      </div>
      <ul
        class="grid min-h-0 auto-rows-max grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2 overflow-y-auto"
        aria-label="Endings"
      >
        <li
          v-for="ending in ENDINGS"
          :key="ending.id"
          class="flex min-w-0 flex-col overflow-hidden rounded-xl border-2"
          :class="
            seen(ending.id)
              ? 'border-stone-800 bg-[#e9d8a6] text-stone-900'
              : 'border-stone-700 bg-stone-900 text-amber-50'
          "
        >
          <div class="relative">
            <shifting-desks-art
              frame="aspect-[3/4]"
              :class="seen(ending.id) ? '' : 'locked-art'"
              :src="stationArt('endings', ending.id)"
              :alt="seen(ending.id) ? `Epilogue: ${ending.epilogue.title}` : ''"
              fallback-icon="kind-icon:document"
              icon-size="2rem"
              :show-brief="false"
            />
            <div
              v-if="!seen(ending.id)"
              class="absolute inset-0 grid place-items-center bg-stone-950/40"
              aria-hidden="true"
            >
              <icon name="kind-icon:lock" class="size-8 text-amber-50" />
            </div>
          </div>
          <div class="flex flex-col gap-0.5 p-2">
            <p class="font-mono text-xs font-black uppercase leading-tight">
              {{ seen(ending.id) ? ending.title : 'Undiscovered' }}
            </p>
            <p class="text-xs leading-snug opacity-80">
              {{
                seen(ending.id)
                  ? ending.epilogue.title
                  : ending.kind === 'secret'
                    ? 'A secret ending. HR denies it exists.'
                    : ending.kind === 'elimination'
                      ? 'What happens when the Successors run out.'
                      : 'One of the Board’s verdicts.'
              }}
            </p>
          </div>
        </li>
      </ul>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="submit">Close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ENDINGS, stationArt } from '~/utils/shiftingDesks/rules'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'

const emit = defineEmits<{ close: [] }>()
const store = useShiftingDesksStore()
const sheet = ref<HTMLDialogElement | null>(null)

const seen = (id: string) => store.endingsFound.includes(id)
const found = computed(
  () => ENDINGS.filter((e) => store.endingsFound.includes(e.id)).length,
)

function open(): void {
  sheet.value?.showModal()
}

function close(): void {
  sheet.value?.close()
}

defineExpose({ open })
</script>

<style scoped>
/* An undiscovered ending is a rumour: its epilogue art, too blurred to spoil. */
.locked-art {
  filter: blur(14px) grayscale(0.6) brightness(0.55);
  transform: scale(1.1);
}
</style>
