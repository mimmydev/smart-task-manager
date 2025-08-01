<script setup lang="ts">
import type { Task } from '@/types/Task'
import PriorityBadge from '@/components/ui/tasks/PriorityBadge.vue'
import { EditIcon, TrashIcon, EyeIcon } from 'lucide-vue-next'
import Button from '@/components/ui/button/Button.vue'

interface Props {
  tasks: readonly Task[]
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'edit-task', task: Task): void
  (e: 'delete-task', id: number): void
  (e: 'view-task', task: Task): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getStatusLabel = (status: 'todo' | 'in-progress' | 'completed') => {
  const labels = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    completed: 'Completed',
  }
  return labels[status] || status
}

const isOverdue = (task: Task) => {
  if (!task.dueDate) return false
  return task.dueDate < new Date() && task.status !== 'completed'
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="tasks.length === 0" class="text-center text-gray-500">
      No tasks to display
    </div>

    <div
      v-for="task in tasks"
      :key="task.id"
      class="task-card hover-lift"
      :class="`priority-${task.priority}`"
    >
      <div class="mb-3 flex items-start justify-between">
        <h3 class="heading-sm text-primary mr-4 flex-1">
          {{ task.title }}
        </h3>
        <div class="flex items-center gap-2">
          <PriorityBadge :priority="task.priority" />
          <span
            class="rounded-full px-2 py-1 text-xs font-medium"
            :class="{
              'bg-priority-low/20 text-priority-low':
                task.status === 'completed',
              'bg-priority-medium/20 text-priority-medium':
                task.status === 'in-progress',
              'bg-muted text-secondary': task.status === 'todo',
            }"
          >
            {{ getStatusLabel(task.status) }}
          </span>
        </div>
      </div>

      <p class="text-secondary body-md mb-4">
        {{ task.description || 'No description provided' }}
      </p>

      <div v-if="task.aiAnalysis" class="ai-analysis mb-4">
        <h4 class="mb-2 text-sm font-medium text-purple-700">
          🤖 AI Analysis for this task has been done
        </h4>
      </div>

      <div class="flex items-center justify-between">
        <div class="text-secondary body-sm flex items-center gap-4">
          <span>Created: {{ formatDate(task.createdAt) }}</span>
          <span v-if="task.dueDate" class="text-priority-medium">
            Due: {{ formatDate(task.dueDate) }}
            <span v-if="isOverdue(task)" class="font-medium text-red-600">
              (Overdue!)</span
            >
          </span>
        </div>

        <div class="flex gap-2">
          <Button
            @click="emit('view-task', task)"
            title="View Details"
            variant="outline"
          >
            <EyeIcon class="h-4 w-4" />
          </Button>

          <Button
            @click="emit('edit-task', task)"
            variant="outline"
            title="Edit Task"
          >
            <EditIcon class="h-4 w-4" />
          </Button>

          <Button
            @click="emit('delete-task', task.id)"
            variant="outline"
            title="Delete Task"
          >
            <TrashIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
