/**
 * Admin functions for managing challenges
 * Created: October 30, 2025
 * Purpose: Provide admin tools for multi-challenge management
 *
 * FEATURES:
 * - Create new challenges with validation
 * - Set active challenge (auto-deactivates others)
 * - Assign users to teams for specific challenges
 * - Bulk team assignments
 * - Get challenge statistics
 * - End/complete challenges
 */

/**
 * Create a new challenge with input validation
 * @param {string} challengeId - Unique identifier (e.g., "winter_warrior_dec2025")
 * @param {string} challengeName - Display name (e.g., "Winter Warrior Challenge")
 * @param {Date} startDate - Challenge start date
 * @param {Date} endDate - Challenge end date
 * @param {number} totalGoal - Target number of workouts
 * @param {boolean} setActive - Set as active challenge immediately (default: false)
 * @returns {string} The created challenge ID
 */
function createNewChallenge(challengeId, challengeName, startDate, endDate, totalGoal, setActive) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const challengesSheet = ss.getSheetByName('Challenges');

  if (!challengesSheet) {
    throw new Error('Challenges sheet not found. Run migration first.');
  }

  // VALIDATION: Input checks
  if (!challengeId || challengeId.trim() === '') {
    throw new Error('Challenge ID is required');
  }

  if (!challengeName || challengeName.trim() === '') {
    throw new Error('Challenge name is required');
  }

  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    throw new Error('Valid start date is required');
  }

  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    throw new Error('Valid end date is required');
  }

  if (startDate >= endDate) {
    throw new Error('Start date must be before end date');
  }

  if (!totalGoal || totalGoal <= 0) {
    throw new Error('Total goal must be a positive number');
  }

  // Check if challenge_id already exists
  const data = challengesSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === challengeId) {
      throw new Error(`Challenge with ID "${challengeId}" already exists`);
    }
  }

  // OPTIONAL WARNING: Check for overlapping dates
  const overlaps = [];
  for (let i = 1; i < data.length; i++) {
    const existingStart = new Date(data[i][2]);
    const existingEnd = new Date(data[i][3]);
    const existingName = data[i][1];

    if ((startDate >= existingStart && startDate <= existingEnd) ||
        (endDate >= existingStart && endDate <= existingEnd) ||
        (startDate <= existingStart && endDate >= existingEnd)) {
      overlaps.push(existingName);
    }
  }

  if (overlaps.length > 0) {
    Logger.log(`WARNING: New challenge overlaps with: ${overlaps.join(', ')}`);
  }

  // If setting as active, deactivate all other challenges
  if (setActive) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][6] === 'active') { // status column
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
    setActive ? 'active' : 'upcoming'
  ]);

  Logger.log(`✅ Created challenge: ${challengeName} (${challengeId})`);
  if (overlaps.length > 0) {
    Logger.log(`⚠️  Note: Overlaps with ${overlaps.length} existing challenge(s)`);
  }

  return challengeId;
}

/**
 * Set a challenge as active (deactivates all others)
 * @param {string} challengeId - Challenge ID to activate
 * @returns {boolean} True if successful
 */
function setActiveChallenge(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const challengesSheet = ss.getSheetByName('Challenges');

  if (!challengesSheet) {
    throw new Error('Challenges sheet not found');
  }

  const data = challengesSheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === challengeId) {
      // Activate this challenge
      challengesSheet.getRange(i + 1, 6).setValue('active'); // status
      found = true;
      Logger.log(`✅ Activated challenge: ${data[i][1]} (${challengeId})`);
    } else if (data[i][5] === 'active') {
      // Deactivate other challenges
      challengesSheet.getRange(i + 1, 6).setValue('completed');
      Logger.log(`Deactivated challenge: ${data[i][1]} (${data[i][0]})`);
    }
  }

  if (!found) {
    throw new Error(`Challenge "${challengeId}" not found`);
  }

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
 * Bulk assign all users to teams for a new challenge
 * @param {string} challengeId - Challenge ID
 * @param {Object} assignments - Object mapping userId to {teamName, teamColor}
 * Example: {'megan': {teamName: 'Red', teamColor: '#FF0000'}, 'alex': {teamName: 'Blue', teamColor: '#0000FF'}}
 * @returns {number} Number of users assigned
 */
function bulkAssignTeams(challengeId, assignments) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    throw new Error('Challenge_Teams sheet not found');
  }

  // Build array of rows to append (more efficient than individual calls)
  const rowsToAdd = [];
  const existingAssignments = teamsSheet.getDataRange().getValues();

  for (const userId in assignments) {
    const teamInfo = assignments[userId];

    // Check if already exists
    let exists = false;
    for (let i = 1; i < existingAssignments.length; i++) {
      if (existingAssignments[i][0] === challengeId &&
          existingAssignments[i][1].toLowerCase() === userId.toLowerCase()) {
        // Update existing
        teamsSheet.getRange(i + 1, 3).setValue(teamInfo.teamName);
        teamsSheet.getRange(i + 1, 4).setValue(teamInfo.teamColor);
        exists = true;
        break;
      }
    }

    if (!exists) {
      rowsToAdd.push([challengeId, userId, teamInfo.teamName, teamInfo.teamColor]);
    }
  }

  // Batch append all new assignments
  if (rowsToAdd.length > 0) {
    const lastRow = teamsSheet.getLastRow();
    teamsSheet.getRange(lastRow + 1, 1, rowsToAdd.length, 4).setValues(rowsToAdd);
  }

  const totalAssigned = Object.keys(assignments).length;
  Logger.log(`✅ Bulk assigned ${totalAssigned} users to teams for ${challengeId}`);
  Logger.log(`   - ${rowsToAdd.length} new assignments`);
  Logger.log(`   - ${totalAssigned - rowsToAdd.length} updated assignments`);

  return totalAssigned;
}

/**
 * Get all active users for bulk team assignment
 * @returns {Array} Array of user IDs
 */
function getAllActiveUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];

  const userIdCol = headers.indexOf('user_id');
  const activeUserCol = headers.indexOf('active_user');

  const activeUsers = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][activeUserCol] === true) {
      activeUsers.push(data[i][userIdCol]);
    }
  }

  return activeUsers;
}

/**
 * Copy team assignments from one challenge to another
 * Useful when starting a new challenge with same teams
 * @param {string} fromChallengeId - Source challenge ID
 * @param {string} toChallengeId - Destination challenge ID
 * @returns {number} Number of assignments copied
 */
function copyTeamAssignments(fromChallengeId, toChallengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    throw new Error('Challenge_Teams sheet not found');
  }

  const data = teamsSheet.getDataRange().getValues();
  const assignments = {};

  // Collect assignments from source challenge
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === fromChallengeId) {
      const userId = data[i][1];
      const teamName = data[i][2];
      const teamColor = data[i][3];

      assignments[userId] = { teamName, teamColor };
    }
  }

  if (Object.keys(assignments).length === 0) {
    Logger.log(`No team assignments found for challenge: ${fromChallengeId}`);
    return 0;
  }

  // Apply to destination challenge
  return bulkAssignTeams(toChallengeId, assignments);
}

/**
 * Mark a challenge as completed (but keep data)
 * @param {string} challengeId - Challenge ID to end
 * @returns {boolean} True if successful
 */
function endChallenge(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const challengesSheet = ss.getSheetByName('Challenges');

  if (!challengesSheet) {
    throw new Error('Challenges sheet not found');
  }

  const data = challengesSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === challengeId) {
      challengesSheet.getRange(i + 1, 6).setValue('completed'); // status
      Logger.log(`✅ Ended challenge: ${data[i][1]} (${challengeId})`);
      return true;
    }
  }

  throw new Error(`Challenge "${challengeId}" not found`);
}

/**
 * Get comprehensive stats for a challenge
 * @param {string} challengeId - Challenge ID
 * @returns {Object} Challenge statistics
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
    challenge_id: challengeId,
    total_completions: 0,
    unique_participants: new Set(),
    team_totals: {},
    workout_types: {
      prescribed: 0,
      other: 0,
      ai: 0
    },
    daily_breakdown: {}
  };

  for (let i = 1; i < data.length; i++) {
    if (data[i][headerMap['challenge_id']] === challengeId) {
      stats.total_completions++;

      const userId = data[i][headerMap['user_id']];
      stats.unique_participants.add(userId);

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

      // Daily breakdown
      const timestamp = new Date(data[i][headerMap['timestamp']]);
      const dateStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      stats.daily_breakdown[dateStr] = (stats.daily_breakdown[dateStr] || 0) + 1;
    }
  }

  stats.unique_participants = stats.unique_participants.size;

  return stats;
}

/**
 * Get list of all challenges
 * @returns {Array} Array of challenge objects
 */
function getAllChallenges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const challengesSheet = ss.getSheetByName('Challenges');

  if (!challengesSheet) {
    return [];
  }

  const data = challengesSheet.getDataRange().getValues();
  const challenges = [];

  for (let i = 1; i < data.length; i++) {
    challenges.push({
      challenge_id: data[i][0],
      challenge_name: data[i][1],
      start_date: data[i][2],
      end_date: data[i][3],
      total_goal: data[i][4],
      status: data[i][5]
    });
  }

  return challenges;
}

/**
 * EXAMPLE USAGE: Create December challenge
 * Customize this template for your own challenges
 */
function exampleCreateDecemberChallenge() {
  const challengeId = 'winter_warrior_dec2025';
  const challengeName = 'Winter Warrior Challenge';
  const startDate = new Date('12/1/2025');
  const endDate = new Date('12/31/2025');
  const totalGoal = 600;

  // Create challenge (but don't activate yet)
  createNewChallenge(challengeId, challengeName, startDate, endDate, totalGoal, false);

  // Option 1: Copy team assignments from previous challenge
  copyTeamAssignments('daily_dose_oct2025', challengeId);

  // Option 2: Create new team assignments
  const teamAssignments = {
    'megan': {teamName: 'Polar Bears', teamColor: '#00BFFF'},
    'suzied': {teamName: 'Snow Leopards', teamColor: '#F0F8FF'},
    // ... add all active users
  };

  // Uncomment to use Option 2:
  // bulkAssignTeams(challengeId, teamAssignments);

  Logger.log('✅ December challenge created!');
  Logger.log('Next steps:');
  Logger.log('1. Verify team assignments in Challenge_Teams sheet');
  Logger.log('2. Add workouts to Workouts sheet with challenge_id = "winter_warrior_dec2025"');
  Logger.log('3. When ready to launch, run: setActiveChallenge("winter_warrior_dec2025")');
}
