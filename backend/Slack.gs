/**
 * Slack Integration for A8 Workout Challenge App V2
 * Sends weekly workout summaries focused on collective goal progress
 */

// Configuration - Uses Script Properties for secure webhook storage
const SLACK_CONFIG = {
  webhookPropertyName: 'SLACK_WEBHOOK_URL', // Name of the Script Property containing webhook URL
  channelName: '#workout-challenge', // Optional: can be configured in webhook
  botName: 'A8 Fitness Bot',
  botEmoji: ':muscle:'
};

/**
 * Get Slack webhook URL from Script Properties
 */
function getSlackWebhookUrl() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty(SLACK_CONFIG.webhookPropertyName);
}

/**
 * Main function to send daily progress summary to Slack
 * Manually triggered via custom menu
 */
function sendDailyProgressSummary() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get the current statistics
    const stats = getDailyProgressStats(ss);

    // Format the message for Slack
    const slackMessage = formatDailySlackMessage(stats);

    // Send to Slack
    const result = sendToSlack(slackMessage);

    console.log('Daily progress summary sent to Slack:', result);
    return result;

  } catch (error) {
    console.error('Error sending daily progress summary:', error);
    throw error;
  }
}

/**
 * Get daily progress statistics for simplified Slack updates
 */
function getDailyProgressStats(ss) {
  const completionsSheet = ss.getSheetByName('Completions');
  const usersSheet = ss.getSheetByName('Users');
  const settingsSheet = ss.getSheetByName('Settings');

  if (!completionsSheet || !usersSheet || !settingsSheet) {
    throw new Error('Required sheets not found');
  }

  // Get settings from Settings sheet
  const settings = getSettingsAsObject(settingsSheet);

  // Get users data for team totals and display names
  const usersMap = getUsersMap(usersSheet);

  // Calculate total completions from all users
  let totalCompletions = 0;
  const teamTotals = {};

  Object.values(usersMap).forEach(user => {
    totalCompletions += parseInt(user.totalWorkouts) || 0;

    const team = user.team || 'No Team';
    if (!teamTotals[team]) {
      teamTotals[team] = 0;
    }
    teamTotals[team] += parseInt(user.totalWorkouts) || 0;
  });

  // Get today's completions
  const todaysCompletions = getTodaysCompletions(completionsSheet, usersMap);

  // Get today's coaching tip
  const coachingTip = getTodaysCoachingTip(ss);

  const totalGoal = parseInt(settings.total_goal) || 200;

  return {
    challengeName: settings.challenge_name || 'October Challenge',
    totalCompletions: totalCompletions,
    totalGoal: totalGoal,
    progressPercentage: Math.round((totalCompletions / totalGoal) * 100),
    teamTotals: teamTotals,
    todaysCompletions: todaysCompletions,
    coachingTip: coachingTip
  };
}

/**
 * Get settings as object from Settings sheet
 */
function getSettingsAsObject(settingsSheet) {
  const data = settingsSheet.getDataRange().getValues();
  const settings = {};

  for (let i = 0; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];
    if (key && key !== '') {
      settings[key] = value;
    }
  }

  return settings;
}


/**
 * Get today's coaching tip from Coaching sheet
 */
function getTodaysCoachingTip(ss) {
  const coachingSheet = ss.getSheetByName('Coaching');
  if (!coachingSheet) {
    return null; // Coaching sheet doesn't exist
  }

  const coachingData = coachingSheet.getDataRange().getValues();
  if (coachingData.length <= 1) {
    return null; // No data in coaching sheet
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Column A = date, Column B = coaching_tip
  for (let i = 1; i < coachingData.length; i++) {
    const tipDate = new Date(coachingData[i][0]);
    tipDate.setHours(0, 0, 0, 0);

    if (tipDate.getTime() === today.getTime()) {
      return coachingData[i][1]; // Return coaching_tip content
    }
  }

  return null; // No coaching tip for today
}

/**
 * Get today's completed workouts from Completions sheet
 */
function getTodaysCompletions(completionsSheet, usersMap) {
  const completionsData = completionsSheet.getDataRange().getValues();
  if (completionsData.length <= 1) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysCompletions = [];

  // Headers should be: timestamp, user_id, workout_id, team_name
  for (let i = 1; i < completionsData.length; i++) {
    const timestamp = completionsData[i][0];
    const userId = completionsData[i][1];

    if (!timestamp || !userId) continue;

    const completionDate = new Date(timestamp);

    // Check if completion is today
    if (completionDate >= today && completionDate < tomorrow) {
      const userInfo = usersMap[userId.toString().toLowerCase()];
      todaysCompletions.push({
        userId: userId,
        displayName: userInfo?.displayName || userId,
        timestamp: completionDate
      });
    }
  }

  // Sort by timestamp (most recent first)
  todaysCompletions.sort((a, b) => b.timestamp - a.timestamp);

  return todaysCompletions;
}

/**
 * Get users map from Users sheet
 */
function getUsersMap(usersSheet) {
  const usersData = usersSheet.getDataRange().getValues();
  const usersMap = {};

  if (usersData.length <= 1) return usersMap;

  // Headers should include: user_id, display_name, team_name, total_workouts
  const headers = usersData[0];
  const userIdCol = headers.indexOf('user_id');
  const displayNameCol = headers.indexOf('display_name');
  const teamCol = headers.indexOf('team_name');
  const totalWorkoutsCol = headers.indexOf('total_workouts');

  for (let i = 1; i < usersData.length; i++) {
    const userId = usersData[i][userIdCol];
    if (userId) {
      usersMap[userId.toString().toLowerCase()] = {
        displayName: usersData[i][displayNameCol] || userId,
        team: usersData[i][teamCol] || 'No Team',
        totalWorkouts: usersData[i][totalWorkoutsCol] || 0
      };
    }
  }

  return usersMap;
}



/**
 * Format the daily statistics into a simplified Slack message
 */
function formatDailySlackMessage(stats) {
  const blocks = [];

  // Header block
  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `${stats.challengeName} - Progress Update`,
      emoji: true
    }
  });

  // Overall progress toward goal
  const progressBar = createProgressBar(stats.progressPercentage);
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*🎯 Challenge Progress*\n${stats.totalCompletions} / ${stats.totalGoal} workouts (${stats.progressPercentage}%)\n${progressBar}`
    }
  });

  // Team contributions and today's completions in two-column layout
  if ((stats.teamTotals && Object.keys(stats.teamTotals).length > 1) ||
      (stats.todaysCompletions && stats.todaysCompletions.length > 0)) {
    blocks.push({ type: 'divider' });

    // Prepare team contributions text
    let teamText = '';
    if (stats.teamTotals && Object.keys(stats.teamTotals).length > 1) {
      teamText = '*👥 Team Contributions*\n';
      const sortedTeams = Object.entries(stats.teamTotals)
        .filter(([team]) => team !== 'No Team')
        .sort((a, b) => b[1] - a[1]);

      sortedTeams.forEach(([team, total]) => {
        teamText += `• ${team}: ${total} workouts\n`;
      });
    }

    // Prepare today's completions text
    let todaysText = '';
    if (stats.todaysCompletions && stats.todaysCompletions.length > 0) {
      todaysText = "*✅ Today's Completed Workouts*\n";
      stats.todaysCompletions.forEach(completion => {
        todaysText += `• ${completion.displayName}\n`;
      });
    } else {
      todaysText = "*✅ Today's Completed Workouts*\n_No workouts completed today yet_";
    }

    // Create two-column layout using fields
    const fields = [];
    if (teamText) {
      fields.push({
        type: 'mrkdwn',
        text: teamText.trim()
      });
    }
    fields.push({
      type: 'mrkdwn',
      text: todaysText.trim()
    });

    blocks.push({
      type: 'section',
      fields: fields
    });
  }

  // Coaching tip (if available for today)
  if (stats.coachingTip) {
    blocks.push({ type: 'divider' });

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🎯 Today's Coaching Tip*\n${stats.coachingTip}`
      }
    });
  }

  // Motivational message based on progress
  blocks.push({ type: 'divider' });

  let motivationalMessage = '';
  if (stats.progressPercentage >= 100) {
    motivationalMessage = `🎉 *GOAL ACHIEVED!* Incredible work, team! You've crushed the ${stats.totalGoal} workout goal!`;
  } else if (stats.progressPercentage >= 75) {
    motivationalMessage = `🔥 *So close!* Just ${stats.totalGoal - stats.totalCompletions} workouts to go! Keep pushing!`;
  } else if (stats.progressPercentage >= 50) {
    motivationalMessage = `💪 *Halfway there!* Great momentum - let's keep it going!`;
  } else if (stats.progressPercentage >= 25) {
    motivationalMessage = `🚀 *Good progress!* Every workout counts toward our ${stats.totalGoal} goal!`;
  } else {
    motivationalMessage = `💪 *Let's build momentum!* Together we can reach ${stats.totalGoal} workouts!`;
  }

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: motivationalMessage
    }
  });

  return {
    username: SLACK_CONFIG.botName,
    icon_emoji: SLACK_CONFIG.botEmoji,
    blocks: blocks
  };
}

/**
 * Create a visual progress bar
 */
function createProgressBar(percentage) {
  const filled = Math.round(percentage / 5); // 20 segments total
  const empty = 20 - filled;
  return '`' + '█'.repeat(Math.min(filled, 20)) + '░'.repeat(Math.max(empty, 0)) + '`';
}

/**
 * Send message to Slack via webhook
 */
function sendToSlack(message) {
  const webhookUrl = getSlackWebhookUrl();

  if (!webhookUrl) {
    throw new Error(`Please set the Slack webhook URL in Script Properties with key: ${SLACK_CONFIG.webhookPropertyName}`);
  }

  const payload = JSON.stringify(message);

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(webhookUrl, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode === 200) {
      console.log('Successfully sent to Slack');
      return { success: true, response: responseText };
    } else {
      console.error('Slack API error:', responseCode, responseText);
      return { success: false, error: `HTTP ${responseCode}: ${responseText}` };
    }
  } catch (error) {
    console.error('Error sending to Slack:', error);
    throw error;
  }
}

/**
 * Send daily reminder to Slack
 */
function sendDailyReminder() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Settings');
    const workoutsSheet = ss.getSheetByName('Workouts');

    const settings = getSettingsAsObject(settingsSheet);
    const todaysWorkout = getTodaysWorkout(workoutsSheet);

    const slackMessage = formatDailyReminder(todaysWorkout, settings);
    const result = sendToSlack(slackMessage);

    console.log('Daily reminder sent to Slack:', result);
    return result;

  } catch (error) {
    console.error('Error sending daily reminder:', error);
    throw error;
  }
}

/**
 * Get today's workout
 */
function getTodaysWorkout(workoutsSheet) {
  const data = workoutsSheet.getDataRange().getValues();
  const headers = data[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find column indices
  const nameCol = headers.indexOf('workout_name');
  const instructionsCol = headers.indexOf('instructions');
  const startDateCol = headers.indexOf('start_date');
  const endDateCol = headers.indexOf('end_date');

  for (let i = 1; i < data.length; i++) {
    const startDate = new Date(data[i][startDateCol]);
    const endDate = new Date(data[i][endDateCol]);
    endDate.setHours(23, 59, 59, 999);

    if (today >= startDate && today <= endDate) {
      const movements = [];

      // Collect movements (movement_1, reps_1, alt_1, etc.)
      for (let j = 1; j <= 5; j++) {
        const movementCol = headers.indexOf(`movement_${j}`);
        const repsCol = headers.indexOf(`reps_${j}`);

        if (movementCol !== -1 && data[i][movementCol]) {
          movements.push({
            movement: data[i][movementCol],
            reps: data[i][repsCol] || ''
          });
        }
      }

      return {
        name: data[i][nameCol] || 'Today\'s Workout',
        instructions: data[i][instructionsCol] || '',
        movements: movements
      };
    }
  }

  return null;
}

/**
 * Format daily reminder message
 */
function formatDailyReminder(workout, settings) {
  const blocks = [];

  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: '🌅 Daily Workout Reminder',
      emoji: true
    }
  });

  if (workout) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Today's Workout: ${workout.name}*`
      }
    });

    if (workout.instructions) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `_${workout.instructions}_`
        }
      });
    }

    if (workout.movements.length > 0) {
      let movementsText = '';
      workout.movements.forEach(m => {
        movementsText += `• ${m.movement}: ${m.reps}\n`;
      });

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: movementsText.trim()
        }
      });
    }
  } else {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Rest Day* 🧘\nNo prescribed workout today, but feel free to log an external workout!'
      }
    });
  }

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `💪 *Log your workout:* ${settings.deployed_URL || '[App URL not set]'}`
    }
  });

  return {
    username: SLACK_CONFIG.botName,
    icon_emoji: SLACK_CONFIG.botEmoji,
    blocks: blocks
  };
}

/**
 * Utility function to format dates
 */
function formatDate(date) {
  const options = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Test functions
 */

function testDailyProgressSummary() {
  console.log('Testing daily progress summary...');
  try {
    const result = sendDailyProgressSummary();
    console.log('Test complete:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

function testDailyReminder() {
  console.log('Testing daily reminder...');
  try {
    const result = sendDailyReminder();
    console.log('Test complete:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

function testDataCollection() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stats = getDailyProgressStats(ss);

  console.log('Daily Progress Statistics:', JSON.stringify(stats, null, 2));

  const message = formatDailySlackMessage(stats);
  console.log('Formatted Message:', JSON.stringify(message, null, 2));

  return stats;
}


/**
 * Helper function to set the Slack webhook URL in Script Properties
 */
function setSlackWebhookUrl(webhookUrl) {
  if (!webhookUrl) {
    throw new Error('Please provide a webhook URL');
  }

  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(SLACK_CONFIG.webhookPropertyName, webhookUrl);

  console.log(`Webhook URL saved to Script Properties with key: ${SLACK_CONFIG.webhookPropertyName}`);
  return 'Webhook URL configured successfully';
}

/**
 * Helper function to verify webhook configuration
 */
function verifySlackConfiguration() {
  const webhookUrl = getSlackWebhookUrl();

  if (!webhookUrl) {
    console.log(`❌ No webhook URL found. Please run setSlackWebhookUrl() with your webhook URL`);
    return false;
  }

  console.log(`✅ Webhook URL is configured in Script Properties`);
  console.log(`   Property name: ${SLACK_CONFIG.webhookPropertyName}`);
  console.log(`   Bot name: ${SLACK_CONFIG.botName}`);
  console.log(`   Bot emoji: ${SLACK_CONFIG.botEmoji}`);
  return true;
}