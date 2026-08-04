<template>
  <Teleport to="body">
    <dialog class="modal modal-open" aria-modal="true" @cancel.prevent="emit('close')">
      <div
        class="modal-box flex max-h-[94dvh] w-[min(96vw,80rem)] max-w-none flex-col overflow-hidden rounded-3xl border border-base-300 bg-base-100 p-0 shadow-2xl"
      >
        <header class="flex shrink-0 items-start gap-4 border-b border-base-300 bg-base-100/95 p-4 backdrop-blur sm:p-5">
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
          >
            <Icon :name="typeIcon" class="size-6 text-primary" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-primary badge-sm rounded-lg">{{ typeLabel }}</span>
              <span class="badge badge-ghost badge-sm rounded-lg">#{{ entity.id }}</span>
              <span v-if="entity.slug" class="badge badge-outline badge-sm max-w-full truncate rounded-lg">
                {{ entity.slug }}
              </span>
            </div>
            <h2 class="mt-1 truncate text-xl font-black sm:text-2xl">{{ title }}</h2>
            <p class="mt-1 line-clamp-2 text-sm text-base-content/55">{{ summary }}</p>
          </div>

          <button
            type="button"
            class="btn btn-ghost btn-square btn-sm shrink-0 rounded-xl"
            aria-label="Close object details"
            @click="emit('close')"
          >
            <Icon name="kind-icon:x" class="size-4" />
          </button>
        </header>

        <nav class="flex shrink-0 gap-1 overflow-x-auto border-b border-base-300 bg-base-200/40 px-4 py-2 sm:px-5" aria-label="Object details sections">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="btn btn-sm shrink-0 gap-1.5 rounded-xl"
            :class="activeTab === tab.key ? 'btn-primary' : 'btn-ghost'"
            @click="activeTab = tab.key"
          >
            <Icon :name="tab.icon" class="size-4" />
            {{ tab.label }}
          </button>
        </nav>

        <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <section
            v-if="activeTab === 'overview'"
            class="grid gap-5 lg:grid-cols-[minmax(17rem,0.8fr)_minmax(0,1.2fr)]"
          >
            <div class="space-y-3">
              <figure
                class="relative min-h-72 overflow-hidden rounded-2xl border border-base-300 bg-base-200"
              >
                <img
                  v-if="displayImage && !imageFailed"
                  :src="displayImage"
                  :alt="`${title} artwork`"
                  class="absolute inset-0 size-full object-cover"
                  @error="imageFailed = true"
                />
                <div
                  v-else
                  class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-base-content/35"
                >
                  <Icon :name="typeIcon" class="size-14 opacity-40" />
                  <p class="font-bold">No attached artwork yet.</p>
                </div>
              </figure>

              <div class="flex flex-wrap gap-2">
                <span
                  v-for="badge in badges"
                  :key="badge"
                  class="badge badge-outline rounded-xl"
                >
                  {{ badge }}
                </span>
              </div>
            </div>

            <div class="space-y-3">
              <article
                v-for="row in overviewRows"
                :key="row.key"
                class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
              >
                <p class="text-xs font-black uppercase tracking-[0.14em] text-primary/75">
                  {{ row.label }}
                </p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-base-content/75">
                  {{ row.value }}
                </p>
              </article>

              <div
                v-if="!overviewRows.length"
                class="rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-8 text-center text-base-content/45"
              >
                This object has a name and excellent posture, but no descriptive fields yet.
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'edit'" class="mx-auto max-w-4xl space-y-4">
            <div
              v-if="canEdit"
              class="rounded-2xl border border-primary/25 bg-primary/5 p-4"
            >
              <p class="text-xs font-black uppercase tracking-[0.15em] text-primary">Object editor</p>
              <h3 class="mt-1 text-lg font-black">Revise the useful fields</h3>
              <p class="mt-1 text-sm leading-relaxed text-base-content/55">
                These save directly to the existing {{ typeLabel.toLowerCase() }} record. System fields and relationships stay out of reach.
              </p>
            </div>

            <form v-if="canEdit" class="grid gap-4" @submit.prevent="saveChanges">
              <label
                v-for="field in editFields"
                :key="field.key"
                class="form-control gap-1.5"
              >
                <span class="text-sm font-black">{{ field.label }}</span>
                <textarea
                  v-if="field.multiline"
                  v-model="draft[field.key]"
                  class="textarea textarea-bordered min-h-28 rounded-2xl leading-relaxed"
                  :class="field.tall ? 'min-h-44' : ''"
                  :placeholder="field.placeholder"
                  :disabled="saving"
                />
                <input
                  v-else
                  v-model="draft[field.key]"
                  type="text"
                  class="input input-bordered rounded-2xl"
                  :placeholder="field.placeholder"
                  :disabled="saving"
                />
              </label>

              <div class="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100/95 p-3 shadow-lg backdrop-blur">
                <p
                  v-if="saveMessage"
                  class="min-w-0 flex-1 text-sm"
                  :class="saveError ? 'text-error' : 'text-success'"
                >
                  {{ saveMessage }}
                </p>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm ml-auto rounded-xl"
                  :disabled="saving || !hasChanges"
                  @click="resetDraft"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  class="btn btn-primary btn-sm gap-2 rounded-xl"
                  :disabled="saving || !hasChanges || missingRequiredField"
                >
                  <span v-if="saving" class="loading loading-spinner loading-xs" />
                  <Icon v-else name="kind-icon:save" class="size-4" />
                  {{ saving ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </form>

            <div
              v-else
              class="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-8 text-center"
            >
              <Icon name="kind-icon:lock" class="size-10 text-base-content/25" />
              <p class="text-lg font-black text-base-content/65">This object is view-only.</p>
              <p class="max-w-lg text-sm text-base-content/45">
                Only its owner or an administrator can submit content changes.
              </p>
            </div>
          </section>

          <daily-dream-object-art-workbench
            v-else
            :object-type="objectType"
            :entity="entity"
            :slots="artSlots"
            :can-edit="canEdit"
            @updated="handleArtUpdated"
          />
        </div>
      </div>

      <form method="dialog" class="modal-backdrop bg-black/60" @submit.prevent="emit('close')">
        <button type="button" aria-label="Close object details" @click="emit('close')">close</button>
      </form>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import {
  useDailyDreamArchiveStore,
  type DailyDreamArchiveObject,
  type DailyDreamArchiveObjectType,
  type DailyDreamArtSlot,
} from '@/stores/dailyDreamArchiveStore'
import { resolveEntityArtwork } from '@/utils/artImageSrc'

type TabKey = 'overview' | 'edit' | 'art'
type EditField = {
  key: string
  label: string
  placeholder: string
  multiline?: boolean
  tall?: boolean
  required?: boolean
}

type OverviewRow = {
  key: string
  label: string
  value: string
}

const props = defineProps<{
  objectType: DailyDreamArchiveObjectType
  entity: DailyDreamArchiveObject
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const userStore = useUserStore()
const archiveStore = useDailyDreamArchiveStore()
const activeTab = ref<TabKey>('overview')
const draft = ref<Record<string, string>>({})
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref(false)
const imageFailed = ref(false)

const tabs = [
  { key: 'overview' as const, label: 'Details', icon: 'kind-icon:info' },
  { key: 'edit' as const, label: 'Modify', icon: 'kind-icon:pencil' },
  { key: 'art' as const, label: 'Artwork', icon: 'kind-icon:palette' },
]

const fieldConfig: Record<DailyDreamArchiveObjectType, EditField[]> = {
  dream: [
    { key: 'title', label: 'Title', placeholder: 'Dream title', required: true },
    { key: 'pitch', label: 'Pitch', placeholder: 'What makes this world compelling?', multiline: true, tall: true },
    { key: 'description', label: 'Description', placeholder: 'Describe the world and its central idea.', multiline: true, tall: true },
    { key: 'flavorText', label: 'Flavor text', placeholder: 'A small atmospheric fragment.', multiline: true },
    { key: 'examples', label: 'Examples', placeholder: 'Examples, touchstones, or possible moments.', multiline: true },
    { key: 'artPrompt', label: 'Art prompt', placeholder: 'Primary visual direction for future generations.', multiline: true, tall: true },
  ],
  character: [
    { key: 'name', label: 'Name', placeholder: 'Character name', required: true },
    { key: 'honorific', label: 'Honorific', placeholder: 'Title or honorific' },
    { key: 'role', label: 'Role', placeholder: 'Role in the Dream' },
    { key: 'species', label: 'Species', placeholder: 'Species or nature' },
    { key: 'class', label: 'Class', placeholder: 'Class or archetype' },
    { key: 'presentation', label: 'Presentation', placeholder: 'How the character first appears.', multiline: true },
    { key: 'personality', label: 'Personality', placeholder: 'Temperament, habits, and social texture.', multiline: true, tall: true },
    { key: 'drive', label: 'Drive', placeholder: 'What they want and why.', multiline: true },
    { key: 'backstory', label: 'Backstory', placeholder: 'Important history.', multiline: true, tall: true },
    { key: 'quirks', label: 'Quirks', placeholder: 'Memorable oddities and behaviors.', multiline: true },
    { key: 'artPrompt', label: 'Art prompt', placeholder: 'Primary visual direction for future generations.', multiline: true, tall: true },
  ],
  reward: [
    { key: 'name', label: 'Name', placeholder: 'Reward name', required: true },
    { key: 'description', label: 'Description', placeholder: 'What the discovery is.', multiline: true, tall: true },
    { key: 'effect', label: 'Effect', placeholder: 'What changes when it is used.', multiline: true },
    { key: 'flavorText', label: 'Flavor text', placeholder: 'A short in-world fragment.', multiline: true },
    { key: 'artPrompt', label: 'Art prompt', placeholder: 'Primary visual direction for future generations.', multiline: true, tall: true },
  ],
  scenario: [
    { key: 'title', label: 'Title', placeholder: 'Scenario title', required: true },
    { key: 'description', label: 'Description', placeholder: 'The situation and central tension.', multiline: true, tall: true },
    { key: 'intros', label: 'Opening ideas', placeholder: 'Possible openings or entry points.', multiline: true, tall: true },
    { key: 'locations', label: 'Locations', placeholder: 'Important places.', multiline: true },
    { key: 'genres', label: 'Genres', placeholder: 'Genre and tone.' },
    { key: 'inspirations', label: 'Inspirations', placeholder: 'Creative touchstones.', multiline: true },
    { key: 'cast', label: 'Cast notes', placeholder: 'Who belongs in the scene.', multiline: true },
    { key: 'artPrompt', label: 'Art prompt', placeholder: 'Primary visual direction for future generations.', multiline: true, tall: true },
  ],
  bot: [
    { key: 'name', label: 'Name', placeholder: 'Narrator name', required: true },
    { key: 'subtitle', label: 'Subtitle', placeholder: 'Short role or identity' },
    { key: 'tagline', label: 'Tagline', placeholder: 'One memorable line' },
    { key: 'description', label: 'Description', placeholder: 'What this narrator is for.', multiline: true },
    { key: 'personality', label: 'Personality', placeholder: 'Voice, temperament, and habits.', multiline: true, tall: true },
    { key: 'prompt', label: 'System prompt', placeholder: 'Narrator instructions.', multiline: true, tall: true },
    { key: 'botIntro', label: 'Introduction', placeholder: 'How the narrator greets the traveler.', multiline: true },
    { key: 'narrativeVoice', label: 'Narrative voice', placeholder: 'Style and cadence.', multiline: true },
    { key: 'artPrompt', label: 'Art prompt', placeholder: 'Primary visual direction for future generations.', multiline: true, tall: true },
  ],
}

const overviewFieldConfig: Record<DailyDreamArchiveObjectType, Array<[string, string]>> = {
  dream: [
    ['pitch', 'Pitch'],
    ['description', 'Description'],
    ['flavorText', 'Flavor text'],
    ['examples', 'Examples'],
    ['artPrompt', 'Art prompt'],
  ],
  character: [
    ['presentation', 'Presentation'],
    ['personality', 'Personality'],
    ['drive', 'Drive'],
    ['backstory', 'Backstory'],
    ['quirks', 'Quirks'],
    ['artPrompt', 'Art prompt'],
  ],
  reward: [
    ['description', 'Description'],
    ['effect', 'Effect'],
    ['flavorText', 'Flavor text'],
    ['artPrompt', 'Art prompt'],
  ],
  scenario: [
    ['description', 'Description'],
    ['intros', 'Opening ideas'],
    ['locations', 'Locations'],
    ['cast', 'Cast notes'],
    ['inspirations', 'Inspirations'],
    ['artPrompt', 'Art prompt'],
  ],
  bot: [
    ['description', 'Description'],
    ['tagline', 'Tagline'],
    ['personality', 'Personality'],
    ['botIntro', 'Introduction'],
    ['narrativeVoice', 'Narrative voice'],
    ['prompt', 'System prompt'],
    ['artPrompt', 'Art prompt'],
  ],
}

const slotConfig: Record<DailyDreamArchiveObjectType, DailyDreamArtSlot[]> = {
  dream: [
    { field: 'imagePath', label: 'Image', aspect: '1 / 1', width: 1024, height: 1024 },
    { field: 'cardPath', label: 'Card', aspect: '2 / 3', width: 512, height: 768 },
    { field: 'heroPath', label: 'Hero', aspect: '16 / 9', width: 1280, height: 720 },
  ],
  character: [
    { field: 'imagePath', label: 'Portrait', aspect: '1 / 1', width: 1024, height: 1024 },
    { field: 'iconPath', label: 'Icon', aspect: '1 / 1', width: 256, height: 256 },
    { field: 'cardPath', label: 'Card', aspect: '2 / 3', width: 512, height: 768 },
    { field: 'heroPath', label: 'Hero', aspect: '16 / 9', width: 1280, height: 720 },
  ],
  reward: [
    { field: 'imagePath', label: 'Reward', aspect: '1 / 1', width: 1024, height: 1024 },
    { field: 'iconPath', label: 'Icon', aspect: '1 / 1', width: 256, height: 256 },
    { field: 'cardPath', label: 'Card', aspect: '2 / 3', width: 512, height: 768 },
    { field: 'heroPath', label: 'Hero', aspect: '16 / 9', width: 1280, height: 720 },
  ],
  scenario: [
    { field: 'imagePath', label: 'Scene', aspect: '16 / 9', width: 1536, height: 864 },
    { field: 'iconPath', label: 'Icon', aspect: '1 / 1', width: 256, height: 256 },
    { field: 'cardPath', label: 'Card', aspect: '2 / 3', width: 512, height: 768 },
    { field: 'heroPath', label: 'Hero', aspect: '16 / 9', width: 1280, height: 720 },
  ],
  bot: [
    { field: 'avatarImage', label: 'Avatar', aspect: '1 / 1', width: 1024, height: 1024 },
    { field: 'iconPath', label: 'Icon', aspect: '1 / 1', width: 256, height: 256 },
    { field: 'cardPath', label: 'Card', aspect: '2 / 3', width: 512, height: 768 },
    { field: 'heroPath', label: 'Hero', aspect: '16 / 9', width: 1280, height: 720 },
  ],
}

const typeLabel = computed(() => {
  if (props.objectType === 'bot') return 'Narrator'
  return props.objectType.charAt(0).toUpperCase() + props.objectType.slice(1)
})

const typeIcon = computed(() => {
  if (props.objectType === 'dream') return 'kind-icon:moon'
  if (props.objectType === 'character') return 'kind-icon:user'
  if (props.objectType === 'reward') return 'kind-icon:gift'
  if (props.objectType === 'scenario') return 'kind-icon:story'
  return 'kind-icon:robot'
})

const title = computed(() =>
  String(
    props.entity.title ||
      props.entity.name ||
      `${typeLabel.value} ${props.entity.id}`,
  ),
)

const summary = computed(() => {
  const candidates =
    props.objectType === 'character'
      ? [props.entity.presentation, props.entity.personality, props.entity.backstory]
      : props.objectType === 'reward'
        ? [props.entity.description, props.entity.effect, props.entity.flavorText]
        : props.objectType === 'scenario'
          ? [props.entity.description, props.entity.intros]
          : props.objectType === 'bot'
            ? [props.entity.subtitle, props.entity.tagline, props.entity.description]
            : [props.entity.pitch, props.entity.description, props.entity.flavorText]

  return (
    candidates.find((value) => typeof value === 'string' && value.trim()) ||
    'No summary has been written yet.'
  ) as string
})

const canEdit = computed(
  () =>
    userStore.isAdmin ||
    (Number(props.entity.userId) > 0 &&
      Number(props.entity.userId) === Number(userStore.userId)),
)

const editFields = computed(() => fieldConfig[props.objectType])
const artSlots = computed(() => slotConfig[props.objectType])

const displayImage = computed(() => {
  const nested = resolveEntityArtwork(props.entity.ArtImage)
  const direct = resolveEntityArtwork(props.entity)
  if (nested) return nested
  if (direct) return direct
  if (props.entity.artImageId) {
    return `/api/art/images/${props.entity.artImageId}/file`
  }
  return ''
})

const overviewRows = computed<OverviewRow[]>(() =>
  overviewFieldConfig[props.objectType].flatMap(([key, label]) => {
    const value = props.entity[key]
    const text = typeof value === 'string' ? value.trim() : ''
    return text ? [{ key, label, value: text }] : []
  }),
)

const badges = computed(() => {
  const values: unknown[] = []
  if (props.objectType === 'dream') {
    values.push(props.entity.dreamType)
  } else if (props.objectType === 'character') {
    values.push(props.entity.species, props.entity.class, props.entity.role)
  } else if (props.objectType === 'reward') {
    values.push(props.entity.rewardType, props.entity.rarity)
  } else if (props.objectType === 'scenario') {
    values.push(props.entity.tier, props.entity.genres)
    if (props.entity.difficulty) values.push(`Difficulty ${props.entity.difficulty}`)
  } else {
    values.push(props.entity.BotType, props.entity.subtitle)
  }
  return values
    .filter((value): value is string | number =>
      ['string', 'number'].includes(typeof value) && String(value).trim().length > 0,
    )
    .map(String)
})

const hasChanges = computed(() =>
  editFields.value.some(
    (field) => draft.value[field.key] !== stringValue(props.entity[field.key]),
  ),
)

const missingRequiredField = computed(() =>
  editFields.value.some(
    (field) => field.required && !draft.value[field.key]?.trim(),
  ),
)

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

function resetDraft(): void {
  draft.value = Object.fromEntries(
    editFields.value.map((field) => [field.key, stringValue(props.entity[field.key])]),
  )
  saveMessage.value = ''
  saveError.value = false
}

async function saveChanges(): Promise<void> {
  if (!canEdit.value || saving.value || !hasChanges.value) return

  const patch = Object.fromEntries(
    editFields.value.flatMap((field) => {
      const next = draft.value[field.key] ?? ''
      const current = stringValue(props.entity[field.key])
      return next !== current ? [[field.key, next]] : []
    }),
  )

  saving.value = true
  saveMessage.value = ''
  saveError.value = false
  const result = await archiveStore.updateObject(
    props.objectType,
    props.entity.id,
    patch,
  )
  saving.value = false
  saveMessage.value = result.message
  saveError.value = !result.success

  if (result.success && result.data) {
    Object.assign(props.entity, result.data)
    resetDraft()
    saveMessage.value = result.message
    emit('updated')
  }
}

async function handleArtUpdated(): Promise<void> {
  await archiveStore.fetchArchive(true)
  imageFailed.value = false
  emit('updated')
}

watch(
  () => [props.objectType, props.entity.id],
  () => {
    activeTab.value = 'overview'
    imageFailed.value = false
    resetDraft()
  },
  { immediate: true },
)
</script>
