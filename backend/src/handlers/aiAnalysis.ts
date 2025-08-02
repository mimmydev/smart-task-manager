import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export const analyzeTask = async (event: any) => {
  console.log('🚀 Function started');
  console.log('📝 Event:', JSON.stringify(event, null, 2));
  console.log(
    '🔑 Environment check - GEMINI_API_KEY exists:',
    !!process.env.GEMINI_API_KEY
  );

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  try {
    const { task_id } = event.pathParameters;
    console.log('📋 Extracted task_id:', task_id);

    if (!task_id) {
      console.log('❌ No task_id provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'task_id is required',
        }),
      };
    }

    //** 1. Get the task from database
    console.log('🔍 Fetching task from database...');
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('task_id', task_id)
      .single();

    console.log('📊 Database result:', { task: !!task, error: fetchError });

    if (fetchError) {
      console.log('❌ Database fetch error:', fetchError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Task not found',
          details: fetchError.message,
        }),
      };
    }

    if (!task) {
      console.log('❌ No task found');
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Task not found',
        }),
      };
    }

    console.log('✅ Task found:', {
      title: task.title,
      hasAiAnalysis: !!task.ai_analysis,
    });

    //** 2. Check if already analyzed
    if (task.ai_analysis) {
      console.log('⚠️ Task already has AI analysis');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Task already has AI analysis',
          aiAnalysis: task.ai_analysis,
        }),
      };
    }

    //** 3. Call Gemini API
    console.log('🤖 Calling Gemini API...');
    const aiAnalysis = await analyzeWithGemini(task);
    console.log('✅ Gemini analysis complete:', aiAnalysis);

    //** 4. Save AI analysis back to database
    console.log('💾 Saving to database...');
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        ai_analysis: aiAnalysis,
        modified_at: new Date().toISOString(),
      })
      .eq('task_id', task_id);

    if (updateError) {
      console.log('❌ Database update error:', updateError);
      throw updateError;
    }

    console.log('🎉 Analysis complete and saved!');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Task analyzed successfully',
        aiAnalysis,
      }),
    };
  } catch (error) {
    console.error('💥 AI Analysis error:', error);
    console.error('📋 Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    });

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to analyze task. Please try again later.',
        debug: error instanceof Error ? error.message : String(error), //** Add this for debugging
      }),
    };
  }
};

//** Gemini API response interface
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

//** Gemini API integration function
async function analyzeWithGemini(task: any) {
  console.log('🤖 Starting Gemini analysis for task:', task.title);

  const prompt = `Analyze this task for priority and time estimation:

Task: "${task.title}"
Description: "${task.description || 'No description'}"
Due Date: ${
    task.due_date ? new Date(task.due_date).toDateString() : 'No due date'
  }
Current Priority: ${task.priority}

Provide analysis in this JSON format:
{
  "urgency": <number 1-10>,
  "importance": <number 1-10>,
  "estimatedMinutes": <number>,
  "reasoning": "<brief explanation>"
}`;

  console.log('📝 Prompt created, calling API...');

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          response_mime_type: 'application/json',
        },
      }),
    }
  );

  console.log('📡 Gemini API response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini API error response:', errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  console.log('📄 Gemini API response data:', JSON.stringify(data, null, 2));

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    console.error('❌ No content in Gemini response');
    throw new Error('No content in Gemini response');
  }

  console.log('📝 Gemini content:', content);

  //** Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ Could not find JSON in response');
    throw new Error('Could not parse AI analysis');
  }

  console.log('🔍 Extracted JSON:', jsonMatch[0]);

  const parsed = JSON.parse(jsonMatch[0]);
  console.log('✅ Parsed analysis:', parsed);

  return parsed;
}
