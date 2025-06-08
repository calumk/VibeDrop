import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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

    // Get fileId from path parameters or body
    const fileId = event.pathParameters?.id || parseBody(event).fileId;
    
    if (!fileId) {
      return createResponse(400, { 
        error: 'Missing required parameter: fileId' 
      });
    }

    // Create S3 client
    const s3Client = createS3Client();
    
    // First get metadata to find the actual file path
    const metadataKey = `metadata/${fileId}.json`;
    
    try {
      const metadataResponse = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: metadataKey
      }));

      const metadataJson = await metadataResponse.Body.transformToString();
      const metadata = JSON.parse(metadataJson);

      // Delete the actual file
      const filePath = `files/${fileId}/${metadata.originalName}`;
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: filePath
      }));

      console.log(`Deleted file: ${filePath}`);
    } catch (error) {
      if (error.name !== 'NoSuchKey') {
        console.error('Error deleting file:', error);
        // Continue to delete metadata even if file deletion fails
      }
    }

    // Delete the metadata file
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: metadataKey
      }));

      console.log(`Deleted metadata: ${metadataKey}`);
    } catch (error) {
      if (error.name !== 'NoSuchKey') {
        throw error; // Metadata deletion failure is more critical
      }
    }

    console.log(`File ${fileId} deleted successfully`);
    
    return createResponse(200, {
      success: true,
      fileId,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    
    if (error.name === 'NoSuchKey') {
      return createResponse(404, { 
        error: 'File not found' 
      });
    }
    
    return createResponse(500, { 
      error: 'Failed to delete file',
      details: error.message 
    });
  }
} 