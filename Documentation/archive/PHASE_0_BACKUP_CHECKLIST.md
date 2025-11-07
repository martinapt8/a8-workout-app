# Phase 0: Pre-Flight Safety Checklist

**Date Started**: October 30, 2025
**Purpose**: Create comprehensive backups before multi-challenge migration
**Risk Level**: Medium
**Estimated Time**: 30 minutes

---

## 1. Git Backup ✅ COMPLETED

- [x] Git commit created: `17e70d4`
- [x] Commit message: "docs: Pre-migration backup commit"
- [x] All changes staged and committed

**Rollback Command** (if needed):
```bash
git reset --hard 17e70d4
```

---

## 2. Google Sheet Backup (MANUAL STEP REQUIRED)

### Instructions:

1. **Open your Daily Dose Google Sheet**
   - Navigate to the production spreadsheet

2. **Create a full copy**:
   - File → Make a copy
   - Name: `Daily Dose BACKUP - Pre-Migration - Oct 30 2025`
   - Save to same folder as original
   - ⚠️ **IMPORTANT**: Keep this copy untouched until migration is verified successful

3. **Verify all sheets copied**:
   - [ ] Users sheet
   - [ ] Workouts sheet
   - [ ] Completions sheet
   - [ ] Settings sheet
   - [ ] Coaching sheet
   - [ ] Form_Responses sheet (if exists)

---

## 3. Export CSV Backups (MANUAL STEP REQUIRED)

### Instructions:

For each sheet, export to CSV:

1. **Users sheet**:
   - Click on Users tab
   - File → Download → Comma Separated Values (.csv)
   - Save as: `Users_backup_2025-10-30.csv`
   - Location: `SampleData/backups/` (create folder if needed)

2. **Workouts sheet**:
   - File → Download → CSV
   - Save as: `Workouts_backup_2025-10-30.csv`

3. **Completions sheet**:
   - File → Download → CSV
   - Save as: `Completions_backup_2025-10-30.csv`

4. **Settings sheet**:
   - File → Download → CSV
   - Save as: `Settings_backup_2025-10-30.csv`

5. **Coaching sheet**:
   - File → Download → CSV
   - Save as: `Coaching_backup_2025-10-30.csv`

### Verification:
- [ ] All 5 CSV files downloaded
- [ ] Files have data (not empty)
- [ ] Saved in `/SampleData/backups/` folder

---

## 4. Document Current API Response Structure

### Current `getUserDashboardData()` Response:

```javascript
{
  user: {
    user_id: "megan",
    display_name: "🎯 Megan",
    team_name: "You Can't Lift With Us",
    team_color: "#FF006E"
  },
  settings: {  // ← THIS WILL CHANGE TO "challenge"
    challenge_name: "The Daily Dose",
    start_date: Date(10/1/2025),
    end_date: Date(11/5/2025),
    total_goal: 500,
    company_name: "A8",
    timezone: "America/New_York"
  },
  activeWorkout: { ... },
  completedToday: boolean,
  goalProgress: { ... }
}
```

### After Migration:

```javascript
{
  user: { ... }, // unchanged
  challenge: {  // ← RENAMED FROM "settings"
    challenge_id: "daily_dose_oct2025",
    challenge_name: "The Daily Dose",
    start_date: Date(10/1/2025),
    end_date: Date(11/5/2025),
    total_goal: 500,
    is_active: true,
    status: "active"
  },
  activeWorkout: { ... },
  completedToday: boolean,
  goalProgress: { ... }
}
```

**Breaking Changes**:
- `userData.settings` → `userData.challenge`
- Added fields: `challenge_id`, `is_active`, `status`
- Removed fields: `company_name`, `timezone` (moved to global settings)

---

## 5. Create Backup Folder Structure

```bash
mkdir -p SampleData/backups
```

- [ ] Folder created
- [ ] Added to .gitignore (already done)

---

## 6. Test Current Production State

### Before Migration - Production Health Check:

1. **Test Dashboard Loading**:
   - Open app with `?user=<your_test_user>`
   - Verify: Today page loads
   - Verify: Challenge name displays correctly
   - Verify: Team page shows progress
   - Verify: Me page calendar loads

2. **Test Workout Logging**:
   - Log a test "Other Workout"
   - Verify: Appears in Completions sheet
   - Verify: Goal progress updates
   - Verify: Recent activity shows new workout

3. **Document Current State**:
   - Total completions: _______ (check Completions sheet row count)
   - Active users: _______ (check Users sheet active_user=TRUE count)
   - Current challenge dates: 10/1/2025 - 11/5/2025
   - Current goal: 500 workouts

---

## 7. Pre-Migration Checklist

Before proceeding to Phase 1:

- [ ] Git backup created (commit 17e70d4)
- [ ] Google Sheet copied (name: "Daily Dose BACKUP - Pre-Migration - Oct 30 2025")
- [ ] 5 CSV files exported to `SampleData/backups/`
- [ ] Current API response structure documented above
- [ ] Backup folder created and in .gitignore
- [ ] Production health check completed
- [ ] Current state metrics documented

---

## Rollback Procedures

### If Migration Fails - Full Rollback:

1. **Restore Google Sheet**:
   - Delete modified production sheet
   - Make a copy of "Daily Dose BACKUP - Pre-Migration - Oct 30 2025"
   - Rename copy to original name
   - Update Apps Script web app to point to restored sheet

2. **Restore Code**:
   ```bash
   git reset --hard 17e70d4
   git push --force
   ```

3. **Redeploy Apps Script**:
   - Open Apps Script editor
   - Deploy → Manage deployments
   - Restore previous version
   - OR: Copy code from git commit 17e70d4

4. **Verify Rollback**:
   - Test dashboard loading
   - Test workout logging
   - Check data integrity

---

## Notes

- **Backup Location**: All backups stored in `SampleData/backups/` (excluded from git)
- **Google Sheet Backup**: Keep for 30 days after successful migration
- **CSV Backups**: Keep permanently for compliance/analytics
- **Git Backup**: Permanent in version control

---

## Ready to Proceed?

Once all checklist items are complete:
1. Mark Phase 0 as complete in todo list
2. Proceed to Phase 1: Create New Sheets

**STOP**: Do not proceed until all backups are verified!

---

*Last Updated: October 30, 2025*
