<template>
  <div>
    <demo-card />
  </div>
  <div>
    <button @click="showSelector = !showSelector">Settings</button>
  </div>
  <div v-if="showSelector">
    <!-- Background Color Selector -->
    <label for="bg-color">Background Color:</label>
    <select id="bg-color" v-model="bgColor">
      <option value="primary">Primary</option>
      <option value="accent">Accent</option>
      <option value="secondary">Secondary</option>
      <option value="base">Base</option>
      <!-- add more options as needed -->
    </select>

    <!-- Border Color Selector -->
    <label for="border-color">Border Color:</label>
    <select id="border-color" v-model="borderColor">
      <option value="primary">Primary</option>
      <option value="accent">Accent</option>
      <option value="secondary">Secondary</option>
      <option value="base">Base</option>
    </select>

    <!-- Border Size Selector -->
    <label for="border-size">Border Size:</label>
    <select id="border-size" v-model="borderSize">
      <option value="0">0</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
    </select>

    <!-- Border Radius Selector -->
    <label for="border-radius">Border Radius:</label>
    <select id="border-radius" v-model="borderRadius">
      <option value="none">None</option>
      <option value="sm">Small</option>
      <option value="md">Medium</option>
      <option value="lg">Large</option>
      <option value="full">Full</option>
    </select>

    <!-- Padding Size Selector -->
    <label for="padding-size">Padding Size:</label>
    <select id="padding-size" v-model="paddingSize">
      <option value="0">0</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
    </select>

    <!-- Button Color Selector -->
    <label for="button-color">Button Color:</label>
    <select id="button-color" v-model="buttonColor">
      <option value="primary">Primary</option>
      <option value="accent">Accent</option>
      <option value="secondary">Secondary</option>
      <option value="base">Base</option>
    </select>
  </div>
</template>

<script setup lang="ts">
let showSelector = ref(false)
let bgColor = ref('base')
let borderColor = ref('accent')
let borderSize = ref('2')
let borderRadius = ref('lg')
let paddingSize = ref('4')
let buttonColor = ref('primary')

provide('bgColor', bgColor)
provide('borderColor', borderColor)
provide('borderSize', borderSize)
provide('borderRadius', borderRadius)
provide('paddingSize', paddingSize)
provide('buttonColor', buttonColor)
</script>
