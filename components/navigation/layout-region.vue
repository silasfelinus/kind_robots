<!-- /components/layout/layout-region.vue -->
<template>
  <section
    v-if="show"
    class="relative min-h-0 overflow-hidden"
    :class="[baseClass, toneClass, paddingClass, roundedClass, borderClass, sectionClass]"
    :style="sectionStyle"
  >
    <div
      v-if="showLabel"
      class="pointer-events-none absolute top-2 z-20 rounded-2xl border bg-base-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] shadow-lg"
      :class="[labelToneClass, labelPositionClass]"
    >
      {{ title }}
    </div>

    <div
      v-if="canToggleVisibility"
      class="absolute top-2 z-30"
      :class="togglePositionClass"
    >
      <smart-toggle
        :model-value="show"
        :on-icon="visibleOnIcon"
        :off-icon="visibleOffIcon"
        :on-label="visibleOnLabel"
        :off-label="visibleOffLabel"
        orientation="icon"
        size="xs"
        :tone-on="toggleTone"
        tone-off="ghost"
        :label-position="toggleLabelPosition"
        @update:model-value="$emit('toggle-visibility', $event)"
      />
    </div>

    <div
      v-if="canToggleFiller"
      class="absolute top-12 z-30"
      :class="togglePositionClass"
    >
      <smart-toggle
        :model-value="showFiller"
        :on-icon="fillerOnIcon"
        :off-icon="fillerOffIcon"
        :on-label="fillerOnLabel"
        :off-label="fillerOffLabel"
        orientation="icon"
        size="xs"
        tone-on="primary"
        tone-off="ghost"
        :label-position="toggleLabelPosition"
        @update:model-value="$emit('toggle-filler', $event)"
      />
    </div>

    <div class="h-full min-h-0 w-full" :class="contentClass">
      <slot v-if="!showFiller" />
      <slot v-else name="filler">
        <div class="flex h-full min-h-[8rem] items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100/70 p-4 text-center">
          <div>
            <div class="text-sm font-black uppercase tracking-[0.2em]">
              {{ title }}
            </div>
            <div class="mt-2 text-sm opacity-70">
              Filler content
            </div>
          </div>
        </div>
      </slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'

type RegionTone = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'info' | 'neutral'
type ToggleSide = 'left' | 'right'
type RegionPadding = 'none' | 'sm' | 'md' | 'lg'

interface LayoutRegionProps {
  title: string
  show?: boolean
  showFiller?: boolean
  showLabel?: boolean
  canToggleVisibility?: boolean
  canToggleFiller?: boolean
  tone?: RegionTone
  toggleSide?: ToggleSide
  sectionClass?: string
  contentClass?: string
  baseClass?: string
  rounded?: boolean
  bordered?: boolean
  padded?: RegionPadding
  minHeight?: string
  height?: string
  width?: string
  visibleOnIcon?: string
  visibleOffIcon?: string
  fillerOnIcon?: string
  fillerOffIcon?: string
  visibleOnLabel?: string
  visibleOffLabel?: string
  fillerOnLabel?: string
  fillerOffLabel?: string
}

const props = withDefaults(defineProps<LayoutRegionProps>(), {
  show: true,
  showFiller: false,
  showLabel: true,
  canToggleVisibility: true,
  canToggleFiller: false,
  tone: 'neutral',
  toggleSide: 'right',
  sectionClass: '',
  contentClass: '',
  baseClass: '',
  rounded: true,
  bordered: true,
  padded: 'md',
  minHeight: '',
  height: '',
  width: '',
  visibleOnIcon: 'kind-icon:eye.',
  visibleOffIcon: 'kind-icon:eye-off.',
  fillerOnIcon: 'kind-icon:gallery.',
  fillerOffIcon: 'kind-icon:close.',
  visibleOnLabel: 'Visible',
  visibleOffLabel: 'Hidden',
  fillerOnLabel: 'Filler',
  fillerOffLabel: 'Live',
})

defineEmits<{
  'toggle-visibility': [value: boolean]
  'toggle-filler': [value: boolean]
}>()

const toneClassMap: Record<RegionTone, string> = {
  primary: 'bg-primary/10',
  secondary: 'bg-secondary/10',
  accent: 'bg-accent/10',
  success: 'bg-success/10',
  warning: 'bg-warning/10',
  info: 'bg-info/10',
  neutral: 'bg-base-100',
}

const labelToneClassMap: Record<RegionTone, string> = {
  primary: 'border-primary text-primary',
  secondary: 'border-secondary text-secondary',
  accent: 'border-accent text-accent',
  success: 'border-success text-success',
  warning: 'border-warning text-warning',
  info: 'border-info text-info',
  neutral: 'border-base-300 text-base-content',
}

const toggleToneMap: Record<RegionTone, string> = {
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  info: 'primary',
  neutral: 'neutral',
}

const paddingClassMap: Record<RegionPadding, string> = {
  none: '',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
}

const toneClass = computed(() => toneClassMap[props.tone])
const labelToneClass = computed(() => labelToneClassMap[props.tone])
const toggleTone = computed(() => toggleToneMap[props.tone])
const paddingClass = computed(() => paddingClassMap[props.padded])
const roundedClass = computed(() => (props.rounded ? 'rounded-2xl' : ''))
const borderClass = computed(() =>
  props.bordered ? 'border border-base-300' : '',
)

const labelPositionClass = computed(() => {
  return props.toggleSide === 'left' ? 'left-2' : 'left-2'
})

const togglePositionClass = computed(() => {
  return props.toggleSide === 'left' ? 'left-2' : 'right-2'
})

const toggleLabelPosition = computed(() => {
  return props.toggleSide === 'left' ? 'right' : 'left'
})

const sectionStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {}
  if (props.minHeight) style.minHeight = props.minHeight
  if (props.height) style.height = props.height
  if (props.width) style.width = props.width
  return style
})
</script>