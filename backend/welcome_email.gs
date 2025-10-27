/**
 * A8 Workout Challenge App - Welcome Email Script
 * 
 * Sends personalized welcome emails to new users with their unique app links.
 * Called from the custom menu "A8 Custom Menu" → "Send Welcome Email"
 * 
 * Requirements:
 * - Users sheet: display_name, user_id, active_user, welcome_email_sent, email columns
 * - Settings sheet: deployed_URL key with base URL value
 * - Updates welcome_email_sent to TRUE after sending
 */

/**
 * Main function called from the custom menu
 * Processes all eligible users and sends welcome emails
 */
function sendWelcomeEmail() {
  try {
    console.log('Starting welcome email process...');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const results = processWelcomeEmails(ss);
    
    // Show results to user
    const ui = SpreadsheetApp.getUi();
    if (results.sent > 0) {
      ui.alert(
        'Welcome Emails Sent!',
        `Successfully sent ${results.sent} welcome email(s).\n\n` +
        `Skipped: ${results.skipped} users (already sent or inactive)\n` +
        `Errors: ${results.errors} (check logs for details)`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'No Emails Sent',
        'No eligible users found for welcome emails.\n\n' +
        'Users must be active_user=TRUE and welcome_email_sent=FALSE/empty.',
        ui.ButtonSet.OK
      );
    }
    
    console.log(`Welcome email process completed: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`);
    
  } catch (error) {
    console.error('Error in sendWelcomeEmail:', error);
    SpreadsheetApp.getUi().alert(
      'Error Sending Emails',
      'An error occurred while sending welcome emails. Check the Apps Script logs for details.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Processes all users and sends welcome emails to eligible ones
 * @param {Spreadsheet} ss - The active spreadsheet
 * @returns {Object} Results summary with counts
 */
function processWelcomeEmails(ss) {
  const results = { sent: 0, skipped: 0, errors: 0 };
  
  // Get the deployed URL from Settings sheet
  const deployedUrl = getDeployedUrl(ss);
  if (!deployedUrl) {
    throw new Error('deployed_URL not found in Settings sheet');
  }
  
  // Get users data
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    throw new Error('Users sheet not found');
  }
  
  const usersData = usersSheet.getDataRange().getValues();
  const headers = usersData[0];
  
  // Find column indices
  const colIndices = {
    display_name: headers.indexOf('display_name'),
    user_id: headers.indexOf('user_id'),
    active_user: headers.indexOf('active_user'),
    welcome_email_sent: headers.indexOf('welcome_email_sent'),
    email: headers.indexOf('email')
  };
  
  // Validate required columns exist
  const missingCols = Object.entries(colIndices)
    .filter(([key, index]) => index === -1)
    .map(([key]) => key);
  
  if (missingCols.length > 0) {
    throw new Error(`Missing required columns in Users sheet: ${missingCols.join(', ')}`);
  }
  
  // Process each user (skip header row)
  for (let i = 1; i < usersData.length; i++) {
    const row = usersData[i];
    const user = {
      display_name: row[colIndices.display_name],
      user_id: row[colIndices.user_id],
      active_user: row[colIndices.active_user],
      welcome_email_sent: row[colIndices.welcome_email_sent],
      email: row[colIndices.email],
      rowIndex: i + 1 // 1-based for sheet operations
    };
    
    // Check if user is eligible for welcome email
    if (!isEligibleForWelcomeEmail(user)) {
      results.skipped++;
      continue;
    }
    
    try {
      // Send welcome email
      const personalizedLink = `${deployedUrl}?user=${user.user_id}`;
      sendWelcomeEmailToUser(user, personalizedLink);
      
      // Update welcome_email_sent to TRUE
      usersSheet.getRange(user.rowIndex, colIndices.welcome_email_sent + 1).setValue(true);
      
      results.sent++;
      console.log(`Welcome email sent to ${user.display_name} (${user.email})`);
      
    } catch (error) {
      console.error(`Error sending email to ${user.display_name}:`, error);
      results.errors++;
    }
  }
  
  return results;
}

/**
 * Removes emojis and special characters from display name for email use
 * @param {string} displayName - The display name that may contain emojis
 * @returns {string} Clean name without emojis
 */
function cleanDisplayName(displayName) {
  if (!displayName) return 'Team Member';

  // Convert to string if not already
  displayName = String(displayName);

  // Remove emojis and other non-ASCII characters
  // This regex keeps only ASCII letters, numbers, spaces, and basic punctuation
  let cleanName = displayName.replace(/[^\x00-\x7F]/g, '').trim();

  // Remove any extra spaces that might be left after emoji removal
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  // If the name is empty after cleaning (was only emojis), return a default
  if (!cleanName) {
    return 'Team Member';
  }

  return cleanName;
}

/**
 * Checks if a user is eligible to receive a welcome email
 * @param {Object} user - User data object
 * @returns {boolean} True if eligible
 */
function isEligibleForWelcomeEmail(user) {
  // Must have email address
  if (!user.email || typeof user.email !== 'string' || user.email.trim() === '') {
    console.log(`Skipping ${user.display_name}: No email address`);
    return false;
  }

  // Must be active user
  if (user.active_user !== true && user.active_user !== 'TRUE') {
    console.log(`Skipping ${user.display_name}: Not active user`);
    return false;
  }

  // Must not have already received welcome email
  if (user.welcome_email_sent === true || user.welcome_email_sent === 'TRUE') {
    console.log(`Skipping ${user.display_name}: Welcome email already sent`);
    return false;
  }

  // Must have user_id for personalized link
  if (!user.user_id || user.user_id.toString().trim() === '') {
    console.log(`Skipping ${user.display_name}: No user_id`);
    return false;
  }

  return true;
}

/**
 * Sends the actual welcome email to a user
 * @param {Object} user - User data object
 * @param {string} personalizedLink - The user's personalized app link
 */
function sendWelcomeEmailToUser(user, personalizedLink) {
  const subject = 'Welcome to the A8 Fitness Challenge: The Daily Dose™!';

  // Clean the display name to remove emojis that can cause encoding issues
  const cleanName = cleanDisplayName(user.display_name);

  // Plain text version for fallback
  const plainTextBody = `Hi ${cleanName},

We're excited to have you join into the A8 Daily Dose™. Here are some notes to keep in mind:

• You need to use the URL exactly as it is shown below every time. You can bookmark it or add it to your phone's homescreen.
• The app is sluggish using google sheets...
• Your workout will log quickly, then you'll see it upload and auto-refresh if you want to see your recent activity on the goals page.
• There's a rest day in for today, tomorrow morning you will have your first workout available!
• Don't forget we have a Guru card more about the challenge here: https://app.getguru.com/card/ToXL7zac/A8-Workout-Challenge-The-Daily-Dose
• Questions? - drop us a message in the slack channel

Here's your personal link:
${personalizedLink}

Yours in sweat and health (and consistency!),
- Megan + Martin`;

  // HTML version with proper formatting
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hi ${cleanName},</p>

      <p>We're excited to have you join into the A8 Daily Dose Challenge™. Here are some notes to keep in mind:</p>

      <ul style="padding-left: 20px; line-height: 1.8;">
        <li style="margin-bottom: 8px;">You need to use the URL exactly as it is shown below every time. You can bookmark it or add it to your phone's homescreen.</li>
        <li style="margin-bottom: 8px;">The app is a bit sluggish using google sheets...</li>
        <li style="margin-bottom: 8px;">But! Your workout will log quickly, then you'll see it upload and auto-refresh if you want to see your recent activity on the goals page.</li>
        <li style="margin-bottom: 8px;">There's a rest day in for today, tomorrow morning you will have your first workout available!</li>
        <li style="margin-bottom: 8px;">Don't forget we have a Guru card more about the challenge <a href="https://app.getguru.com/card/ToXL7zac/A8-Workout-Challenge-The-Daily-Dose" style="color: #3907ffff; text-decoration: none;">here</a></li>
        <li style="margin-bottom: 8px;">Questions? - drop us a message in the slack channel</li>
      </ul>

      <p><strong>Here's your personal link:</strong><br>
      <a href="${personalizedLink}" style="color: #3907ffff; text-decoration: none; font-size: 14px;">${personalizedLink}</a></p>

      <p>Yours in sweat and health (and consistency!),<br>
      - Megan + Martin</p>
    </div>
  `;

  // Send the email with HTML body
  GmailApp.sendEmail(
    user.email.trim(),
    subject,
    plainTextBody,
    {
      htmlBody: htmlBody
    }
  );
}

/**
 * Gets the deployed URL from the Settings sheet
 * @param {Spreadsheet} ss - The active spreadsheet
 * @returns {string|null} The deployed URL or null if not found
 */
function getDeployedUrl(ss) {
  try {
    const settingsSheet = ss.getSheetByName('Settings');
    if (!settingsSheet) {
      console.error('Settings sheet not found');
      return null;
    }
    
    const settingsData = settingsSheet.getDataRange().getValues();
    
    // Look for deployed_URL in column A
    for (let i = 0; i < settingsData.length; i++) {
      if (settingsData[i][0] === 'deployed_URL') {
        const url = settingsData[i][1];
        if (url && typeof url === 'string' && url.trim() !== '') {
          return url.trim();
        }
      }
    }
    
    console.error('deployed_URL not found in Settings sheet');
    return null;
    
  } catch (error) {
    console.error('Error reading deployed URL from Settings:', error);
    return null;
  }
}

/**
 * Test function to check email eligibility without sending
 * Run this manually to debug user eligibility
 */
function testEmailEligibility() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const usersData = usersSheet.getDataRange().getValues();
  const headers = usersData[0];
  
  console.log('Testing email eligibility for all users:');
  
  for (let i = 1; i < usersData.length; i++) {
    const row = usersData[i];
    const user = {
      display_name: row[headers.indexOf('display_name')],
      user_id: row[headers.indexOf('user_id')],
      active_user: row[headers.indexOf('active_user')],
      welcome_email_sent: row[headers.indexOf('welcome_email_sent')],
      email: row[headers.indexOf('email')]
    };
    
    const eligible = isEligibleForWelcomeEmail(user);
    console.log(`${user.display_name}: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
  }
}

/**
 * Test function to check deployed URL
 * Run this manually to verify Settings sheet configuration
 */
function testDeployedUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const url = getDeployedUrl(ss);
  console.log('Deployed URL:', url);
  
  if (url) {
    console.log('Sample personalized link:', `${url}?user=testuser`);
  } else {
    console.log('ERROR: deployed_URL not found in Settings sheet');
  }
}