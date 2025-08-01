<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useTasks } from '@/composables/useTasks'
import type { CreateTaskRequest } from '@/types/Task'
import Button from '@/components/ui/button/Button.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'task-added': []
}>()

const { createTask } = useTasks()
const loading = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  dueDate: '',
})

const errors = reactive({
  title: '',
})

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

const resetForm = () => {
  form.title = ''
  form.description = ''
  form.priority = 'medium'
  form.dueDate = ''
  errors.title = ''
  error.value = ''
}

const handleOpenChange = (value: boolean) => {
  emit('update:open', value)
  if (!value) {
    resetForm()
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''

  try {
    const taskData: CreateTaskRequest = {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
    }
    await createTask(taskData)
    emit('task-added')
    emit('update:open', false)
    resetForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create task'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogDescription>
          Create a new task with details and priority settings.
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
          <label class="label text-secondary mb-2 block"
            >Due Date (Optional)</label
          >
          <input v-model="form.dueDate" type="date" class="input-field" />
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
          <span v-else>Add Task</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
