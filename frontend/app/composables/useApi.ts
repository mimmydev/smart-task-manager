import { ref } from 'vue'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export function useApi<T>(url: string) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

  const request = async (method: HttpMethod, body?: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      if (response.status !== 204) {
        data.value = await response.json()
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `Failed to ${method} ${url}`
      error.value = errorMessage
      console.error(`${method} ${url} error:`, err)
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    get: () => request('GET'),
    post: (body: any) => request('POST', body),
    put: (body: any) => request('PUT', body),
    del: () => request('DELETE'),
  }
}
