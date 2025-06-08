import { S3Client } from '@aws-sdk/client-s3';
import jwt from 'jsonwebtoken';

// Create S3 client with server-side credentials
export function createS3Client() {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    forcePathStyle: false
  });
}

// Validate authentication token
export function validateAuth(event) {
  try {
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    if (!authHeader) {
      return { valid: false, error: 'No authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return { valid: false, error: 'No token provided' };
    }

    // For now, we'll use a simple validation
    // In production, you might want to validate against a database or external service
    const validTokens = ['admin-session', 'user-session']; // Simple validation for demo
    
    if (validTokens.includes(token)) {
      return { valid: true, userId: 'authenticated-user' };
    }

    // Try JWT validation if JWT_SECRET is provided
    if (process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { valid: true, userId: decoded.userId || 'jwt-user' };
      } catch (jwtError) {
        return { valid: false, error: 'Invalid JWT token' };
      }
    }

    return { valid: false, error: 'Invalid token' };
  } catch (error) {
    return { valid: false, error: `Auth validation error: ${error.message}` };
  }
}

// Generate unique file ID
export function generateFileId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Standard response helper
export function createResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

// Handle CORS preflight
export function handleCORS(event) {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, { message: 'CORS preflight' });
  }
  return null;
}

// Parse request body safely
export function parseBody(event) {
  try {
    if (!event.body) return {};
    return JSON.parse(event.body);
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
} 