<!-- /components/dreams/dream-gallery.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden">
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow md:flex-row md:items-center md:justify-between"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <Icon name="kind-icon:dream" class="h-7 w-7 text-primary" />
          <p class="text-xs font-black uppercase tracking-wide text-primary">
            Vibe Gallery
          </p>
          <span class="badge badge-outline rounded-xl">
            {{ filteredDreams.length }} Dream{{
              filteredDreams.length === 1 ? '' : 's'
            }}
          </span>
        </div>

        <h2 class="mt-1 text-2xl font-black text-base-content">
          {{ title }}
        </h2>

        <p class="mt-1 max-w-4xl text-sm text-base-content/65">
          {{ subtitle }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          :disabled="dreamStore.loading"
          @click="refresh"
        >
          <span
            v-if="dreamStore.loading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>

        <button
          type="button"
          class="btn btn-primary btn-sm rounded-2xl text-white"
          @click="startNewDream"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          New Dream
        </button>
      </div>
    </header>

    <section
      v-if="showControls"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm"
    >
      <div
        class="grid gap-2 lg:grid-cols-[minmax(0,1fr)_12rem_10rem_auto] lg:items-center"
      >
        <label
          class="input input-bordered input-sm flex items-center gap-2 rounded-2xl bg-base-100"
        >
          <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
          <input
            v-model="search"
            class="grow"
            type="search"
            placeholder="Search vibes, pitches, locations..."
          />
        </label>

        <select
          v-model="dreamTypeFilter"
          class="select select-bordered select-sm rounded-2xl bg-base-100"
        >
          <option value="">All types</option>
          <option
            v-for="type in dreamStore.dreamTypes"
            :key="type"
            :value="type"
          >
            {{ dreamTypeLabel(type) }}
          </option>
        </select>

        <select
          v-model="displayMode"
          class="select select-bordered select-sm rounded-2xl bg-base-100"
        >
          <option value="cards">Cards</option>
          <option value="dropdown">Dropdown</option>
        </select>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="showMine ? 'btn-secondary' : 'btn-outline'"
            @click="showMine = !showMine"
          >
            <Icon name="kind-icon:user" class="h-4 w-4" />
            Mine
          </button>

          <button
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="showInactive ? 'btn-warning' : 'btn-outline'"
            @click="showInactive = !showInactive"
          >
            <Icon name="kind-icon:archive" class="h-4 w-4" />
            Archived
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="displayMode === 'dropdown'"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm"
    >
      <select
        class="select select-bordered w-full rounded-2xl bg-base-200"
        :value="selectedDreamId"
        @change="previewFromDropdown"
      >
        <option value="">Choose a Dream...</option>
        <option
          v-for="dream in filteredDreams"
          :key="dream.id"
          :value="dream.id"
        >
          {{ dream.title || `Dream #${dream.id}` }} ·
          {{ dreamTypeLabel(dream.dreamType) }}
        </option>
      </select>
    </section>

    <main
      class="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm"
    >
      <div
        v-if="filteredDreams.length && displayMode === 'cards'"
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      >
        <article
          v-for="dream in filteredDreams"
          :key="dream.id"
          class="group flex min-h-52 cursor-pointer flex-col overflow-hidden rounded-2xl border bg-base-200 transition hover:-translate-y-0.5 hover:border-primary hover:shadow"
          :class="dreamCardClass(dream)"
          @click="previewDream(dream)"
        >
          <figure
            v-if="showImages"
            class="relative h-36 overflow-hidden border-b border-base-300 bg-base-300"
          >
            <img
              v-if="previewImage(dream)"
              :src="previewImage(dream)"
              :alt="`${dream.title || 'Dream'} preview`"
              class="h-full w-full object-cover transition group-hover:scale-[1.03]"
              loading="lazy"
            />

            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
            >
              <Icon name="kind-icon:dream" class="h-14 w-14 opacity-70" />
            </div>

            <div class="absolute left-2 top-2 flex flex-wrap gap-1">
              <span class="badge badge-primary badge-sm rounded-xl">
                {{ dreamTypeLabel(dream.dreamType) }}
              </span>

              <span
                v-if="dream.isMature"
                class="badge badge-warning badge-sm rounded-xl"
              >
                Mature
              </span>
            </div>
          </figure>

          <section class="flex min-h-0 flex-1 flex-col gap-2 p-3">
            <div class="min-w-0">
              <h3
                class="line-clamp-2 text-lg font-black leading-tight text-base-content"
              >
                {{ dream.title || 'Untitled Dream' }}
              </h3>

              <p
                v-if="showMeta"
                class="mt-1 text-xs font-medium text-base-content/45"
              >
                #{{ dream.id }}
                <span v-if="dream.designer"> · {{ dream.designer }}</span>
              </p>
            </div>

            <p
              v-if="showDescriptions"
              class="line-clamp-2 text-sm leading-relaxed text-base-content/65"
            >
              {{
                dream.pitch ||
                dream.description ||
                dream.flavorText ||
                'No Dream pitch yet.'
              }}
            </p>

            <div class="mt-auto flex flex-wrap gap-1">
              <span
                v-if="scenarioCount(dream)"
                class="badge badge-secondary badge-sm rounded-xl"
              >
                {{ scenarioCount(dream) }} Scenario{{
                  scenarioCount(dream) === 1 ? '' : 's'
                }}
              </span>

              <span
                v-if="characterCount(dream)"
                class="badge badge-accent badge-sm rounded-xl"
              >
                {{ characterCount(dream) }} Cast
              </span>

              <span
                v-if="artCount(dream)"
                class="badge badge-info badge-sm rounded-xl"
              >
                {{ artCount(dream) }} Art
              </span>
            </div>
          </section>

          <footer
            v-if="showCardActions"
            class="flex flex-wrap justify-end gap-2 border-t border-base-300 bg-base-100 p-2"
            @click.stop
          >
            <button
              type="button"
              class="btn btn-primary btn-xs rounded-xl text-white"
              :disabled="dreamStore.loading"
              @click="previewDream(dream)"
            >
              <Icon name="kind-icon:target" class="h-3 w-3" />
              Choose
            </button>

            <button
              type="button"
              class="btn btn-outline btn-xs rounded-xl"
              @click="editDream(dream)"
            >
              <Icon name="kind-icon:edit" class="h-3 w-3" />
              Edit
            </button>
          </footer>
        </article>
      </div>

      <div
        v-else-if="!filteredDreams.length"
        class="flex min-h-96 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-base-content/55"
      >
        <Icon name="kind-icon:ghost" class="h-14 w-14 text-primary/60" />
        <div>
          <p class="text-lg font-black">No Dreams found.</p>
          <p class="mt-1 text-sm">
            Make a vibe, loosen the filters, or gently bully the sorting goblin.
          </p>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-sm rounded-2xl text-white"
          @click="startNewDream"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Make a Dream
        </button>
      </div>

      <div
        v-else
        class="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-base-content/55"
      >
        <Icon name="kind-icon:list" class="h-14 w-14 text-primary/60" />
        <div>
          <p class="text-lg font-black">Dropdown mode active.</p>
          <p class="mt-1 text-sm">Choose a Dream from the dropdown above.</p>
        </div>
      </div>
    </main>

    <div
      v-if="pendingDream"
      class="fixed inset-0 z-50 flex items-center justify-center bg-neutral/70 p-4 backdrop-blur-sm"
      @click.self="closeDreamPreview"
    >
      <section
        class="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl"
      >
        <header
          class="flex flex-wrap items-start justify-between gap-3 border-b border-base-300 bg-base-200 p-4"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge badge-primary rounded-xl">
                {{ dreamTypeLabel(pendingDream.dreamType) }}
              </span>

              <span
                class="badge rounded-xl"
                :class="pendingDream.isPublic ? 'badge-success' : 'badge-ghost'"
              >
                {{ pendingDream.isPublic ? 'Public' : 'Private' }}
              </span>

              <span
                class="badge rounded-xl"
                :class="pendingDream.isActive ? 'badge-info' : 'badge-warning'"
              >
                {{ pendingDream.isActive ? 'Active' : 'Archived' }}
              </span>

              <span
                v-if="pendingDream.isMature"
                class="badge badge-warning rounded-xl"
              >
                Mature
              </span>
            </div>

            <h2 class="mt-2 text-2xl font-black text-base-content">
              {{ pendingDream.title || 'Untitled Dream' }}
            </h2>

            <p
              class="mt-2 line-clamp-4 text-sm leading-relaxed text-base-content/70"
            >
              {{
                pendingDream.pitch ||
                pendingDream.description ||
                pendingDream.flavorText ||
                'No Dream summary yet.'
              }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm"
            @click="closeDreamPreview"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
          </button>
        </header>

        <section
          class="grid max-h-[60vh] gap-3 overflow-y-auto p-4 md:grid-cols-[12rem_minmax(0,1fr)]"
        >
          <figure
            v-if="showImages"
            class="aspect-4/5 overflow-hidden rounded-2xl border border-base-300 bg-base-300"
          >
            <img
              v-if="previewImage(pendingDream)"
              :src="previewImage(pendingDream)"
              :alt="`${pendingDream.title || 'Dream'} preview`"
              class="h-full w-full object-cover"
              loading="lazy"
            />

            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
            >
              <Icon name="kind-icon:dream" class="h-16 w-16 opacity-70" />
            </div>
          </figure>

          <div class="grid gap-3">
            <div v-if="showStats" class="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-center"
              >
                <p class="text-2xl font-black text-primary">
                  {{ pendingRelatedDreams.length }}
                </p>
                <p class="text-xs text-base-content/55">Related</p>
              </div>

              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-center"
              >
                <p class="text-2xl font-black text-secondary">
                  {{ pendingScenarioCount }}
                </p>
                <p class="text-xs text-base-content/55">Scenarios</p>
              </div>

              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-center"
              >
                <p class="text-2xl font-black text-accent">
                  {{ pendingCharacterCount }}
                </p>
                <p class="text-xs text-base-content/55">Characters</p>
              </div>

              <div
                class="rounded-2xl border border-base-300 bg-base-200 p-3 text-center"
              >
                <p class="text-2xl font-black text-info">
                  {{ pendingArtCount + pendingRewardCount }}
                </p>
                <p class="text-xs text-base-content/55">Art / Rewards</p>
              </div>
            </div>

            <section
              v-if="pendingRelatedDreams.length"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-black text-primary">Related Dreams</h3>
                <span class="badge badge-primary badge-sm rounded-xl">
                  {{ pendingRelatedDreams.length }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="dream in pendingRelatedDreams.slice(0, 8)"
                  :key="`related-${dream.id}`"
                  class="badge badge-outline rounded-xl"
                >
                  {{ dream.title || `Dream #${dream.id}` }}
                </span>
              </div>
            </section>

            <section
              v-if="pendingScenarioRows.length"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-black text-secondary">Scenarios</h3>
                <span class="badge badge-secondary badge-sm rounded-xl">
                  {{ pendingScenarioRows.length }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="scenario in pendingScenarioRows.slice(0, 8)"
                  :key="`scenario-${scenario.id}`"
                  class="badge badge-secondary rounded-xl"
                >
                  {{ scenarioTitle(scenario) }}
                </span>
              </div>
            </section>

            <section
              v-if="pendingCharacterRows.length"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-black text-accent">Characters</h3>
                <span class="badge badge-accent badge-sm rounded-xl">
                  {{ pendingCharacterRows.length }}
                </span>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="character in pendingCharacterRows.slice(0, 10)"
                  :key="`character-${character.id}`"
                  class="badge badge-accent rounded-xl"
                >
                  {{ characterName(character) }}
                </span>
              </div>
            </section>

            <section
              class="rounded-2xl border border-primary/30 bg-primary/5 p-3"
            >
              <h3 class="font-black text-primary">Confirm Selection</h3>
              <p class="mt-1 text-sm leading-relaxed text-base-content/65">
                Selecting this Dream will load it as the active experience and
                move you to the Interact screen.
              </p>
            </section>
          </div>
        </section>

        <footer
          class="flex flex-wrap justify-end gap-2 border-t border-base-300 bg-base-200 p-4"
        >
          <button
            type="button"
            class="btn btn-ghost rounded-2xl"
            @click="closeDreamPreview"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary rounded-2xl text-white"
            :disabled="dreamStore.loading"
            @click="confirmDreamSelection"
          >
            <span
              v-if="dreamStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:target" class="h-4 w-4" />
            Select Dream
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type {
  ArtImage,
  Character,
  Reward,
  Scenario,
} from '~/prisma/generated/prisma/client'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'

type DreamScenarioWithCharacters = Scenario & {
  Characters?: Partial<Character>[]
}

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    showHeader?: boolean
    showControls?: boolean
    showImages?: boolean
    showCardActions?: boolean
    showStats?: boolean
    showMeta?: boolean
    showDescriptions?: boolean
    showScenarios?: boolean
    variant?: 'dashboard' | 'compact' | 'dropdown'
    openTab?: string
  }>(),
  {
    title: 'Dream Gallery',
    subtitle:
      'Browse Dreams as vibes, then choose one to load the connected experience.',
    showHeader: true,
    showControls: true,
    showImages: true,
    showCardActions: true,
    showStats: true,
    showMeta: true,
    showDescriptions: false,
    showScenarios: true,
    variant: 'dashboard',
    openTab: 'dreams',
  },
)

const emit = defineEmits<{
  (event: 'selected', dream: DreamWithRelations): void
  (event: 'opened', dream: DreamWithRelations): void
  (event: 'editing', dream: DreamWithRelations): void
  (event: 'created'): void
}>()

const dreamStore = useDreamStore()
const navStore = useNavStore()

const search = ref('')
const showMine = ref(false)
const showInactive = ref(false)
const dreamTypeFilter = ref('')
const displayMode = ref<'cards' | 'dropdown'>(
  props.variant === 'dropdown' ? 'dropdown' : 'cards',
)
const pendingDream = ref<DreamWithRelations | null>(null)

const selectedDreamId = computed(() => dreamStore.selectedDream?.id ?? '')

const dreamSource = computed(() => {
  return showInactive.value ? dreamStore.dreams : dreamStore.visibleDreams
})

const filteredDreams = computed(() => {
  const term = search.value.trim().toLowerCase()

  return dreamSource.value.filter((dream: DreamWithRelations) => {
    if (showMine.value && dream.userId !== dreamStore.currentUserId) {
      return false
    }

    if (dreamTypeFilter.value && dream.dreamType !== dreamTypeFilter.value) {
      return false
    }

    if (!term) return true

    return dreamSearchText(dream).toLowerCase().includes(term)
  })
})

const pendingScenarioRows = computed(() => {
  const dream = pendingDream.value
  if (!dream) return []

  return scenarioRowsForDream(dream)
})

const pendingCharacterRows = computed(() => {
  const dream = pendingDream.value
  if (!dream) return []

  return characterRowsForDream(dream)
})

const pendingRelatedDreams = computed(() => {
  const dream = pendingDream.value
  if (!dream) return []

  return dreamSource.value
    .filter((candidate) => candidate.id !== dream.id)
    .map((candidate) => ({
      dream: candidate,
      score: relationScore(dream, candidate),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => entry.dream)
})

const pendingScenarioCount = computed(() => {
  const dream = pendingDream.value
  if (!dream) return 0

  return scenarioCount(dream)
})

const pendingCharacterCount = computed(() => {
  const dream = pendingDream.value
  if (!dream) return 0

  return characterCount(dream)
})

const pendingArtCount = computed(() => {
  const dream = pendingDream.value
  if (!dream) return 0

  return artCount(dream)
})

const pendingRewardCount = computed(() => {
  return pendingDream.value?.Rewards?.length ?? 0
})

onMounted(async () => {
  await dreamStore.initialize({ fetchRemote: true })
})

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function refresh() {
  await dreamStore.fetchDreams({ showInactive: showInactive.value })
}

function startNewDream() {
  dreamStore.startAddingDream()
  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('created')
}

function previewDream(dream: DreamWithRelations) {
  pendingDream.value = dream
}

function closeDreamPreview() {
  pendingDream.value = null
}

function previewFromDropdown(event: Event) {
  const id = Number((event.target as HTMLSelectElement).value)
  if (!Number.isInteger(id) || id <= 0) return

  const dream = filteredDreams.value.find((item) => item.id === id)
  if (!dream) return

  previewDream(dream)
}

async function confirmDreamSelection() {
  const dream = pendingDream.value
  if (!dream) return

  const selected = await dreamStore.selectDreamById(dream.id)
  if (!selected) return

  await dreamStore.fetchArtForDream(dream.id)

  pendingDream.value = null

  emit('selected', selected)
  emit('opened', selected)
}

async function editDream(dream: DreamWithRelations) {
  const editing = await dreamStore.startEditingDream(dream.id)
  if (!editing) return

  navStore.setDashboardTab?.('dream', 'dreammaker')
  emit('editing', editing)
}

function dreamCardClass(dream: DreamWithRelations) {
  if (dreamStore.selectedDream?.id === dream.id) {
    return 'border-primary bg-primary/10 ring-2 ring-primary/20'
  }

  if (dream.isActive === false) return 'border-base-300 opacity-70'

  return 'border-base-300'
}

function scenarioCount(dream: DreamWithRelations) {
  return (
    dream._count?.Scenarios ??
    dream.Scenarios?.length ??
    (dream.Scenario ? 1 : 0)
  )
}

function characterCount(dream: DreamWithRelations) {
  return dream._count?.Characters ?? dream.Characters?.length ?? 0
}

function artCount(dream: DreamWithRelations) {
  return dream._count?.ArtImages ?? collectionArt(dream).length ?? 0
}

function scenarioRowsForDream(dream: DreamWithRelations) {
  const rows = [
    dream.Scenario,
    ...((dream.Scenarios ?? []) as DreamScenarioWithCharacters[]),
  ].filter(Boolean) as DreamScenarioWithCharacters[]

  return uniqueById(rows)
}

function characterRowsForDream(dream: DreamWithRelations) {
  const direct = dream.Characters ?? []
  const scenarioCast = scenarioRowsForDream(dream).flatMap(
    (scenario) => scenario.Characters ?? [],
  )

  return uniqueById([...direct, ...scenarioCast] as Character[])
}

function collectionArt(dream: DreamWithRelations) {
  return [
    ...(dream.ArtImages ?? []),
    ...(dream.ArtCollection?.ArtImages ?? []),
    ...(dream.ArtCollections ?? []).flatMap(
      (collection) => collection.ArtImages ?? [],
    ),
  ] as ArtImage[]
}

function previewImage(dream: DreamWithRelations) {
  const firstCollectionImage = collectionArt(dream).find((art) => {
    return art.imagePath || art.path || art.fileName
  })

  return (
    dream.imagePath ||
    dream.highlightImage ||
    dream.ArtImage?.imagePath ||
    dream.ArtImage?.path ||
    dream.ArtImage?.fileName ||
    firstCollectionImage?.imagePath ||
    firstCollectionImage?.path ||
    firstCollectionImage?.fileName ||
    ''
  )
}

function scenarioTitle(scenario: Partial<Scenario>) {
  return scenario.title || `Scenario #${scenario.id}`
}

function characterName(character: Partial<Character>) {
  return (
    character.name ||
    character.title ||
    character.honorific ||
    `Character #${character.id}`
  )
}

function dreamSearchText(dream: DreamWithRelations) {
  const scenarioText = (
    (dream.Scenarios ?? []) as DreamScenarioWithCharacters[]
  )
    .map((scenario) => {
      const characterText =
        scenario.Characters?.map((character) =>
          [
            character.name,
            character.honorific,
            character.title,
            character.role,
            character.class,
            character.species,
            character.genre,
          ]
            .filter(Boolean)
            .join(' '),
        ).join(' ') ?? ''

      return [
        scenario.title,
        scenario.description,
        scenario.locations,
        scenario.genres,
        scenario.inspirations,
        characterText,
      ]
        .filter(Boolean)
        .join(' ')
    })
    .join(' ')

  const characterText = (dream.Characters ?? [])
    .map((character) =>
      [
        character.name,
        character.honorific,
        character.title,
        character.role,
        character.class,
        character.species,
        character.genre,
      ]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ')

  const rewardText = (dream.Rewards ?? [])
    .map((reward: Reward) =>
      [reward.name, reward.description, reward.rarity, reward.rewardType]
        .filter(Boolean)
        .join(' '),
    )
    .join(' ')

  return [
    dream.title,
    dream.slug,
    dream.pitch,
    dream.description,
    dream.flavorText,
    dream.artPrompt,
    dream.examples,
    dream.designer,
    dream.dreamType,
    scenarioText,
    characterText,
    rewardText,
  ]
    .filter(Boolean)
    .join(' ')
}

function relationScore(source: DreamWithRelations, target: DreamWithRelations) {
  let score = 0

  if (source.dreamType && source.dreamType === target.dreamType) score += 2

  score += sharedCount(dreamScenarioIds(source), dreamScenarioIds(target)) * 5
  score += sharedCount(dreamCharacterIds(source), dreamCharacterIds(target)) * 4
  score += sharedCount(dreamRewardIds(source), dreamRewardIds(target)) * 3
  score += sharedCount(
    tokenSet(dreamSearchText(source)),
    tokenSet(dreamSearchText(target)),
  )

  return score
}

function dreamScenarioIds(dream: DreamWithRelations) {
  return new Set(
    [
      dream.Scenario?.id,
      ...(dream.Scenarios ?? []).map((scenario) => scenario.id),
    ].filter((id): id is number => Number.isInteger(id)),
  )
}

function dreamCharacterIds(dream: DreamWithRelations) {
  const scenarioCharactersList = (
    (dream.Scenarios ?? []) as DreamScenarioWithCharacters[]
  )
    .flatMap((scenario) => scenario.Characters ?? [])
    .map((character) => character.id)

  return new Set(
    [
      ...(dream.Characters ?? []).map((character) => character.id),
      ...scenarioCharactersList,
    ].filter((id): id is number => Number.isInteger(id)),
  )
}

function dreamRewardIds(dream: DreamWithRelations) {
  return new Set(
    (dream.Rewards ?? [])
      .map((reward: Reward) => reward.id)
      .filter((id): id is number => Number.isInteger(id)),
  )
}

function sharedCount<T>(first: Set<T>, second: Set<T>) {
  let count = 0

  first.forEach((value) => {
    if (second.has(value)) count += 1
  })

  return count
}

function tokenSet(text: string) {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'from',
    'that',
    'this',
    'into',
    'where',
    'when',
    'what',
    'are',
    'you',
    'your',
    'dream',
    'vibe',
    'story',
    'stories',
  ])

  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .map((token) => token.trim())
      .filter((token) => token.length > 2 && !stopWords.has(token)),
  )
}

function uniqueById<T extends { id?: number | null }>(items: T[]) {
  const seen = new Set<number>()
  const unique: T[] = []

  items.forEach((item) => {
    const id = Number(item?.id)
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) return

    seen.add(id)
    unique.push(item)
  })

  return unique
}
</script>
