<!-- /components/content/dream/dream-gallery.vue -->
<template>
  <section class="container mx-auto flex w-full flex-col gap-4 p-4">
    <header
      class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0">
        <h1 class="text-3xl font-black text-primary">Dream Gallery</h1>
        <p class="mt-1 text-sm text-base-content/70">
          Browse, select, edit, and continue shared dreams.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-secondary rounded-2xl"
          @click="openCreateDream"
        >
          <Icon name="kind-icon:moon" class="h-5 w-5" />
          New Dream
        </button>

        <button
          type="button"
          class="btn btn-sm btn-ghost rounded-2xl"
          @click="
            dreamStore.fetchDreams({ userOnly, includeMature, showInactive })
          "
        >
          <Icon name="kind-icon:refresh" class="h-5 w-5" />
          Refresh
        </button>
      </div>
    </header>

    <section
      class="grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 md:grid-cols-[1fr_auto_auto_auto]"
    >
      <input
        v-model="search"
        class="input input-bordered rounded-2xl"
        placeholder="Search dreams..."
      />

      <select v-model="scope" class="select select-bordered rounded-2xl">
        <option value="all">All visible</option>
        <option value="mine">My dreams</option>
        <option value="public">Public only</option>
      </select>

      <label
        class="label cursor-pointer justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 px-3"
      >
        <span class="label-text font-semibold">Mature</span>
        <input
          v-model="includeMature"
          type="checkbox"
          class="toggle toggle-warning"
          @change="refreshDreams"
        />
      </label>

      <label
        class="label cursor-pointer justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 px-3"
      >
        <span class="label-text font-semibold">Inactive</span>
        <input
          v-model="showInactive"
          type="checkbox"
          class="toggle toggle-primary"
          @change="refreshDreams"
        />
      </label>
    </section>

    <div
      v-if="dreamStore.loading"
      class="flex min-h-40 items-center justify-center rounded-2xl border border-base-300 bg-base-100"
    >
      <span class="loading loading-ring loading-lg text-primary" />
    </div>

    <div
      v-else-if="filteredDreams.length === 0"
      class="rounded-2xl border border-base-300 bg-base-100 p-8 text-center"
    >
      <Icon name="kind-icon:moon" class="mx-auto h-14 w-14 text-primary" />
      <h2 class="mt-3 text-xl font-black">No dreams found</h2>
      <p class="mt-1 text-sm text-base-content/60">
        Either the gallery is empty or the filters are being dramatic.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4"
    >
      <article
        v-for="dream in filteredDreams"
        :key="dream.id"
        class="group flex min-h-72 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-md transition hover:-translate-y-0.5 hover:shadow-xl"
      >
        <button
          type="button"
          class="relative h-36 w-full overflow-hidden bg-base-300 text-left"
          @click="selectDream(dream.id)"
        >
          <img
            v-if="dream.Art?.imagePath"
            :src="dream.Art.imagePath"
            :alt="dream.title || 'Dream'"
            class="h-full w-full object-cover transition group-hover:scale-105"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/20 to-accent/20"
          >
            <Icon name="kind-icon:moon" class="h-16 w-16 text-primary" />
          </div>

          <div class="absolute left-2 top-2 flex flex-wrap gap-1">
            <span
              class="badge badge-sm"
              :class="dream.isPublic ? 'badge-success' : 'badge-warning'"
            >
              {{ dream.isPublic ? 'Public' : 'Private' }}
            </span>

            <span v-if="dream.isMature" class="badge badge-sm badge-error">
              Mature
            </span>
          </div>
        </button>

        <div class="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div class="min-w-0">
            <h2 class="truncate text-lg font-black">
              {{ dream.title || `Dream ${dream.id}` }}
            </h2>
            <p
              class="mt-1 line-clamp-3 text-sm leading-relaxed text-base-content/65"
            >
              {{ dream.currentVibe || 'No vibe recorded.' }}
            </p>
          </div>

          <div class="mt-auto grid grid-cols-3 gap-2 text-center text-xs">
            <div class="rounded-2xl bg-base-200 p-2">
              <div class="font-black">
                {{ dream._count?.Chats ?? dream.Chats?.length ?? 0 }}
              </div>
              <div class="text-base-content/50">Chats</div>
            </div>

            <div class="rounded-2xl bg-base-200 p-2">
              <div class="font-black">
                {{ dream._count?.Reactions ?? dream.Reactions?.length ?? 0 }}
              </div>
              <div class="text-base-content/50">Reacts</div>
            </div>

            <div class="rounded-2xl bg-base-200 p-2">
              <div class="font-black">
                {{ dream.ArtCollection?.art?.length ?? 0 }}
              </div>
              <div class="text-base-content/50">Art</div>
            </div>
          </div>

          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-xs btn-primary flex-1 rounded-2xl text-white"
              @click="selectDream(dream.id)"
            >
              Open
            </button>

            <button
              type="button"
              class="btn btn-xs btn-secondary flex-1 rounded-2xl"
              @click="openEditDream(dream.id)"
            >
              Edit
            </button>

            <button
              type="button"
              class="btn btn-xs btn-error rounded-2xl text-white"
              @click="deleteDream(dream.id)"
            >
              <Icon name="kind-icon:trash" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <dialog ref="editDialog" class="modal">
      <div class="modal-box max-w-4xl bg-transparent p-0 shadow-none">
        <EditDreamPanel @close="closeEditModal" />
      </div>

      <form method="dialog" class="modal-backdrop">
        <button type="button" @click="closeEditModal">close</button>
      </form>
    </dialog>
  </section>
</template>

<script setup lang="ts">
// /components/content/dream/dream-gallery.vue
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useUserStore } from '@/stores/userStore'
import EditDreamPanel from '@/components/dreams/edit-dream.vue'

const dreamStore = useDreamStore()
const userStore = useUserStore()

const search = ref('')
const scope = ref<'all' | 'mine' | 'public'>('all')
const includeMature = ref(false)
const showInactive = ref(false)
const editDialog = ref<HTMLDialogElement | null>(null)

async function openEditDream(id: number) {
  await dreamStore.selectDreamById(id)
  editDialog.value?.showModal()
}

const userOnly = computed(() => scope.value === 'mine')

const filteredDreams = computed(() => {
  const query = search.value.trim().toLowerCase()

  return dreamStore.dreams.filter((dream) => {
    if (scope.value === 'mine' && dream.userId !== userStore.userId)
      return false
    if (scope.value === 'public' && !dream.isPublic) return false
    if (!includeMature.value && dream.isMature) return false
    if (!showInactive.value && !dream.isActive) return false

    if (!query) return true

    const haystack = [
      dream.title,
      dream.description,
      dream.currentVibe,
      dream.currentPrompt,
      dream.slug,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

async function refreshDreams() {
  await dreamStore.fetchDreams({
    userOnly: userOnly.value,
    includeMature: includeMature.value,
    showInactive: showInactive.value,
  })
}

function openCreateDream() {
  dreamStore.createNewDream()
  editDialog.value?.showModal()
}

async function selectDream(id: number) {
  await dreamStore.selectDreamById(id)
}

async function editDream(id: number) {
  await dreamStore.selectDreamById(id)
  editDialog.value?.showModal()
}

function closeEditModal() {
  editDialog.value?.close()
}

async function deleteDream(id: number) {
  const result = await dreamStore.deleteDream(id)

  if (result.success) {
    await refreshDreams()
  }
}

onMounted(async () => {
  await dreamStore.initialize()
  await refreshDreams()
})
</script>
