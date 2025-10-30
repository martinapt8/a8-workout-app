/**
 * A8 Workout Challenge App - Custom Menu Script
 * 
 * This script creates a custom menu in the Google Spreadsheet
 * for administrative functions like sending welcome emails.
 * 
 * To use:
 * 1. Open your Google Spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Create a new file called "Menu.gs"
 * 4. Paste this code
 * 5. Save and refresh your spreadsheet
 * 6. The "A8 Custom Menu" will appear in the menu bar
 */

/**
 * Creates custom menu when spreadsheet opens
 * This function runs automatically when the spreadsheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  // Create the custom menu
  ui.createMenu('A8 Custom Menu')
    // User Management
    .addItem('Migrate Form Responses', 'migrateFormResponses')
    .addItem('Send Welcome Email', 'sendWelcomeEmail')
    .addItem('Send Update Email', 'sendUpdateEmail')
    .addSeparator()
    // Challenge Management (NEW)
    .addItem('Create New Challenge', 'promptCreateChallenge')
    .addItem('Set Active Challenge', 'promptSetActiveChallenge')
    .addItem('View Challenge Stats', 'promptViewChallengeStats')
    .addItem('End Challenge', 'promptEndChallenge')
    .addSeparator()
    // Communication
    .addItem('Send Slack Progress Update', 'sendDailyProgressSummary')
    .addSeparator()
    // Testing & Migration
    .addItem('Test Migration Preview', 'testMigrationPreview')
    .addToUi();

  console.log('A8 Custom Menu created successfully');
}

/**
 * ============================================
 * CHALLENGE MANAGEMENT MENU PROMPTS
 * Added: October 30, 2025
 * ============================================
 */

/**
 * Prompt user to create a new challenge
 */
function promptCreateChallenge() {
  const ui = SpreadsheetApp.getUi();

  try {
    const idResult = ui.prompt(
      'Create New Challenge - Step 1/5',
      'Challenge ID (e.g., winter_warrior_dec2025):',
      ui.ButtonSet.OK_CANCEL
    );
    if (idResult.getSelectedButton() !== ui.Button.OK) return;
    const challengeId = idResult.getResponseText().trim();

    if (!challengeId) {
      ui.alert('Error', 'Challenge ID is required', ui.ButtonSet.OK);
      return;
    }

    const nameResult = ui.prompt(
      'Create New Challenge - Step 2/5',
      'Challenge Name (e.g., Winter Warrior Challenge):',
      ui.ButtonSet.OK_CANCEL
    );
    if (nameResult.getSelectedButton() !== ui.Button.OK) return;
    const challengeName = nameResult.getResponseText().trim();

    if (!challengeName) {
      ui.alert('Error', 'Challenge name is required', ui.ButtonSet.OK);
      return;
    }

    const startResult = ui.prompt(
      'Create New Challenge - Step 3/5',
      'Start Date (MM/DD/YYYY):',
      ui.ButtonSet.OK_CANCEL
    );
    if (startResult.getSelectedButton() !== ui.Button.OK) return;
    const startDate = new Date(startResult.getResponseText());

    if (isNaN(startDate.getTime())) {
      ui.alert('Error', 'Invalid start date format. Use MM/DD/YYYY', ui.ButtonSet.OK);
      return;
    }

    const endResult = ui.prompt(
      'Create New Challenge - Step 4/5',
      'End Date (MM/DD/YYYY):',
      ui.ButtonSet.OK_CANCEL
    );
    if (endResult.getSelectedButton() !== ui.Button.OK) return;
    const endDate = new Date(endResult.getResponseText());

    if (isNaN(endDate.getTime())) {
      ui.alert('Error', 'Invalid end date format. Use MM/DD/YYYY', ui.ButtonSet.OK);
      return;
    }

    const goalResult = ui.prompt(
      'Create New Challenge - Step 5/5',
      'Total Goal (number of workouts):',
      ui.ButtonSet.OK_CANCEL
    );
    if (goalResult.getSelectedButton() !== ui.Button.OK) return;
    const totalGoal = parseInt(goalResult.getResponseText());

    if (isNaN(totalGoal) || totalGoal <= 0) {
      ui.alert('Error', 'Total goal must be a positive number', ui.ButtonSet.OK);
      return;
    }

    // Create the challenge (not active by default)
    createNewChallenge(challengeId, challengeName, startDate, endDate, totalGoal, false);

    ui.alert(
      'Success!',
      `Challenge "${challengeName}" created successfully!\n\n` +
      `Next steps:\n` +
      `1. Assign teams: Use "A8 Custom Menu → Assign Teams" or manually edit Challenge_Teams sheet\n` +
      `2. Add workouts: Add rows to Workouts sheet with challenge_id = "${challengeId}"\n` +
      `3. Activate: Use "A8 Custom Menu → Set Active Challenge" when ready to launch`,
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('Error', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Prompt user to set active challenge
 */
function promptSetActiveChallenge() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Show available challenges
    const challenges = getAllChallenges();

    if (challenges.length === 0) {
      ui.alert('No Challenges', 'No challenges found. Create a challenge first.', ui.ButtonSet.OK);
      return;
    }

    let challengeList = 'Available Challenges:\n\n';
    challenges.forEach(c => {
      const activeStatus = c.is_active ? ' (ACTIVE)' : '';
      challengeList += `• ${c.challenge_id} - ${c.challenge_name}${activeStatus}\n`;
    });

    const result = ui.prompt(
      'Set Active Challenge',
      challengeList + '\nEnter Challenge ID to activate:',
      ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
      const challengeId = result.getResponseText().trim();

      if (!challengeId) {
        ui.alert('Error', 'Challenge ID is required', ui.ButtonSet.OK);
        return;
      }

      setActiveChallenge(challengeId);
      ui.alert('Success!', `Challenge "${challengeId}" is now active!`, ui.ButtonSet.OK);
    }
  } catch (error) {
    ui.alert('Error', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Prompt user to view challenge statistics
 */
function promptViewChallengeStats() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Show available challenges
    const challenges = getAllChallenges();

    if (challenges.length === 0) {
      ui.alert('No Challenges', 'No challenges found. Create a challenge first.', ui.ButtonSet.OK);
      return;
    }

    let challengeList = 'Available Challenges:\n\n';
    challenges.forEach(c => {
      challengeList += `• ${c.challenge_id} - ${c.challenge_name}\n`;
    });

    const result = ui.prompt(
      'View Challenge Stats',
      challengeList + '\nEnter Challenge ID:',
      ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
      const challengeId = result.getResponseText().trim();

      if (!challengeId) {
        ui.alert('Error', 'Challenge ID is required', ui.ButtonSet.OK);
        return;
      }

      const stats = getChallengeStats(challengeId);

      const teamBreakdown = Object.entries(stats.team_totals)
        .map(([team, count]) => `  • ${team}: ${count} workouts`)
        .join('\n');

      const message = `
📊 Challenge Statistics: ${challengeId}

Total Completions: ${stats.total_completions}
Unique Participants: ${stats.unique_participants}

Workout Types:
  • Prescribed: ${stats.workout_types.prescribed}
  • Other: ${stats.workout_types.other}
  • AI Generated: ${stats.workout_types.ai}

Team Totals:
${teamBreakdown || '  (No team data)'}
      `;

      ui.alert('Challenge Stats', message, ui.ButtonSet.OK);
    }
  } catch (error) {
    ui.alert('Error', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Prompt user to end a challenge
 */
function promptEndChallenge() {
  const ui = SpreadsheetApp.getUi();

  try {
    // Show available challenges
    const challenges = getAllChallenges();

    if (challenges.length === 0) {
      ui.alert('No Challenges', 'No challenges found.', ui.ButtonSet.OK);
      return;
    }

    let challengeList = 'Active/Upcoming Challenges:\n\n';
    const activeChallenges = challenges.filter(c => c.status !== 'completed');

    if (activeChallenges.length === 0) {
      ui.alert('No Active Challenges', 'All challenges are already completed.', ui.ButtonSet.OK);
      return;
    }

    activeChallenges.forEach(c => {
      challengeList += `• ${c.challenge_id} - ${c.challenge_name} (${c.status})\n`;
    });

    const result = ui.prompt(
      'End Challenge',
      challengeList + '\nEnter Challenge ID to end:',
      ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
      const challengeId = result.getResponseText().trim();

      if (!challengeId) {
        ui.alert('Error', 'Challenge ID is required', ui.ButtonSet.OK);
        return;
      }

      // Confirm
      const confirm = ui.alert(
        'Confirm',
        `Are you sure you want to end challenge "${challengeId}"?\n\n` +
        `This will:\n` +
        `• Set is_active = FALSE\n` +
        `• Set status = "completed"\n` +
        `• Keep all data intact\n\n` +
        `Continue?`,
        ui.ButtonSet.YES_NO
      );

      if (confirm === ui.Button.YES) {
        endChallenge(challengeId);
        ui.alert('Success!', `Challenge "${challengeId}" has been ended.`, ui.ButtonSet.OK);
      }
    }
  } catch (error) {
    ui.alert('Error', error.message, ui.ButtonSet.OK);
  }
}

