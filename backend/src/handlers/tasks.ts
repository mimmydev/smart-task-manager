
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export const createTask = async (event: any, context: any) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { userId, title } = body;
    
    if (!title || title.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Validation Error',
          message: 'Task title is required'
        })
      };
    }

    const newTask = {
      id: Date.now(),
      title: title.trim(),
      completed: false
    };

    // 🎯 Save to Supabase
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
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Database Error',
          message: 'Failed to save task'
        })
      };
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data[0])
    };
    
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to create task'
      })
    };
  }
};

export const getTasks = async (event: any, context: any) => {
  try {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Tasks retrieved successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error getting tasks:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to get tasks'
      })
    };
  }
};
