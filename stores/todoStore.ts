// ~/store/todoStore.ts
import { defineStore } from 'pinia';
import { type Todo } from '@prisma/client';

interface TodoState {
  todos: Todo[];
  currentTodo: Todo | null;
}

export const useTodoStore = defineStore({
  id: 'todoStore',

  state: (): TodoState => ({
    todos: [],
    currentTodo: null,
  }),

  getters: {
    currentTodoTask(): string | null {
      return this.currentTodo?.task || null;
    },
    currentTodoCategory(): string | null {
      return this.currentTodo?.category || null;
    },
    currentTodoCompleted(): boolean {
      return this.currentTodo?.completed || false;
    },
    currentTodoRewardId(): number | null {
      return this.currentTodo?.rewardId || null;
    },
    currentTodoCreatedAt(): Date | null {
      return this.currentTodo?.createdAt || null;
    },
  },
  actions: {
    async fetchTodos() {
      try {
        const response = await fetch('/api/todos');
        if (response.ok) {
          this.todos = await response.json();
        }
      } catch (error) {
        console.error('An error occurred while fetching todos:', error);
      }
    },

    async toggleCompleted(todoId: number) {
      const todo = this.todos.find((t) => t.id === todoId);
      if (!todo) return;

      const updatedTodo = { ...todo, completed: !todo.completed };

      const response = await fetch(`/api/todos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTodo),
      });

      if (response.ok) {
        const updatedTodoFromServer = await response.json();
        const index = this.todos.findIndex((t) => t.id === todoId);
        if (index !== -1) {
          this.todos[index] = updatedTodoFromServer;
        }
      }
    },

    async addTodo(newTodoData: Partial<Todo>) {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodoData),
      });

      if (response.ok) {
        const newTodo = await response.json();
        this.todos.push(newTodo);
      }
    },

    async deleteTodo(todoId: number) {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const index = this.todos.findIndex((t) => t.id === todoId);
        if (index !== -1) {
          this.todos.splice(index, 1);
        }
      }
    },
  },
});
