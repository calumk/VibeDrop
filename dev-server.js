import express from 'express';
import cors from 'cors';

// Import function handlers
import createMultipart from './functions/packages/api/create-multipart/index.js';
import signPart from './functions/packages/api/sign-part/index.js';
import completeMultipart from './functions/packages/api/complete-multipart/index.js';
import abortMultipart from './functions/packages/api/abort-multipart/index.js';
import listParts from './functions/packages/api/list-parts/index.js';
import getUploadUrl from './functions/packages/api/get-upload-url/index.js';
import createMetadata from './functions/packages/api/create-metadata/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Wrapper to convert Express req/res to DigitalOcean function format
function wrapHandler(handler) {
  return async (req, res) => {
    try {
      // Convert Express request to DO function event format
      const event = {
        httpMethod: req.method,
        headers: req.headers,
        body: JSON.stringify(req.body),
        queryStringParameters: req.query,
        pathParameters: req.params
      };

      // Call the function handler
      const result = await handler(event, {});
      
      // Send response
      res.status(result.statusCode || 200);
      
      // Set headers if provided
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.set(key, result.headers[key]);
        });
      }
      
      // Send body (parse if it's JSON string)
      let body = result.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          // Keep as string if not JSON
        }
      }
      
      res.json(body);
    } catch (error) {
      console.error('Handler error:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  };
}

// Mount API endpoints
app.post('/api/create-multipart', wrapHandler(createMultipart));
app.post('/api/sign-part', wrapHandler(signPart));
app.post('/api/complete-multipart', wrapHandler(completeMultipart));
app.post('/api/abort-multipart', wrapHandler(abortMultipart));
app.post('/api/list-parts', wrapHandler(listParts));
app.post('/api/get-upload-url', wrapHandler(getUploadUrl));
app.post('/api/create-metadata', wrapHandler(createMetadata));

// Handle CORS preflight for all API routes
app.options('/api/*', (req, res) => {
  res.status(200).end();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Local development server running at http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /api/create-multipart');
  console.log('  POST /api/sign-part');
  console.log('  POST /api/complete-multipart');
  console.log('  POST /api/abort-multipart');
  console.log('  POST /api/list-parts');
  console.log('  POST /api/get-upload-url');
  console.log('  POST /api/create-metadata');
  console.log('  GET  /api/health');
}); 