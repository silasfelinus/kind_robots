<template>
  <img
    ref="element"
    v-bind="$attrs"
    :src="activeSrc || undefined"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    decoding="async"
    :fetchpriority="fetchPriority"
    @error="emit('error', $event)"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  observeViewportHydration,
  type ViewportHydrationPriority,
} from '@/utils/viewportHydration'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    eager?: boolean
  }>(),
  {
    src: '',
    alt: '',
    eager: false,
  },
)

const emit = defineEmits<{ error: [event: Event] }>()

const element = ref<HTMLImageElement>()
const activeSrc = ref(props.eager ? props.src : '')
const fetchPriority = ref<ViewportHydrationPriority>(props.eager ? 'high' : 'low')
let mounted = false
let stopObserving: (() => void) | null = null

function reset(): void {
  stopObserving?.()
  stopObserving = null

  if (!props.src) {
    activeSrc.value = ''
    fetchPriority.value = 'low'
    return
  }

  if (props.eager) {
    activeSrc.value = props.src
    fetchPriority.value = 'high'
    return
  }

  activeSrc.value = ''
  fetchPriority.value = 'low'
  if (!mounted || !element.value) return

  stopObserving = observeViewportHydration(element.value, (priority) => {
    fetchPriority.value = priority
    activeSrc.value = props.src
    stopObserving = null
  })
}

watch(() => [props.src, props.eager] as const, reset)

onMounted(() => {
  mounted = true
  reset()
})

onBeforeUnmount(() => {
  mounted = false
  stopObserving?.()
  stopObserving = null
})
</script>
