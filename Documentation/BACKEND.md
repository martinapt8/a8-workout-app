# Backend Architecture & API Reference

This document provides detailed technical reference for the Daily Dose backend, which is built on Google Apps Script with Google Sheets as the database. For high-level architecture overview, see [CLAUDE.md](../CLAUDE.md).

## Overview

The backend is a RESTful API built with Google Apps Script that processes form-encoded POST requests from the GitHub Pages frontend. It uses Google Sheets as a database with 7 sheets for data storage:

- **Core Technology**: Google Apps Script (JavaScript-based cloud scripting)
- **Database**: Google Sheets (7 sheets: Users, Workouts, Completions, Challenges, Challenge_Teams, Settings, Coaching)
- **API Pattern**: Form-encoded POST endpoints (bypasses CORS preflight)
- **Authentication**: URL parameters (`?user=username`) - no passwords
- **Deployment**: Web App accessible from any origin

## Backend Files Reference

| File | Size | Purpose | Key Functions |
|------|------|---------|---------------|
| Code.gs | 37KB | Core REST API, main entry point | doGet(), doPost(), getUserDashboardData() |
| AdminChallenges.gs | 14KB | Challenge management | createNewChallenge(), setActiveChallenge() |
| Signup.gs | 16KB | User signup, preferences & challenge signups | createSignupRequest(), createChallengeSignup(), checkUserByEmail(), getChallengeInfo() |
| ClaudeAPI.gs | 6KB | AI workout generation | generateAIWorkout(), callClaudeAPI() |
| Slack.gs | 16KB | Slack notifications | sendDailyProgressSummary(), sendDailyReminder() |
| welcome_email.gs | 11KB | Welcome emails | sendWelcomeEmail() |
| update_email.gs | 13KB | Update emails | sendUpdateEmail() |
| FormMigration.gs | 12KB | Form response import | migrateFormResponses() |
| MigrationScripts.gs | 18KB | V2→V3 migration utilities | (historical, not actively used) |
| TestingFunctions.gs | 12KB | Backend testing suite | testUserDashboard(), testWorkoutCompletion() |
| AutoSort.gs | 3KB | Auto-sort completions | onEdit() trigger |
| menu.gs | 9KB | Custom spreadsheet menu | onOpen(), promptCreateChallenge() |

## Google Apps Script Files

The project includes several Google Apps Script files for different functionalities:

1. **Code.gs**: Core web app functions and REST API (main entry point)
2. **ClaudeAPI.gs**: AI workout generation via Claude API
3. **FormMigration.gs**: Migrates form responses to Users table
4. **Signup.gs**: User signup and preference management
5. **welcome_email.gs**: Sends personalized welcome emails with app links
6. **update_email.gs**: Sends mid-challenge update emails with new deployment links
7. **Slack.gs**: Slack notifications and progress updates
8. **AdminChallenges.gs**: Challenge creation and management functions
9. **menu.gs**: Creates custom spreadsheet menu for admin functions
10. **MigrationScripts.gs**: Multi-challenge migration utilities
11. **TestingFunctions.gs**: Testing suite for backend validation
12. **AutoSort.gs**: Auto-sorts Completions sheet by timestamp

---

## Core Functions

### `doGet(e)` / `doPost(e)`
Main REST API entry points. Handles URL parameters and JSON payloads. Routes to appropriate action handlers based on `action` parameter.

### `getUserDashboardData(userId)`
Returns all data needed for the user's dashboard:
- User info (name, team, completion status)
- Active challenge details (or null if no active challenge)
- Today's workout details (from active challenge or year-round workouts)
- Completion status for today
- Challenge metadata and progress

### `getActiveChallenge()`
Returns the currently active challenge from Challenges sheet:
- Finds challenge where `status === 'active'`
- Returns challenge object with id, name, dates, goal, and status
- Returns null if no active challenge
- **Critical**: Only one challenge should have status='active' at a time

### `getActiveWorkout(challengeId)`
Returns the current workout based on today's date and challenge:
- Filters workouts by `challenge_id` (or NULL for year-round workouts)
- Uses header-based mapping for column access
- Checks date ranges in Workouts sheet
- Includes instructions field if available
- Returns newest if overlap exists
- Returns null if no active workout

### `markWorkoutComplete(userId, workoutType, workoutDetails, completionDate)`
Records a workout completion:
- `workoutType`: "prescribed" (uses active workout_id), "other" (logs as "Other Workout"), or "ai" (logs as "AI Workout")
- `workoutDetails`: Optional text description for "other" workouts (e.g., "30 min run") or AI parameters
- `completionDate`: Optional date string (YYYY-MM-DD) for backfilling past workouts
- **Automatically assigns `challenge_id`** from active challenge (or "year_round" if no active challenge)
- Triggers `updateUserStats()` to update total_workouts and last_completed
- Adds entry to Completions sheet with challenge_id in column F
- Prevents duplicate logging for same date
- Validates dates are not in the future
- **Supports year-round logging** even when no challenge is active

### `getGoalProgress(challengeId)`
Returns collective progress data for a specific challenge:
- Total workouts completed vs goal for the challenge
- Percentage complete
- Team breakdowns (from Challenge_Teams for this challenge)
- Recent completions (last 10, from newest to oldest, filtered by challenge_id)
- Returns null if challengeId is null (no active challenge)

### `getMyTeamBreakdown(ss, userId, challengeId)`
Returns detailed breakdown of user's team members for a specific challenge (NEW - Nov 7, 2025):
- Fetches user's team assignment from Challenge_Teams sheet
- Retrieves all members on the same team
- Counts workout completions per member (filtered by challenge_id)
- Returns structured object: `{team_name, team_color, members: [{user_id, display_name, workout_count}]}`
- Members sorted alphabetically by display_name
- Includes all team members (even those with 0 workouts)
- Returns null if user not assigned to team or no active challenge
- **Use Case**: Powers "My Team's Workouts" section on Team Progress page

### `getRecentCompletionsAll(ss, limit)`
Returns recent completions across ALL users and challenges for agency-wide activity feed:
- Works year-round regardless of active challenge or user participation
- Fetches most recent completions from Completions sheet (default 15)
- Shows descriptive workout info:
  - Prescribed workouts: Displays workout name from Workouts sheet
  - AI Workouts: "completed an AI Workout"
  - Other Workouts: Shows user's workout description or "logged a workout"
- Returns array with user display name, workout description, and formatted timestamp
- **Use Case**: Powers "Recent Activity" feed on Today page for all users

### `getWorkoutById(ss, workoutId)`
Helper function to fetch workout details by ID:
- Searches Workouts sheet for matching workout_id
- Returns workout object with workout_id and workout_name
- Used by `getRecentCompletionsAll()` to show proper workout names
- Returns null if workout not found

### `hasCompletedOnDate(ss, userId, targetDate)`
Checks if user has already logged a workout on a specific date:
- Used by backfill feature to prevent duplicate logging
- Returns boolean

### `getUserCompletionHistory(userId, challengeId)`
Returns array of dates when user completed workouts:
- Used by Me page calendar to show checkmarks
- Filters by `challenge_id` if provided (or NULL for all workouts)
- Returns dates in YYYY-MM-DD format
- **Performance**: 10-20x faster than date-range filtering

### `getUserAllCompletions(userId, startDate, endDate)`
Returns completion dates across ALL challenges for multi-month calendar:
- Fetches completions for user across ALL challenges (no challenge_id filtering)
- **Optional Parameters**:
  - `startDate`: Optional start date filter (YYYY-MM-DD)
  - `endDate`: Optional end date filter (YYYY-MM-DD)
- Returns dates in YYYY-MM-DD format
- Supports lazy loading with date range parameters for performance
- **Use Case**: Powers multi-month calendar navigation on Me page
- **Performance**: Filters by date range when provided (±3 months typical)

### `getAllWorkouts(challengeId)`
Returns all workouts for the library page:
- Fetches workouts from Workouts sheet filtered by `challenge_id`
- Includes year-round workouts (NULL challenge_id)
- Includes exercises, instructions, and video links
- Converts dates to timestamps for serialization
- Skips workouts with invalid/missing dates
- Sorted by start_date (oldest to newest)

### `generateAIWorkout(timeMinutes, difficulty, equipment)`
Generates AI-powered workout using Claude API (ClaudeAPI.gs):
- **Parameters**:
  - `timeMinutes`: "10", "15", or "20"
  - `difficulty`: "Beginner", "Intermediate", or "Hard"
  - `equipment`: "Bodyweight", "Kettlebell", "Dumbbell", "Bands", or "Full Gym"
- **Returns**: `{success: boolean, workout: string, error: string}`
- Uses Claude Haiku 4.5 model for fast, cost-effective generation
- Prompts Claude to create balanced workouts with warm-up, main workout, and cool-down
- Returns markdown-formatted workout text
- Requires `CLAUDE_API_KEY` in Script Properties

### `getLifetimeWorkoutCount(ss, userId)`
Returns total workout count across all challenges and year-round:
- Counts all completions for user regardless of challenge_id
- Used for dashboard API to populate `lifetime_workouts` field
- More comprehensive than Users.total_workouts (which is per-challenge)
- **Performance**: Single pass through Completions sheet

### `getUserAllChallengeStats(ss, userId)`
Returns user's challenge history AND upcoming challenges for all users (powers Me page):
- Returns object with two arrays:
  - **userChallenges**: User's historical challenges with:
    - challenge_id, challenge_name
    - workout_count (user's completions for that challenge)
    - team_name, team_color (from Challenge_Teams)
    - start_date, end_date (formatted as MM/DD/YYYY)
    - Includes "year_round" as special challenge for off-season workouts
    - Sorted by date (most recent first)
  - **upcomingChallenges**: All challenges where status='upcoming':
    - challenge_id, challenge_name
    - start_date, end_date (formatted as MM/DD/YYYY)
    - Visible to ALL users regardless of participation (for sign-up awareness)
    - Sorted by start_date (earliest first)
- **Use Case**: Displays "My Challenges" section on Me page with both historical and upcoming

### `getUserCompletionHistoryForChallenge(userId, challengeId)`
Returns completion dates for specific challenge:
- More specific than `getUserCompletionHistory()`
- Filters Completions by both userId AND challengeId
- Returns array of YYYY-MM-DD date strings
- **Use Case**: Internal helper for calendar generation

### `getAllWorkoutsForChallenge(challengeId)`
Returns workouts filtered by specific challenge:
- More specific than `getAllWorkouts()`
- Fetches from Workouts sheet where challenge_id matches
- Returns formatted workout objects with exercises
- **Use Case**: Internal helper for workout library

### `getChallengeById(ss, challengeId)`
Fetches challenge details by ID:
- Searches Challenges sheet for matching challenge_id
- Returns challenge object with all fields (name, dates, goal, status)
- Returns null if not found
- **Use Case**: Critical helper used by many functions

### `formatDateNumeric(date, ss)`
Formats date as MM/DD/YYYY for frontend parsing:
- Uses app timezone from Settings
- Returns numeric date format (not "Oct 16, 2025")
- **Use Case**: Challenge date ranges in API responses

### `getChallengeInfo(challengeId)` *(New - Nov 2025)*
Returns challenge details for signup page with deadline validation:
- **Parameters**: `challengeId` (string) - Challenge identifier
- **Returns**: Challenge object with name, dates, goal, signup_deadline
- **Validation**:
  - Checks if signup_deadline has passed using Settings timezone
  - Returns `signupOpen` boolean and `deadlineMessage` string
- **Use Case**: Pre-signup validation on `signup_challenge.html`
- **Related**: Used by `createChallengeSignup()` to enforce deadlines

### `checkUserByEmail(email)` *(New - Nov 2025)*
Detects existing users and returns their preferences for signup pre-filling:
- **Parameters**: `email` (string) - User email address
- **Returns**: Object with `userExists` boolean and user data
- **User Data Includes**:
  - `userId`, `displayName` (for welcome message)
  - `preferredDuration`, `equipment` (for pre-filling form)
- **Use Case**: Email-based user detection on challenge signup flow
- **Related**: Called before showing signup form fields

### `createChallengeSignup(data)` *(New - Nov 2025)*
Handles challenge-specific signups for both new and existing users:
- **Parameters**: Object with `challengeId`, `email`, `userId`, `displayName`, `fullName`, `preferredDuration`, `equipment`
- **New Users**:
  - Creates full user account in Users sheet
  - Sets `active_user = TRUE` (auto-approval for challenge signups)
  - Validates username format, length, and uniqueness
- **Existing Users**:
  - Updates only `preferred_duration` and `equipment_available`
  - Preserves `user_id` (no changes allowed)
  - Checks for duplicate signup in Challenge_Teams
- **Both User Types**:
  - Adds row to Challenge_Teams table (`challenge_id` + `user_id`)
  - Leaves `team_name` and `team_color` empty for admin assignment
- **Validation**:
  - Checks signup deadline via `getChallengeInfo()`
  - Prevents duplicate signups with friendly error message
- **Returns**: Success message with challenge name for confirmation screen
- **Use Case**: Final signup submission from `signup_challenge.html`

---

## Helper Functions

### `getWorkoutsHeaderMapping(workoutsSheet)`
Creates dynamic mapping of column headers to indices for flexible column access

### `getSettings(ss)`
Reads Settings sheet and returns object with all key-value pairs

### `getUserInfo(ss, userId)`
Finds user by user_id (case-insensitive) and returns user data

### `updateUserStats(ss, userId)`
Updates user's total_workouts and last_completed fields:
- Counts completions for active challenge only
- Updates Users sheet columns: total_workouts, last_completed
- Called automatically by `markWorkoutComplete()`
- **Note**: For lifetime totals, use `getLifetimeWorkoutCount()` instead

### `getTeamTotals(ss, challengeId)`
Aggregates workout totals by team for a specific challenge:
- Filters completions by `challenge_id`
- Returns team totals from Challenge_Teams sheet
- **Performance**: Fast filtering by challenge_id instead of date ranges

### `formatDate(date)`
Consistent date formatting for display

---

## Admin Challenge Management Functions (AdminChallenges.gs)

### `createNewChallenge(challengeId, challengeName, startDate, endDate, totalGoal)`
Creates a new challenge and sets it as active:
- Adds challenge to Challenges sheet with status='active'
- Updates existing active challenges to status='completed'
- Returns success/error message
- **Note**: Does not create team assignments (use `setupChallengeTeams()` separately)

### `setupChallengeTeams(challengeId, teamConfig)`
Creates team assignments for a challenge:
- `teamConfig`: Array of {userId, teamName, teamColor} objects
- Adds rows to Challenge_Teams sheet
- Validates all users exist in Users table
- Returns count of teams created

### `setActiveChallenge(challengeId)`
Switches the active challenge:
- Updates all active challenges to status='completed'
- Sets specified challenge to status='active'
- Users will see new challenge on next page load

### `endCurrentChallenge()`
Ends the active challenge gracefully:
- Updates active challenge to status='completed'
- App switches to "off-challenge" mode
- Users can still log workouts (stored with challenge_id='year_round')

---

## See Also

### Related Documentation
- **[CLAUDE.md](../CLAUDE.md)** - Main project documentation with database schema, architecture, and quick reference
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** - Complete admin procedures, email systems, Slack integration, challenge setup
- **[TESTING_FUNCTIONS_GUIDE.md](TESTING_FUNCTIONS_GUIDE.md)** - Backend testing suite and procedures
- **[DEPLOYMENT_AND_WORKFLOW.md](DEPLOYMENT_AND_WORKFLOW.md)** - Deployment procedures and troubleshooting

### Quick Links
- For database schema (Google Sheets structure), see CLAUDE.md
- For API endpoint contracts, see CLAUDE.md
- For frontend integration, see FRONTEND_PAGES.md
- For testing backend functions, see TESTING_FUNCTIONS_GUIDE.md
