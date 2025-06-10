#!/bin/bash

# Script to deploy only actual secrets from .dev.vars to Cloudflare Workers
# Skips variables already configured in wrangler.toml
# Usage: ./deploy-secrets.sh

set -e  # Exit on any error

DEV_VARS_FILE=".dev.vars"

if [ ! -f "$DEV_VARS_FILE" ]; then
    echo "Error: $DEV_VARS_FILE file not found!"
    exit 1
fi

# Only these should be secrets (others are variables in wrangler.toml)
SECRETS_TO_DEPLOY=("R2_ACCESS_KEY_ID" "R2_SECRET_ACCESS_KEY" "R2_PUBLIC_DOMAIN")

echo "🔐 Deploying secrets from $DEV_VARS_FILE to Cloudflare Workers..."
echo "📝 Only deploying: ${SECRETS_TO_DEPLOY[*]}"
echo ""

# First pass: Delete existing secrets
echo "🗑️  Deleting existing secrets..."
echo ""

for secret_name in "${SECRETS_TO_DEPLOY[@]}"; do
    echo "🗑️  Deleting secret: $secret_name"
    
    # Try to delete the secret (ignore errors if it doesn't exist)
    npx wrangler secret delete "$secret_name" --force 2>/dev/null || echo "   (Secret $secret_name didn't exist, skipping)"
    
    echo ""
done

echo "✅ Existing secrets cleaned up"
echo ""
echo "📤 Creating new secrets..."
echo ""

# Second pass: Create only the required secrets
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Check if line contains an equals sign
    if [[ "$line" =~ = ]]; then
        # Split the line into variable name and value
        var_name=$(echo "$line" | cut -d'=' -f1)
        var_value=$(echo "$line" | cut -d'=' -f2-)
        
        # Remove any leading/trailing whitespace
        var_name=$(echo "$var_name" | xargs)
        var_value=$(echo "$var_value" | xargs)
        
        # Remove quotes if present
        var_value=$(echo "$var_value" | sed 's/^"//;s/"$//')
        
        # Only deploy if it's in our secrets list
        for secret_name in "${SECRETS_TO_DEPLOY[@]}"; do
            if [ "$var_name" = "$secret_name" ]; then
                echo "📤 Setting secret: $var_name"
                
                # Use wrangler secret put to set the secret
                echo "$var_value" | npx wrangler secret put "$var_name"
                
                echo "✅ Secret $var_name set successfully"
                echo ""
                break
            fi
        done
    fi
done < "$DEV_VARS_FILE"

echo "🎉 All secrets have been deployed successfully!" 