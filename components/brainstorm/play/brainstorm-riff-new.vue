<template>
  <form
    class="kr-scroll bs-new"
    data-testid="brainstorm-new-riff"
    @submit.prevent="submit"
  >
    <h2 class="bs-new-title">Put a prompt on the table</h2>

    <div class="bs-new-flavors" role="radiogroup" aria-label="Kind of round">
      <button
        v-for="option in flavors"
        :key="option.id"
        type="button"
        role="radio"
        class="bs-new-flavor"
        :class="{ 'is-on': form.flavor === option.id }"
        :aria-checked="form.flavor === option.id"
        @click="setFlavor(option.id)"
      >
        <span aria-hidden="true">{{ option.icon }}</span>
        {{ option.label }}
      </button>
    </div>
    <p class="bs-new-hint">{{ current.blurb }} {{ current.stemHint }}</p>

    <label class="bs-field">
      <span>{{ form.flavor === 'persona' ? 'Their name' : 'The prompt' }}</span>
      <input
        v-model="form.title"
        class="input input-bordered w-full"
        :maxlength="limits.title"
        :placeholder="current.titlePlaceholder"
        data-testid="brainstorm-new-title"
        required
        @input="syncStem"
      />
    </label>

    <label v-if="form.flavor !== 'list'" class="bs-field">
      <span>Every answer starts with</span>
      <input
        v-model="form.stem"
        class="input input-bordered w-full"
        :maxlength="limits.stem"
        :placeholder="current.stemPlaceholder"
        data-testid="brainstorm-new-stem"
        :required="form.flavor !== 'yes-but'"
        @input="stemTouched = true"
      />
    </label>

    <div v-if="form.flavor === 'crossover'" class="bs-field">
      <span>Who is crossing over?</span>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="persona in store.personaRiffs"
          :key="persona.id"
          type="button"
          class="btn btn-sm rounded-full"
          :class="
            form.crossoverIds.includes(persona.id)
              ? 'btn-primary'
              : 'btn-ghost border border-base-300'
          "
          @click="toggleCrossover(persona.id, persona.title)"
        >
          {{ persona.title }}
        </button>
        <span v-if="!store.personaRiffs.length" class="bs-new-hint">
          Start a Who Is This Person round first.
        </span>
      </div>
    </div>

    <label class="bs-field">
      <span>The vibe <em>(optional)</em></span>
      <textarea
        v-model="form.vibe"
        class="textarea textarea-bordered w-full"
        rows="2"
        :maxlength="limits.vibe"
        placeholder="An absurdly, cosmically wealthy man."
      />
    </label>

    <p v-if="store.createError" class="alert alert-error text-sm" role="alert">
      {{ store.createError }}
    </p>

    <div class="bs-new-actions">
      <button type="button" class="btn btn-ghost" @click="emit('cancel')">
        Back
      </button>
      <button
        type="submit"
        class="btn btn-primary bs-a-button"
        :disabled="store.creating || !form.title.trim()"
        data-testid="brainstorm-new-submit"
      >
        <span class="bs-a-key" aria-hidden="true">A</span>
        {{ store.creating ? 'Setting the table…' : 'Open the table' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useBrainstormRiffStore } from '@/stores/brainstormRiffStore'
import {
  BRAINSTORM_RIFF_FLAVORS,
  BRAINSTORM_RIFF_LIMITS,
  type BrainstormRiffFlavor,
} from '@/utils/brainstormRiffs'

const props = defineProps<{ flavor: BrainstormRiffFlavor }>()
const emit = defineEmits<{ created: [id: number]; cancel: [] }>()

const store = useBrainstormRiffStore()
const flavors = BRAINSTORM_RIFF_FLAVORS
const limits = BRAINSTORM_RIFF_LIMITS
const stemTouched = ref(false)
const crossoverNames = ref<string[]>([])

const form = reactive({
  flavor: props.flavor,
  title: '',
  stem: '',
  vibe: '',
  crossoverIds: [] as number[],
})

const current = computed(
  () => flavors.find((option) => option.id === form.flavor) ?? flavors[0]!,
)

watch(
  () => props.flavor,
  (value) => setFlavor(value),
)

function setFlavor(value: BrainstormRiffFlavor) {
  form.flavor = value
  stemTouched.value = false
  form.crossoverIds = []
  crossoverNames.value = []
  form.stem = value === 'persona' ? form.title : ''
}

function syncStem() {
  if (form.flavor === 'persona' && !stemTouched.value) form.stem = form.title
}

function toggleCrossover(id: number, title: string) {
  if (form.crossoverIds.includes(id)) {
    form.crossoverIds = form.crossoverIds.filter((entry) => entry !== id)
    crossoverNames.value = crossoverNames.value.filter((name) => name !== title)
  } else if (form.crossoverIds.length < 4) {
    form.crossoverIds = [...form.crossoverIds, id]
    crossoverNames.value = [...crossoverNames.value, title]
  }
  if (crossoverNames.value.length >= 2) {
    if (!form.title.trim() || form.title.includes('×')) {
      form.title = crossoverNames.value.join(' × ')
    }
    if (!stemTouched.value) {
      form.stem =
        crossoverNames.value.length === 2
          ? `Neither ${crossoverNames.value[0]} nor ${crossoverNames.value[1]}`
          : `None of ${crossoverNames.value.join(', ')}`
    }
  }
}

async function submit() {
  const id = await store.createRiff({ ...form })
  if (id) emit('created', id)
}
</script>

<style scoped>
.bs-new {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  max-width: 44rem;
  width: 100%;
  margin: 0 auto;
}

.bs-new-title {
  font-size: clamp(1.4rem, 5vw, 2rem);
  font-weight: 900;
}

.bs-new-flavors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 0.5rem;
}

.bs-new-flavor {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 1rem;
  padding: 0.6rem 0.75rem;
  font-weight: 800;
  background: var(--color-base-100);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, white 8%, transparent);
}

.bs-new-flavor.is-on {
  color: var(--color-primary-content);
  background: var(--color-primary);
  box-shadow: 0 4px 0 color-mix(in oklch, var(--color-primary) 45%, black);
}

.bs-new-hint {
  font-size: 0.85rem;
  color: color-mix(in oklch, var(--color-base-content) 72%, transparent);
}

.bs-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 800;
  font-size: 0.85rem;
}

.bs-field em {
  font-weight: 500;
  opacity: 0.7;
}

.bs-new-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.3rem;
}

.bs-a-button {
  gap: 0.5rem;
  border-radius: 999px;
}

.bs-a-key {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.8rem;
  background: color-mix(in oklch, black 22%, transparent);
}
</style>
