<!-- /components/coloring/coloring-book-page-card.vue -->
<!-- One coloring-book page, laid out to fit a single phone screen (Silas,
     2026-11-04 PT: "a single screen or two for each coloring page"). The pair
     and its versions sit on top; the heavier tools (change request, prompt,
     render settings, brief) open one at a time from a tab row. -->
<template>
  <article
    class="min-w-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
  >
    <div class="relative grid grid-cols-2 gap-px bg-base-300">
      <figure
        v-for="variant in variants"
        :key="variant"
        class="relative min-w-0 bg-base-200"
      >
        <div
          class="relative aspect-[17/22] w-full overflow-hidden"
          :class="picked[variant] ? 'ring-4 ring-inset ring-primary' : ''"
        >
          <a
            v-if="shownUrl(variant)"
            :href="shownUrl(variant) || ''"
            target="_blank"
            rel="noopener"
            class="block size-full cursor-zoom-in"
            :title="`Open ${title} ${variantLabel(variant)} full size`"
          >
            <img
              :src="shownUrl(variant) || ''"
              :alt="`${title} ${variantLabel(variant)}`"
              class="size-full object-contain"
              :class="variant === 'bw' ? 'grayscale' : ''"
              loading="lazy"
            />
          </a>
          <div
            v-else
            class="grid size-full place-items-center text-center text-base-content/30"
          >
            <div>
              <Icon name="kind-icon:image" class="kr-icon-8 mx-auto" />
              <p class="kr-text-bold-xs mt-1">No {{ variantLabel(variant) }}</p>
            </div>
          </div>

          <div
            v-if="picked[variant]"
            class="absolute inset-x-1 bottom-1 flex flex-wrap items-center gap-1 rounded-lg bg-base-100/95 p-1 text-[11px] shadow"
          >
            <span class="min-w-0 flex-1 truncate font-bold">
              {{ picked[variant]!.label }}
              <span v-if="picked[variant]!.detail" class="font-normal">
                · {{ picked[variant]!.detail }}
              </span>
            </span>
            <button
              type="button"
              class="btn btn-success btn-xs rounded-lg"
              :disabled="store.requestingAction || adoptBlocked(variant)"
              :title="
                adoptBlocked(variant)
                  ? 'Accept a color version before choosing a B&W one.'
                  : ''
              "
              @click="adopt(variant)"
            >
              Use this
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-lg px-1"
              aria-label="Stop previewing"
              @click="picked[variant] = null"
            >
              <Icon name="kind-icon:close" class="kr-icon-4" />
            </button>
          </div>
          <figcaption
            v-else
            class="absolute bottom-1.5 left-1.5 badge badge-sm border-0 bg-base-100/90 font-black shadow-sm"
          >
            {{ variantLabel(variant) }}
          </figcaption>
        </div>

        <coloring-book-version-strip
          v-if="isAdmin"
          :book-slug="bookSlug"
          :proposal="proposal"
          :production="production"
          :variant="variant"
          :picked="picked[variant]?.path ?? null"
          :can-upload="variant === 'color' || Boolean(proposal.accepted.color)"
          @pick="picked[variant] = $event"
          @done="emit('notice', $event)"
          @failed="emit('error', $event)"
        />
      </figure>

      <span
        class="pointer-events-none absolute right-1.5 top-1.5 badge badge-sm border-0 shadow-sm"
        :class="stageBadge"
      >
        {{ stageLabel }}
      </span>
    </div>

    <div class="space-y-2 p-3">
      <header class="flex items-start gap-2">
        <div class="min-w-0 flex-1">
          <h2 class="kr-text-black-lg leading-tight">
            <span class="text-sm font-bold text-primary">
              {{ proposal.slot }}.
            </span>
            {{ title }}
          </h2>
          <p class="kr-text-dim-xs-55 truncate">
            {{ proposal.id }}<span v-if="facts">{{ ' · ' + facts }}</span>
          </p>
        </div>
        <button
          v-if="isAdmin && !conceptEdit"
          type="button"
          class="btn btn-ghost btn-sm btn-square rounded-lg"
          aria-label="Edit riff and recast"
          title="Edit riff & recast"
          @click="editConcept"
        >
          <Icon name="kind-icon:pencil" class="kr-icon-4" />
        </button>
      </header>

      <div v-if="conceptEdit" class="space-y-2">
        <input
          v-model="conceptEdit.sourceLineage"
          class="kr-input-sm w-full"
          maxlength="600"
          aria-label="Riffing on"
          placeholder="Riffing on: e.g. the subway-grate breeze in The Seven Year Itch"
        />
        <textarea
          v-model="conceptEdit.recast"
          class="textarea textarea-bordered textarea-sm min-h-14 w-full rounded-xl leading-5"
          maxlength="600"
          aria-label="Recast"
          placeholder="Recast: who takes the role, e.g. a jolly, hairy Scotsman in a kilt"
        />
        <div class="flex gap-2">
          <button
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            :disabled="store.savingConcept || !conceptDirty"
            @click="saveConcept"
          >
            <span v-if="store.savingConcept" class="kr-spinner-xs" />
            Save
          </button>
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="conceptEdit = null"
          >
            Cancel
          </button>
        </div>
      </div>
      <button
        v-else-if="riff || recast"
        type="button"
        class="block w-full text-left text-sm leading-5"
        :aria-expanded="conceptOpen"
        @click="conceptOpen = !conceptOpen"
      >
        <p v-if="riff" :class="conceptOpen ? '' : 'line-clamp-2'">
          <span class="font-black text-secondary">Riffing on:</span>
          {{ riff }}
        </p>
        <p
          v-if="recast"
          class="text-base-content/80"
          :class="conceptOpen ? '' : 'line-clamp-2'"
        >
          <span class="font-black">Recast:</span> {{ recast }}
        </p>
      </button>
      <button
        v-else-if="isAdmin"
        type="button"
        class="kr-text-dim-xs-55 underline"
        @click="editConcept"
      >
        Add what this page riffs on and who is recast
      </button>

      <div v-if="isAdmin" class="flex flex-wrap gap-1.5">
        <button
          v-if="colorCandidatePath"
          class="btn btn-success btn-sm rounded-xl"
          type="button"
          :disabled="store.requestingAction"
          @click="run('accept-color')"
        >
          Accept color
        </button>
        <button
          v-if="bwCandidatePath"
          class="btn btn-success btn-sm rounded-xl"
          type="button"
          :disabled="store.requestingAction"
          @click="run('accept-bw')"
        >
          Accept B&amp;W
        </button>
        <button
          v-if="canFinalize"
          class="btn btn-success btn-sm rounded-xl"
          type="button"
          :disabled="store.requestingAction"
          @click="run('finalize')"
        >
          Finalize pair
        </button>
        <button
          class="btn btn-sm rounded-xl"
          type="button"
          :disabled="store.requestingAction"
          @click="renderColor"
        >
          New color
        </button>
      </div>

      <div v-if="isAdmin" class="join w-full">
        <select
          v-model="bwSource"
          class="join-item select select-bordered select-sm min-w-0 flex-1 rounded-l-xl"
          aria-label="New B&W starts from"
          title="What the new B&W is made from"
        >
          <option
            v-for="option in bwSourceOptions"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </option>
        </select>
        <button
          class="join-item btn btn-sm rounded-r-xl"
          type="button"
          :disabled="store.requestingAction || !bwSourceReady"
          @click="renderBw"
        >
          New B&amp;W
        </button>
      </div>

      <div class="join w-full" role="tablist" :aria-label="`${title} tools`">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="join-item btn btn-xs flex-1"
          :class="panel === tab.key ? 'btn-primary' : 'btn-ghost bg-base-200'"
          :aria-selected="panel === tab.key"
          @click="panel = panel === tab.key ? null : tab.key"
        >
          {{ tab.label }}
          <span
            v-if="tab.key === 'prompt' && promptChanged"
            class="size-1.5 rounded-full bg-warning"
          />
        </button>
      </div>

      <div v-if="panel === 'change'" class="space-y-2">
        <textarea
          v-model="changeText"
          class="textarea textarea-bordered textarea-sm min-h-16 w-full rounded-xl leading-5"
          maxlength="500"
          aria-label="Request a change"
          placeholder="What should be different? e.g. make the figure smaller, forward limbs enlarged by perspective"
        />
        <div class="flex flex-wrap gap-2">
          <button
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            :disabled="
              !cleanChange || store.savingPrompt || store.requestingAction
            "
            @click="applyChange(true)"
          >
            Apply &amp; re-render
          </button>
          <button
            class="btn btn-sm rounded-xl"
            type="button"
            :disabled="!cleanChange"
            @click="applyChange(false)"
          >
            Add to prompt only
          </button>
        </div>
        <p class="kr-text-dim-xs-55">
          Uses the Render tab's engine, checkpoint and LoRA.
        </p>
      </div>

      <div v-else-if="panel === 'prompt'" class="space-y-2">
        <textarea
          v-model="draft"
          class="textarea textarea-bordered textarea-sm min-h-40 w-full rounded-xl leading-5"
          :readonly="!isAdmin"
          aria-label="Art prompt"
        />
        <div v-if="isAdmin" class="flex gap-2">
          <button
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            :disabled="store.savingPrompt || !promptChanged"
            @click="savePrompt"
          >
            Save prompt
          </button>
          <button
            v-if="promptChanged"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="draft = proposal.prompt"
          >
            Undo
          </button>
        </div>
      </div>

      <coloring-book-render-settings
        v-else-if="panel === 'render'"
        v-model="settings"
        :options="store.renderOptions"
        :current="proposal.queue.renderSettings"
      />

      <div v-else-if="panel === 'brief'" class="space-y-2 text-sm leading-5">
        <dl v-if="brief.length" class="space-y-1.5">
          <div v-for="entry in brief" :key="entry.label">
            <dt class="kr-text-dim-xs-55 font-bold">{{ entry.label }}</dt>
            <dd>{{ entry.value }}</dd>
          </div>
        </dl>
        <div v-if="proposal.notes.length">
          <p class="kr-text-dim-xs-55 font-bold">Production notes</p>
          <ul class="list-disc space-y-1 pl-5">
            <li v-for="(note, index) in proposal.notes" :key="index">
              {{ note }}
            </li>
          </ul>
        </div>
        <div v-if="references.length" class="flex gap-2 overflow-x-auto">
          <img
            v-for="asset in references"
            :key="asset.path"
            :src="asset.url || ''"
            :alt="asset.kind"
            class="aspect-square w-14 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        </div>
        <p
          v-if="!brief.length && !proposal.notes.length && !references.length"
          class="kr-text-dim-xs-55"
        >
          No brief or notes for this page yet.
        </p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type {
  ColoringBookProductionState,
  ColoringBookProposal,
  ColoringBookRenderSettingsRequest,
  ColoringBookVariant,
} from '~/types/coloringBookStudio'
import {
  coloringBookBwRequest,
  shownVersionPath,
  type ColoringBookBwChoice,
  type ColoringBookVersion,
} from '@/utils/coloringBookVersions'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'

type Panel = 'change' | 'prompt' | 'render' | 'brief'

const props = defineProps<{
  bookSlug: string
  proposal: ColoringBookProposal
  production: ColoringBookProductionState | null
  isAdmin: boolean
}>()

const emit = defineEmits<{
  notice: [message: string]
  error: [message: string]
}>()

const store = useColoringBookStudioStore()
const variants: ColoringBookVariant[] = ['color', 'bw']
const panel = ref<Panel | null>(null)
const conceptOpen = ref(false)
const conceptEdit = ref<{ sourceLineage: string; recast: string } | null>(null)
const draft = ref(props.proposal.prompt)
const changeText = ref('')
const picked = reactive<
  Record<ColoringBookVariant, ColoringBookVersion | null>
>({ color: null, bw: null })

const tabs = computed<{ key: Panel; label: string }[]>(() =>
  props.isAdmin
    ? [
        { key: 'change', label: 'Change' },
        { key: 'prompt', label: 'Prompt' },
        { key: 'render', label: 'Render' },
        { key: 'brief', label: 'Brief' },
      ]
    : [
        { key: 'prompt', label: 'Prompt' },
        { key: 'brief', label: 'Brief' },
      ],
)

const title = computed(() => props.proposal.title)
const riff = computed(() => props.proposal.concept?.sourceLineage ?? '')
const recast = computed(() => props.proposal.concept?.recast ?? '')

const facts = computed(() => {
  const queue = props.proposal.queue
  return [
    queue.status && queue.status !== 'missing' ? queue.status : '',
    queue.revisionCount ? `${queue.revisionCount} rev` : '',
    queue.renderEngine ?? '',
    queue.completedAt?.slice(0, 10) ?? '',
  ]
    .filter(Boolean)
    .join(' · ')
})

const brief = computed(() => {
  const concept = props.proposal.concept
  if (!concept) return []
  const entries: [string, string | null][] = [
    ['Visual hook', concept.visualHook],
    ['Framing', concept.framing],
    ['Body direction', concept.bodyDirection],
    ['Horror engine', concept.horrorEngine],
    ['Camp engine', concept.campEngine],
    ['Sensuality', concept.sensuality],
    ['Making it original', concept.originalizationHook],
  ]
  return entries
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => ({ label, value }))
})

const references = computed(() =>
  props.proposal.inspirations.filter(
    (asset) => asset.url && !/color|\bbw\b|b&w/i.test(asset.kind),
  ),
)

const colorCandidatePath = computed(() =>
  props.proposal.accepted.color || props.proposal.final.color
    ? null
    : props.proposal.queue.renderedPath,
)
const bwCandidatePath = computed(() =>
  props.proposal.accepted.bw || props.proposal.final.bw
    ? null
    : (props.production?.bwRenderedPath ?? null),
)

function shownPath(variant: ColoringBookVariant): string | null {
  return shownVersionPath(
    props.bookSlug,
    props.proposal,
    props.production,
    variant,
    picked[variant]?.path,
  )
}

const bwSource = ref<ColoringBookBwChoice>('shown-color')

const bwSourceOptions = computed<
  { value: ColoringBookBwChoice; label: string; disabled: boolean }[]
>(() => [
  {
    value: 'shown-color',
    label: picked.color
      ? `From selected color (${picked.color.label})`
      : 'From shown color',
    disabled: !shownPath('color'),
  },
  {
    value: 'shown-bw',
    label: picked.bw
      ? `From selected B&W (${picked.bw.label})`
      : 'From shown B&W',
    disabled: !shownPath('bw'),
  },
  { value: 'prompt', label: 'Fresh from prompt', disabled: false },
])

const bwSourceReady = computed(
  () =>
    !bwSourceOptions.value.find((option) => option.value === bwSource.value)
      ?.disabled,
)

watch(
  () => [picked.color?.path, picked.bw?.path] as const,
  ([color, bw], [oldColor, oldBw]) => {
    if (bw && bw !== oldBw) bwSource.value = 'shown-bw'
    else if (color && color !== oldColor) bwSource.value = 'shown-color'
  },
)
watch(
  bwSourceReady,
  (ready) => {
    if (!ready && bwSource.value !== 'prompt') {
      bwSource.value = shownPath('color') ? 'shown-color' : 'prompt'
    }
  },
  { immediate: true },
)

const canFinalize = computed(
  () =>
    Boolean(props.proposal.accepted.color && props.proposal.accepted.bw) &&
    !(props.proposal.final.color && props.proposal.final.bw),
)

const stageLabel = computed(() => {
  const p = props.proposal
  if (p.final.color && p.final.bw) return 'Final pair'
  if (p.accepted.color && p.accepted.bw) return 'Ready to finalize'
  if (bwCandidatePath.value) return 'Accept B&W'
  if (p.accepted.color) return 'Build B&W'
  if (colorCandidatePath.value) return 'Accept color'
  if (p.queue.status === 'pending' || p.queue.status === 'running')
    return 'Rendering color'
  if (p.queue.status === 'needs_review' || p.queue.semanticGateError)
    return 'Needs review'
  return 'Needs color'
})

const stageBadge = computed(() => {
  const p = props.proposal
  if (p.accepted.color && p.accepted.bw) return 'badge-success'
  if (p.queue.status === 'needs_review' || p.queue.semanticGateError)
    return 'badge-warning'
  if (p.queue.status === 'pending' || p.queue.status === 'running')
    return 'badge-info'
  return 'badge-neutral'
})

const promptChanged = computed(
  () => draft.value.trim() !== props.proposal.prompt.trim(),
)
const cleanChange = computed(() => changeText.value.replace(/\s+/g, ' ').trim())
const conceptDirty = computed(
  () =>
    Boolean(conceptEdit.value) &&
    (conceptEdit.value!.sourceLineage.trim() !== riff.value ||
      conceptEdit.value!.recast.trim() !== recast.value),
)

// --- render settings -----------------------------------------------------

function initialSettings(): ColoringBookRenderSettingsRequest {
  const current = props.proposal.queue.renderSettings
  const options = store.renderOptions
  return {
    engine:
      options?.engines.find((option) => option.value === current.engine)
        ?.value ?? 'krea2',
    checkpointId:
      options?.checkpoints.find((option) => option.path === current.checkpoint)
        ?.id ?? null,
    loraId:
      options?.loras.find((option) => option.path === current.lora)?.id ?? null,
    loraStrength: current.loraStrength ?? 1,
  }
}

const settings = ref<ColoringBookRenderSettingsRequest>(initialSettings())
watch(
  () => [store.renderOptions, props.proposal.queue.renderSettings],
  () => (settings.value = initialSettings()),
)
watch(
  () => props.proposal.prompt,
  (prompt) => (draft.value = prompt),
)

/** Settings to send with a color render; undefined when unchanged, null when invalid. */
function settingsForRender():
  ColoringBookRenderSettingsRequest | undefined | null {
  if (!store.renderOptions) return undefined
  if (JSON.stringify(settings.value) === JSON.stringify(initialSettings()))
    return undefined
  if (
    settings.value.engine === 'sdxl-checkpoint' &&
    !settings.value.checkpointId
  ) {
    emit('error', 'Pick a checkpoint for the SDXL / Illustrious engine first.')
    panel.value = 'render'
    return null
  }
  return { ...settings.value }
}

// --- helpers ---------------------------------------------------------------

function variantLabel(variant: ColoringBookVariant): string {
  return variant === 'bw' ? 'B&W' : 'color'
}

function currentUrl(variant: ColoringBookVariant): string | null {
  return variant === 'color'
    ? props.proposal.colorUrl
    : props.production?.bwUrl || props.proposal.bwUrl
}

function shownUrl(variant: ColoringBookVariant): string | null {
  return picked[variant]?.url ?? currentUrl(variant)
}

function adoptBlocked(variant: ColoringBookVariant): boolean {
  return variant === 'bw' && !props.proposal.accepted.color
}

async function report(ok: boolean, fallback: string): Promise<boolean> {
  if (ok) emit('notice', store.message || fallback)
  else if (store.error) emit('error', store.error)
  return ok
}

function select(): void {
  store.selectProposal(props.proposal.id)
}

// --- actions ---------------------------------------------------------------

async function adopt(variant: ColoringBookVariant): Promise<void> {
  const version = picked[variant]
  if (!version) return
  select()
  const label = variantLabel(variant)
  const ok = await store.adoptVersion(
    variant,
    version.path,
    `Reverted ${label} to ${version.path} from Coloring Book curation`,
  )
  if (ok) picked[variant] = null
  await report(
    ok,
    `${props.proposal.id} switches to that ${label} version on Conductor's next studio run.` +
      (variant === 'color' && props.proposal.accepted.bw
        ? ' Its B&W goes back to "needs B&W" so it can match.'
        : ''),
  )
}

function editConcept(): void {
  conceptEdit.value = { sourceLineage: riff.value, recast: recast.value }
}

async function saveConcept(): Promise<void> {
  if (!conceptEdit.value) return
  select()
  const ok = await store.saveConcept(
    conceptEdit.value.sourceLineage,
    conceptEdit.value.recast,
  )
  if (ok) conceptEdit.value = null
  await report(
    ok,
    'Saved. Add the recast to the prompt too if the art should change.',
  )
}

async function savePrompt(): Promise<void> {
  select()
  await report(await store.savePrompt(draft.value), 'Prompt saved.')
}

async function applyChange(rerender: boolean): Promise<void> {
  const change = cleanChange.value
  if (!change) return
  const nextPrompt = `${draft.value.trim()}\n\nRevision request: ${change}`
  if (!rerender) {
    draft.value = nextPrompt
    changeText.value = ''
    panel.value = 'prompt'
    return
  }
  const renderSettings = settingsForRender()
  if (renderSettings === null) return
  select()
  if (!(await store.savePrompt(nextPrompt))) {
    if (store.error) emit('error', store.error)
    return
  }
  changeText.value = ''
  const queued = await store.requestColorRender(
    true,
    `Change requested from Coloring Book curation: ${change}`,
    renderSettings,
  )
  if (queued) {
    emit(
      'notice',
      store.message ||
        'Change saved to the prompt and a new color render queued.',
    )
  } else if (store.error) {
    emit('error', `Prompt saved, but the render was not queued: ${store.error}`)
  }
}

async function renderColor(): Promise<void> {
  const renderSettings = settingsForRender()
  if (renderSettings === null) return
  select()
  const ok = await store.requestColorRender(
    true,
    'Requested from Coloring Book curation',
    renderSettings,
  )
  await report(ok, 'color render requested.')
}

async function renderBw(): Promise<void> {
  const request = coloringBookBwRequest(
    bwSource.value,
    props.bookSlug,
    props.proposal,
    props.production,
    { color: picked.color?.path, bw: picked.bw?.path },
  )
  if (!request) {
    emit('error', 'There is no image to make that B&W from yet.')
    return
  }
  select()
  const from =
    request.source === 'prompt'
      ? 'fresh from the prompt'
      : request.source === 'color'
        ? 'from the accepted color'
        : `from ${request.path}`
  const ok = await store.requestBw(
    true,
    `B&W requested ${from} from Coloring Book curation`,
    request.source,
    request.path,
  )
  await report(ok, `B&W render requested ${from}.`)
}

async function run(
  action: 'accept-color' | 'accept-bw' | 'finalize',
): Promise<void> {
  select()
  const note =
    action === 'finalize'
      ? 'Finalized from Coloring Book curation'
      : 'Accepted from Coloring Book curation'
  const ok =
    action === 'accept-color'
      ? await store.acceptColor(note, colorCandidatePath.value || '')
      : action === 'accept-bw'
        ? await store.acceptBw(note, bwCandidatePath.value || '')
        : await store.finalizePair(note)
  await report(
    ok,
    action === 'finalize' ? 'Pair finalized.' : 'Candidate accepted.',
  )
}
</script>
