import { GetObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client, createResponse, handleCORS, parseBody } from '../utils.js';

export default async function main(event, context) {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    // Get fileId from path parameters, query parameters, or request body
    let fileId = event.pathParameters?.id || event.queryStringParameters?.fileId;
    
    if (!fileId && event.body) {
      const body = parseBody(event);
      fileId = body.fileId;
    }
    
    if (!fileId) {
      return createResponse(400, { 
        error: 'Missing required parameter: fileId' 
      });
    }

    // Create S3 client
    const s3Client = createS3Client();
    
    // Get metadata from S3
    const metadataKey = `metadata/${fileId}.json`;
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: metadataKey
    });

    const response = await s3Client.send(command);
    const metadataJson = await response.Body.transformToString();
    const metadata = JSON.parse(metadataJson);

    // Check if file has expired
    if (metadata.expiryDate && new Date() > new Date(metadata.expiryDate)) {
      return createResponse(410, { 
        error: 'File has expired',
        expired: true 
      });
    }

    console.log(`Metadata retrieved for file ${fileId}`);
    
    return createResponse(200, {
      success: true,
      metadata: {
        ...metadata,
        fileId: metadata.id, // Add fileId for backwards compatibility
        uploadDate: metadata.uploadedAt, // Map uploadedAt to uploadDate
        downloadCount: metadata.downloads || 0, // Map downloads to downloadCount
        passcode: undefined // Never return passcode in API response
      }
    });

  } catch (error) {
    console.error('Get metadata error:', error);
    
    if (error.name === 'NoSuchKey') {
      return createResponse(404, { 
        error: 'File not found' 
      });
    }
    
    return createResponse(500, { 
      error: 'Failed to retrieve metadata',
      details: error.message 
    });
  }
} 