import { ref, computed } from 'vue';
import type { Task } from '@/types/Task';

export function useTasks(userId: string) {
  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
  const priorityTasks = computed(() => ({
    high: tasks.value.filter(t => t.priority === 'high'),
    medium: tasks.value.filter(t => t.priority === 'medium'), 
    low: tasks.value.filter(t => t.priority === 'low')
  }));

  const fetchTasks = async () => {
    loading.value = true;
    error.value = null;
    
    try {      
      const response = await fetch(`${API_BASE_URL}/tasks?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      
      tasks.value = data.tasks || [];
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      error.value = errorMessage;
      console.error('Fetch tasks error:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    tasks: readonly(tasks),
    priorityTasks,
    loading: readonly(loading),
    error: readonly(error),
    fetchTasks
  };
}