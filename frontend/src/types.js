/**
 * @typedef {Object} FileMetadata
 * @property {string} id
 * @property {string} originalName
 * @property {number} size
 * @property {string} type
 * @property {string} uploadedAt
 * @property {string} [expiryDate]
 * @property {string} [passcode]
 * @property {number} [downloads]
 * @property {string} [lastDownload]
 * @property {string} [fileId] - Backwards compatibility field
 * @property {string} [uploadDate] - Backwards compatibility field
 * @property {number} [downloadCount] - Backwards compatibility field
 */

/**
 * @typedef {Object} CreateMultipartResponse
 * @property {string} uploadId
 * @property {string} key
 */

/**
 * @typedef {Object} SignPartResponse
 * @property {string} signedUrl
 */

/**
 * @typedef {Object} CompleteMultipartResponse
 * @property {boolean} success
 * @property {string} key
 */

/**
 * @typedef {Object} CreateMetadataResponse
 * @property {boolean} success
 * @property {string} fileId
 */

/**
 * @typedef {Object} GetMetadataResponse
 * @property {boolean} success
 * @property {FileMetadata} metadata
 */

/**
 * @typedef {Object} GetDownloadUrlResponse
 * @property {boolean} success
 * @property {string} downloadUrl
 * @property {FileMetadata} metadata
 */

/**
 * @typedef {Object} ListFilesResponse
 * @property {boolean} success
 * @property {FileMetadata[]} files
 */

/**
 * @typedef {Object} DeleteFileResponse
 * @property {boolean} success
 */

/**
 * @typedef {Object} CleanExpiredResponse
 * @property {boolean} success
 * @property {number} deletedCount
 */ 