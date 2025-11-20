/**
 * TeamPlaceholders.gs
 *
 * Handles placeholder team assignment for challenges
 * Randomly distributes users with empty team_name into evenly-sized teams
 *
 * Created: November 2025
 */

/**
 * Main menu function - prompts admin through placeholder team assignment
 * Multi-step dialog flow:
 * 1. Select challenge_id
 * 2. Count unassigned users
 * 3. Show team distribution options
 * 4. Get team configuration input
 * 5. Confirm assignment
 * 6. Execute randomized assignment
 */
function promptSetPlaceholderTeams() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    // ===========================================
    // STEP 1: Get challenge_id
    // ===========================================
    const challengesSheet = ss.getSheetByName('Challenges');
    if (!challengesSheet) {
      ui.alert('Error', 'Challenges sheet not found', ui.ButtonSet.OK);
      return;
    }

    const challengeData = challengesSheet.getDataRange().getValues();
    const challengeHeaders = challengeData[0];
    const challengeIdCol = challengeHeaders.indexOf('challenge_id');
    const challengeNameCol = challengeHeaders.indexOf('challenge_name');
    const statusCol = challengeHeaders.indexOf('status');

    if (challengeIdCol === -1) {
      ui.alert('Error', 'challenge_id column not found in Challenges sheet', ui.ButtonSet.OK);
      return;
    }

    // Build challenge list
    let challengeList = 'Available Challenges:\n\n';
    for (let i = 1; i < challengeData.length; i++) {
      const id = challengeData[i][challengeIdCol];
      const name = challengeNameCol !== -1 ? challengeData[i][challengeNameCol] : '';
      const status = statusCol !== -1 ? challengeData[i][statusCol] : '';
      const statusLabel = status === 'active' ? ' (ACTIVE)' : status === 'upcoming' ? ' (UPCOMING)' : '';
      challengeList += `• ${id}${name ? ' - ' + name : ''}${statusLabel}\n`;
    }

    const challengePrompt = ui.prompt(
      'Set Placeholder Teams - Step 1/4',
      challengeList + '\nEnter Challenge ID:',
      ui.ButtonSet.OK_CANCEL
    );

    if (challengePrompt.getSelectedButton() !== ui.Button.OK) return;

    const challengeId = challengePrompt.getResponseText().trim();
    if (!challengeId) {
      ui.alert('Error', 'Challenge ID is required', ui.ButtonSet.OK);
      return;
    }

    // Validate challenge exists
    let challengeExists = false;
    for (let i = 1; i < challengeData.length; i++) {
      if (challengeData[i][challengeIdCol] === challengeId) {
        challengeExists = true;
        break;
      }
    }

    if (!challengeExists) {
      ui.alert('Error', `Challenge "${challengeId}" not found`, ui.ButtonSet.OK);
      return;
    }

    // ===========================================
    // STEP 2: Count unassigned users
    // ===========================================
    const teamsSheet = ss.getSheetByName('Challenge_Teams');
    if (!teamsSheet) {
      ui.alert('Error', 'Challenge_Teams sheet not found', ui.ButtonSet.OK);
      return;
    }

    const teamsData = teamsSheet.getDataRange().getValues();
    const teamsHeaders = teamsData[0];
    const teamChallengeIdCol = teamsHeaders.indexOf('challenge_id');
    const teamUserIdCol = teamsHeaders.indexOf('user_id');
    const teamNameCol = teamsHeaders.indexOf('team_name');

    if (teamChallengeIdCol === -1 || teamUserIdCol === -1 || teamNameCol === -1) {
      ui.alert('Error', 'Required columns not found in Challenge_Teams sheet', ui.ButtonSet.OK);
      return;
    }

    // Count users needing assignment (matching challenge_id with empty team_name)
    const unassignedUsers = [];
    for (let i = 1; i < teamsData.length; i++) {
      const rowChallengeId = teamsData[i][teamChallengeIdCol];
      const rowUserId = teamsData[i][teamUserIdCol];
      const rowTeamName = teamsData[i][teamNameCol];

      if (rowChallengeId === challengeId &&
          rowUserId &&
          (!rowTeamName || rowTeamName.toString().trim() === '')) {
        unassignedUsers.push(rowUserId);
      }
    }

    if (unassignedUsers.length === 0) {
      ui.alert(
        'No Users Found',
        `No users needing team assignment for challenge "${challengeId}".\n\nAll users already have teams assigned.`,
        ui.ButtonSet.OK
      );
      return;
    }

    // ===========================================
    // STEP 3: Show team distribution options
    // ===========================================
    const userCount = unassignedUsers.length;
    let optionsText = `Found ${userCount} user${userCount !== 1 ? 's' : ''} needing team assignment.\n\n`;
    optionsText += 'Suggested team configurations:\n\n';

    // Calculate reasonable team configurations (2-10 teams)
    const suggestions = [];
    for (let numTeams = 2; numTeams <= Math.min(10, userCount); numTeams++) {
      const baseSize = Math.floor(userCount / numTeams);
      const remainder = userCount % numTeams;

      if (remainder === 0) {
        // Perfect division
        suggestions.push(`• ${numTeams} teams of ${baseSize} users each`);
      } else {
        // Uneven - create smaller team for remainder
        suggestions.push(`• ${numTeams - 1} teams of ${baseSize} + 1 team of ${remainder} users`);
      }
    }

    optionsText += suggestions.join('\n');
    optionsText += '\n\n(Teams will be assigned as Team A, Team B, Team C, etc.)';

    ui.alert(
      'Team Distribution Options',
      optionsText,
      ui.ButtonSet.OK
    );

    // ===========================================
    // STEP 4: Get team configuration
    // ===========================================
    const numTeamsPrompt = ui.prompt(
      'Set Placeholder Teams - Step 2/4',
      'How many teams do you want to create?',
      ui.ButtonSet.OK_CANCEL
    );

    if (numTeamsPrompt.getSelectedButton() !== ui.Button.OK) return;

    const numTeams = parseInt(numTeamsPrompt.getResponseText().trim());
    if (isNaN(numTeams) || numTeams < 2 || numTeams > userCount) {
      ui.alert('Error', `Invalid number of teams. Must be between 2 and ${userCount}.`, ui.ButtonSet.OK);
      return;
    }

    const usersPerTeamPrompt = ui.prompt(
      'Set Placeholder Teams - Step 3/4',
      'How many users per team (base size)?',
      ui.ButtonSet.OK_CANCEL
    );

    if (usersPerTeamPrompt.getSelectedButton() !== ui.Button.OK) return;

    const usersPerTeam = parseInt(usersPerTeamPrompt.getResponseText().trim());
    if (isNaN(usersPerTeam) || usersPerTeam < 1) {
      ui.alert('Error', 'Invalid users per team. Must be at least 1.', ui.ButtonSet.OK);
      return;
    }

    // Calculate distribution
    const totalSlots = (numTeams - 1) * usersPerTeam;
    const remainderSize = userCount - totalSlots;

    if (remainderSize < 0) {
      ui.alert(
        'Error',
        `Configuration doesn't fit users.\n\n${numTeams - 1} teams × ${usersPerTeam} users = ${totalSlots} slots\nBut you have ${userCount} users.\n\nPlease adjust team configuration.`,
        ui.ButtonSet.OK
      );
      return;
    }

    if (remainderSize > usersPerTeam) {
      ui.alert(
        'Warning',
        `Remainder team (${remainderSize} users) is larger than base team size (${usersPerTeam}).\n\nConsider adjusting configuration for more balanced teams.`,
        ui.ButtonSet.OK
      );
    }

    // ===========================================
    // STEP 5: Confirmation
    // ===========================================
    let confirmMsg = `Ready to assign placeholder teams for "${challengeId}":\n\n`;
    confirmMsg += `• ${userCount} users will be randomly assigned\n`;
    confirmMsg += `• ${numTeams - 1} teams of ${usersPerTeam} users\n`;
    confirmMsg += `• 1 team of ${remainderSize} users\n`;
    confirmMsg += `• Team names: Team A, Team B, Team C...\n`;
    confirmMsg += `• Team colors will be left empty for manual assignment\n\n`;
    confirmMsg += 'Proceed with assignment?';

    const confirm = ui.alert(
      'Confirm Placeholder Teams',
      confirmMsg,
      ui.ButtonSet.YES_NO
    );

    if (confirm !== ui.Button.YES) return;

    // ===========================================
    // STEP 6: Execute assignment
    // ===========================================
    const result = setPlaceholderTeams(challengeId, numTeams, usersPerTeam);

    ui.alert(
      'Success!',
      `✓ ${result.assigned} users assigned to ${result.teamsCreated} teams for challenge "${challengeId}".\n\nTeam colors are empty - please assign colors in Challenge_Teams sheet.`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('Error', `Failed to set placeholder teams:\n\n${error.message}`, ui.ButtonSet.OK);
    Logger.log('Error in promptSetPlaceholderTeams: ' + error.message);
  }
}

/**
 * Core function - assigns placeholder teams to unassigned users
 *
 * @param {string} challengeId - Challenge ID to assign teams for
 * @param {number} numTeams - Total number of teams to create
 * @param {number} usersPerTeam - Base number of users per team (last team may be smaller)
 * @returns {Object} - {assigned: number, teamsCreated: number}
 */
function setPlaceholderTeams(challengeId, numTeams, usersPerTeam) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    throw new Error('Challenge_Teams sheet not found');
  }

  // Get all data
  const teamsData = teamsSheet.getDataRange().getValues();
  const teamsHeaders = teamsData[0];
  const teamChallengeIdCol = teamsHeaders.indexOf('challenge_id');
  const teamUserIdCol = teamsHeaders.indexOf('user_id');
  const teamNameCol = teamsHeaders.indexOf('team_name');

  // Find unassigned users
  const unassignedUsers = [];
  for (let i = 1; i < teamsData.length; i++) {
    const rowChallengeId = teamsData[i][teamChallengeIdCol];
    const rowUserId = teamsData[i][teamUserIdCol];
    const rowTeamName = teamsData[i][teamNameCol];

    if (rowChallengeId === challengeId &&
        rowUserId &&
        (!rowTeamName || rowTeamName.toString().trim() === '')) {
      unassignedUsers.push(rowUserId);
    }
  }

  if (unassignedUsers.length === 0) {
    throw new Error('No unassigned users found for this challenge');
  }

  // Shuffle users randomly (Fisher-Yates algorithm)
  for (let i = unassignedUsers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unassignedUsers[i], unassignedUsers[j]] = [unassignedUsers[j], unassignedUsers[i]];
  }

  // Generate team names (Team A, Team B, Team C...)
  const teamNames = [];
  for (let i = 0; i < numTeams; i++) {
    const letter = String.fromCharCode(65 + i); // A=65, B=66, etc.
    teamNames.push(`Team ${letter}`);
  }

  // Build assignments object for bulkAssignTeams
  const assignments = {};
  let userIndex = 0;

  // Assign users to teams
  for (let teamIdx = 0; teamIdx < numTeams; teamIdx++) {
    const teamName = teamNames[teamIdx];
    let teamSize = usersPerTeam;

    // Last team gets the remainder
    if (teamIdx === numTeams - 1) {
      teamSize = unassignedUsers.length - userIndex;
    }

    // Assign users to this team
    for (let i = 0; i < teamSize && userIndex < unassignedUsers.length; i++) {
      const userId = unassignedUsers[userIndex];
      assignments[userId] = {
        teamName: teamName,
        teamColor: '' // Leave empty for admin to fill
      };
      userIndex++;
    }
  }

  // Use existing bulkAssignTeams function from AdminChallenges.gs
  const assignedCount = bulkAssignTeams(challengeId, assignments);

  return {
    assigned: assignedCount,
    teamsCreated: numTeams
  };
}

/**
 * Helper function - get count of unassigned users for a challenge
 * Useful for testing or manual checks
 *
 * @param {string} challengeId - Challenge ID to check
 * @returns {number} - Count of users with empty team_name
 */
function getUnassignedUserCount(challengeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    return 0;
  }

  const teamsData = teamsSheet.getDataRange().getValues();
  const teamsHeaders = teamsData[0];
  const teamChallengeIdCol = teamsHeaders.indexOf('challenge_id');
  const teamUserIdCol = teamsHeaders.indexOf('user_id');
  const teamNameCol = teamsHeaders.indexOf('team_name');

  let count = 0;
  for (let i = 1; i < teamsData.length; i++) {
    const rowChallengeId = teamsData[i][teamChallengeIdCol];
    const rowUserId = teamsData[i][teamUserIdCol];
    const rowTeamName = teamsData[i][teamNameCol];

    if (rowChallengeId === challengeId &&
        rowUserId &&
        (!rowTeamName || rowTeamName.toString().trim() === '')) {
      count++;
    }
  }

  return count;
}
