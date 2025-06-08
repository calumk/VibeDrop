const { AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { createS3Client, validateAuth, createResponse, handleCORS, parseBody } = require('../utils.js');

exports.main = async function(params) {
  const event = params;
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
    const command = new AbortMultipartUploadCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      UploadId: uploadId
    });

    await s3Client.send(command);
    console.log(`Multipart upload aborted: ${uploadId}`);
    
    return createResponse(200, { success: true });
  } catch (error) {
    console.error('Abort multipart error:', error);
    return createResponse(500, { error: 'Failed to abort upload' });
  }
};