<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  priority: 'low' | 'medium' | 'high' | 'ai-pending'
}

const props = defineProps<Props>()

const priorityClass = computed(() => {
  return `priority-${props.priority}`
})

const priorityText = computed(() => {
  switch (props.priority) {
    case 'low':
      return 'Low'
    case 'medium':
      return 'Medium'
    case 'high':
      return 'High'
    case 'ai-pending':
      return 'AI Pending'
    default:
      return 'Unknown'
  }
})
</script>

<template>
  <span class="priority-badge" :class="priorityClass">
    {{ priorityText }}
  </span>
</template>
