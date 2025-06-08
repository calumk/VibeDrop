import { ListPartsCommand } from '@aws-sdk/client-s3';
import { createS3Client, validateAuth, createResponse, handleCORS, parseBody } from '../utils.js';

export default async function main(event, context) {
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    const auth = validateAuth(event);
    if (!auth.valid) {
      return createResponse(401, { error: auth.error });
    }

    const { uploadId, key } = parseBody(event);
    if (!uploadId || !key) {
      return createResponse(400, { error: 'Missing uploadId or key' });
    }

    const s3Client = createS3Client();
    const command = new ListPartsCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId: uploadId
    });

    const response = await s3Client.send(command);
    
    return createResponse(200, {
      success: true,
      parts: response.Parts || []
    });
  } catch (error) {
    console.error('List parts error:', error);
    return createResponse(500, { error: 'Failed to list parts' });
  }
} 