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
        result = getGoalProgress(ss1);
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

      default:
        result = { error: 'Invalid action parameter. Valid actions: getDashboard, getGoalProgress, getAllWorkouts, getUserCompletionHistory, generateAIWorkout' };
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
  // Enable CORS for cross-origin requests
  let output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  // Note: Google Apps Script Web Apps automatically handle CORS
  // No need to set headers manually

  try {
    // Parse request body
    const requestData = JSON.parse(e.postData.contents);
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

      default:
        result = { success: false, message: 'Invalid action parameter. Valid actions: markWorkoutComplete' };
    }

    output.setContent(JSON.stringify(result));

  } catch (error) {
    Logger.log('API Error in doPost: ' + error.toString());
    output.setContent(JSON.stringify({
      success: false,
      message: 'Server error: ' + error.toString()
    }));
  }

  return output;
}

// Note: doOptions() not needed - Google Apps Script handles CORS automatically

// Get main dashboard data for a user
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
        team_name: data[i][headers['team_name']],
        team_color: data[i][headers['team_color']],
        total_workouts: data[i][headers['total_workouts']] || 0,
        last_completed: data[i][headers['last_completed']] ? formatDate(data[i][headers['last_completed']], ss) : null
      };
    }
  }

  return null;
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
function getActiveWorkout(ss) {
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = getWorkoutsHeaderMapping(workoutsSheet);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let activeWorkout = null;

  for (let i = 1; i < data.length; i++) { // Skip header
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
function hasCompletedToday(ss, userId) {
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();

  // Get timezone from settings
  const settings = getSettings(ss);
  const appTimezone = settings.timezone || Session.getScriptTimeZone();

  const today = new Date();
  const todayStr = Utilities.formatDate(today, appTimezone, 'yyyy-MM-dd');

  for (let i = data.length - 1; i >= 1; i--) { // Start from bottom, skip header
    if (data[i][1] === userId) {
      const completionDate = new Date(data[i][0]);
      const completionStr = Utilities.formatDate(completionDate, appTimezone, 'yyyy-MM-dd');

      if (completionStr === todayStr) {
        return true;
      }

      // If we've gone past today, stop checking
      if (completionStr < todayStr) {
        break;
      }
    }
  }

  return false;
}

// Check if user has completed workout on a specific date
function hasCompletedOnDate(ss, userId, targetDate) {
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();

  // Get timezone from settings
  const settings = getSettings(ss);
  const appTimezone = settings.timezone || Session.getScriptTimeZone();

  const targetDateStr = Utilities.formatDate(new Date(targetDate), appTimezone, 'yyyy-MM-dd');

  for (let i = data.length - 1; i >= 1; i--) { // Start from bottom, skip header
    if (data[i][1] === userId) {
      const completionDate = new Date(data[i][0]);
      const completionStr = Utilities.formatDate(completionDate, appTimezone, 'yyyy-MM-dd');

      if (completionStr === targetDateStr) {
        return true;
      }
    }
  }

  return false;
}

// Get overall goal progress
function getGoalProgress(ss) {
  const settings = getSettings(ss);
  const completionsSheet = ss.getSheetByName('Completions');
  const usersSheet = ss.getSheetByName('Users');
  const workoutsSheet = ss.getSheetByName('Workouts');

  // Count total completions for current challenge
  const startDate = new Date(settings.start_date);
  const endDate = new Date(settings.end_date);

  const completionsData = completionsSheet.getDataRange().getValues();
  const workoutsData = workoutsSheet.getDataRange().getValues();
  let totalCompletions = 0;
  const teamTotals = {};
  const recentCompletions = [];

  // Get header mapping and create workout lookup map for performance
  const workoutsHeaders = getWorkoutsHeaderMapping(workoutsSheet);
  const workoutNames = {};
  for (let i = 1; i < workoutsData.length; i++) {
    workoutNames[workoutsData[i][workoutsHeaders['workout_id']]] = workoutsData[i][workoutsHeaders['workout_name']]; // workout_id -> workout_name
  }

  // First pass: count totals going forward
  for (let i = 1; i < completionsData.length; i++) {
    const completionDate = new Date(completionsData[i][0]);

    if (completionDate >= startDate && completionDate <= endDate) {
      totalCompletions++;

      // Track team totals
      const teamName = completionsData[i][3];
      if (teamName) {
        teamTotals[teamName] = (teamTotals[teamName] || 0) + 1;
      }
    }
  }

  // Second pass: get recent completions going backwards (newest first)
  for (let i = completionsData.length - 1; i >= 1; i--) {
    if (recentCompletions.length >= 10) break; // Stop once we have 10

    const completionDate = new Date(completionsData[i][0]);

    if (completionDate >= startDate && completionDate <= endDate && completionsData[i][1]) {
      const userInfo = getUserInfo(ss, completionsData[i][1]);
      if (userInfo) {
        const workoutId = completionsData[i][2];
        const workoutName = workoutId === 'Other Workout' ? 'Other Workout' : (workoutNames[workoutId] || 'Workout');

        recentCompletions.push({
          display_name: userInfo.display_name,
          workout_id: workoutId,
          workout_name: workoutName,
          timestamp: formatDateTime(completionsData[i][0], ss)
        });
      }
    }
  }

  // Get all teams from Users sheet
  const usersData = usersSheet.getDataRange().getValues();
  const usersHeaders = getHeaderMapping(usersSheet);
  const allTeams = new Set();
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][usersHeaders['team_name']]) {
      allTeams.add(usersData[i][usersHeaders['team_name']]);
    }
  }

  // Ensure all teams are in teamTotals
  allTeams.forEach(team => {
    if (!teamTotals[team]) {
      teamTotals[team] = 0;
    }
  });

  const totalGoal = parseInt(settings.total_goal) || 200;
  const percentage = Math.round((totalCompletions / totalGoal) * 100);

  return {
    total_completions: totalCompletions,
    total_goal: totalGoal,
    percentage: percentage,
    team_totals: teamTotals,
    recent_completions: recentCompletions // Already in order (most recent first)
  };
}

// Mark workout as complete
function markWorkoutComplete(userId, workoutType, workoutDetails, completionDate) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

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
    if (hasCompletedOnDate(ss, userId, targetDate)) {
      const dateStr = Utilities.formatDate(targetDate, appTimezone, 'MMM d, yyyy');
      return { success: false, message: `You already logged a workout for ${dateStr}!` };
    }
  } else {
    targetDate = new Date();
    // Check if already completed today (original behavior)
    if (hasCompletedToday(ss, userId)) {
      return { success: false, message: 'Already completed today!' };
    }
  }

  // Get user info
  const user = getUserInfo(ss, userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  // Determine workout_id
  let workoutId;
  if (workoutType === 'ai') {
    workoutId = 'AI Workout';
  } else if (workoutType === 'other') {
    workoutId = 'Other Workout';
  } else {
    const activeWorkout = getActiveWorkout(ss);
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
    user.team_name,
    workoutDetails || '' // Add the workout details in column E (new column)
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

  // Find user row
  const userIdLower = userId.toLowerCase().trim();
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers['user_id']] && data[i][headers['user_id']].toString().toLowerCase().trim() === userIdLower) {
      // Get the actual user_id from the sheet (with correct casing)
      const actualUserId = data[i][headers['user_id']];

      // Count total workouts for current challenge
      const settings = getSettings(ss);
      const startDate = new Date(settings.start_date);
      const endDate = new Date(settings.end_date);

      const completionsSheet = ss.getSheetByName('Completions');
      const completionsData = completionsSheet.getDataRange().getValues();

      let totalWorkouts = 0;
      let lastCompleted = null;

      for (let j = 1; j < completionsData.length; j++) {
        if (completionsData[j][1] === actualUserId) {
          const completionDate = new Date(completionsData[j][0]);
          if (completionDate >= startDate && completionDate <= endDate) {
            totalWorkouts++;
            if (!lastCompleted || completionDate > lastCompleted) {
              lastCompleted = completionDate;
            }
          }
        }
      }

      // Update the user row using header-based column indices
      usersSheet.getRange(i + 1, headers['total_workouts'] + 1).setValue(totalWorkouts);
      if (lastCompleted) {
        usersSheet.getRange(i + 1, headers['last_completed'] + 1).setValue(lastCompleted);
      }

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
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();

  // Get settings for challenge date range
  const settings = getSettings(ss);
  const startDate = new Date(settings.start_date);
  const endDate = new Date(settings.end_date);

  // Get timezone
  const appTimezone = settings.timezone || Session.getScriptTimeZone();

  const completionDates = [];

  for (let i = 1; i < data.length; i++) { // Skip header
    if (data[i][1] === userId) {
      const completionDate = new Date(data[i][0]);

      // Only include dates within current challenge
      if (completionDate >= startDate && completionDate <= endDate) {
        const dateStr = Utilities.formatDate(completionDate, appTimezone, 'yyyy-MM-dd');
        if (!completionDates.includes(dateStr)) {
          completionDates.push(dateStr);
        }
      }
    }
  }

  return completionDates;
}

// Get all workouts (for workout library)
function getAllWorkouts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = getWorkoutsHeaderMapping(workoutsSheet);

  const workouts = [];

  for (let i = 1; i < data.length; i++) { // Skip header
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