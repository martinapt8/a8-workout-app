# File Organization Guide

## ✅ Files to COMMIT to GitHub (Frontend)

### Core App Files
- `index.html` - Main app HTML ✅
- `styles.css` - All styling ✅
- `config.js` - API configuration ✅
- `api.js` - API helper ✅

### Documentation
- `README.md` - Deployment guide ✅
- `CLAUDE.md` - Complete project documentation ✅
- `CHANGELOG.md` - Version history ✅
- `Documentation/` - Additional guides and references ✅

### Development Tools
- `.gitignore` - Git ignore rules ✅
- `deploy.sh` - Deployment script ✅
- `serve.py` - Local test server ✅

## ❌ Files to EXCLUDE from GitHub (Backend/Legacy)

### Google Apps Script Files (Stay in GAS only)
- `Code.gs` - Backend API
- `ClaudeAPI.gs` - AI workouts
- `Slack.gs` - Notifications
- `welcome_email.gs` - Welcome emails
- `update_email.gs` - Update emails
- `FormMigration.gs` - Form migration
- `menu.gs` - Custom menu

**Why exclude?** These files live in Google Apps Script, not GitHub Pages. You can optionally keep them in a separate folder for version control.

### Legacy/Unused Files
- `styles.html` - Old template version (replaced by styles.css)
- `additional-styles.css` - Not sure if needed?

### Assets
- `A8_Logo.png` - May want to keep or move to an `/assets` folder
- `Screenshot 2025-10-17 at 6.11.52 AM.png` - Delete if not needed

### System Files (Already in .gitignore)
- `.DS_Store` - Mac OS file (ignored)

## 📂 Recommended Folder Structure

```
a8-workout-app/
├── index.html
├── styles.css
├── config.js
├── api.js
├── .gitignore
├── README.md
├── QUICK_START.md
├── TESTING_CHECKLIST.md
├── MIGRATION_SUMMARY.md
├── CLAUDE.md
├── deploy.sh
├── serve.py
├── assets/           (optional)
│   └── A8_Logo.png
└── backend/          (optional - for version control only, not deployed)
    ├── Code.gs
    ├── ClaudeAPI.gs
    ├── Slack.gs
    ├── welcome_email.gs
    ├── update_email.gs
    ├── FormMigration.gs
    └── menu.gs
```

## 🔧 Cleanup Actions

### Before Git Init:
1. ✅ Delete or move legacy files
2. ✅ Organize .gs files into `/backend` folder (optional)
3. ✅ Move images to `/assets` folder (optional)
4. ✅ Delete screenshots if not needed
5. ✅ Review .gitignore

### After Git Init:
- `.DS_Store` will be ignored
- Only frontend files will be pushed
- Backend files can be in a separate folder for reference
