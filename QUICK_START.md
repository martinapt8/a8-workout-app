# Quick Start Guide

## What Just Happened?

Your A8 Workout Challenge app has been migrated from a Google Apps Script web app to a **hybrid architecture**:

- **Frontend**: GitHub Pages (proper HTML, no iframe!)
- **Backend**: Google Apps Script (REST API)
- **Database**: Google Sheets (unchanged)

## What Changed?

### ✅ Benefits You Get
1. **Stable URLs** - User links never change when you update the frontend
2. **Better UX** - No more Google iframe banner, full control over appearance
3. **Easy Updates** - Just `git push` to deploy frontend changes
4. **Professional Hosting** - GitHub Pages with free HTTPS
5. **Version Control** - Full git history of all changes

### 🔐 What Stayed Safe
- **Claude API Key**: Still in Google Apps Script Script Properties
- **Google Sheets Access**: Still controlled by your Google account
- **User Data**: No changes to data structure

## Files Modified

### New Files
- ✅ `api.js` - API helper for fetch calls
- ✅ `config.js` - API URL configuration
- ✅ `styles.css` - Extracted from styles.html
- ✅ `.gitignore` - Git ignore rules
- ✅ `README.md` - Full deployment guide
- ✅ `TESTING_CHECKLIST.md` - Testing guide
- ✅ `QUICK_START.md` - This file

### Modified Files
- ✏️ `Code.gs` - Now a REST API (doGet/doPost)
- ✏️ `index.html` - Uses fetch() instead of google.script.run
- ⚠️ `styles.html` - Legacy file (use styles.css instead)

### Unchanged Files
- ✅ `ClaudeAPI.gs` - Still works the same
- ✅ `Slack.gs`, `welcome_email.gs`, `update_email.gs` - No changes
- ✅ All other .gs files - No changes needed

## Next Steps

### Immediate Actions (Do These Now)

1. **Update config.js**
   ```javascript
   // Replace YOUR_GOOGLE_APPS_SCRIPT_URL_HERE with your actual URL
   const CONFIG = {
     API_URL: 'https://script.google.com/macros/s/ABC123.../exec'
   };
   ```

2. **Test Locally First**
   - Open `index.html` in your browser
   - Add `?user=yourname` to the URL
   - Verify everything works

3. **Check Browser Console**
   - Look for any errors (red text)
   - Verify API calls succeed (green 200 responses)

### Deployment Actions (After Testing)

4. **Deploy to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - GitHub Pages migration"
   git remote add origin https://github.com/YOUR_USERNAME/a8-workout-app.git
   git push -u origin main
   ```

5. **Enable GitHub Pages**
   - Repo Settings → Pages
   - Source: main branch
   - Save

6. **Share New URL**
   - Send team: `https://YOUR_USERNAME.github.io/a8-workout-app/?user=THEIR_NAME`

## Testing Priorities

### Must Test Before Deployment
1. ✅ Complete a prescribed workout
2. ✅ Log an "other" workout
3. ✅ Generate an AI workout
4. ✅ Check Me page calendar
5. ✅ View workout library
6. ✅ Test on mobile device

### Nice to Test
7. Log past workout
8. Team progress calculations
9. Recent activity feed
10. All navigation tabs

## Troubleshooting Quick Fixes

### Problem: "Failed to load app data"
**Fix**: Check `config.js` has your actual Google Apps Script URL

### Problem: CORS errors in console
**Fix**: Redeploy Code.gs with the new doGet/doPost functions

### Problem: AI workouts don't work
**Fix**: Verify Claude API key is in Script Properties (not config.js!)

### Problem: Styles look broken
**Fix**: Check `styles.css` exists in same folder as `index.html`

### Problem: User not found
**Fix**: Check ?user= parameter matches user_id in Users sheet

## Key Differences from Old Version

### Old Way (Google Apps Script Web App)
```
User opens: https://script.google.com/...123.../exec?user=martin
  ↓
Google loads HTML via doGet()
  ↓
Template injects server data
  ↓
Page displays in iframe with Google banner
```
**Problem**: New deployment = new URL = email everyone

### New Way (GitHub Pages + API)
```
User opens: https://yourname.github.io/app/?user=martin
  ↓
Browser loads index.html
  ↓
JavaScript fetches data from API
  ↓
Page displays as proper website
```
**Benefit**: Update frontend = just git push = URLs never change!

## Important Notes

### When to Redeploy Backend
- **Frontend changes**: Never! Just `git push`
- **Backend .gs changes**: Rarely, and URL stays same

### What Users See
- **URL changes**: No - stable GitHub Pages URL
- **Experience changes**: Yes - better UX, no iframe
- **Data changes**: No - same workout tracking

### Security Reminders
- **config.js**: Contains API URL (public, that's OK)
- **Script Properties**: Contains Claude key (private, stays safe)
- **GitHub repo**: Can be public (no secrets in frontend)

## Quick Command Reference

```bash
# Test locally
open index.html  # Mac
start index.html # Windows

# Deploy to GitHub
git add .
git commit -m "Update workout page"
git push

# Check status
git status

# View changes
git diff

# Undo local changes
git checkout -- index.html
```

## Support Resources

1. **Full README**: See `README.md` for detailed instructions
2. **Testing Guide**: See `TESTING_CHECKLIST.md` for complete tests
3. **API Docs**: Scroll to "API Endpoints" section in README
4. **Error Logs**: Google Apps Script → View → Logs

## Success Criteria

You'll know it's working when:
- ✅ Page loads with no errors
- ✅ User data displays correctly
- ✅ Workouts can be logged
- ✅ URL stays stable after updates
- ✅ No Google iframe/banner
- ✅ Mobile experience is smooth

---

**Ready to deploy?** Follow README.md → "Deployment Instructions"

**Need help?** Check TESTING_CHECKLIST.md for detailed testing steps
