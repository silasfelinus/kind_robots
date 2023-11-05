<template>
  <div class="toggle-container flex justify-between items-center w-full">
    <span>Bot View</span>
    <label class="switch">
      <input type="checkbox" role="switch" aria-label="Toggle view" :checked="isChecked" @change="toggleView" />
      <span class="slider"></span>
    </label>
    <span>Nav View</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  isChecked: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['change']);

const toggleView = () => {
  emit('change');
};
</script>

<style scoped>
/* Switch toggle styles */
.switch {
  position: relative;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4caf50;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196f3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}
</style>
