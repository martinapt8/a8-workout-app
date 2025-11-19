# Deployment & Workflow Guide

## 📋 Overview

This guide covers the complete deployment and development workflow for the Daily Dose workout app, from initial setup through daily development and emergency procedures.

### Repository Structure
```
GitHub Repo: a8-workout-app
├── main branch    → Production (auto-deploys to GitHub Pages)
└── dev branch     → Development (test changes here)
```

### Environment Structure
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

## ✅ Pre-Deployment Checklist

### 1. Clean Up Folder
- [ ] Run `./cleanup.sh` to organize files
- [ ] Review folder structure
- [ ] Delete any unnecessary screenshots/files
- [ ] Verify .gitignore is correct

### 2. Test Locally
- [ ] Run `python3 serve.py`
- [ ] Test at `http://localhost:8000/?user=yourname`
- [ ] Test all pages: Today, Team, Me, Library, A8AI
- [ ] Test workout logging
- [ ] Test AI workout generation
- [ ] Test past workout logging
- [ ] Check browser console for errors (should be clean)

### 3. Verify Configuration
- [ ] `config.js` has correct API URL
- [ ] Google Apps Script is deployed and accessible
- [ ] Test API directly in browser: `YOUR_API_URL?action=getDashboard&userId=yourname`
- [ ] Claude API key is in Script Properties (if using AI)

### 4. Update Cache-Busting Versions
**CRITICAL: Update version parameters to ensure users get fresh files**

Version format: `YYYYMMDD-N` (date + daily increment counter)

- [ ] Update version in **ALL** HTML files to today's date (or increment if multiple deploys today):
  - [ ] `index.html` (lines: styles.css, config.js, api.js)
  - [ ] `signup.html` (lines: styles.css, config.js, api.js)
  - [ ] `signup_challenge.html` (lines: styles.css, config.js, api.js)
  - [ ] `signups.html` (lines: styles.css, config.js, api.js)
  - [ ] `admin/index.html` (lines: admin-styles.css, admin-config.js, admin-api.js)
  - [ ] `admin/email-campaigns.html` (lines: admin-styles.css, admin-config.js, admin-api.js)
- [ ] Verify all files have **consistent version numbers** (use `grep -h "?v=" *.html admin/*.html | sort -u`)
- [ ] Document version in CHANGELOG.md commit message

**Example**: If deploying on Nov 19, 2025:
- First deploy of the day: `?v=20251119-1`
- Second deploy of the day: `?v=20251119-2`

**Note**: Cache-busting ensures users automatically receive updates without clearing browser cache or re-bookmarking.

### 5. Documentation Review
- [ ] README.md has correct deployment instructions
- [ ] Config.js has correct API URL (or instructions to update)
- [ ] All documentation files are up to date

---

## 🚀 Initial Setup & Deployment

### Phase 1: Clean & Initialize
- [ ] Navigate to project folder: `cd "/path/to/your/project/folder"`
- [ ] Run `./cleanup.sh` (moves .gs files to /backend, creates /assets)
- [ ] Run `git init`
- [ ] Run `git add .`
- [ ] Run `git commit -m "Initial commit - Production ready"`

### Phase 2: Create GitHub Repository
- [ ] Go to github.com → Click "New repository"
- [ ] Name: `a8-workout-app` (or your choice)
- [ ] Choose **Private** (recommended) or Public
- [ ] **Don't** initialize with README (you already have one)
- [ ] Click "Create repository"
- [ ] Copy repository URL

### Phase 3: Connect & Push to GitHub
- [ ] Run `git remote add origin https://github.com/YOUR_USERNAME/a8-workout-app.git`
- [ ] Run `git branch -M main`
- [ ] Run `git push -u origin main`

### Phase 4: Create Dev Branch
- [ ] Run `git checkout -b dev`
- [ ] Run `git push -u origin dev`

### Phase 5: Enable GitHub Pages
- [ ] Go to Settings → Pages
- [ ] Source: Deploy from branch
- [ ] Branch: `main`
- [ ] Folder: `/ (root)`
- [ ] Save
- [ ] Wait 1-2 minutes for deployment

Your production app will be at:
```
https://YOUR_USERNAME.github.io/a8-workout-app/?user=USERNAME
```

### Phase 6: Set Up Dev Backend
- [ ] Duplicate Production Google Sheet → name it "A8 Challenge DEV"
- [ ] Open Dev Sheet → Extensions → Apps Script
- [ ] Copy all .gs files from production
- [ ] Deploy as Web App → copy DEV API URL
- [ ] Update `config.js` with dev API URL (see Configuration section)

### Phase 7: Test Production Deployment
- [ ] Visit `https://YOUR_USERNAME.github.io/a8-workout-app/?user=yourname`
- [ ] Test all functionality
- [ ] Verify API calls work
- [ ] Check console for errors
- [ ] Test on mobile device

---

## 🔧 Configuration Management

### Managing API URLs Across Environments

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

## 🔄 Daily Development Workflow

### Working on New Features

#### Step 1: Switch to Dev Branch
```bash
git checkout dev
```

#### Step 2: Make Your Changes
- [ ] Edit files as needed (index.html, styles.css, etc.)

#### Step 3: Test Locally
```bash
# Make sure config.js points to your DEV API URL
python3 serve.py

# Open browser to:
http://localhost:8000/?user=yourname
```
- [ ] Test all affected functionality
- [ ] Check browser console for errors
- [ ] Test on mobile if UI changes

#### Step 4: Commit Changes
```bash
git add .
git commit -m "feat: Add new feature XYZ"
```

#### Step 5: Push to Dev Branch
```bash
git push origin dev
```

#### Step 6: Optional - Test on Dev GitHub Pages
If you want to test on actual GitHub Pages before production:
- [ ] Settings → Pages → Change branch to `dev`
- [ ] Test at: `https://YOUR_USERNAME.github.io/a8-workout-app/?user=yourname`
- [ ] Change back to `main` when satisfied

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
- [ ] Go to GitHub repo
- [ ] Click "Pull requests" → "New pull request"
- [ ] Base: `main` ← Compare: `dev`
- [ ] Review changes
- [ ] Click "Create pull request"
- [ ] Add description of changes
- [ ] Click "Merge pull request"
- [ ] Pull changes locally:
  ```bash
  git checkout main
  git pull origin main
  ```

#### After Deployment
- [ ] Wait 2-3 minutes for GitHub Pages deployment
- [ ] Visit production URL to verify
- [ ] Test critical functionality
- [ ] Hard refresh browser (Ctrl+Shift+R) if needed

---

## 📦 Backend Deployment Strategy

### Backend Environments

**Dev Backend:**
- **Dev Google Sheet**: Copy of production sheet with test data
- **Dev Apps Script**: Deployed separately from production
- **Dev API URL**: Used in dev branch config
- **Purpose**: Test changes without affecting live users

**Production Backend:**
- **Production Google Sheet**: Real user data
- **Production Apps Script**: Stable deployment
- **Production API URL**: Used in main branch config
- **Purpose**: Live app users access

### Updating Backend Code

When you need to update Google Apps Script (.gs files):

- [ ] Update code in `/backend` folder locally (version control)
- [ ] Test changes in **Dev Apps Script** first
- [ ] Deploy Dev Apps Script → get new URL (if API changes)
- [ ] Test frontend dev branch with dev backend
- [ ] When stable, copy .gs code to **Production Apps Script**
- [ ] Deploy/Update Production Apps Script deployment
- [ ] Test frontend main branch with production backend
- [ ] Merge frontend dev → main if frontend changes needed

**Important**: Both environments' .gs files live in `/backend` folder for reference and version control.

---

## 🚨 Troubleshooting & Emergency Procedures

### Common Issues

#### App Not Loading
- [ ] Check config.js has correct API URL
- [ ] Verify API is accessible: test URL in browser with `?action=getDashboard&userId=test`
- [ ] Check browser console for errors (F12)
- [ ] Verify Google Apps Script deployment status in GAS console

#### API Errors
- [ ] Check Google Apps Script execution logs (Apps Script → Executions)
- [ ] Verify deployment access is set to "Anyone"
- [ ] Test API endpoint directly in browser
- [ ] Check for Code.gs syntax errors in GAS editor

#### GitHub Pages Not Updating
- [ ] Verify you pushed to correct branch (`main` for production)
- [ ] Check GitHub Actions tab for build status
- [ ] Wait 2-3 minutes for deployment to complete
- [ ] Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] Clear browser cache if needed

#### Data Not Saving
- [ ] Check Google Sheets permissions (Scripts have sheet access)
- [ ] Verify Apps Script has authorization to access sheets
- [ ] Check Completions sheet for new rows manually
- [ ] Review Apps Script execution logs for errors

### Emergency Rollback Procedures

If production breaks after a deployment:

#### Option 1: Revert Last Commit (Safe)
```bash
git checkout main
git revert HEAD
git push origin main
```
This creates a new commit that undoes the last change (preserves history).

#### Option 2: Reset to Previous Version (Use with Caution)
```bash
git checkout main
git log --oneline              # Find commit hash to go back to
git reset --hard COMMIT_HASH   # Go back to that commit
git push origin main --force   # WARNING: Use carefully!
```
⚠️ **Warning**: Force push overwrites history. Only use if revert doesn't work.

#### Option 3: Quick Fix Forward
```bash
git checkout dev
# Make quick fix
git add .
git commit -m "hotfix: Fix production issue"
git push origin dev
git checkout main
git merge dev
git push origin main
```

---

## 📝 Standards & Best Practices

### Commit Message Format

Use conventional commits for clarity:

```bash
git commit -m "feat: Add AI workout difficulty selector"
git commit -m "fix: Resolve calendar display issue on mobile"
git commit -m "docs: Update deployment instructions"
git commit -m "style: Improve button hover states"
git commit -m "refactor: Simplify API error handling"
git commit -m "test: Add validation for workout logging"
```

**Prefixes:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style/formatting (no logic change)
- `refactor:` Code restructuring (no behavior change)
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Development Best Practices

1. **Always work in dev branch** for new changes
2. **Test locally first** with `python3 serve.py`
3. **Commit frequently** with clear messages
4. **Test in dev before merging to main**
5. **Keep dev and main in sync** - merge regularly
6. **Document changes** in commit messages and CHANGELOG.md
7. **Use Pull Requests** for significant changes (good audit trail)
8. **Never commit sensitive data** (API keys, credentials)

### Branch Management

- **main**: Production code only (always stable)
- **dev**: Active development (may be unstable)
- **feature/**: Optional feature branches (merge to dev first)

### Git Command Reference

```bash
# Check current status
git status                    # See what's changed
git branch                    # See all branches (* = current)
git log --oneline            # View commit history

# Compare branches
git diff main..dev           # See differences between branches

# Undo changes
git checkout -- file.html    # Undo changes to specific file
git reset --hard             # Undo ALL local changes (careful!)

# Pull latest changes
git pull origin dev          # Update dev branch
git pull origin main         # Update main branch

# Create feature branch (optional)
git checkout -b feature/new-ai-workouts
git push origin feature/new-ai-workouts
```

---

## 📊 Post-Deployment Monitoring

### Share with Team
- [ ] Update team with production URL: `https://YOUR_USERNAME.github.io/a8-workout-app/?user=THEIR_NAME`
- [ ] Test with 2-3 beta users first
- [ ] Collect initial feedback

### Monitor First Week
- [ ] Check Google Apps Script execution logs daily
- [ ] Watch for errors in Apps Script Executions tab
- [ ] Monitor Completions sheet for data accuracy
- [ ] Ask users for feedback on performance
- [ ] Track any console errors in browser

### Document Everything
- [ ] Add deployed URL to README.md
- [ ] Add production API URL to internal documentation
- [ ] Update team documentation with new workflows
- [ ] Create backup of production Google Sheet
- [ ] Update CHANGELOG.md with version/date

### Success Metrics

Deployment is successful when:
- [ ] Production URL loads without errors
- [ ] All users can access with their personalized URL
- [ ] Workout logging works correctly
- [ ] AI workout generation works (if enabled)
- [ ] Calendar displays workout history accurately
- [ ] Team progress updates in real-time
- [ ] Mobile experience is smooth (test on actual devices)
- [ ] No console errors in browser
- [ ] Data saves to Google Sheets correctly
- [ ] All 5 pages navigate smoothly

---

## 🎯 Quick Reference

### Daily Workflow Commands
```bash
# Start development
git checkout dev              # Switch to dev branch
# (make your changes)
git add .                     # Stage all changes
git commit -m "feat: message" # Commit with clear message
git push origin dev           # Push to dev branch

# Deploy to production
git checkout main             # Switch to main branch
git merge dev                 # Merge dev changes
git push origin main          # Push to production (auto-deploys)

# Emergency rollback
git checkout main
git revert HEAD
git push origin main
```

### Initial Setup Commands
```bash
# First-time setup
./cleanup.sh
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main

# Create dev branch
git checkout -b dev
git push -u origin dev
```

### Useful Status Commands
```bash
git status                    # What's changed?
git branch                    # Which branch am I on?
git log --oneline -5         # Recent commits
git diff                      # See changes before committing
```

---

## 📞 Support Resources

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Git Basics**: https://git-scm.com/book/en/v2/Getting-Started-Git-Basics
- **Project Testing Guide**: See TESTING_CHECKLIST.md
- **Backend Testing**: See TESTING_FUNCTIONS_GUIDE.md
- **Admin Procedures**: See ADMIN_GUIDE.md

---

**Ready to deploy?** Start with the Pre-Deployment Checklist and work your way through each phase!
