#!/usr/bin/env node

// AWS SDK v2 CORS Setup Script for DigitalOcean Spaces
const AWS = require('aws-sdk');

const BUCKET = process.env.VITE_S3_BUCKET;
const ACCESS_KEY = process.env.VITE_S3_ACCESS_KEY_ID;
const SECRET_KEY = process.env.VITE_S3_SECRET_ACCESS_KEY;

// Validate required environment variables
if (!BUCKET || !ACCESS_KEY || !SECRET_KEY) {
  console.error('❌ Missing required environment variables!');
  console.log('Please set the following environment variables:');
  console.log('- VITE_S3_BUCKET');
  console.log('- VITE_S3_ACCESS_KEY_ID');
  console.log('- VITE_S3_SECRET_ACCESS_KEY');
  process.exit(1);
}

// Configure AWS SDK for DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('lon1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: ACCESS_KEY,
  secretAccessKey: SECRET_KEY,
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

// CORS Configuration with ETag properly exposed
const corsParams = {
  Bucket: BUCKET,
  CORSConfiguration: {
    CORSRules: [
      {
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
      }
    ]
  }
};

async function setupCORS() {
  console.log('🔧 Setting up CORS configuration using AWS SDK v2...');
  console.log(`📦 Bucket: ${BUCKET}`);
  console.log(`🌐 Endpoint: lon1.digitaloceanspaces.com`);

  try {
    // Apply CORS configuration
    console.log('📄 Applying CORS configuration...');
    const result = await new Promise((resolve, reject) => {
      s3.putBucketCors(corsParams, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    console.log('✅ CORS configuration applied successfully!');
    
    // Wait for propagation
    console.log('⏳ Waiting for configuration to propagate...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify the configuration
    console.log('🔍 Verifying CORS configuration...');
    const corsConfig = await new Promise((resolve, reject) => {
      s3.getBucketCors({ Bucket: BUCKET }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    console.log('📋 Current CORS Configuration:');
    console.log(JSON.stringify(corsConfig.CORSConfiguration, null, 2));

    console.log('');
    console.log('🎉 CORS setup complete!');
    console.log('✅ ETag header is now properly exposed');
    console.log('✅ All required headers are configured');
    console.log('✅ File uploads should now work properly');
    console.log('');
    console.log('🚀 Test file uploads in your application now!');

  } catch (error) {
    console.error('❌ Failed to configure CORS:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('1. Check your DigitalOcean Spaces credentials');
    console.log('2. Verify the bucket name is correct');
    console.log('3. Ensure your account has permissions to modify CORS');
    console.log('4. Try the s3cmd method instead:');
    console.log('   chmod +x scripts/setup-cors-s3cmd.sh');
    console.log('   ./scripts/setup-cors-s3cmd.sh');
  }
}

// Run the setup
setupCORS(); 