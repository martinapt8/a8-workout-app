# Testing Checklist for Migration

## Pre-Deployment Testing

### Backend API Tests (Google Apps Script)

1. **Deploy Backend**
   - [ ] Deploy Code.gs as Web App
   - [ ] Copy deployment URL
   - [ ] Verify "Anyone" access is set

2. **Test API Endpoints Manually**
   Test these URLs in your browser (replace `YOUR_API_URL` with your deployment URL):

   ```
   YOUR_API_URL?action=getDashboard&userId=martin
   YOUR_API_URL?action=getGoalProgress
   YOUR_API_URL?action=getAllWorkouts
   YOUR_API_URL?action=getUserCompletionHistory&userId=martin
   YOUR_API_URL?action=generateAIWorkout&time=15&difficulty=Intermediate&equipment=Bodyweight
   ```

   - [ ] getDashboard returns user data
   - [ ] getGoalProgress returns team totals
   - [ ] getAllWorkouts returns workout list
   - [ ] getUserCompletionHistory returns completion dates
   - [ ] generateAIWorkout returns AI workout (Claude API key must be in Script Properties)

3. **Check CORS Headers**
   - [ ] Open browser dev tools → Network tab
   - [ ] Make API request
   - [ ] Check response headers include `Access-Control-Allow-Origin: *`

### Frontend Tests (Local)

1. **Update config.js**
   - [ ] Add your Google Apps Script URL to config.js

2. **Test Locally**
   - [ ] Open index.html in browser
   - [ ] Add `?user=yourname` to URL
   - [ ] Page loads without errors

3. **Check Browser Console**
   - [ ] No CORS errors
   - [ ] No 404 errors for API calls
   - [ ] Data loads successfully

## Feature Testing

### Today Page (Workout)
- [ ] Today's workout displays correctly
- [ ] Exercise list renders with movements and reps
- [ ] Video links work (if any exercises have links)
- [ ] Instructions display if present
- [ ] "Complete Workout" button works
- [ ] "Log Other Workout" input accepts text
- [ ] Completion status updates after logging
- [ ] Recent Activity feed shows last 10 completions
- [ ] Success animation appears after logging
- [ ] Button states update correctly (disabled after completion)

### Team Progress Page
- [ ] Total goal progress displays
- [ ] Progress bar shows correct percentage
- [ ] Progress bar color changes based on percentage
- [ ] Team totals are correct
- [ ] All teams display even if zero workouts

### Me Page
- [ ] Personal summary shows name, team, total workouts
- [ ] Last workout date displays
- [ ] Calendar renders for current month
- [ ] Completed dates show checkmarks
- [ ] Dates outside challenge range are grayed out
- [ ] Log Past Workout form works
- [ ] Date picker respects min/max dates
- [ ] Prevents logging future dates
- [ ] Prevents duplicate logging for same date
- [ ] Calendar updates after logging past workout

### Library Page
- [ ] All workouts display
- [ ] Past, Current, Upcoming sections are correct
- [ ] Current workout has ⭐ indicator
- [ ] Clicking workout shows detail view
- [ ] Detail view shows all exercises
- [ ] Back buttons (top and bottom) return to list
- [ ] Workouts with invalid dates are skipped

### A8AI Page (AI Workout Generator)
- [ ] Time selection buttons work (10/15/20 min)
- [ ] Difficulty selection buttons work
- [ ] Equipment selection buttons work
- [ ] Generate button triggers API call
- [ ] Loading animation displays with rotating tips
- [ ] AI workout displays with proper markdown formatting
- [ ] Refresh button generates new workout with same params
- [ ] Change Options button returns to selector
- [ ] Log This Workout button works
- [ ] Respects same-day completion rules
- [ ] Parameters stored correctly in Completions sheet

### Navigation
- [ ] All 5 nav tabs work (Today, Team, Me, Library, A8AI)
- [ ] Active tab is highlighted
- [ ] Page switching is smooth
- [ ] No navigation during data refresh

### Error Handling
- [ ] Invalid user parameter shows error message
- [ ] Network errors display helpful message
- [ ] API errors are caught and displayed
- [ ] No uncaught JavaScript errors in console

## Mobile Testing

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Touch targets are large enough
- [ ] Scrolling works smoothly
- [ ] Date picker works on mobile
- [ ] Text inputs work on mobile keyboard
- [ ] Navigation tabs are accessible

## Data Integrity Testing

### Completions Sheet
- [ ] Prescribed workouts log with correct workout_id
- [ ] "Other Workout" logs with "Other Workout" as workout_id
- [ ] AI Workout logs with "AI Workout" as workout_id
- [ ] workout_details column populated correctly
- [ ] Timestamps are correct
- [ ] User_id and team_name are correct

### Users Sheet
- [ ] total_workouts increments correctly
- [ ] last_completed updates to most recent date

## Performance Testing
- [ ] Initial page load is under 3 seconds
- [ ] API calls respond within 2 seconds
- [ ] No memory leaks on page
- [ ] Multiple rapid clicks don't cause issues

## Post-Deployment Testing

### After GitHub Pages Deployment
- [ ] GitHub Pages URL works
- [ ] HTTPS works (GitHub Pages auto-provides)
- [ ] User URLs work with ?user= parameter
- [ ] All features work same as local testing
- [ ] Mobile testing on actual devices
- [ ] Share test link with 2-3 beta testers

### Monitor for First Week
- [ ] Check Google Apps Script execution logs daily
- [ ] Watch for unusual API call patterns
- [ ] Collect user feedback
- [ ] Monitor Completions sheet for data accuracy
- [ ] Check for any error reports

## Rollback Plan

If critical issues found:
1. Update DNS or share old Google Apps Script URL
2. Fix issues on dev instance
3. Redeploy when fixed
4. Users can still access old URL while you fix

---

## Notes

**API Rate Limits:**
- Google Apps Script quotas: https://developers.google.com/apps-script/guides/services/quotas
- Monitor in Google Cloud Console

**Browser Compatibility:**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used (async/await, fetch, arrow functions)
- No IE11 support needed

**What to Log:**
- All API errors
- User IDs accessing the app
- Unusual completion patterns
- Any CORS issues
