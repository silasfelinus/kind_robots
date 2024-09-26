<template>
  <div class="bg-base-300 p-4 rounded">
    <h2 class="text-xl mb-2">Add New Reward</h2>
    <form @submit.prevent="addReward">
      <!-- Icon Selection -->
      <div class="mb-2">
        <label for="Icon" class="block text-sm font-medium text-gray-600"
          >Icon</label
        >
        <select
          v-model="newReward.Icon"
          required
          class="p-2 rounded bg-base-300"
        >
          <option v-for="(name, label) in IconMap" :key="label" :value="name">
            {{ label }} - {{ name }}
          </option>
        </select>
      </div>
      <!-- Link to Game Icons set -->
      <a
        href="https://Icon-sets.Iconify.design/game-Icons/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Explore more Icons
      </a>
      <div class="mb-2">
        <label for="Icon" class="block text-sm font-medium text-gray-600"
          >Icon</label
        >
        <input
          id="Icon"
          v-model="newReward.Icon"
          placeholder="🌟"
          required
          class="p-2 rounded bg-base-300"
        />
      </div>
      <div class="mb-2">
        <label for="text" class="block text-sm font-medium text-gray-600"
          >Text</label
        >
        <input
          id="text"
          v-model="newReward.text"
          placeholder="Reward Text"
          required
          class="p-2 rounded bg-base-300"
        />
      </div>
      <div class="mb-2">
        <label for="power" class="block text-sm font-medium text-gray-600"
          >Power</label
        >
        <input
          id="power"
          v-model="newReward.power"
          placeholder="Reward Power"
          required
          class="p-2 rounded bg-base-300"
        />
      </div>
      <div class="mb-2">
        <label for="rarity" class="block text-sm font-medium text-gray-600"
          >Rarity</label
        >
        <input
          id="rarity"
          v-model="newReward.rarity"
          type="number"
          placeholder="50"
          class="p-2 rounded bg-base-300"
        />
      </div>
      <button type="submit" class="bg-primary text-default p-2 rounded">
        Add Reward
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRewardStore } from './../../../stores/rewardStore'
import IconMap from './../../../training/iconMap'

const rewardStore = useRewardStore()
const newReward = ref({
  Icon: '',
  text: '',
  power: '',
  rarity: 50,
})

const addReward = async () => {
  await rewardStore.createReward(newReward.value)
  newReward.value = {
    Icon: '',
    text: '',
    power: '',
    rarity: 50,
  }
}
</script>
