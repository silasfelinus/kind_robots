<template>
  <fieldset
    class="eod-ruler-creator space-y-2 rounded-2xl border border-warning/40 bg-base-200 p-3"
    data-testid="emperor-ruler-creator"
  >
    <legend
      class="px-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-warning"
    >
      Who takes the throne
    </legend>
    <div class="grid grid-cols-2 gap-2">
      <label class="col-span-2 flex flex-col gap-1">
        <span class="text-xs font-semibold">
          Name <span class="font-normal opacity-70">(optional)</span>
        </span>
        <input
          v-model="name"
          type="text"
          class="input input-sm w-full"
          :maxlength="RULER_NAME_MAX"
          autocomplete="off"
          spellcheck="false"
          placeholder="Leave blank to go unnamed"
          aria-describedby="eod-ruler-preview"
          @blur="name = court.ruler.name ?? ''"
        />
      </label>
      <label class="flex min-w-0 flex-col gap-1">
        <span class="text-xs font-semibold">Style of address</span>
        <select v-model="address" class="select select-sm w-full">
          <option v-for="id in RULER_ADDRESSES" :key="id" :value="id">
            {{ RULER_TITLES[id] }}
          </option>
        </select>
      </label>
      <label class="flex min-w-0 flex-col gap-1">
        <span class="text-xs font-semibold">Temperament</span>
        <select
          v-model="temperament"
          class="select select-sm w-full"
          aria-describedby="eod-ruler-temperament"
        >
          <option v-for="id in RULER_TEMPERAMENTS" :key="id" :value="id">
            {{ TEMPERAMENTS[id].label }}
          </option>
        </select>
      </label>
    </div>
    <p id="eod-ruler-temperament" class="text-xs opacity-80">
      {{ TEMPERAMENTS[temperament].description }}
    </p>
    <p id="eod-ruler-preview" class="text-xs italic">
      The court will know you as {{ rulerStyle(court.ruler) }}.
    </p>
    <p v-if="problem" class="text-xs text-error" role="alert">{{ problem }}</p>
  </fieldset>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import {
  RULER_NAME_MAX,
  RULER_TITLES,
  TEMPERAMENTS,
  rulerStyle,
} from '~/utils/emperorOfDust/fortress/ruler'
import {
  RULER_ADDRESSES,
  RULER_TEMPERAMENTS,
} from '~/utils/emperorOfDust/fortress/types'
import type {
  RulerAddress,
  RulerTemperament,
} from '~/utils/emperorOfDust/fortress/types'

const court = useEmperorFortressStore()
const name = ref(court.ruler.name ?? '')
const address = ref<RulerAddress>(court.ruler.address)
const temperament = ref<RulerTemperament>(court.ruler.temperament)
const problem = ref('')

watch([name, address, temperament], crown)

function crown() {
  try {
    court.crownRuler({
      name: name.value,
      address: address.value,
      temperament: temperament.value,
    })
    problem.value = ''
  } catch (cause) {
    problem.value =
      cause instanceof Error ? cause.message : 'The crown could not be set.'
  }
}
</script>
