<template>
  <div class="flex flex-col gap-6 p-4">
    <!-- File Folder Modes Section -->
    <div class="flex gap-2 border-b-2 border-base-300">
      <div
        v-for="mode in modes"
        :key="mode.name"
        @click="displayStore.mode = mode.name"
        :class="[
          'flex items-center gap-2 px-4 py-2 cursor-pointer border rounded-t-lg',
          mode.name === displayStore.mode
            ? 'bg-base-200 text-primary border-primary border-b-transparent'
            : 'bg-base-100 text-base-content hover:bg-base-200 border-base-300'
        ]"
      >
        <Icon :name="mode.icon" class="w-6 h-6" />
        <span class="text-lg font-semibold">{{ mode.label }}</span>
      </div>
    </div>

    <!-- Dynamic Component -->
    <div class="flex-grow flex items-center justify-center bg-base-200 rounded-xl p-6">
      <Suspense>
        <template #default>
          <component :is="getDynamicComponent(displayStore.mode)" :action="displayStore.action" />
        </template>
        <template #fallback>
          <div class="text-center">
            <Icon name="error" class="text-error text-5xl" />
            <p class="text-lg font-semibold mt-4">Unable to load component for mode: {{ displayStore.mode }}</p>
          </div>
        </template>
      </Suspense>
    </div>

    <!-- Actions Section -->
    <div class="flex justify-center gap-4">
      <button
        v-for="action in actions"
        :key="action.name"
        @click="displayStore.action = action.name"
        :class="['btn btn-lg', action.name === displayStore.action ? 'btn-primary' : 'btn-secondary']"
      >
        <Icon :name="action.icon" class="w-6 h-6" />
        <span class="ml-2">{{ action.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore';

const displayStore = useDisplayStore();

const modes = [
  { name: 'scenario', icon: 'scenario', label: 'Scenario' },
  { name: 'character', icon: 'character', label: 'Character' },
  { name: 'reward', icon: 'reward', label: 'Reward' },
  { name: 'chat', icon: 'chat', label: 'Chat' },
  { name: 'bot', icon: 'bot', label: 'Bot' },
  { name: 'pitch', icon: 'pitch', label: 'Pitch' },
  { name: 'art', icon: 'art', label: 'Art' },
  { name: 'collection', icon: 'collection', label: 'Collection' },
  { name: 'user', icon: 'user', label: 'User' },
];

const actions = [
  { name: 'gallery', icon: 'gallery', label: 'Gallery' },
  { name: 'card', icon: 'card', label: 'Card' },
  { name: 'add', icon: 'add', label: 'Add' },
  { name: 'edit', icon: 'edit', label: 'Edit' },
  { name: 'generate', icon: 'generate', label: 'Generate' },
  { name: 'interact', icon: 'interact', label: 'Interact' },
];

// Helper to check if an icon exists (mocked for this example)
function isValidIcon(iconName: string): boolean {
  const availableIcons = ['scenario', 'character', 'reward', 'chat', 'bot', 'pitch', 'art', 'collection', 'user', 'gallery', 'card', 'add', 'edit', 'generate', 'interact'];
  return availableIcons.includes(iconName);
}

// Get the dynamic component name and provide a fallback
function getDynamicComponent(mode: string): string {
  try {
    return `mode-${mode}`;
  } catch {
    return 'fallback-component';
  }
}
</script>
