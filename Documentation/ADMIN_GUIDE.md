# Administrator Guide

This guide covers all administrative functions for managing the Daily Dose app, including user management, challenge setup, email systems, and Slack integration.

---

## Table of Contents

1. [User Management](#user-management)
2. [Challenge Management](#challenge-management)
3. [Email Systems](#email-systems)
4. [Slack Integration](#slack-integration)
5. [Custom Menu System](#custom-menu-system)
6. [Managing During Challenge](#managing-during-challenge)
7. [Year-Round Management](#year-round-management)

---

## User Management

### Form Response Migration (FormMigration.gs)

Automatically migrates user data from Google Form responses to the Users table.

**Key Features:**
- Maps email, display_name, user_id, join_date, full_name from Form_Responses to Users
- Sets active_user = TRUE for migrated users
- Prevents duplicate user_ids
- Marks rows as migrated to avoid re-processing
- Accessible via "A8 Custom Menu" → "Migrate Form Responses"

**Required Sheets:**
- Form_Responses: Contains form submission data
- Users: Target table for user data (will be populated)

**Test Functions:**
- `testMigrationPreview()`: Preview migration without making changes
- `resetMigrationStatus()`: Clear migration flags (testing only)

---

### User Signup System (Signup.gs + signup.html)

Self-service user registration with preference collection.

**Key Features:**
- Standalone signup page at `/signup.html`
- User-controlled username (forms personal app link)
- Display name with emoji support (shown in app and progress boards)
- Workout preferences collection:
  - Duration preference (10/20/30 minutes)
  - Equipment availability (Bodyweight, Kettlebell, Dumbbell, Bands, Full Gym)
- Comprehensive validation (client and server-side)
- Duplicate email and username checking
- Mobile-optimized design with A8 branding

**Backend Functions** (Signup.gs):
- `createSignupRequest(data)`: Creates new user with preferences
- `updateUserPreferences(userId, preferences)`: Updates user preferences (for future /update page)
- `getUserPreferences(userId)`: Retrieves user preferences
- `validateSignupData(data)`: Validates signup form data
- `generateUserId()`: Legacy function (now users provide their own username)

**Required Columns in Users Sheet:**
- email, display_name, user_id, full_name, join_date
- preferred_duration, equipment_available
- active_user (left empty for admin review)

**Admin Workflow:**
1. Users submit signup form at `/signup.html`
2. New users appear in Users sheet with empty `active_user` column
3. Admin reviews signup details
4. Admin sets `active_user = TRUE` to approve
5. Admin runs "Send Welcome Email" to notify user
6. User receives personalized app link via email

**Validation Rules:**
- Username: lowercase letters, numbers, periods only (3-30 characters)
- Email: standard email format
- Display name: any characters including emojis
- Duration: 10, 20, or 30 (optional)
- Equipment: one or more valid equipment types (optional)

**Access URL:**
```
https://your-domain.github.io/signup.html
```

**Future Enhancements:**
- `/update` page for existing users to update preferences
- Personalized workout recommendations based on equipment/duration
- Auto-approval option for trusted domains

---

## Challenge Management

### Setting Up a New Challenge

**Using the Admin Menu (Recommended):**

1. **Create the Challenge**:
   - Go to "A8 Custom Menu" → "Create New Challenge"
   - Enter challenge_id (no spaces, e.g., "nov_2025")
   - Enter challenge name (e.g., "November Challenge")
   - Enter start date (MM/DD/YYYY format)
   - Enter end date (MM/DD/YYYY format)
   - Enter total goal (e.g., 200)
   - This automatically marks the new challenge as active

2. **Setup Teams**:
   - **Via Script Editor** (no menu item currently):
     - Open Apps Script Editor (Extensions → Apps Script)
     - Use `bulkAssignTeams(challengeId, assignments)` or `copyTeamAssignments(fromChallengeId, toChallengeId)`
   - **Manually**:
     - Go to Challenge_Teams sheet
     - Add rows with: challenge_id, user_id, team_name, team_color
   - Example team configuration:
     ```
     challenge_id | user_id | team_name | team_color
     nov_2025     | martin  | Red       | #FF0000
     nov_2025     | megan   | Red       | #FF0000
     nov_2025     | alex    | Blue      | #0000FF
     ```

3. **Add Workouts**:
   - Manually add workouts to Workouts sheet OR use a template
   - Set `challenge_id` column to match your new challenge (e.g., "nov_2025")
   - Set date ranges within challenge period
   - Include 3-5 movements per workout
   - Add instructions in column C for workout guidance

4. **Notify Users**:
   - Use "A8 Custom Menu" → "Send Welcome Email" for new users
   - Use Slack integration to announce the new challenge
   - Users' apps will automatically show the new active challenge on next page load

**Manual Setup (Advanced):**

If you prefer to manually configure challenges in the sheets:

1. Add row to Challenges sheet with all fields
2. Set `is_active = TRUE` for new challenge, FALSE for old ones
3. Add rows to Challenge_Teams sheet for all user-team assignments
4. Add workouts to Workouts sheet with matching `challenge_id`

---

### Initial App Setup (One-Time)

Only needed when first deploying the app:

1. **Configure Settings Sheet**:
   - `company_name`: Your company name (e.g., "A8")
   - `timezone`: Your timezone (e.g., "America/New_York")
   - `deployed_URL`: GitHub Pages URL (e.g., "https://martinapt8.github.io/a8-workout-app/")

2. **Add Users**:
   - Users sign up via `/signup.html` page OR
   - Manually add to Users sheet with all required fields
   - Set `active_user = TRUE` to activate

3. **Configure AI Workout Generator (Optional)**:
   - Get Claude API key from https://console.anthropic.com/
   - In Google Apps Script: Project Settings → Script Properties
   - Add property: `CLAUDE_API_KEY` = your API key
   - Test with `testClaudeAPI()` function in Script Editor

4. **Deploy**:
   - Backend: Deploy Google Apps Script as Web App (execute as "Me", access "Anyone")
   - Frontend: Push to GitHub, enable GitHub Pages
   - Update `config.js` with Google Apps Script API URL
   - Test with `?user=yourname` parameter

---

## Email Systems

### Welcome Email System (welcome_email.gs)

Sends personalized welcome emails with app links.

**Key Features:**
- Emoji-safe display name handling (removes problematic characters)
- Personalized app links (?user=username)
- Tracks email sent status in Users table
- Accessible via "A8 Custom Menu" → "Send Welcome Email"

**Required Columns in Users Sheet:**
- email, display_name, user_id, active_user, welcome_email_sent

**Required Settings:**
- deployed_URL in Settings sheet

---

### Update Email System (update_email.gs)

Sends mid-challenge update emails with new deployment links.

**Key Features:**
- Emoji-safe display name handling (removes problematic characters)
- Personalized app links (?user=username)
- Tracks email sent status in separate column (update_email_sent)
- Preserves welcome_email.gs for reuse in future challenges
- Accessible via "A8 Custom Menu" → "Send Update Email"

**Required Columns in Users Sheet:**
- email, display_name, user_id, active_user, update_email_sent

**Required Settings:**
- deployed_URL in Settings sheet

**Email Content:**
- Subject: "Daily Dose App Update"
- Body includes mid-challenge progress update and app improvements
- Lists new features: backfill logging, fixed activity feed, cleaned up menu

---

## Slack Integration

Manual Slack progress updates focused on collective goal progress (Slack.gs).

### Daily Progress Summary Features

- Overall progress toward total_goal (e.g., 150/200 workouts)
- Visual progress bar and percentage
- Two-column layout:
  - **Team Contributions** (left): Team totals (e.g., "Green: 15 workouts")
  - **Today's Completed Workouts** (right): List of users who completed workouts today with display names
- **Today's Coaching Tip**: Pulls from Coaching sheet based on current date
- Motivational messages based on progress percentage

### Daily Reminder Features

- Today's workout details with instructions and movements
- Rest day notifications
- App link for easy access

### Setup

1. Set webhook URL: `setSlackWebhookUrl('your-webhook-url')`
2. Manually trigger via "A8 Custom Menu" → "Send Slack Progress Update"
3. Test functions: `testDailyProgressSummary()` and `testDailyReminder()`

### Configuration

- Uses Script Properties for secure webhook storage (key: SLACK_WEBHOOK_URL)
- Manual triggering via custom menu (no automated triggers)
- Coaching tips pulled from Coaching sheet based on current date

---

## Custom Menu System

The custom menu system (menu.gs) provides easy access to administrative functions through the Google Sheets interface.

### Menu Items

**Challenge Management:**
- "Create New Challenge" → `promptCreateChallenge()` - Interactive prompt to create new challenge
- "Set Active Challenge" → `promptSetActiveChallenge()` - Switch which challenge is active
- "View Challenge Stats" → `promptViewChallengeStats()` - View statistics for any challenge
- "End Challenge" → `promptEndChallenge()` - End active challenge gracefully

**Note**: Team assignment functions (`bulkAssignTeams()`, `copyTeamAssignments()`) exist in AdminChallenges.gs but must be called via Script Editor (no menu item currently).

**User Management:**
- "Migrate Form Responses" → `migrateFormResponses()`
- "Send Welcome Email" → `sendWelcomeEmail()`
- "Send Update Email" → `sendUpdateEmail()`

**Communication:**
- "Send Slack Progress Update" → `sendDailyProgressSummary()`

**Testing:**
- "Test Migration Preview" → `testMigrationPreview()`

---

## Managing During Challenge

Active management tasks during an ongoing challenge:

- **View Progress**: Check Completions sheet for real-time data (filter by `challenge_id`)
- **Update Workouts**: Can add/modify future workouts anytime
- **Track Engagement**: Monitor Challenges sheet for participation stats
- **Export Data**: Download Completions sheet and filter by challenge_id for analysis
- **Switch Challenges**: Use "A8 Custom Menu" → "Set Active Challenge" to switch between challenges
- **End Challenge**: Use "A8 Custom Menu" → "End Current Challenge" to gracefully end active challenge
- **User Management**: Use "A8 Custom Menu" → "Migrate Form Responses" to add new users
- **Email Communications**:
  - Use "A8 Custom Menu" → "Send Welcome Email" for initial onboarding
  - Use "A8 Custom Menu" → "Send Update Email" for mid-challenge updates
- **Slack Integration**: Use "A8 Custom Menu" → "Send Slack Progress Update" for manual progress updates
- **Coaching Tips**: Add daily tips to Coaching sheet (date in Column A, tip in Column B) for Slack integration
- **Timezone Note**: All times use the timezone configured in Settings sheet for consistency

---

## Year-Round Management

Managing the app during off-challenge periods:

- **No Active Challenge**: Users can still log workouts (stored with NULL `challenge_id`)
- **Year-Round Workouts**: Add workouts to Workouts sheet with NULL `challenge_id` to make them available anytime
- **Lifetime Stats**: Users' total_workouts field tracks all workouts across all challenges
- **Historical Data**: All past challenge data remains in Completions sheet for future analysis

---

## Adding Video Links to Movements

To add instructional video links to workout movements:

1. **Select the movement cell** in any `movement_X` column in the Workouts sheet
2. **Insert hyperlink**: Use Insert → Link (or Ctrl/Cmd+K)
3. **Enter the video URL**: Paste YouTube or other video link
4. **The cell will display** the exercise name as hyperlinked text
5. **Users will see** the movement as a clickable link with:
   - Yellow color and underline for visibility
   - External link icon (↗) indicating it opens in new tab
   - Videos open in new tab when clicked

---

## Related Documentation

- **Backend Testing**: See `TESTING_FUNCTIONS_GUIDE.md` for backend testing procedures
- **Deployment**: See `DEPLOYMENT_CHECKLIST.md` for deployment steps
- **Technical Reference**: See `CLAUDE.md` for complete technical documentation
- **Git Workflow**: See `GITHUB_WORKFLOW.md` for version control procedures
