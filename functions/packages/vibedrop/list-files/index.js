const { ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
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
    const files = [];
    const now = new Date();

    // Process each metadata file
    for (const object of listResponse.Contents || []) {
      try {
        const getCommand = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: object.Key
        });

        const response = await s3Client.send(getCommand);
        const metadataJson = await response.Body.transformToString();
        const metadata = JSON.parse(metadataJson);
        
        // Determine file status
        const isExpired = metadata.expiryDate ? now > new Date(metadata.expiryDate) : false;
        const status = metadata.expiryDate ? (isExpired ? 'Expired' : 'Active') : 'Permanent';

        files.push({
          ...metadata,
          fileId: metadata.id, // Add fileId for backwards compatibility
          uploadDate: metadata.uploadedAt, // Map uploadedAt to uploadDate
          downloadCount: metadata.downloads || 0, // Map downloads to downloadCount
          metadataKey: object.Key,
          isExpired,
          lastModified: object.LastModified,
          status,
          passcode: undefined // Never return passcode in list
        });
      } catch (error) {
        console.error('Error processing file:', object.Key, error);
        // Continue processing other files
      }
    }

    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    console.log(`Listed ${files.length} files for admin`);
    
    return createResponse(200, {
      success: true,
      files,
      totalFiles: files.length,
      activeFiles: files.filter(f => f.status === 'Active').length,
      expiredFiles: files.filter(f => f.status === 'Expired').length,
      permanentFiles: files.filter(f => f.status === 'Permanent').length
    });

  } catch (error) {
    console.error('List files error:', error);
    return createResponse(500, { 
      error: 'Failed to list files',
      details: error.message 
    });
  }
}; 