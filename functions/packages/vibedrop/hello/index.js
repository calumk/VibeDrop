const { createResponse, handleCORS } = require('../utils.js');

exports.main = async function(params) {
  const event = params;
  
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const message = {
      message: "Hello World from DigitalOcean Functions!",
      timestamp: new Date().toISOString(),
      method: event.httpMethod || event.method,
      path: event.path,
      package: "vibedrop",
      function: "hello",
      environment: process.env.NODE_ENV || 'production'
    };

    console.log('Hello function called:', message);
    
    return createResponse(200, {
      success: true,
      ...message
    });

  } catch (error) {
    console.error('Hello function error:', error);
    return createResponse(500, { 
      error: 'Hello function failed',
      details: error.message 
    });
  }
};