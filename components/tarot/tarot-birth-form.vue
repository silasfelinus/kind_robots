<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTarotReaderStore } from '~/stores/tarotReaderStore'
import { BIRTH_CITIES, cityById } from '~/utils/astrology/cities'

const emit = defineEmits<{ saved: [] }>()
const store = useTarotReaderStore()

const editingId = ref<string | null>(null)
const name = ref('')
const date = ref('')
const time = ref('')
const timeUnknown = ref(false)
const cityId = ref('san-francisco-ca-usa')
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const timeZone = ref('')

const custom = computed(() => cityId.value === 'custom')

function fillFrom(id: string | null) {
  const profile = store.profiles.find((entry) => entry.id === id)
  editingId.value = profile?.id ?? null
  name.value = profile?.name ?? ''
  date.value = profile?.date ?? ''
  time.value = profile?.time ?? ''
  timeUnknown.value = Boolean(profile && !profile.time)
  cityId.value = profile ? (profile.cityId ?? 'custom') : 'san-francisco-ca-usa'
  latitude.value = profile?.latitude ?? null
  longitude.value = profile?.longitude ?? null
  timeZone.value = profile?.timeZone ?? ''
}

watch(cityId, (id) => {
  const city = cityById(id)
  if (!city) return
  latitude.value = city.latitude
  longitude.value = city.longitude
  timeZone.value = city.timeZone
})

function startNew() {
  fillFrom(null)
  const city = cityById(cityId.value)
  if (city) {
    latitude.value = city.latitude
    longitude.value = city.longitude
    timeZone.value = city.timeZone
  }
}

startNew()

function edit(id: string) {
  fillFrom(id)
}

function save() {
  const saved = store.saveProfile({
    id: editingId.value ?? undefined,
    name: name.value,
    date: date.value,
    time: timeUnknown.value ? null : time.value || null,
    cityId: custom.value ? null : cityId.value,
    latitude: Number(latitude.value),
    longitude: Number(longitude.value),
    timeZone: timeZone.value.trim(),
  })
  if (saved) emit('saved')
}

defineExpose({ edit, startNew })
</script>

<template>
  <form
    class="grid gap-2 text-xs"
    aria-label="Birth chart details"
    @submit.prevent="save"
  >
    <label class="form-control">
      <span class="mb-1 font-bold">Name</span>
      <input
        v-model="name"
        class="input input-bordered input-sm"
        maxlength="60"
        placeholder="Who is this chart for?"
        required
      />
    </label>
    <div class="grid grid-cols-2 gap-2">
      <label class="form-control">
        <span class="mb-1 font-bold">Birth date</span>
        <input
          v-model="date"
          type="date"
          class="input input-bordered input-sm"
          min="1800-01-01"
          max="2200-12-31"
          required
        />
      </label>
      <label class="form-control">
        <span class="mb-1 font-bold">Birth time</span>
        <input
          v-model="time"
          type="time"
          class="input input-bordered input-sm"
          :disabled="timeUnknown"
          :required="!timeUnknown"
        />
      </label>
    </div>
    <label class="label cursor-pointer justify-start gap-2 py-0">
      <input
        v-model="timeUnknown"
        type="checkbox"
        class="checkbox checkbox-xs"
      />
      <span>I don't know the birth time (no rising sign or houses)</span>
    </label>
    <label class="form-control">
      <span class="mb-1 font-bold">Birthplace</span>
      <select v-model="cityId" class="select select-bordered select-sm">
        <option v-for="city in BIRTH_CITIES" :key="city.id" :value="city.id">
          {{ city.name }}
        </option>
        <option value="custom">Somewhere else…</option>
      </select>
    </label>
    <div v-if="custom" class="grid grid-cols-3 gap-2">
      <label class="form-control">
        <span class="mb-1 font-bold">Latitude</span>
        <input
          v-model.number="latitude"
          type="number"
          step="0.0001"
          min="-90"
          max="90"
          class="input input-bordered input-sm"
          required
        />
      </label>
      <label class="form-control">
        <span class="mb-1 font-bold">Longitude</span>
        <input
          v-model.number="longitude"
          type="number"
          step="0.0001"
          min="-180"
          max="180"
          class="input input-bordered input-sm"
          required
        />
      </label>
      <label class="form-control">
        <span class="mb-1 font-bold">Time zone</span>
        <input
          v-model="timeZone"
          class="input input-bordered input-sm"
          placeholder="Europe/Rome"
          required
        />
      </label>
    </div>
    <p v-if="store.error" class="text-error" role="alert">{{ store.error }}</p>
    <p class="opacity-75">
      Birth details stay in this browser. Nothing is sent to a server.
    </p>
    <div class="flex gap-2">
      <button class="btn btn-primary btn-sm" type="submit">
        {{ editingId ? 'Update chart' : 'Cast chart' }}
      </button>
      <button
        v-if="editingId"
        class="btn btn-ghost btn-sm"
        type="button"
        @click="startNew"
      >
        New person
      </button>
    </div>
  </form>
</template>
