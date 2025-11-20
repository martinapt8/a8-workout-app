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

      case 'debugUserTeam':
        // Debug endpoint to test getUserTeamForChallenge
        const debugSs = SpreadsheetApp.getActiveSpreadsheet();
        const debugUserId = e.parameter.userId;
        const debugChallengeId = e.parameter.challengeId;
        const userTeam = getUserTeamForChallenge(debugSs, debugUserId, debugChallengeId);
        result = {
          userId: debugUserId,
          challengeId: debugChallengeId,
          userTeam: userTeam,
          codeVersion: 'v2025-11-18-debug-withLogging'
        };
        break;

      // Admin Dashboard Endpoints
      case 'getActiveUsersCount':
        const ss4 = SpreadsheetApp.getActiveSpreadsheet();
        const usersSheet = ss4.getSheetByName('Users');
        const usersData = usersSheet.getDataRange().getValues();
        const headers = usersData[0];
        const activeUserCol = headers.indexOf('active_user');
        const activeCount = usersData.slice(1).filter(row => row[activeUserCol] === true || row[activeUserCol] === 'TRUE').length;
        result = { count: activeCount };
        break;

      case 'getActiveChallenge':
        const ss5 = SpreadsheetApp.getActiveSpreadsheet();
        result = getActiveChallenge(ss5);
        break;

      case 'getAllChallenges':
        const ss6 = SpreadsheetApp.getActiveSpreadsheet();
        const challengesSheet = ss6.getSheetByName('Challenges');
        const challengesData = challengesSheet.getDataRange().getValues();
        const challengeHeaders = challengesData[0];
        const challenges = challengesData.slice(1).map(row => {
          let obj = {};
          challengeHeaders.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
        result = { challenges: challenges };
        break;

      case 'getChallengeSignups':
        const signupChallengeId = e.parameter.challengeId;
        if (!signupChallengeId) {
          result = { error: 'Missing challengeId parameter' };
        } else {
          const ss8 = SpreadsheetApp.getActiveSpreadsheet();
          result = getChallengeSignups(ss8, signupChallengeId);
        }
        break;

      case 'getActiveUsers':
        const ss7 = SpreadsheetApp.getActiveSpreadsheet();
        const activeUsersSheet = ss7.getSheetByName('Users');
        const activeUsersData = activeUsersSheet.getDataRange().getValues();
        const userHeaders = activeUsersData[0];
        const activeUserColIdx = userHeaders.indexOf('active_user');
        const users = activeUsersData.slice(1)
          .filter(row => row[activeUserColIdx] === true || row[activeUserColIdx] === 'TRUE')
          .map(row => {
            let obj = {};
            userHeaders.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });
        result = { users: users };
        break;

      case 'getEmailTemplates':
        result = { templates: getEmailTemplates() };
        break;

      case 'getTemplateById':
        const templateId = e.parameter.templateId;
        if (!templateId) {
          result = { error: 'Missing templateId parameter' };
        } else {
          result = { template: getTemplateById(templateId) };
        }
        break;

      default:
        result = { error: 'Invalid action parameter. Valid actions: getDashboard, getGoalProgress, getAllWorkouts, getUserCompletionHistory, getUserAllChallengeStats, generateAIWorkout, getRecentCompletionsAll, getActiveUsersCount, getActiveChallenge, getAllChallenges, getActiveUsers, getEmailTemplates, getTemplateById' };
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

      case 'checkUserByEmail':
        const checkEmail = requestData.email;
        if (!checkEmail) {
          result = { success: false, error: 'Missing email parameter' };
        } else {
          result = checkUserByEmail(checkEmail);
        }
        break;

      case 'getChallengeInfo':
        const challengeId = requestData.challengeId;
        if (!challengeId) {
          result = { success: false, error: 'Missing challengeId parameter' };
        } else {
          result = getChallengeInfo(challengeId);
        }
        break;

      case 'createChallengeSignup':
        const challengeSignupData = {
          challengeId: requestData.challengeId,
          email: requestData.email,
          userId: requestData.userId,
          displayName: requestData.displayName,
          fullName: requestData.fullName,
          preferredDuration: requestData.preferredDuration,
          equipment: requestData.equipment
        };
        result = createChallengeSignup(challengeSignupData);
        break;

      // Email Campaign Management Endpoints
      case 'getEmailTemplates':
        result = { templates: getEmailTemplates() };
        break;

      case 'getTemplateById':
        const templateId = requestData.templateId;
        if (!templateId) {
          result = { success: false, error: 'Missing templateId parameter' };
        } else {
          result = getTemplateById(templateId);
        }
        break;

      case 'saveEmailTemplate':
        const templateData = requestData.templateData;
        if (!templateData) {
          result = { success: false, error: 'Missing templateData parameter' };
        } else {
          result = saveEmailTemplate(templateData);
        }
        break;

      case 'previewEmail':
        const previewTemplateId = requestData.templateId;
        const previewUserId = requestData.userId;
        const previewChallengeId = requestData.challengeId || null;

        if (!previewTemplateId || !previewUserId) {
          result = { success: false, error: 'Missing required parameters: templateId, userId' };
        } else {
          result = previewEmailForUser(previewTemplateId, previewUserId, previewChallengeId);
        }
        break;

      case 'getTargetedUsers':
        const targetingOptions = requestData.targetingOptions;
        if (!targetingOptions) {
          result = { success: false, error: 'Missing targetingOptions parameter' };
        } else {
          result = { users: getTargetedUsers(targetingOptions) };
        }
        break;

      case 'sendEmailCampaign':
        const campaignTemplateId = requestData.templateId;
        const campaignTargeting = requestData.targetingOptions;
        const trackingFlag = requestData.trackingFlag || null;

        if (!campaignTemplateId || !campaignTargeting) {
          result = { success: false, error: 'Missing required parameters: templateId, targetingOptions' };
        } else {
          const campaignResult = sendEmailCampaign(campaignTemplateId, campaignTargeting, trackingFlag);
          result = { success: true, ...campaignResult };
        }
        break;

      default:
        result = { success: false, message: 'Invalid action parameter. Valid actions: markWorkoutComplete, createSignup, checkUserByEmail, getChallengeInfo, createChallengeSignup, getEmailTemplates, getTemplateById, saveEmailTemplate, previewEmail, getTargetedUsers, sendEmailCampaign' };
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

    // Get user's team breakdown (new for "My Team Workouts" section)
    const myTeamBreakdown = getMyTeamBreakdown(ss, userId, activeChallenge.challenge_id);

    return {
      user: {
        user_id: user.user_id,
        display_name: user.display_name,
        team_name: userTeam ? userTeam.team_name : null,
        team_color: userTeam ? userTeam.team_color : null,
        lifetime_workouts: lifetimeWorkouts,
        last_completed: user.last_completed || null,
        join_date: user.join_date || null
      },
      challenge: activeChallenge, // RENAMED from "settings"
      activeWorkout: activeWorkout,
      completedToday: completedToday,
      goalProgress: goalProgress,
      myTeamBreakdown: myTeamBreakdown
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

  // Initialize team_totals with all teams from Challenge_Teams (with 0 counts)
  const teamsSheet = ss.getSheetByName('Challenge_Teams');
  if (teamsSheet) {
    const teamsData = teamsSheet.getDataRange().getValues();
    const teamsHeaders = teamsData[0];

    const teamsHeaderMap = {};
    teamsHeaders.forEach((header, index) => {
      teamsHeaderMap[header] = index;
    });

    // Build set of unique team names for this challenge
    for (let i = 1; i < teamsData.length; i++) {
      if (teamsData[i][teamsHeaderMap['challenge_id']] === challengeId) {
        const teamName = teamsData[i][teamsHeaderMap['team_name']];
        if (teamName) {
          // Initialize with 0 if not already set
          if (!(teamName in teamTotals)) {
            teamTotals[teamName] = 0;
          }
        }
      }
    }
  }

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

// Get detailed breakdown of current user's team for a specific challenge
function getMyTeamBreakdown(ss, userId, challengeId) {
  if (!userId || !challengeId) {
    return null;
  }

  // Get user's team for this challenge
  const userTeam = getUserTeamForChallenge(ss, userId, challengeId);
  if (!userTeam || !userTeam.team_name) {
    return null;  // User not assigned to a team for this challenge
  }

  const teamName = userTeam.team_name;
  const teamColor = userTeam.team_color;

  // Get all users on the same team from Challenge_Teams sheet
  const challengeTeamsSheet = ss.getSheetByName('Challenge_Teams');
  const teamData = challengeTeamsSheet.getDataRange().getValues();
  const teamHeaders = teamData[0];

  const teamHeaderMap = {};
  teamHeaders.forEach((header, index) => {
    teamHeaderMap[header] = index;
  });

  // Find all team members
  const teamMemberIds = [];
  for (let i = 1; i < teamData.length; i++) {
    const rowChallengeId = teamData[i][teamHeaderMap['challenge_id']];
    const rowTeamName = teamData[i][teamHeaderMap['team_name']];
    const rowUserId = teamData[i][teamHeaderMap['user_id']];

    if (rowChallengeId === challengeId && rowTeamName === teamName) {
      teamMemberIds.push(rowUserId);
    }
  }

  if (teamMemberIds.length === 0) {
    return null;  // No team members found
  }

  // Get completions for this challenge
  const completionsSheet = ss.getSheetByName('Completions');
  const completionsData = completionsSheet.getDataRange().getValues();
  const completionsHeaders = completionsData[0];

  const completionsHeaderMap = {};
  completionsHeaders.forEach((header, index) => {
    completionsHeaderMap[header] = index;
  });

  // Count workouts per team member
  const workoutCounts = {};
  teamMemberIds.forEach(memberId => {
    workoutCounts[memberId] = 0;
  });

  for (let i = 1; i < completionsData.length; i++) {
    const rowUserId = completionsData[i][completionsHeaderMap['user_id']];
    const rowChallengeId = completionsData[i][completionsHeaderMap['challenge_id']];

    if (rowChallengeId === challengeId && teamMemberIds.includes(rowUserId)) {
      workoutCounts[rowUserId]++;
    }
  }

  // Build member list with display names
  const members = [];
  teamMemberIds.forEach(memberId => {
    const userInfo = getUserInfo(ss, memberId);
    if (userInfo) {
      members.push({
        user_id: memberId,
        display_name: userInfo.display_name,
        workout_count: workoutCounts[memberId]
      });
    }
  });

  // Sort alphabetically by display name
  members.sort((a, b) => {
    const nameA = a.display_name.toLowerCase();
    const nameB = b.display_name.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return {
    team_name: teamName,
    team_color: teamColor,
    members: members
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
  } else {
    targetDate = new Date();
  }

  // Determine which challenge applies to this workout
  // For backfills: use challenge active on TARGET DATE
  // For current day: use currently active challenge
  let relevantChallenge;
  if (completionDate) {
    // BACKFILL: Find challenge active on the target date
    relevantChallenge = getChallengeActiveOnDate(ss, targetDate);
  } else {
    // CURRENT DAY: Use currently active challenge
    relevantChallenge = getActiveChallenge(ss);
  }

  // Check if user is signed up for the relevant challenge
  // Only assign challenge_id if user is actually a participant
  let challengeId = null; // Default to year-round (null)
  let teamName = null;

  if (relevantChallenge) {
    const userTeam = getUserTeamForChallenge(ss, userId, relevantChallenge.challenge_id);
    if (userTeam) {
      // User IS signed up for this challenge
      teamName = userTeam.team_name;
      challengeId = relevantChallenge.challenge_id;
    }
    // else: User NOT signed up - challengeId stays null (year-round)
  }

  // NOW check for duplicates with the CORRECT challenge_id
  if (completionDate) {
    // Check if already completed on this specific date
    if (hasCompletedOnDate(ss, userId, targetDate, challengeId)) {
      const dateStr = Utilities.formatDate(targetDate, appTimezone, 'MMM d, yyyy');
      return { success: false, message: `You already logged a workout for ${dateStr}!` };
    }
  } else {
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

  // Determine workout_id
  let workoutId;
  if (workoutType === 'ai') {
    workoutId = 'AI Workout';
  } else if (workoutType === 'other') {
    workoutId = 'Other Workout';
  } else {
    // For prescribed workouts, we need to lookup the workout
    // Use relevantChallenge.challenge_id to find the workout (even for non-participants)
    // But we'll still store with the user's actual challengeId (null if not participating)
    const lookupChallengeId = relevantChallenge ? relevantChallenge.challenge_id : null;
    const activeWorkout = getActiveWorkout(ss, lookupChallengeId);
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

  // Force spreadsheet to save all pending changes
  SpreadsheetApp.flush();

  // Return simple success message. Client will refetch data.
  return {
    success: true,
    message: 'Workout completed!'
  };
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
 * Get which challenge was active on a specific date
 * Used for backfilling workouts to assign correct challenge_id
 * @param {Spreadsheet} ss - Spreadsheet object
 * @param {Date} targetDate - The date to check
 * @returns {Object|null} Challenge active on that date or null
 */
function getChallengeActiveOnDate(ss, targetDate) {
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

  // Normalize target date to midnight for comparison
  const targetDateOnly = new Date(targetDate);
  targetDateOnly.setHours(0, 0, 0, 0);

  // Find challenge where start_date <= targetDate <= end_date
  for (let i = 1; i < data.length; i++) {
    const startDate = new Date(data[i][headerMap['start_date']]);
    const endDate = new Date(data[i][headerMap['end_date']]);

    // Normalize dates to midnight for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999); // End of day

    if (targetDateOnly >= startDate && targetDateOnly <= endDate) {
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

  return null; // No challenge active on this date
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
        status: data[i][headerMap['status']],
        signup_deadline: data[i][headerMap['signup_deadline']]
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
  Logger.log('getUserTeamForChallenge called with userId: ' + userId + ', challengeId: ' + challengeId);

  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    Logger.log('Challenge_Teams sheet not found!');
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
  Logger.log('Looking for userIdLower: "' + userIdLower + '"');

  for (let i = 1; i < data.length; i++) {
    const rowChallengeId = data[i][headerMap['challenge_id']];
    const rowUserId = data[i][headerMap['user_id']];

    if (rowChallengeId === challengeId &&
        rowUserId && rowUserId.toString().toLowerCase().trim() === userIdLower) {
      const result = {
        team_name: data[i][headerMap['team_name']],
        team_color: data[i][headerMap['team_color']]
      };
      Logger.log('FOUND MATCH at row ' + i + ': ' + JSON.stringify(result));
      return result;
    }
  }

  Logger.log('NO MATCH FOUND - returning null');
  // User not found in Challenge_Teams - they are not participating in this challenge
  return null;
}

/**
 * Get all signups for a specific challenge
 * Returns user info and team assignments from Challenge_Teams joined with Users
 * @param {Spreadsheet} ss - Spreadsheet object
 * @param {string} challengeId - Challenge ID to get signups for
 * @returns {Object} Object with:
 *   - challenge: {challenge_id, challenge_name, start_date, end_date, total_goal, signup_deadline}
 *   - signups: Array of {user_id, display_name, team_name, team_color}
 */
function getChallengeSignups(ss, challengeId) {
  try {
    console.log('Getting signups for challenge:', challengeId);

    // Get challenge info
    const challenge = getChallengeById(ss, challengeId);
    if (!challenge) {
      return {
        error: 'Challenge not found',
        challenge: null,
        signups: []
      };
    }

    // Get Challenge_Teams sheet
    const teamsSheet = ss.getSheetByName('Challenge_Teams');
    if (!teamsSheet) {
      throw new Error('Challenge_Teams sheet not found');
    }

    const teamsData = teamsSheet.getDataRange().getValues();
    const teamsHeaders = teamsData[0];

    const teamsHeaderMap = {};
    teamsHeaders.forEach((header, index) => {
      teamsHeaderMap[header] = index;
    });

    // Get Users sheet
    const usersSheet = ss.getSheetByName('Users');
    if (!usersSheet) {
      throw new Error('Users sheet not found');
    }

    const usersData = usersSheet.getDataRange().getValues();
    const usersHeaders = usersData[0];

    const usersHeaderMap = {};
    usersHeaders.forEach((header, index) => {
      usersHeaderMap[header] = index;
    });

    // Build user lookup map for faster joins
    const userMap = {};
    for (let i = 1; i < usersData.length; i++) {
      const userId = usersData[i][usersHeaderMap['user_id']];
      if (userId) {
        const userIdKey = userId.toString().toLowerCase().trim();
        userMap[userIdKey] = {
          user_id: userId,
          display_name: usersData[i][usersHeaderMap['display_name']] || userId,
          full_name: usersData[i][usersHeaderMap['full_name']] || ''
        };
      }
    }

    // Get all signups for this challenge
    const signups = [];
    for (let i = 1; i < teamsData.length; i++) {
      const rowChallengeId = teamsData[i][teamsHeaderMap['challenge_id']];

      if (rowChallengeId === challengeId) {
        const userId = teamsData[i][teamsHeaderMap['user_id']];
        const userIdKey = userId ? userId.toString().toLowerCase().trim() : '';
        const userInfo = userMap[userIdKey];

        if (userInfo) {
          signups.push({
            user_id: userInfo.user_id,
            display_name: userInfo.display_name,
            full_name: userInfo.full_name,
            team_name: teamsData[i][teamsHeaderMap['team_name']] || null,
            team_color: teamsData[i][teamsHeaderMap['team_color']] || null
          });
        }
      }
    }

    // Sort signups: by team_name (alphabetical), then by display_name
    // Unassigned (null team_name) comes last
    signups.sort((a, b) => {
      if (a.team_name === null && b.team_name !== null) return 1;
      if (a.team_name !== null && b.team_name === null) return -1;
      if (a.team_name !== b.team_name) {
        return (a.team_name || '').localeCompare(b.team_name || '');
      }
      return (a.display_name || '').localeCompare(b.display_name || '');
    });

    return {
      challenge: {
        challenge_id: challenge.challenge_id,
        challenge_name: challenge.challenge_name,
        start_date: formatDateNumeric(challenge.start_date, ss),
        end_date: formatDateNumeric(challenge.end_date, ss),
        total_goal: challenge.total_goal || 0,
        signup_deadline: challenge.signup_deadline ? formatDateNumeric(challenge.signup_deadline, ss) : null
      },
      signups: signups
    };

  } catch (error) {
    console.error('Error in getChallengeSignups:', error);
    return {
      error: error.message,
      challenge: null,
      signups: []
    };
  }
}

/**
 * Get user's stats for all challenges and upcoming challenges (for Me page)
 * @param {Spreadsheet} ss - Spreadsheet object
 * @param {string} userId - User ID
 * @returns {Object} Object with:
 *   - userChallenges: Array of {challenge_id, challenge_name, workout_count, team_name, start_date, end_date}
 *   - upcomingChallenges: Array of {challenge_id, challenge_name, start_date, end_date}
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

  // ALSO check Challenge_Teams to find challenges user is registered for (even without workouts)
  const teamsSheet = ss.getSheetByName('Challenge_Teams');
  if (teamsSheet) {
    const teamsData = teamsSheet.getDataRange().getValues();
    const teamsHeaders = teamsData[0];

    const teamsHeaderMap = {};
    teamsHeaders.forEach((header, index) => {
      teamsHeaderMap[header] = index;
    });

    for (let i = 1; i < teamsData.length; i++) {
      const rowUserId = teamsData[i][teamsHeaderMap['user_id']];
      const challengeId = teamsData[i][teamsHeaderMap['challenge_id']];

      if (rowUserId && rowUserId.toString().toLowerCase().trim() === userIdLower) {
        // If user is in Challenge_Teams but hasn't logged a workout yet
        if (!statsByChallenge[challengeId]) {
          statsByChallenge[challengeId] = {
            challenge_id: challengeId,
            workout_count: 0
          };
        }
      }
    }
  }

  // Enrich with challenge details
  const userChallenges = [];
  for (const challengeId in statsByChallenge) {
    if (challengeId === 'year_round') {
      userChallenges.push({
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
        userChallenges.push({
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
  userChallenges.sort((a, b) => {
    if (!a.start_date) return 1; // year_round goes to end
    if (!b.start_date) return -1;
    return new Date(b.start_date) - new Date(a.start_date);
  });

  // Fetch upcoming challenges (status = "upcoming")
  const upcomingChallenges = [];
  const challengesSheet = ss.getSheetByName('Challenges');
  if (challengesSheet) {
    const challengeData = challengesSheet.getDataRange().getValues();
    const challengeHeaders = challengeData[0];

    const challengeHeaderMap = {};
    challengeHeaders.forEach((header, index) => {
      challengeHeaderMap[header] = index;
    });

    for (let i = 1; i < challengeData.length; i++) {
      const status = challengeData[i][challengeHeaderMap['status']];
      if (status === 'upcoming') {
        upcomingChallenges.push({
          challenge_id: challengeData[i][challengeHeaderMap['challenge_id']],
          challenge_name: challengeData[i][challengeHeaderMap['challenge_name']],
          start_date: formatDateNumeric(challengeData[i][challengeHeaderMap['start_date']], ss),
          end_date: formatDateNumeric(challengeData[i][challengeHeaderMap['end_date']], ss)
        });
      }
    }

    // Sort upcoming challenges by start_date (earliest first)
    upcomingChallenges.sort((a, b) => {
      return new Date(a.start_date) - new Date(b.start_date);
    });
  }

  return {
    userChallenges: userChallenges,
    upcomingChallenges: upcomingChallenges
  };
}