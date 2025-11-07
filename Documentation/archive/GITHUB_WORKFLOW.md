# GitHub Workflow Guide

## 🎯 Recommended Approach: Single Repo with Branches

### Repository Structure
```
GitHub Repo: a8-workout-app
├── main branch    → Production (auto-deploys to GitHub Pages)
└── dev branch     → Development (test changes here)
```

### Backend Structure
```
Dev Environment:
├── Dev Google Sheet
├── Dev Google Apps Script
└── Dev API URL in config.js

Production Environment:
├── Production Google Sheet
├── Production Google Apps Script
└── Production API URL in config.js
```

---

## 🚀 Initial Setup (Do Once)

### 1. Clean Up Your Folder
```bash
cd "/path/to/your/project/folder"
./cleanup.sh  # If you have a cleanup script
```

This will:
- Move .gs files to `/backend` folder
- Optionally create `/assets` folder
- Delete legacy files (styles.html, etc.)
- Clean up .DS_Store files

### 2. Initialize Git
```bash
git init
git add .
git commit -m "Initial commit - A8 Workout Challenge migration complete"
```

### 3. Create GitHub Repository
1. Go to github.com
2. Click "New repository"
3. Name: `a8-workout-app` (or your choice)
4. **Don't** initialize with README (you already have one)
5. Make it **Private** (recommended) or Public
6. Click "Create repository"

### 4. Connect Local to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/a8-workout-app.git
git branch -M main
git push -u origin main
```

### 5. Create Dev Branch
```bash
git checkout -b dev
git push -u origin dev
```

### 6. Enable GitHub Pages
1. Go to repo on GitHub
2. Settings → Pages
3. Source: Deploy from branch
4. Branch: `main`
5. Folder: `/ (root)`
6. Save

Your production app will be at:
```
https://YOUR_USERNAME.github.io/a8-workout-app/?user=USERNAME
```

---

## 🔄 Daily Development Workflow

### Working on New Features

#### Step 1: Switch to Dev Branch
```bash
git checkout dev
```

#### Step 2: Make Your Changes
Edit files as needed (index.html, styles.css, etc.)

#### Step 3: Test Locally
```bash
# Make sure config.js points to your DEV API URL
python3 serve.py

# Open browser to:
http://localhost:8000/?user=yourname
```

#### Step 4: Commit Changes
```bash
git add .
git commit -m "Add new feature: XYZ"
```

#### Step 5: Push to Dev Branch
```bash
git push origin dev
```

#### Step 6: Test on Dev GitHub Pages (Optional)
If you want to test on actual GitHub Pages before production:
1. Settings → Pages → Change branch to `dev`
2. Test at: `https://YOUR_USERNAME.github.io/a8-workout-app/?user=yourname`
3. Change back to `main` when satisfied

---

### Deploying to Production

When your dev changes are tested and ready:

#### Option A: Direct Merge (Simple)
```bash
# Switch to main branch
git checkout main

# Merge dev into main
git merge dev

# Push to GitHub (auto-deploys to Pages)
git push origin main
```

#### Option B: Pull Request (Professional)
1. Go to GitHub repo
2. Click "Pull requests" → "New pull request"
3. Base: `main` ← Compare: `dev`
4. Review changes
5. Click "Create pull request"
6. Add description
7. Click "Merge pull request"
8. Pull changes locally:
   ```bash
   git checkout main
   git pull origin main
   ```

---

## 📝 Managing Different API URLs

### Create Config Files for Each Environment

**Option 1: Manual Switching** (Simple)
```javascript
// config.js
const CONFIG = {
  // Dev API URL
  // API_URL: 'https://script.google.com/macros/s/DEV_ID/exec',

  // Production API URL (uncomment for production)
  API_URL: 'https://script.google.com/macros/s/PROD_ID/exec'
};
```

**Option 2: Separate Config Files** (Better)

Create two config files:
```javascript
// config.dev.js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/DEV_ID/exec'
};

// config.prod.js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/PROD_ID/exec'
};
```

Then in index.html:
```html
<!-- For dev: -->
<script src="config.dev.js"></script>

<!-- For production: -->
<script src="config.prod.js"></script>
```

**Option 3: Environment Detection** (Most Advanced)
```javascript
// config.js
const CONFIG = {
  API_URL: window.location.hostname === 'localhost'
    ? 'https://script.google.com/macros/s/DEV_ID/exec'      // Dev
    : 'https://script.google.com/macros/s/PROD_ID/exec'     // Production
};
```

---

## 🎯 Backend Deployment Strategy

### Dev Backend
1. **Dev Google Sheet**: Copy of production sheet
2. **Dev Apps Script**: Deployed separately
3. **Dev API URL**: Used in dev branch
4. **Purpose**: Test changes without affecting users

### Production Backend
1. **Production Google Sheet**: Real user data
2. **Production Apps Script**: Stable deployment
3. **Production API URL**: Used in main branch
4. **Purpose**: Live app users access

### Updating Backend Code:
```bash
# Both .gs files live in /backend folder for reference
# When you update backend:

1. Test changes in Dev Apps Script first
2. Deploy Dev Apps Script → get new URL (if needed)
3. Test frontend with dev backend
4. When stable, copy .gs code to Production Apps Script
5. Deploy Production Apps Script
6. Merge dev → main in GitHub
```

---

## 📊 Branch Status at a Glance

### Check Current Branch
```bash
git branch
```

### Check for Changes
```bash
git status
```

### View Commit History
```bash
git log --oneline
```

### Compare Branches
```bash
git diff main..dev
```

---

## 🔥 Common Commands

### Create Feature Branch (Optional)
```bash
git checkout -b feature/new-ai-workouts
# Make changes
git commit -m "Add new AI feature"
git push origin feature/new-ai-workouts
# Then merge to dev, test, then merge to main
```

### Undo Local Changes
```bash
git checkout -- index.html  # Undo changes to specific file
git reset --hard            # Undo ALL local changes
```

### Pull Latest Changes
```bash
git pull origin dev   # Update dev branch
git pull origin main  # Update main branch
```

---

## 🎓 Summary of Workflow

### For Small Changes:
```bash
dev branch → test locally → merge to main → auto-deploys
```

### For Big Features:
```bash
feature branch → merge to dev → test → merge to main → auto-deploys
```

### For Backend Changes:
```bash
Update .gs in /backend → test in Dev GAS → deploy to Prod GAS → merge to main
```

---

## 🚨 Emergency Rollback

If production breaks:

### Option 1: Revert Last Commit
```bash
git checkout main
git revert HEAD
git push origin main
```

### Option 2: Go Back to Previous Version
```bash
git checkout main
git log --oneline              # Find commit hash to go back to
git reset --hard COMMIT_HASH
git push origin main --force   # WARNING: Use carefully!
```

---

## 📋 Recommended Commit Message Format

```bash
git commit -m "feat: Add AI workout difficulty selector"
git commit -m "fix: Resolve calendar display issue on mobile"
git commit -m "docs: Update deployment instructions"
git commit -m "style: Improve button hover states"
git commit -m "refactor: Simplify API error handling"
```

---

## 🎯 Best Practices

1. **Always work in dev branch** for new changes
2. **Test locally first** with `python3 serve.py`
3. **Commit frequently** with clear messages
4. **Test in dev before merging to main**
5. **Keep dev and main in sync** - merge regularly
6. **Document changes** in commit messages
7. **Use Pull Requests** for big changes (good audit trail)

---

## 📞 Quick Reference

```bash
# Daily workflow
git checkout dev              # Switch to dev
# (make changes)
git add .                     # Stage changes
git commit -m "message"       # Commit
git push origin dev           # Push to dev

# Deploy to production
git checkout main             # Switch to main
git merge dev                 # Merge dev changes
git push origin main          # Deploy to production

# Emergency
git checkout main
git revert HEAD
git push origin main
```

---

**Ready to start?** Run `./cleanup.sh` to organize your files!
