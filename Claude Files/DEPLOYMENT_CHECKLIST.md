# Deployment Checklist

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

### 4. Documentation Review
- [ ] README.md has correct deployment instructions
- [ ] Config.js has correct API URL (or instructions to update)
- [ ] All documentation files are up to date

---

## 🚀 Initial GitHub Deployment

### Phase 1: Clean & Initialize
- [ ] Run `./cleanup.sh`
- [ ] Run `git init`
- [ ] Run `git add .`
- [ ] Run `git commit -m "Initial commit - Production ready"`

### Phase 2: Create Repository
- [ ] Create GitHub repository (a8-workout-app)
- [ ] Choose Private or Public
- [ ] Don't initialize with README
- [ ] Copy repository URL

### Phase 3: Push to GitHub
- [ ] Run `git remote add origin YOUR_REPO_URL`
- [ ] Run `git branch -M main`
- [ ] Run `git push -u origin main`

### Phase 4: Enable GitHub Pages
- [ ] Go to Settings → Pages
- [ ] Source: main branch
- [ ] Folder: / (root)
- [ ] Save
- [ ] Wait 1-2 minutes for deployment

### Phase 5: Test Production
- [ ] Visit `https://YOUR_USERNAME.github.io/a8-workout-app/?user=yourname`
- [ ] Test all functionality
- [ ] Verify API calls work
- [ ] Check console for errors
- [ ] Test on mobile device

---

## 🔧 Setting Up Dev Environment

### Phase 1: Create Dev Branch
- [ ] Run `git checkout -b dev`
- [ ] Run `git push -u origin dev`

### Phase 2: Duplicate Backend
- [ ] Duplicate Production Google Sheet → name it "A8 Challenge DEV"
- [ ] Open Dev Sheet → Extensions → Apps Script
- [ ] Copy all .gs files from production
- [ ] Deploy as Web App → copy DEV API URL

### Phase 3: Update Config for Dev
- [ ] Create `config.dev.js` with dev API URL
- [ ] OR add comment in `config.js` with both URLs
- [ ] Test locally with dev backend

### Phase 4: Optional - Dev GitHub Pages
- [ ] Settings → Pages → Change to `dev` branch
- [ ] Test at dev URL
- [ ] Change back to `main` for production

---

## 📝 Post-Deployment

### Share with Team
- [ ] Update team with new URL: `https://YOUR_USERNAME.github.io/a8-workout-app/?user=THEIR_NAME`
- [ ] Test with 2-3 beta users first
- [ ] Collect feedback

### Monitor First Week
- [ ] Check Google Apps Script logs daily
- [ ] Watch for errors in execution logs
- [ ] Monitor Completions sheet for data accuracy
- [ ] Ask users for feedback

### Document Everything
- [ ] Add deployed URL to README.md
- [ ] Add production API URL to internal docs
- [ ] Update any team documentation
- [ ] Save backup of production Google Sheet

---

## 🔄 Future Update Workflow

### Small Frontend Updates
- [ ] `git checkout dev`
- [ ] Make changes
- [ ] Test locally: `python3 serve.py`
- [ ] `git add .`
- [ ] `git commit -m "Update X feature"`
- [ ] `git push origin dev`
- [ ] Test on dev (if dev Pages enabled)
- [ ] `git checkout main`
- [ ] `git merge dev`
- [ ] `git push origin main`
- [ ] Verify production deployment

### Backend Updates
- [ ] Update code in /backend folder locally
- [ ] Test in Dev Google Apps Script
- [ ] Test with frontend dev branch
- [ ] Copy to Production Google Apps Script
- [ ] Deploy/Update deployment
- [ ] Test with frontend main branch
- [ ] Merge to main if frontend changes needed

---

## 🚨 Troubleshooting Checklist

### App Not Loading
- [ ] Check config.js has correct API URL
- [ ] Verify API is accessible: test in browser
- [ ] Check browser console for errors
- [ ] Verify Google Apps Script deployment status

### API Errors
- [ ] Check Google Apps Script execution logs
- [ ] Verify deployment access is set to "Anyone"
- [ ] Test API endpoint directly
- [ ] Check for Code.gs syntax errors

### GitHub Pages Not Updating
- [ ] Verify you pushed to correct branch (`main`)
- [ ] Check GitHub Actions tab for build status
- [ ] Wait 2-3 minutes for deployment
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Clear browser cache

### Data Not Saving
- [ ] Check Google Sheets permissions
- [ ] Verify Apps Script has sheet access
- [ ] Check Completions sheet for new rows
- [ ] Review Apps Script execution logs

---

## 📊 Success Metrics

Deployment is successful when:
- [ ] Production URL loads without errors
- [ ] All users can access with their URL
- [ ] Workout logging works
- [ ] AI workout generation works (if enabled)
- [ ] Calendar displays correctly
- [ ] Team progress updates
- [ ] Mobile experience is smooth
- [ ] No console errors
- [ ] Data saves to Google Sheets correctly

---

## 🎯 Quick Commands Reference

```bash
# Initial setup
./cleanup.sh
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_URL
git push -u origin main

# Create dev branch
git checkout -b dev
git push -u origin dev

# Daily dev workflow
git checkout dev
# (make changes)
git add .
git commit -m "message"
git push origin dev

# Deploy to production
git checkout main
git merge dev
git push origin main

# Check status
git status
git branch
git log --oneline
```

---

## 📞 Support Resources

- **GitHub Docs**: https://docs.github.com/en/pages
- **Git Basics**: https://git-scm.com/book/en/v2/Getting-Started-Git-Basics
- **Troubleshooting**: See TESTING_CHECKLIST.md
- **Workflow**: See GITHUB_WORKFLOW.md

---

**Ready?** Start with `./cleanup.sh` then follow this checklist!
