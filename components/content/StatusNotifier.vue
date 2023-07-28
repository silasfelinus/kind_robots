<template>
  <div class="status-manager">
    <div v-if="statusMessage" :class="`alert alert-${statusTypeClass}`">
      {{ statusMessage }}
    </div>
    <button @click="tester">Get Last Status</button>
    <button @click="updateWithDream">Update with a Dream</button>
    <button @click="clearStatus">Clear Status</button>
    <div v-if="statusHistory.length" class="status-history">
      <h2>Status History:</h2>
      <ul>
        <li v-for="(status, index) in statusHistory" :key="index">
          {{ status.timestamp }} - {{ status.type }}: {{ status.message }}
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useStatusStore, StatusType } from '~/stores/statusStore'
import { useDreamStore } from '~/stores/dreamStore'

const statusStore = useStatusStore()
const dreamStore = useDreamStore()

const statusMessage = computed(() => statusStore.message)
const statusType = computed(() => statusStore.type)
const statusHistory = computed(() => statusStore.history)

const statusTypeClass = computed(() => {
  switch (statusType.value) {
    case StatusType.ERROR:
      return 'error'
    case StatusType.INFO:
      return 'info'
    case StatusType.SUCCESS:
      return 'success'
    case StatusType.WARNING:
      return 'warning'
    default:
      return ''
  }
})

let idleTimer: NodeJS.Timeout | null = null

onMounted(() => {
  watch(
    () => statusStore.message,
    () => {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        statusStore.setStatus(StatusType.INFO, dreamStore.randomDream())
      }, 10000)
    }
  )
})

onUnmounted(() => {
  if (idleTimer) clearTimeout(idleTimer)
})

const tester = () => {
  const history = statusStore.getStatusHistory()
  if (history.length) {
    const lastStatus = history[history.length - 1]
    statusStore.setStatus(lastStatus.type, lastStatus.message)
  } else {
    statusStore.setStatus(StatusType.INFO, dreamStore.randomDream())
  }
}

const updateWithDream = () => {
  statusStore.setStatus(StatusType.INFO, dreamStore.randomDream())
}

const clearStatus = () => {
  statusStore.clearStatus()
}
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
</style>
