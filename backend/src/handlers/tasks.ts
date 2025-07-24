export const getTasks = async (event: any, context: any) => {
  console.log('Function started');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));
  
  try {
    console.log('Processing request...');
    
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        message: 'Hello from AWS Lambda!',
        timestamp: new Date().toISOString(),
        region: process.env.AWS_REGION,
        tasks: [
          { 
            id: '1', 
            title: 'Master backend fundamentals', 
            priority: 'high',
            createdAt: new Date().toISOString()
          }
        ]
      })
    };
    
    console.log('Returning response:', JSON.stringify(response, null, 2));
    return response;
    
  } catch (error) {
    console.error('Error in getTasks:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    };
  }
};