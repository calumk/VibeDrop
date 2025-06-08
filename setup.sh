#!/bin/bash

echo "🎵 VibeDrop - Setup Script"
echo "=========================="

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Copy example file
cp env.example .env.local

echo "✅ Created .env.local from env.example"
echo ""
echo "🔧 Next Steps:"
echo "1. Edit .env.local with your actual values:"
echo "   - Set your DigitalOcean Spaces credentials"
echo "   - Change the admin password"
echo "   - Customize app name and settings"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "📚 For detailed setup instructions, see:"
echo "   - README.md"
echo "   - DEPLOYMENT.md"
echo ""
echo "🚀 Deploy to production:"
echo "   Use the Deploy to DigitalOcean button in README.md"
echo "" 