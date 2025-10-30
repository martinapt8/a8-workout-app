/**
 * Migration Scripts for Multi-Challenge Architecture
 * Created: October 30, 2025
 * Purpose: Migrate from single-challenge to multi-challenge system
 *
 * CRITICAL FIXES APPLIED:
 * - Schema validation before migration
 * - Timezone-aware date comparisons
 * - Column existence checks
 * - Settings sheet cleanup
 *
 * USAGE:
 * 1. Run validateSchemaBeforeMigration() first
 * 2. Run testMigration() to preview changes
 * 3. Run runFullMigration() to execute
 * 4. Run cleanupDeprecatedSettingsKeys() to finalize
 */

/**
 * STEP 1: Validate schema before migration
 * Checks that all required columns exist
 */
function validateSchemaBeforeMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const errors = [];

  // Check Challenges sheet exists
  const challengesSheet = ss.getSheetByName('Challenges');
  if (!challengesSheet) {
    errors.push('❌ Challenges sheet not found');
  } else {
    const challengesHeaders = challengesSheet.getDataRange().getValues()[0];
    const requiredChallengesCols = ['challenge_id', 'challenge_name', 'start_date', 'end_date', 'total_goal', 'is_active', 'status'];
    requiredChallengesCols.forEach(col => {
      if (!challengesHeaders.includes(col)) {
        errors.push(`❌ Challenges sheet missing column: ${col}`);
      }
    });

    // Check if initial row exists
    const challengesData = challengesSheet.getDataRange().getValues();
    if (challengesData.length < 2) {
      errors.push('❌ Challenges sheet has no data rows (needs daily_dose_oct2025 row)');
    }
  }

  // Check Challenge_Teams sheet exists
  const teamsSheet = ss.getSheetByName('Challenge_Teams');
  if (!teamsSheet) {
    errors.push('❌ Challenge_Teams sheet not found');
  } else {
    const teamsHeaders = teamsSheet.getDataRange().getValues()[0];
    const requiredTeamsCols = ['challenge_id', 'user_id', 'team_name', 'team_color'];
    requiredTeamsCols.forEach(col => {
      if (!teamsHeaders.includes(col)) {
        errors.push(`❌ Challenge_Teams sheet missing column: ${col}`);
      }
    });
  }

  // Check Workouts sheet has challenge_id column
  const workoutsSheet = ss.getSheetByName('Workouts');
  if (!workoutsSheet) {
    errors.push('❌ Workouts sheet not found');
  } else {
    const workoutsHeaders = workoutsSheet.getDataRange().getValues()[0];
    if (!workoutsHeaders.includes('challenge_id')) {
      errors.push('❌ Workouts sheet missing column: challenge_id');
    }
  }

  // Check Completions sheet has challenge_id column
  const completionsSheet = ss.getSheetByName('Completions');
  if (!completionsSheet) {
    errors.push('❌ Completions sheet not found');
  } else {
    const completionsHeaders = completionsSheet.getDataRange().getValues()[0];
    if (!completionsHeaders.includes('challenge_id')) {
      errors.push('❌ Completions sheet missing column: challenge_id');
    }
  }

  // Check Users sheet has active_challenge_id column
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    errors.push('❌ Users sheet not found');
  } else {
    const usersHeaders = usersSheet.getDataRange().getValues()[0];
    if (!usersHeaders.includes('active_challenge_id')) {
      errors.push('❌ Users sheet missing column: active_challenge_id');
    }
  }

  // Report results
  if (errors.length > 0) {
    Logger.log('==========================================');
    Logger.log('SCHEMA VALIDATION FAILED');
    Logger.log('==========================================');
    errors.forEach(error => Logger.log(error));
    Logger.log('==========================================');
    Logger.log('FIX THESE ISSUES BEFORE RUNNING MIGRATION');
    Logger.log('Refer to PHASE_1_SHEET_CREATION_GUIDE.md');
    Logger.log('==========================================');
    throw new Error('Schema validation failed. See logs for details.');
  } else {
    Logger.log('==========================================');
    Logger.log('✅ SCHEMA VALIDATION PASSED');
    Logger.log('==========================================');
    Logger.log('All required sheets and columns exist.');
    Logger.log('Safe to proceed with migration.');
    Logger.log('Next step: Run testMigration()');
    Logger.log('==========================================');
  }
}

/**
 * STEP 2: Test migration - shows what will change without modifying data
 */
function testMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('==========================================');
  Logger.log('MIGRATION PREVIEW');
  Logger.log('==========================================');

  // Preview Workouts
  const workoutsSheet = ss.getSheetByName('Workouts');
  const workoutsData = workoutsSheet.getDataRange().getValues();
  const workoutsHeaders = workoutsData[0];
  const challengeIdColWorkouts = workoutsHeaders.indexOf('challenge_id');

  let workoutsToUpdate = 0;
  for (let i = 1; i < workoutsData.length; i++) {
    if (workoutsData[i][0] && !workoutsData[i][challengeIdColWorkouts]) { // Has workout_id, no challenge_id
      workoutsToUpdate++;
    }
  }
  Logger.log(`📋 Workouts: Will update ${workoutsToUpdate} rows with challenge_id = "daily_dose_oct2025"`);

  // Preview Completions
  const completionsSheet = ss.getSheetByName('Completions');
  const completionsData = completionsSheet.getDataRange().getValues();
  const completionsHeaders = completionsData[0];
  const challengeIdColCompletions = completionsHeaders.indexOf('challenge_id');

  let completionsToUpdate = 0;
  let yearRoundCount = 0;
  const settings = getSettings(ss);
  const timezone = settings.timezone || 'America/New_York';

  // Get challenge dates (use app timezone)
  const challengeStart = new Date('10/1/2025');
  const challengeEnd = new Date('11/5/2025');
  challengeStart.setHours(0, 0, 0, 0);
  challengeEnd.setHours(23, 59, 59, 999);

  for (let i = 1; i < completionsData.length; i++) {
    if (!completionsData[i][challengeIdColCompletions]) { // No challenge_id yet
      const timestamp = new Date(completionsData[i][0]);
      const timestampInAppTz = new Date(timestamp.toLocaleString("en-US", { timeZone: timezone }));

      if (timestampInAppTz >= challengeStart && timestampInAppTz <= challengeEnd) {
        completionsToUpdate++;
      } else {
        yearRoundCount++;
      }
    }
  }
  Logger.log(`📋 Completions: Will update ${completionsToUpdate + yearRoundCount} rows`);
  Logger.log(`   - ${completionsToUpdate} assigned to "daily_dose_oct2025"`);
  Logger.log(`   - ${yearRoundCount} assigned to "year_round" (outside challenge dates)`);

  // Preview Users
  const usersSheet = ss.getSheetByName('Users');
  const usersData = usersSheet.getDataRange().getValues();
  const usersHeaders = usersData[0];
  const activeUserCol = usersHeaders.indexOf('active_user');
  const activeChallengeIdCol = usersHeaders.indexOf('active_challenge_id');

  let usersToUpdate = 0;
  for (let i = 1; i < usersData.length; i++) {
    if (usersData[i][activeUserCol] === true && !usersData[i][activeChallengeIdCol]) {
      usersToUpdate++;
    }
  }
  Logger.log(`📋 Users: Will update ${usersToUpdate} active users with active_challenge_id = "daily_dose_oct2025"`);

  // Preview Challenge_Teams
  Logger.log(`📋 Challenge_Teams: Will create ${usersToUpdate} rows (one per active user)`);

  Logger.log('==========================================');
  Logger.log('SUMMARY');
  Logger.log('==========================================');
  Logger.log(`Total operations: ${workoutsToUpdate + completionsToUpdate + yearRoundCount + usersToUpdate + usersToUpdate}`);
  Logger.log('If counts look correct, run runFullMigration()');
  Logger.log('==========================================');
}

/**
 * Backfill challenge_id to Workouts sheet
 */
function backfillChallengeIdToWorkouts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const workoutsSheet = ss.getSheetByName('Workouts');
  const data = workoutsSheet.getDataRange().getValues();
  const headers = data[0];

  // Find challenge_id column
  const challengeIdCol = headers.indexOf('challenge_id');
  if (challengeIdCol === -1) {
    throw new Error('challenge_id column not found in Workouts sheet. Run validateSchemaBeforeMigration() first.');
  }

  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    // If workout_id exists and challenge_id is empty
    if (data[i][0] && !data[i][challengeIdCol]) {
      workoutsSheet.getRange(i + 1, challengeIdCol + 1).setValue('daily_dose_oct2025');
      updated++;
    }
  }

  Logger.log(`✅ Updated ${updated} workouts with challenge_id = "daily_dose_oct2025"`);
  return updated;
}

/**
 * Backfill challenge_id to Completions sheet
 * CRITICAL FIX: Uses app timezone for consistent date comparison
 */
function backfillChallengeIdToCompletions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const completionsSheet = ss.getSheetByName('Completions');
  const data = completionsSheet.getDataRange().getValues();
  const headers = data[0];

  // Find challenge_id column
  const challengeIdCol = headers.indexOf('challenge_id');
  if (challengeIdCol === -1) {
    throw new Error('challenge_id column not found in Completions sheet. Run validateSchemaBeforeMigration() first.');
  }

  // Get app timezone from Settings
  const settings = getSettings(ss);
  const timezone = settings.timezone || 'America/New_York';

  // Get challenge dates
  const challengeStart = new Date('10/1/2025');
  const challengeEnd = new Date('11/5/2025');
  challengeStart.setHours(0, 0, 0, 0);
  challengeEnd.setHours(23, 59, 59, 999);

  let updated = 0;
  let challengeCount = 0;
  let yearRoundCount = 0;

  for (let i = 1; i < data.length; i++) {
    // If challenge_id is empty
    if (!data[i][challengeIdCol]) {
      const timestamp = new Date(data[i][0]);

      // CRITICAL FIX: Convert to app timezone for comparison
      const timestampInAppTz = new Date(timestamp.toLocaleString("en-US", { timeZone: timezone }));

      // If within challenge dates, assign to challenge
      if (timestampInAppTz >= challengeStart && timestampInAppTz <= challengeEnd) {
        completionsSheet.getRange(i + 1, challengeIdCol + 1).setValue('daily_dose_oct2025');
        challengeCount++;
      } else {
        // Outside challenge dates = year-round
        completionsSheet.getRange(i + 1, challengeIdCol + 1).setValue('year_round');
        yearRoundCount++;
      }
      updated++;
    }
  }

  Logger.log(`✅ Updated ${updated} completions with challenge_id`);
  Logger.log(`   - ${challengeCount} assigned to "daily_dose_oct2025"`);
  Logger.log(`   - ${yearRoundCount} assigned to "year_round"`);
  return updated;
}

/**
 * Populate Challenge_Teams from current Users sheet
 */
function populateChallengeTeamsFromUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const teamsSheet = ss.getSheetByName('Challenge_Teams');

  if (!teamsSheet) {
    throw new Error('Challenge_Teams sheet not found. Run validateSchemaBeforeMigration() first.');
  }

  const usersData = usersSheet.getDataRange().getValues();
  const headers = usersData[0];

  // Find columns
  const userIdCol = headers.indexOf('user_id');
  const teamNameCol = headers.indexOf('team_name');
  const teamColorCol = headers.indexOf('team_color');
  const activeUserCol = headers.indexOf('active_user');

  let added = 0;
  for (let i = 1; i < usersData.length; i++) {
    // Only migrate active users
    if (usersData[i][activeUserCol] === true) {
      teamsSheet.appendRow([
        'daily_dose_oct2025',
        usersData[i][userIdCol],
        usersData[i][teamNameCol],
        usersData[i][teamColorCol]
      ]);
      added++;
    }
  }

  Logger.log(`✅ Added ${added} team assignments to Challenge_Teams`);
  return added;
}

/**
 * Set active_challenge_id for all active users
 */
function backfillActiveChallengeIdToUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const data = usersSheet.getDataRange().getValues();
  const headers = data[0];

  const activeChallengeIdCol = headers.indexOf('active_challenge_id');
  const activeUserCol = headers.indexOf('active_user');

  if (activeChallengeIdCol === -1) {
    throw new Error('active_challenge_id column not found in Users sheet. Run validateSchemaBeforeMigration() first.');
  }

  let updated = 0;
  for (let i = 1; i < data.length; i++) {
    // If active user and active_challenge_id is empty
    if (data[i][activeUserCol] === true && !data[i][activeChallengeIdCol]) {
      usersSheet.getRange(i + 1, activeChallengeIdCol + 1).setValue('daily_dose_oct2025');
      updated++;
    }
  }

  Logger.log(`✅ Updated ${updated} users with active_challenge_id = "daily_dose_oct2025"`);
  return updated;
}

/**
 * STEP 3: Run all migrations in sequence
 * IMPORTANT: Run validateSchemaBeforeMigration() and testMigration() first
 */
function runFullMigration() {
  Logger.log('==========================================');
  Logger.log('STARTING FULL MIGRATION');
  Logger.log('==========================================');

  try {
    Logger.log('Step 1: Backfilling Workouts...');
    backfillChallengeIdToWorkouts();

    Logger.log('\nStep 2: Backfilling Completions...');
    backfillChallengeIdToCompletions();

    Logger.log('\nStep 3: Backfilling Users...');
    backfillActiveChallengeIdToUsers();

    Logger.log('\nStep 4: Populating Challenge_Teams...');
    populateChallengeTeamsFromUsers();

    Logger.log('==========================================');
    Logger.log('✅ MIGRATION COMPLETE!');
    Logger.log('==========================================');
    Logger.log('Next steps:');
    Logger.log('1. Verify data in sheets (spot check a few rows)');
    Logger.log('2. Run cleanupDeprecatedSettingsKeys()');
    Logger.log('3. Proceed to Phase 3 (update backend functions)');
    Logger.log('==========================================');
  } catch (error) {
    Logger.log('==========================================');
    Logger.log('❌ MIGRATION FAILED');
    Logger.log('==========================================');
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    Logger.log('==========================================');
    Logger.log('ACTION REQUIRED:');
    Logger.log('1. Restore from backup (see PHASE_0_BACKUP_CHECKLIST.md)');
    Logger.log('2. Fix the error');
    Logger.log('3. Run validateSchemaBeforeMigration() again');
    Logger.log('==========================================');
    throw error;
  }
}

/**
 * STEP 4: Cleanup deprecated Settings keys
 * Run AFTER migration is complete and verified
 */
function cleanupDeprecatedSettingsKeys() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Settings');

  if (!settingsSheet) {
    Logger.log('Settings sheet not found');
    return;
  }

  const data = settingsSheet.getDataRange().getValues();
  const keysToRemove = ['challenge_name', 'start_date', 'end_date', 'total_goal'];
  const rowsToDelete = [];

  for (let i = 1; i < data.length; i++) {
    if (keysToRemove.includes(data[i][0])) {
      rowsToDelete.push(i + 1); // +1 for 1-indexed rows
      Logger.log(`Found deprecated key: ${data[i][0]} (row ${i + 1})`);
    }
  }

  if (rowsToDelete.length === 0) {
    Logger.log('✅ No deprecated keys found in Settings sheet');
    return;
  }

  // Delete in reverse order to preserve row indices
  rowsToDelete.reverse().forEach(row => {
    settingsSheet.deleteRow(row);
    Logger.log(`Deleted row ${row}`);
  });

  Logger.log(`✅ Cleaned up ${rowsToDelete.length} deprecated Settings keys`);
  Logger.log('Settings sheet now contains only app-wide settings:');
  Logger.log('- company_name');
  Logger.log('- deployed_URL');
  Logger.log('- timezone');
}

/**
 * ROLLBACK: Clear migration (USE ONLY IF SOMETHING WENT WRONG)
 * This clears all migrated data without deleting sheets
 */
function rollbackMigration() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Logger.log('==========================================');
  Logger.log('ROLLING BACK MIGRATION');
  Logger.log('==========================================');

  // Clear Workouts challenge_id
  const workoutsSheet = ss.getSheetByName('Workouts');
  const workoutsData = workoutsSheet.getDataRange().getValues();
  const workoutsHeaders = workoutsData[0];
  const challengeIdColWorkouts = workoutsHeaders.indexOf('challenge_id');

  if (challengeIdColWorkouts !== -1) {
    for (let i = 1; i < workoutsData.length; i++) {
      workoutsSheet.getRange(i + 1, challengeIdColWorkouts + 1).setValue('');
    }
    Logger.log('✅ Cleared Workouts challenge_id');
  }

  // Clear Completions challenge_id
  const completionsSheet = ss.getSheetByName('Completions');
  const completionsData = completionsSheet.getDataRange().getValues();
  const completionsHeaders = completionsData[0];
  const challengeIdColCompletions = completionsHeaders.indexOf('challenge_id');

  if (challengeIdColCompletions !== -1) {
    for (let i = 1; i < completionsData.length; i++) {
      completionsSheet.getRange(i + 1, challengeIdColCompletions + 1).setValue('');
    }
    Logger.log('✅ Cleared Completions challenge_id');
  }

  // Clear Users active_challenge_id
  const usersSheet = ss.getSheetByName('Users');
  const usersData = usersSheet.getDataRange().getValues();
  const usersHeaders = usersData[0];
  const activeChallengeIdCol = usersHeaders.indexOf('active_challenge_id');

  if (activeChallengeIdCol !== -1) {
    for (let i = 1; i < usersData.length; i++) {
      usersSheet.getRange(i + 1, activeChallengeIdCol + 1).setValue('');
    }
    Logger.log('✅ Cleared Users active_challenge_id');
  }

  // Clear Challenge_Teams
  const teamsSheet = ss.getSheetByName('Challenge_Teams');
  if (teamsSheet) {
    const teamsData = teamsSheet.getDataRange().getValues();
    if (teamsData.length > 1) {
      teamsSheet.deleteRows(2, teamsData.length - 1);
      Logger.log('✅ Cleared Challenge_Teams data');
    }
  }

  Logger.log('==========================================');
  Logger.log('ROLLBACK COMPLETE');
  Logger.log('==========================================');
  Logger.log('All migrated data cleared.');
  Logger.log('Sheets structure intact.');
  Logger.log('You can now fix issues and re-run migration.');
  Logger.log('==========================================');
}
