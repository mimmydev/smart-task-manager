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
        body: JSON.stringify({ message: 'Task ID is required' }),
      };
    }

    //** 2. Parse request body and extract all possible fields
    const body = JSON.parse(event.body || '{}');
    const { title, description, priority, completed } = body;

    //** 3. Basic validation: ensure at least one field is being updated
    if (
      title === undefined &&
      description === undefined &&
      priority === undefined &&
      completed === undefined
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            'No update data provided. Please provide at least one field to update (title, description, priority, or completed).',
        }),
      };
    }

    //** 4. Validate priority if it's being updated (must be one of allowed values)
    const validPriorities = ['low', 'medium', 'high'];
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Priority must be one of: low, medium, high',
        }),
      };
    }

    //** 5. Validate description if it's being updated (cannot be empty)
    if (description !== undefined && description.trim().length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Description cannot be empty',
        }),
      };
    }

    //** 6. Construct the update object for Supabase
    const updateData: {
      title?: string;
      description?: string;
      priority?: string;
      completed?: boolean;
      modified_at?: string;
    } = {
      modified_at: new Date().toISOString(),
    };

    //** Add fields to update object only if they are provided
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    if (priority !== undefined) {
      updateData.priority = priority;
    }
    if (completed !== undefined) {
      updateData.completed = completed;
    }

    //** 7. Update in Supabase using ID
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Failed to update task',
          error: error.message,
        }),
      };
    }

    //** If no data is returned, the task was not found
    if (!data || data.length === 0) {
      return {
        statusCode: 404, //** Not Found
        body: JSON.stringify({ message: 'Task not found' }),
      };
    }

    //** 8. Return updated task with a 200 status code
    return {
      statusCode: 200, //** Use 200 for a successful update
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data[0]),
    };
  } catch (error) {
    console.error('Error updating task:', error);
    return {
      statusCode: 500,
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
