import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';
import { createS3Client, validateAuth, createResponse, handleCORS, parseBody } from '../utils.js';

export default async function main(event, context) {
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    // Validate authentication
    const auth = validateAuth(event);
    if (!auth.valid) {
      return createResponse(401, { error: auth.error });
    }

    // Parse request body
    const { uploadId, key, parts } = parseBody(event);
    
    if (!uploadId || !key || !parts || !Array.isArray(parts)) {
      return createResponse(400, { 
        error: 'Missing required parameters: uploadId, key, parts (array)' 
      });
    }

    // Create S3 client
    const s3Client = createS3Client();
    
    // Format parts for AWS SDK
    const formattedParts = parts.map((part, index) => ({
      ETag: part.ETag,
      PartNumber: index + 1
    }));
    
    // Complete multipart upload
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: formattedParts
      }
    });

    const response = await s3Client.send(command);
    
    console.log(`Multipart upload completed for ${key}, location: ${response.Location}`);
    
    return createResponse(200, {
      success: true,
      location: response.Location,
      etag: response.ETag,
      key
    });

  } catch (error) {
    console.error('Complete multipart upload error:', error);
    return createResponse(500, { 
      error: 'Failed to complete multipart upload',
      details: error.message 
    });
  }
} 