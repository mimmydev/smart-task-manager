<script setup lang="ts">
import { onMounted } from 'vue';
import { useTasks } from '@/composables/useTasks';

const { tasks, loading, error, fetchTasks } = useTasks('test-user-123');

onMounted(() => {
  console.log('Component mounted, fetching tasks...');
  fetchTasks();
});
</script>

<template>
  <div>
    <h1>My Tasks</h1>

    <div
      class="debug"
      style="background: #f0f0f0; padding: 10px; margin: 10px 0"
    >
      <p><strong>Loading:</strong> {{ loading }}</p>
      <p><strong>Error:</strong> {{ error }}</p>
      <p><strong>Tasks count:</strong> {{ tasks.length }}</p>
    </div>

    <button @click="fetchTasks" :disabled="loading">
      {{ loading ? 'Loading...' : 'Load Tasks from Backend' }}
    </button>

    <div v-for="task in tasks" :key="task?.taskId" class="task">
      <h3>{{ task.title }}</h3>
      <p>{{ task.description || 'No description' }}</p>
      <span :class="task.priority">{{ task.priority }} priority</span>
      <small>Created: {{ task.createdAt }}</small>
    </div>
  </div>
</template>
