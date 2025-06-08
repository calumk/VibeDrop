# DigitalOcean App Platform Deployment

## Serverless Architecture

VibeDrop now uses a **secure serverless architecture** with DigitalOcean Functions. This provides enterprise-level security by keeping S3 credentials server-side only.

## Environment Variables Setup

In your DigitalOcean App Platform settings, add these environment variables:

### Frontend Variables (Client-side)

| Variable | Description | Example | Encrypt |
|----------|-------------|---------|---------|
| `VITE_APP_NAME` | Application name | `VibeDrop` | No |
| `VITE_APP_TAGLINE` | App description/tagline | `Share files securely and magically` | No |
| `VITE_FAVICON_URL` | Custom favicon URL | `https://your-domain.com/favicon.ico` | No |
| `VITE_USE_SIMPLE_LOGIN` | Use simple login (true/false) | `false` | No |
| `VITE_ADMIN_PASSWORD` | Admin access password | `your-secure-password` | **Yes** |
| `VITE_SIMPLE_AUTH_STRING` | URL parameter authentication string | `your-secret-auth-string` | **Yes** |
| `VITE_I_HAVE_DONATED_TO_CALUMK` | Hide footer attribution | `false` | No |

### Server-side Function Variables (SECURE)

**🔒 These credentials stay server-side and are NEVER exposed to browsers:**

| Variable | Description | Example | Encrypt |
|----------|-------------|---------|---------|
| `S3_ENDPOINT` | DigitalOcean Spaces endpoint | `https://lon1.digitaloceanspaces.com` | No |
| `S3_REGION` | DigitalOcean Spaces region | `lon1` | No |
| `S3_BUCKET` | Your Spaces bucket name | `your-bucket-name` | No |
| `S3_ACCESS_KEY_ID` | Spaces access key | `your-access-key` | **Yes** |
| `S3_SECRET_ACCESS_KEY` | Spaces secret key | `your-secret-key` | **Yes** |

### Steps to Configure

1. **Go to your app in DigitalOcean App Platform**
2. **Click on the "Settings" tab**
3. **Find "App-Level Environment Variables"**
4. **Click "Edit"**
5. **Add each variable listed above**
6. **Enable "Encrypt" for sensitive variables** (marked with **Yes** above)

## DigitalOcean Spaces Setup

1. **Create a Spaces bucket**:
   - Go to Spaces in your DigitalOcean control panel
   - Create a new bucket
   - Note the endpoint URL and region

2. **Generate API keys**:
   - Go to API section in DigitalOcean
   - Generate a new token/key pair
   - Save the access key ID and secret

3. **Configure CORS** (if needed):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

## Deployment Process

1. **Connect your repository** to DigitalOcean App Platform
2. **Set the build settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Configure environment variables** (see table above)
4. **Deploy the app**

## Configuration Options

### Simple Login Mode
- Set `VITE_USE_SIMPLE_LOGIN=true` for a minimal login screen
- Set `VITE_USE_SIMPLE_LOGIN=false` for the full splash page with features

### Customization
- `VITE_APP_NAME`: Changes the app title throughout the interface
- `VITE_APP_TAGLINE`: Updates the description text
- `VITE_FAVICON_URL`: Sets a custom favicon (supports .ico, .png, .svg formats)
- `VITE_ADMIN_PASSWORD`: Set a strong password for admin access

### URL Authentication
The app supports automatic authentication via URL parameters, useful for linking from other sites:

**Usage:**
```
https://your-app.com/?linkAuth=your-secret-auth-string
```

**How it works:**
1. User clicks a link with the `linkAuth` parameter
2. App automatically authenticates if the parameter matches `VITE_SIMPLE_AUTH_STRING`
3. User is redirected to the upload page
4. The auth parameter is removed from the URL for security

**Security Notes:**
- Use a strong, unique value for `VITE_SIMPLE_AUTH_STRING`
- This provides basic access control for linking from trusted sources
- The auth string is removed from the URL after authentication
- Session expires after 1 hour like normal password authentication

## Security Features

### 🛡️ Enterprise-Level Security
- **Zero Client-Side Credentials**: S3 credentials never exposed to browsers
- **Serverless Functions**: All S3 operations handled server-side
- **Pre-signed URLs**: Temporary, secure upload/download links
- **Authentication Validation**: All operations require proper authorization

### Security Best Practices
- Always encrypt sensitive variables in DigitalOcean (marked **Yes** above)
- Use strong passwords for admin access (12+ characters)
- Regularly rotate your Spaces API keys
- Monitor function logs for unusual activity
- Set appropriate file expiry times

### Why Serverless Functions Are Required
Traditional SPAs expose S3 credentials in client-side JavaScript, allowing anyone to:
- View your credentials in browser dev tools
- Upload unlimited files to your bucket
- Delete all your files
- Rack up massive storage costs

**VibeDrop's serverless architecture prevents ALL of these attacks.**

## Troubleshooting

### Common Issues

1. **"Environment variable undefined" errors**:
   - Ensure all required variables are set
   - Check variable names exactly match (case-sensitive)
   - Redeploy after adding variables

2. **S3/Spaces connection errors**:
   - Verify your API keys are correct
   - Check the endpoint URL and region
   - Ensure the bucket exists and is accessible

3. **Authentication not working**:
   - Verify `VITE_ADMIN_PASSWORD` is set
   - Check if encryption is properly enabled for the password variable

### Getting Help

If you encounter issues:
1. Check the build logs in DigitalOcean App Platform
2. Verify all environment variables are properly set
3. Test the configuration locally first with a `.env.local` file 