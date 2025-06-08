# CORS Setup Guide for DigitalOcean Spaces

## 🚨 Current Issue
Your file uploads are failing because of CORS (Cross-Origin Resource Sharing) restrictions. The browser blocks requests to your DigitalOcean Spaces bucket because it doesn't have the proper CORS configuration.

## 🛠 Step-by-Step CORS Configuration

### Method 1: DigitalOcean Console (Recommended)

1. **Log into DigitalOcean**
   - Go to [DigitalOcean Console](https://cloud.digitalocean.com/)
   - Navigate to **Spaces**

2. **Select Your Bucket**
   - Click on `dsl-test-bucket`

3. **Configure CORS**
   - Go to **Settings** tab
   - Find **CORS Configuration** section
   - Click **Edit CORS Configuration**

4. **Add CORS Rule** (Simplified - No ExposeHeaders needed)
   ```json
   {
     "AllowedOrigins": ["*"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3000
   }
   ```

5. **Save Configuration**
   - Click **Save** or **Apply**
   - Wait for the configuration to propagate (usually 1-2 minutes)

### Method 2: Using doctl CLI (Alternative)

If you have `doctl` installed:

```bash
# Install doctl if not already installed
# brew install doctl  # macOS
# snap install doctl  # Ubuntu

# Authenticate
doctl auth init

# Configure CORS
doctl spaces cors set dsl-test-bucket \
  --allowed-origins "*" \
  --allowed-methods "GET,PUT,POST,DELETE,HEAD" \
  --allowed-headers "*" \
  --max-age-seconds 3000
```

## 🔍 Verification

After configuring CORS, verify it's working:

1. **Wait 1-2 minutes** for changes to propagate
2. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   bun run dev
   ```
3. **Try uploading a file** in your browser
4. **Check browser console** - CORS errors should be gone

## 🚀 Expected Success

After proper CORS configuration, you should see:

✅ **Console logs like:**
- "Creating multipart upload for: filename.ext"
- "Multipart upload created successfully for file ID: abc123"
- Upload progress without errors

✅ **Successful file upload** with shareable link generated

## 🔧 Alternative CORS Configuration (More Restrictive)

For production, you might want to restrict origins:

```json
{
  "AllowedOrigins": [
    "http://localhost:5173", 
    "https://yourdomain.com"
  ],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": [
    "Content-Type",
    "Authorization", 
    "x-amz-date",
    "x-amz-content-sha256",
    "x-amz-meta-*"
  ],
  "MaxAgeSeconds": 3600
}
```

## 🐛 Upload Starts But Then Fails?

If uploads begin but fail partway through, try these solutions:

1. **Remove ExposeHeaders entirely** - DigitalOcean may not support custom expose headers
2. **Simplify AllowedHeaders** to just `["*"]` 
3. **Check file size limits** - ensure your file isn't exceeding limits
4. **Monitor browser console** for specific error messages
5. **Try smaller files first** to isolate the issue

## ❓ Troubleshooting

### Still getting CORS errors?

1. **Check configuration applied**: Sometimes changes take time to propagate
2. **Clear browser cache**: Hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. **Verify bucket name**: Ensure you're configuring the correct bucket
4. **Check permissions**: Your DigitalOcean account needs CORS modification permissions

### Alternative: Test with a different bucket

If issues persist, try creating a new test bucket with CORS configured from the start.

## 📞 Need Help?

If you continue having issues:
1. Share the exact error message from browser console
2. Confirm CORS configuration was saved in DigitalOcean console
3. Try the verification steps above

---

**Next Step**: Please configure CORS using Method 1 above, then try uploading a file again! 🚀 