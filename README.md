# A8 Workout Challenge App - GitHub Pages Edition

A collective goal-oriented workout tracking web app with GitHub Pages frontend and Google Apps Script API backend.

## Architecture

```
GitHub Pages (Frontend)          Google Apps Script (Backend API)        Google Sheets (Database)
- index.html                  →   - Code.gs (REST API)                →  - Users
- styles.css                      - ClaudeAPI.gs (AI workouts)           - Workouts
- config.js                       - Other .gs files                      - Completions
- api.js                          - Script Properties (secrets)          - Settings
                                                                         - Coaching
```

## 🚀 Deployment Instructions

### Phase 1: Deploy Backend API (One-Time Setup)

1. **Open your Google Apps Script project**
   - Go to your Google Sheet
   - Extensions → Apps Script

2. **Update Code.gs**
   - Replace the contents of `Code.gs` with the new REST API version from this repo
   - Keep all other .gs files unchanged (ClaudeAPI.gs, Slack.gs, etc.)

3. **Deploy as Web App**
   - Click "Deploy" → "New deployment"
   - Settings:
     - **Type**: Web app
     - **Description**: "API Backend" (or whatever you prefer)
     - **Execute as**: Me ([your email])
     - **Who has access**: Anyone
   - Click "Deploy"

4. **Copy the Web App URL**
   - You'll get a URL like: `https://script.google.com/macros/s/ABC123.../exec`
   - **SAVE THIS URL** - You need it for the frontend!
   - **This URL never changes** - you only deploy once!

### Phase 2: Configure Frontend

1. **Update config.js**
   ```javascript
   const CONFIG = {
     API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'
   };
   ```
   - Replace `YOUR_DEPLOYMENT_ID` with the URL from Phase 1

2. **Test locally (optional)**
   - Open `index.html` in your browser
   - Add `?user=yourname` to the URL
   - Check browser console for any errors

### Phase 3: Deploy to GitHub Pages

1. **Initialize Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - GitHub Pages migration"
   ```

2. **Create GitHub Repository**
   - Go to GitHub and create a new repository
   - Name it something like `a8-workout-app`
   - Don't initialize with README (you already have one)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/a8-workout-app.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**
   - Go to your repo on GitHub
   - Settings → Pages
   - Source: Deploy from branch
   - Branch: `main` → `/` (root)
   - Click "Save"

5. **Your App is Live!**
   - GitHub will provide a URL: `https://YOUR_USERNAME.github.io/a8-workout-app/`
   - Add `?user=martin` to access as a specific user
   - Example: `https://YOUR_USERNAME.github.io/a8-workout-app/?user=martin`

### Phase 4: Update User Links

Send your team the new stable URL:
```
https://YOUR_USERNAME.github.io/a8-workout-app/?user=THEIR_NAME
```

**Benefits:**
- ✅ This URL **never changes**
- ✅ Users bookmark once
- ✅ Frontend updates = just `git push` (no new URLs!)
- ✅ No more iframe/banner issues
- ✅ Better mobile experience

## 🔄 Updating the App

### Frontend Updates (Easy!)
```bash
# Make your changes to index.html, styles.css, etc.
git add .
git commit -m "Update workout page UI"
git push

# Changes go live in ~30 seconds!
# User URLs never change!
```

### Backend Updates (Rare)
1. Update .gs files in Google Apps Script
2. Deploy → "Manage deployments"
3. Click ⚙️ → "Edit"
4. Version: "New version"
5. Click "Deploy"
6. URL stays the same - no user impact!

## 📁 File Structure

### Frontend Files (GitHub Pages)
- `index.html` - Main app HTML
- `styles.css` - All styling (includes Roobert fonts)
- `config.js` - API configuration
- `api.js` - API helper functions
- `README.md` - This file

### Backend Files (Google Apps Script)
- `Code.gs` - REST API endpoints
- `ClaudeAPI.gs` - AI workout generation
- `Slack.gs` - Slack notifications
- `welcome_email.gs` - Welcome emails
- `update_email.gs` - Update emails
- `FormMigration.gs` - Form response migration
- `SetupSheets.gs` - Sheet setup utilities
- `menu.gs` - Custom menu

### Not Deployed (Local/Legacy)
- `styles.html` - Original GAS template (now styles.css)
- `CLAUDE.md` - Project documentation
- `.gitignore` - Git ignore rules

## 🔑 Security Notes

### What's Protected ✅
- **Claude API Key**: Stays in Google Apps Script Script Properties (never exposed)
- **Google Sheets Data**: Accessed only via your backend API
- **Script Properties**: All sensitive configs stay server-side

### What's Public ⚠️
- **Frontend Code**: All HTML/CSS/JS is visible (normal for websites)
- **API URL**: Your Google Apps Script URL is visible (but rate-limited and user-validated)

### Recommended Security
1. **Keep API URL in config.js** - Easy to manage, good enough for internal team use
2. **Monitor Apps Script logs** - Watch for suspicious activity
3. **Rate limiting** - Already implemented in backend
4. **User validation** - Backend only works for userIds in Users sheet

## 🛠️ Troubleshooting

### "Failed to load app data"
- Check `config.js` has correct API_URL
- Check browser console for CORS errors
- Verify Google Apps Script deployment is set to "Anyone"

### "User not found"
- Check ?user= parameter matches user_id in Users sheet (case-insensitive)
- Verify spelling in URL

### CORS Errors
- Redeploy Google Apps Script with updated Code.gs
- Verify `Access-Control-Allow-Origin: *` header is set

### Styles not loading
- Check `styles.css` exists in same directory as `index.html`
- Verify link tag in index.html: `<link rel="stylesheet" href="styles.css">`

### AI Workouts not working
- Verify Claude API key is still in Script Properties
- Check ClaudeAPI.gs is deployed with Code.gs
- Check browser console for API errors

## 📊 API Endpoints

### GET Endpoints
- `?action=getDashboard&userId=martin` - Get user dashboard data
- `?action=getGoalProgress` - Get team progress
- `?action=getAllWorkouts` - Get workout library
- `?action=getUserCompletionHistory&userId=martin` - Get completion dates
- `?action=generateAIWorkout&time=15&difficulty=Intermediate&equipment=Bodyweight` - Generate AI workout

### POST Endpoints
- `action=markWorkoutComplete` - Log workout completion
  ```json
  {
    "action": "markWorkoutComplete",
    "userId": "martin",
    "workoutType": "prescribed|other|ai",
    "workoutDetails": "optional description",
    "completionDate": "optional YYYY-MM-DD"
  }
  ```

## 🎯 Next Steps

1. **Test on developer instance first** - Don't touch production!
2. **Verify all features work** - Workouts, AI, calendar, library
3. **Test on mobile** - Primary use case
4. **Update documentation** - Share new URL with team
5. **Monitor first week** - Watch for any issues

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Check Google Apps Script logs (View → Logs)
3. Verify API URL in config.js
4. Review this README's troubleshooting section

---

**Migration Date**: [Add date when you migrate]
**Deployed URL**: [Add your GitHub Pages URL here]
**API URL**: [Add your Google Apps Script URL here]
