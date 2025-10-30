# Testing Functions Guide

**Purpose**: How to use the testing functions after migration
**File**: backend/TestingFunctions.gs
**When to Use**: After completing Phase 7 migration

---

## Quick Setup

### Option 1: Add to Code.gs (Recommended)
1. Open `backend/TestingFunctions.gs` (in this repo)
2. Copy ALL contents
3. Open Google Apps Script Editor
4. Open `Code.gs`
5. Scroll to the very end
6. Paste the testing functions
7. Save (Ctrl/Cmd+S)

### Option 2: Create Separate File
1. Open Google Apps Script Editor
2. Click "+" next to Files
3. Choose "Script"
4. Name it: `TestingFunctions`
5. Copy contents from `backend/TestingFunctions.gs`
6. Paste and save

---

## Before Running Tests

### Update Test User ID
All test functions use a placeholder user ID. **You must change this**:

**Find this line in EACH test function**:
```javascript
const TEST_USER_ID = 'martin'; // ← CHANGE THIS to your user_id
```

**Replace with YOUR user_id** from Users sheet:
```javascript
const TEST_USER_ID = 'youruserid'; // e.g., 'megan', 'alex', 'suzied'
```

---

## Available Test Functions

### 1. `testGetUserDashboard()`
**Purpose**: Test the main dashboard API

**What it checks**:
- ✅ Returns "challenge" object (not "settings")
- ✅ Challenge has correct structure
- ✅ User data present
- ✅ Active workout field exists
- ✅ Completion status works
- ✅ Goal progress displays

**How to run**:
1. Apps Script Editor → Select `testGetUserDashboard` from dropdown
2. Click Run ▶️
3. View → Logs (or Ctrl/Cmd+Enter)

**Expected output**:
```
==========================================
Testing getUserDashboardData()
==========================================
User ID: youruserid

📊 RESULT:
{
  "user": {...},
  "challenge": {  ← Should be "challenge" not "settings"
    "challenge_id": "daily_dose_oct2025",
    "challenge_name": "The Daily Dose",
    ...
  },
  ...
}

✅ VERIFICATION:
✅ Has "challenge" object (correct API structure)
   Challenge ID: daily_dose_oct2025
   Challenge Name: The Daily Dose
✅ User object present
✅ Active workout field present
✅ completedToday field present
✅ Goal progress present

==========================================
TEST COMPLETE
==========================================
```

**If you see errors**:
- ❌ "Has 'settings' object" → Phase 3 backend changes not applied correctly
- ❌ "No challenge or settings object" → Check if getActiveChallenge() function exists

---

### 2. `testOffSeasonMode()`
**Purpose**: Test off-season (no active challenge) handling

**What it checks**:
- ✅ Detects when no challenge is active
- ✅ Returns appropriate error message
- ✅ Returns null for challenge object

**How to run**:
1. **First**: Go to Challenges sheet → Set ALL `is_active` to FALSE
2. Apps Script Editor → Select `testOffSeasonMode` from dropdown
3. Click Run ▶️
4. View logs

**Expected output**:
```
==========================================
Testing Off-Season Mode
==========================================
✅ OFF-SEASON MODE ACTIVE (no active challenge)

Testing getUserDashboardData in off-season...

📊 RESULT:
{
  "error": "No active challenge",
  "message": "The app is currently in off-season...",
  "challenge": null
}

✅ VERIFICATION:
✅ Correct error message returned
✅ Off-season message present
✅ challenge is null (correct)

==========================================
TEST COMPLETE
==========================================
```

**After testing**:
- Go back to Challenges sheet
- Set your active challenge `is_active = TRUE`

---

### 3. `testGetUserAllChallengeStats()`
**Purpose**: Test past challenge history feature

**What it checks**:
- ✅ Retrieves user's past challenges
- ✅ Shows workout counts per challenge
- ✅ Includes team assignments
- ✅ Includes challenge dates

**How to run**:
1. Select `testGetUserAllChallengeStats` from dropdown
2. Click Run ▶️
3. View logs

**Expected output**:
```
==========================================
Testing getUserAllChallengeStats()
==========================================
User ID: youruserid

📊 PAST CHALLENGE STATS:

1. The Daily Dose
   Challenge ID: daily_dose_oct2025
   Workouts: 15
   Team: Team Red
   Dates: 10/1/2025 to 11/5/2025

==========================================
TEST COMPLETE
==========================================
```

---

### 4. `testChallengeIdFiltering()`
**Purpose**: Verify migration added challenge_id correctly

**What it checks**:
- ✅ challenge_id column exists in Completions
- ✅ challenge_id column exists in Workouts
- ✅ All rows have challenge_id assigned
- ✅ No NULL values

**How to run**:
1. Select `testChallengeIdFiltering` from dropdown
2. Click Run ▶️
3. View logs

**Expected output**:
```
==========================================
Testing challenge_id Filtering
==========================================
✅ challenge_id column found in Completions (column 6)

📊 COMPLETIONS BY CHALLENGE:
   daily_dose_oct2025: 304 workouts

✅ All completions have challenge_id assigned

✅ challenge_id column found in Workouts (column 4)
   ✅ All workouts have challenge_id assigned

==========================================
TEST COMPLETE
==========================================
```

**If you see warnings**:
- ⚠️ "completions have NULL challenge_id" → Migration didn't complete
- ⚠️ "workouts have NULL challenge_id" → Migration didn't complete
- **Action**: Run `runFullMigration()` again or check for errors

---

### 5. `testGetGoalProgress()`
**Purpose**: Test goal progress calculation with filtering

**What it checks**:
- ✅ Total completions accurate
- ✅ Team totals correct
- ✅ Recent activity shows
- ✅ Filtered by challenge_id

**How to run**:
1. Select `testGetGoalProgress` from dropdown
2. Click Run ▶️
3. View logs

**Expected output**:
```
==========================================
Testing getGoalProgress()
==========================================
Active Challenge: The Daily Dose
Challenge ID: daily_dose_oct2025

📊 GOAL PROGRESS:
Total Completions: 304
Goal: 500
Percentage: 61%

👥 TEAM TOTALS:
   Team Red: 50
   Team Blue: 45
   ...

📝 RECENT ACTIVITY:
   1. Megan logged a workout - 10/30/2025
   2. Alex completed prescribed workout - 10/30/2025
   ...

==========================================
TEST COMPLETE
==========================================
```

---

### 6. `testAll()`
**Purpose**: Run ALL tests in sequence

**What it does**:
- Runs all 4 tests above
- Provides comprehensive verification
- Takes ~30 seconds

**How to run**:
1. Select `testAll` from dropdown
2. Click Run ▶️
3. View logs (will be long)

**Use when**:
- After migration completes
- Before deploying to production
- To verify everything works

---

## Troubleshooting

### Error: "ReferenceError: getActiveChallenge is not defined"
**Cause**: Phase 3 backend changes not applied

**Solution**:
1. Check if `getActiveChallenge()` function exists in Code.gs
2. Follow PHASE_3_BACKEND_CHANGES.md to add missing functions
3. Save Code.gs
4. Run test again

---

### Error: "ReferenceError: getUserAllChallengeStats is not defined"
**Cause**: Phase 3 backend changes not complete

**Solution**:
1. Check if `getUserAllChallengeStats()` function exists in Code.gs
2. Add function from PHASE_3_BACKEND_CHANGES.md Section 1
3. Save and retry

---

### Test shows "settings" instead of "challenge"
**Cause**: Phase 3 backend changes not applied correctly

**Solution**:
1. Open Code.gs
2. Find `getUserDashboardData()` function
3. Verify it returns `challenge: activeChallenge` (not `settings: settings`)
4. Follow Phase 3 guide Section 2.1 exactly
5. Save and test again

---

### All tests pass but frontend still broken
**Cause**: Frontend (index.html) not updated yet

**Solution**:
- Backend tests passing = backend migration successful ✅
- Continue to Phase 8 Step 9: Test Frontend
- Apply Phase 4 frontend changes if not done yet

---

## Success Criteria

**Backend migration is successful if**:
- ✅ `testGetUserDashboard()` returns "challenge" object
- ✅ `testChallengeIdFiltering()` shows no NULL values
- ✅ `testGetGoalProgress()` returns accurate counts
- ✅ `testGetUserAllChallengeStats()` shows past challenges
- ✅ No errors in any test

**If all pass**: Continue to Phase 7 Step 8 (Deploy Updated Code)

---

## Next Steps After Tests Pass

1. **Deploy code**: Phase 7 Step 8
2. **Test frontend**: Phase 7 Step 9
3. **Test workout logging**: Phase 7 Step 10
4. **Comprehensive testing**: Phase 8

---

*Last Updated: October 30, 2025*
