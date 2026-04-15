<!-- /app.vue -->
<template>
  <div class="min-h-dvh w-full bg-base-200 text-base-content">
    <div class="fixed top-3 left-3 right-3 z-[100]">
      <div class="rounded-2xl border border-base-300 bg-base-100/95 shadow-2xl backdrop-blur">
        <div class="flex flex-col gap-3 p-3">
          <div class="flex flex-wrap items-center gap-2">
            <div class="rounded-2xl border border-primary bg-primary/10 px-3 py-2 text-sm font-black uppercase tracking-[0.25em] text-primary">
              App Shell Debug
            </div>

            <div class="rounded-2xl border border-base-300 px-3 py-2 text-sm">
              Active: <span class="font-bold uppercase">{{ activeLayout }}</span>
            </div>

            <div class="rounded-2xl border border-base-300 px-3 py-2 text-sm">
              Width: <span class="font-bold">{{ windowWidth }}px</span>
            </div>

            <div class="rounded-2xl border border-base-300 px-3 py-2 text-sm">
              Mode: <span class="font-bold uppercase">{{ panelMode }}</span>
            </div>
          </div>

          <div class="grid gap-2 lg:grid-cols-3">
            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="option in layoutOptions"
                :key="option"
                class="btn btn-sm rounded-2xl"
                :class="selectedLayout === option ? 'btn-primary' : 'btn-outline'"
                @click="selectedLayout = option"
              >
                {{ option }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                v-for="option in panelModes"
                :key="option"
                class="btn btn-sm rounded-2xl"
                :class="panelMode === option ? 'btn-secondary' : 'btn-outline'"
                @click="panelMode = option"
              >
                {{ option }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button class="btn btn-sm btn-accent rounded-2xl" @click="applyLayoutDefaults(activeLayout)">
                Reset to {{ activeLayout }} defaults
              </button>
              <button class="btn btn-sm btn-outline rounded-2xl" @click="showControls = !showControls">
                {{ showControls ? 'Hide' : 'Show' }} Controls
              </button>
            </div>
          </div>

          <div v-if="showControls" class="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <button class="btn btn-sm rounded-2xl" :class="showHeader ? 'btn-success' : 'btn-outline'" @click="showHeader = !showHeader">
              Header {{ showHeader ? 'On' : 'Off' }}
            </button>

            <button class="btn btn-sm rounded-2xl" :class="showLeft ? 'btn-success' : 'btn-outline'" @click="showLeft = !showLeft">
              Left {{ showLeft ? 'On' : 'Off' }}
            </button>

            <button class="btn btn-sm rounded-2xl" :class="showRight ? 'btn-success' : 'btn-outline'" @click="showRight = !showRight">
              Right {{ showRight ? 'On' : 'Off' }}
            </button>

            <button class="btn btn-sm rounded-2xl" :class="showFooter ? 'btn-success' : 'btn-outline'" @click="showFooter = !showFooter">
              Footer {{ showFooter ? 'On' : 'Off' }}
            </button>

            <button class="btn btn-sm rounded-2xl" :class="showLabels ? 'btn-info' : 'btn-outline'" @click="showLabels = !showLabels">
              Labels {{ showLabels ? 'On' : 'Off' }}
            </button>

            <button class="btn btn-sm rounded-2xl" :class="showTint ? 'btn-info' : 'btn-outline'" @click="showTint = !showTint">
              Tints {{ showTint ? 'On' : 'Off' }}
            </button>

            <button class="btn btn-sm rounded-2xl" :class="showBorders ? 'btn-info' : 'btn-outline'" @click="showBorders = !showBorders">
              Borders {{ showBorders ? 'On' : 'Off' }}
            </button>

            <button class="btn btn-sm rounded-2xl" :class="showSafeContent ? 'btn-warning' : 'btn-outline'" @click="showSafeContent = !showSafeContent">
              Placeholders {{ showSafeContent ? 'On' : 'Off' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="h-[8.75rem] w-full"></div>

    <div
      class="relative mx-auto w-full max-w-[1800px] p-2 sm:p-3 md:p-4"
      :class="panelMode === 'overlay' ? 'min-h-[calc(100dvh-8.75rem)]' : ''"
    >
      <div
        v-if="showTint"
        class="pointer-events-none absolute inset-0 rounded-3xl border border-base-300 bg-base-100/40"
      ></div>

      <div
        v-if="showHeader"
        class="relative rounded-2xl"
        :class="[
          showBorders ? 'border-2 border-primary' : '',
          showTint ? 'bg-primary/15' : 'bg-base-100',
          panelMode === 'overlay' ? 'absolute left-2 right-2 top-2 z-30' : 'mb-3',
        ]"
        :style="headerStyle"
      >
        <DebugBadge v-if="showLabels" label="Header" tone="primary" :details="`${activeLayout} · ${Math.round(layoutConfig.header)}vh`" />
        <div class="h-full min-h-0 p-3">
          <div v-if="showSafeContent" class="flex h-full min-h-[72px] items-center justify-center rounded-2xl border border-primary/30 bg-base-100/70 text-center text-sm font-semibold">
            Header region
          </div>
        </div>
      </div>

      <div
        class="relative min-h-[60dvh]"
        :class="panelMode === 'split' ? splitBodyClass : ''"
        :style="panelMode === 'overlay' ? overlayBodyStyle : undefined"
      >
        <div
          v-if="showLeft"
          class="relative rounded-2xl"
          :class="[
            showBorders ? 'border-2 border-secondary' : '',
            showTint ? 'bg-secondary/15' : 'bg-base-100',
            panelMode === 'split' ? '' : 'absolute left-2 top-2 bottom-2 z-20',
          ]"
          :style="leftStyle"
        >
          <DebugBadge v-if="showLabels" label="Left Sidebar" tone="secondary" :details="leftDetail" />
          <div class="h-full overflow-auto p-3">
            <div v-if="showSafeContent" class="flex min-h-full items-center justify-center rounded-2xl border border-secondary/30 bg-base-100/70 text-center text-sm font-semibold">
              Left sidebar region
            </div>
          </div>
        </div>

        <main
          class="relative min-h-[50dvh] rounded-2xl"
          :class="[
            showBorders ? 'border-2 border-accent' : '',
            showTint ? 'bg-accent/10' : 'bg-base-100',
            panelMode === 'split' ? '' : 'absolute inset-2 z-10',
          ]"
          :style="mainStyle"
        >
          <DebugBadge v-if="showLabels" label="Main Content" tone="accent" :details="mainDetail" />
          <div class="h-full overflow-auto p-3 sm:p-4 md:p-5">
            <div v-if="showSafeContent" class="mb-4 rounded-2xl border border-accent/30 bg-base-100/70 p-4">
              <div class="text-lg font-black uppercase tracking-[0.2em] text-accent">
                Main Content
              </div>
              <p class="mt-2 text-sm opacity-80">
                This is the safe shell inside app.vue. Your page content should appear below even if the usual layout chain is being dramatic.
              </p>
            </div>

            <NuxtPage />
          </div>
        </main>

        <div
          v-if="showRight"
          class="relative rounded-2xl"
          :class="[
            showBorders ? 'border-2 border-warning' : '',
            showTint ? 'bg-warning/15' : 'bg-base-100',
            panelMode === 'split' ? '' : 'absolute right-2 top-2 bottom-2 z-20',
          ]"
          :style="rightStyle"
        >
          <DebugBadge v-if="showLabels" label="Right Sidebar" tone="warning" :details="rightDetail" />
          <div class="h-full overflow-auto p-3">
            <div v-if="showSafeContent" class="flex min-h-full items-center justify-center rounded-2xl border border-warning/30 bg-base-100/70 text-center text-sm font-semibold">
              Right sidebar region
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showFooter"
        class="relative rounded-2xl"
        :class="[
          showBorders ? 'border-2 border-success' : '',
          showTint ? 'bg-success/15' : 'bg-base-100',
          panelMode === 'overlay' ? 'absolute left-2 right-2 bottom-2 z-30' : 'mt-3',
        ]"
        :style="footerStyle"
      >
        <DebugBadge v-if="showLabels" label="Footer" tone="success" :details="`${activeLayout} · ${Math.round(layoutConfig.footer)}vh`" />
        <div class="h-full min-h-0 p-3">
          <div v-if="showSafeContent" class="flex h-full min-h-[72px] items-center justify-center rounded-2xl border border-success/30 bg-base-100/70 text-center text-sm font-semibold">
            Footer region
          </div>
        </div>
      </div>
    </div>

    <div class="fixed bottom-3 right-3 z-[100]">
      <div class="rounded-2xl border border-base-300 bg-base-100/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
        <div class="font-black uppercase tracking-[0.2em]">
          {{ panelMode === 'overlay' ? 'Overlay' : 'Split' }}
        </div>
        <div class="opacity-80">
          {{ showHeader ? 'H' : '·' }}
          {{ showLeft ? 'L' : '·' }}
          {{ showRight ? 'R' : '·' }}
          {{ showFooter ? 'F' : '·' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSmartbarStore } from '@/stores/smartbarStore'

type LayoutMode = 'auto' | 'mobile' | 'tablet' | 'desktop'
type ActiveLayout = 'mobile' | 'tablet' | 'desktop'
type PanelMode = 'split' | 'overlay'

interface LayoutConfig {
  header: number
  footer: number
  left: number
  right: number
  stackedSidebars: boolean
}

const smartbarStore = useSmartbarStore()
const router = useRouter()

const isNavigating = ref(false)
const showSwarm = computed(() => smartbarStore.showSwarm)

const selectedLayout = ref<LayoutMode>('auto')
const panelMode = ref<PanelMode>('split')
const showControls = ref(true)

const showHeader = ref(true)
const showLeft = ref(true)
const showRight = ref(false)
const showFooter = ref(true)

const showLabels = ref(true)
const showTint = ref(true)
const showBorders = ref(true)
const showSafeContent = ref(true)

const windowWidth = ref(0)

const layoutOptions: LayoutMode[] = ['auto', 'mobile', 'tablet', 'desktop']
const panelModes: PanelMode[] = ['split', 'overlay']

const DebugBadge = defineComponent({
  name: 'DebugBadge',
  props: {
    label: {
      type: String,
      required: true,
    },
    tone: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    return () =>
      h('div', { class: 'pointer-events-none absolute top-2 left-2 z-40' }, [
        h(
          'div',
          {
            class: `rounded-2xl border bg-base-100/90 px-3 py-2 text-xs font-black uppercase tracking-[0.25em] shadow-lg backdrop-blur border-${props.tone} text-${props.tone}`,
          },
          [
            h('div', props.label),
            props.details
              ? h(
                  'div',
                  {
                    class: 'mt-1 text-[10px] font-semibold normal-case tracking-normal opacity-75',
                  },
                  props.details,
                )
              : null,
          ],
        ),
      ])
  },
})

function handleResize() {
  windowWidth.value = window.innerWidth
}

const activeLayout = computed<ActiveLayout>(() => {
  if (selectedLayout.value === 'mobile') return 'mobile'
  if (selectedLayout.value === 'tablet') return 'tablet'
  if (selectedLayout.value === 'desktop') return 'desktop'

  if (windowWidth.value < 768) return 'mobile'
  if (windowWidth.value < 1024) return 'tablet'
  return 'desktop'
})

const layoutConfig = computed<LayoutConfig>(() => {
  if (activeLayout.value === 'mobile') {
    return {
      header: 10,
      footer: 10,
      left: 100,
      right: 100,
      stackedSidebars: true,
    }
  }

  if (activeLayout.value === 'tablet') {
    return {
      header: 12,
      footer: 11,
      left: 24,
      right: 30,
      stackedSidebars: false,
    }
  }

  return {
    header: 11,
    footer: 10,
    left: 18,
    right: 22,
    stackedSidebars: false,
  }
})

function applyLayoutDefaults(layout: ActiveLayout) {
  if (layout === 'mobile') {
    showHeader.value = true
    showLeft.value = false
    showRight.value = false
    showFooter.value = true
    return
  }

  if (layout === 'tablet') {
    showHeader.value = true
    showLeft.value = true
    showRight.value = false
    showFooter.value = true
    return
  }

  showHeader.value = true
  showLeft.value = true
  showRight.value = true
  showFooter.value = true
}

watch(
  activeLayout,
  (layout) => {
    applyLayoutDefaults(layout)
  },
  { immediate: true },
)

const splitBodyClass = computed(() => {
  if (activeLayout.value === 'mobile' && (showLeft.value || showRight.value)) {
    return 'grid gap-3'
  }

  const hasLeft = showLeft.value
  const hasRight = showRight.value

  if (hasLeft && hasRight) {
    return 'grid gap-3'
  }

  if (hasLeft || hasRight) {
    return 'grid gap-3'
  }

  return 'block'
})

const overlayBodyStyle = computed(() => {
  const topOffset = showHeader.value ? layoutConfig.value.header : 0
  const bottomOffset = showFooter.value ? layoutConfig.value.footer : 0

  return {
    minHeight: `calc(100dvh - 8.75rem - ${topOffset}vh - ${bottomOffset}vh - 2rem)`,
  }
})

const headerStyle = computed(() => ({
  minHeight: `max(72px, ${layoutConfig.value.header}vh)`,
}))

const footerStyle = computed(() => ({
  minHeight: `max(72px, ${layoutConfig.value.footer}vh)`,
}))

const leftDetail = computed(() => {
  if (activeLayout.value === 'mobile') return 'stacked drawer'
  return `${layoutConfig.value.left}vw`
})

const rightDetail = computed(() => {
  if (activeLayout.value === 'mobile') return 'stacked drawer'
  return `${layoutConfig.value.right}vw`
})

const mainDetail = computed(() => {
  return panelMode.value === 'overlay' ? 'underlapping canvas' : 'page canvas'
})

const leftStyle = computed(() => {
  if (panelMode.value === 'overlay') {
    return {
      width: activeLayout.value === 'mobile' ? 'min(92vw, 28rem)' : `${layoutConfig.value.left}vw`,
    }
  }

  if (activeLayout.value === 'mobile') {
    return {
      minHeight: '18dvh',
      width: '100%',
      order: 1,
    }
  }

  return {
    width: `${layoutConfig.value.left}vw`,
  }
})

const rightStyle = computed(() => {
  if (panelMode.value === 'overlay') {
    return {
      width: activeLayout.value === 'mobile' ? 'min(92vw, 28rem)' : `${layoutConfig.value.right}vw`,
    }
  }

  if (activeLayout.value === 'mobile') {
    return {
      minHeight: '18dvh',
      width: '100%',
      order: 3,
    }
  }

  return {
    width: `${layoutConfig.value.right}vw`,
  }
})

const mainStyle = computed(() => {
  if (panelMode.value === 'overlay') {
    return {
      minHeight: `calc(100% - 1rem)`,
    }
  }

  if (activeLayout.value === 'mobile') {
    return {
      minHeight: '50dvh',
      width: '100%',
      order: 2,
    }
  }

  if (showLeft.value && showRight.value) {
    return {
      minHeight: '60dvh',
    }
  }

  return {
    minHeight: '60dvh',
  }
})

router.beforeEach(() => {
  isNavigating.value = true
})

router.afterEach(() => {
  window.setTimeout(() => {
    isNavigating.value = false
  }, 400)
})

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

useHead({
  link: [{ rel: 'icon', type: 'image/png', href: 'favicon.ico' }],
})
</script>