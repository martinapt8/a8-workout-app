// REST API entry point for GET requests
function doGet(e) {
  // Enable CORS for cross-origin requests from GitHub Pages
  const callback = e.parameter.callback;
  const action = e.parameter.action;

  // Create JSON output
  let output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  // Note: Google Apps Script Web Apps automatically handle CORS
  // No need to set headers manually

  try {
    let result;

    // Route to appropriate function based on action parameter
    switch(action) {
      case 'getDashboard':
        const userId = e.parameter.userId;
        if (!userId) {
          result = { error: 'Missing userId parameter' };
        } else {
          result = getUserDashboardData(userId);
        }
        break;

      case 'getGoalProgress':
        const ss1 = SpreadsheetApp.getActiveSpreadsheet();
        const activeChallenge1 = getActiveChallenge(ss1);
        const challengeId1 = activeChallenge1 ? activeChallenge1.challenge_id : null;
        result = getGoalProgress(ss1, challengeId1);
        break;

      case 'getAllWorkouts':
        result = getAllWorkouts();
        break;

      case 'getUserCompletionHistory':
        const historyUserId = e.parameter.userId;
        if (!historyUserId) {
          result = { error: 'Missing userId parameter' };
        } else {
          result = getUserCompletionHistory(historyUserId);
        }
        break;

      case 'getUserAllCompletions':
        const allCompletionsUserId = e.parameter.userId;
        if (!allCompletionsUserId) {
          result = { error: 'Missing userId parameter' };
        } else {
          const startDate = e.parameter.startDate || null;
          const endDate = e.parameter.endDate || null;
          result = getUserAllCompletions(allCompletionsUserId, startDate, endDate);
        }
        break;

      case 'getUserAllChallengeStats':
        const statsUserId = e.parameter.userId;
        if (!statsUserId) {
          result = { error: 'Missing userId parameter' };
        } else {
          const ss2 = SpreadsheetApp.getActiveSpreadsheet();
          result = getUserAllChallengeStats(ss2, statsUserId);
        }
        break;

      case 'generateAIWorkout':
        const time = e.parameter.time;
        const difficulty = e.parameter.difficulty;
        const equipment = e.parameter.equipment;

        if (!time || !difficulty || !equipment) {
          result = { error: 'Missing required parameters: time, difficulty, equipment' };
        } else {
          result = generateAIWorkout(time, difficulty, equipment);
        }
        break;

      case 'getRecentCompletionsAll':
        const ss3 = SpreadsheetApp.getActiveSpreadsheet();
        const limit = e.parameter.limit ? parseInt(e.parameter.limit) : 15;
        result = getRecentCompletionsAll(ss3, limit);
        break;

      default:
        result = { error: 'Invalid action parameter. Valid actions: getDashboard, getGoalProgress, getAllWorkouts, getUserCompletionHistory, getUserAllChallengeStats, generateAIWorkout, getRecentCompletionsAll' };
    }

    const jsonResponse = JSON.stringify(result);

    // Support JSONP if callback provided (for older browsers)
    if (callback) {
      output.setContent(callback + '(' + jsonResponse + ')');
    } else {
      output.setContent(jsonResponse);
    }

  } catch (error) {
    Logger.log('API Error in doGet: ' + error.toString());
    const errorResponse = JSON.stringify({ error: 'Server error: ' + error.toString() });
    output.setContent(callback ? callback + '(' + errorResponse + ')' : errorResponse);
  }

  return output;
}

// REST API entry point for POST requests
function doPost(e) {
  try {
    // Parse request body - handle form-encoded data (used to avoid CORS preflight)
    let requestData;

    if (e.parameter && e.parameter.payload) {
      // Data came as form-encoded with payload parameter
      requestData = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.type === 'application/json' && e.postData.contents) {
      // Fallback to JSON body if sent with proper content-type
      requestData = JSON.parse(e.postData.contents);
    } else {
      throw new Error('Unable to parse request. Expected form-encoded payload or JSON body.');
    }

    const action = requestData.action;

    let result;

    // Route to appropriate function
    switch(action) {
      case 'markWorkoutComplete':
        const userId = requestData.userId;
        const workoutType = requestData.workoutType;
        const workoutDetails = requestData.workoutDetails || '';
        const completionDate = requestData.completionDate || null;

        if (!userId || !workoutType) {
          result = { success: false, message: 'Missing required parameters: userId, workoutType' };
        } else {
          result = markWorkoutComplete(userId, workoutType, workoutDetails, completionDate);
        }
        break;

      case 'createSignup':
        const signupData = {
          email: requestData.email,
          userId: requestData.userId,
          displayName: requestData.displayName,
          fullName: requestData.fullName,
          preferredDuration: requestData.preferredDuration,
          equipment: requestData.equipment
        };
        result = createSignupRequest(signupData);
        break;

      default:
        result = { success: false, message: 'Invalid action parameter. Valid actions: markWorkoutComplete, createSignup' };
    }

    return createCORSResponse(result);

  } catch (error) {
    Logger.log('API Error in doPost: ' + error.toString());
    return createCORSResponse({
      success: false,
      message: 'Server error: ' + error.toString()
    });
  }
}

// Handle OPTIONS requests for CORS preflight
function doOptions(e) {
  return createCORSResponse({});
}

// Helper function to create CORS-enabled response
function createCORSResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);

  // CORS is handled by Google Apps Script when deployed with:
  // - Execute as: Me (or User accessing the web app)
  // - Who has access: Anyone
  // The doOptions() function handles preflight requests automatically

  return output;
}

// Get main dashboard data for a user
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
      // Get lifetime workout count for off-season mode
      const lifetimeWorkouts = getLifetimeWorkoutCount(ss, userId);

      return {
        offSeasonMode: true,
        message: 'The app is currently in off-season. You can still log "Other Workouts" to track your year-round fitness!',
        user: {
          user_id: user.user_id,
          display_name: user.display_name,
          team_name: null,
          team_color: null,
          total_workouts: user.total_workouts || 0,
          lifetime_workouts: lifetimeWorkouts,
          last_completed: user.last_completed || null,
          join_date: user.join_date || null
        },
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

    // Get lifetime workout count
    const lifetimeWorkouts = getLifetimeWorkoutCount(ss, userId);

    return {
      user: {
        user_id: user.user_id,
        display_name: user.display_name,
        team_name: userTeam ? userTeam.team_name : null,
        team_color: userTeam ? userTeam.team_color : null,
        total_workouts: user.total_workouts || 0,
        lifetime_workouts: lifetimeWorkouts,
        last_completed: user.last_completed || null,
        join_date: user.join_date || null
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

// New function for google.script.run to avoid serialization issues
function getUserDashboardDataAsString(userId) {
  const data = getUserDashboardData(userId);
  return JSON.stringify(data);
}

// Get settings from Settings sheet
function getSettings(ss) {
  const settingsSheet = ss.getSheetByName('Settings');
  const data = settingsSheet.getDataRange().getValues();

  const settings = {};
  for (let i = 1; i < data.length; i++) { // Skip header
    if (data[i][0]) {
      settings[data[i][0]] = data[i][1];
    }
  }

  return settings;
}

// Get user info from Users sheet
function getUserInfo(ss, userId) {
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = getHeaderMapping(usersSheet);

  // Find user (case-insensitive)
  const userIdLower = userId.toLowerCase().trim();
  for (let i = 1; i < data.length; i++) { // Skip header
    if (data[i][headers['user_id']] && data[i][headers['user_id']].toString().toLowerCase().trim() === userIdLower) {
      return {
        user_id: data[i][headers['user_id']],
        display_name: data[i][headers['display_name']],
        total_workouts: data[i][headers['total_workouts']] || 0,
        last_completed: data[i][headers['last_completed']] ? formatDate(data[i][headers['last_completed']], ss) : null,
        join_date: data[i][headers['join_date']] ? formatDate(data[i][headers['join_date']], ss) : null
      };
    }
  }

  return null;
}

// Get lifetime workout count across all challenges for a user
function getLifetimeWorkoutCount(ss, userId) {
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const userIdLower = userId.toLowerCase().trim();
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    const rowUserId = data[i][headerMap['user_id']];
    if (rowUserId && rowUserId.toString().toLowerCase().trim() === userIdLower) {
      count++;
    }
  }

  return count;
}

// Get header mapping for any sheet
function getHeaderMapping(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const mapping = {};

  headers.forEach((header, index) => {
    if (header) {
      mapping[header.toString().toLowerCase().trim()] = index;
    }
  });

  return mapping;
}

// Get header mapping for Workouts sheet (kept for compatibility)
function getWorkoutsHeaderMapping(workoutsSheet) {
  return getHeaderMapping(workoutsSheet);
}

// Get the active workout based on today's date
function getActiveWorkout(ss, challengeId) {
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = getWorkoutsHeaderMapping(workoutsSheet);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If no challengeId provided, return null (off-season)
  if (!challengeId) {
    return null;
  }

  let activeWorkout = null;

  for (let i = 1; i < data.length; i++) { // Skip header
    // ADDED: Filter by challenge_id
    if (headers['challenge_id'] !== undefined && data[i][headers['challenge_id']] !== challengeId) {
      continue;
    }

    const startDate = new Date(data[i][headers['start_date']]);
    const endDate = new Date(data[i][headers['end_date']]);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (today >= startDate && today <= endDate) {
      // Build workout object
      const workout = {
        workout_id: data[i][headers['workout_id']],
        workout_name: data[i][headers['workout_name']],
        start_date: formatDate(startDate, ss),
        end_date: formatDate(endDate, ss),
        instructions: data[i][headers['instructions']] || '',
        exercises: []
      };

      // Add exercises (up to 10)
      for (let j = 1; j <= 10; j++) {
        const movementKey = `movement_${j}`;
        const repsKey = `reps_${j}`;
        const altKey = `alt_${j}`;

        if (headers[movementKey] !== undefined && data[i][headers[movementKey]]) {
          // Extract hyperlink if present
          let movementText = data[i][headers[movementKey]];
          let movementUrl = null;

          try {
            // Get the cell's rich text value to extract hyperlink
            const richTextValue = workoutsSheet.getRange(i + 1, headers[movementKey] + 1).getRichTextValue();
            if (richTextValue) {
              // Check if the cell has a hyperlink
              const runs = richTextValue.getRuns();
              if (runs && runs.length > 0) {
                // Get the URL from the first run (typically the entire cell is linked)
                const linkUrl = runs[0].getLinkUrl();
                if (linkUrl) {
                  movementUrl = linkUrl;
                }
              }
            }
          } catch (e) {
            // If getRichTextValue fails, continue without the link
            console.log('Could not extract hyperlink for movement:', e);
          }

          workout.exercises.push({
            movement: movementText,
            movement_url: movementUrl,
            reps: data[i][headers[repsKey]] || '',
            alternative: data[i][headers[altKey]] || ''
          });
        }
      }

      activeWorkout = workout; // Will use the newest if multiple overlap
    }
  }

  return activeWorkout;
}

// Check if user has completed workout today
function hasCompletedToday(ss, userId, challengeId) {
  const settings = getSettings(ss);
  const timezone = settings.timezone || 'America/New_York';
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  today.setHours(0, 0, 0, 0);

  return hasCompletedOnDate(ss, userId, today, challengeId);
}

// Check if user has completed workout on a specific date
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
    if (rowUserId && rowUserId.toString().toLowerCase().trim() === userId.toLowerCase().trim() &&
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

// Get overall goal progress
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
    return {
      total_completions: 0,
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

      // Since we're already filtering by challengeId, all workouts here are challenge workouts
      const workoutDescription = 'completed a challenge workout!';

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

// Get recent completions across all completions (for agency-wide activity feed - works year-round)
function getRecentCompletionsAll(ss, limit) {
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const maxResults = limit || 15;  // Default to 15 recent completions
  const recentCompletions = [];

  // Reverse iteration to get most recent completions first
  for (let i = data.length - 1; i >= 1 && recentCompletions.length < maxResults; i--) {
    const userId = data[i][headerMap['user_id']];
    const timestamp = data[i][headerMap['timestamp']];
    const workoutId = data[i][headerMap['workout_id']];
    const otherWorkoutDetails = data[i][headerMap['other_workout_details']];

    // Get user display name
    const userInfo = getUserInfo(ss, userId);
    const displayName = userInfo ? userInfo.display_name : userId;

    // Determine workout description
    let workoutDescription;
    if (workoutId === 'AI Workout') {
      workoutDescription = 'completed an AI Workout';
    } else if (workoutId === 'Other Workout') {
      // Show brief description if available
      if (otherWorkoutDetails && otherWorkoutDetails.trim()) {
        workoutDescription = otherWorkoutDetails;
      } else {
        workoutDescription = 'logged a workout';
      }
    } else {
      // Prescribed workout - try to get workout name
      const workout = getWorkoutById(ss, workoutId);
      if (workout && workout.workout_name) {
        workoutDescription = workout.workout_name;
      } else {
        workoutDescription = 'completed a workout';
      }
    }

    recentCompletions.push({
      user: displayName,
      workout: workoutDescription,
      timestamp: formatDate(new Date(timestamp), ss)
    });
  }

  return recentCompletions;
}

// Helper function to get workout by ID
function getWorkoutById(ss, workoutId) {
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = data[0];

  const headerMap = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  for (let i = 1; i < data.length; i++) {
    if (data[i][headerMap['workout_id']] === workoutId) {
      return {
        workout_id: data[i][headerMap['workout_id']],
        workout_name: data[i][headerMap['workout_name']]
      };
    }
  }

  return null;
}

// Mark workout as complete
function markWorkoutComplete(userId, workoutType, workoutDetails, completionDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Get active challenge
  const activeChallenge = getActiveChallenge(ss);

  // Allow year-round logging even without active challenge
  const challengeId = activeChallenge ? activeChallenge.challenge_id : 'year_round';

  // Get timezone from settings
  const settings = getSettings(ss);
  const appTimezone = settings.timezone || Session.getScriptTimeZone();

  // If no completion date provided, use today
  let targetDate;
  if (completionDate) {
    // Parse the date string in the app's timezone to avoid timezone confusion
    // completionDate comes as "YYYY-MM-DD" from the date input
    const dateParts = completionDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
    const day = parseInt(dateParts[2]);

    // Create date in app's timezone by using a time in the middle of the day
    targetDate = new Date(year, month, day, 18, 0, 0, 0); // 6 PM in local timezone

    // Validate date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDateOnly = new Date(year, month, day, 0, 0, 0, 0);
    if (targetDateOnly > today) {
      return { success: false, message: 'Cannot log workouts in the future!' };
    }

    // Check if already completed on this specific date
    if (hasCompletedOnDate(ss, userId, targetDate, challengeId)) {
      const dateStr = Utilities.formatDate(targetDate, appTimezone, 'MMM d, yyyy');
      return { success: false, message: `You already logged a workout for ${dateStr}!` };
    }
  } else {
    targetDate = new Date();
    // Check if already completed today (original behavior)
    if (hasCompletedToday(ss, userId, challengeId)) {
      return { success: false, message: 'Already completed today!' };
    }
  }

  // Get user info
  const user = getUserInfo(ss, userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  // Get user's team for this challenge
  let teamName = null;
  if (activeChallenge) {
    const userTeam = getUserTeamForChallenge(ss, userId, activeChallenge.challenge_id);
    if (userTeam) {
      teamName = userTeam.team_name;
    }
  }

  // Determine workout_id
  let workoutId;
  if (workoutType === 'ai') {
    workoutId = 'AI Workout';
  } else if (workoutType === 'other') {
    workoutId = 'Other Workout';
  } else {
    const activeWorkout = getActiveWorkout(ss, challengeId);
    if (!activeWorkout) {
      return { success: false, message: 'No active workout today' };
    }
    workoutId = activeWorkout.workout_id;
  }

  // Add completion record with optional workout details
  const completionsSheet = ss.getSheetByName('Completions');

  // Use the timestamp we already created (either current time or 6 PM on target date)
  const timestamp = targetDate;

  completionsSheet.appendRow([
    timestamp,
    userId,
    workoutId,
    teamName,
    workoutDetails || '', // Add the workout details in column E
    challengeId // Add challenge_id in column F
  ]);

  // Update user stats
  updateUserStats(ss, userId);

  // Force spreadsheet to save all pending changes
  SpreadsheetApp.flush();

  // Return simple success message. Client will refetch data.
  return {
    success: true,
    message: 'Workout completed!'
  };
}

// Update user's total workouts and last completed date
function updateUserStats(ss, userId) {
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = getHeaderMapping(usersSheet);

  Logger.log('DEBUG updateUserStats - Headers mapping: ' + JSON.stringify(headers));
  Logger.log('DEBUG updateUserStats - Looking for userId: ' + userId);

  // Find user row
  const userIdLower = userId.toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers['user_id']] && data[i][headers['user_id']].toString().toLowerCase().trim() === userIdLower) {
      // Get the actual user_id from the sheet (with correct casing)
      const actualUserId = data[i][headers['user_id']];
      Logger.log('DEBUG updateUserStats - Found user at row: ' + (i + 1));

      // Get active challenge
      const activeChallenge = getActiveChallenge(ss);
      const challengeId = activeChallenge ? activeChallenge.challenge_id : null;
      Logger.log('DEBUG updateUserStats - Active challenge ID: ' + challengeId);

      const completionsSheet = ss.getSheetByName('Completions');
      const completionsData = completionsSheet.getDataRange().getValues();
      const completionsHeaders = completionsData[0];

      // Create header mapping for Completions
      const completionsHeaderMap = {};
      for (let k = 0; k < completionsHeaders.length; k++) {
        completionsHeaderMap[completionsHeaders[k]] = k;
      }
      Logger.log('DEBUG updateUserStats - Completions headers: ' + JSON.stringify(completionsHeaderMap));

      let totalWorkouts = 0;
      let lastCompleted = null;

      for (let j = 1; j < completionsData.length; j++) {
        const rowUserId = completionsData[j][completionsHeaderMap['user_id']];
        const rowChallengeId = completionsData[j][completionsHeaderMap['challenge_id']];

        // Match by user_id and challenge_id
        if (rowUserId === actualUserId && rowChallengeId === challengeId) {
          totalWorkouts++;
          const completionDate = new Date(completionsData[j][completionsHeaderMap['timestamp']]);
          if (!lastCompleted || completionDate > lastCompleted) {
            lastCompleted = completionDate;
          }
        }
      }

      Logger.log('DEBUG updateUserStats - Calculated totalWorkouts: ' + totalWorkouts);
      Logger.log('DEBUG updateUserStats - Calculated lastCompleted: ' + lastCompleted);
      Logger.log('DEBUG updateUserStats - total_workouts column index: ' + headers['total_workouts']);
      Logger.log('DEBUG updateUserStats - last_completed column index: ' + headers['last_completed']);

      // Update the user row using header-based column indices
      usersSheet.getRange(i + 1, headers['total_workouts'] + 1).setValue(totalWorkouts);
      if (lastCompleted) {
        usersSheet.getRange(i + 1, headers['last_completed'] + 1).setValue(lastCompleted);
      }

      Logger.log('DEBUG updateUserStats - Updated row ' + (i + 1) + ' columns ' + (headers['total_workouts'] + 1) + ' and ' + (headers['last_completed'] + 1));

      break;
    }
  }
}

// Get app timezone from settings (with caching for performance)
let _timezoneCache = null;
function getAppTimezone(ss) {
  if (_timezoneCache) return _timezoneCache;

  const settings = getSettings(ss);
  _timezoneCache = settings.timezone || Session.getScriptTimeZone();
  return _timezoneCache;
}

// Utility function to format date
function formatDate(date, ss) {
  if (!date) return '';
  const d = new Date(date);
  // If ss is provided, use app timezone, otherwise fallback to script timezone
  const timezone = ss ? getAppTimezone(ss) : Session.getScriptTimeZone();
  return Utilities.formatDate(d, timezone, 'MMM d, yyyy');
}

// Utility function to format date and time
function formatDateTime(date, ss) {
  if (!date) return '';
  const d = new Date(date);
  // If ss is provided, use app timezone, otherwise fallback to script timezone
  const timezone = ss ? getAppTimezone(ss) : Session.getScriptTimeZone();
  return Utilities.formatDate(d, timezone, 'MMM d, h:mm a');
}

// Utility function to format date as MM/DD/YYYY (numeric format for frontend parsing)
function formatDateNumeric(date, ss) {
  if (!date) return '';
  const d = new Date(date);
  // If ss is provided, use app timezone, otherwise fallback to script timezone
  const timezone = ss ? getAppTimezone(ss) : Session.getScriptTimeZone();
  return Utilities.formatDate(d, timezone, 'MM/dd/yyyy');
}

// Test function for debugging
function testAPI() {
  const result = getUserDashboardData('meg');
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// Test function for getAllWorkouts
function testGetAllWorkouts() {
  const result = getAllWorkouts();
  console.log('Total workouts found:', result.length);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

// Function to manually reset user stats (admin use)
function resetAllUserStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = getHeaderMapping(usersSheet);

  for (let i = 1; i < data.length; i++) {
    usersSheet.getRange(i + 1, headers['total_workouts'] + 1).setValue(0); // Reset total_workouts
    usersSheet.getRange(i + 1, headers['last_completed'] + 1).setValue(''); // Clear last_completed
  }

  console.log('All user stats reset');
}

// Get user's completion history (dates they completed workouts)
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  // Create header mapping
  const headerMap = {};
  for (let i = 0; i < headers.length; i++) {
    headerMap[headers[i]] = i;
  }

  // Get timezone
  const settings = getSettings(ss);
  const appTimezone = settings.timezone || Session.getScriptTimeZone();

  const completionDates = [];

  for (let i = 1; i < data.length; i++) { // Skip header
    const rowUserId = data[i][headerMap['user_id']];
    const rowChallengeId = data[i][headerMap['challenge_id']];

    // Filter by user and challenge
    if (rowUserId && rowUserId.toString().toLowerCase().trim() === userId.toLowerCase().trim() &&
        rowChallengeId === challengeId) {
      const completionDate = new Date(data[i][headerMap['timestamp']]);
      const dateStr = Utilities.formatDate(completionDate, appTimezone, 'yyyy-MM-dd');
      if (!completionDates.includes(dateStr)) {
        completionDates.push(dateStr);
      }
    }
  }

  return completionDates;
}

/**
 * Get user completion history across ALL challenges (for multi-month calendar)
 * @param {string} userId - User ID
 * @param {string} startDate - Optional start date filter (YYYY-MM-DD)
 * @param {string} endDate - Optional end date filter (YYYY-MM-DD)
 * @returns {Array} Array of dates (YYYY-MM-DD format)
 */
function getUserAllCompletions(userId, startDate, endDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  // Create header mapping
  const headerMap = {};
  for (let i = 0; i < headers.length; i++) {
    headerMap[headers[i]] = i;
  }

  // Get timezone
  const settings = getSettings(ss);
  const appTimezone = settings.timezone || Session.getScriptTimeZone();

  // Parse optional date filters
  let filterStartDate = null;
  let filterEndDate = null;
  if (startDate) {
    filterStartDate = new Date(startDate);
  }
  if (endDate) {
    filterEndDate = new Date(endDate);
  }

  const completionDates = [];

  for (let i = 1; i < data.length; i++) { // Skip header
    const rowUserId = data[i][headerMap['user_id']];

    // Filter by user (NO challenge_id filtering - get all completions)
    if (rowUserId && rowUserId.toString().toLowerCase().trim() === userId.toLowerCase().trim()) {
      const completionDate = new Date(data[i][headerMap['timestamp']]);

      // Apply optional date range filter
      if (filterStartDate && completionDate < filterStartDate) {
        continue;
      }
      if (filterEndDate && completionDate > filterEndDate) {
        continue;
      }

      const dateStr = Utilities.formatDate(completionDate, appTimezone, 'yyyy-MM-dd');
      if (!completionDates.includes(dateStr)) {
        completionDates.push(dateStr);
      }
    }
  }

  return completionDates;
}

// Get all workouts (for workout library)
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
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = getWorkoutsHeaderMapping(workoutsSheet);

  const workouts = [];

  for (let i = 1; i < data.length; i++) { // Skip header
    const workoutId = data[i][headers['workout_id']];
    const rowChallengeId = data[i][headers['challenge_id']];

    // Skip empty rows
    if (!workoutId) continue;

    // Filter by challenge
    if (challengeId && rowChallengeId !== challengeId) {
      continue;
    }

    // Skip workouts with missing dates
    if (!data[i][headers['start_date']] || !data[i][headers['end_date']]) {
      continue;
    }

    const startDateObj = new Date(data[i][headers['start_date']]);
    const endDateObj = new Date(data[i][headers['end_date']]);

    // Skip workouts with invalid dates
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      continue;
    }

    const workout = {
      workout_id: data[i][headers['workout_id']],
      workout_name: data[i][headers['workout_name']],
      start_date: formatDate(startDateObj, ss),
      end_date: formatDate(endDateObj, ss),
      start_date_raw: startDateObj.getTime(), // Convert to timestamp
      end_date_raw: endDateObj.getTime(), // Convert to timestamp
      instructions: data[i][headers['instructions']] || '',
      exercises: []
    };

    // Add exercises (up to 10)
    for (let j = 1; j <= 10; j++) {
      const movementKey = `movement_${j}`;
      const repsKey = `reps_${j}`;
      const altKey = `alt_${j}`;

      if (headers[movementKey] !== undefined && data[i][headers[movementKey]]) {
        // Extract hyperlink if present
        let movementText = data[i][headers[movementKey]];
        let movementUrl = null;

        try {
          const richTextValue = workoutsSheet.getRange(i + 1, headers[movementKey] + 1).getRichTextValue();
          if (richTextValue) {
            const runs = richTextValue.getRuns();
            if (runs && runs.length > 0) {
              const linkUrl = runs[0].getLinkUrl();
              if (linkUrl) {
                movementUrl = linkUrl;
              }
            }
          }
        } catch (e) {
          console.log('Could not extract hyperlink for movement:', e);
        }

        workout.exercises.push({
          movement: movementText,
          movement_url: movementUrl,
          reps: data[i][headers[repsKey]] || '',
          alternative: data[i][headers[altKey]] || ''
        });
      }
    }

    workouts.push(workout);
  }

  // Sort by start date (oldest to newest)
  workouts.sort((a, b) => a.start_date_raw - b.start_date_raw);

  return workouts;
}

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
    if (data[i][headerMap['status']] === 'active') {
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
    // Challenge_Teams sheet doesn't exist - users must be explicitly assigned
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

  // User not found in Challenge_Teams - they are not participating in this challenge
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
          start_date: formatDateNumeric(challenge.start_date, ss),
          end_date: formatDateNumeric(challenge.end_date, ss)
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