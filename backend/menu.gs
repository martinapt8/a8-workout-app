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
    .addItem('Migrate Form Responses', 'migrateFormResponses')
    .addItem('Send Welcome Email', 'sendWelcomeEmail')
    .addItem('Send Update Email', 'sendUpdateEmail')
    .addSeparator()
    .addItem('Send Slack Progress Update', 'sendDailyProgressSummary')
    .addSeparator()
    .addItem('Test Migration Preview', 'testMigrationPreview')
    .addToUi();

  console.log('A8 Custom Menu created successfully');
}

