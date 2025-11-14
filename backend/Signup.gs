/**
 * A8 Workout Challenge App - Signup Module
 *
 * Handles new user self-service registration with preference collection
 *
 * NEW COLUMNS REQUIRED IN USERS SHEET:
 * - preferred_duration (values: "10", "20", "30")
 * - equipment_available (comma-separated: "Bodyweight,Kettlebell,Dumbbell,Bands,Full Gym")
 *
 * These columns should be added manually to the Users sheet before using this module
 */

/**
 * Create a new signup request
 * Called from signup.html form submission
 *
 * @param {Object} data - The signup form data
 * @param {string} data.email - User email (required)
 * @param {string} data.userId - Username/user_id (required)
 * @param {string} data.displayName - Display name (required)
 * @param {string} data.fullName - Full legal name (required)
 * @param {string} data.preferredDuration - Workout duration preference ("10", "20", "30")
 * @param {Array<string>} data.equipment - Array of equipment selections
 * @returns {Object} Result with success status and message
 */
function createSignupRequest(data) {
  try {
    console.log('Creating signup request:', data);

    // Validate input data
    const validation = validateSignupData(data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');

    if (!usersSheet) {
      throw new Error('Users sheet not found');
    }

    // Use userId from form data (already validated)
    const userId = data.userId.toLowerCase();

    // Get Users sheet headers and data
    const usersData = usersSheet.getDataRange().getValues();
    const usersHeaders = usersData[0];

    // Find column indices
    const indices = {
      user_id: usersHeaders.indexOf('user_id'),
      email: usersHeaders.indexOf('email'),
      display_name: usersHeaders.indexOf('display_name'),
      full_name: usersHeaders.indexOf('full_name'),
      join_date: usersHeaders.indexOf('join_date'),
      active_user: usersHeaders.indexOf('active_user'),
      preferred_duration: usersHeaders.indexOf('preferred_duration'),
      equipment_available: usersHeaders.indexOf('equipment_available'),
      total_workouts: usersHeaders.indexOf('total_workouts'),
      last_completed: usersHeaders.indexOf('last_completed'),
      deployment_URL: usersHeaders.indexOf('deployment_URL')
    };

    // Validate required columns exist
    const missingColumns = [];
    ['user_id', 'email', 'display_name'].forEach(col => {
      if (indices[col] === -1) {
        missingColumns.push(col);
      }
    });

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns in Users sheet: ${missingColumns.join(', ')}`);
    }

    // Check for duplicate email
    const existingEmail = usersData.slice(1).find(row =>
      row[indices.email] && row[indices.email].toLowerCase() === data.email.toLowerCase()
    );

    if (existingEmail) {
      return {
        success: false,
        error: 'An account with this email already exists. Please contact the admin if you need help.'
      };
    }

    // Check for duplicate userId
    const existingUserId = usersData.slice(1).find(row =>
      row[indices.user_id] && row[indices.user_id].toLowerCase() === userId
    );

    if (existingUserId) {
      return {
        success: false,
        error: 'This username is already taken. Please choose a different username.'
      };
    }

    // Create new user row
    const newRow = new Array(usersHeaders.length).fill('');

    // Set required fields
    newRow[indices.user_id] = userId;
    newRow[indices.email] = data.email;
    newRow[indices.display_name] = data.displayName;

    // Set optional fields
    if (indices.full_name !== -1 && data.fullName) {
      newRow[indices.full_name] = data.fullName;
    }

    if (indices.join_date !== -1) {
      // Get timezone from settings
      const settings = getSettings(ss);
      const timezone = settings.timezone || 'America/New_York';
      const today = new Date();
      const dateInAppTz = new Date(today.toLocaleString("en-US", { timeZone: timezone }));
      newRow[indices.join_date] = Utilities.formatDate(dateInAppTz, timezone, 'M/d/yyyy');
    }

    // Set preference fields
    if (indices.preferred_duration !== -1 && data.preferredDuration) {
      newRow[indices.preferred_duration] = data.preferredDuration;
    }

    if (indices.equipment_available !== -1 && data.equipment && data.equipment.length > 0) {
      newRow[indices.equipment_available] = data.equipment.join(',');
    }

    // Set defaults
    if (indices.total_workouts !== -1) {
      newRow[indices.total_workouts] = 0;
    }

    if (indices.last_completed !== -1) {
      newRow[indices.last_completed] = '';
    }

    // Leave active_user empty for admin review
    if (indices.active_user !== -1) {
      newRow[indices.active_user] = '';
    }

    // Append the row
    usersSheet.appendRow(newRow);

    console.log(`Successfully created signup request for ${data.email} with user_id: ${userId}`);

    return {
      success: true,
      message: 'Signup successful! An admin will review your request and send you your personalized app link via email.',
      userId: userId
    };

  } catch (error) {
    console.error('Error in createSignupRequest:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again or contact support.'
    };
  }
}

/**
 * Update user preferences (for future /update page)
 *
 * @param {string} userId - The user ID to update
 * @param {Object} preferences - The preferences to update
 * @param {string} preferences.preferredDuration - Workout duration preference
 * @param {Array<string>} preferences.equipment - Array of equipment selections
 * @returns {Object} Result with success status
 */
function updateUserPreferences(userId, preferences) {
  try {
    console.log('Updating preferences for user:', userId);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');

    if (!usersSheet) {
      throw new Error('Users sheet not found');
    }

    // Get Users sheet data
    const usersData = usersSheet.getDataRange().getValues();
    const usersHeaders = usersData[0];

    // Find column indices
    const userIdCol = usersHeaders.indexOf('user_id');
    const preferredDurationCol = usersHeaders.indexOf('preferred_duration');
    const equipmentCol = usersHeaders.indexOf('equipment_available');

    if (userIdCol === -1) {
      throw new Error('user_id column not found in Users sheet');
    }

    // Find user row
    let userRowNum = -1;
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][userIdCol] && usersData[i][userIdCol].toLowerCase() === userId.toLowerCase()) {
        userRowNum = i + 1; // +1 for 1-indexed rows
        break;
      }
    }

    if (userRowNum === -1) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Update preferences
    if (preferredDurationCol !== -1 && preferences.preferredDuration) {
      usersSheet.getRange(userRowNum, preferredDurationCol + 1).setValue(preferences.preferredDuration);
    }

    if (equipmentCol !== -1 && preferences.equipment && preferences.equipment.length > 0) {
      usersSheet.getRange(userRowNum, equipmentCol + 1).setValue(preferences.equipment.join(','));
    }

    console.log(`Successfully updated preferences for user: ${userId}`);

    return {
      success: true,
      message: 'Preferences updated successfully!'
    };

  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Generate a unique user ID from email/display name
 * Format: firstname.lastname (from email) or normalized display name
 * Adds numbers if conflicts exist (e.g., john.smith, john.smith2)
 *
 * @param {string} email - User email
 * @param {string} displayName - Display name
 * @param {Sheet} usersSheet - The Users sheet
 * @returns {string} Unique user ID
 */
function generateUserId(email, displayName, usersSheet) {
  // Try to extract from email first (everything before @)
  let baseId = email.split('@')[0].toLowerCase();

  // Clean up: remove special characters, keep only alphanumeric and dots
  baseId = baseId.replace(/[^a-z0-9.]/g, '');

  // If baseId is empty or too short, use display name
  if (!baseId || baseId.length < 2) {
    baseId = displayName.toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric
  }

  // Ensure baseId is not empty
  if (!baseId) {
    baseId = 'user';
  }

  // Get existing user IDs
  const usersData = usersSheet.getDataRange().getValues();
  const userIdCol = usersData[0].indexOf('user_id');

  if (userIdCol === -1) {
    throw new Error('user_id column not found in Users sheet');
  }

  const existingIds = new Set();
  for (let i = 1; i < usersData.length; i++) {
    const userId = usersData[i][userIdCol];
    if (userId) {
      existingIds.add(userId.toLowerCase());
    }
  }

  // Check if baseId is unique
  let userId = baseId;
  let counter = 2;

  while (existingIds.has(userId)) {
    userId = `${baseId}${counter}`;
    counter++;
  }

  return userId;
}

/**
 * Validate signup form data
 *
 * @param {Object} data - The signup form data
 * @returns {Object} Validation result with valid flag and error message
 */
function validateSignupData(data) {
  // Check required fields
  if (!data.email || !data.email.trim()) {
    return {
      valid: false,
      error: 'Email is required'
    };
  }

  if (!data.userId || !data.userId.trim()) {
    return {
      valid: false,
      error: 'Username is required'
    };
  }

  if (!data.displayName || !data.displayName.trim()) {
    return {
      valid: false,
      error: 'Display name is required'
    };
  }

  if (!data.fullName || !data.fullName.trim()) {
    return {
      valid: false,
      error: 'Full name is required'
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return {
      valid: false,
      error: 'Please enter a valid email address'
    };
  }

  // Validate userId format (lowercase letters, numbers, periods only)
  const userIdRegex = /^[a-z0-9.]+$/;
  if (!userIdRegex.test(data.userId)) {
    return {
      valid: false,
      error: 'Username must contain only lowercase letters, numbers, and periods'
    };
  }

  // Validate userId length
  if (data.userId.length < 3 || data.userId.length > 30) {
    return {
      valid: false,
      error: 'Username must be between 3 and 30 characters'
    };
  }

  // Validate preferred duration (optional but if provided, must be valid)
  if (data.preferredDuration && !['10', '20', '30'].includes(data.preferredDuration)) {
    return {
      valid: false,
      error: 'Invalid workout duration preference'
    };
  }

  // Validate equipment (optional but if provided, must be valid)
  const validEquipment = ['Bodyweight', 'Kettlebell', 'Dumbbell', 'Bands', 'Full Gym'];
  if (data.equipment && Array.isArray(data.equipment)) {
    for (const item of data.equipment) {
      if (!validEquipment.includes(item)) {
        return {
          valid: false,
          error: `Invalid equipment selection: ${item}`
        };
      }
    }
  }

  return {
    valid: true
  };
}

/**
 * Get user preferences (for future /update page)
 *
 * @param {string} userId - The user ID
 * @returns {Object} User preferences or error
 */
function getUserPreferences(userId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName('Users');

    if (!usersSheet) {
      throw new Error('Users sheet not found');
    }

    const usersData = usersSheet.getDataRange().getValues();
    const usersHeaders = usersData[0];

    // Find column indices
    const userIdCol = usersHeaders.indexOf('user_id');
    const preferredDurationCol = usersHeaders.indexOf('preferred_duration');
    const equipmentCol = usersHeaders.indexOf('equipment_available');
    const displayNameCol = usersHeaders.indexOf('display_name');
    const emailCol = usersHeaders.indexOf('email');

    // Find user row
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][userIdCol] && usersData[i][userIdCol].toLowerCase() === userId.toLowerCase()) {
        const equipmentString = equipmentCol !== -1 ? usersData[i][equipmentCol] : '';

        return {
          success: true,
          preferences: {
            displayName: displayNameCol !== -1 ? usersData[i][displayNameCol] : '',
            email: emailCol !== -1 ? usersData[i][emailCol] : '',
            preferredDuration: preferredDurationCol !== -1 ? usersData[i][preferredDurationCol] : '',
            equipment: equipmentString ? equipmentString.split(',') : []
          }
        };
      }
    }

    return {
      success: false,
      error: 'User not found'
    };

  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get challenge information for signup page
 *
 * @param {string} challengeId - The challenge ID
 * @returns {Object} Challenge info or error
 */
function getChallengeInfo(challengeId) {
  try {
    console.log('Getting challenge info for:', challengeId);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const challengesSheet = ss.getSheetByName('Challenges');

    if (!challengesSheet) {
      throw new Error('Challenges sheet not found');
    }

    const challengesData = challengesSheet.getDataRange().getValues();
    const challengesHeaders = challengesData[0];

    // Find column indices
    const challengeIdCol = challengesHeaders.indexOf('challenge_id');
    const challengeNameCol = challengesHeaders.indexOf('challenge_name');
    const startDateCol = challengesHeaders.indexOf('start_date');
    const endDateCol = challengesHeaders.indexOf('end_date');
    const totalGoalCol = challengesHeaders.indexOf('total_goal');
    const signupDeadlineCol = challengesHeaders.indexOf('signup_deadline');

    if (challengeIdCol === -1) {
      throw new Error('challenge_id column not found in Challenges sheet');
    }

    // Find challenge row
    for (let i = 1; i < challengesData.length; i++) {
      if (challengesData[i][challengeIdCol] && challengesData[i][challengeIdCol] === challengeId) {
        const settings = getSettings(ss);
        const timezone = settings.timezone || 'America/New_York';

        // Format dates
        const formatDate = (date) => {
          if (!date) return '';
          if (date instanceof Date) {
            return Utilities.formatDate(date, timezone, 'M/d/yyyy');
          }
          return date.toString();
        };

        const startDate = startDateCol !== -1 ? formatDate(challengesData[i][startDateCol]) : '';
        const endDate = endDateCol !== -1 ? formatDate(challengesData[i][endDateCol]) : '';
        const signupDeadline = signupDeadlineCol !== -1 ? formatDate(challengesData[i][signupDeadlineCol]) : '';

        // Check if signup is still open
        let signupOpen = true;
        let deadlineMessage = '';

        if (signupDeadline && signupDeadlineCol !== -1) {
          const now = new Date();
          const nowInAppTz = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
          const deadlineDate = new Date(challengesData[i][signupDeadlineCol]);

          if (nowInAppTz > deadlineDate) {
            signupOpen = false;
            deadlineMessage = `Signup deadline (${signupDeadline}) has passed`;
          } else {
            deadlineMessage = `Signup deadline: ${signupDeadline}`;
          }
        }

        return {
          success: true,
          challenge: {
            challengeId: challengeId,
            challengeName: challengeNameCol !== -1 ? challengesData[i][challengeNameCol] : challengeId,
            startDate: startDate,
            endDate: endDate,
            totalGoal: totalGoalCol !== -1 ? challengesData[i][totalGoalCol] : '',
            signupDeadline: signupDeadline,
            signupOpen: signupOpen,
            deadlineMessage: deadlineMessage
          }
        };
      }
    }

    return {
      success: false,
      error: 'Challenge not found'
    };

  } catch (error) {
    console.error('Error in getChallengeInfo:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching challenge info'
    };
  }
}

/**
 * Create a challenge-specific signup (for both new and existing users)
 * Called from signup_challenge.html form submission
 *
 * @param {Object} data - The signup form data
 * @param {string} data.challengeId - Challenge ID (required)
 * @param {string} data.email - User email (required)
 * @param {string} data.userId - Username/user_id (required for NEW users only)
 * @param {string} data.displayName - Display name (required for NEW users only)
 * @param {string} data.fullName - Full legal name (required for NEW users only)
 * @param {string} data.preferredDuration - Workout duration preference ("10", "20", "30")
 * @param {Array<string>} data.equipment - Array of equipment selections
 * @returns {Object} Result with success status and message
 */
function createChallengeSignup(data) {
  try {
    console.log('Creating challenge signup:', data);

    // Validate challengeId
    if (!data.challengeId || !data.challengeId.trim()) {
      return {
        success: false,
        error: 'Challenge ID is required'
      };
    }

    // Validate email
    if (!data.email || !data.email.trim()) {
      return {
        success: false,
        error: 'Email is required'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get and validate challenge info
    const challengeInfo = getChallengeInfo(data.challengeId);
    if (!challengeInfo.success) {
      return {
        success: false,
        error: 'Invalid challenge ID'
      };
    }

    // Check signup deadline
    if (!challengeInfo.challenge.signupOpen) {
      return {
        success: false,
        error: challengeInfo.challenge.deadlineMessage
      };
    }

    const usersSheet = ss.getSheetByName('Users');
    const challengeTeamsSheet = ss.getSheetByName('Challenge_Teams');

    if (!usersSheet) {
      throw new Error('Users sheet not found');
    }

    if (!challengeTeamsSheet) {
      throw new Error('Challenge_Teams sheet not found');
    }

    // Get Users sheet headers and data
    const usersData = usersSheet.getDataRange().getValues();
    const usersHeaders = usersData[0];

    // Find column indices
    const indices = {
      user_id: usersHeaders.indexOf('user_id'),
      email: usersHeaders.indexOf('email'),
      display_name: usersHeaders.indexOf('display_name'),
      full_name: usersHeaders.indexOf('full_name'),
      join_date: usersHeaders.indexOf('join_date'),
      active_user: usersHeaders.indexOf('active_user'),
      preferred_duration: usersHeaders.indexOf('preferred_duration'),
      equipment_available: usersHeaders.indexOf('equipment_available'),
      total_workouts: usersHeaders.indexOf('total_workouts'),
      last_completed: usersHeaders.indexOf('last_completed')
    };

    // Check if user exists (case-insensitive email match)
    let existingUser = null;
    let existingUserRowNum = -1;

    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][indices.email] &&
          usersData[i][indices.email].toLowerCase() === data.email.toLowerCase()) {
        existingUser = usersData[i];
        existingUserRowNum = i + 1; // 1-indexed
        break;
      }
    }

    let userId;

    if (existingUser) {
      // EXISTING USER - update preferences only
      console.log('Existing user found, updating preferences');

      userId = existingUser[indices.user_id];

      // Check if already signed up for this challenge
      const teamsData = challengeTeamsSheet.getDataRange().getValues();
      const teamsHeaders = teamsData[0];
      const teamChallengeIdCol = teamsHeaders.indexOf('challenge_id');
      const teamUserIdCol = teamsHeaders.indexOf('user_id');

      const alreadySignedUp = teamsData.slice(1).some(row =>
        row[teamChallengeIdCol] === data.challengeId &&
        row[teamUserIdCol] && row[teamUserIdCol].toLowerCase() === userId.toLowerCase()
      );

      if (alreadySignedUp) {
        return {
          success: false,
          error: `You're already registered for ${challengeInfo.challenge.challengeName}! If you need to update your preferences, please contact the admin.`
        };
      }

      // Update preferences only
      if (indices.preferred_duration !== -1 && data.preferredDuration) {
        usersSheet.getRange(existingUserRowNum, indices.preferred_duration + 1)
          .setValue(data.preferredDuration);
      }

      if (indices.equipment_available !== -1 && data.equipment && data.equipment.length > 0) {
        usersSheet.getRange(existingUserRowNum, indices.equipment_available + 1)
          .setValue(data.equipment.join(','));
      }

    } else {
      // NEW USER - create full user record
      console.log('New user, creating account');

      // Validate new user fields
      if (!data.userId || !data.userId.trim()) {
        return {
          success: false,
          error: 'Username is required for new users'
        };
      }

      if (!data.displayName || !data.displayName.trim()) {
        return {
          success: false,
          error: 'Display name is required for new users'
        };
      }

      if (!data.fullName || !data.fullName.trim()) {
        return {
          success: false,
          error: 'Full name is required for new users'
        };
      }

      userId = data.userId.toLowerCase();

      // Validate userId format
      const userIdRegex = /^[a-z0-9.]+$/;
      if (!userIdRegex.test(userId)) {
        return {
          success: false,
          error: 'Username must contain only lowercase letters, numbers, and periods'
        };
      }

      if (userId.length < 3 || userId.length > 30) {
        return {
          success: false,
          error: 'Username must be between 3 and 30 characters'
        };
      }

      // Check for duplicate userId
      const existingUserId = usersData.slice(1).find(row =>
        row[indices.user_id] && row[indices.user_id].toLowerCase() === userId
      );

      if (existingUserId) {
        return {
          success: false,
          error: 'This username is already taken. Please choose a different username.'
        };
      }

      // Validate preferences
      if (data.preferredDuration && !['10', '20', '30'].includes(data.preferredDuration)) {
        return {
          success: false,
          error: 'Invalid workout duration preference'
        };
      }

      const validEquipment = ['Bodyweight', 'Kettlebell', 'Dumbbell', 'Bands', 'Full Gym'];
      if (data.equipment && Array.isArray(data.equipment)) {
        for (const item of data.equipment) {
          if (!validEquipment.includes(item)) {
            return {
              success: false,
              error: `Invalid equipment selection: ${item}`
            };
          }
        }
      }

      // Create new user row
      const newRow = new Array(usersHeaders.length).fill('');

      newRow[indices.user_id] = userId;
      newRow[indices.email] = data.email;
      newRow[indices.display_name] = data.displayName;

      if (indices.full_name !== -1) {
        newRow[indices.full_name] = data.fullName;
      }

      if (indices.join_date !== -1) {
        const settings = getSettings(ss);
        const timezone = settings.timezone || 'America/New_York';
        const today = new Date();
        const dateInAppTz = new Date(today.toLocaleString("en-US", { timeZone: timezone }));
        newRow[indices.join_date] = Utilities.formatDate(dateInAppTz, timezone, 'M/d/yyyy');
      }

      if (indices.preferred_duration !== -1 && data.preferredDuration) {
        newRow[indices.preferred_duration] = data.preferredDuration;
      }

      if (indices.equipment_available !== -1 && data.equipment && data.equipment.length > 0) {
        newRow[indices.equipment_available] = data.equipment.join(',');
      }

      if (indices.total_workouts !== -1) {
        newRow[indices.total_workouts] = 0;
      }

      if (indices.last_completed !== -1) {
        newRow[indices.last_completed] = '';
      }

      // Auto-approve challenge signups
      if (indices.active_user !== -1) {
        newRow[indices.active_user] = 'TRUE';
      }

      usersSheet.appendRow(newRow);
    }

    // Add to Challenge_Teams (for both new and existing users)
    const teamsData = challengeTeamsSheet.getDataRange().getValues();
    const teamsHeaders = teamsData[0];

    const teamNewRow = new Array(teamsHeaders.length).fill('');
    const teamChallengeIdCol = teamsHeaders.indexOf('challenge_id');
    const teamUserIdCol = teamsHeaders.indexOf('user_id');
    const teamNameCol = teamsHeaders.indexOf('team_name');
    const teamColorCol = teamsHeaders.indexOf('team_color');

    if (teamChallengeIdCol !== -1) teamNewRow[teamChallengeIdCol] = data.challengeId;
    if (teamUserIdCol !== -1) teamNewRow[teamUserIdCol] = userId;
    // Leave team_name and team_color empty for admin assignment
    if (teamNameCol !== -1) teamNewRow[teamNameCol] = '';
    if (teamColorCol !== -1) teamNewRow[teamColorCol] = '';

    challengeTeamsSheet.appendRow(teamNewRow);

    console.log(`Successfully registered ${userId} for challenge ${data.challengeId}`);

    return {
      success: true,
      message: `You're registered for ${challengeInfo.challenge.challengeName}! The admin will assign teams soon and send you your personalized app link via email.`,
      userId: userId,
      isNewUser: !existingUser,
      challenge: challengeInfo.challenge
    };

  } catch (error) {
    console.error('Error in createChallengeSignup:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again or contact support.'
    };
  }
}
