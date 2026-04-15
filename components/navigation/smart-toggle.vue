<!-- /components/smart/smart-toggle.vue -->
<template>
  <button
    :type="type"
    :aria-pressed="modelValue"
    :title="hoverText"
    class="group inline-flex border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[
      baseShapeClass,
      orientationClass,
      sizeClass,
      toneClass,
      placementClass,
      clickableClass,
    ]"
    :style="toggleStyle"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <Icon
      :name="currentIcon"
      :class="iconClass"
    />

    <span
      v-if="showInlineText"
      class="font-bold leading-none"
      :class="textClass"
    >
      {{ currentLabel }}
    </span>

    <span
      v-if="showFloatingLabel"
      class="pointer-events-none absolute whitespace-nowrap rounded-2xl border border-base-300 bg-base-100/95 px-2 py-1 text-xs font-bold shadow-lg backdrop-blur"
      :class="labelPositionClass"
    >
      {{ currentLabel }}
    </span>
  </button>
</template>

<script setup lang="ts">
// /components/smart/smart-toggle.vue
import { computed, ref } from 'vue'

type ToggleSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type ToggleTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'ghost'
type LabelPosition = 'top' | 'bottom' | 'left' | 'right'
type ToggleShape = 'circle' | 'square' | 'pill'
type ToggleOrientation = 'icon' | 'horizontal' | 'vertical'
type TogglePlacement = 'inline' | 'fixed' | 'corner' | 'nav'
type CornerPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
type NavPosition = 'left' | 'center' | 'right'

interface SmartToggleProps {
  modelValue: boolean
  onIcon?: string
  offIcon?: string
  onLabel?: string
  offLabel?: string
  hoverLabel?: string
  size?: ToggleSize
  toneOn?: ToggleTone
  toneOff?: ToggleTone
  labelPosition?: LabelPosition
  showLabel?: boolean
  showHoverLabel?: boolean
  shape?: ToggleShape
  orientation?: ToggleOrientation
  placement?: TogglePlacement
  corner?: CornerPosition
  navPosition?: NavPosition
  fixed?: boolean
  top?: string
  right?: string
  bottom?: string
  left?: string
  zIndex?: number | string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<SmartToggleProps>(), {
  onIcon: 'kind-icon:toggle-right.',
  offIcon: 'kind-icon:toggle-left.',
  onLabel: 'On',
  offLabel: 'Off',
  hoverLabel: '',
  size: 'md',
  toneOn: 'success',
  toneOff: 'ghost',
  labelPosition: 'top',
  showLabel: false,
  showHoverLabel: true,
  shape: 'pill',
  orientation: 'icon',
  placement: 'inline',
  corner: 'top-right',
  navPosition: 'left',
  fixed: false,
  top: '',
  right: '',
  bottom: '',
  left: '',
  zIndex: 10002,
  disabled: false,
  type: 'button',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  toggle: [value: boolean]
}>()

const isHovered = ref(false)

const currentIcon = computed(() => {
  return props.modelValue ? props.onIcon : props.offIcon
})

const currentLabel = computed(() => {
  return props.modelValue ? props.onLabel : props.offLabel
})

const hoverText = computed(() => {
  return props.hoverLabel || currentLabel.value
})

const toneMap: Record<ToggleTone, string> = {
  neutral: 'border-base-300 bg-base-200 text-base-content hover:bg-base-300',
  primary: 'border-primary/40 bg-primary/15 text-primary hover:bg-primary/25',
  secondary: 'border-secondary/40 bg-secondary/15 text-secondary hover:bg-secondary/25',
  accent: 'border-accent/40 bg-accent/15 text-accent hover:bg-accent/25',
  success: 'border-success/40 bg-success/15 text-success hover:bg-success/25',
  warning: 'border-warning/40 bg-warning/15 text-warning hover:bg-warning/25',
  error: 'border-error/40 bg-error/15 text-error hover:bg-error/25',
  ghost: 'border-base-300 bg-base-100/90 text-base-content hover:bg-base-200',
}

const sizeClassMap: Record<ToggleSize, string> = {
  xs: 'min-h-7 min-w-7 px-2 py-1 text-xs',
  sm: 'min-h-9 min-w-9 px-2.5 py-1.5 text-sm',
  md: 'min-h-11 min-w-11 px-3 py-2 text-base',
  lg: 'min-h-14 min-w-14 px-4 py-3 text-lg',
  xl: 'min-h-16 min-w-16 px-5 py-4 text-xl',
}

const iconClassMap: Record<ToggleSize, string> = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

const textClassMap: Record<ToggleSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
}

const sizeClass = computed(() => sizeClassMap[props.size])
const iconClass = computed(() => iconClassMap[props.size])
const textClass = computed(() => textClassMap[props.size])

const toneClass = computed(() => {
  return props.modelValue ? toneMap[props.toneOn] : toneMap[props.toneOff]
})

const baseShapeClass = computed(() => {
  if (props.shape === 'circle') return 'rounded-full items-center justify-center'
  if (props.shape === 'square') return 'rounded-2xl items-center justify-center'
  return 'rounded-full items-center justify-center'
})

const orientationClass = computed(() => {
  if (props.orientation === 'vertical') return 'flex-col gap-1.5'
  if (props.orientation === 'horizontal') return 'flex-row gap-2'
  return 'flex-row gap-0'
})

const showInlineText = computed(() => {
  return props.orientation === 'horizontal' || props.orientation === 'vertical'
})

const showFloatingLabel = computed(() => {
  if (showInlineText.value) return false
  if (props.showLabel) return true
  return props.showHoverLabel && isHovered.value
})

const placementClass = computed(() => {
  if (props.placement === 'fixed' || props.fixed) return 'fixed'
  if (props.placement === 'corner') return 'fixed'
  if (props.placement === 'nav') return 'relative'
  return 'relative'
})

const clickableClass = computed(() => {
  return props.disabled ? '' : 'hover:scale-105 active:scale-95'
})

const labelPositionClass = computed(() => {
  if (props.labelPosition === 'bottom') return 'left-1/2 top-full mt-2 -translate-x-1/2'
  if (props.labelPosition === 'left') return 'right-full top-1/2 mr-2 -translate-y-1/2'
  if (props.labelPosition === 'right') return 'left-full top-1/2 ml-2 -translate-y-1/2'
  return 'bottom-full left-1/2 mb-2 -translate-x-1/2'
})

const toggleStyle = computed(() => {
  const style: Record<string, string | number> = {
    zIndex: props.zIndex,
  }

  if (props.placement === 'corner') {
    if (props.corner === 'top-left') {
      style.top = '1rem'
      style.left = '1rem'
    }
    if (props.corner === 'top-right') {
      style.top = '1rem'
      style.right = '1rem'
    }
    if (props.corner === 'bottom-left') {
      style.bottom = '1rem'
      style.left = '1rem'
    }
    if (props.corner === 'bottom-right') {
      style.bottom = '1rem'
      style.right = '1rem'
    }
  }

  if (props.placement === 'fixed' || props.fixed) {
    if (props.top) style.top = props.top
    if (props.right) style.right = props.right
    if (props.bottom) style.bottom = props.bottom
    if (props.left) style.left = props.left
  }

  if (props.placement === 'nav') {
    if (props.navPosition === 'center') {
      style.marginLeft = 'auto'
      style.marginRight = 'auto'
    }
    if (props.navPosition === 'right') {
      style.marginLeft = 'auto'
    }
  }

  return style
})

function handleClick() {
  if (props.disabled) return
  const nextValue = !props.modelValue
  emit('update:modelValue', nextValue)
  emit('toggle', nextValue)
}
</script>