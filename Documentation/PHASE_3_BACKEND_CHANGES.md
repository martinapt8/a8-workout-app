# Phase 3: Backend Code Changes

**Purpose**: Update Code.gs to support multi-challenge architecture
**File**: backend/Code.gs
**Estimated Time**: 3 hours
**Status**: Implementation Guide

---

## Overview of Changes

This document outlines all required changes to Code.gs. Changes are organized in three sections:

1. **NEW FUNCTIONS** - Add these at the end of Code.gs
2. **MODIFIED FUNCTIONS** - Update existing functions
3. **API ENDPOINT UPDATES** - Update doGet/doPost

---

## SECTION 1: NEW HELPER FUNCTIONS

Add these functions at the END of Code.gs (before any test functions):

```javascript
/**
 * ============================================
 * MULTI-CHALLENGE HELPER FUNCTIONS
 * Added: October 30, 2025
 * ============================================
 */

/**
 * Get active challenge from Challenges sheet
 * @param {Spreadsheet} ss - Spreadsheet object
 * @returns {Object|null} Active challenge or null if no active challenge
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
        is_active: true,
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
 * @returns {Object|null} Team info {team_name, team_color} or null
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

  const userIdLower = userId.toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {
    const rowChallengeId = data[i][headerMap['challenge_id']];
    const rowUserId = data[i][headerMap['user_id']];

    if (rowChallengeId === challengeId &&
        rowUserId && rowUserId.toString().toLowerCase().trim() === userIdLower) {
      return {
        team_name: data[i][headerMap['team_name']],
        team_color: data[i][headerMap['team_color']]
      };
    }
  }

  // CRITICAL FIX: Auto-assign user to challenge if not found
  // This handles new users joining mid-challenge
  const userInfo = getUserInfo(ss, userId);
  if (userInfo && challengeId) {
    Logger.log(`Auto-assigning user ${userId} to challenge ${challengeId} with default team`);

    // Add to Challenge_Teams sheet
    teamsSheet.appendRow([
      challengeId,
      userId,
      userInfo.team_name,
      userInfo.team_color
    ]);

    return {
      team_name: userInfo.team_name,
      team_color: userInfo.team_color
    };
  }

  return null;
}

/**
 * Get user's stats for all challenges (for Me page history)
 * @param {Spreadsheet} ss - Spreadsheet object
 * @param {string} userId - User ID
 * @returns {Array} Array of {challenge_id, challenge_name, workout_count, team_name, start_date, end_date}
 */
function getUserAllChallengeStats(ss, userId) {
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const userIdLower = userId.toLowerCase().trim();
  const statsByChallenge = {};

  // Count completions by challenge
  for (let i = 1; i < data.length; i++) {
    const rowUserId = data[i][headerMap['user_id']];
    const challengeId = data[i][headerMap['challenge_id']];

    if (rowUserId && rowUserId.toString().toLowerCase().trim() === userIdLower) {
      if (!statsByChallenge[challengeId]) {
        statsByChallenge[challengeId] = {
          challenge_id: challengeId,
          workout_count: 0
        };
      }
      statsByChallenge[challengeId].workout_count++;
    }
  }

  // Enrich with challenge details
  const results = [];
  for (const challengeId in statsByChallenge) {
    if (challengeId === 'year_round') {
      results.push({
        challenge_id: 'year_round',
        challenge_name: 'Year-Round Workouts',
        workout_count: statsByChallenge[challengeId].workout_count,
        team_name: null,
        start_date: null,
        end_date: null
      });
    } else {
      const challenge = getChallengeById(ss, challengeId);
      const teamInfo = getUserTeamForChallenge(ss, userId, challengeId);

      if (challenge) {
        results.push({
          challenge_id: challengeId,
          challenge_name: challenge.challenge_name,
          workout_count: statsByChallenge[challengeId].workout_count,
          team_name: teamInfo ? teamInfo.team_name : null,
          start_date: formatDate(challenge.start_date, ss),
          end_date: formatDate(challenge.end_date, ss)
        });
      }
    }
  }

  // Sort by start_date (most recent first)
  results.sort((a, b) => {
    if (!a.start_date) return 1; // year_round goes to end
    if (!b.start_date) return -1;
    return new Date(b.start_date) - new Date(a.start_date);
  });

  return results;
}
```

---

## SECTION 2: MODIFY EXISTING FUNCTIONS

### 2.1 Update `getUserDashboardData(userId)`

**Location**: Line ~149

**FIND:**
```javascript
function getUserDashboardData(userId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get settings
    const settings = getSettings(ss);

    // Get user info
    const user = getUserInfo(ss, userId);
    if (!user) {
      return { error: 'User not found' };
    }

    // Get active workout for today
    const activeWorkout = getActiveWorkout(ss);

    // Check if user completed today
    const completedToday = hasCompletedToday(ss, userId);

    // Get goal progress
    const goalProgress = getGoalProgress(ss);

    return {
      user: user,
      settings: settings,
      activeWorkout: activeWorkout,
      completedToday: completedToday,
      goalProgress: goalProgress
    };
  } catch (e) {
    console.error('Error in getUserDashboardData:', e);
    return { error: 'A server error occurred while fetching data: ' + e.toString() };
  }
}
```

**REPLACE WITH:**
```javascript
function getUserDashboardData(userId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get user info
    const user = getUserInfo(ss, userId);
    if (!user) {
      return { error: 'User not found' };
    }

    // Get active challenge (replaces getSettings for challenge data)
    const activeChallenge = getActiveChallenge(ss);

    // Handle no active challenge (off-season mode)
    if (!activeChallenge) {
      return {
        error: 'No active challenge',
        message: 'The app is currently in off-season. You can still log "Other Workouts" to track your year-round fitness!',
        user: user,
        challenge: null,
        activeWorkout: null,
        completedToday: false,
        goalProgress: null
      };
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
      challenge: activeChallenge, // RENAMED from "settings"
      activeWorkout: activeWorkout,
      completedToday: completedToday,
      goalProgress: goalProgress
    };
  } catch (e) {
    console.error('Error in getUserDashboardData:', e);
    return { error: 'A server error occurred while fetching data: ' + e.toString() };
  }
}
```

---

### 2.2 Update `getActiveWorkout(ss)`

**Location**: Line ~249

**FIND:**
```javascript
function getActiveWorkout(ss) {
```

**REPLACE WITH:**
```javascript
function getActiveWorkout(ss, challengeId) {
```

**ADD INSIDE FUNCTION** (after line ~259, before the for loop):
```javascript
  // If no challengeId provided, return null (off-season)
  if (!challengeId) {
    return null;
  }
```

**ADD INSIDE FOR LOOP** (after line ~259, as first line inside loop):
```javascript
    // ADDED: Filter by challenge_id
    if (headers['challenge_id'] !== undefined && data[i][headers['challenge_id']] !== challengeId) {
      continue;
    }
```

---

### 2.3 Update `hasCompletedToday(ss, userId)`

**Location**: Search for `function hasCompletedToday`

**FIND:**
```javascript
function hasCompletedToday(ss, userId) {
  const settings = getSettings(ss);
  const timezone = settings.timezone || 'America/New_York';
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  today.setHours(0, 0, 0, 0);

  return hasCompletedOnDate(ss, userId, today);
}
```

**REPLACE WITH:**
```javascript
function hasCompletedToday(ss, userId, challengeId) {
  const settings = getSettings(ss);
  const timezone = settings.timezone || 'America/New_York';
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  today.setHours(0, 0, 0, 0);

  return hasCompletedOnDate(ss, userId, today, challengeId);
}
```

---

### 2.4 Update `hasCompletedOnDate(ss, userId, targetDate)`

**Location**: Search for `function hasCompletedOnDate`

**FIND:**
```javascript
function hasCompletedOnDate(ss, userId, targetDate) {
```

**REPLACE WITH:**
```javascript
function hasCompletedOnDate(ss, userId, targetDate, challengeId) {
```

**ADD INSIDE FOR LOOP** (as first filter):
```javascript
    const rowChallengeId = data[i][headerMap['challenge_id']];
    const rowUserId = data[i][headerMap['user_id']];

    // Filter by user and challenge
    if (rowUserId && rowUserId.toString().toLowerCase().trim() === userId.toLowerCase().trim() &&
        rowChallengeId === challengeId) {
      // ... existing date comparison logic
    }
```

---

### 2.5 Update `getGoalProgress(ss)`

**Location**: Search for `function getGoalProgress`

**FIND:**
```javascript
function getGoalProgress(ss) {
```

**REPLACE WITH:**
```javascript
function getGoalProgress(ss, challengeId) {
```

**REPLACE ENTIRE FUNCTION** with:
```javascript
function getGoalProgress(ss, challengeId) {
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  // Handle no challenge (off-season mode)
  if (!challengeId) {
    // Show year_round stats
    let yearRoundCount = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][headerMap['challenge_id']] === 'year_round') {
        yearRoundCount++;
      }
    }

    return {
      total_completions: yearRoundCount,
      total_goal: null,
      percentage: null,
      team_totals: {},
      recent_completions: [],
      year_round_mode: true
    };
  }

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

      let workoutDescription;
      if (workoutId === 'Other Workout') {
        workoutDescription = 'logged a workout';
      } else if (workoutId === 'AI Workout') {
        workoutDescription = 'completed an AI workout';
      } else {
        workoutDescription = `completed ${workoutId}`;
      }

      recentCompletions.push({
        user: displayName,
        workout: workoutDescription,
        timestamp: formatDate(new Date(timestamp), ss)
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

---

### 2.6 Update `markWorkoutComplete(userId, workoutType, workoutDetails, completionDate)`

**Location**: Search for `function markWorkoutComplete`

**ADD AT START OF FUNCTION** (after const ss = ...):
```javascript
  // Get active challenge
  const activeChallenge = getActiveChallenge(ss);

  // Allow year-round logging even without active challenge
  const challengeId = activeChallenge ? activeChallenge.challenge_id : 'year_round';
```

**UPDATE TEAM LOOKUP** (replace existing team lookup logic):
```javascript
  // Get user's team for this challenge
  let teamName = user.team_name; // Fallback
  if (activeChallenge) {
    const userTeam = getUserTeamForChallenge(ss, userId, activeChallenge.challenge_id);
    if (userTeam) {
      teamName = userTeam.team_name;
    }
  }
```

**UPDATE hasCompletedOnDate CALL**:
```javascript
  // FIND:
  if (hasCompletedOnDate(ss, userId, targetTimestamp)) {

  // REPLACE WITH:
  if (hasCompletedOnDate(ss, userId, targetTimestamp, challengeId)) {
```

**UPDATE appendRow CALL** (add challengeId as 6th column):
```javascript
  // FIND:
  completionsSheet.appendRow([
    timestamp,
    userId,
    workoutId,
    teamName,
    workoutDetails || ''
  ]);

  // REPLACE WITH:
  completionsSheet.appendRow([
    timestamp,
    userId,
    workoutId,
    teamName,
    workoutDetails || '',
    challengeId  // NEW COLUMN
  ]);
```

---

### 2.7 Update `getUserCompletionHistory(userId)`

**Location**: Search for `function getUserCompletionHistory`

**FIND:**
```javascript
function getUserCompletionHistory(userId) {
```

**REPLACE WITH:**
```javascript
function getUserCompletionHistory(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get active challenge
  const activeChallenge = getActiveChallenge(ss);

  // If no active challenge, return empty array
  if (!activeChallenge) {
    return [];
  }

  return getUserCompletionHistoryForChallenge(userId, activeChallenge.challenge_id);
}

/**
 * Get user completion history for a specific challenge
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @returns {Array} Array of dates (YYYY-MM-DD format)
 */
function getUserCompletionHistoryForChallenge(userId, challengeId) {
```

**UPDATE FILTER LOGIC** (inside for loop):
```javascript
    const rowUserId = data[i][headerMap['user_id']];
    const rowChallengeId = data[i][headerMap['challenge_id']];

    // Filter by user and challenge
    if (rowUserId && rowUserId.toString().toLowerCase().trim() === userId.toLowerCase().trim() &&
        rowChallengeId === challengeId) {
      // ... existing date logic
    }
```

---

### 2.8 Update `getAllWorkouts()`

**Location**: Search for `function getAllWorkouts`

**FIND:**
```javascript
function getAllWorkouts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
```

**REPLACE WITH:**
```javascript
function getAllWorkouts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get active challenge
  const activeChallenge = getActiveChallenge(ss);

  // If no active challenge, return empty array
  if (!activeChallenge) {
    return [];
  }

  return getAllWorkoutsForChallenge(activeChallenge.challenge_id);
}

/**
 * Get all workouts for a specific challenge
 * @param {string} challengeId - Challenge ID
 * @returns {Array} Array of workout objects
 */
function getAllWorkoutsForChallenge(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
```

**ADD FILTER** (inside for loop):
```javascript
    const workoutId = data[i][headers['workout_id']];
    const rowChallengeId = data[i][headers['challenge_id']];

    // Skip empty rows
    if (!workoutId) continue;

    // Filter by challenge
    if (challengeId && rowChallengeId !== challengeId) {
      continue;
    }
```

---

### 2.9 Update API Endpoints in `doGet(e)`

**Location**: Line ~28-44

**UPDATE getGoalProgress case**:
```javascript
      case 'getGoalProgress':
        const ss1 = SpreadsheetApp.getActiveSpreadsheet();
        const activeChallenge1 = getActiveChallenge(ss1);
        const challengeId1 = activeChallenge1 ? activeChallenge1.challenge_id : null;
        result = getGoalProgress(ss1, challengeId1);
        break;
```

**UPDATE getUserCompletionHistory case**:
```javascript
      case 'getUserCompletionHistory':
        const historyUserId = e.parameter.userId;
        if (!historyUserId) {
          result = { error: 'Missing userId parameter' };
        } else {
          result = getUserCompletionHistory(historyUserId);
        }
        break;
```

**ADD NEW CASE for getUserAllChallengeStats**:
```javascript
      case 'getUserAllChallengeStats':
        const statsUserId = e.parameter.userId;
        if (!statsUserId) {
          result = { error: 'Missing userId parameter' };
        } else {
          const ss2 = SpreadsheetApp.getActiveSpreadsheet();
          result = getUserAllChallengeStats(ss2, statsUserId);
        }
        break;
```

---

## SECTION 3: TESTING FUNCTIONS

Add these test functions at the very end of Code.gs:

```javascript
/**
 * ============================================
 * TESTING FUNCTIONS (Run in Apps Script Editor)
 * ============================================
 */

/**
 * Test getUserDashboardData with active challenge
 */
function testGetUserDashboard() {
  const result = getUserDashboardData('martin'); // Replace with your test user
  Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Test off-season mode (set all challenges to is_active = FALSE first)
 */
function testOffSeasonMode() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeChallenge = getActiveChallenge(ss);

  if (activeChallenge) {
    Logger.log('Active challenge found: ' + activeChallenge.challenge_name);
    Logger.log('Set is_active = FALSE in Challenges sheet to test off-season mode');
  } else {
    Logger.log('Off-season mode active');
    const result = getUserDashboardData('martin');
    Logger.log(JSON.stringify(result, null, 2));
  }
}

/**
 * Test getUserAllChallengeStats
 */
function testGetUserAllChallengeStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = getUserAllChallengeStats(ss, 'martin'); // Replace with your test user
  Logger.log('Past Challenge Stats:');
  result.forEach(challenge => {
    Logger.log(`- ${challenge.challenge_name}: ${challenge.workout_count} workouts`);
  });
}
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Add all NEW FUNCTIONS from Section 1
- [ ] Update getUserDashboardData (2.1)
- [ ] Update getActiveWorkout signature and add filter (2.2)
- [ ] Update hasCompletedToday signature (2.3)
- [ ] Update hasCompletedOnDate signature and filter (2.4)
- [ ] Replace getGoalProgress (2.5)
- [ ] Update markWorkoutComplete (2.6)
- [ ] Update getUserCompletionHistory (2.7)
- [ ] Update getAllWorkouts (2.8)
- [ ] Update doGet API endpoints (2.9)
- [ ] Add testing functions (Section 3)
- [ ] Save Code.gs
- [ ] Run `testGetUserDashboard()` in Apps Script Editor
- [ ] Verify no errors in logs

---

## VERIFICATION

After making all changes:

1. **Open Apps Script Editor**
2. **Run**: `testGetUserDashboard()`
3. **Check Logs**: Should see dashboard data with "challenge" object (not "settings")
4. **Run**: `testGetUserAllChallengeStats()`
5. **Check Logs**: Should see past challenge stats

If errors occur:
- Check for typos in function names
- Verify all challenge_id filters are in place
- Ensure Challenge_Teams sheet exists and has data

---

*Last Updated: October 30, 2025*
