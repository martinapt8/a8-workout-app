# Phase 7: Migration Execution Guide

**Purpose**: Step-by-step guide to execute the multi-challenge migration
**Estimated Time**: 45 minutes - 1 hour
**Risk Level**: Medium (with backups in place)
**Status**: Execution Guide

---

## Pre-Execution Checklist

**STOP AND VERIFY** - Do NOT proceed until all items are checked:

- [ ] **Phase 0 Complete**: Backups created (git commit, Google Sheet copy, CSV exports)
- [ ] **Phase 1 Complete**: All new sheets and columns created in Google Sheet
- [ ] **Phase 2 Complete**: MigrationScripts.gs file added to Apps Script project
- [ ] **Phase 3 Complete**: Code.gs updated with new backend functions
- [ ] **Phase 4 Complete**: index.html updated with frontend changes
- [ ] **Phase 5 Complete**: Past challenge history feature added
- [ ] **Phase 6 Complete**: AdminChallenges.gs and menu.gs updated
- [ ] **All code saved** in Google Apps Script Editor
- [ ] **Current time**: Plan for 1 hour of uninterrupted work
- [ ] **Users notified**: Inform team app will be briefly unavailable

---

## Step-by-Step Execution

### STEP 1: Open Google Apps Script Editor (2 min)

1. **Open your Google Sheet**
2. **Go to**: Extensions → Apps Script
3. **Verify all files are present**:
   - [ ] Code.gs (updated with Phase 3 changes)
   - [ ] ClaudeAPI.gs
   - [ ] FormMigration.gs
   - [ ] Slack.gs
   - [ ] welcome_email.gs
   - [ ] update_email.gs
   - [ ] menu.gs (updated with Phase 6 changes)
   - [ ] MigrationScripts.gs (NEW - Phase 2)
   - [ ] AdminChallenges.gs (NEW - Phase 6)

4. **Save all files**: Ctrl/Cmd+S on each file

---

### STEP 2: Validate Schema (5 min)

**Purpose**: Ensure all required columns exist before migration

1. **In Apps Script Editor**, open **MigrationScripts.gs**
2. **Select function**: `validateSchemaBeforeMigration` from dropdown
3. **Click Run** ▶️
4. **Authorize** if prompted (first time only)
5. **Check Execution Log**: View → Logs (Ctrl/Cmd+Enter)

**Expected Output**:
```
==========================================
✅ SCHEMA VALIDATION PASSED
==========================================
All required sheets and columns exist.
Safe to proceed with migration.
Next step: Run testMigration()
==========================================
```

**If validation FAILS**:
- Review error messages in log
- Go back to Phase 1 and fix missing sheets/columns
- Run validation again

---

### STEP 3: Preview Migration (10 min)

**Purpose**: See what will change WITHOUT modifying data

1. **In Apps Script Editor**, open **MigrationScripts.gs**
2. **Select function**: `testMigration` from dropdown
3. **Click Run** ▶️
4. **Check Execution Log**: View → Logs

**Expected Output Example**:
```
==========================================
MIGRATION PREVIEW
==========================================
📋 Workouts: Will update 17 rows with challenge_id = "daily_dose_oct2025"
📋 Completions: Will update 304 rows
   - 304 assigned to "daily_dose_oct2025"
   - 0 assigned to "year_round" (outside challenge dates)
📋 Users: Will update 29 active users with active_challenge_id = "daily_dose_oct2025"
📋 Challenge_Teams: Will create 29 rows (one per active user)
==========================================
SUMMARY
==========================================
Total operations: 379
If counts look correct, run runFullMigration()
==========================================
```

**Verify Counts Match**:
- [ ] Workouts count matches your Workouts sheet row count
- [ ] Completions count matches your Completions sheet row count
- [ ] Users count matches your active users (active_user = TRUE)
- [ ] No unexpected "year_round" assignments (should be 0 if all workouts are within challenge dates)

**If counts look WRONG**:
- STOP - Do not proceed
- Review logs for errors
- Check that challenge dates in Challenges sheet match your data
- Restore from backup if needed
- Contact support or review Phase 2 code

---

### STEP 4: Execute Migration (15 min)

**Purpose**: Run the actual data migration

⚠️ **POINT OF NO RETURN** - Data will be modified. Backup must be ready.

1. **In Apps Script Editor**, open **MigrationScripts.gs**
2. **Select function**: `runFullMigration` from dropdown
3. **Take a deep breath** 😌
4. **Click Run** ▶️
5. **Monitor Execution Log**: View → Logs

**Expected Output**:
```
==========================================
STARTING FULL MIGRATION
==========================================
Step 1: Backfilling Workouts...
✅ Updated 17 workouts with challenge_id = "daily_dose_oct2025"

Step 2: Backfilling Completions...
✅ Updated 304 completions with challenge_id
   - 304 assigned to "daily_dose_oct2025"
   - 0 assigned to "year_round"

Step 3: Backfilling Users...
✅ Updated 29 users with active_challenge_id = "daily_dose_oct2025"

Step 4: Populating Challenge_Teams...
✅ Added 29 team assignments to Challenge_Teams
==========================================
✅ MIGRATION COMPLETE!
==========================================
Next steps:
1. Verify data in sheets (spot check a few rows)
2. Run cleanupDeprecatedSettingsKeys()
3. Proceed to Phase 3 (update backend functions)
==========================================
```

**If migration FAILS**:
- Check error message in logs
- **DO NOT re-run** migration without investigation
- Run `rollbackMigration()` function to clear partially migrated data
- Restore from backup (see Phase 0)
- Fix the issue
- Start from Step 2 (validate schema) again

---

### STEP 5: Verify Migration (10 min)

**Purpose**: Spot-check data to ensure migration succeeded

#### Check 1: Workouts Sheet
1. **Open Workouts sheet**
2. **Scroll to challenge_id column** (should be column D)
3. **Verify**: All rows have "daily_dose_oct2025" in challenge_id
4. **Check**: Existing workout data is intact (no data loss)

#### Check 2: Completions Sheet
1. **Open Completions sheet**
2. **Scroll to challenge_id column** (should be column F)
3. **Verify**: All rows have either "daily_dose_oct2025" or "year_round"
4. **Check**: Timestamps, user_ids, workout_ids are intact

#### Check 3: Users Sheet
1. **Open Users sheet**
2. **Scroll to active_challenge_id column** (should be last column)
3. **Verify**: Active users have "daily_dose_oct2025"
4. **Check**: Existing user data is intact

#### Check 4: Challenge_Teams Sheet
1. **Open Challenge_Teams sheet**
2. **Count rows**: Should match number of active users + 1 header (e.g., 30 total for 29 users)
3. **Verify**: Each row has challenge_id, user_id, team_name, team_color
4. **Sample check**: Pick a few users and verify their team assignments are correct

**Verification Checklist**:
- [ ] Workouts: All rows have challenge_id filled
- [ ] Completions: All rows have challenge_id filled
- [ ] Users: Active users have active_challenge_id filled
- [ ] Challenge_Teams: Row count matches active users
- [ ] Challenge_Teams: Team assignments are correct
- [ ] No data loss in any sheet

---

### STEP 6: Cleanup Settings Sheet (5 min)

**Purpose**: Remove deprecated challenge keys from Settings sheet

1. **In Apps Script Editor**, open **MigrationScripts.gs**
2. **Select function**: `cleanupDeprecatedSettingsKeys` from dropdown
3. **Click Run** ▶️
4. **Check Execution Log**: View → Logs

**Expected Output**:
```
Found deprecated key: challenge_name (row 2)
Deleted row 2
Found deprecated key: start_date (row 3)
Deleted row 3
Found deprecated key: end_date (row 4)
Deleted row 4
Found deprecated key: total_goal (row 5)
Deleted row 5
✅ Cleaned up 4 deprecated Settings keys
Settings sheet now contains only app-wide settings:
- company_name
- deployed_URL
- timezone
```

#### Verify Settings Sheet
1. **Open Settings sheet**
2. **Verify remaining keys**:
   - [ ] company_name (should exist)
   - [ ] deployed_URL (should exist)
   - [ ] timezone (should exist)
   - [ ] challenge_name (should NOT exist - removed)
   - [ ] start_date (should NOT exist - removed)
   - [ ] end_date (should NOT exist - removed)
   - [ ] total_goal (should NOT exist - removed)

---

### STEP 7: Test Backend Functions (10 min)

**Purpose**: Verify backend code works with migrated data

1. **In Apps Script Editor**, open **Code.gs**
2. **Scroll to end** of file (testing functions should be there)
3. **Select function**: `testGetUserDashboard` from dropdown
4. **Edit function** to use YOUR test user:
   ```javascript
   const result = getUserDashboardData('YOUR_USER_ID_HERE');
   ```
5. **Click Run** ▶️
6. **Check Execution Log**: View → Logs

**Expected Output**:
```javascript
{
  "user": {
    "user_id": "martin",
    "display_name": "🎯 Martin",
    "team_name": "Team Red",
    "team_color": "#FF0000"
  },
  "challenge": {  // ← NOTE: "challenge" not "settings"
    "challenge_id": "daily_dose_oct2025",
    "challenge_name": "The Daily Dose",
    "start_date": "2025-10-01T00:00:00.000Z",
    "end_date": "2025-11-05T23:59:59.999Z",
    "total_goal": 500,
    "is_active": true,
    "status": "active"
  },
  "activeWorkout": { ... },
  "completedToday": false,
  "goalProgress": { ... }
}
```

**Verify**:
- [ ] Response has "challenge" object (NOT "settings")
- [ ] challenge_id is present
- [ ] User data is correct
- [ ] No errors in log

---

### STEP 8: Deploy Updated Code (5 min)

**Purpose**: Make updated code live for users

1. **In Apps Script Editor**: Click **Deploy** button (top right)
2. **Select**: Manage deployments
3. **Click** pencil icon ✏️ next to active deployment
4. **Version**: Select "New version"
5. **Description**: "Multi-challenge migration - Phase 1"
6. **Click**: Deploy
7. **Copy deployment URL** (will be same as before)

**Verify deployment**:
- [ ] Deployment successful
- [ ] URL is same as before (no user impact)
- [ ] Version number incremented

---

### STEP 9: Test Frontend (5 min)

**Purpose**: Verify app loads and displays correctly

1. **Open app in browser**: Use your personalized URL (`?user=YOUR_USER_ID`)
2. **Check Today page**:
   - [ ] Page loads without errors
   - [ ] Challenge name displays correctly
   - [ ] User greeting shows
   - [ ] Workout card displays (if workout scheduled)
   - [ ] Completion status shows

3. **Check Team page**:
   - [ ] Goal progress displays
   - [ ] Team totals show
   - [ ] Recent activity shows

4. **Check Me page**:
   - [ ] Calendar loads
   - [ ] Past challenges section loads (may be empty if this is first challenge)
   - [ ] Backfill button works

5. **Check Library page**:
   - [ ] Workouts display
   - [ ] Can view workout details

6. **Open browser console** (F12 → Console tab):
   - [ ] No red errors
   - [ ] No "userData.settings" is undefined errors

---

### STEP 10: Test Workout Logging (5 min)

**Purpose**: Verify workouts log correctly with challenge_id

1. **In app**, click **"Log Other Workout"**
2. **Log a test workout** (use a distinct description like "MIGRATION TEST")
3. **Check Completions sheet**:
   - [ ] New row added
   - [ ] challenge_id column has "daily_dose_oct2025"
   - [ ] All other data correct

4. **In app**, check **Recent Activity**:
   - [ ] Test workout appears in feed

5. **In app**, check **Me page calendar**:
   - [ ] Today's date has checkmark (if logged today)

---

## Post-Migration Checklist

### Immediate Verification (Complete within 1 hour)
- [ ] All migration steps completed successfully
- [ ] No errors in Apps Script logs
- [ ] Frontend loads without console errors
- [ ] Workout logging works
- [ ] Data integrity spot-checks passed
- [ ] Settings sheet cleaned up
- [ ] Backend tests passed

### Next 24 Hours
- [ ] Monitor for user-reported issues
- [ ] Check Completions sheet for new workouts (should have challenge_id)
- [ ] Test with multiple users
- [ ] Verify team progress updates correctly

### Next Week
- [ ] Plan Phase 8: Comprehensive testing
- [ ] Document any issues encountered
- [ ] Begin planning next challenge (use Admin functions)

---

## Troubleshooting Common Issues

### Issue: "challenge_id column not found"

**Cause**: Phase 1 not completed - column missing

**Solution**:
1. Go back to Phase 1 guide
2. Add missing column
3. Run `validateSchemaBeforeMigration()` again

---

### Issue: "Completions assigned to year_round unexpectedly"

**Cause**: Challenge dates in Challenges sheet don't match completion timestamps

**Solution**:
1. Check challenge dates in Challenges sheet (Row 2)
2. Verify: start_date = 10/1/2025, end_date = 11/5/2025
3. If dates wrong, fix them and run `rollbackMigration()` then re-run migration

---

### Issue: "Frontend shows blank page"

**Cause**: Frontend not updated or old cached version

**Solution**:
1. Hard refresh: Ctrl/Cmd+Shift+R
2. Clear browser cache
3. Verify Phase 4 changes deployed
4. Check console for errors

---

### Issue: "userData.settings is undefined"

**Cause**: Frontend still referencing old API structure

**Solution**:
1. Verify Phase 4 find/replace completed
2. Search index.html for "userData.settings" - should be ZERO matches
3. Redeploy frontend

---

### Issue: "Challenge_Teams has duplicate rows"

**Cause**: Migration run multiple times

**Solution**:
1. Open Challenge_Teams sheet
2. Manually delete duplicate rows
3. Keep only one row per (challenge_id, user_id) pair

---

## Emergency Rollback Procedure

If something goes seriously wrong:

### Option 1: Rollback Migration Data (Partial)

```javascript
// In Apps Script Editor, run this function:
rollbackMigration()
```

This clears migrated data but keeps sheets intact.

### Option 2: Full Restore (Complete)

1. **Stop users** from accessing app
2. **Delete modified sheet**: Delete current Google Sheet
3. **Restore backup**: Open backup Google Sheet copy from Phase 0
4. **Make new copy**: File → Make a copy → Rename to original name
5. **Update Apps Script**: Revert Code.gs and index.html to pre-migration state
6. **Redeploy**: Deploy → Manage deployments → Previous version
7. **Test**: Verify app works
8. **Resume access**: Notify users

---

## Success Criteria

✅ Migration is successful if:
- All verification steps passed
- No data loss
- Frontend loads correctly
- Workouts log with challenge_id
- No console errors
- Team progress displays
- Admin menu functions work

---

## Next Steps

After successful migration:

1. **Proceed to Phase 8**: Run comprehensive testing
2. **Notify team**: App is back online with new features
3. **Monitor**: Watch for issues over next 24-48 hours
4. **Plan next challenge**: Use Admin menu to create future challenges

---

*Last Updated: October 30, 2025*
