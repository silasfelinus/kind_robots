<!-- /components/art/artjob-queue-card.vue -->
<template>
  <!--
    A mature job does not exist for a maturity-restricted account.

    Not hidden, not placeholdered -- absent. Silas, 2026-09-17: "a mature object
    should not even look like it exists for children accounts, so that things
    like text should not be viewable either." The prompt was already behind
    canShowJobContent, but the title, the destination and the linked resource
    name were not, so a CHILD could read what a mature job was for and which
    LoRA it belonged to.

    userStore.showMature already reads false for a CHILD even when they set it
    and even when they are also an ADMIN, so this needs no separate rule -- it
    needs the whole card to stop rendering.
  -->
  <article
    v-if="!hiddenFromViewer"
    class="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200/30"
  >
    <div
      v-if="job.status === 'DONE'"
      class="relative flex aspect-[4/3] min-h-52 w-full items-center justify-center overflow-hidden bg-base-100"
    >
      <a
        v-if="jobImageSrc && canShowJobContent"
        :href="jobImageSrc"
        target="_blank"
        rel="noopener"
        class="block h-full w-full"
        :title="`Open ArtImage ${job.artImageId}`"
      >
        <video
          v-if="jobImageKind === 'video'"
          :src="jobImageSrc"
          class="h-full w-full object-contain"
          muted
          playsinline
          preload="metadata"
        />
        <img
          v-else
          :src="jobImageSrc"
          alt="Generated ArtJob output"
          class="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
          data-missing-image-report="false"
        />
      </a>

      <button
        v-else-if="canRevealMatureJob"
        type="button"
        class="group flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 border-dashed border-warning/30 bg-warning/5 p-5 text-center transition hover:bg-warning/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-warning"
        :aria-label="`Reveal mature ArtJob ${job.id}`"
        @click="revealMatureJob"
      >
        <Icon
          name="kind-icon:eye"
          class="h-6 w-6 text-warning/70 transition group-hover:text-warning"
        />
        <span
          class="kr-text-eyebrow text-xs tracking-widest text-base-content/45"
        >
          Mature hidden
        </span>
        <span class="text-xs text-warning-content/80">Click to reveal</span>
      </button>

      <div
        v-else
        class="flex h-full w-full flex-col items-center justify-center gap-3 border-dashed border-base-300 bg-base-100 p-5 text-center"
      >
        <span
          class="kr-text-eyebrow text-xs tracking-widest text-base-content/35"
        >
          {{ canShowJobContent ? previewPlaceholder : 'Mature hidden' }}
        </span>
        <button
          v-if="canLoadProtectedPreview"
          type="button"
          class="kr-btn-outline-plain rounded-2xl"
          :disabled="isLoadingPreview"
          @click="revealPrivateOutput()"
        >
          <span v-if="isLoadingPreview" class="kr-spinner-xs" />
          {{
            isLoadingPreview
              ? 'Loading preview'
              : adminMayOverridePrivate
                ? 'Admin override · show private output'
                : 'Load preview'
          }}
        </button>
        <p
          v-if="!canShowJobContent"
          class="max-w-sm text-xs text-warning-content"
        >
          {{ hiddenMatureMessage }}
        </p>
      </div>

      <button
        v-if="canHideMatureJob"
        type="button"
        class="kr-btn-xs-2xl btn-warning btn-outline absolute bottom-2 right-2 z-10 bg-base-100/80"
        :aria-label="`Hide mature ArtJob ${job.id} again`"
        @click.stop.prevent="hideMatureJob"
      >
        <Icon name="kind-icon:eye" class="kr-icon-4" />
        Hide
      </button>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span class="badge badge-neutral badge-sm rounded-2xl font-mono">
          #{{ job.id }}
        </span>
        <span
          class="kr-badge-sm rounded-2xl"
          :class="jobStatusClass(job.status)"
        >
          {{ job.status }}
        </span>
      </div>

      <div
        class="absolute right-2 top-2 flex max-w-[65%] flex-wrap justify-end gap-1"
      >
        <span class="kr-badge-outline-sm rounded-2xl">
          {{ job.engine }}
        </span>
        <span
          v-if="job.priority > 0"
          class="badge badge-accent badge-sm rounded-2xl"
        >
          Priority {{ job.priority }}
        </span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3 p-3">
      <div
        v-if="job.status !== 'DONE'"
        class="flex flex-wrap items-center justify-between gap-2"
      >
        <div class="flex flex-wrap gap-1">
          <span class="badge badge-neutral badge-sm rounded-2xl font-mono">
            #{{ job.id }}
          </span>
          <span
            class="kr-badge-sm rounded-2xl"
            :class="jobStatusClass(job.status)"
          >
            {{ job.status }}
          </span>
        </div>
        <div class="flex flex-wrap justify-end gap-1">
          <span class="kr-badge-outline-sm rounded-2xl">
            {{ job.engine }}
          </span>
          <span
            v-if="job.priority > 0"
            class="badge badge-accent badge-sm rounded-2xl"
          >
            Priority {{ job.priority }}
          </span>
        </div>
      </div>

      <div class="min-w-0">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <h3 class="kr-text-black-base truncate" :title="jobTitle">
              {{ jobTitle }}
            </h3>
            <p
              v-if="jobPageLabel"
              class="mt-0.5 truncate text-xs font-semibold text-primary"
              :title="jobPageLabel"
            >
              Destination · {{ jobPageLabel }}
            </p>

            <!-- What this image was made for. Only an entity origin has
                 somewhere to go; the rest state themselves and stop. -->
            <button
              v-if="resolvedOrigin?.exists"
              type="button"
              class="mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs font-semibold text-secondary hover:underline"
              :title="`View ${originTypeLabel}: ${originLabel}`"
              @click="showOriginCard = true"
            >
              <Icon name="kind-icon:link" class="h-3 w-3 shrink-0" />
              <span class="truncate">{{ originTypeLabel }} · {{ originLabel }}</span>
            </button>
            <p
              v-else-if="originText"
              class="mt-0.5 truncate text-xs text-base-content/55"
              :title="originText"
            >
              {{ originText }}
            </p>
          </div>
          <span v-if="jobVariant" class="kr-badge-ghost-sm rounded-2xl">
            {{ jobVariant }}
          </span>
        </div>

        <p
          v-if="jobImagePath"
          class="mt-1 truncate font-mono text-[10px] text-base-content/45"
          :title="jobImagePath"
        >
          {{ jobImagePath }}
        </p>
      </div>

      <div class="flex flex-wrap gap-1">
        <span
          class="kr-badge-sm rounded-2xl"
          :class="jobVisibility.isMature ? 'badge-warning' : 'badge-outline'"
        >
          {{ jobVisibility.isMature ? 'Mature' : 'General' }}
        </span>
        <span
          class="kr-badge-sm rounded-2xl"
          :class="
            jobVisibility.isPublic
              ? 'badge-success badge-outline'
              : 'badge-neutral'
          "
        >
          {{ jobVisibility.isPublic ? 'Public' : 'Private' }}
        </span>
        <span v-if="job.projectSlug" class="kr-badge-secondary-sm rounded-2xl">
          {{ job.projectSlug }}
        </span>
        <span
          v-if="jobRequestId"
          class="kr-badge-ghost-sm max-w-full truncate rounded-2xl"
          :title="jobRequestId"
        >
          {{ jobRequestId }}
        </span>
      </div>

      <p
        v-if="canShowJobContent"
        class="line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed"
      >
        {{ jobPrompt || 'Prompt unavailable.' }}
      </p>
      <div
        v-else
        class="flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-2 text-xs text-warning-content"
      >
        <span class="min-w-0 flex-1">{{ hiddenMatureMessage }}</span>
        <button
          v-if="canRevealMatureJob"
          type="button"
          class="kr-btn-outline-plain rounded-2xl"
          :aria-label="`Reveal mature ArtJob ${job.id}`"
          @click="revealMatureJob"
        >
          <Icon name="kind-icon:eye" class="kr-icon-4" />
          Reveal
        </button>
      </div>

      <div class="flex flex-wrap gap-1">
        <span
          v-for="setting in jobSettings.slice(0, 6)"
          :key="setting"
          class="kr-badge-ghost-sm h-auto rounded-2xl py-1 text-[10px]"
        >
          {{ setting }}
        </span>
      </div>

      <p
        v-if="runningStartedAt !== null && runningElapsed"
        class="flex flex-wrap items-center gap-x-1 text-[11px] font-semibold text-info"
      >
        <span>Actively processing {{ runningElapsed }}</span>
        <span class="text-base-content/40">·</span>
        <span class="font-normal text-base-content/55">
          started {{ formatDateTime(processingStartedAtValue) }}
        </span>
      </p>

      <p class="text-[11px] text-base-content/50">
        Queued {{ formatDateTime(job.createdAt) }}
        <template v-if="jobFinishedAtValue">
          · Finished {{ formatDateTime(jobFinishedAtValue) }}
        </template>
        · attempt {{ job.attempts }} · priority {{ job.priority }}
      </p>

      <div
        v-if="job.error"
        class="kr-text-error-xs rounded-2xl border border-error/30 bg-error/10 p-2"
      >
        <span v-if="errorIsFromEarlierAttempt" class="font-semibold">
          Earlier attempt ·
        </span>
        {{ job.error }}
      </div>

      <details class="kr-panel-flat">
        <summary class="cursor-pointer px-3 py-2 text-xs font-semibold">
          Full brief and generation fields
        </summary>
        <div class="flex flex-col gap-3 kr-panel-footer-bare text-xs">
          <div
            v-if="!canShowJobContent"
            class="flex flex-wrap items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-warning-content"
          >
            <span class="min-w-0 flex-1">{{ hiddenMatureMessage }}</span>
            <button
              v-if="canRevealMatureJob"
              type="button"
              class="kr-btn-outline-plain rounded-2xl"
              :aria-label="`Reveal mature ArtJob ${job.id}`"
              @click="revealMatureJob"
            >
              <Icon name="kind-icon:eye" class="kr-icon-4" />
              Reveal
            </button>
          </div>
          <template v-else>
            <div v-if="jobPageLabel || jobImagePath">
              <div
                class="font-semibold uppercase tracking-wide text-base-content/50"
              >
                Destination
              </div>
              <p v-if="jobPageLabel" class="mt-1">{{ jobPageLabel }}</p>
              <p
                v-if="jobImagePath"
                class="mt-1 break-all font-mono text-[10px] text-base-content/70"
              >
                {{ jobImagePath }}
              </p>
            </div>
            <div>
              <div
                class="font-semibold uppercase tracking-wide text-base-content/50"
              >
                Prompt
              </div>
              <p class="mt-1 whitespace-pre-wrap leading-relaxed">
                {{ jobPrompt }}
              </p>
            </div>
            <div>
              <div
                class="font-semibold uppercase tracking-wide text-base-content/50"
              >
                Negative prompt
              </div>
              <p class="mt-1 whitespace-pre-wrap text-base-content/70">
                {{ jobNegativePrompt || 'None' }}
              </p>
            </div>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="setting in jobSettings"
                :key="setting"
                class="kr-badge-outline-sm h-auto rounded-2xl py-1 text-[10px]"
              >
                {{ setting }}
              </span>
            </div>
          </template>
        </div>
      </details>

      <div class="mt-auto flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          class="kr-btn-ghost-xs-2xl"
          :disabled="!jobPrompt || !canShowJobContent"
          :title="
            canShowJobContent
              ? 'Copy prompt'
              : 'Reveal mature content before copying this prompt'
          "
          @click="handleCopy"
        >
          {{ copied ? 'Copied' : 'Copy prompt' }}
        </button>

        <div class="flex flex-wrap items-center justify-end gap-1">
          <button
            v-if="job.status === 'PENDING'"
            type="button"
            class="kr-btn-xs-2xl"
            :class="job.priority > 0 ? 'btn-outline' : 'btn-accent'"
            :disabled="priorityStore.prioritizingJobIds.includes(job.id)"
            @click="togglePriority"
          >
            <span
              v-if="priorityStore.prioritizingJobIds.includes(job.id)"
              class="kr-spinner-xs"
            />
            {{ job.priority > 0 ? 'Normal priority' : 'Move to front' }}
          </button>
          <button
            v-if="isEditableInPlace"
            type="button"
            class="btn btn-primary btn-xs rounded-2xl"
            :disabled="!canShowJobContent"
            @click="emit('edit', job, 'EDIT')"
          >
            Edit & queue
          </button>
          <button
            v-else-if="job.status === 'RUNNING'"
            type="button"
            class="btn btn-primary btn-xs rounded-2xl"
            :disabled="!canShowJobContent"
            @click="emit('edit', job, 'NEW_OUTPUT')"
          >
            Edit as new job
          </button>
          <button
            v-if="job.status === 'DONE'"
            type="button"
            class="btn btn-primary btn-xs rounded-2xl"
            :disabled="!canShowJobContent"
            @click="emit('edit', job, 'NEW_OUTPUT')"
          >
            Edited output
          </button>
          <button
            v-if="job.status === 'DONE' && job.artImageId"
            type="button"
            class="btn btn-warning btn-xs rounded-2xl"
            :disabled="!canShowJobContent"
            @click="emit('edit', job, 'OVERWRITE')"
          >
            Edit & replace
          </button>
          <button
            v-if="job.status === 'FAILED'"
            type="button"
            class="kr-btn-ghost-xs-2xl"
            @click="artJobStore.requeueJob(job.id)"
          >
            Resume unchanged
          </button>
          <button
            v-if="
              job.status === 'PENDING' ||
              job.status === 'RUNNING' ||
              job.status === 'FAILED'
            "
            type="button"
            class="btn btn-ghost btn-xs rounded-2xl text-error"
            @click="artJobStore.cancelJob(job.id)"
          >
            {{ job.status === 'FAILED' ? 'Clear failure' : 'Cancel' }}
          </button>
        </div>
      </div>
    </div>
      <EntityObjectCard
      v-if="showOriginCard && resolvedOrigin"
      :link="resolvedOrigin"
      @close="showOriginCard = false"
    />
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useArtJobStore, type ArtJobRecord } from '@/stores/artJobStore'
import { useArtJobPriorityStore } from '@/stores/artJobPriorityStore'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'
import { useEntityArtLinkStore } from '@/stores/entityArtLinkStore'
import { entityArtTypeLabel } from '@/utils/entityArtLink'
import EntityObjectCard from '@/components/art/entity-object-card.vue'
import {
  artJobOrigin,
  artJobOriginLabel,
  artJobFinishedAt,
  artJobImagePath,
  artJobImageVersion,
  artJobNegativePrompt,
  artJobPageLabel,
  artJobPrompt,
  artJobPublicImageSrc,
  artJobRequestId,
  artJobSettings,
  artJobTitle,
  artJobVariant,
  artJobVisibility,
} from '@/utils/artJobFields'

type EditorAction = 'EDIT' | 'NEW_OUTPUT' | 'OVERWRITE'

const props = defineProps<{
  job: ArtJobRecord
}>()

const emit = defineEmits<{
  edit: [job: ArtJobRecord, action: EditorAction]
}>()

const artJobStore = useArtJobStore()
const priorityStore = useArtJobPriorityStore()
const artStore = useArtStore()
const userStore = useUserStore()
const entityArtLinkStore = useEntityArtLinkStore()
const copied = ref(false)
const locallyRevealedMature = ref(false)
const runningElapsed = ref('')
let runningTimer: ReturnType<typeof setInterval> | null = null

const jobPrompt = computed<string>(() => artJobPrompt(props.job))

const jobNegativePrompt = computed<string>(() =>
  artJobNegativePrompt(props.job),
)

const jobVisibility = computed(() => artJobVisibility(props.job))

const ownsJob = computed<boolean>(() => {
  const viewerId = userStore.userId
  return typeof viewerId === 'number' && props.job.userId === viewerId
})

const canShowJobContent = computed<boolean>(
  () =>
    !jobVisibility.value.isMature ||
    artStore.showMature ||
    locallyRevealedMature.value,
)

/** Only a DONE job renders the image block that carries the click-to-reveal. */
const hasPreviewSurface = computed<boolean>(() => props.job.status === 'DONE')

const canRevealMatureJob = computed<boolean>(() => {
  return (
    jobVisibility.value.isMature &&
    !canShowJobContent.value &&
    !userStore.isMaturityRestricted &&
    (jobVisibility.value.isPublic || ownsJob.value)
  )
})

const hiddenMatureMessage = computed<string>(() => {
  if (userStore.isMaturityRestricted) {
    return 'Mature content is unavailable for this account.'
  }
  if (!jobVisibility.value.isPublic && !ownsJob.value) {
    return "Inline reveal is unavailable for another user's private job."
  }
  /*
   * Only a DONE job renders a preview surface to click (see the
   * `job.status === 'DONE'` guard on the preview block). Telling the owner of a
   * FAILED or still-queued mature job to "click the preview" pointed at an
   * affordance that was never rendered, so its prompt -- and on a failure, the
   * error context that makes the prompt worth reading -- could not be reached
   * at all. Silas hit this on ArtJob 22838, 2026-09-16.
   */
  if (!hasPreviewSurface.value) {
    return 'Mature prompt is hidden. Use Reveal to read it.'
  }
  return 'Mature prompt and preview are hidden. Click the preview to reveal this job.'
})

const jobTitle = computed<string>(() => artJobTitle(props.job))

const jobPageLabel = computed<string>(() => artJobPageLabel(props.job))

/*
 * The object this image was made for.
 *
 * An ArtImage is a standalone generation, something made by hand in the art
 * generator, or art made FOR another object -- and until now the card showed
 * no trace of the third case even though the payload has always carried it.
 * The id is all the payload holds, so the name comes from a batched lookup;
 * the link renders as soon as it lands and the card shows the type meanwhile.
 */
const showOriginCard = ref(false)

const jobOrigin = computed(() => artJobOrigin(props.job))

const resolvedOrigin = computed(() =>
  jobOrigin.value.kind === 'entity'
    ? entityArtLinkStore.get(jobOrigin.value.entityType, jobOrigin.value.entityId)
    : null,
)

const originTypeLabel = computed<string>(() =>
  jobOrigin.value.kind === 'entity'
    ? entityArtTypeLabel(jobOrigin.value.entityType)
    : '',
)

const originLabel = computed<string>(() => resolvedOrigin.value?.label ?? '')

/** Shown when there is nothing to link to: a non-entity origin, a reference
 *  still resolving, or an object deleted after its art was queued. */
const originText = computed<string>(() => {
  const origin = jobOrigin.value
  if (origin.kind !== 'entity') {
    return origin.kind === 'standalone' ? '' : artJobOriginLabel(origin)
  }
  const resolved = resolvedOrigin.value
  if (!resolved) return `${originTypeLabel.value} #${origin.entityId}`
  if (!resolved.exists) {
    return `${originTypeLabel.value} #${origin.entityId} · deleted`
  }
  return `${originTypeLabel.value} · ${resolved.label ?? ''}`
})

watchEffect(() => {
  const origin = jobOrigin.value
  if (origin.kind === 'entity') {
    entityArtLinkStore.request(origin.entityType, origin.entityId)
  }
})

const jobVariant = computed<string>(() => artJobVariant(props.job))

const jobRequestId = computed<string>(() => artJobRequestId(props.job))

const jobImagePath = computed<string>(() => artJobImagePath(props.job))

const jobSettings = computed<string[]>(() => artJobSettings(props.job))

const jobFinishedAtValue = computed<string | Date | null>(() =>
  props.job.status === 'DONE' ? artJobFinishedAt(props.job) : null,
)

const errorIsFromEarlierAttempt = computed<boolean>(
  () => props.job.status === 'RUNNING' || props.job.status === 'PENDING',
)

const imageVersion = computed<string>(() => artJobImageVersion(props.job))

const publicImageSrc = computed<string>(() => artJobPublicImageSrc(props.job))

const jobImageSrc = computed<string>(() => {
  const id = props.job.artImageId
  if (typeof id !== 'number') return ''
  return publicImageSrc.value || artJobStore.imageSrcById[id] || ''
})

const jobImageKind = computed<string>(() => {
  const id = props.job.artImageId
  if (typeof id !== 'number' || publicImageSrc.value) return 'image'
  return artJobStore.imageInfoById[id]?.kind || 'image'
})

const isLoadingPreview = computed<boolean>(() => {
  const id = props.job.artImageId
  return typeof id === 'number' && artJobStore.loadingImageIds.includes(id)
})

/*
 * WHO MAY SEE THIS AT ALL. Two independent rules, per Silas 2026-09-17.
 *
 *   isMature  -- shown only to a non-child account that has opted into mature
 *                content. A local reveal exists for a shared screen, and it is
 *                still bounded by that account setting.
 *   isPublic  -- FALSE means the admin or the owner, full stop. There is no
 *                override for anyone else and no affordance offering one; the
 *                image simply is not theirs to see. The server enforces this
 *                independently in /api/art/images/[id]/file.get.ts.
 *
 * A private image therefore needs no gate for its OWNER: "Load protected
 * preview" was asking Silas to click past a boundary that does not apply to
 * him, once per card, across a queue of thousands. The click existed because
 * the card only ever built an anonymous URL, which a private row has none of,
 * so it fell back to a manual authenticated fetch.
 */
/** The image is mine, so privacy has nothing to say about it. */
const viewerOwnsJob = computed<boolean>(() => {
  const viewerId = userStore.user?.id
  return typeof viewerId === 'number' && viewerId === props.job.userId
})

/*
 * The card does not render at all. Two independent reasons, both absolute.
 *
 *   mature + a maturity-restricted account -- "a mature object should not even
 *     look like it exists for children accounts, so that things like text
 *     should not be viewable either".
 *
 *   private + neither owner nor admin -- "a private object should not show up
 *     AT ALL for non-admin non-owners. they don't exist" (Silas, 2026-09-17).
 *
 * A placeholder reading "Private output" was the wrong answer to the second:
 * it still told someone the job existed, who made it and that there was
 * something there to want. Absence is the answer. An admin still sees it,
 * behind the deliberate override below, because someone has to be able to
 * moderate what they cannot see by default.
 */
const hiddenFromViewer = computed<boolean>(() => {
  if (jobVisibility.value.isMature && userStore.isMaturityRestricted) return true
  if (jobVisibility.value.isPublic) return false
  return !viewerOwnsJob.value && !userStore.isAdmin
})

/*
 * An admin who is NOT the owner keeps the gate.
 *
 * Silas, 2026-09-17: "an admin, including me, should actually have the gate
 * with an optional unblock if I am not the owner but it is not public. that's
 * an admin override consideration but that still respects someone's decision
 * to make something non-public."
 *
 * So the override exists and is deliberate: it is never automatic, it is
 * labelled as an override rather than as a preview, and someone else's choice
 * to keep an image private is visible in the act of crossing it.
 */
const adminMayOverridePrivate = computed<boolean>(
  () =>
    userStore.isAdmin &&
    !viewerOwnsJob.value &&
    !jobVisibility.value.isPublic,
)

const adminOverrodePrivate = ref(false)

/** No boundary at all: the owner, or an admin who has chosen to override. */
const viewerMaySeePrivate = computed<boolean>(
  () => viewerOwnsJob.value || adminOverrodePrivate.value,
)

const canLoadProtectedPreview = computed<boolean>(() => {
  return (
    // Never offered to someone the privacy rule excludes: a private image is
    // not theirs to load, so there is no button inviting them to try. The
    // server refuses them regardless; this stops the UI implying otherwise.
    (viewerMaySeePrivate.value || adminMayOverridePrivate.value) &&
    canShowJobContent.value &&
    typeof props.job.artImageId === 'number' &&
    !publicImageSrc.value &&
    !jobImageSrc.value
  )
})

const previewPlaceholder = computed<string>(() => {
  if (props.job.status !== 'DONE') return props.job.status
  if (typeof props.job.artImageId !== 'number') return 'No output image'
  // For anyone else this is not a gate to cross, it is simply not theirs.
  if (viewerMaySeePrivate.value) return 'Loading preview'
  // Same words either way: an admin sees that it is private and is offered the
  // override button below; everyone else sees only that it is not theirs.
  return 'Private output'
})

const isEditableInPlace = computed<boolean>(() =>
  ['PENDING', 'FAILED', 'CANCELLED'].includes(props.job.status),
)

const processingStartedAtValue = computed<string | Date | null>(() => {
  if (props.job.status !== 'RUNNING') return null
  const payloadValue = props.job.payload.processingStartedAt
  if (typeof payloadValue === 'string' && payloadValue.trim()) {
    const timestamp = new Date(payloadValue).getTime()
    if (Number.isFinite(timestamp)) return payloadValue
  }
  return props.job.claimedAt
})

const runningStartedAt = computed<number | null>(() => {
  const value = processingStartedAtValue.value
  if (!value) return null
  const startedAt = new Date(value).getTime()
  return Number.isFinite(startedAt) ? startedAt : null
})

/*
 * Fetch it automatically for a viewer who is allowed it anyway.
 *
 * Gated on maturity as well: `isMature` is a separate rule with its own
 * deliberate reveal, so an owner who hides mature content still gets the
 * reveal step rather than the image.
 */
/*
 * `watch` ON EXPLICIT SOURCES, NOT watchEffect.
 *
 * watchEffect tracks everything read inside it -- including, through
 * loadProtectedPreview, artJobStore.loadJobImage, which READS and then WRITES
 * `loadingImageIds`. So the effect depended on its own side effect: every load
 * that finished mutated the array, re-triggered the effect, and started
 * another. A load that SUCCEEDS settles (the version cache short-circuits the
 * next run), but a load that FAILS never records a version, so it retried
 * forever -- the finished previews "popping in and out of loading state" Silas
 * reported on 2026-09-18.
 *
 * Naming the sources breaks the cycle: this re-runs when the job, the viewer's
 * rights, or the image version change, and never because the store noted that
 * a fetch started or stopped.
 */
watch(
  () => [
    props.job.artImageId,
    imageVersion.value,
    viewerOwnsJob.value,
    canLoadProtectedPreview.value,
    jobVisibility.value.isMature,
    artStore.showMature,
  ],
  () => {
    // Owner only. An admin overriding someone else's privacy choice does it by
    // hand, every time, rather than having it done silently on their behalf.
    if (!viewerOwnsJob.value) return
    if (!canLoadProtectedPreview.value) return
    if (jobVisibility.value.isMature && !artStore.showMature) return
    void loadProtectedPreview()
  },
  { immediate: true },
)

/** Cross the privacy gate deliberately, then fetch. */
async function revealPrivateOutput(): Promise<void> {
  if (adminMayOverridePrivate.value) adminOverrodePrivate.value = true
  await loadProtectedPreview()
}

async function loadProtectedPreview(includeMature = false): Promise<void> {
  const id = props.job.artImageId
  if (typeof id !== 'number') return
  // Pass the job's version so an OVERWRITE retry — which reuses this ArtImage
  // id with new bytes — refetches instead of serving the previous render.
  await artJobStore.loadJobImage(id, imageVersion.value, includeMature)
}

/**
 * Re-hide a job revealed on this card.
 *
 * Reveal used to be one-way: once clicked there was no way back without a
 * reload, which is the wrong default for mature content on a shared screen
 * (Silas, 2026-09-16). Only the local reveal is undone -- artStore.showMature
 * is the account-level setting and is not touched here.
 */
function hideMatureJob(): void {
  locallyRevealedMature.value = false
}

const canHideMatureJob = computed<boolean>(
  () =>
    jobVisibility.value.isMature &&
    locallyRevealedMature.value &&
    !artStore.showMature,
)

async function revealMatureJob(): Promise<void> {
  if (!canRevealMatureJob.value) return

  locallyRevealedMature.value = true
  if (!jobImageSrc.value && typeof props.job.artImageId === 'number') {
    await loadProtectedPreview(true)
  }
}

async function handleCopy(): Promise<void> {
  if (!canShowJobContent.value) return
  const prompt = jobPrompt.value
  if (!prompt || !navigator.clipboard) return
  await navigator.clipboard.writeText(prompt)
  copied.value = true
  window.setTimeout(() => {
    copied.value = false
  }, 1500)
}

async function togglePriority(): Promise<void> {
  if (props.job.priority > 0) {
    await priorityStore.returnToNormal(props.job.id)
    return
  }
  await priorityStore.moveToFront(props.job.id)
}

function stopRunningTimer(): void {
  if (runningTimer === null) return
  clearInterval(runningTimer)
  runningTimer = null
}

function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainder = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

function updateRunningElapsed(): void {
  const startedAt = runningStartedAt.value
  if (startedAt === null) {
    runningElapsed.value = ''
    return
  }
  runningElapsed.value = formatElapsed((Date.now() - startedAt) / 1000)
}

function syncRunningTimer(): void {
  stopRunningTimer()
  updateRunningElapsed()
  if (runningStartedAt.value === null) return
  runningTimer = setInterval(updateRunningElapsed, 1000)
}

watch(runningStartedAt, syncRunningTimer)
onMounted(syncRunningTimer)
onBeforeUnmount(stopRunningTimer)

function jobStatusClass(status: string): string {
  if (status === 'DONE') return 'badge-success'
  if (status === 'FAILED') return 'badge-error'
  if (status === 'RUNNING') return 'badge-info'
  if (status === 'CANCELLED') return 'badge-ghost'
  return 'badge-warning'
}

function formatDateTime(value: string | Date | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>