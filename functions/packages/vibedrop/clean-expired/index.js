const { ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { createS3Client, validateAuth, createResponse, handleCORS } = require('../utils.js');

exports.main = async function(params) {
  const event = params;
  // Handle CORS
  const corsResponse = handleCORS(event);
  if (corsResponse) return corsResponse;

  try {
    // Validate authentication
    const auth = validateAuth(event);
    if (!auth.valid) {
      return createResponse(401, { error: auth.error });
    }

    // Create S3 client
    const s3Client = createS3Client();
    
    // List all metadata files
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET,
      Prefix: 'metadata/'
    });

    const listResponse = await s3Client.send(listCommand);
    const expiredFiles = [];
    const now = new Date();

    // Process each metadata file to find expired ones
    for (const object of listResponse.Contents || []) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: object.Key
        });

        const response = await s3Client.send(getCommand);
        const metadataJson = await response.Body.transformToString();
        const metadata = JSON.parse(metadataJson);
        
        // Only check expiry for files that have an expiry date
        if (metadata.expiryDate && now > new Date(metadata.expiryDate)) {
          expiredFiles.push({
            fileId: metadata.fileId,
            originalName: metadata.originalName,
            metadataKey: object.Key,
            expiryDate: metadata.expiryDate
          });
        }
      } catch (error) {
        console.error('Error processing file:', object.Key, error);
        // Continue processing other files
      }
    }

    // Delete expired files
    let deletedCount = 0;
    for (const expired of expiredFiles) {
      try {
        // Delete the actual file
        const filePath = `files/${expired.fileId}/${expired.originalName}`;
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: filePath
        }));

        // Delete metadata file
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: expired.metadataKey
        }));

        deletedCount++;
        console.log(`Deleted expired file: ${expired.originalName} (expired: ${expired.expiryDate})`);
      } catch (error) {
        console.error('Error deleting expired file:', expired.fileId, error);
        // Continue with other files
      }
    }

    console.log(`Cleanup completed: ${deletedCount} expired files deleted`);
    
    return createResponse(200, {
      success: true,
      deletedCount,
      totalExpired: expiredFiles.length,
      expiredFiles: expiredFiles.map(f => ({
        fileId: f.fileId,
        originalName: f.originalName,
        expiryDate: f.expiryDate
      }))
    });

  } catch (error) {
    console.error('Clean expired files error:', error);
    return createResponse(500, { 
      error: 'Failed to clean expired files',
      details: error.message 
    });
  }
};