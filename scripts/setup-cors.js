#!/usr/bin/env node

// Script to configure CORS for DigitalOcean Spaces
import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3'

const SPACES_ENDPOINT = process.env.VITE_S3_ENDPOINT || 'https://lon1.digitaloceanspaces.com'
const SPACES_BUCKET = process.env.VITE_S3_BUCKET
const SPACES_KEY = process.env.VITE_S3_ACCESS_KEY_ID
const SPACES_SECRET = process.env.VITE_S3_SECRET_ACCESS_KEY

// Validate required environment variables
if (!SPACES_BUCKET || !SPACES_KEY || !SPACES_SECRET) {
  console.error('❌ Missing required environment variables!')
  console.log('Please set the following environment variables:')
  console.log('- VITE_S3_BUCKET')
  console.log('- VITE_S3_ACCESS_KEY_ID')
  console.log('- VITE_S3_SECRET_ACCESS_KEY')
  console.log('- VITE_S3_ENDPOINT (optional, defaults to https://lon1.digitaloceanspaces.com)')
  process.exit(1)
}

const s3Client = new S3Client({
  endpoint: SPACES_ENDPOINT,
  region: 'lon1',
  credentials: {
    accessKeyId: SPACES_KEY,
    secretAccessKey: SPACES_SECRET
  },
  forcePathStyle: false
})

const corsConfiguration = {
  CORSRules: [
    {
      AllowedOrigins: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedHeaders: ['*'],
      MaxAgeSeconds: 3000
    }
  ]
}

async function setupCORS() {
  try {
    console.log('🔧 Configuring CORS for DigitalOcean Spaces...')
    
    const command = new PutBucketCorsCommand({
      Bucket: SPACES_BUCKET,
      CORSConfiguration: corsConfiguration
    })

    await s3Client.send(command)
    
    console.log('✅ CORS configuration applied successfully!')
    console.log('📋 CORS Rules:')
    console.log(JSON.stringify(corsConfiguration, null, 2))
    console.log('')
    console.log('🚀 You can now try uploading files again!')
    
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message)
    console.log('')
    console.log('💡 Manual CORS Configuration:')
    console.log('1. Go to DigitalOcean Console > Spaces > dsl-test-bucket > Settings')
    console.log('2. Add this CORS configuration:')
    console.log(JSON.stringify(corsConfiguration, null, 2))
  }
}

setupCORS() 