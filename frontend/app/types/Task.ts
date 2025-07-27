export interface Task {
  id: any
  taskId: string
  userId: string
  title: string
  description?: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  aiAnalysis?: {
    urgency: number
    importance: number
    estimatedMinutes: number
    reasoning: string
    suggestedSchedule?: Date
  }
  status: 'todo' | 'in-progress' | 'completed'
  createdAt: Date
  updatedAt: Date
}
