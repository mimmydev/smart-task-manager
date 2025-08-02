<script setup lang="ts">
import { computed, ref } from 'vue'
import { EditIcon, SparklesIcon } from 'lucide-vue-next'
import type { Task } from '@/types/Task'
import PriorityBadge from '@/components/ui/tasks/PriorityBadge.vue'
import Button from '@/components/ui/button/Button.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAIAnalysis } from '@/composables/useAIAnalysis'

interface Props {
  task: Task
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: [task: Task]
  'analysis-complete': [task: Task]
}>()

const {
  loading: aiAnalysisLoading,
  error: aiAnalysisError,
  analyzeTask,
} = useAIAnalysis()
const aiSummaryLoading = ref(false)
const aiSummary = ref('')

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
}

const handleAISummarize = async () => {
  if (props.task.aiAnalysis) {
    //** If AI analysis already exists, just show a summary message
    aiSummary.value = `Based on the AI analysis, this task has an urgency level of ${props.task.aiAnalysis.urgency}/10 and importance level of ${props.task.aiAnalysis.importance}/10. It's estimated to take ${props.task.aiAnalysis.estimatedMinutes} minutes to complete. ${props.task.aiAnalysis.reasoning}`
    return
  }

  try {
    const result = await analyzeTask(props.task.taskId)
    if (result) {
      //** Create updated task with AI analysis
      const updatedTask: Task = {
        ...props.task,
        aiAnalysis: result.aiAnalysis,
      }

      //** Set summary message
      aiSummary.value = `AI analysis complete! This task has an urgency level of ${result.aiAnalysis.urgency}/10 and importance level of ${result.aiAnalysis.importance}/10. It's estimated to take ${result.aiAnalysis.estimatedMinutes} minutes to complete. ${result.aiAnalysis.reasoning}`

      //** Emit the updated task to parent
      emit('analysis-complete', updatedTask)
    }
  } catch (error) {
    console.error('Failed to analyze task:', error)
    aiSummary.value = 'Failed to analyze task. Please try again.'
  }
}

const statusClass = computed(() => {
  switch (props.task.status) {
    case 'completed':
      return 'bg-priority-low/20 text-priority-low'
    case 'in-progress':
      return 'bg-priority-medium/20 text-priority-medium'
    case 'todo':
    default:
      return 'bg-muted text-secondary'
  }
})

const statusText = computed(() => {
  switch (props.task.status) {
    case 'completed':
      return 'Completed'
    case 'in-progress':
      return 'In Progress'
    case 'todo':
    default:
      return 'To Do'
  }
})

const isOverdue = computed(() => {
  if (!props.task.dueDate) return false
  return (
    new Date(props.task.dueDate) < new Date() &&
    props.task.status !== 'completed'
  )
})

const urgencyColor = computed(() => {
  if (!props.task.aiAnalysis) return 'bg-border'
  const urgency = props.task.aiAnalysis.urgency
  if (urgency >= 8) return 'bg-priority-high'
  if (urgency >= 5) return 'bg-priority-medium'
  return 'bg-priority-low'
})

const importanceColor = computed(() => {
  if (!props.task.aiAnalysis) return 'bg-border'
  const importance = props.task.aiAnalysis.importance
  if (importance >= 8) return 'bg-priority-high'
  if (importance >= 5) return 'bg-priority-medium'
  return 'bg-priority-low'
})

const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Task Details</DialogTitle>
        <DialogDescription>
          View comprehensive task information and AI insights.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <h3 class="heading-md text-primary mb-2">{{ task.title }}</h3>
          </div>
          <PriorityBadge :priority="task.priority" />
        </div>

        <div>
          <span class="label text-secondary">Task ID</span>
          <p class="text-primary body-md mt-1 font-mono">{{ task.taskId }}</p>
        </div>

        <div>
          <span class="label text-secondary">Status</span>
          <div class="mt-1">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
              :class="statusClass"
            >
              {{ statusText }}
            </span>
          </div>
        </div>

        <div v-if="task.completed !== undefined">
          <span class="label text-secondary">Completed</span>
          <div class="mt-1">
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
              :class="
                task.completed
                  ? 'bg-priority-low/20 text-priority-low'
                  : 'bg-muted text-secondary'
              "
            >
              {{ task.completed ? 'Yes' : 'No' }}
            </span>
          </div>
        </div>

        <div v-if="task.description">
          <span class="label text-secondary">Description</span>
          <p class="text-primary body-md mt-1">{{ task.description }}</p>
        </div>

        <div v-if="task.dueDate">
          <span class="label text-secondary">Due Date</span>
          <p class="text-primary body-md mt-1">
            {{ formatDate(task.dueDate) }}
            <span v-if="isOverdue" class="text-priority-high ml-2 font-medium">
              (Overdue)
            </span>
          </p>
        </div>

        <!-- AI Analysis -->
        <div v-if="task.aiAnalysis" class="bg-muted rounded-lg p-4">
          <h4 class="heading-sm text-primary mb-3">AI Analysis</h4>
          <div class="mb-3 grid grid-cols-2 gap-4">
            <div>
              <span class="label text-secondary">Urgency</span>
              <div class="mt-1 flex items-center">
                <div class="bg-border h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    class="h-full transition-all duration-300"
                    :class="urgencyColor"
                    :style="{ width: `${task.aiAnalysis.urgency * 10}%` }"
                  ></div>
                </div>
                <span class="text-primary body-sm ml-2"
                  >{{ task.aiAnalysis.urgency }}/10</span
                >
              </div>
            </div>
            <div>
              <span class="label text-secondary">Importance</span>
              <div class="mt-1 flex items-center">
                <div class="bg-border h-2 flex-1 overflow-hidden rounded-full">
                  <div
                    class="h-full transition-all duration-300"
                    :class="importanceColor"
                    :style="{ width: `${task.aiAnalysis.importance * 10}%` }"
                  ></div>
                </div>
                <span class="text-primary body-sm ml-2"
                  >{{ task.aiAnalysis.importance }}/10</span
                >
              </div>
            </div>
          </div>
          <div class="mb-3">
            <span class="label text-secondary">Estimated Time</span>
            <p class="text-primary body-md mt-1">
              {{ task.aiAnalysis.estimatedMinutes }} minutes
            </p>
          </div>
          <div>
            <span class="label text-secondary font-bold">AI Reasoning</span>
            <p class="text-secondary body-sm mt-1">
              {{ task.aiAnalysis.reasoning }}
            </p>
            <p class="text-priority-medium pt-2.5 text-xs">
              This AI not accurate most of the time so don't take it seriously
            </p>
          </div>
        </div>

        <div v-else class="bg-muted rounded-lg p-4">
          <div class="mb-3 flex items-center justify-between">
            <h4 class="heading-sm text-primary flex items-center gap-2">
              <SparklesIcon class="h-4 w-4" />
              AI Task Summary
            </h4>
            <Button
              @click="handleAISummarize"
              :disabled="aiAnalysisLoading"
              class="btn-primary text-sm"
            >
              <span
                v-if="aiAnalysisLoading"
                class="mr-2 h-3 w-3 animate-spin rounded-full border-b-2 border-white"
              ></span>
              <SparklesIcon v-else class="mr-1 h-3 w-3" />
              {{
                aiAnalysisLoading
                  ? 'Analyzing...'
                  : task.aiAnalysis
                    ? 'Get Summary'
                    : 'Analyze Task'
              }}
            </Button>
          </div>

          <div v-if="aiSummary" class="mt-3">
            <span class="label text-secondary">AI Insights</span>
            <p class="text-primary body-sm mt-1 leading-relaxed">
              {{ aiSummary }}
            </p>
          </div>

          <div v-else-if="!aiSummaryLoading" class="py-4 text-center">
            <p class="text-secondary body-sm">
              Click "Get AI Summary" to analyze this task and receive AI-powered
              insights and recommendations. Though this only able to do ONCE.
            </p>
          </div>
        </div>

        <div
          class="text-secondary body-sm border-border flex justify-between border-t pt-4"
        >
          <div>
            <span class="label">Created</span>
            <p class="mt-1">{{ formatDate(task.createdAt) }}</p>
          </div>
          <div>
            <!-- TODO: fix this date -->
            <span class="label">Updated</span>
            <p class="mt-1">{{ formatDate(task.updatedAt) }}</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          v-show="!task.aiAnalysis"
          @click="emit('edit', task)"
          class="btn-primary"
        >
          <EditIcon class="h-4 w-4" />
          Edit Task
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
