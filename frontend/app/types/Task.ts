export interface Task {
  taskId: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'ai-pending';
  aiAnalysis?: {
    urgency: number;
    importance: number;
    estimatedMinutes: number;
    reasoning: string;
    suggestedSchedule?: Date;
  };
  status: 'todo' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}