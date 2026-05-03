<!-- /components/content/themes/theme-card.vue -->
<template>
  <reactable-card
    :selected="selected"
    :compact="compact"
    :show-reaction="false"
    :target-title="themeName"
    :card-class="cardClass"
    :data-theme="previewThemeName"
    @select="applyTheme"
  >
    <template #actions>
      <button
        v-if="showActions && canEdit"
        class="rounded-full bg-base-100 p-2 text-warning shadow transition hover:bg-warning hover:text-warning-content"
        type="button"
        title="Edit Theme"
        @click.stop="editTheme"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowCopy && !isDefaultTheme"
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Copy Theme Values"
        @click.stop="copyThemeValues"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>
    </template>

    <div
      class="flex min-h-32 flex-col justify-between rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p
            class="text-xs font-bold uppercase tracking-wide text-base-content/45"
          >
            {{ isDefaultTheme ? 'Default Theme' : 'Shared Theme' }}
          </p>

          <h2
            class="mt-1 truncate font-black text-primary"
            :class="compact ? 'text-lg' : 'text-2xl'"
            :title="themeName"
          >
            {{ themeName }}
          </h2>

          <p
            v-if="themeTagline"
            class="mt-1 line-clamp-2 text-sm text-base-content/65"
          >
            {{ themeTagline }}
          </p>
        </div>

        <div
          class="grid h-14 w-14 shrink-0 grid-cols-2 overflow-hidden rounded-2xl border border-base-300"
        >
          <span class="bg-primary" />
          <span class="bg-secondary" />
          <span class="bg-accent" />
          <span class="bg-base-300" />
        </div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <span
          class="badge badge-sm"
          :class="isDefaultTheme ? 'badge-primary' : 'badge-secondary'"
        >
          {{ isDefaultTheme ? 'DaisyUI' : 'Custom' }}
        </span>

        <span
          v-if="!isDefaultTheme"
          class="badge badge-sm"
          :class="themeObject?.isPublic ? 'badge-success' : 'badge-warning'"
        >
          {{ themeObject?.isPublic ? 'Public' : 'Private' }}
        </span>

        <span
          v-if="themeObject?.prefersDark"
          class="badge badge-sm badge-neutral"
        >
          Dark
        </span>

        <span v-if="selected" class="badge badge-sm badge-accent">
          Active
        </span>
      </div>

      <div v-if="showSwatches" class="mt-4 grid grid-cols-5 gap-2">
        <div
          v-for="swatch in swatches"
          :key="swatch.label"
          class="flex flex-col items-center gap-1"
        >
          <span
            class="h-8 w-full rounded-xl border border-base-300"
            :style="{ background: swatch.value }"
          />

          <span class="max-w-full truncate text-[10px] text-base-content/45">
            {{ swatch.label }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="showMeta && !isDefaultTheme"
      class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs"
    >
      <div>
        <p class="font-bold uppercase text-base-content/45">Room</p>
        <p class="truncate text-base-content/75">
          {{ themeObject?.room || 'n/a' }}
        </p>
      </div>

      <div>
        <p class="font-bold uppercase text-base-content/45">Scheme</p>
        <p class="truncate text-base-content/75">
          {{ themeObject?.colorScheme || 'light' }}
        </p>
      </div>

      <div>
        <p class="font-bold uppercase text-base-content/45">User</p>
        <p class="truncate text-base-content/75">
          {{ themeObject?.userId ?? 'n/a' }}
        </p>
      </div>

      <div>
        <p class="font-bold uppercase text-base-content/45">ID</p>
        <p class="truncate text-base-content/75">#{{ themeObject?.id }}</p>
      </div>
    </div>

    <button
      v-if="showApplyButton"
      class="btn btn-sm mt-auto rounded-xl"
      :class="selected ? 'btn-primary text-white' : 'btn-outline'"
      type="button"
      @click.stop="applyTheme"
    >
      <Icon name="kind-icon:palette" class="h-4 w-4" />
      {{ selected ? 'Active Theme' : 'Apply Theme' }}
    </button>

    <div
      v-if="localMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        localTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ localMessage }}
    </div>

    <details
      v-if="showDebug"
      class="rounded-2xl border border-base-300 bg-base-100 p-2"
      @click.stop
    >
      <summary class="cursor-pointer text-xs font-bold text-base-content/70">
        Debug
      </summary>

      <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
        JSON.stringify(debugPayload, null, 2)
      }}</pre>
    </details>
  </reactable-card>
</template>

<script setup lang="ts">
// /components/content/themes/theme-card.vue
import { computed, ref } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'
import { useUserStore } from '@/stores/userStore'

const props = withDefaults(
  defineProps<{
    theme: string | Theme
    selected?: boolean
    compact?: boolean
    showActions?: boolean
    showApplyButton?: boolean
    showSwatches?: boolean
    showMeta?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowCopy?: boolean
  }>(),
  {
    selected: false,
    compact: false,
    showActions: true,
    showApplyButton: true,
    showSwatches: true,
    showMeta: true,
    showDebug: false,
    allowEdit: true,
    allowCopy: true,
  },
)

const emit = defineEmits<{
  applied: [name: string, snapshot: unknown]
  edit: [theme: Theme]
  copied: [values: string]
  error: [message: string]
}>()

const themeStore = useThemeStore()
const userStore = useUserStore()

const localMessage = ref('')
const localTone = ref<'success' | 'error'>('success')

const isDefaultTheme = computed(() => {
  return typeof props.theme === 'string'
})

const themeObject = computed<Theme | null>(() => {
  return typeof props.theme === 'string' ? null : props.theme
})

const themeName = computed(() => {
  return typeof props.theme === 'string' ? props.theme : props.theme.name
})

const previewThemeName = computed(() => {
  return themeObject.value?.id
    ? `custom-preview-${themeObject.value.id}`
    : themeName.value
})

const themeTagline = computed(() => {
  if (typeof props.theme === 'string') {
    return 'Built-in DaisyUI theme.'
  }

  return props.theme.tagline || props.theme.room || 'Custom Kind Robots theme.'
})

const canEdit = computed(() => {
  if (!props.allowEdit || isDefaultTheme.value || !themeObject.value) {
    return false
  }

  return userStore.isAdmin || themeObject.value.userId === userStore.userId
})

const cardClass = computed(() => {
  return props.selected ? 'ring-2 ring-primary/30' : ''
})

const themeValues = computed(() => {
  if (typeof props.theme === 'string') return {}

  return safeThemeValues(props.theme.values)
})

const swatches = computed(() => {
  const values = themeValues.value

  return [
    {
      label: 'primary',
      value: values.primary || 'oklch(var(--p))',
    },
    {
      label: 'secondary',
      value: values.secondary || 'oklch(var(--s))',
    },
    {
      label: 'accent',
      value: values.accent || 'oklch(var(--a))',
    },
    {
      label: 'base',
      value: values['base-100'] || 'oklch(var(--b1))',
    },
    {
      label: 'content',
      value: values['base-content'] || 'oklch(var(--bc))',
    },
  ]
})

const debugPayload = computed(() => {
  return {
    theme: props.theme,
    themeName: themeName.value,
    previewThemeName: previewThemeName.value,
    values: themeValues.value,
  }
})

function safeThemeValues(value: unknown): Record<string, string> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)

      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, string>)
        : {}
    } catch {
      return {}
    }
  }

  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {}
}

function toThemeInput(theme: string | Theme) {
  if (typeof theme === 'string') return theme

  return {
    name: theme.name,
    prefersDark: theme.prefersDark,
    colorScheme: theme.colorScheme,
    isPublic: theme.isPublic,
    room: theme.room || '',
    values: safeThemeValues(theme.values),
  }
}

async function applyTheme() {
  localMessage.value = ''

  try {
    const result = await themeStore.setActiveTheme(toThemeInput(props.theme))

    if (!result.success) {
      throw new Error(result.message || 'Failed to apply theme.')
    }

    const snapshot =
      typeof props.theme === 'string'
        ? await themeStore.getActiveThemeSnapshot(props.theme)
        : themeStore.themeForm

    localTone.value = 'success'
    localMessage.value = 'Theme applied.'
    emit('applied', themeName.value, snapshot)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to apply theme.'

    localTone.value = 'error'
    localMessage.value = message
    emit('error', message)
  }
}

function editTheme() {
  if (!themeObject.value) return

  themeStore.themeForm = {
    id: themeObject.value.id,
    name: themeObject.value.name,
    prefersDark: themeObject.value.prefersDark,
    colorScheme: themeObject.value.colorScheme,
    isPublic: themeObject.value.isPublic,
    room: themeObject.value.room || '',
    values: safeThemeValues(themeObject.value.values),
  }

  localMessage.value = ''
  emit('edit', themeObject.value)
}

async function copyThemeValues() {
  const values = JSON.stringify(themeValues.value, null, 2)

  await navigator.clipboard.writeText(values)
  localTone.value = 'success'
  localMessage.value = 'Theme values copied.'
  emit('copied', values)
}
</script>
