<!-- /components/wonderlab/wonderlab-preview-host.vue -->
<template>
  <section class="rounded-3xl border border-base-300 bg-base-200/60 p-3">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-black uppercase tracking-widest text-primary">
          Preview Harness
        </p>
        <h3 class="mt-1 truncate text-lg font-black">
          {{ fixture?.title || componentName }}
        </h3>
        <p class="mt-1 break-all font-mono text-xs text-base-content/50">
          {{ resolvedPath || expectedPath }}
        </p>
        <p
          v-if="fixture?.description"
          class="mt-2 max-w-3xl text-sm leading-relaxed text-base-content/65"
        >
          {{ fixture.description }}
        </p>
      </div>

      <div v-if="showControls" class="flex flex-wrap items-center gap-2">
        <select
          v-model="viewport"
          class="select select-bordered select-xs rounded-xl bg-base-100"
          aria-label="Preview viewport"
        >
          <option value="mobile">Mobile</option>
          <option value="tablet">Tablet</option>
          <option value="desktop">Desktop</option>
          <option value="full">Full width</option>
        </select>

        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-xl"
          @click="resetPreview"
        >
          <Icon name="kind-icon:refresh" class="size-3.5" />
          Reset
        </button>
      </div>
    </header>

    <div
      v-if="fixture?.skipReason"
      class="mt-3 rounded-2xl border border-info/30 bg-info/10 p-4"
    >
      <div class="flex items-start gap-3">
        <Icon name="kind-icon:info" class="mt-0.5 size-5 shrink-0 text-info" />
        <div>
          <p class="font-black text-info-content">Context fixture required</p>
          <p class="mt-1 text-sm leading-relaxed text-base-content/70">
            {{ fixture.skipReason }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-else-if="previewNotFound"
      class="mt-3 rounded-2xl border border-dashed border-warning/40 bg-warning/5 p-5 text-center"
    >
      <Icon name="kind-icon:search" class="mx-auto size-8 text-warning" />
      <p class="mt-2 font-black">Component source not found</p>
      <p class="mt-1 text-sm text-base-content/60">
        The manifest or database path may be stale. No database record was
        changed.
      </p>
    </div>

    <div
      v-else-if="previewError"
      class="mt-3 rounded-2xl border border-error/40 bg-error/5 p-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="font-black text-error">Preview error contained</p>
          <pre
            class="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-error/80"
          >{{ previewError }}</pre>
        </div>

        <button
          type="button"
          class="btn btn-error btn-outline btn-xs shrink-0 rounded-xl"
          @click="resetPreview"
        >
          Retry
        </button>
      </div>
    </div>

    <div
      v-else
      class="mt-3 overflow-auto rounded-2xl border border-base-300 bg-base-100 p-4 shadow-inner"
    >
      <div
        class="mx-auto w-full transition-[max-width] duration-200"
        :class="viewportClass"
        :style="previewStyle"
      >
        <Suspense v-if="dynamicComponent">
          <component
            :is="dynamicComponent"
            :key="renderKey"
            v-bind="fixture?.props || {}"
          />

          <template #fallback>
            <div class="flex min-h-40 items-center justify-center">
              <span class="loading loading-spinner loading-md text-primary" />
            </div>
          </template>
        </Suspense>

        <div v-else class="flex min-h-40 items-center justify-center">
          <span class="loading loading-spinner loading-md text-primary" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onErrorCaptured,
  ref,
  watch,
} from 'vue'
import {
  getWonderLabPreviewFixture,
  type WonderLabPreviewViewport,
} from '@/utils/wonderlab/previewFixtureCatalog'

const props = withDefaults(
  defineProps<{
    componentName: string
    folderName: string
    sourcePath?: string
    showControls?: boolean
  }>(),
  {
    sourcePath: '',
    showControls: true,
  },
)

const emit = defineEmits<{
  resolved: [path: string]
  error: [message: string]
}>()

const allModules = import.meta.glob('@/components/**/*.vue')
const dynamicComponent = ref<ReturnType<typeof defineAsyncComponent> | null>(
  null,
)
const resolvedPath = ref('')
const previewNotFound = ref(false)
const previewError = ref('')
const renderKey = ref(0)
const viewport = ref<WonderLabPreviewViewport>('desktop')

const fixture = computed(() =>
  getWonderLabPreviewFixture(props.componentName, props.sourcePath),
)

const expectedPath = computed(() => {
  const name = props.componentName.replace(/\.vue$/i, '')
  return `/components/${props.folderName}/${name}.vue`
})

const viewportClass = computed(() => {
  switch (viewport.value) {
    case 'mobile':
      return 'max-w-sm'
    case 'tablet':
      return 'max-w-2xl'
    case 'desktop':
      return 'max-w-5xl'
    default:
      return 'max-w-none'
  }
})

const previewStyle = computed(() => ({
  minHeight: fixture.value?.minHeight || '12rem',
}))

function normalizedSourcePath(value: string): string {
  const path = value.trim().replace(/\\/g, '/')
  if (!path) return ''
  return path.startsWith('/') ? path : `/${path}`
}

function buildCandidates(): string[] {
  const name = props.componentName.replace(/\.vue$/i, '')
  const explicit = normalizedSourcePath(props.sourcePath)

  return [
    explicit,
    `/components/${props.folderName}/${name}.vue`,
    `/components/content/${props.folderName}/${name}.vue`,
    `/components/${name}.vue`,
  ].filter((value, index, list) => Boolean(value) && list.indexOf(value) === index)
}

function resolveComponent(): void {
  dynamicComponent.value = null
  resolvedPath.value = ''
  previewNotFound.value = false
  previewError.value = ''
  renderKey.value += 1
  viewport.value = fixture.value?.viewport || 'desktop'

  if (fixture.value?.skipReason) return

  const matchedPath = buildCandidates().find((candidate) => allModules[candidate])
  if (!matchedPath) {
    previewNotFound.value = true
    return
  }

  resolvedPath.value = matchedPath
  emit('resolved', matchedPath)

  dynamicComponent.value = defineAsyncComponent({
    loader: allModules[matchedPath] as () => Promise<{ default: unknown }>,
    timeout: 10_000,
    onError(error, _retry, fail) {
      const message = error instanceof Error ? error.message : String(error)
      previewError.value = message
      emit('error', message)
      fail()
    },
  })
}

function resetPreview(): void {
  resolveComponent()
}

watch(
  () => [props.componentName, props.folderName, props.sourcePath],
  resolveComponent,
  { immediate: true },
)

onErrorCaptured((error) => {
  const message = error instanceof Error ? error.message : String(error)
  previewError.value = message
  emit('error', message)
  return false
})
</script>
