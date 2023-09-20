<template>
  <div class="bg-primary rounded-2xl p-4 relative">
    <h2 class="text-lg font-semibold mb-2">
      {{ person.name }} <span class="text-sm text-secondary">({{ person.lifespan }})</span>
    </h2>
    <div v-if="person.parents.length" class="mb-4">
      <h3 class="text-md font-semibold mb-2">
        <icon name="users" class="text-info mr-2" /> Parents:
      </h3>
      <ul class="list-disc pl-4">
        <li v-for="parent in person.parents" :key="parent">
          <button class="text-accent hover:underline" @click="loadBranch(parent)">
            {{ findPersonById(parent)?.name || 'Unknown' }}
          </button>
        </li>
      </ul>
    </div>
    <div v-if="person.children.length">
      <h3 class="text-md font-semibold mb-2">
        <icon name="child" class="text-info mr-2" /> Children:
      </h3>
      <ul class="list-disc pl-4">
        <li v-for="child in person.children" :key="child">
          <button class="text-accent hover:underline" @click="loadBranch(child)">
            {{ findPersonById(child)?.name || 'Unknown' }}
          </button>
        </li>
      </ul>
    </div>
    <div v-if="person.occupation" class="absolute top-2 right-2 bg-info p-2 rounded-full">
      <span class="text-sm">{{ person.occupation }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Person } from '~/stores/familyTreeStore'

const { person, findPersonById } = defineProps<{
  person: Person
  findPersonById: (id: string) => Person | undefined
}>()

const emit = defineEmits<{
  (event: 'loadBranch', id: string): void
}>()

const loadBranch = (id: string) => {
  emit('loadBranch', id)
}
</script>
