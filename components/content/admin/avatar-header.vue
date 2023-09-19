<template>
  <div
    class="flex flex-col md:flex-row items-center w-full md:max-w-7xl mx-auto py-4 space-y-4 md:space-y-0 md:space-x-4"
    style="max-height: 15vh"
  >
    <!-- Avatar and Welcome Message Section -->
    <div class="flex items-center space-x-4">
      <user-avatar class="w-16 h-16 rounded-full" />
      <welcome-message class="text-lg font-semibold" />
    </div>

    <!-- Login Form Section -->
    <login-form class="md:w-1/3" />

    <!-- User Interaction Icons and Role Display Section -->
    <div class="flex items-center space-x-4">
      <karma-tracker class="text-lg" />
      <mana-counter class="text-lg" />
      <role-display class="text-lg font-semibold" />
    </div>
  </div>
</template>
