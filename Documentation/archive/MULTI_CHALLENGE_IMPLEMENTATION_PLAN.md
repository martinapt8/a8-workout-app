# Multi-Challenge Architecture Implementation Plan

**Document Created:** October 28, 2025
**Purpose:** Transform Daily Dose app from single-challenge to year-round multi-challenge system
**Status:** Planning Phase - Ready for Implementation

---

## Executive Summary

Transform the app to support:
- ✅ Year-round workout logging (365 days)
- ✅ Multiple challenges within the year with different teams
- ✅ Flexible team assignments per challenge
- ✅ Performance optimization for growing data
- ✅ Backward compatibility with current October challenge

---

## Current State Analysis

### Data Snapshot (as of 10/28/2025)
- **Users:** 29 active users across 8 teams
- **Completions:** 304 workouts logged (10/1/2025 - 10/28/2025)
- **Current Challenge:** "The Daily Dose" (10/1/2025 - 11/5/2025)
- **Goal:** 500 total workouts
- **Workout Mix:** 89% "Other Workout", 11% prescribed workouts

### Teams
1. You Can't Lift With Us (#FF006E)
2. Flexecutioners 🪓 (#bb0a1e)
3. MARJaritas (#32CD32)
4. Curl Power (#FF69B4)
5. Gym Class Heroes (#1E90FF)
6. CTRL+FIT (#000000)
7. G-Force 🚀 (#FF4500)
8. (8th team not visible in sample)

### Current Schema

**Users Sheet:**
```
Columns: user_id, display_name, team_name, team_color, total_workouts,
         last_completed, deployment_URL, full_name, email, join_date,
         welcome_email_sent, active_user, update_email_sent
```

**Workouts Sheet:**
```
Columns: workout_id, start_date, end_date, workout_name, instructions,
         movement_1-10, reps_1-10, alt_1-10
```

**Completions Sheet:**
```
Columns: timestamp, user_id, workout_id, team_name, other_workout_details
```

**Settings Sheet:**
```
Key-Value pairs: challenge_name, start_date, end_date, total_goal,
                 company_name, deployed_URL, timezone
```

**Coaching Sheet:**
```
Columns: date, coaching_tip
```

---

## Key Architectural Changes

### 1. New Challenges Sheet

Centralizes all challenge configuration (replaces Settings challenge keys).

**Structure:**
| Column | Type | Example | Description |
|--------|------|---------|-------------|
| challenge_id | String | daily_dose_oct2025 | Unique identifier |
| challenge_name | String | The Daily Dose | Display name |
| start_date | Date | 10/1/2025 | Challenge start |
| end_date | Date | 11/5/2025 | Challenge end |
| total_goal | Number | 500 | Target workouts |
| is_active | Boolean | TRUE | Only one can be TRUE |
| status | String | active | active/upcoming/completed |

**Initial Data (migrate from Settings):**
```
challenge_id: daily_dose_oct2025
challenge_name: The Daily Dose
start_date: 10/1/2025
end_date: 11/5/2025
total_goal: 500
is_active: TRUE
status: active
```

### 2. New Challenge_Teams Sheet

Enables flexible team assignments across challenges.

**Structure:**
| Column | Type | Example | Description |
|--------|------|---------|-------------|
| challenge_id | String | daily_dose_oct2025 | Which challenge |
| user_id | String | megan | Which user |
| team_name | String | You Can't Lift With Us | Team for this challenge |
| team_color | String | #FF006E | Team color hex |

**Migration:** Create 29 rows (one per user) with current team assignments from Users sheet.

**Why This Design:**
- Users like "megan" can be on "Team Red" in October, "Team Blue" in December
- Team names/emojis can change per challenge
- Preserves team history across all challenges

### 3. Modified Existing Sheets

#### Workouts Sheet
**Add column:** `challenge_id` (String)

**Backfill:** Set all 17 existing workouts to "daily_dose_oct2025"

**Future use:**
```
workout_id: dd_001
challenge_id: daily_dose_oct2025

workout_id: winter_001
challenge_id: winter_warrior_dec2025
```

#### Completions Sheet
**Add column:** `challenge_id` (String)

**Backfill:** Set all 304 existing completions to "daily_dose_oct2025"

**Year-round logging:** Use `challenge_id = "year_round"` for workouts logged outside challenges

**Performance Impact:** 🔥 CRITICAL - This enables 10x faster queries
- Before: Scan 10,000 rows + date comparison
- After: Scan 10,000 rows but skip 95% with string match `challenge_id = "daily_dose_oct2025"`

#### Users Sheet
**Add column:** `active_challenge_id` (String)

**Backfill:** Set all active users to "daily_dose_oct2025"

**Deprecate (keep for backward compatibility):**
- `team_name` - Will use Challenge_Teams lookup instead
- `team_color` - Will use Challenge_Teams lookup instead
- `total_workouts` - Calculate on-demand from Completions filtered by challenge
- `last_completed` - Calculate on-demand from Completions filtered by challenge

**Why deprecate?** These fields become challenge-specific, so storing them at user level creates ambiguity when switching challenges.

#### Settings Sheet
**Remove these keys** (moved to Challenges sheet):
- challenge_name
- start_date
- end_date
- total_goal

**Keep these keys** (app-wide settings):
- company_name
- deployed_URL
- timezone

---

## Implementation Phases

### Phase 1: Protect Sample Data (5 min)

**File:** `.gitignore`

**Add:**
```
# Sample data with PII
SampleData/
*.csv
```

**Why:** Prevents accidentally pushing user emails, names, workout details to public repo.

### Phase 2: Create New Sheets (30 min)

**Manual steps in Google Sheets:**

1. **Create Challenges sheet**
   - Add headers: challenge_id, challenge_name, start_date, end_date, total_goal, is_active, status
   - Add first row: daily_dose_oct2025, The Daily Dose, 10/1/2025, 11/5/2025, 500, TRUE, active

2. **Create Challenge_Teams sheet**
   - Add headers: challenge_id, user_id, team_name, team_color
   - Will populate via script (Phase 4)

3. **Add columns to existing sheets:**
   - Workouts: Add column `challenge_id` (after end_date)
   - Completions: Add column `challenge_id` (after other_workout_details)
   - Users: Add column `active_challenge_id` (after update_email_sent)

### Phase 3: Create Migration Scripts (30 min)

**New file:** `backend/MigrationScripts.gs`

```javascript
/**
 * Migration Scripts for Multi-Challenge Architecture
 * Run these ONCE after adding new columns to sheets
 */

/**
 * Test migration - shows what will change without modifying data
 */
function testMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('=== MIGRATION PREVIEW ===');

  // Preview Workouts
  const workoutsSheet = ss.getSheetByName('Workouts');
  const workoutsData = workoutsSheet.getDataRange().getValues();
  let workoutsToUpdate = 0;
  for (let i = 1; i < workoutsData.length; i++) {
    if (workoutsData[i][0]) { // Has workout_id
      workoutsToUpdate++;
    }
  }
  Logger.log(`Workouts: Will update ${workoutsToUpdate} rows with challenge_id = "daily_dose_oct2025"`);

  // Preview Completions
  const completionsSheet = ss.getSheetByName('Completions');
  const completionsData = completionsSheet.getDataRange().getValues();
  let completionsToUpdate = completionsData.length - 1; // All rows except header
  Logger.log(`Completions: Will update ${completionsToUpdate} rows with challenge_id = "daily_dose_oct2025"`);

  // Preview Users
  const usersSheet = ss.getSheetByName('Users');
  const usersData = usersSheet.getDataRange().getValues();
  let usersToUpdate = 0;
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][11] === true) { // active_user column
      usersToUpdate++;
    }
  }
  Logger.log(`Users: Will update ${usersToUpdate} active users with active_challenge_id = "daily_dose_oct2025"`);

  // Preview Challenge_Teams
  Logger.log(`Challenge_Teams: Will create ${usersToUpdate} rows (one per active user)`);

  Logger.log('=== END PREVIEW ===');
  Logger.log('If counts look correct, run the backfill functions.');
}

/**
 * Backfill challenge_id to Workouts sheet
 */
function backfillChallengeIdToWorkouts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = data[0];

  // Find challenge_id column
  const challengeIdCol = headers.indexOf('challenge_id');
  if (challengeIdCol === -1) {
    throw new Error('challenge_id column not found in Workouts sheet. Add it first.');
  }

  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    // If workout_id exists and challenge_id is empty
    if (data[i][0] && !data[i][challengeIdCol]) {
      workoutsSheet.getRange(i + 1, challengeIdCol + 1).setValue('daily_dose_oct2025');
      updated++;
    }
  }

  Logger.log(`Updated ${updated} workouts with challenge_id = "daily_dose_oct2025"`);
  return updated;
}

/**
 * Backfill challenge_id to Completions sheet
 */
function backfillChallengeIdToCompletions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  // Find challenge_id column
  const challengeIdCol = headers.indexOf('challenge_id');
  if (challengeIdCol === -1) {
    throw new Error('challenge_id column not found in Completions sheet. Add it first.');
  }

  // Get challenge dates for validation
  const challengeStart = new Date('10/1/2025');
  const challengeEnd = new Date('11/5/2025');

  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    // If challenge_id is empty
    if (!data[i][challengeIdCol]) {
      const timestamp = new Date(data[i][0]);

      // If within challenge dates, assign to challenge
      if (timestamp >= challengeStart && timestamp <= challengeEnd) {
        completionsSheet.getRange(i + 1, challengeIdCol + 1).setValue('daily_dose_oct2025');
      } else {
        // Outside challenge dates = year-round
        completionsSheet.getRange(i + 1, challengeIdCol + 1).setValue('year_round');
      }
      updated++;
    }
  }

  Logger.log(`Updated ${updated} completions with challenge_id`);
  return updated;
}

/**
 * Populate Challenge_Teams from current Users sheet
 */
function populateChallengeTeamsFromUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    throw new Error('Challenge_Teams sheet not found. Create it first.');
  }

  const usersData = usersSheet.getDataRange().getValues();
  const headers = usersData[0];

  // Find columns
  const userIdCol = headers.indexOf('user_id');
  const teamNameCol = headers.indexOf('team_name');
  const teamColorCol = headers.indexOf('team_color');
  const activeUserCol = headers.indexOf('active_user');

  let added = 0;
  for (let i = 1; i < usersData.length; i++) {
    // Only migrate active users
    if (usersData[i][activeUserCol] === true) {
      teamsSheet.appendRow([
        'daily_dose_oct2025',
        usersData[i][userIdCol],
        usersData[i][teamNameCol],
        usersData[i][teamColorCol]
      ]);
      added++;
    }
  }

  Logger.log(`Added ${added} team assignments to Challenge_Teams`);
  return added;
}

/**
 * Set active_challenge_id for all active users
 */
function backfillActiveChallengeIdToUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];

  const activeChallengeIdCol = headers.indexOf('active_challenge_id');
  const activeUserCol = headers.indexOf('active_user');

  if (activeChallengeIdCol === -1) {
    throw new Error('active_challenge_id column not found in Users sheet. Add it first.');
  }

  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    // If active user and active_challenge_id is empty
    if (data[i][activeUserCol] === true && !data[i][activeChallengeIdCol]) {
      usersSheet.getRange(i + 1, activeChallengeIdCol + 1).setValue('daily_dose_oct2025');
      updated++;
    }
  }

  Logger.log(`Updated ${updated} users with active_challenge_id = "daily_dose_oct2025"`);
  return updated;
}

/**
 * Run all migrations in sequence
 * IMPORTANT: Run testMigration() first to verify counts
 */
function runFullMigration() {
  Logger.log('Starting full migration...');

  Logger.log('Step 1: Backfilling Workouts...');
  backfillChallengeIdToWorkouts();

  Logger.log('Step 2: Backfilling Completions...');
  backfillChallengeIdToCompletions();

  Logger.log('Step 3: Backfilling Users...');
  backfillActiveChallengeIdToUsers();

  Logger.log('Step 4: Populating Challenge_Teams...');
  populateChallengeTeamsFromUsers();

  Logger.log('Migration complete! Test the app.');
}
```

### Phase 4: Run Migration (15 min)

**Steps:**

1. **Backup your Google Sheet** (File → Make a copy)

2. **In Google Apps Script:**
   - Open Script Editor
   - Create new file: MigrationScripts.gs
   - Paste code from Phase 3
   - Save

3. **Run test:**
   - Select `testMigration` function
   - Click Run
   - Check logs (View → Logs)
   - Verify counts match:
     - ~17 workouts
     - ~304 completions
     - ~29 users
     - ~29 team assignments

4. **Run migration:**
   - Select `runFullMigration` function
   - Click Run
   - Authorize permissions if prompted
   - Check logs for success messages

5. **Verify in Google Sheets:**
   - Check Workouts: challenge_id column filled
   - Check Completions: challenge_id column filled
   - Check Users: active_challenge_id column filled
   - Check Challenge_Teams: 29 rows created

### Phase 5: Update Backend Functions (2-3 hours)

**File:** `backend/Code.gs`

#### New Helper Functions

Add these at the end of Code.gs:

```javascript
/**
 * Get active challenge from Challenges sheet
 * @returns {Object|null} Active challenge or null
 */
function getActiveChallenge(ss) {
  const challengesSheet = ss.getSheetByName('Challenges');
  if (!challengesSheet) {
    Logger.log('Challenges sheet not found');
    return null;
  }

  const data = challengesSheet.getDataRange().getValues();
  const headers = data[0];

  // Build header mapping
  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  // Find active challenge
  for (let i = 1; i < data.length; i++) {
    if (data[i][headerMap['is_active']] === true) {
      return {
        challenge_id: data[i][headerMap['challenge_id']],
        challenge_name: data[i][headerMap['challenge_name']],
        start_date: data[i][headerMap['start_date']],
        end_date: data[i][headerMap['end_date']],
        total_goal: data[i][headerMap['total_goal']],
        status: data[i][headerMap['status']]
      };
    }
  }

  return null; // No active challenge
}

/**
 * Get challenge by ID
 * @param {Spreadsheet} ss - Spreadsheet object
 * @param {string} challengeId - Challenge ID to find
 * @returns {Object|null} Challenge or null
 */
function getChallengeById(ss, challengeId) {
  const challengesSheet = ss.getSheetByName('Challenges');
  if (!challengesSheet) return null;

  const data = challengesSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  for (let i = 1; i < data.length; i++) {
    if (data[i][headerMap['challenge_id']] === challengeId) {
      return {
        challenge_id: data[i][headerMap['challenge_id']],
        challenge_name: data[i][headerMap['challenge_name']],
        start_date: data[i][headerMap['start_date']],
        end_date: data[i][headerMap['end_date']],
        total_goal: data[i][headerMap['total_goal']],
        is_active: data[i][headerMap['is_active']],
        status: data[i][headerMap['status']]
      };
    }
  }

  return null;
}

/**
 * Get user's team for a specific challenge
 * @param {Spreadsheet} ss - Spreadsheet object
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @returns {Object|null} Team info or null
 */
function getUserTeamForChallenge(ss, userId, challengeId) {
  const teamsSheet = ss.getSheetByName('Challenge_Teams');
  if (!teamsSheet) {
    // Fallback to Users sheet for backward compatibility
    const userInfo = getUserInfo(ss, userId);
    if (userInfo) {
      return {
        team_name: userInfo.team_name,
        team_color: userInfo.team_color
      };
    }
    return null;
  }

  const data = teamsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  for (let i = 1; i < data.length; i++) {
    if (data[i][headerMap['challenge_id']] === challengeId &&
        data[i][headerMap['user_id']].toLowerCase() === userId.toLowerCase()) {
      return {
        team_name: data[i][headerMap['team_name']],
        team_color: data[i][headerMap['team_color']]
      };
    }
  }

  return null;
}
```

#### Modify Existing Functions

**Replace `getUserDashboardData()`:**

```javascript
function getUserDashboardData(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get active challenge (replaces getSettings)
  const activeChallenge = getActiveChallenge(ss);
  if (!activeChallenge) {
    return {
      error: 'No active challenge found',
      message: 'The app is currently in off-season. You can still log "Other Workouts" to track your year-round fitness!'
    };
  }

  // Get user info
  const user = getUserInfo(ss, userId);
  if (!user) {
    return { error: 'User not found' };
  }

  // Get user's team for this challenge
  const userTeam = getUserTeamForChallenge(ss, userId, activeChallenge.challenge_id);

  // Get active workout (now filtered by challenge_id)
  const activeWorkout = getActiveWorkout(ss, activeChallenge.challenge_id);

  // Check if user completed today (now filtered by challenge_id)
  const completedToday = hasCompletedToday(ss, userId, activeChallenge.challenge_id);

  // Get goal progress (now filtered by challenge_id)
  const goalProgress = getGoalProgress(ss, activeChallenge.challenge_id);

  return {
    user: {
      user_id: user.user_id,
      display_name: user.display_name,
      team_name: userTeam ? userTeam.team_name : user.team_name,
      team_color: userTeam ? userTeam.team_color : user.team_color
    },
    challenge: activeChallenge, // NEW: replaces "settings"
    activeWorkout: activeWorkout,
    completedToday: completedToday,
    goalProgress: goalProgress
  };
}
```

**Update `getActiveWorkout()` signature and logic:**

```javascript
function getActiveWorkout(ss, challengeId) {
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = getWorkoutsHeaderMapping(workoutsSheet);

  const settings = getSettings(ss);
  const timezone = settings.timezone || 'America/New_York';
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  today.setHours(0, 0, 0, 0);

  let newestWorkout = null;
  let newestStartDate = null;

  for (let i = 1; i < data.length; i++) {
    // ADDED: Filter by challenge_id
    if (data[i][headers['challenge_id']] !== challengeId) {
      continue;
    }

    const startDate = new Date(data[i][headers['start_date']]);
    const endDate = new Date(data[i][headers['end_date']]);

    // ... rest of existing logic
  }

  return newestWorkout;
}
```

**Update `getGoalProgress()` - CRITICAL FOR PERFORMANCE:**

```javascript
function getGoalProgress(ss, challengeId) {
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const challenge = getChallengeById(ss, challengeId);
  if (!challenge) {
    return { error: 'Challenge not found' };
  }

  let totalCompletions = 0;
  const teamTotals = {};
  const recentCompletions = [];

  // PERFORMANCE OPTIMIZATION: Filter by challenge_id FIRST
  for (let i = 1; i < data.length; i++) {
    // Skip rows not belonging to this challenge
    if (data[i][headerMap['challenge_id']] !== challengeId) {
      continue;
    }

    totalCompletions++;

    const teamName = data[i][headerMap['team_name']];
    if (teamName) {
      teamTotals[teamName] = (teamTotals[teamName] || 0) + 1;
    }
  }

  // Second pass for recent completions (reverse iteration)
  for (let i = data.length - 1; i >= 1 && recentCompletions.length < 10; i--) {
    if (data[i][headerMap['challenge_id']] === challengeId) {
      const userId = data[i][headerMap['user_id']];
      const timestamp = data[i][headerMap['timestamp']];
      const workoutId = data[i][headerMap['workout_id']];

      const userInfo = getUserInfo(ss, userId);
      const displayName = userInfo ? userInfo.display_name : userId;

      recentCompletions.push({
        user: displayName,
        workout: workoutId === 'Other Workout' ? 'logged a workout' : `completed ${workoutId}`,
        timestamp: formatDate(new Date(timestamp))
      });
    }
  }

  return {
    total_completions: totalCompletions,
    total_goal: challenge.total_goal,
    percentage: Math.round((totalCompletions / challenge.total_goal) * 100),
    team_totals: teamTotals,
    recent_completions: recentCompletions
  };
}
```

**Update `markWorkoutComplete()`:**

```javascript
function markWorkoutComplete(userId, workoutType, workoutDetails, completionDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get active challenge
  const activeChallenge = getActiveChallenge(ss);

  // Allow year-round logging even without active challenge
  const challengeId = activeChallenge ? activeChallenge.challenge_id : 'year_round';

  // Get user info
  const user = getUserInfo(ss, userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  // Get user's team for this challenge
  let teamName = user.team_name; // Fallback
  if (activeChallenge) {
    const userTeam = getUserTeamForChallenge(ss, userId, activeChallenge.challenge_id);
    if (userTeam) {
      teamName = userTeam.team_name;
    }
  }

  // ... existing validation logic ...

  // Add completion with challenge_id
  const completionsSheet = ss.getSheetByName('Completions');
  completionsSheet.appendRow([
    timestamp,
    userId,
    workoutId,
    teamName,
    workoutDetails || '',
    challengeId  // NEW COLUMN
  ]);

  return { success: true, message: 'Workout completed!' };
}
```

**Update `getUserCompletionHistory()`:**

```javascript
function getUserCompletionHistory(userId, challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const challenge = challengeId ? getChallengeById(ss, challengeId) : null;
  const completionDates = [];

  for (let i = 1; i < data.length; i++) {
    const rowUserId = data[i][headerMap['user_id']];
    const rowChallengeId = data[i][headerMap['challenge_id']];

    // Filter by user and challenge
    if (rowUserId.toLowerCase() === userId.toLowerCase() &&
        rowChallengeId === challengeId) {
      const timestamp = new Date(data[i][headerMap['timestamp']]);
      const dateStr = formatDateYYYYMMDD(timestamp);

      if (!completionDates.includes(dateStr)) {
        completionDates.push(dateStr);
      }
    }
  }

  return completionDates;
}
```

**Update `getAllWorkouts()`:**

```javascript
function getAllWorkouts(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = getWorkoutsHeaderMapping(workoutsSheet);

  const workouts = [];

  for (let i = 1; i < data.length; i++) {
    const workoutId = data[i][headers['workout_id']];
    const rowChallengeId = data[i][headers['challenge_id']];

    // Skip empty rows
    if (!workoutId) continue;

    // Filter by challenge if provided
    if (challengeId && rowChallengeId !== challengeId) {
      continue;
    }

    // ... rest of existing logic ...
  }

  return workouts;
}
```

**Update `hasCompletedToday()` and `hasCompletedOnDate()`:**

```javascript
function hasCompletedToday(ss, userId, challengeId) {
  const settings = getSettings(ss);
  const timezone = settings.timezone || 'America/New_York';
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  today.setHours(0, 0, 0, 0);

  return hasCompletedOnDate(ss, userId, today, challengeId);
}

function hasCompletedOnDate(ss, userId, targetDate, challengeId) {
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  for (let i = 1; i < data.length; i++) {
    const rowUserId = data[i][headerMap['user_id']];
    const rowChallengeId = data[i][headerMap['challenge_id']];

    // Filter by user and challenge
    if (rowUserId.toLowerCase() === userId.toLowerCase() &&
        rowChallengeId === challengeId) {
      const completionDate = new Date(data[i][headerMap['timestamp']]);
      completionDate.setHours(0, 0, 0, 0);

      if (completionDate.getTime() === targetDate.getTime()) {
        return true;
      }
    }
  }

  return false;
}
```

### Phase 6: Update Frontend (30 min)

**File:** `index.html`

**Find and replace all instances:**

```javascript
// OLD
userData.settings.challenge_name
userData.settings.start_date
userData.settings.end_date
userData.settings.total_goal

// NEW
userData.challenge.challenge_name
userData.challenge.start_date
userData.challenge.end_date
userData.challenge.total_goal
```

**Specific changes:**

Around line 850-860 (in `updateTodayPage()` function):
```javascript
// OLD
document.getElementById('challenge-title').textContent =
  `${userData.settings.challenge_name}`;

// NEW
document.getElementById('challenge-title').textContent =
  `${userData.challenge.challenge_name}`;
```

Around line 1100 (in `updateTeamPage()` function):
```javascript
// OLD
document.getElementById('goal-challenge-title').textContent =
  userData.settings.challenge_name;
document.getElementById('goal-text').textContent =
  `${goalData.total_completions}/${userData.settings.total_goal} workouts`;

// NEW
document.getElementById('goal-challenge-title').textContent =
  userData.challenge.challenge_name;
document.getElementById('goal-text').textContent =
  `${goalData.total_completions}/${userData.challenge.total_goal} workouts`;
```

**Handle "No Active Challenge" state:**

Add this check at the start of `loadUserData()` around line 750:
```javascript
function loadUserData() {
  showLoadingScreen();

  google.script.run
    .withSuccessHandler(function(data) {
      hideLoadingScreen();

      // NEW: Handle no active challenge
      if (data.error && data.message) {
        // Show off-season message
        document.getElementById('challenge-title').textContent = 'Off-Season';
        document.getElementById('user-greeting').textContent =
          `Hey ${data.user ? data.user.display_name : 'there'}!`;
        document.getElementById('completion-status').innerHTML =
          `<p style="color: #6B7280;">${data.message}</p>`;

        // Hide workout card, show only "Log Other Workout"
        document.getElementById('workout-card').style.display = 'none';
        return;
      }

      userData = data;
      updateUI();
    })
    .withFailureHandler(function(error) {
      hideLoadingScreen();
      console.error('Error loading user data:', error);
    })
    .getUserDashboardData(currentUserId);
}
```

### Phase 7: Create Admin Functions (1 hour)

**New file:** `backend/AdminChallenges.gs`

```javascript
/**
 * Admin functions for managing challenges
 */

/**
 * Create a new challenge
 * @param {string} challengeId - Unique identifier (e.g., "winter_warrior_dec2025")
 * @param {string} challengeName - Display name (e.g., "Winter Warrior Challenge")
 * @param {Date} startDate - Challenge start date
 * @param {Date} endDate - Challenge end date
 * @param {number} totalGoal - Target number of workouts
 * @param {boolean} setActive - Set as active challenge immediately (default: false)
 */
function createNewChallenge(challengeId, challengeName, startDate, endDate, totalGoal, setActive) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const challengesSheet = ss.getSheetByName('Challenges');

  if (!challengesSheet) {
    throw new Error('Challenges sheet not found');
  }

  // Check if challenge_id already exists
  const data = challengesSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === challengeId) {
      throw new Error(`Challenge with ID "${challengeId}" already exists`);
    }
  }

  // If setting as active, deactivate all other challenges
  if (setActive) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === true) { // is_active column
        challengesSheet.getRange(i + 1, 6).setValue(false);
        challengesSheet.getRange(i + 1, 7).setValue('completed'); // status
      }
    }
  }

  // Add new challenge
  challengesSheet.appendRow([
    challengeId,
    challengeName,
    startDate,
    endDate,
    totalGoal,
    setActive || false,
    setActive ? 'active' : 'upcoming'
  ]);

  Logger.log(`Created challenge: ${challengeName} (${challengeId})`);
  return challengeId;
}

/**
 * Set a challenge as active (deactivates all others)
 * @param {string} challengeId - Challenge to activate
 */
function setActiveChallenge(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const challengesSheet = ss.getSheetByName('Challenges');

  const data = challengesSheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === challengeId) {
      // Activate this challenge
      challengesSheet.getRange(i + 1, 6).setValue(true); // is_active
      challengesSheet.getRange(i + 1, 7).setValue('active'); // status
      found = true;
    } else if (data[i][5] === true) {
      // Deactivate other challenges
      challengesSheet.getRange(i + 1, 6).setValue(false);
      challengesSheet.getRange(i + 1, 7).setValue('completed');
    }
  }

  if (!found) {
    throw new Error(`Challenge "${challengeId}" not found`);
  }

  Logger.log(`Activated challenge: ${challengeId}`);
  return true;
}

/**
 * Assign a user to a team for a specific challenge
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @param {string} teamName - Team name
 * @param {string} teamColor - Team color hex code
 */
function assignUserToTeam(userId, challengeId, teamName, teamColor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    throw new Error('Challenge_Teams sheet not found');
  }

  // Check if assignment already exists
  const data = teamsSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === challengeId && data[i][1].toLowerCase() === userId.toLowerCase()) {
      // Update existing assignment
      teamsSheet.getRange(i + 1, 3).setValue(teamName);
      teamsSheet.getRange(i + 1, 4).setValue(teamColor);
      Logger.log(`Updated team assignment: ${userId} → ${teamName} (${challengeId})`);
      return;
    }
  }

  // Add new assignment
  teamsSheet.appendRow([challengeId, userId, teamName, teamColor]);
  Logger.log(`Added team assignment: ${userId} → ${teamName} (${challengeId})`);
}

/**
 * Bulk assign all active users to teams for a new challenge
 * @param {string} challengeId - Challenge ID
 * @param {Object} assignments - Object mapping userId to {teamName, teamColor}
 * Example: {'megan': {teamName: 'Red', teamColor: '#FF0000'}, ...}
 */
function bulkAssignTeams(challengeId, assignments) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    throw new Error('Challenge_Teams sheet not found');
  }

  let added = 0;
  for (const userId in assignments) {
    const teamInfo = assignments[userId];
    assignUserToTeam(userId, challengeId, teamInfo.teamName, teamInfo.teamColor);
    added++;
  }

  Logger.log(`Bulk assigned ${added} users to teams for ${challengeId}`);
  return added;
}

/**
 * Mark a challenge as completed
 * @param {string} challengeId - Challenge to complete
 */
function endChallenge(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const challengesSheet = ss.getSheetByName('Challenges');

  const data = challengesSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === challengeId) {
      challengesSheet.getRange(i + 1, 6).setValue(false); // is_active
      challengesSheet.getRange(i + 1, 7).setValue('completed'); // status
      Logger.log(`Ended challenge: ${challengeId}`);
      return true;
    }
  }

  throw new Error(`Challenge "${challengeId}" not found`);
}

/**
 * Get stats for a completed challenge
 * @param {string} challengeId - Challenge ID
 */
function getChallengeStats(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const stats = {
    total_completions: 0,
    unique_participants: new Set(),
    team_totals: {},
    workout_types: {
      prescribed: 0,
      other: 0,
      ai: 0
    }
  };

  for (let i = 1; i < data.length; i++) {
    if (data[i][headerMap['challenge_id']] === challengeId) {
      stats.total_completions++;
      stats.unique_participants.add(data[i][headerMap['user_id']]);

      const teamName = data[i][headerMap['team_name']];
      if (teamName) {
        stats.team_totals[teamName] = (stats.team_totals[teamName] || 0) + 1;
      }

      const workoutId = data[i][headerMap['workout_id']];
      if (workoutId === 'Other Workout') {
        stats.workout_types.other++;
      } else if (workoutId === 'AI Workout') {
        stats.workout_types.ai++;
      } else {
        stats.workout_types.prescribed++;
      }
    }
  }

  stats.unique_participants = stats.unique_participants.size;

  return stats;
}

/**
 * Example: Create December challenge
 */
function exampleCreateDecemberChallenge() {
  const challengeId = 'winter_warrior_dec2025';
  const challengeName = 'Winter Warrior Challenge';
  const startDate = new Date('12/1/2025');
  const endDate = new Date('12/31/2025');
  const totalGoal = 600;

  createNewChallenge(challengeId, challengeName, startDate, endDate, totalGoal, false);

  // Assign teams (example - modify team names as needed)
  const teamAssignments = {
    'megan': {teamName: 'Polar Bears', teamColor: '#00BFFF'},
    'suzied': {teamName: 'Snow Leopards', teamColor: '#F0F8FF'},
    // ... add all users
  };

  bulkAssignTeams(challengeId, teamAssignments);

  Logger.log('December challenge created! Set it active when ready with: setActiveChallenge("winter_warrior_dec2025")');
}
```

**Update `backend/menu.gs`:**

Add to existing menu:
```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('A8 Custom Menu')
    .addItem('Migrate Form Responses', 'migrateFormResponses')
    .addItem('Send Welcome Email', 'sendWelcomeEmail')
    .addItem('Send Update Email', 'sendUpdateEmail')
    .addItem('Send Slack Progress Update', 'sendDailyProgressSummary')
    .addSeparator()
    // NEW ITEMS
    .addItem('Create New Challenge', 'promptCreateChallenge')
    .addItem('Set Active Challenge', 'promptSetActiveChallenge')
    .addItem('View Challenge Stats', 'promptViewChallengeStats')
    .addSeparator()
    .addItem('Test Migration Preview', 'testMigrationPreview')
    .addToUi();
}

// NEW: Prompt functions for admin menu
function promptCreateChallenge() {
  const ui = SpreadsheetApp.getUi();

  const idResult = ui.prompt('Challenge ID (e.g., winter_warrior_dec2025):');
  if (idResult.getSelectedButton() !== ui.Button.OK) return;
  const challengeId = idResult.getResponseText();

  const nameResult = ui.prompt('Challenge Name (e.g., Winter Warrior Challenge):');
  if (nameResult.getSelectedButton() !== ui.Button.OK) return;
  const challengeName = nameResult.getResponseText();

  const startResult = ui.prompt('Start Date (MM/DD/YYYY):');
  if (startResult.getSelectedButton() !== ui.Button.OK) return;
  const startDate = new Date(startResult.getResponseText());

  const endResult = ui.prompt('End Date (MM/DD/YYYY):');
  if (endResult.getSelectedButton() !== ui.Button.OK) return;
  const endDate = new Date(endResult.getResponseText());

  const goalResult = ui.prompt('Total Goal (number of workouts):');
  if (goalResult.getSelectedButton() !== ui.Button.OK) return;
  const totalGoal = parseInt(goalResult.getResponseText());

  createNewChallenge(challengeId, challengeName, startDate, endDate, totalGoal, false);

  ui.alert(`Challenge "${challengeName}" created! Don't forget to assign teams.`);
}

function promptSetActiveChallenge() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Enter Challenge ID to activate:');

  if (result.getSelectedButton() === ui.Button.OK) {
    try {
      setActiveChallenge(result.getResponseText());
      ui.alert('Challenge activated!');
    } catch (e) {
      ui.alert('Error: ' + e.message);
    }
  }
}

function promptViewChallengeStats() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Enter Challenge ID to view stats:');

  if (result.getSelectedButton() === ui.Button.OK) {
    const stats = getChallengeStats(result.getResponseText());
    const message = `
Total Completions: ${stats.total_completions}
Unique Participants: ${stats.unique_participants}
Prescribed Workouts: ${stats.workout_types.prescribed}
Other Workouts: ${stats.workout_types.other}
AI Workouts: ${stats.workout_types.ai}

Team Totals:
${Object.entries(stats.team_totals).map(([team, count]) => `${team}: ${count}`).join('\n')}
    `;
    ui.alert('Challenge Stats', message, ui.ButtonSet.OK);
  }
}
```

### Phase 8: Testing (1 hour)

**Test Checklist:**

1. **Dashboard Loading**
   - [ ] Dashboard loads with active challenge name
   - [ ] User greeting shows correct name
   - [ ] Team name/color displays correctly

2. **Workout Logging**
   - [ ] Log prescribed workout → check Completions has challenge_id
   - [ ] Log "Other Workout" → check Completions has challenge_id
   - [ ] Log AI workout → check Completions has challenge_id
   - [ ] Verify duplicate prevention still works

3. **Goal Progress**
   - [ ] Total completions count is accurate
   - [ ] Team totals are correct
   - [ ] Recent activity shows last 10 workouts
   - [ ] Progress bar percentage is accurate

4. **Calendar (Me Page)**
   - [ ] Checkmarks appear on completed dates
   - [ ] Only shows completions for active challenge
   - [ ] Past workout logging works

5. **Library Page**
   - [ ] Shows workouts for active challenge
   - [ ] Workout details display correctly

6. **Admin Functions**
   - [ ] Create new challenge → verify in Challenges sheet
   - [ ] Assign teams → verify in Challenge_Teams sheet
   - [ ] Set active challenge → verify is_active flags
   - [ ] View challenge stats → verify counts

7. **Challenge Switching**
   - [ ] Create test challenge for December
   - [ ] Assign teams for December challenge
   - [ ] Switch active challenge to December
   - [ ] Verify dashboard shows December challenge
   - [ ] Log workout → verify challenge_id is December
   - [ ] Switch back to October → verify stats preserved

8. **Year-Round Logging**
   - [ ] Set all challenges to is_active = FALSE
   - [ ] Verify dashboard shows "off-season" message
   - [ ] Log "Other Workout" → verify challenge_id = "year_round"
   - [ ] Re-activate challenge → verify normal behavior returns

---

## Year-Round Logging Logic

### When No Active Challenge

**User Experience:**
- Dashboard shows: "Off-Season - No active challenge"
- Message: "The app is currently in off-season. You can still log 'Other Workouts' to track your year-round fitness!"
- Workout card is hidden (no prescribed workout)
- "Log Other Workout" button is always visible
- Goal progress card shows "Off-Season" message or is hidden

**Backend Behavior:**
- `getActiveChallenge()` returns `null`
- `markWorkoutComplete()` uses `challenge_id = "year_round"`
- Recent activity feed shows all year-round workouts
- Team page shows message: "Join us for the next challenge!"

### When Active Challenge Exists

**User Experience:**
- Normal behavior: prescribed workout, goal progress, team stats
- Users can log prescribed workout OR other workout
- All workouts tagged with active challenge_id

---

## Performance Strategy

### Immediate Benefits (Phase 5)

**Challenge_id Filtering:**
- Reduces query scope from all-time (10,000+ rows) to single challenge (300-500 rows)
- **Performance Gain:** 10-20x faster queries

**Before:**
```javascript
// Scans ALL completions, checks dates
for (let i = 1; i < 10000; i++) {
  const date = new Date(data[i][0]);
  if (date >= challengeStart && date <= challengeEnd) {
    // Process
  }
}
```

**After:**
```javascript
// Skips 95% of rows with simple string match
for (let i = 1; i < 10000; i++) {
  if (data[i][challengeIdCol] !== 'daily_dose_oct2025') {
    continue; // Fast skip
  }
  // Process
}
```

### Future Optimization (When Completions > 5,000 rows)

**Archival System:**

Create archive sheets for completed challenges:
```
Completions_daily_dose_oct2025
Completions_winter_warrior_dec2025
```

Move completions to archive when challenge ends:
```javascript
function archiveCompletedChallenge(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const completionsSheet = ss.getSheetByName('Completions');

  // Create archive sheet
  const archiveSheet = ss.insertSheet(`Completions_${challengeId}`);

  // Move rows with matching challenge_id
  // Delete from main Completions sheet
}
```

**Result:** Keeps Completions sheet under 1,000 rows permanently.

---

## Common Admin Workflows

### Starting a New Challenge

1. **Create challenge:**
   ```
   Menu: A8 Custom Menu → Create New Challenge
   - ID: winter_warrior_dec2025
   - Name: Winter Warrior Challenge
   - Start: 12/1/2025
   - End: 12/31/2025
   - Goal: 600
   ```

2. **Assign teams:**
   - Option A: Manually add rows to Challenge_Teams sheet
   - Option B: Run script:
   ```javascript
   const teams = {
     'megan': {teamName: 'Polar Bears', teamColor: '#00BFFF'},
     'suzied': {teamName: 'Snow Leopards', teamColor: '#F0F8FF'},
     // ... all users
   };
   bulkAssignTeams('winter_warrior_dec2025', teams);
   ```

3. **Activate challenge:**
   ```
   Menu: A8 Custom Menu → Set Active Challenge
   Enter: winter_warrior_dec2025
   ```

4. **Announce to team:**
   - Send Slack message or email
   - Users refresh app → see new challenge automatically

### Viewing Historical Challenge Stats

```
Menu: A8 Custom Menu → View Challenge Stats
Enter: daily_dose_oct2025
```

Shows:
- Total completions
- Unique participants
- Team breakdowns
- Workout type split

### Ending Current Challenge

```javascript
endChallenge('daily_dose_oct2025');
// Sets is_active = FALSE, status = 'completed'
```

---

## Migration Rollback Plan

If something goes wrong during migration:

1. **Restore from backup:**
   - Open backup copy of Google Sheet
   - File → Make a copy → Restore as active sheet

2. **Clear new columns:**
   ```javascript
   function clearMigration() {
     const ss = SpreadsheetApp.getActiveSpreadsheet();

     // Clear Workouts challenge_id
     const workouts = ss.getSheetByName('Workouts');
     const workoutsData = workouts.getDataRange().getValues();
     const challengeIdCol = workoutsData[0].indexOf('challenge_id');
     for (let i = 1; i < workoutsData.length; i++) {
       workouts.getRange(i + 1, challengeIdCol + 1).setValue('');
     }

     // Clear Completions challenge_id
     // Clear Users active_challenge_id
     // Clear Challenge_Teams sheet
   }
   ```

3. **Delete new sheets:**
   - Delete Challenges sheet
   - Delete Challenge_Teams sheet

---

## FAQ

### Q: What happens to users' total_workouts count when we switch challenges?

**A:** The `total_workouts` field in Users sheet becomes deprecated. Instead, we calculate stats on-demand from Completions filtered by challenge_id. Each user's workout count is challenge-specific.

If you want to preserve all-time stats, add a new function:
```javascript
function getUserAllTimeStats(userId) {
  // Count ALL completions for user (no challenge filter)
  // Returns total across all challenges
}
```

### Q: Can a user be on different teams in overlapping challenges?

**A:** Yes! Challenge_Teams is keyed by (challenge_id, user_id), so:
- User "megan" can be on "Team Red" in Challenge A
- Same user "megan" can be on "Team Blue" in Challenge B
- If both challenges are active simultaneously, the active_challenge_id determines which team displays

### Q: What if we want to archive old workout data but keep it accessible?

**A:** Two options:
1. **Keep in main sheet with challenge_id** - Query performance stays good via filtering
2. **Move to archive sheets** - Copy completions to `Completions_<challenge_id>` and delete from main sheet

Recommendation: Start with option 1, only implement option 2 if Completions grows beyond 10,000 rows.

### Q: Can users view their stats from past challenges?

**A:** Not in the current plan, but easy to add:

**Frontend (Me page):**
```javascript
// Add "Past Challenges" section
const pastChallenges = ['daily_dose_oct2025', 'winter_warrior_dec2025'];
pastChallenges.forEach(challengeId => {
  const stats = getUserStatsForChallenge(userId, challengeId);
  // Display: Challenge Name, Workouts Completed, Team
});
```

**Backend:**
```javascript
function getUserStatsForChallenge(userId, challengeId) {
  // Filter Completions by userId AND challengeId
  // Return: total workouts, team name, challenge name
}
```

### Q: How do we handle timezone changes when switching challenges?

**A:** The timezone setting in Settings sheet is app-wide and affects all challenges. If you need per-challenge timezones (unlikely), add a `timezone` column to Challenges sheet and update date comparison logic.

### Q: Can we run challenges with different goal structures (e.g., distance instead of count)?

**A:** Current schema supports count-based goals only. To add distance/time goals:
1. Add `goal_type` column to Challenges: "count", "distance", "time"
2. Add `goal_unit` column: "workouts", "miles", "minutes"
3. Modify `other_workout_details` to store distance/time values
4. Update goal progress calculation to sum values instead of count rows

---

## Files Summary

### New Files Created
1. `MULTI_CHALLENGE_IMPLEMENTATION_PLAN.md` (this document)
2. `backend/MigrationScripts.gs` - One-time migration functions
3. `backend/AdminChallenges.gs` - Challenge management functions

### Files Modified
1. `.gitignore` - Add SampleData/
2. `backend/Code.gs` - Update all core functions
3. `backend/menu.gs` - Add admin menu items
4. `index.html` - Update API response references

### Google Sheets Modified
1. **New Sheets:**
   - Challenges (7 columns)
   - Challenge_Teams (4 columns)

2. **Modified Sheets:**
   - Workouts: +1 column (challenge_id)
   - Completions: +1 column (challenge_id)
   - Users: +1 column (active_challenge_id)
   - Settings: Remove 4 keys

---

## Timeline & Effort

| Phase | Task | Time | Complexity |
|-------|------|------|------------|
| 1 | Update .gitignore | 5 min | Low |
| 2 | Create new sheets | 30 min | Low |
| 3 | Create migration scripts | 30 min | Medium |
| 4 | Run migration | 15 min | Low |
| 5 | Update backend functions | 2-3 hours | High |
| 6 | Update frontend | 30 min | Low |
| 7 | Create admin functions | 1 hour | Medium |
| 8 | Testing | 1 hour | Medium |
| **Total** | | **~6 hours** | |

---

## Success Criteria

✅ Users can log workouts year-round (with or without active challenge)
✅ Multiple challenges can exist (past, active, upcoming)
✅ Teams change per challenge without data loss
✅ Performance stays fast as Completions table grows (challenge_id filtering)
✅ Admin can create/activate/end challenges via menu
✅ Historical challenge data is preserved and queryable
✅ Frontend displays correct challenge name, goal, team assignments
✅ Backward compatible with October challenge data

---

## Next Steps

**When ready to implement:**

1. Read this document thoroughly
2. Make backup of Google Sheet
3. Follow phases 1-8 in order
4. Test each phase before proceeding
5. Deploy to production after full testing

**Questions?** Review FAQ section or consult CLAUDE.md for original architecture details.

---

*Document End*