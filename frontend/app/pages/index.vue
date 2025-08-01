<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTasks } from '@/composables/useTasks'
import type { Task } from '@/types/Task'
import AddTask from '@/components/ui/tasks/AddTask.vue'
import ModifyTaskModal from '@/components/ui/tasks/ModifyTaskModal.vue'
import DetailTask from '@/components/ui/tasks/DetailTask.vue'
import ListTasks from '@/components/ui/tasks/ListTasks.vue'
import { PlusIcon, FilterIcon, SearchIcon } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'

const {
  tasks,
  loading,
  error,
  fetchTasks,
  deleteTask: deleteTaskApi,
} = useTasks()

//** Modal states
const showAddTask = ref(false)
const editingTask = ref<Task | null>(null)
const viewingTask = ref<Task | null>(null)

//** Filter and search states
const searchQuery = ref('')
const statusFilter = ref<'all' | 'todo' | 'in-progress' | 'completed'>('all')
const priorityFilter = ref<'all' | 'low' | 'medium' | 'high'>('all')

onMounted(() => {
  console.log('Index.vue mounted, fetching tasks...')
  fetchTasks()
})

//** Computed properties for filtering and searching
const filteredTasks = computed(() => {
  console.log('Computing filtered tasks...')
  console.log('Raw tasks:', tasks.value)
  console.log('Tasks length:', tasks.value.length)

  let result = tasks.value

  //** Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
    )
    console.log('After search filter:', result.length)
  }

  //** Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter((task) => task.status === statusFilter.value)
    console.log('After status filter:', result.length)
  }

  //** Apply priority filter
  if (priorityFilter.value !== 'all') {
    result = result.filter((task) => task.priority === priorityFilter.value)
    console.log('After priority filter:', result.length)
  }

  console.log('Final filtered tasks:', result)
  console.log('Final filtered tasks length:', result.length)
  return result
})

const taskStats = computed(() => {
  const total = tasks.value.length
  const completed = tasks.value.filter((t) => t.status === 'completed').length
  const inProgress = tasks.value.filter(
    (t) => t.status === 'in-progress'
  ).length
  const todo = tasks.value.filter((t) => t.status === 'todo').length
  const high = tasks.value.filter((t) => t.priority === 'high').length
  const medium = tasks.value.filter((t) => t.priority === 'medium').length
  const low = tasks.value.filter((t) => t.priority === 'low').length

  return { total, completed, inProgress, todo, high, medium, low }
})

//** Event handlers
const handleTaskAdded = () => {
  showAddTask.value = false
  fetchTasks()
}

const handleTaskUpdated = () => {
  editingTask.value = null
  fetchTasks()
}

const editTask = (task: Task) => {
  editingTask.value = task
}

const viewTask = (task: Task) => {
  viewingTask.value = task
}

const deleteTask = async (id: number) => {
  if (confirm('Are you sure you want to delete this task?')) {
    await deleteTaskApi(id)
    fetchTasks()
  }
}

const handleDetailEdit = (task: Task) => {
  viewingTask.value = null
  editingTask.value = task
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
}

const formatDate = (dateString: string | Date) => {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="bg-page min-h-screen">
    <div class="container-design py-8">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 class="heading-xl text-primary mb-4">Smart Task Manager</h1>
        <p class="text-secondary body-lg mb-6">
          Manage your tasks efficiently with AI-powered insights
        </p>

        <!-- Stats Cards -->
        <div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div
            class="bg-surface shadow-subtle border-border rounded-lg border p-4"
          >
            <div class="text-primary mb-1 text-2xl font-bold">
              {{ taskStats.total }}
            </div>
            <div class="text-secondary body-sm">Total Tasks</div>
          </div>
          <div
            class="bg-surface shadow-subtle border-border rounded-lg border p-4"
          >
            <div class="text-priority-low mb-1 text-2xl font-bold">
              {{ taskStats.completed }}
            </div>
            <div class="text-secondary body-sm">Completed</div>
          </div>
          <div
            class="bg-surface shadow-subtle border-border rounded-lg border p-4"
          >
            <div class="text-priority-medium mb-1 text-2xl font-bold">
              {{ taskStats.inProgress }}
            </div>
            <div class="text-secondary body-sm">In Progress</div>
          </div>
          <div
            class="bg-surface shadow-subtle border-border rounded-lg border p-4"
          >
            <div class="text-priority-high mb-1 text-2xl font-bold">
              {{ taskStats.high }}
            </div>
            <div class="text-secondary body-sm">High Priority</div>
          </div>
        </div>
      </div>

      <!-- Controls Section -->
      <div
        class="bg-surface shadow-subtle border-border mb-6 rounded-lg border p-6"
      >
        <div
          class="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center"
        >
          <!-- Search and Filters -->
          <div class="flex flex-1 flex-col gap-4 sm:flex-row">
            <!-- Search -->
            <div class="relative max-w-md flex-1">
              <SearchIcon
                class="text-secondary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search tasks..."
                class="input-field pl-10"
              />
            </div>

            <!-- Filters -->
            <div class="flex items-center gap-3">
              <select v-model="statusFilter" class="input-field min-w-32">
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select v-model="priorityFilter" class="input-field min-w-32">
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <Button @click="clearFilters" variant="outline">
                <FilterIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- Add Task Button -->
          <Button @click="showAddTask = true" class="btn-primary">
            <PlusIcon class="h-4 w-4" />
            Add New Task
          </Button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div
          class="border-primary h-8 w-8 animate-spin rounded-full border-b-2"
        ></div>
      </div>

      <!-- Error State -->
      <div
        v-else-if="error"
        class="bg-error/10 border-error/20 mb-6 rounded-lg border p-4"
      >
        <p class="text-error body-md">{{ error }}</p>
      </div>

      <!-- Tasks List Component -->
      <ListTasks
        v-if="!loading && !error"
        :tasks="filteredTasks"
        :loading="loading"
        :error="error"
        @edit-task="editTask"
        @delete-task="deleteTask"
        @view-task="viewTask"
      />

      <!-- Empty State -->
      <div
        v-if="!loading && !error && filteredTasks.length === 0"
        class="py-12 text-center"
      >
        <div class="text-secondary body-lg mb-4">
          {{
            searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No tasks found with current filters'
              : 'No tasks yet'
          }}
        </div>
        <Button
          v-if="
            !searchQuery && statusFilter === 'all' && priorityFilter === 'all'
          "
          @click="showAddTask = true"
          class="btn-primary"
        >
          Create your first task
        </Button>
        <Button v-else @click="clearFilters" class="btn-primary">
          Clear Filters
        </Button>
      </div>

      <!-- Modals -->
      <AddTask
        :open="showAddTask"
        @update:open="showAddTask = $event"
        @task-added="handleTaskAdded"
      />

      <ModifyTaskModal
        v-if="editingTask"
        :task="editingTask"
        :open="!!editingTask"
        @update:open="(open) => !open && (editingTask = null)"
        @task-updated="handleTaskUpdated"
      />

      <DetailTask
        v-if="viewingTask"
        :task="viewingTask"
        :open="!!viewingTask"
        @update:open="(open) => !open && (viewingTask = null)"
        @edit="handleDetailEdit"
      />
    </div>
  </div>
</template>
