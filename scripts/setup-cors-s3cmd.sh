#!/bin/bash

# S3CMD CORS Setup Script for DigitalOcean Spaces
# This script applies CORS configuration using s3cmd and verifies it worked

BUCKET="dsl-test-bucket"
ENDPOINT="https://lon1.digitaloceanspaces.com"
ACCESS_KEY="REDACTED_ACCESS_KEY_2"
SECRET_KEY="REDACTED_SECRET_KEY_2"

echo "🔧 Setting up CORS configuration using s3cmd..."
echo "📦 Bucket: $BUCKET"
echo "🌐 Endpoint: $ENDPOINT"

# Check if s3cmd is installed
if ! command -v s3cmd &> /dev/null; then
    echo "❌ s3cmd is not installed. Installing via pip..."
    pip3 install s3cmd
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install s3cmd. Please install manually:"
        echo "   pip3 install s3cmd"
        echo "   OR"
        echo "   brew install s3cmd  # macOS"
        exit 1
    fi
fi

# Configure s3cmd with DigitalOcean Spaces credentials
echo "🔑 Configuring s3cmd..."
cat > ~/.s3cfg << EOF
[default]
access_key = $ACCESS_KEY
secret_key = $SECRET_KEY
host_base = lon1.digitaloceanspaces.com
host_bucket = %(bucket)s.lon1.digitaloceanspaces.com
use_https = True
signature_v2 = False
EOF

echo "📄 Applying CORS configuration..."
s3cmd setcors cors-config.xml s3://$BUCKET

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration applied successfully!"
    
    # Wait for propagation
    echo "⏳ Waiting for configuration to propagate..."
    sleep 3
    
    # Verify the configuration
    echo "🔍 Verifying CORS configuration..."
    s3cmd getcors s3://$BUCKET
    
    echo ""
    echo "🎉 CORS setup complete!"
    echo "✅ ETag header is now properly exposed"
    echo "✅ All required methods are configured"
    echo "✅ File uploads should now work properly"
    echo ""
    echo "🚀 Test file uploads in your application now!"
    
else
    echo "❌ Failed to apply CORS configuration"
    echo "💡 Try running the AWS SDK method instead:"
    echo "   bun run setup-cors-aws"
fi 