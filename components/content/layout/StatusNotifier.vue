<template>
  <div class="status-manager">
    <button class="mt-4 text-center summon-inspiration" @click="summonInspiration">Summon Inspiration</button>
    <div class="flex flex-col space-y-4">
      <div
        v-for="(status, index) in statusHistory.slice(-3).reverse()"
        :key="index"
        class="rounded-lg shadow-md p-4 bg-white"
        :class="status.type"
        @click="toggleTimestamp(index)"
      >
        <div v-if="showTimestamp[index]"><strong>Timestamp:</strong> {{ status.timestamp }}</div>
        <div><strong>Message:</strong> {{ status.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, reactive } from 'vue';
import { useStatusStore, StatusType } from '../../../stores/statusStore';
import { useDreamStore } from '../../../stores/dreamStore';

const statusStore = useStatusStore();
const dreamStore = useDreamStore();

const statusMessage = computed(() => statusStore.message);
const statusType = computed(() => statusStore.type);
const statusHistory = computed(() => statusStore.history);

let showTimestamp = reactive(new Array(statusHistory.value.length).fill(false));

let idleTimer: NodeJS.Timeout | null = null;

onMounted(() => {
  watch(
    () => statusStore.message,
    () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        statusStore.setStatus(StatusType.INFO, dreamStore.randomDream());
      }, 10000);
    },
  );
});

onUnmounted(() => {
  if (idleTimer) clearTimeout(idleTimer);
});

const tester = () => {
  const history = statusStore.getStatusHistory();
  if (history.length) {
    const lastStatus = history[history.length - 1];
    statusStore.setStatus(lastStatus.type, lastStatus.message);
  } else {
    statusStore.setStatus(StatusType.INFO, dreamStore.randomDream());
  }
};

const summonInspiration = () => {
  statusStore.setStatus(StatusType.INFO, dreamStore.randomDream());
};

const clearStatus = () => {
  statusStore.clearStatus();
};

const toggleTimestamp = (index: number) => {
  showTimestamp[index] = !showTimestamp[index];
};
</script>

<style scoped>
.alert {
  padding: 1em;
  border-radius: 5px;
  margin-bottom: 1em;
}
.alert-info {
  background-color: lightblue;
}
.alert-success {
  background-color: lightgreen;
}
.alert-error {
  background-color: lightcoral;
}
.alert-warning {
  background-color: lightgoldenrodyellow;
}
.status-history {
  margin-top: 2em;
}
.status-history {
  margin-top: 2em;
  overflow-y: auto;
  height: calc(100vh - 10em); /* Adjust this based on your layout */
}
.chat-bubble {
  position: relative;
  background: #f7f7f7;
  border-radius: 0.4em;
}

.chat-bubble:after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 0;
  height: 0;
  border: 20px solid transparent;
  border-right-color: #f7f7f7;
  border-left: 0;
  border-right: 0;
  margin-top: -10px;
  margin-left: -20px;
}
.summon-inspiration {
  background-color: #007bff; /* Change this to fit your design */
  color: white; /* Change this to fit your design */
}
.status-manager {
  background: '/images/utility/card.webp';
}
</style>
