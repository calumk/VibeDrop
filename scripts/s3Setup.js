#!/usr/bin/env node

// S3 Setup Script to configure CORS with ETag support for DigitalOcean Spaces
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3'

const SPACES_ENDPOINT = 'https://lon1.digitaloceanspaces.com'
const SPACES_BUCKET = 'dsl-test-bucket'
const SPACES_KEY = 'REDACTED_ACCESS_KEY'
const SPACES_SECRET = 'REDACTED_SECRET_KEY'

const s3Client = new S3Client({
  endpoint: SPACES_ENDPOINT,
  region: 'lon1',
  credentials: {
    accessKeyId: SPACES_KEY,
    secretAccessKey: SPACES_SECRET
  },
  forcePathStyle: false
})

// CORS Configuration with ETag properly exposed
const corsConfiguration = {
  CORSRules: [
    {
      // Rule for file uploads (with ETag exposure)
      AllowedOrigins: ['*'],
      AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
      MaxAgeSeconds: 3000,
      AllowedHeaders: [
        'Authorization',
        'Content-Type',
        'Content-Length',
        'Content-MD5',
        'x-amz-content-sha256',
        'x-amz-date',
        'x-amz-acl',
        'x-amz-meta-*'
      ],
      ExposeHeaders: ['ETag', 'x-amz-version-id']
    },
    {
      // Rule for public file access
      AllowedOrigins: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      MaxAgeSeconds: 3000,
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag']
    }
  ]
}

async function setupS3CORS() {
  try {
    console.log('🔧 Setting up CORS configuration for DigitalOcean Spaces...')
    console.log(`📦 Bucket: ${SPACES_BUCKET}`)
    console.log(`🌐 Endpoint: ${SPACES_ENDPOINT}`)
    
    // Apply CORS configuration
    const putCommand = new PutBucketCorsCommand({
      Bucket: SPACES_BUCKET,
      CORSConfiguration: corsConfiguration
    })

    await s3Client.send(putCommand)
    console.log('✅ CORS configuration applied successfully!')
    
    // Wait a moment for changes to propagate
    console.log('⏳ Waiting for configuration to propagate...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Verify the configuration
    console.log('🔍 Verifying CORS configuration...')
    const getCommand = new GetBucketCorsCommand({
      Bucket: SPACES_BUCKET
    })
    
    const response = await s3Client.send(getCommand)
    console.log('📋 Current CORS Configuration:')
    console.log(JSON.stringify(response.CORSConfiguration, null, 2))
    
    console.log('')
    console.log('🎉 CORS setup complete!')
    console.log('✅ ETag header is now properly exposed')
    console.log('✅ All required headers are configured')
    console.log('✅ File uploads should now work properly')
    console.log('')
    console.log('🚀 You can now test file uploads in your application!')
    
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message)
    console.log('')
    console.log('💡 Troubleshooting:')
    console.log('1. Check your DigitalOcean Spaces credentials')
    console.log('2. Verify the bucket name is correct')
    console.log('3. Ensure your account has permissions to modify CORS')
    console.log('4. Try configuring CORS manually in the DigitalOcean console')
    console.log('')
    console.log('🔧 Manual CORS Configuration (if automated setup fails):')
    console.log(JSON.stringify(corsConfiguration, null, 2))
  }
}

// Run the setup
setupS3CORS() 