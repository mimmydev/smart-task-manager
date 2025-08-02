import { ref } from 'vue'
import type { Task } from '@/types/Task'

interface AIAnalysisResponse {
  message: string
  aiAnalysis: {
    urgency: number
    importance: number
    estimatedMinutes: number
    reasoning: string
  }
}

export function useAIAnalysis() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

  const analyzeTask = async (
    taskId: string
  ): Promise<AIAnalysisResponse | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/analyze/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to analyze task'
      error.value = errorMessage
      console.error('AI Analysis error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    analyzeTask,
  }
}
