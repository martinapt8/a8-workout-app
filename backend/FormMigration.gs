/**
 * A8 Workout Challenge App - Form Response Migration Script
 *
 * Migrates user data from Form_Responses sheet to Users sheet
 * Maps: email, display_name, user_id columns
 * Sets active_user to TRUE and marks rows as migrated
 */

/**
 * Main function to migrate form responses to users table
 * Called from the custom menu
 */
function migrateFormResponses() {
  try {
    console.log('Starting form response migration...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const results = processFormMigration(ss);

    // Show results to user
    const ui = SpreadsheetApp.getUi();
    if (results.migrated > 0) {
      ui.alert(
        'Migration Complete!',
        `Successfully migrated ${results.migrated} user(s).\n\n` +
        `Skipped: ${results.skipped} (already migrated)\n` +
        `Errors: ${results.errors} (check logs for details)`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'No Users to Migrate',
        'No new form responses found to migrate.\n\n' +
        `Already migrated: ${results.skipped}\n` +
        `Errors: ${results.errors}`,
        ui.ButtonSet.OK
      );
    }

    console.log(`Migration completed: ${results.migrated} migrated, ${results.skipped} skipped, ${results.errors} errors`);

  } catch (error) {
    console.error('Error in migrateFormResponses:', error);
    SpreadsheetApp.getUi().alert(
      'Migration Error',
      'An error occurred during migration. Check the Apps Script logs for details.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Process the actual migration from Form_Responses to Users
 * @param {Spreadsheet} ss - The active spreadsheet
 * @returns {Object} Results summary with counts
 */
function processFormMigration(ss) {
  const results = { migrated: 0, skipped: 0, errors: 0 };

  // Get the sheets
  const formResponsesSheet = ss.getSheetByName('Form_Responses');
  const usersSheet = ss.getSheetByName('Users');

  if (!formResponsesSheet) {
    throw new Error('Form_Responses sheet not found');
  }
  if (!usersSheet) {
    throw new Error('Users sheet not found');
  }

  // Get data from both sheets
  const formData = formResponsesSheet.getDataRange().getValues();
  const usersData = usersSheet.getDataRange().getValues();

  // Get headers for both sheets
  const formHeaders = formData[0];
  const usersHeaders = usersData[0];

  // Find column indices for Form_Responses
  const formIndices = {
    email: formHeaders.indexOf('email'),
    display_name: formHeaders.indexOf('display_name'),
    user_id: formHeaders.indexOf('user_id'),
    join_date: formHeaders.indexOf('join_date'),
    full_name: formHeaders.indexOf('full_name'),
    migrated: formHeaders.indexOf('migrated')
  };

  // Find column indices for Users
  const usersIndices = {
    email: usersHeaders.indexOf('email'),
    display_name: usersHeaders.indexOf('display_name'),
    user_id: usersHeaders.indexOf('user_id'),
    join_date: usersHeaders.indexOf('join_date'),
    full_name: usersHeaders.indexOf('full_name'),
    active_user: usersHeaders.indexOf('active_user'),
    team_name: usersHeaders.indexOf('team_name'),
    team_color: usersHeaders.indexOf('team_color'),
    total_workouts: usersHeaders.indexOf('total_workouts'),
    last_completed: usersHeaders.indexOf('last_completed'),
    deployment_URL: usersHeaders.indexOf('deployment_URL')
  };

  // Validate required columns exist
  validateColumnIndices(formIndices, 'Form_Responses');
  validateColumnIndices(usersIndices, 'Users');

  // Create a map of existing user_ids for duplicate checking
  const existingUserIds = new Set();
  for (let i = 1; i < usersData.length; i++) {
    const userId = usersData[i][usersIndices.user_id];
    if (userId) {
      existingUserIds.add(userId.toString().toLowerCase());
    }
  }

  // Process each form response (skip header row)
  for (let i = 1; i < formData.length; i++) {
    const row = formData[i];

    // Skip if already migrated
    if (row[formIndices.migrated] === true || row[formIndices.migrated] === 'TRUE') {
      results.skipped++;
      console.log(`Row ${i + 1}: Already migrated, skipping`);
      continue;
    }

    // Extract user data
    const userData = {
      email: row[formIndices.email],
      display_name: row[formIndices.display_name],
      user_id: row[formIndices.user_id],
      join_date: row[formIndices.join_date],
      full_name: row[formIndices.full_name]
    };

    // Validate required fields
    if (!userData.email || !userData.display_name || !userData.user_id) {
      console.error(`Row ${i + 1}: Missing required fields`, userData);
      results.errors++;
      continue;
    }

    // Check if user_id already exists
    if (existingUserIds.has(userData.user_id.toString().toLowerCase())) {
      console.log(`Row ${i + 1}: User ID '${userData.user_id}' already exists in Users sheet`);
      // Still mark as migrated since it's already in the system
      formResponsesSheet.getRange(i + 1, formIndices.migrated + 1).setValue(true);
      results.skipped++;
      continue;
    }

    try {
      // Add new user to Users sheet
      const newUserRow = createNewUserRow(userData, usersHeaders, usersIndices);

      // Append the row first
      usersSheet.appendRow(newUserRow);

      // Get the row number that was just added
      const newRowNum = usersSheet.getLastRow();

      // Add the deployment_URL formula if column exists
      if (usersIndices.deployment_URL !== -1) {
        const formulaRange = usersSheet.getRange(newRowNum, usersIndices.deployment_URL + 1);
        const formula = `=Settings!$B$7&"?user="&A${newRowNum}`;
        formulaRange.setFormula(formula);
      }

      // Add to existing users set
      existingUserIds.add(userData.user_id.toString().toLowerCase());

      // Mark as migrated in Form_Responses
      formResponsesSheet.getRange(i + 1, formIndices.migrated + 1).setValue(true);

      results.migrated++;
      console.log(`Row ${i + 1}: Successfully migrated user '${userData.display_name}' (${userData.user_id})`);

    } catch (error) {
      console.error(`Row ${i + 1}: Error migrating user`, error);
      results.errors++;
    }
  }

  return results;
}

/**
 * Create a new row for the Users sheet
 * @param {Object} userData - The user data from form response
 * @param {Array} headers - The Users sheet headers
 * @param {Object} indices - The column indices for Users sheet
 * @returns {Array} A new row array for the Users sheet
 */
function createNewUserRow(userData, headers, indices) {
  const newRow = new Array(headers.length).fill('');

  // Set the migrated data
  newRow[indices.email] = userData.email || '';
  newRow[indices.display_name] = userData.display_name || '';
  newRow[indices.user_id] = userData.user_id || '';

  // Set the new columns if they exist in Users sheet
  if (indices.join_date !== -1) {
    newRow[indices.join_date] = userData.join_date || '';
  }
  if (indices.full_name !== -1) {
    newRow[indices.full_name] = userData.full_name || '';
  }

  // Set active_user to TRUE
  newRow[indices.active_user] = true;

  // Set default values for other fields
  if (indices.team_name !== -1) {
    newRow[indices.team_name] = ''; // Will be assigned later
  }
  if (indices.team_color !== -1) {
    newRow[indices.team_color] = ''; // Will be assigned later
  }
  if (indices.total_workouts !== -1) {
    newRow[indices.total_workouts] = 0;
  }
  if (indices.last_completed !== -1) {
    newRow[indices.last_completed] = '';
  }

  return newRow;
}

/**
 * Validate that required columns exist
 * @param {Object} indices - Object with column indices
 * @param {string} sheetName - Name of the sheet for error messages
 */
function validateColumnIndices(indices, sheetName) {
  const missingColumns = [];

  // Define which columns are optional (won't cause errors if missing)
  const optionalColumns = ['join_date', 'full_name', 'team_name', 'team_color', 'last_completed', 'deployment_URL'];

  for (const [key, index] of Object.entries(indices)) {
    if (index === -1) {
      // migrated column might not exist initially, that's OK
      if (key === 'migrated' && sheetName === 'Form_Responses') {
        // We'll add it if it doesn't exist
        addMigratedColumnIfMissing(sheetName);
      } else if (!optionalColumns.includes(key)) {
        // Only add to missing if it's not an optional column
        missingColumns.push(key);
      }
    }
  }

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns in ${sheetName} sheet: ${missingColumns.join(', ')}`);
  }
}

/**
 * Add the 'migrated' column to Form_Responses if it doesn't exist
 * @param {string} sheetName - Name of the sheet
 */
function addMigratedColumnIfMissing(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (headers.indexOf('migrated') === -1) {
    // Add 'migrated' column at the end
    const newColIndex = sheet.getLastColumn() + 1;
    sheet.getRange(1, newColIndex).setValue('migrated');
    console.log(`Added 'migrated' column to ${sheetName} sheet`);
  }
}

/**
 * Test function to check migration eligibility without actually migrating
 * Run this manually to preview what would be migrated
 */
function testMigrationPreview() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formResponsesSheet = ss.getSheetByName('Form_Responses');
  const usersSheet = ss.getSheetByName('Users');

  if (!formResponsesSheet) {
    console.log('Form_Responses sheet not found');
    return;
  }
  if (!usersSheet) {
    console.log('Users sheet not found');
    return;
  }

  const formData = formResponsesSheet.getDataRange().getValues();
  const formHeaders = formData[0];

  const migratedIndex = formHeaders.indexOf('migrated');
  const userIdIndex = formHeaders.indexOf('user_id');
  const displayNameIndex = formHeaders.indexOf('display_name');

  console.log('Migration Preview:');
  console.log('==================');

  let toMigrate = 0;
  let alreadyMigrated = 0;

  for (let i = 1; i < formData.length; i++) {
    const row = formData[i];
    const migrated = migratedIndex !== -1 ? row[migratedIndex] : false;
    const userId = row[userIdIndex];
    const displayName = row[displayNameIndex];

    if (migrated === true || migrated === 'TRUE') {
      alreadyMigrated++;
      console.log(`Row ${i + 1}: ${displayName} (${userId}) - ALREADY MIGRATED`);
    } else if (userId && displayName) {
      toMigrate++;
      console.log(`Row ${i + 1}: ${displayName} (${userId}) - WILL BE MIGRATED`);
    }
  }

  console.log('==================');
  console.log(`Summary: ${toMigrate} to migrate, ${alreadyMigrated} already migrated`);
}

/**
 * Utility function to reset migration status for testing
 * WARNING: Only use this for testing! It will clear all migration flags
 */
function resetMigrationStatus() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Reset Migration Status?',
    'This will clear all migration flags. Are you sure?\n\nThis action is for testing only!',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    console.log('Reset cancelled by user');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formResponsesSheet = ss.getSheetByName('Form_Responses');

  if (!formResponsesSheet) {
    console.log('Form_Responses sheet not found');
    return;
  }

  const formData = formResponsesSheet.getDataRange().getValues();
  const migratedIndex = formData[0].indexOf('migrated');

  if (migratedIndex === -1) {
    console.log('No migrated column found');
    return;
  }

  // Clear all migrated flags (skip header)
  for (let i = 1; i < formData.length; i++) {
    formResponsesSheet.getRange(i + 1, migratedIndex + 1).setValue('');
  }

  console.log('Migration status reset for all rows');
  ui.alert('Reset Complete', 'All migration flags have been cleared.', ui.ButtonSet.OK);
}