/**
 * AutoSort.gs
 * Automatically sorts the Completions sheet by timestamp (descending) on edit
 * This keeps recent workouts at the bottom for efficient reverse iteration
 *
 * TOGGLE: Set AUTOSORT_ENABLED to true to activate sorting
 */

// ============================================
// CONFIGURATION - SET TO TRUE TO ENABLE
// ============================================
const AUTOSORT_ENABLED = false;

/**
 * onEdit trigger - automatically fires when any cell is edited
 * Sorts Completions sheet by timestamp descending when enabled
 */
function onEdit(e) {
  // Exit if autosort is disabled
  if (!AUTOSORT_ENABLED) {
    return;
  }

  // Exit if no event object (shouldn't happen, but safety check)
  if (!e) {
    return;
  }

  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();

  // Only run on Completions sheet
  if (sheetName !== 'Completions') {
    return;
  }

  // Run the sort
  sortCompletionsByTimestamp();
}

/**
 * Sorts the Completions sheet by timestamp (ascending)
 * Oldest workouts at top, newest at bottom
 * This allows reverse iteration (from bottom) to collect most recent workouts first
 * Preserves header row
 */
function sortCompletionsByTimestamp() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const completionsSheet = ss.getSheetByName('Completions');

    if (!completionsSheet) {
      Logger.log('AutoSort: Completions sheet not found');
      return;
    }

    const lastRow = completionsSheet.getLastRow();

    // Need at least 2 rows (header + 1 data row) to sort
    if (lastRow < 2) {
      Logger.log('AutoSort: Not enough rows to sort');
      return;
    }

    // Get header row to find timestamp column
    const headers = completionsSheet.getRange(1, 1, 1, completionsSheet.getLastColumn()).getValues()[0];
    const timestampCol = headers.indexOf('timestamp') + 1; // +1 for 1-indexed

    if (timestampCol === 0) {
      Logger.log('AutoSort: timestamp column not found');
      return;
    }

    // Sort range (excluding header row) by timestamp column, ASCENDING
    // This puts newest workouts at the bottom for efficient reverse iteration
    const dataRange = completionsSheet.getRange(2, 1, lastRow - 1, completionsSheet.getLastColumn());
    dataRange.sort({column: timestampCol, ascending: true});

    Logger.log(`AutoSort: Sorted ${lastRow - 1} rows by timestamp (ascending - newest at bottom)`);

  } catch (error) {
    Logger.log(`AutoSort ERROR: ${error.message}`);
    // Don't throw - we don't want to block the user's edit if sorting fails
  }
}

/**
 * Manual trigger for testing
 * Run this from Script Editor to test sorting without editing the sheet
 */
function testAutoSort() {
  Logger.log('Testing AutoSort...');
  Logger.log(`AUTOSORT_ENABLED: ${AUTOSORT_ENABLED}`);

  if (!AUTOSORT_ENABLED) {
    Logger.log('AutoSort is DISABLED. Set AUTOSORT_ENABLED = true to enable.');
    return;
  }

  sortCompletionsByTimestamp();
  Logger.log('Test complete. Check Completions sheet.');
}

/**
 * One-time manual sort (ignores AUTOSORT_ENABLED flag)
 * Use this to sort the sheet once before enabling auto-sort
 */
function manualSortCompletions() {
  Logger.log('Running manual sort (ignores AUTOSORT_ENABLED flag)...');
  sortCompletionsByTimestamp();
  Logger.log('Manual sort complete.');
}
