/**
 * EmailCampaigns.gs
 *
 * Flexible email campaign system for Daily Dose admin dashboard
 * Replaces hardcoded welcome_email.gs and update_email.gs with template-based system
 *
 * Core Features:
 * - Template management (CRUD operations)
 * - Token replacement engine (10+ dynamic tokens)
 * - User targeting (all active, challenge-based, custom lists)
 * - Email preview with real user data
 * - Campaign sending with tracking
 *
 * Dependencies:
 * - Email_Templates sheet (template storage)
 * - Users sheet (recipient data)
 * - Challenges sheet (challenge data for tokens)
 * - Challenge_Teams sheet (team assignments)
 * - Completions sheet (workout stats)
 * - Settings sheet (deployed_URL)
 *
 * Created: November 2025
 */

// =============================================================================
// TEMPLATE MANAGEMENT
// =============================================================================

/**
 * Get all active email templates
 * @returns {Array} Array of template objects
 */
function getEmailTemplates() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Email_Templates');

  if (!sheet) {
    Logger.log('Email_Templates sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const templates = [];

  // Find column indices
  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  // Process rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Only return active templates
    if (row[colMap['active']] === true) {
      templates.push({
        template_id: row[colMap['template_id']],
        template_name: row[colMap['template_name']],
        subject: row[colMap['subject']],
        html_body: row[colMap['html_body']],
        plain_body: row[colMap['plain_body']],
        created_date: row[colMap['created_date']],
        last_modified: row[colMap['last_modified']],
        active: row[colMap['active']]
      });
    }
  }

  return templates;
}

/**
 * Get a single template by ID
 * @param {string} templateId - The template_id to find
 * @returns {Object|null} Template object or null if not found
 */
function getTemplateById(templateId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Email_Templates');

  if (!sheet) {
    Logger.log('Email_Templates sheet not found');
    return null;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  // Find matching template
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colMap['template_id']] === templateId) {
      return {
        template_id: row[colMap['template_id']],
        template_name: row[colMap['template_name']],
        subject: row[colMap['subject']],
        html_body: row[colMap['html_body']],
        plain_body: row[colMap['plain_body']],
        created_date: row[colMap['created_date']],
        last_modified: row[colMap['last_modified']],
        active: row[colMap['active']],
        rowIndex: i + 1 // For updates (1-indexed)
      };
    }
  }

  return null;
}

/**
 * Save email template (create new or update existing)
 * @param {Object} templateData - Template object with fields
 * @returns {Object} {success: boolean, message: string}
 */
function saveEmailTemplate(templateData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Email_Templates');

  if (!sheet) {
    return {success: false, message: 'Email_Templates sheet not found'};
  }

  // Validate required fields
  if (!templateData.template_id || !templateData.template_name) {
    return {success: false, message: 'template_id and template_name are required'};
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  // Check if template exists
  let existingRowIndex = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][colMap['template_id']] === templateData.template_id) {
      existingRowIndex = i + 1; // 1-indexed
      break;
    }
  }

  const now = new Date();

  if (existingRowIndex) {
    // Update existing template
    sheet.getRange(existingRowIndex, colMap['template_name'] + 1).setValue(templateData.template_name);
    sheet.getRange(existingRowIndex, colMap['subject'] + 1).setValue(templateData.subject || '');
    sheet.getRange(existingRowIndex, colMap['html_body'] + 1).setValue(templateData.html_body || '');
    sheet.getRange(existingRowIndex, colMap['plain_body'] + 1).setValue(templateData.plain_body || '');
    sheet.getRange(existingRowIndex, colMap['last_modified'] + 1).setValue(now);
    sheet.getRange(existingRowIndex, colMap['active'] + 1).setValue(templateData.active !== false); // Default true

    return {success: true, message: 'Template updated successfully'};
  } else {
    // Create new template
    const newRow = [
      templateData.template_id,
      templateData.template_name,
      templateData.subject || '',
      templateData.html_body || '',
      templateData.plain_body || '',
      now, // created_date
      now, // last_modified
      templateData.active !== false // Default true
    ];

    sheet.appendRow(newRow);
    return {success: true, message: 'Template created successfully'};
  }
}

// =============================================================================
// TOKEN REPLACEMENT ENGINE
// =============================================================================

/**
 * Replace all tokens in text with user-specific data
 * Supported tokens:
 * - [display_name] - User's display name (emoji-cleaned)
 * - [deployment_URL] - User's personalized app link
 * - [challenge_name] - Active/specified challenge name
 * - [challenge_start_date] - Challenge start date
 * - [challenge_end_date] - Challenge end date
 * - [total_workouts] - User's workouts in specified challenge
 * - [lifetime_workouts] - User's all-time workout count
 * - [team_name] - User's team in specified challenge
 * - [team_total_workouts] - Team's total workouts
 * - [days_remaining] - Days left in challenge
 *
 * @param {string} text - Template text with tokens
 * @param {string} userId - User ID for personalization
 * @param {string} challengeId - Challenge ID (optional, defaults to active challenge)
 * @returns {string} Text with all tokens replaced
 */
function replaceTokens(text, userId, challengeId = null) {
  if (!text) return '';

  // Get token data
  const tokenData = getTokenDataForUser(userId, challengeId);

  // Replace each token
  let result = text;

  // User tokens
  result = result.replace(/\[display_name\]/g, tokenData.display_name || 'Team Member');
  result = result.replace(/\[deployment_URL\]/g, tokenData.deployment_URL || '');
  result = result.replace(/\[lifetime_workouts\]/g, tokenData.lifetime_workouts || '0');

  // Challenge tokens
  result = result.replace(/\[challenge_name\]/g, tokenData.challenge_name || 'Current Challenge');
  result = result.replace(/\[challenge_start_date\]/g, tokenData.challenge_start_date || '');
  result = result.replace(/\[challenge_end_date\]/g, tokenData.challenge_end_date || '');
  result = result.replace(/\[days_remaining\]/g, tokenData.days_remaining || 'Ongoing');
  result = result.replace(/\[total_workouts\]/g, tokenData.total_workouts || '0');

  // Team tokens
  result = result.replace(/\[team_name\]/g, tokenData.team_name || 'Not Assigned');
  result = result.replace(/\[team_total_workouts\]/g, tokenData.team_total_workouts || '0');

  return result;
}

/**
 * Gather all token data for a specific user
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID (optional)
 * @returns {Object} Token data object
 */
function getTokenDataForUser(userId, challengeId = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tokenData = {};

  // Get user info
  const userInfo = getUserInfo(ss, userId);
  if (userInfo) {
    tokenData.display_name = cleanDisplayNameForEmail(userInfo.display_name);
    tokenData.deployment_URL = getDeployedUrlForEmail() + '?user=' + userId;
    tokenData.lifetime_workouts = getLifetimeWorkoutCount(ss, userId);
  }

  // Get challenge info (use active challenge if not specified)
  const challenge = challengeId ? getEmailCampaignChallengeById(challengeId) : getActiveChallenge(ss);

  if (challenge) {
    tokenData.challenge_name = challenge.challenge_name;
    tokenData.challenge_start_date = formatDate(challenge.start_date);
    tokenData.challenge_end_date = formatDate(challenge.end_date);

    // Calculate days remaining
    const today = new Date();
    const endDate = new Date(challenge.end_date);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    tokenData.days_remaining = daysRemaining > 0 ? daysRemaining.toString() : '0';

    // Get user's challenge-specific workout count
    tokenData.total_workouts = getUserChallengeWorkoutCount(userId, challenge.challenge_id);

    // Get user's team info for this challenge
    const teamInfo = getUserTeamForChallenge(userId, challenge.challenge_id);
    if (teamInfo) {
      tokenData.team_name = teamInfo.team_name;
      tokenData.team_total_workouts = getTeamChallengeWorkoutCount(teamInfo.team_name, challenge.challenge_id);
    }
  }

  return tokenData;
}

/**
 * Get challenge by ID (Email Campaigns version)
 * @param {string} challengeId - Challenge ID
 * @returns {Object|null} Challenge object or null
 */
function getEmailCampaignChallengeById(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Challenges');

  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colMap['challenge_id']] === challengeId) {
      return {
        challenge_id: row[colMap['challenge_id']],
        challenge_name: row[colMap['challenge_name']],
        start_date: row[colMap['start_date']],
        end_date: row[colMap['end_date']],
        total_goal: row[colMap['total_goal']],
        status: row[colMap['status']]
      };
    }
  }

  return null;
}

/**
 * Get user's workout count for a specific challenge
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID
 * @returns {number} Workout count
 */
function getUserChallengeWorkoutCount(userId, challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Completions');

  if (!sheet) return 0;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colMap['user_id']] === userId && row[colMap['challenge_id']] === challengeId) {
      count++;
    }
  }

  return count;
}

/**
 * Get team's total workout count for a specific challenge
 * @param {string} teamName - Team name
 * @param {string} challengeId - Challenge ID
 * @returns {number} Workout count
 */
function getTeamChallengeWorkoutCount(teamName, challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Completions');

  if (!sheet) return 0;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colMap['team_name']] === teamName && row[colMap['challenge_id']] === challengeId) {
      count++;
    }
  }

  return count;
}

/**
 * Format date for display in emails
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (e.g., "November 18, 2025")
 */
function formatDate(date) {
  if (!date) return '';

  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Clean display name for email (remove emojis and non-ASCII characters)
 * Reuses pattern from existing email functions
 * @param {string} displayName - User's display name
 * @returns {string} ASCII-safe name or 'Team Member'
 */
function cleanDisplayNameForEmail(displayName) {
  if (!displayName) return 'Team Member';

  // Remove emojis and non-ASCII characters
  const cleaned = displayName.replace(/[^\x00-\x7F]/g, '').trim();

  // If nothing left after cleaning, return default
  return cleaned || 'Team Member';
}

/**
 * Get deployed URL from Settings sheet
 * @returns {string} Base URL
 */
function getDeployedUrlForEmail() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settings = getSettings(ss);
  return settings.deployed_URL || '';
}

// =============================================================================
// USER TARGETING
// =============================================================================

/**
 * Get list of users based on targeting options
 * @param {Object} targetingOptions - Targeting configuration
 *   - mode: 'all_active' | 'challenge' | 'custom'
 *   - challengeId: string (required if mode='challenge')
 *   - includeNoChallenge: boolean (if mode='challenge')
 *   - userIds: array of strings (required if mode='custom')
 * @returns {Array} Array of user objects
 */
function getTargetedUsers(targetingOptions) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');

  if (!usersSheet) {
    Logger.log('Users sheet not found');
    return [];
  }

  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];

  // Find column indices
  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  const users = [];

  // Build user list based on mode
  if (targetingOptions.mode === 'all_active') {
    // Return all active users
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[colMap['active_user']] === true && row[colMap['email']]) {
        users.push({
          user_id: row[colMap['user_id']],
          email: row[colMap['email']],
          display_name: row[colMap['display_name']],
          active_user: row[colMap['active_user']]
        });
      }
    }
  } else if (targetingOptions.mode === 'challenge') {
    // Get users in specific challenge
    const challengeId = targetingOptions.challengeId;
    const teamsSheet = ss.getSheetByName('Challenge_Teams');

    if (!teamsSheet) {
      Logger.log('Challenge_Teams sheet not found');
      return [];
    }

    const teamsData = teamsSheet.getDataRange().getValues();
    const teamsHeaders = teamsData[0];
    const teamsColMap = {};
    teamsHeaders.forEach((header, index) => {
      teamsColMap[header] = index;
    });

    // Get user IDs in challenge
    const challengeUserIds = [];
    for (let i = 1; i < teamsData.length; i++) {
      const row = teamsData[i];
      if (row[teamsColMap['challenge_id']] === challengeId) {
        challengeUserIds.push(row[teamsColMap['user_id']]);
      }
    }

    // Get user details for challenge participants
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userId = row[colMap['user_id']];

      if (row[colMap['active_user']] === true && row[colMap['email']]) {
        const inChallenge = challengeUserIds.includes(userId);

        // Include if in challenge, or if includeNoChallenge is true
        if (inChallenge || targetingOptions.includeNoChallenge) {
          users.push({
            user_id: userId,
            email: row[colMap['email']],
            display_name: row[colMap['display_name']],
            active_user: row[colMap['active_user']],
            in_challenge: inChallenge
          });
        }
      }
    }
  } else if (targetingOptions.mode === 'custom') {
    // Get specific users by ID
    const targetUserIds = targetingOptions.userIds || [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userId = row[colMap['user_id']];

      if (targetUserIds.includes(userId) && row[colMap['active_user']] === true && row[colMap['email']]) {
        users.push({
          user_id: userId,
          email: row[colMap['email']],
          display_name: row[colMap['display_name']],
          active_user: row[colMap['active_user']]
        });
      }
    }
  }

  return users;
}

// =============================================================================
// EMAIL PREVIEW
// =============================================================================

/**
 * Preview email for a specific user
 * @param {string} templateId - Template ID
 * @param {string} userId - User ID
 * @param {string} challengeId - Challenge ID (optional)
 * @returns {Object} Preview data: {subject, html_body, plain_body, user}
 */
function previewEmailForUser(templateId, userId, challengeId = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const template = getTemplateById(templateId);

  if (!template) {
    return {error: 'Template not found'};
  }

  const userInfo = getUserInfo(ss, userId);

  if (!userInfo) {
    return {error: 'User not found'};
  }

  // Replace tokens
  const subject = replaceTokens(template.subject, userId, challengeId);
  const html_body = replaceTokens(template.html_body, userId, challengeId);
  const plain_body = replaceTokens(template.plain_body, userId, challengeId);

  return {
    subject: subject,
    html_body: html_body,
    plain_body: plain_body,
    user: {
      user_id: userId,
      display_name: userInfo.display_name,
      email: userInfo.email
    }
  };
}

// =============================================================================
// CAMPAIGN SENDING
// =============================================================================

/**
 * Send email campaign to targeted users
 * @param {string} templateId - Template ID
 * @param {Object} targetingOptions - Targeting configuration
 * @param {string} trackingFlag - Optional tracking flag to update (e.g., 'welcome_email_sent')
 * @returns {Object} Send results: {sent, skipped, errors, details}
 */
function sendEmailCampaign(templateId, targetingOptions, trackingFlag = null) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const template = getTemplateById(templateId);

  if (!template) {
    return {
      sent: 0,
      skipped: 0,
      errors: 1,
      details: [{error: 'Template not found'}]
    };
  }

  // Get targeted users
  const users = getTargetedUsers(targetingOptions);

  const results = {
    sent: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  // Get challenge ID from targeting options (if applicable)
  const challengeId = targetingOptions.mode === 'challenge' ? targetingOptions.challengeId : null;

  // Send to each user
  users.forEach(user => {
    try {
      // Check tracking flag if provided
      if (trackingFlag) {
        const userInfo = getUserInfo(ss, user.user_id);
        if (userInfo && userInfo[trackingFlag] === true) {
          results.skipped++;
          results.details.push({
            user_id: user.user_id,
            status: 'skipped',
            reason: 'Already sent (tracking flag: ' + trackingFlag + ')'
          });
          return;
        }
      }

      // Replace tokens for this user
      const subject = replaceTokens(template.subject, user.user_id, challengeId);
      const html_body = replaceTokens(template.html_body, user.user_id, challengeId);
      const plain_body = replaceTokens(template.plain_body, user.user_id, challengeId);

      // Send email
      GmailApp.sendEmail(
        user.email.trim(),
        subject,
        plain_body,
        {
          htmlBody: html_body
        }
      );

      results.sent++;
      results.details.push({
        user_id: user.user_id,
        email: user.email,
        status: 'sent'
      });

      // Update tracking flag if provided
      if (trackingFlag) {
        updateUserTrackingFlag(user.user_id, trackingFlag, true);
      }

      Logger.log('Email sent to: ' + user.user_id + ' (' + user.email + ')');

    } catch (error) {
      results.errors++;
      results.details.push({
        user_id: user.user_id,
        email: user.email,
        status: 'error',
        error: error.toString()
      });

      Logger.log('Error sending to ' + user.user_id + ': ' + error.toString());
    }
  });

  return results;
}

/**
 * Update tracking flag for user
 * @param {string} userId - User ID
 * @param {string} flagName - Flag name (column name)
 * @param {boolean} value - Flag value
 */
function updateUserTrackingFlag(userId, flagName, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');

  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  // Find user row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colMap['user_id']] === userId) {
      // Update flag
      if (colMap[flagName] !== undefined) {
        sheet.getRange(i + 1, colMap[flagName] + 1).setValue(value);
      }
      break;
    }
  }
}

// =============================================================================
// TESTING FUNCTIONS
// =============================================================================

/**
 * Test token replacement with sample user
 */
function testTokenReplacement() {
  Logger.log('=== Testing Token Replacement ===');

  // Test with first active user
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];

  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  let testUserId = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][colMap['active_user']] === true) {
      testUserId = data[i][colMap['user_id']];
      break;
    }
  }

  if (!testUserId) {
    Logger.log('No active users found for testing');
    return;
  }

  Logger.log('Testing with user: ' + testUserId);

  // Get active challenge
  const challenge = getActiveChallenge(ss);
  const challengeId = challenge ? challenge.challenge_id : null;

  // Test template text
  const testTemplate = `
    Hi [display_name],

    Welcome to [challenge_name]!
    Start: [challenge_start_date]
    End: [challenge_end_date]
    Days remaining: [days_remaining]

    Your link: [deployment_URL]
    Your workouts: [total_workouts]
    Lifetime workouts: [lifetime_workouts]
    Team: [team_name]
    Team workouts: [team_total_workouts]
  `;

  const result = replaceTokens(testTemplate, testUserId, challengeId);
  Logger.log('Result:\n' + result);
}

/**
 * Test email preview
 */
function testEmailPreview() {
  Logger.log('=== Testing Email Preview ===');

  // Get first template
  const templates = getEmailTemplates();
  if (templates.length === 0) {
    Logger.log('No templates found');
    return;
  }

  const templateId = templates[0].template_id;
  Logger.log('Testing with template: ' + templateId);

  // Get first active user
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];

  const colMap = {};
  headers.forEach((header, index) => {
    colMap[header] = index;
  });

  let testUserId = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][colMap['active_user']] === true) {
      testUserId = data[i][colMap['user_id']];
      break;
    }
  }

  if (!testUserId) {
    Logger.log('No active users found');
    return;
  }

  const preview = previewEmailForUser(templateId, testUserId);
  Logger.log('Preview result:');
  Logger.log(JSON.stringify(preview, null, 2));
}

/**
 * Test user targeting
 */
function testTargeting() {
  Logger.log('=== Testing User Targeting ===');

  // Test 1: All active users
  Logger.log('\nTest 1: All Active Users');
  const allUsers = getTargetedUsers({mode: 'all_active'});
  Logger.log('Found ' + allUsers.length + ' active users');

  // Test 2: Challenge-based
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const challenge = getActiveChallenge(ss);
  if (challenge) {
    Logger.log('\nTest 2: Challenge-Based (' + challenge.challenge_id + ')');
    const challengeUsers = getTargetedUsers({
      mode: 'challenge',
      challengeId: challenge.challenge_id,
      includeNoChallenge: false
    });
    Logger.log('Found ' + challengeUsers.length + ' users in challenge');
  }

  // Test 3: Custom list
  Logger.log('\nTest 3: Custom User List');
  if (allUsers.length > 0) {
    const testUserIds = [allUsers[0].user_id];
    if (allUsers.length > 1) testUserIds.push(allUsers[1].user_id);

    const customUsers = getTargetedUsers({
      mode: 'custom',
      userIds: testUserIds
    });
    Logger.log('Requested ' + testUserIds.length + ' users, found ' + customUsers.length);
  }
}
