<!-- /components/content/weird/weird-card.vue -->
<template>
  <div
    class="weird-card-container bg-base-200 border border-gray-400 rounded-2xl shadow-lg p-4 flex flex-col space-y-4 relative"
  >
    <!-- Single Eyeball at the Top -->
    <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-10">
      <NewEyeball class="w-full h-full" />
    </div>

    <!-- WeirdArt Section -->
    <WeirdArt />

    <!-- Main Content -->
    <div class="weird-main-content flex flex-grow">
      <!-- WeirdSheet Section -->
      <WeirdSheet />

      <!-- Right Side (Adventure and Choices) -->
      <div class="weird-right flex flex-col w-1/2 space-y-4">
        <!-- WeirdAdventure Section -->
        <WeirdAdventure />

        <!-- WeirdChoices Section -->
        <WeirdChoices />
      </div>
    </div>
  </div>
</template>

<style scoped>
.weird-card-container {
  width: 100%;
  max-width: 1200px;
  height: 600px;
  margin: auto;
  display: flex;
  flex-direction: column;
  position: relative;
}

.weird-art {
  height: 15%;
}

.weird-main-content {
  flex-grow: 1;
  display: flex;
}

.weird-sheet {
  flex: 1;
  margin-right: 8px;
}

.weird-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 8px;
}

.weird-adventure {
  height: 50%;
  margin-bottom: 8px;
}

.weird-choices {
  height: 50%;
}
</style>
