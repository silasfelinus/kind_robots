<template>
  <div class="flex">
    <!-- Sidebar -->
    <aside
      :class="{
        'w-64': sidebarState === 'open',
        'w-20': sidebarState === 'compact',
        'w-0': sidebarState === 'closed',
      }"
      class="h-screen bg-base-200 transition-all duration-300 overflow-hidden"
    >
      <div v-if="sidebarState !== 'closed'" class="p-4">
        <h2 class="text-lg font-semibold mb-4">Sidebar</h2>
        <ul>
          <li class="mb-2">Item 1</li>
          <li class="mb-2">Item 2</li>
          <li class="mb-2">Item 3</li>
        </ul>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-grow p-4">
      <button
        @click="toggleSidebar"
        class="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Toggle Sidebar
      </button>

      <div>
        <p>Main content goes here...</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // Initialize the sidebar state
      sidebarState: 'open', // 'open', 'compact', 'closed'
    };
  },
  methods: {
    // Method to toggle between open, compact, and closed states
    toggleSidebar() {
      if (this.sidebarState === 'open') {
        this.sidebarState = 'compact';
      } else if (this.sidebarState === 'compact') {
        this.sidebarState = 'closed';
      } else {
        this.sidebarState = 'open';
      }
    },
  },
};
</script>

<style scoped>
/* Simple styling for the sidebar and main layout */
aside {
  background-color: #f0f0f0; /* Adjust the sidebar background as needed */
}

button {
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #3b82f6;
}
</style>
