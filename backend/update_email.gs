/**
 * A8 Workout Challenge App - Update Email Script
 *
 * Sends mid-challenge update emails to users with new deployment link.
 * Called from the custom menu "A8 Custom Menu" → "Send Update Email"
 *
 * Requirements:
 * - Users sheet: display_name, user_id, active_user, update_email_sent, email columns
 * - Settings sheet: deployed_URL key with base URL value
 * - Updates update_email_sent to TRUE after sending
 */

/**
 * Main function called from the custom menu
 * Processes all eligible users and sends update emails
 */
function sendUpdateEmail() {
  try {
    console.log('Starting update email process...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const results = processUpdateEmails(ss);

    // Show results to user
    const ui = SpreadsheetApp.getUi();
    if (results.sent > 0) {
      ui.alert(
        'Update Emails Sent!',
        `Successfully sent ${results.sent} update email(s).\n\n` +
        `Skipped: ${results.skipped} users (already sent or inactive)\n` +
        `Errors: ${results.errors} (check logs for details)`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        'No Emails Sent',
        'No eligible users found for update emails.\n\n' +
        'Users must be active_user=TRUE and update_email_sent=FALSE/empty.',
        ui.ButtonSet.OK
      );
    }

    console.log(`Update email process completed: ${results.sent} sent, ${results.skipped} skipped, ${results.errors} errors`);

  } catch (error) {
    console.error('Error in sendUpdateEmail:', error);
    SpreadsheetApp.getUi().alert(
      'Error Sending Emails',
      'An error occurred while sending update emails. Check the Apps Script logs for details.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Processes all users and sends update emails to eligible ones
 * @param {Spreadsheet} ss - The active spreadsheet
 * @returns {Object} Results summary with counts
 */
function processUpdateEmails(ss) {
  const results = { sent: 0, skipped: 0, errors: 0 };

  // Get the deployed URL from Settings sheet
  const deployedUrl = getDeployedUrlForUpdate(ss);
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
    update_email_sent: headers.indexOf('update_email_sent'),
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
      update_email_sent: row[colIndices.update_email_sent],
      email: row[colIndices.email],
      rowIndex: i + 1 // 1-based for sheet operations
    };

    // Check if user is eligible for update email
    if (!isEligibleForUpdateEmail(user)) {
      results.skipped++;
      continue;
    }

    try {
      // Send update email
      const personalizedLink = `${deployedUrl}?user=${user.user_id}`;
      sendUpdateEmailToUser(user, personalizedLink);

      // Update update_email_sent to TRUE
      usersSheet.getRange(user.rowIndex, colIndices.update_email_sent + 1).setValue(true);

      results.sent++;
      console.log(`Update email sent to ${user.display_name} (${user.email})`);

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
function cleanDisplayNameForUpdate(displayName) {
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
 * Checks if a user is eligible to receive an update email
 * @param {Object} user - User data object
 * @returns {boolean} True if eligible
 */
function isEligibleForUpdateEmail(user) {
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

  // Must not have already received update email
  if (user.update_email_sent === true || user.update_email_sent === 'TRUE') {
    console.log(`Skipping ${user.display_name}: Update email already sent`);
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
 * Sends the actual update email to a user
 * @param {Object} user - User data object
 * @param {string} personalizedLink - The user's personalized app link
 */
function sendUpdateEmailToUser(user, personalizedLink) {
  const subject = 'Daily Dose App Update';

  // Clean the display name to remove emojis that can cause encoding issues
  const cleanName = cleanDisplayNameForUpdate(user.display_name);

  // Plain text version for fallback
  const plainTextBody = `Hey team,

A quick update on the challenge along with some things specific to the web app.

We're about mid-way through, at time of writing, 155 workouts in. Megan and I wanted to say THANK YOU to everyone for your participation and keeping at it, despite the busy month.

Ironically, given the spirit of the challenge, we've both been pulled away from being more noisy and encouraging during the challenge stretch than we would have liked. Just know, we're still watching and working on some things in the background.

We didn't want to let perfect be the enemy of good, and everything we and you all are doing is sustainable.

Meaning, this challenge was never planned to be a one-and-done. We've got the foundation and some planning done for the next phase of workouts, and we'll keep iterating and improving — like we all do every day at A8.

That said, I've made some updates to the app to improve the user experience. This is an optional update, your old URL will continue to function as-is (gulp, I hope). But I encourage you to try this out. These web apps are kind of funky, I can't deploy changes to your existing link. Think of each link representing a version.

Improvement/updates:
• Log previous workouts - on the main page, at the bottom, you can select a previous date and log an old workout. It will block duplicate entries and seems to be working really well.
• Fixed the recent workout feed - doh, that was broken on day 1. I needed more data to test this correctly. It's now pulling in activity in the correct order on the Progress page.
• Cleaned up the bottom menu

Here's your new link:
${personalizedLink}

Let us know if you have any issues with the link, and let's keep the community going in the slack channel and elsewhere.`;

  // HTML version with proper formatting
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>Hey team,</p>

      <p>A quick update on the challenge along with some things specific to the web app.</p>

      <p>We're about mid-way through, at time of writing, 155 workouts in. Megan and I wanted to say THANK YOU to everyone for your participation and keeping at it, despite the busy month.</p>

      <p>Ironically, given the spirit of the challenge, we've both been pulled away from being more noisy and encouraging during the challenge stretch than we would have liked. Just know, we're still watching and working on some things in the background.</p>

      <p>We didn't want to let perfect be the enemy of good, and everything we and you all are doing is sustainable.</p>

      <p>Meaning, this challenge was never planned to be a one-and-done. We've got the foundation and some planning done for the next phase of workouts, and we'll keep iterating and improving — like we all do day-to-day at A8.</p>

      <p>That said, I've made some updates to the app to improve the user experience. This is an optional update, your old URL will continue to function as-is. But I encourage you to try this out. These web apps are kind of funky, I can't deploy changes to your existing link. Think of each link representing a version.</p>

      <p><strong>Improvement/updates:</strong></p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        <li style="margin-bottom: 8px;"><strong>Log previous workouts</strong> - on the main page, at the bottom, you can select a previous date and log an old workout. It will block duplicate entries and seems to be working really well.</li>
        <li style="margin-bottom: 8px;"><strong>Fixed the recent workout feed</strong> - doh, I needed more data to test this correctly. It's now pulling in activity in the correct order on the Progress page.</li>
        <li style="margin-bottom: 8px;"><strong>Cleaned up the bottom menu</strong></li>
      </ul>

      <p><strong>Here's your link:</strong><br>
      <a href="${personalizedLink}" style="color: #3907ffff; text-decoration: none; font-size: 14px;">${personalizedLink}</a></p>

      <p>Let us know if you have any issues with the link, and let's keep the community going in the slack channel and elsewhere.</p>
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
function getDeployedUrlForUpdate(ss) {
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
function testUpdateEmailEligibility() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  const usersData = usersSheet.getDataRange().getValues();
  const headers = usersData[0];

  console.log('Testing update email eligibility for all users:');

  for (let i = 1; i < usersData.length; i++) {
    const row = usersData[i];
    const user = {
      display_name: row[headers.indexOf('display_name')],
      user_id: row[headers.indexOf('user_id')],
      active_user: row[headers.indexOf('active_user')],
      update_email_sent: row[headers.indexOf('update_email_sent')],
      email: row[headers.indexOf('email')]
    };

    const eligible = isEligibleForUpdateEmail(user);
    console.log(`${user.display_name}: ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
  }
}

/**
 * Test function to check deployed URL
 * Run this manually to verify Settings sheet configuration
 */
function testUpdateDeployedUrl() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const url = getDeployedUrlForUpdate(ss);
  console.log('Deployed URL:', url);

  if (url) {
    console.log('Sample personalized link:', `${url}?user=testuser`);
  } else {
    console.log('ERROR: deployed_URL not found in Settings sheet');
  }
}
