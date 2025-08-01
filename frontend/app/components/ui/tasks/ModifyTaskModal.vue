<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useTasks } from '@/composables/useTasks'
import type { Task } from '@/types/Task'
import Button from '@/components/ui/button/Button.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate,
  today,
} from '@internationalized/date'
import type { DateValue } from '@internationalized/date'

interface Props {
  task: Task
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'task-updated': []
}>()

const { updateTask } = useTasks()
const loading = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  status: 'todo' as 'todo' | 'in-progress' | 'completed',
  dueDate: undefined as any,
})

const errors = reactive({
  title: '',
})

//** Helper functions to convert between Date and DateValue
const dateToDateValue = (date: Date): DateValue => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 //** CalendarDate months are 1-based
  const day = date.getDate()
  return new CalendarDate(year, month, day)
}

const dateValueToDate = (dateValue: DateValue): Date => {
  //** Cast to any to handle the type mismatch with Calendar component
  const dateObj = dateValue as any
  if (dateObj && dateObj.year && dateObj.month && dateObj.day) {
    return new Date(dateObj.year, dateObj.month - 1, dateObj.day)
  }
  //** Fallback - this shouldn't happen with CalendarDate
  return new Date()
}

const resetForm = () => {
  //** Initialize form with task data
  form.title = props.task.title
  form.description = props.task.description ?? ''
  form.priority = props.task.priority
  form.status = props.task.status
  form.dueDate = props.task.dueDate
    ? dateToDateValue(new Date(props.task.dueDate))
    : undefined
  errors.title = ''
  error.value = ''
}

//** Watch for task changes and reset form
watch(
  () => props.task,
  () => {
    if (props.task) {
      resetForm()
    }
  },
  { immediate: true }
)

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
  if (!value) {
    resetForm()
  }
}

const validateForm = () => {
  errors.title = ''

  if (!form.title.trim()) {
    errors.title = 'Title is required'
    return false
  }

  if (form.title.length < 3) {
    errors.title = 'Title must be at least 3 characters'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''

  try {
    const updates: Partial<Task> = {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate ? dateValueToDate(form.dueDate) : undefined,
    }
    await updateTask(props.task.id, updates)
    emit('task-updated')
    emit('update:open', false)
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update task'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogDescription>
          Update task details, priority, and status.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="label text-secondary mb-2 block">Title</label>
          <input
            v-model="form.title"
            type="text"
            class="input-field"
            :class="{ error: errors.title }"
            placeholder="Enter task title"
            required
          />
          <p v-if="errors.title" class="text-error body-sm mt-1">
            {{ errors.title }}
          </p>
        </div>

        <div>
          <label class="label text-secondary mb-2 block">Description</label>
          <textarea
            v-model="form.description"
            class="input-field resize-none"
            rows="3"
            placeholder="Enter task description (optional)"
          ></textarea>
        </div>

        <div>
          <label class="label text-secondary mb-2 block">Priority</label>
          <select v-model="form.priority" class="input-field" required>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div>
          <label class="label text-secondary mb-2 block">Status</label>
          <select v-model="form.status" class="input-field" required>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label class="label text-secondary mb-2 block"
            >Due Date (Optional)</label
          >
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="
                  cn(
                    'w-full justify-start text-left font-normal',
                    !form.dueDate && 'text-muted-foreground'
                  )
                "
              >
                <template v-if="form.dueDate">
                  {{ dateValueToDate(form.dueDate).toLocaleDateString() }}
                </template>
                <template v-else> Pick a date </template>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <Calendar
                v-model="form.dueDate"
                :min-value="today(getLocalTimeZone())"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div
          v-if="error"
          class="bg-error/10 border-error/20 mt-4 rounded-lg border p-3"
        >
          <p class="text-error body-sm">{{ error }}</p>
        </div>
      </form>

      <DialogFooter>
        <Button
          type="button"
          @click="handleOpenChange(false)"
          variant="secondary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          @click="handleSubmit"
          :disabled="loading"
          variant="default"
        >
          <span
            v-if="loading"
            class="h-4 w-4 animate-spin rounded-full border-b-2 border-white"
          ></span>
          <span v-else>Update Task</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
