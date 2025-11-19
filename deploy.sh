#!/bin/bash

# A8 Workout Challenge - GitHub Deployment Script
# This script helps you deploy the app to GitHub Pages

set -e  # Exit on error

echo "🚀 A8 Workout Challenge - GitHub Pages Deployment"
echo "=================================================="
echo ""

# Check if config.js has been updated
if grep -q "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE" config.js; then
    echo "❌ Error: config.js still has placeholder URL"
    echo ""
    echo "Please update config.js with your Google Apps Script URL first:"
    echo "1. Deploy Code.gs as Web App in Google Apps Script"
    echo "2. Copy the deployment URL"
    echo "3. Update API_URL in config.js"
    echo ""
    exit 1
fi

echo "✅ config.js has been updated"
echo ""

# Check cache-busting versions
echo "🔍 Checking cache-busting versions..."
echo ""
echo "Found the following cache-busting versions in HTML files:"
grep -h "?v=" *.html admin/*.html 2>/dev/null | grep -o "?v=[0-9-]*" | sort -u || echo "  (none found)"
echo ""
read -p "Are all cache-busting versions up-to-date and consistent? (y/n): " VERSION_OK
if [ "$VERSION_OK" != "y" ] && [ "$VERSION_OK" != "Y" ]; then
    echo ""
    echo "❌ Please update cache-busting versions before deploying"
    echo ""
    echo "Instructions:"
    echo "1. Use format: YYYYMMDD-N (e.g., 20251119-1)"
    echo "2. Update ALL HTML files with the same version:"
    echo "   - index.html (styles.css, config.js, api.js)"
    echo "   - signup.html (styles.css, config.js, api.js)"
    echo "   - signup_challenge.html (styles.css, config.js, api.js)"
    echo "   - signups.html (styles.css, config.js, api.js)"
    echo "   - admin/index.html (admin-styles.css, admin-config.js, admin-api.js)"
    echo "   - admin/email-campaigns.html (admin-styles.css, admin-config.js, admin-api.js)"
    echo "3. See DEPLOYMENT_AND_WORKFLOW.md for details"
    echo ""
    exit 1
fi
echo "✅ Cache-busting versions confirmed"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
    echo ""
else
    echo "✅ Git repository already exists"
    echo ""
fi

# Check if files are staged
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
else
    echo "📝 Staging files..."
    git add .
    echo "✅ Files staged"
    echo ""

    echo "💾 Creating commit..."
    git commit -m "Deploy A8 Workout Challenge to GitHub Pages"
    echo "✅ Commit created"
    echo ""
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 Remote 'origin' not found"
    echo ""
    read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): " REPO_URL

    if [ -z "$REPO_URL" ]; then
        echo "❌ No URL provided. Exiting."
        exit 1
    fi

    echo "Adding remote..."
    git remote add origin "$REPO_URL"
    echo "✅ Remote added"
    echo ""
else
    echo "✅ Remote 'origin' already configured"
    echo ""
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "📌 Renaming branch to 'main'..."
    git branch -M main
    echo "✅ Branch renamed to 'main'"
    echo ""
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
if git push -u origin main; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""

    REPO_URL=$(git remote get-url origin)
    # Extract username and repo name from URL
    if [[ $REPO_URL =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
        USERNAME="${BASH_REMATCH[1]}"
        REPONAME="${BASH_REMATCH[2]}"
        PAGES_URL="https://${USERNAME}.github.io/${REPONAME}/"

        echo "=================================================="
        echo "🎉 Deployment Complete!"
        echo "=================================================="
        echo ""
        echo "📝 Next steps:"
        echo ""
        echo "1. Enable GitHub Pages:"
        echo "   → Go to: https://github.com/${USERNAME}/${REPONAME}/settings/pages"
        echo "   → Source: Deploy from branch 'main'"
        echo "   → Click 'Save'"
        echo ""
        echo "2. Wait 1-2 minutes for GitHub to build your site"
        echo ""
        echo "3. Your app will be available at:"
        echo "   → ${PAGES_URL}"
        echo ""
        echo "4. Test with your user parameter:"
        echo "   → ${PAGES_URL}?user=yourname"
        echo ""
        echo "5. Share with your team:"
        echo "   → ${PAGES_URL}?user=THEIR_NAME"
        echo ""
        echo "=================================================="
        echo "📚 Documentation:"
        echo "   → README.md - Full deployment guide"
        echo "   → QUICK_START.md - Quick reference"
        echo "   → TESTING_CHECKLIST.md - Testing guide"
        echo "=================================================="
    else
        echo "✅ Pushed successfully!"
        echo "Enable GitHub Pages in your repository settings"
    fi
else
    echo "❌ Push failed. Please check the error above."
    exit 1
fi
