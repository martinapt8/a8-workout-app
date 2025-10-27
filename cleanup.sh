#!/bin/bash

# A8 Workout Challenge - Folder Cleanup Script
# This script organizes files before pushing to GitHub

set -e

echo "🧹 A8 Workout Challenge - Folder Cleanup"
echo "========================================"
echo ""

# Create backend folder for .gs files
echo "📁 Creating /backend folder for Google Apps Script files..."
mkdir -p backend

# Move .gs files to backend folder
echo "Moving .gs files to /backend..."
mv -f *.gs backend/ 2>/dev/null || echo "  (Some .gs files may already be moved)"

# Create assets folder (optional)
echo ""
read -p "Create /assets folder for images? (y/n): " CREATE_ASSETS
if [ "$CREATE_ASSETS" = "y" ]; then
    mkdir -p assets
    echo "Moving images to /assets..."
    mv -f *.png assets/ 2>/dev/null || echo "  (No .png files to move)"
fi

# Ask about legacy files
echo ""
echo "🗑️  Legacy Files:"
echo "  - styles.html (replaced by styles.css)"
echo "  - additional-styles.css (not sure if needed)"
echo ""
read -p "Delete legacy files? (y/n): " DELETE_LEGACY
if [ "$DELETE_LEGACY" = "y" ]; then
    rm -f styles.html
    rm -f additional-styles.css
    echo "  Deleted: styles.html, additional-styles.css"
fi

# Clean up system files
echo ""
echo "🧼 Cleaning up system files..."
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
echo "  Removed .DS_Store files"

# Show final structure
echo ""
echo "✅ Cleanup complete! Final structure:"
echo "========================================"
ls -1 | grep -v backend | grep -v assets

if [ -d "backend" ]; then
    echo ""
    echo "📁 backend/:"
    ls -1 backend | sed 's/^/  /'
fi

if [ -d "assets" ]; then
    echo ""
    echo "📁 assets/:"
    ls -1 assets | sed 's/^/  /'
fi

echo ""
echo "========================================"
echo "✅ Ready for git init!"
echo ""
echo "Next steps:"
echo "1. Review the structure above"
echo "2. Run: git init"
echo "3. Run: git add ."
echo "4. Run: git commit -m 'Initial commit'"
echo ""
