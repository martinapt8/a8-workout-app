# Phase 4: Frontend Changes

**Purpose**: Update index.html to use new `challenge` object instead of `settings`
**File**: index.html
**Estimated Time**: 30-45 minutes
**Status**: Implementation Guide

---

## Overview

The backend now returns `userData.challenge` instead of `userData.settings` for challenge-specific data. This requires updating all references in the frontend.

**Key Changes**:
- `userData.settings` → `userData.challenge`
- Add null checks for off-season mode
- Handle "No active challenge" state gracefully

---

## SECTION 1: Global Find & Replace

### Step 1: Update Property References

**FIND:**
```javascript
userData.settings.challenge_name
```

**REPLACE WITH:**
```javascript
userData.challenge.challenge_name
```

---

**FIND:**
```javascript
userData.settings.start_date
```

**REPLACE WITH:**
```javascript
userData.challenge.start_date
```

---

**FIND:**
```javascript
userData.settings.end_date
```

**REPLACE WITH:**
```javascript
userData.challenge.end_date
```

---

**FIND:**
```javascript
userData.settings.total_goal
```

**REPLACE WITH:**
```javascript
userData.challenge.total_goal
```

---

### Step 2: Update Null Checks

**FIND (Line ~626):**
```javascript
if (userData.settings) {
```

**REPLACE WITH:**
```javascript
if (userData.challenge) {
```

---

**FIND (Line ~731):**
```javascript
if (!userData || !userData.settings) return;
```

**REPLACE WITH:**
```javascript
if (!userData || !userData.challenge) return;
```

---

**FIND (Line ~1075):**
```javascript
if (userData && userData.settings && userData.settings.start_date) {
```

**REPLACE WITH:**
```javascript
if (userData && userData.challenge && userData.challenge.start_date) {
```

---

## SECTION 2: Add Off-Season Handling

### Update `loadUserData()` Function

**Location**: Search for `function loadUserData()`

**FIND (inside withSuccessHandler):**
```javascript
google.script.run
    .withSuccessHandler(function(data) {
        hideLoadingScreen();
        userData = data;
        updateUI();
    })
```

**REPLACE WITH:**
```javascript
google.script.run
    .withSuccessHandler(function(data) {
        hideLoadingScreen();

        // Handle no active challenge (off-season mode)
        if (data.error && data.error === 'No active challenge') {
            showOffSeasonMode(data);
            return;
        }

        userData = data;
        updateUI();
    })
```

---

### Add `showOffSeasonMode()` Function

**Location**: Add this function AFTER `loadUserData()` function

```javascript
/**
 * Display off-season mode when no active challenge
 */
function showOffSeasonMode(data) {
    // Update challenge title
    document.getElementById('challenge-title').textContent = 'Off-Season';

    // Update user greeting
    if (data.user) {
        document.getElementById('user-greeting').textContent = `Hey ${data.user.display_name}!`;
    }

    // Show off-season message
    document.getElementById('completion-status').innerHTML =
        `<div style="padding: 20px; background: #FFF3CD; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-weight: 500;">🌴 Off-Season Mode</p>
            <p style="margin: 10px 0 0 0; color: #856404; font-size: 14px;">${data.message}</p>
        </div>`;

    // Hide workout card (no prescribed workout available)
    const workoutCard = document.getElementById('workout-card');
    if (workoutCard) {
        workoutCard.style.display = 'none';
    }

    // Show "Log Other Workout" button (users can still track workouts)
    const logOtherBtn = document.getElementById('log-other-workout-btn');
    if (logOtherBtn) {
        logOtherBtn.style.display = 'block';
        logOtherBtn.textContent = 'Log Workout (Year-Round)';
    }

    // Hide Team page content or show off-season message
    const goalSection = document.getElementById('goal-section');
    if (goalSection) {
        goalSection.innerHTML =
            `<div style="text-align: center; padding: 40px 20px;">
                <h3 style="color: #6B7280;">No Active Challenge</h3>
                <p style="color: #9CA3AF;">Join us for the next challenge!</p>
            </div>`;
    }

    // Hide Library page or show message
    const libraryContent = document.getElementById('library-content');
    if (libraryContent) {
        libraryContent.innerHTML =
            `<div style="text-align: center; padding: 40px 20px;">
                <h3 style="color: #6B7280;">No Workouts Available</h3>
                <p style="color: #9CA3AF;">Workouts will appear when a challenge is active.</p>
            </div>`;
    }

    // Store off-season state
    userData = data;
}
```

---

## SECTION 3: Update `updateMePage()` Function

**Location**: Search for `function updateMePage()`

**FIND (calendar date range logic around line ~734):**
```javascript
const startDate = new Date(userData.settings.start_date);
const endDate = new Date(userData.settings.end_date);
```

**REPLACE WITH:**
```javascript
// Handle off-season: show current month
if (!userData.challenge) {
    const today = new Date();
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
} else {
    startDate = new Date(userData.challenge.start_date);
    endDate = new Date(userData.challenge.end_date);
}
```

---

## SECTION 4: Update Team Page Challenge Name

**Location**: Search for `updateTeamPage` function

**FIND (around line ~1077):**
```javascript
document.getElementById('goal-challenge-title').textContent =
    userData.settings.challenge_name;
```

**REPLACE WITH:**
```javascript
document.getElementById('goal-challenge-title').textContent =
    userData.challenge ? userData.challenge.challenge_name : 'Challenge';
```

**FIND (around line ~627):**
```javascript
document.getElementById('progress-challenge-name').textContent =
    userData.settings.challenge_name || 'Challenge';
```

**REPLACE WITH:**
```javascript
document.getElementById('progress-challenge-name').textContent =
    userData.challenge ? userData.challenge.challenge_name : 'Challenge';
```

---

## SECTION 5: Update Workout Completion Date Validation

**Location**: Search for `showBackfillModal` function (around line ~1015)

**UPDATE date validation logic:**

**FIND:**
```javascript
if (userData && userData.settings && userData.settings.start_date) {
    const challengeStart = new Date(userData.settings.start_date);
```

**REPLACE WITH:**
```javascript
if (userData && userData.challenge && userData.challenge.start_date) {
    const challengeStart = new Date(userData.challenge.start_date);
```

**FIND:**
```javascript
const challengeEnd = new Date(userData.settings.end_date);
```

**REPLACE WITH:**
```javascript
const challengeEnd = new Date(userData.challenge.end_date);
```

---

## SECTION 6: Verify No Remaining References

After making all changes, search for any remaining references:

**Search for:**
```
userData.settings
```

**Expected Result**: Should find ZERO matches

If you find any remaining matches, update them using the pattern:
- `userData.settings.X` → `userData.challenge.X`
- Add null check: `if (userData.challenge) { ... }`

---

## SECTION 7: Testing Checklist

After making all changes:

### Test with Active Challenge:
- [ ] Dashboard loads
- [ ] Challenge name displays correctly on Today page
- [ ] Challenge name displays correctly on Team page
- [ ] Me page calendar shows correct date range
- [ ] Backfill date picker has correct min/max dates
- [ ] No console errors

### Test Off-Season Mode (Manual):
1. **In Google Sheets**: Go to Challenges sheet
2. **Set is_active = FALSE** for all challenges
3. **Reload app**
4. **Verify**:
   - [ ] "Off-Season" title displays
   - [ ] Off-season message appears
   - [ ] Workout card is hidden
   - [ ] "Log Workout (Year-Round)" button visible
   - [ ] Team page shows "No Active Challenge" message
   - [ ] Library page shows "No Workouts Available" message
   - [ ] No console errors

5. **Re-activate challenge** (set is_active = TRUE)
6. **Reload and verify** normal behavior returns

---

## IMPLEMENTATION STEPS

### Step-by-Step Process:

1. **Open index.html** in your code editor
2. **Use Find & Replace** (Ctrl/Cmd+H) to make global changes from Section 1
3. **Update loadUserData()** function (Section 2)
4. **Add showOffSeasonMode()** function (Section 2)
5. **Update updateMePage()** function (Section 3)
6. **Update Team page references** (Section 4)
7. **Update backfill validation** (Section 5)
8. **Search for "userData.settings"** - verify ZERO matches (Section 6)
9. **Save index.html**
10. **Deploy to Google Apps Script** (or test locally if using GitHub Pages)
11. **Run Test Checklist** (Section 7)

---

## Common Issues & Solutions

### Issue: "userData.challenge is undefined"

**Cause**: Backend not updated yet or migration not run

**Solution**:
1. Verify Phase 3 backend changes are deployed
2. Run migration scripts (Phase 7)
3. Clear browser cache and reload

---

### Issue: Off-season mode not displaying

**Cause**: Condition check not matching backend response

**Solution**:
1. Check browser console for errors
2. Verify backend returns `error: 'No active challenge'`
3. Check `showOffSeasonMode()` function is called

---

### Issue: Calendar showing wrong dates in off-season

**Cause**: Missing null check in updateMePage()

**Solution**:
- Verify Section 3 changes are applied
- Should show current month when `userData.challenge` is null

---

## Rollback

If frontend breaks:

1. **Revert index.html**:
   ```bash
   git checkout HEAD~1 index.html
   ```

2. **Or manually revert**:
   - `userData.challenge` → `userData.settings`
   - Remove `showOffSeasonMode()` function
   - Remove off-season check in `loadUserData()`

---

## Deployment Notes

- **Google Apps Script**: Paste updated index.html into Apps Script editor
- **GitHub Pages**: Commit and push to main branch
- **Test before announcement**: Verify with multiple users

---

*Last Updated: October 30, 2025*
