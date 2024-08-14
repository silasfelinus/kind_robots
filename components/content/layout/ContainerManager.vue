<template>
  <div class="container-manager">
    <div class="controls">
      <div class="control-group">
        <h3>Outer Container (Base Card)</h3>
        <div
          v-for="(option, index) in outerOptions"
          :key="index"
          class="control-item"
        >
          <label :for="option.property">{{ option.label }}</label>
          <select v-model="store[option.property]" :name="option.property">
            <option v-for="value in option.values" :key="value" :value="value">
              {{ value }}
            </option>
          </select>
        </div>
      </div>

      <div class="control-group">
        <h3>Inner Container</h3>
        <div
          v-for="(option, index) in innerOptions"
          :key="index"
          class="control-item"
        >
          <label :for="option.property">{{ option.label }}</label>
          <select v-model="store[option.property]" :name="option.property">
            <option v-for="value in option.values" :key="value" :value="value">
              {{ value }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <base-card :class="outerContainerClasses">
      <div
        v-for="(container, index) in containers"
        :key="index"
        :class="containerClasses"
        :style="containerStyles"
        @click="activateContainer(index)"
      >
        <div>{{ container.label }}</div>
        <div class="content">
          {{ container.content }}
        </div>
      </div>
    </base-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContainerStore } from '@/stores/containerStore'

const store = useContainerStore()

interface Option {
  property: keyof typeof store.$state
  label: string
  values: string[]
}

const outerOptions: Option[] = [
  {
    property: 'outerBgColor',
    label: 'Background Color',
    values: store.containerColors,
  },
]

const innerOptions: Option[] = [
  {
    property: 'bgColor',
    label: 'Background Color',
    values: store.containerColors,
  },
  { property: 'margin', label: 'Margin', values: store.containerMargins },
  { property: 'padding', label: 'Padding', values: store.containerPaddings },
  {
    property: 'borderRadius',
    label: 'Border Radius',
    values: store.containerBorderRadius,
  },
  { property: 'border', label: 'Border', values: store.containerBorders },
  { property: 'shadow', label: 'Shadow', values: store.containerShadows },
  {
    property: 'transition',
    label: 'Transition',
    values: store.containerTransitions,
  },
  { property: 'backdrop', label: 'Backdrop', values: store.containerBackdrops },
]
const outerContainerClasses = computed(() => [store.outerBgColor])

const containerClasses = computed(() => [
  store.bgColor,
  store.margin,
  store.padding,
  store.borderRadius,
  store.border,
  store.shadow,
  store.transition,
  store.backdrop,
])

const containerStyles = computed(() => ({}))

const containers = ref([
  {
    label: 'Container 1',
    content:
      'Here is some filler text to give the container some body and prevent it from being squished.',
    active: true,
  },
  {
    label: 'Container 2',
    content: 'Here is some different filler text for the second container.',
    active: false,
  },
])

const activateContainer = (index: number) => {
  containers.value.forEach((container, idx) => {
    container.active = idx === index
  })
}
</script>

<style scoped>
.container-manager {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
}

.control-group {
  margin-bottom: 20px;
}

.control-group h3 {
  margin-bottom: 10px;
  font-size: 1.25em;
  color: var(--bg-primary);
}

.control-item {
  margin-bottom: 10px;
}

.control-item label {
  font-weight: bold;
  margin-right: 10px;
}

.base-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.content {
  margin-top: 10px;
}
</style>
