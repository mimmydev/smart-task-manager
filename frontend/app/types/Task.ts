export interface Task {
  id: number
  taskId: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in-progress' | 'completed'
  completed?: boolean
  dueDate?: Date
  aiAnalysis?: {
    urgency: number
    importance: number
    estimatedMinutes: number
    reasoning: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
}
