# Phase 1: Sheet Creation Guide

**Purpose**: Create new sheets and add columns for multi-challenge architecture
**Estimated Time**: 30 minutes
**Requires**: Google Sheet write access

---

## Part A: Create New Sheets

### 1. Create "Challenges" Sheet

1. **In your Google Sheet**:
   - Click the "+" icon at bottom left to add new sheet
   - Rename to: `Challenges`

2. **Add Headers (Row 1)**:
   ```
   A: challenge_id
   B: challenge_name
   C: start_date
   D: end_date
   E: total_goal
   F: is_active
   G: status
   ```

3. **Format Headers**:
   - Select Row 1
   - Bold text
   - Background color: Light gray
   - Freeze Row 1: View → Freeze → 1 row

4. **Add Initial Data (Row 2)**:
   | A | B | C | D | E | F | G |
   |---|---|---|---|---|---|---|
   | daily_dose_oct2025 | The Daily Dose | 10/1/2025 | 11/5/2025 | 500 | TRUE | active |

5. **Format Dates**:
   - Select columns C-D
   - Format → Number → Date

6. **Format Boolean**:
   - Select column F
   - Format → Number → Automatic
   - Verify TRUE displays (not "TRUE" as text)

**Verification**:
- [ ] Sheet named "Challenges"
- [ ] 7 columns with correct headers
- [ ] Row 2 contains daily_dose_oct2025 data
- [ ] Dates formatted as dates (not text)
- [ ] is_active shows TRUE (boolean)

---

### 2. Create "Challenge_Teams" Sheet

1. **Add New Sheet**:
   - Click "+" icon
   - Rename to: `Challenge_Teams`

2. **Add Headers (Row 1)**:
   ```
   A: challenge_id
   B: user_id
   C: team_name
   D: team_color
   ```

3. **Format Headers**:
   - Select Row 1
   - Bold text
   - Background color: Light gray
   - Freeze Row 1

4. **Leave Data Rows Empty**:
   - Rows 2+ will be populated by migration script
   - Do NOT manually add data yet

**Verification**:
- [ ] Sheet named "Challenge_Teams"
- [ ] 4 columns with correct headers
- [ ] No data rows yet (will be added by script)

---

## Part B: Add Columns to Existing Sheets

### 3. Add "challenge_id" to Workouts Sheet

1. **Open Workouts sheet**
2. **Find "end_date" column** (should be column C)
3. **Insert column after end_date**:
   - Right-click column D header
   - Insert 1 column left
   - New column D header: `challenge_id`

4. **Verify Column Order**:
   ```
   A: workout_id
   B: start_date
   C: end_date
   D: challenge_id  ← NEW
   E: workout_name
   F: instructions
   ...
   ```

5. **Leave Data Empty**:
   - Migration script will backfill
   - Do NOT manually add data

**Verification**:
- [ ] Workouts sheet has new "challenge_id" column after end_date
- [ ] Column is empty (no data yet)
- [ ] Existing workout data intact

---

### 4. Add "challenge_id" to Completions Sheet

1. **Open Completions sheet**
2. **Find last column with data** (should be "other_workout_details" in column E)
3. **Add new column F**:
   - Click column F header
   - Type: `challenge_id`

4. **Verify Column Order**:
   ```
   A: timestamp
   B: user_id
   C: workout_id
   D: team_name
   E: other_workout_details
   F: challenge_id  ← NEW
   ```

5. **Leave Data Empty**:
   - Migration script will backfill
   - Do NOT manually add data

**Verification**:
- [ ] Completions sheet has new "challenge_id" column (column F)
- [ ] Column is empty (no data yet)
- [ ] Existing completion data intact (304 rows as of Oct 28)

---

### 5. Add "active_challenge_id" to Users Sheet

1. **Open Users sheet**
2. **Find last column** (should be "update_email_sent")
3. **Add new column after update_email_sent**:
   - Click on the next empty column header
   - Type: `active_challenge_id`

4. **Verify Column Order** (last few columns):
   ```
   ...
   K: welcome_email_sent
   L: active_user
   M: update_email_sent
   N: active_challenge_id  ← NEW
   ```

5. **Leave Data Empty**:
   - Migration script will backfill
   - Do NOT manually add data

**Verification**:
- [ ] Users sheet has new "active_challenge_id" column
- [ ] Column is empty (no data yet)
- [ ] Existing user data intact (29 users as of Oct 28)

---

## Part C: Verification Checklist

### All Sheets Created/Modified:

1. **New Sheets**:
   - [ ] Challenges sheet (7 columns, 1 data row)
   - [ ] Challenge_Teams sheet (4 columns, 0 data rows)

2. **Modified Sheets**:
   - [ ] Workouts: challenge_id column added (column D, empty)
   - [ ] Completions: challenge_id column added (column F, empty)
   - [ ] Users: active_challenge_id column added (after update_email_sent, empty)

3. **Untouched Sheets** (verify no changes):
   - [ ] Settings sheet unchanged
   - [ ] Coaching sheet unchanged
   - [ ] Form_Responses sheet unchanged (if exists)

### Data Integrity Check:

- [ ] **Workouts**: 17 workouts still present, no data lost
- [ ] **Completions**: ~304 completions still present, no data lost
- [ ] **Users**: 29 users still present, no data lost
- [ ] **Settings**: 7 key-value pairs still present
- [ ] **Coaching**: Coaching tips still present

### Visual Check:

Take screenshots of:
1. Sheet tabs showing all sheets (including new ones)
2. Challenges sheet with daily_dose_oct2025 row
3. Challenge_Teams sheet (empty except headers)
4. Workouts sheet showing new challenge_id column (empty)
5. Completions sheet showing new challenge_id column (empty)
6. Users sheet showing new active_challenge_id column (empty)

---

## Common Issues & Solutions

### Issue: "I accidentally added data to new columns"

**Solution**:
- Delete the data (select column, clear contents)
- Migration script will populate correctly

### Issue: "I can't find which column to insert after"

**Solution**:
- Workouts: Insert after "end_date" (column C)
- Completions: Add as last column (column F)
- Users: Add as last column (after "update_email_sent")

### Issue: "TRUE is showing as text 'TRUE' instead of boolean"

**Solution**:
- Select the cell with TRUE
- Remove quotes if present
- Ensure cell shows TRUE (not "TRUE")
- Format → Number → Automatic

### Issue: "Dates are showing as numbers like 44926"

**Solution**:
- Select date columns
- Format → Number → Date
- Should display as 10/1/2025

---

## Ready for Phase 2?

Once all verification items are checked:
- [ ] All new sheets created with correct headers
- [ ] All new columns added to existing sheets
- [ ] All columns are EMPTY (no manual data entry)
- [ ] No existing data lost
- [ ] Screenshots taken for reference

**Next Step**: Proceed to Phase 2 - Create Migration Scripts

---

*Last Updated: October 30, 2025*
