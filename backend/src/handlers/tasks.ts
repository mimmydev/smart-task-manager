import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export const createTask = async (event: any, context: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, description, priority } = body;

    //** Step 1: Validate title is provided and not empty
    if (!title || title.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Task title is required',
        }),
      };
    }

    //** Step 2: Validate description is provided and not empty
    if (!description || description.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Task description is required and cannot be empty',
        }),
      };
    }

    //** Step 3: Validate priority is provided and is one of the allowed values
    const validPriorities = ['low', 'medium', 'high'];
    if (!priority || !validPriorities.includes(priority)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Priority is required and must be one of: low, medium, high',
        }),
      };
    }

    //** Step 4: Create task object with all validated fields
    const newTask = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      completed: false,
    };

    //** 🎯 Save to Supabase
    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Database Error',
          message: 'Failed to save task',
        }),
      };
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data[0]),
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to create task',
      }),
    };
  }
};

export const updateTask = async (event: any) => {
  try {
    //** 1. Extract task ID from URL path and validate it
    const taskId = event.pathParameters?.id;
    if (!taskId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Task ID is required' }),
      };
    }

    //** 2. Parse request body and extract all possible fields
    //** 2. Parse request body
    const body = JSON.parse(event.body || '{}');
    const { title, description, priority, status, dueDate } = body;

    //** 3. Validate at least one field is being updated
    if (
      title === undefined &&
      description === undefined &&
      priority === undefined &&
      status === undefined &&
      dueDate === undefined
    ) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message:
            'No update data provided. Please provide at least one field to update.',
        }),
      };
    }

    //** 4. Validate priority if provided
    const validPriorities = ['low', 'medium', 'high'];
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Priority must be one of: low, medium, high',
        }),
      };
    }

    //** 5. Validate status if provided
    const validStatuses = ['todo', 'in-progress', 'completed'];
    if (status !== undefined && !validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Status must be one of: todo, in-progress, completed',
        }),
      };
    }

    //** 6. Build update object (using database field names)
    const updateData: any = {
      modified_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined)
      updateData.description = description?.trim() || null;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) {
      updateData.due_date = dueDate ? new Date(dueDate).toISOString() : null;
    }

    //** 7. Update in Supabase
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId).select(`
        id,
        task_id,
        title,
        description,
        priority,
        status,
        due_date,
        created_at,
        modified_at,
        ai_analysis
      `);

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Failed to update task',
          error: error.message,
        }),
      };
    }

    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ message: 'Task not found' }),
      };
    }

    //** 8. Transform response to frontend format
    const task = data[0];
    const frontendTask = {
      id: task.id,
      taskId: task.task_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date ? new Date(task.due_date) : null,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.modified_at),
      aiAnalysis: task.ai_analysis,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(frontendTask),
    };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Failed to update task' }),
    };
  }
};

export const deleteTask = async (event: any) => {
  try {
    //** Step 1: Extract task ID from URL path and validate it
    const taskId = event.pathParameters?.id;
    if (!taskId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Task ID is required' }),
      };
    }

    //** Step 2: First check if task exists before deleting
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', taskId)
      .single();

    if (fetchError || !existingTask) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Task not found' }),
      };
    }

    //** Step 3: Delete the task from Supabase
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to delete task',
          error: error.message,
        }),
      };
    }

    //** Step 4: Return success response (204 No Content is standard for successful delete)
    return {
      statusCode: 204,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  } catch (error) {
    console.error('Error deleting task:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete task' }),
    };
  }
};

export const viewTask = async (event: any, context: any) => {
  try {
    //** Step 1: Extract task_id from URL path and validate it
    const taskId = event.pathParameters?.task_id;
    if (!taskId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Task ID is required',
        }),
      };
    }

    //** Step 2: Fetch single task from Supabase using task_id
    const { data, error } = await supabase
      .from('tasks')
      .select(
        `
        id,
        task_id,
        title,
        description,
        priority,
        status,
        completed,
        due_date,
        created_at,
        modified_at,
        ai_analysis
      `
      )
      .eq('task_id', taskId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      //** Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: 'Not Found',
            message: 'Task not found',
          }),
        };
      }
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Database Error',
          message: 'Failed to retrieve task',
        }),
      };
    }

    //** Step 3: Transform and return the task data
    const task = data;
    const frontendTask = {
      id: task.id,
      taskId: task.task_id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.due_date ? new Date(task.due_date) : null,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.modified_at),
      aiAnalysis: task.ai_analysis,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(frontendTask),
    };
  } catch (error) {
    console.error('Error getting task:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to get task',
      }),
    };
  }
};

export const getTasks = async (event: any, context: any) => {
  try {
    //** 🎯 Fetch tasks from Supabase
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Database Error',
          message: 'Failed to retrieve tasks',
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data || []),
    };
  } catch (error) {
    console.error('Error getting tasks:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to get tasks',
      }),
    };
  }
};
