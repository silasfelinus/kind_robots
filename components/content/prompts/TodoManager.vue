<template>
  <div class="bg-base-200 p-4">
    <h1 class="text-2xl mb-4">Quests</h1>
    <div v-for="todo in todos" :key="todo.id" class="bg-primary p-2 mb-2">
      <div>
        <span class="font-bold">{{ todo.task }}</span>
      </div>
      <div>Bounties: N/A</div>
      <button class="btn btn-accent" @click="toggleCompleted(todo.id)">
        Toggle Completed
      </button>
      <button class="btn btn-error" @click="deleteTodo(todo.id)">Delete</button>
    </div>

    <!-- Add Todo Form -->
    <div class="bg-secondary p-4">
      <h2 class="text-xl mb-2">Add new Quest</h2>
      <form @submit.prevent="addTodo">
        <input
          v-model="newTodo.task"
          placeholder="Task"
          class="input input-bordered"
        />
        <button type="submit" class="btn btn-primary" Todo>Add Quest</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTodoStore } from './../../../stores/todoStore'
import { useRewardStore } from './../../../stores/rewardStore'

const todoStore = useTodoStore()
const rewardStore = useRewardStore()

const todos = ref(todoStore.todos)
const rewards = ref(rewardStore.rewards)
const newTodo = ref({ task: '', category: '', rewardId: null })

const fetchTodos = async () => {
  await todoStore.fetchTodos()
  todos.value = todoStore.todos // Update the local ref
}

const fetchRewards = async () => {
  await rewardStore.fetchRewards()
  rewards.value = rewardStore.rewards // Update the local ref
}

const addTodo = async () => {
  await todoStore.addTodo(newTodo.value)
  newTodo.value = { task: '', category: '', rewardId: null }
  fetchTodos() // Refresh the list
}

const toggleCompleted = async (id: number) => {
  await todoStore.toggleCompleted(id)
  fetchTodos() // Refresh the list
}

const deleteTodo = async (id: number) => {
  await todoStore.deleteTodo(id)
  fetchTodos() // Refresh the list
}

// Fetch todos and rewards when component is mounted
onMounted(() => {
  fetchTodos()
  fetchRewards()
})
</script>
