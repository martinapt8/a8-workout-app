# Quick Reference Card

## 🌐 Your URLs

**Production App**: https://martinapt8.github.io/a8-workout-app/?user=USERNAME
**GitHub Repo**: https://github.com/martinapt8/a8-workout-app

## 🔧 Daily Commands

```bash
# Start local test server
python3 serve.py
# Then: http://localhost:8000/?user=mritty85

# Make changes (always in dev!)
git checkout dev
# ... edit files ...
git add .
git commit -m "message"
git push origin dev

# Deploy to production
git checkout main
git merge dev
git push origin main
```

## 📁 File Structure

```
Frontend (GitHub Pages):
- index.html, styles.css, api.js, config.js

Backend (Google Apps Script):
- /backend/*.gs files

Docs:
- README.md - Full guide
- DEPLOYMENT_STATUS.md - Current status
- GITHUB_WORKFLOW.md - Dev workflow
```

## 🚨 Troubleshooting

**App not loading?**
- Check config.js has correct API URL
- Test API directly in browser

**Can't push to GitHub?**
- Use personal access token, not password
- Check: git remote -v

**Pages not updating?**
- Wait 2-3 minutes
- Hard refresh: Ctrl+Shift+R

## 📞 Help

- DEPLOYMENT_STATUS.md - Current config
- TESTING_CHECKLIST.md - Full tests
- GITHUB_WORKFLOW.md - Detailed workflow
