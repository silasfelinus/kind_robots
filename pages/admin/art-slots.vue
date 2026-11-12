<template>
  <main class="playbook-studio kr-surface gap-0">
    <header-page-bar compact>
      <div
        class="flex min-w-0 flex-1 items-center gap-2"
        data-testid="art-slots-page-bar"
      >
        <span class="truncate text-sm font-bold uppercase tracking-[.14em]">
          Art slots
        </span>
        <button
          type="button"
          class="kr-btn-ghost ml-auto shrink-0"
          aria-label="Refresh"
          :disabled="isLoading"
          @click="slotStore.load()"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="size-4" />
        </button>
      </div>
    </header-page-bar>

    <div v-if="!ready" class="grid flex-1 place-items-center">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>
    <div
      v-else-if="!userStore.isAdmin"
      class="m-6 rounded-2xl border border-error/50 p-8 text-center"
    >
      <p class="text-lg font-black">Administrator access required</p>
    </div>

    <div v-else class="kr-scroll @container px-4 py-5 sm:px-8">
      <div class="min-w-0 max-w-3xl">
        <h2
          class="font-serif text-4xl font-black uppercase leading-none @3xl:text-5xl"
        >
          Choose the art
        </h2>
        <p class="mt-2 text-base-content/80">
          Every render made for one place an image is used, side by side. Pick
          the one the game should show. Copies with the same prompt, seed and
          model are the same picture and can go to the Recycle Bin.
        </p>
      </div>

      <form
        class="mt-5 flex flex-wrap items-end gap-3"
        @submit.prevent="slotStore.search()"
      >
        <label class="form-control w-full max-w-[14rem]">
          <span class="label-text text-xs font-bold uppercase">Project</span>
          <input
            v-model.trim="projectSlug"
            class="input input-bordered input-sm"
            placeholder="slime-city"
            autocomplete="off"
          />
        </label>
        <label class="form-control w-full max-w-[18rem]">
          <span class="label-text text-xs font-bold uppercase"
            >Slot key starts with</span
          >
          <input
            v-model.trim="prefix"
            class="input input-bordered input-sm"
            placeholder="slime-city/evolutions/"
            autocomplete="off"
          />
        </label>
        <label class="label cursor-pointer gap-2">
          <input
            v-model="multipleOnly"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          <span class="label-text">Only slots with a choice to make</span>
        </label>
        <button type="submit" class="btn btn-primary btn-sm">Show</button>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          :disabled="!projectSlug || isDeduping"
          title="Find copies with the same prompt, seed and model"
          @click="slotStore.dedupe(false)"
        >
          Find duplicates
        </button>
      </form>

      <p v-if="errorMessage" class="mt-4 text-error">{{ errorMessage }}</p>
      <p v-if="notice" class="mt-4 text-success">{{ notice }}</p>

      <div
        v-if="dedupePlan"
        class="mt-4 rounded-2xl border border-warning/60 p-4"
        data-testid="art-slots-dedupe-plan"
      >
        <p class="font-bold">
          {{ dedupePlan.count }} duplicate render(s) in
          {{ dedupePlan.slots }} slot(s).
        </p>
        <p class="text-sm text-base-content/70">
          The image in use, or else the oldest copy, is kept. Removed copies go
          to the Recycle Bin and can be restored.
        </p>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="btn btn-warning btn-sm"
            :disabled="!dedupePlan.count || isDeduping"
            @click="slotStore.dedupe(true)"
          >
            Move {{ dedupePlan.count }} to the Recycle Bin
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="dedupePlan = null"
          >
            Cancel
          </button>
        </div>
      </div>

      <p
        v-if="!isLoading && !slots.length"
        class="mt-8 text-center text-base-content/70"
      >
        No art slots match. Conductor registers a slot the first time a render
        for it finishes.
      </p>

      <section
        v-for="slot in slots"
        :key="slot.id"
        class="mt-6 rounded-2xl border border-base-content/15 p-4"
        :data-testid="`art-slot-${slot.id}`"
      >
        <header class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 class="min-w-0 break-all font-mono text-sm font-bold">
            {{ slot.slotKey }}
          </h3>
          <span v-if="slot.label" class="text-sm text-base-content/70">{{
            slot.label
          }}</span>
          <span class="ml-auto text-xs text-base-content/60">
            {{ liveCount(slot) }} candidate(s)
            <template v-if="slot.selectedArtImageId">
              · using #{{ slot.selectedArtImageId }}</template
            >
          </span>
        </header>
        <div
          class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          <article
            v-for="candidate in slot.candidates"
            :key="candidate.id"
            class="relative flex min-w-0 flex-col overflow-hidden rounded-xl border"
            :class="candidateClass(slot, candidate)"
          >
            <button
              type="button"
              class="relative block aspect-[2/3] w-full overflow-hidden bg-base-300"
              :aria-label="`Open ArtImage ${candidate.artImageId}`"
              @click="open(candidate.artImageId)"
            >
              <img
                v-if="candidate.thumbnailUrl"
                :src="candidate.thumbnailUrl"
                :alt="`Candidate ${candidate.artImageId}`"
                loading="lazy"
                class="size-full object-cover"
                :class="{
                  'blur-lg': candidate.isMature && !revealed[candidate.id],
                  'opacity-40': !candidate.isActive,
                }"
              />
              <span
                v-if="slot.selectedArtImageId === candidate.artImageId"
                class="badge badge-primary absolute left-2 top-2"
                >In use</span
              >
              <span
                v-else-if="candidate.verdict !== 'none'"
                class="badge absolute left-2 top-2"
                :class="verdictBadge(candidate.verdict)"
                >{{ candidate.verdict }}</span
              >
            </button>
            <div class="flex flex-1 flex-col gap-1 p-2 text-xs">
              <p class="truncate">
                #{{ candidate.artImageId }} · seed {{ candidate.seed ?? '—' }}
              </p>
              <p
                class="truncate text-base-content/60"
                :title="candidate.sourceRef || candidate.source"
              >
                {{ candidate.checkpoint || candidate.source }}
              </p>
              <div class="mt-auto flex flex-wrap gap-1 pt-1">
                <button
                  type="button"
                  class="btn btn-primary btn-xs"
                  :disabled="
                    isSaving ||
                    !candidate.isActive ||
                    slot.selectedArtImageId === candidate.artImageId
                  "
                  @click="slotStore.choose(slot, candidate)"
                >
                  Use
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  :aria-pressed="candidate.verdict === 'liked'"
                  aria-label="Like"
                  :disabled="isSaving"
                  @click="toggleVerdict(candidate, 'liked')"
                >
                  <Icon name="kind-icon:heart" class="size-3" />
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  :aria-pressed="candidate.verdict === 'rejected'"
                  aria-label="Reject"
                  :disabled="isSaving"
                  @click="toggleVerdict(candidate, 'rejected')"
                >
                  <Icon name="kind-icon:close" class="size-3" />
                </button>
                <button
                  v-if="candidate.isMature && !revealed[candidate.id]"
                  type="button"
                  class="btn btn-ghost btn-xs"
                  @click="revealed[candidate.id] = true"
                >
                  Show
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <nav
        v-if="pageCount > 1"
        class="mt-6 flex items-center justify-center gap-3"
        aria-label="Pages"
      >
        <button
          type="button"
          class="btn btn-sm"
          :disabled="page <= 1 || isLoading"
          @click="slotStore.goTo(page - 1)"
        >
          Previous
        </button>
        <span class="text-sm">Page {{ page }} of {{ pageCount }}</span>
        <button
          type="button"
          class="btn btn-sm"
          :disabled="page >= pageCount || isLoading"
          @click="slotStore.goTo(page + 1)"
        >
          Next
        </button>
      </nav>
    </div>

    <dialog ref="lightbox" class="modal" @close="fullSrc = ''">
      <div class="modal-box max-w-4xl p-2">
        <img
          v-if="fullSrc"
          :src="fullSrc"
          alt="Full-size candidate"
          class="mx-auto max-h-[80vh] w-auto"
        />
        <div v-else class="grid h-64 place-items-center">
          <span class="loading loading-spinner loading-lg" />
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Close">close</button>
      </form>
    </dialog>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '~/stores/userStore'
import {
  useArtSlotStore,
  type ArtSlot,
  type ArtSlotCandidate,
} from '~/stores/artSlotStore'

useHead({ title: 'Art slots' })

const userStore = useUserStore()
const slotStore = useArtSlotStore()
const {
  slots,
  page,
  pageCount,
  projectSlug,
  prefix,
  multipleOnly,
  isLoading,
  isSaving,
  isDeduping,
  errorMessage,
  notice,
  dedupePlan,
} = storeToRefs(slotStore)
const ready = ref(false)
const revealed = reactive<Record<number, boolean>>({})
const lightbox = ref<HTMLDialogElement | null>(null)
const fullSrc = ref('')

function liveCount(slot: ArtSlot) {
  return slot.candidates.filter((c) => c.verdict !== 'duplicate').length
}

function candidateClass(slot: ArtSlot, candidate: ArtSlotCandidate) {
  if (slot.selectedArtImageId === candidate.artImageId)
    return 'border-primary ring-2 ring-primary'
  if (candidate.verdict === 'duplicate' || !candidate.isActive)
    return 'border-base-content/10 opacity-60'
  return 'border-base-content/20'
}

function verdictBadge(verdict: string) {
  if (verdict === 'liked') return 'badge-success'
  if (verdict === 'rejected') return 'badge-error'
  return 'badge-ghost'
}

function toggleVerdict(candidate: ArtSlotCandidate, verdict: string) {
  void slotStore.setVerdict(
    candidate,
    candidate.verdict === verdict ? 'none' : verdict,
  )
}

async function open(artImageId: number) {
  fullSrc.value = ''
  lightbox.value?.showModal()
  fullSrc.value = await slotStore.fullImageSrc(artImageId)
}

onMounted(async () => {
  await userStore.initialize()
  ready.value = true
  if (userStore.isAdmin) await slotStore.load()
})
</script>

<style src="../../assets/css/playbook-studio.css"></style>
