import { createResponse, handleCORS } from '../utils.js';

export default async function main(event, context) {
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
} 