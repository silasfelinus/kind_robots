<template>
  <div class="character-card">
    <img :src="character.avatarImage" alt="Character Avatar" />
    <h2>{{ character.name }}</h2>
    <p>{{ character.subtitle }}</p>
    <p>{{ character.description }}</p>
    <p><strong>Personality:</strong> {{ character.personality }}</p>
    <p><strong>Theme:</strong> {{ character.theme }}</p>
  </div>
</template>

<script>
export default {
  props: {
    character: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.character-card {
  border: 2px solid #ccc;
  border-radius: 10px;
  padding: 20px;
  margin: 10px;
  text-align: center;
}
</style>
