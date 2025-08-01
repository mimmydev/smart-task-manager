//** composables/useTasks.ts
import { ref, computed, readonly } from 'vue'
import { useApi } from '@/composables/useApi'
import type { Task, CreateTaskRequest } from '@/types/Task'

export function useTasks() {
  //** Local state for tasks collection
  const tasks = ref<Task[]>([])
  const globalLoading = ref(false)
  const globalError = ref<string | null>(null)

  //** API composables for different endpoints
  const tasksApi = useApi<Task[]>('/tasks')
  const createTaskApi = useApi<Task>('/tasks')
  const updateTaskApi = useApi<Task>('') //** Dynamic URL
  const deleteTaskApi = useApi<void>('') //** Dynamic URL

  //** Computed properties for organized task views
  const tasksByStatus = computed(() => ({
    todo: tasks.value.filter((t) => t.status === 'todo'),
    inProgress: tasks.value.filter((t) => t.status === 'in-progress'),
    completed: tasks.value.filter((t) => t.status === 'completed'),
  }))

  const tasksByPriority = computed(() => ({
    high: tasks.value.filter((t) => t.priority === 'high'),
    medium: tasks.value.filter((t) => t.priority === 'medium'),
    low: tasks.value.filter((t) => t.priority === 'low'),
  }))

  const overdueTasks = computed(() => {
    const now = new Date()
    return tasks.value.filter(
      (task) =>
        task.dueDate && task.dueDate < now && task.status !== 'completed'
    )
  })

  //** 🎯 Data transformation layer - this is where the magic happens
  function transformTaskFromAPI(apiTask: any): Task {
    console.log('🔄 Transforming API task:', apiTask)

    const transformed: Task = {
      id: apiTask.id,
      taskId: apiTask.task_id, //** snake_case → camelCase
      title: apiTask.title,
      description: apiTask.description || undefined,
      priority: apiTask.priority,
      status: apiTask.status, //** Use new status field
      completed: apiTask.completed || false, //** Add completed field
      dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
      createdAt: new Date(apiTask.created_at), //** String → Date
      updatedAt: new Date(apiTask.modified_at), //** String → Date
      aiAnalysis: apiTask.ai_analysis || undefined, //** snake_case → camelCase
    }

    console.log('✅ Transformed task:', transformed)
    return transformed
  }

  //** Business logic methods using your useApi
  const fetchTasks = async () => {
    globalLoading.value = true
    globalError.value = null

    try {
      console.log('📡 Fetching tasks...')
      await tasksApi.get()

      if (tasksApi.error.value) {
        throw new Error(tasksApi.error.value)
      }

      if (tasksApi.data.value) {
        console.log('📥 Raw API response:', tasksApi.data.value)
        //** Transform raw API data to clean Task objects
        tasks.value = tasksApi.data.value.map(transformTaskFromAPI)
        console.log('🔄 Transformed tasks:', tasks.value)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch tasks'
      globalError.value = errorMessage
      console.error('❌ Failed to fetch tasks:', err)
    } finally {
      globalLoading.value = false
    }
  }

  const createTask = async (
    taskData: CreateTaskRequest
  ): Promise<Task | null> => {
    globalLoading.value = true
    globalError.value = null

    try {
      console.log('📤 Creating task:', taskData)
      await createTaskApi.post(taskData)

      if (createTaskApi.error.value) {
        throw new Error(createTaskApi.error.value)
      }

      if (createTaskApi.data.value) {
        console.log('📥 Raw created task:', createTaskApi.data.value)
        //** Transform the new task and add to local state
        const newTask = transformTaskFromAPI(createTaskApi.data.value)
        tasks.value.unshift(newTask)
        return newTask
      }

      return null
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create task'
      globalError.value = errorMessage
      console.error('❌ Failed to create task:', err)
      return null
    } finally {
      globalLoading.value = false
    }
  }

  const viewTask = async (taskId: string): Promise<Task | null> => {
    globalLoading.value = true
    globalError.value = null

    try {
      console.log('👁️ Viewing task:', taskId)

      //** Create API instance for the view task endpoint
      const specificViewApi = useApi<Task>(`/tasks/view/${taskId}`)
      await specificViewApi.get()

      if (specificViewApi.error.value) {
        throw new Error(specificViewApi.error.value)
      }

      if (specificViewApi.data.value) {
        console.log('📥 Raw viewed task:', specificViewApi.data.value)
        //** Transform the task data
        const viewedTask = transformTaskFromAPI(specificViewApi.data.value)
        return viewedTask
      }

      return null
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to view task'
      globalError.value = errorMessage
      console.error('❌ Failed to view task:', err)
      return null
    } finally {
      globalLoading.value = false
    }
  }

  const updateTask = async (
    taskId: number,
    updates: Partial<Task>
  ): Promise<Task | null> => {
    globalLoading.value = true
    globalError.value = null

    try {
      //** Prepare update data for API (convert back to API format)
      const updateData: any = {}

      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined)
        updateData.description = updates.description
      if (updates.priority !== undefined) updateData.priority = updates.priority
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.dueDate !== undefined) {
        updateData.dueDate = updates.dueDate
          ? updates.dueDate.toISOString()
          : null
      }

      console.log('📤 Updating task:', taskId, updateData)

      //** Create a new useApi instance for this specific task update
      const specificUpdateApi = useApi<Task>(`/tasks/${taskId}`)
      await specificUpdateApi.put(updateData)

      if (specificUpdateApi.error.value) {
        throw new Error(specificUpdateApi.error.value)
      }

      if (specificUpdateApi.data.value) {
        console.log('📥 Raw updated task:', specificUpdateApi.data.value)
        //** Transform and update local state
        const updatedTask = transformTaskFromAPI(specificUpdateApi.data.value)

        const index = tasks.value.findIndex((t) => t.id === taskId)
        if (index !== -1) {
          tasks.value[index] = updatedTask
        }

        return updatedTask
      }

      return null
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update task'
      globalError.value = errorMessage
      console.error('❌ Failed to update task:', err)
      return null
    } finally {
      globalLoading.value = false
    }
  }

  const deleteTask = async (taskId: number): Promise<boolean> => {
    globalLoading.value = true
    globalError.value = null

    try {
      console.log('🗑️ Deleting task:', taskId)

      //** Create a new useApi instance for this specific task deletion
      const specificDeleteApi = useApi<void>(`/tasks/${taskId}`)
      await specificDeleteApi.del()

      //** For delete, even 404 is considered success (already deleted)
      if (
        specificDeleteApi.error.value &&
        !specificDeleteApi.error.value.includes('404')
      ) {
        throw new Error(specificDeleteApi.error.value)
      }

      //** Remove from local state
      tasks.value = tasks.value.filter((t) => t.id !== taskId)

      return true
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete task'
      globalError.value = errorMessage
      console.error('❌ Failed to delete task:', err)
      return false
    } finally {
      globalLoading.value = false
    }
  }

  //** Convenience methods for common operations
  const markAsCompleted = async (taskId: number) => {
    return updateTask(taskId, { status: 'completed' })
  }

  const markAsInProgress = async (taskId: number) => {
    return updateTask(taskId, { status: 'in-progress' })
  }

  const markAsTodo = async (taskId: number) => {
    return updateTask(taskId, { status: 'todo' })
  }

  //** Computed loading state - true if any API call is loading
  const loading = computed(
    () =>
      globalLoading.value ||
      tasksApi.loading.value ||
      createTaskApi.loading.value ||
      updateTaskApi.loading.value ||
      deleteTaskApi.loading.value
  )

  //** Computed error state - show the most recent error
  const error = computed(
    () =>
      globalError.value ||
      tasksApi.error.value ||
      createTaskApi.error.value ||
      updateTaskApi.error.value ||
      deleteTaskApi.error.value
  )

  return {
    //** State
    tasks: readonly(tasks),
    loading,
    error,

    //** Computed
    tasksByStatus,
    tasksByPriority,
    overdueTasks,

    //** Actions
    fetchTasks,
    createTask,
    viewTask,
    updateTask,
    deleteTask,

    //** Convenience methods
    markAsCompleted,
    markAsInProgress,
    markAsTodo,
  }
}
