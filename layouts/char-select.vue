<template>
  <div class="character-select">
    <h1>Choose Your Character</h1>
    <div class="characters">
      <Character v-for="character in characters" :key="character.id" :character="character" />
    </div>
  </div>
</template>

<script>
import Character from '~/components/Character.vue'

export default {
  components: {
    Character
  },
  props: {
    characters: {
      type: Array,
      required: true
    }
  }
}
</script>

<style>
.character-select {
  background-color: #f5f5f5;
  padding: 20px;
}

.characters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
