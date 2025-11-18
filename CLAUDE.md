# Daily Dose - A8 Workout Challenge App V3

## Project Overview
A year-round workout tracking web app for A8 with multi-challenge support. Users can participate in time-bound challenges with team competitions and collective goals, or log workouts independently during off-challenge periods or if they have not taken part of the challenge. 

Each challenge features rotating prescribed workouts, flexible team assignments, and shared company-wide goals. Built as a lightweight GitHub Pages frontend with Google Apps Script API backend.

## Core Philosophy
- **Year-Round Engagement**: Log workouts anytime, whether in an active challenge or not
- **Multi-Challenge Support**: Run multiple challenges with different teams, goals, and timeframes, although never multiple challenges at once
- **Collective Achievement**: Focus on group goal vs individual streaks during challenges
- **Workout Variety**: Rotating prescribed workouts, AI-generated options, and custom "other workout" logging
- **Team Flexibility**: Team assignments per challenge, users can be on different teams each time
- **Historical Tracking**: A user can see their lifetime workouts, previous challenges, and logged workouts in a calendar UI
- **Minimal Friction**: No passwords, no app downloads, bookmark your personal URL

## Technical Architecture

### Frontend (GitHub Pages)
- **Main App**:
  - `index.html`: Core HTML structure and JavaScript logic (89KB)
  - `styles.css`: All styling (28KB - optimized with external fonts)
  - `config.js`: API endpoint configuration (930B)
  - `api.js`: API helper functions (3.3KB)
  - `fonts/`: External WOFF2 font files (3 weights: Regular, SemiBold, Bold)
  - **Five-Page SPA**: Today, Team Progress, Me, Workout Library, and A8AI Generator
  - **Mobile-First Design**: Optimized for quick phone access, PWA-capable
  - **AI Integration**: Claude API for dynamic workout generation
- **Admin Dashboard** (NEW - Nov 2025):
  - `admin/index.html`: Dashboard home with live stats (9.9KB)
  - `admin/email-campaigns.html`: Email campaign composer (36KB)
  - `admin/admin-styles.css`: A8-branded design system (14KB)
  - `admin/admin-api.js`: API wrapper for campaign endpoints (5.8KB)
  - `admin/admin-config.js`: API configuration (880B)
  - **Features**: Template CRUD, token helper, live preview, 3 targeting modes, campaign sending
  - **Access**: `https://martinapt8.github.io/a8-workout-app/admin/`
- **Challenge Signup Dashboard** (NEW - Nov 2025):
  - `signups.html`: Public signup viewer with team assignments
  - **Features**: Live stats, grouped team display, dynamic signup link
  - **Access**: `https://martinapt8.github.io/a8-workout-app/signups.html?challenge=CHALLENGE_ID`
- **A8 Brand Colors**: Black (#000000), Yellow (#FFC107), White (#FFFFFF)

### Backend (Google Apps Script)
- **Google Sheets Database**: 8 sheets for Users, Workouts, Completions, Challenges, Challenge_Teams, Settings, Coaching, Email_Templates
- **RESTful API**: Form-encoded POST endpoints for all operations
- **Core API** (`Code.gs`): Main app endpoints (getDashboard, markWorkoutComplete, etc.)
- **Email Campaigns API** (`EmailCampaigns.gs`): Template management, token replacement, campaign sending (NEW - Nov 2025)
- **Admin Dashboard API**: Additional GET endpoints (getActiveUsersCount, getAllChallenges, getActiveUsers, getChallengeSignups, etc.)
- **No Authentication**: URL parameters identify users (`?user=martin`)
- **CORS Solution**: Uses form-encoded POST (URLSearchParams) instead of JSON to bypass CORS preflight restrictions

### User Access Pattern via GitHub
```
https://martinapt8.github.io/a8-workout-app/?user=megan
https://martinapt8.github.io/a8-workout-app/?user=alex
```

## Project Folder Structure

```
Daily Dose Dev/
├── Root Files
│   ├── index.html              # Main app HTML (89KB, 5-page SPA)
│   ├── signup.html             # User signup page (17KB)
│   ├── styles.css              # All styling (28KB - optimized)
│   ├── config.js               # API endpoint configuration (930B)
│   ├── api.js                  # API helper functions (3.3KB)
│   ├── CLAUDE.md               # Primary project documentation
│   ├── CHANGELOG.md            # Version history
│   └── deploy.sh               # Deployment script
│
├── fonts/                      # WOFF2 font files (3 files, 96KB total)
│   ├── Roobert-Regular.woff2   # 32KB, font-weight: 400
│   ├── Roobert-SemiBold.woff2  # 32KB, font-weight: 600
│   └── Roobert-Bold.woff2      # 32KB, font-weight: 700
│
├── assets/                     # Images and icons (12 files)
│   ├── A8_Logo.png
│   ├── daily_dose_logo_*.png   # 3 sizes
│   ├── daily_dose_logo.svg
│   └── *.svg                   # today, team, me, library, ai icons
│
├── admin/                      # Admin dashboard (5 files, 67KB) [NEW - Nov 2025]
│   ├── index.html              # Dashboard home (9.9KB)
│   ├── email-campaigns.html    # Campaign composer (36KB)
│   ├── admin-styles.css        # A8 design system (14KB)
│   ├── admin-api.js            # API wrapper (5.8KB)
│   └── admin-config.js         # API config (880B)
│
├── backend/                    # Google Apps Script files (14 files)
│   ├── Code.gs                 # Core REST API (37KB)
│   ├── EmailCampaigns.gs       # Email campaign system (920 lines) [NEW - Nov 2025]
│   ├── AdminChallenges.gs      # Challenge management (14KB)
│   ├── TeamPlaceholders.gs     # Placeholder team assignments (11KB) [NEW - Nov 2025]
│   ├── Signup.gs               # User signup (13KB)
│   ├── ClaudeAPI.gs            # AI workout generation (6KB)
│   ├── Slack.gs                # Slack integration (16KB)
│   ├── welcome_email.gs        # Welcome emails (11KB) [To be deprecated]
│   ├── update_email.gs         # Update emails (13KB) [To be deprecated]
│   ├── FormMigration.gs        # Form response migration (12KB)
│   ├── MigrationScripts.gs     # Multi-challenge migration (18KB)
│   ├── TestingFunctions.gs     # Testing suite (12KB)
│   ├── AutoSort.gs             # Auto-sort completions (3KB)
│   └── menu.gs                 # Custom spreadsheet menu (9KB)
│
├── Documentation/              # Active documentation (6 files)
│   ├── README.md               # Deployment guide
│   ├── FILE_ORGANIZATION.md    # File management guide
│   ├── DEPLOYMENT_AND_WORKFLOW.md # Complete deployment and git workflow
│   ├── ROADMAP.md              # Product roadmap
│   ├── TESTING_CHECKLIST.md    # Feature testing
│   ├── TESTING_FUNCTIONS_GUIDE.md # Backend testing
│   └── archive/                # Historical migration docs
│
└── SampleData/                 # CSV exports (ignored by git)
    ├── Users.csv
    ├── Workouts.csv
    ├── Completions.csv
    ├── Settings.csv
    └── Coaching.csv
```

## Backend Files Reference

| File | Size | Purpose | Key Functions |
|------|------|---------|---------------|
| Code.gs | 37KB | Core REST API, main entry point | doGet(), doPost(), getUserDashboardData() |
| EmailCampaigns.gs | 920 lines | Email campaign system (NEW - Nov 2025) | getEmailTemplates(), replaceTokens(), sendEmailCampaign() |
| AdminChallenges.gs | 14KB | Challenge management | createNewChallenge(), setActiveChallenge() |
| TeamPlaceholders.gs | 11KB | Placeholder team assignment (NEW - Nov 2025) | promptSetPlaceholderTeams(), setPlaceholderTeams() |
| Signup.gs | 13KB | User signup & preferences | createSignupRequest(), updateUserPreferences() |
| ClaudeAPI.gs | 6KB | AI workout generation | generateAIWorkout(), callClaudeAPI() |
| Slack.gs | 16KB | Slack notifications | sendDailyProgressSummary(), sendDailyReminder() |
| welcome_email.gs | 11KB | Welcome emails (To be deprecated) | sendWelcomeEmail() |
| update_email.gs | 13KB | Update emails (To be deprecated) | sendUpdateEmail() |
| FormMigration.gs | 12KB | Form response import | migrateFormResponses() |
| MigrationScripts.gs | 18KB | V2→V3 migration utilities | (historical, not actively used) |
| TestingFunctions.gs | 12KB | Backend testing suite | testUserDashboard(), testWorkoutCompletion() |
| AutoSort.gs | 3KB | Auto-sort completions | onEdit() trigger |
| menu.gs | 9KB | Custom admin menu | onOpen(), promptCreateChallenge(), openAdminDashboard() |

## Google Sheets Structure

### Sheet 1: Users
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | user_id | meg | Unique identifier (lowercase, user-controlled) |
| B | display_name | 🎯 Megan | Display name with optional emoji (shown in app/boards) |
| E | total_workouts | 47 | Workout count for active challenge only (per-challenge tracking) |
| F | last_completed | 10/31/2025 | Date of last workout (any challenge) |
| - | email | megan@example.com | User email address |
| - | full_name | Megan Smith | Full legal name |
| - | join_date | 10/1/2025 | Date user first joined app |
| - | active_user | TRUE | User activation status (set by admin) |
| - | preferred_duration | 20 | Workout duration preference (10/20/30 min) |
| - | equipment_available | Bodyweight,Kettlebell | Comma-separated equipment list |
| - | welcome_email_sent | TRUE | Tracking flag for welcome email |
| - | update_email_sent | TRUE | Tracking flag for update email |
| - | deployment_URL | (formula) | Auto-generated personal app link |

**Note**: Column order may vary. Backend uses header-based mapping for flexibility.

**Important**: `total_workouts` tracks workouts for the ACTIVE challenge only (updated by `updateUserStats()` when workouts are logged). Lifetime workout counts are calculated on-demand via `getLifetimeWorkoutCount()` and returned in API responses as `lifetime_workouts`. Per-challenge historical totals are calculated from Completions by filtering on `challenge_id`.

### Sheet 2: Workouts
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | workout_id | oct_week1_a | Unique identifier |
| B | workout_name | Power Monday | Display name |
| C | instructions | Complete all exercises back-to-back | Workout instructions/notes |
| D | start_date | 10/1/2025 | When workout becomes active |
| E | end_date | 10/3/2025 | When workout expires |
| F | challenge_id | oct_2025 | Which challenge this workout belongs to (NULL = available anytime) |
| G | movement_1 | Push-ups | First exercise |
| H | reps_1 | 15 | Reps/duration for movement_1 |
| I | alt_1 | Knee push-ups | Alternative for movement_1 |
| J-L | movement_2... | (repeats for up to 5 movements) | Additional exercises |

**Note**: Workouts with NULL `challenge_id` are available year-round. Challenge-specific workouts only appear during their challenge's date range.

### Sheet 3: Completions
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | timestamp | 10/3/2025 09:15:00 | When completed |
| B | user_id | meg | Who completed |
| C | workout_id | oct_week1_a | Which workout: prescribed ID, "AI Workout", or "Other Workout" |
| D | team_name | Red | User's team at time of completion |
| E | other_workout_details | 15min, Intermediate, Bodyweight | Optional details (AI params or user description) |
| F | challenge_id | oct_2025 | Which challenge this belongs to (NULL = off-challenge workout) |

**Note**: `challenge_id` enables fast filtering of completions by challenge (10-20x faster than date-range queries). NULL values represent workouts logged outside of any active challenge period.

### Sheet 4: Challenges
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | challenge_id | oct_2025 | Unique identifier (no spaces) |
| B | challenge_name | October Challenge | Display name shown in app |
| C | start_date | 10/1/2025 | Challenge start date |
| D | end_date | 10/31/2025 | Challenge end date |
| E | total_goal | 200 | Target number of workouts for the challenge |
| F | status | active | Challenge state: `active`, `upcoming`, or `completed` |
| G | signup_deadline | 11/19/2025 | Last date users can sign up for challenge (added Nov 2025) |

**Important Notes**:
- **DEPRECATED**: The old `is_active` boolean column was removed in November 2025. Use `status` column instead.
- **Status Values**:
  - `active`: Currently running challenge (only ONE challenge should be active at a time)
  - `upcoming`: Future challenge not yet started (visible to all users for sign-up awareness)
  - `completed`: Past challenge that has ended
- **signup_deadline**: Used by challenge signup system to automatically reject late signups
- The active challenge determines which workouts appear on the Today page and which teams are shown
- Upcoming challenges appear in the "My Challenges" section for all users regardless of participation

### Sheet 5: Challenge_Teams
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | challenge_id | oct_2025 | Which challenge this team assignment is for |
| B | user_id | meg | User being assigned to team |
| C | team_name | Red | Team name for this challenge |
| D | team_color | #FF0000 | Team color in hex |

**Purpose**: Flexible team assignments per challenge. Users can be on different teams in different challenges. Teams are created/managed via admin menu when setting up a new challenge.

### Sheet 6: Settings
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | key | company_name | Setting identifier |
| B | value | A8 | Setting value |

**Required Settings Keys**:
- `company_name`: Company name for branding (e.g., A8)
- `timezone`: Application timezone for consistent day boundaries (e.g., America/New_York)
- `deployed_URL`: Base URL for email links (e.g., https://martinapt8.github.io/a8-workout-app/)

**Note**: Challenge-specific settings (name, dates, goals) are now in the Challenges sheet. Settings sheet is for app-wide configuration only.

### Sheet 7: Coaching
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | date | 10/16/2025 | Date for coaching tip |
| B | coaching_tip | Remember to focus on form over speed today! | Daily coaching message |

**Purpose**: Provides optional daily coaching tips that appear in Slack progress updates when triggered on matching dates.

**Integration**: Used by `sendDailyProgressSummary()` in Slack.gs:
- Searches for row where date matches current date
- Includes coaching tip in "Today's Coaching Tip" section
- If no matching date found, section is omitted
- Enables personalized motivational messages throughout challenge

### Sheet 8: Email_Templates
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | template_id | welcome_v1 | Unique template identifier (no spaces) |
| B | template_name | Welcome Email | Display name for admin dashboard |
| C | subject | Welcome to the A8 Fitness Challenge! | Email subject line (supports tokens) |
| D | html_body | `<div>Hi [display_name]...</div>` | HTML email content (supports tokens) |
| E | plain_body | Hi [display_name]... | Plain text fallback (supports tokens) |
| F | created_date | 11/18/2025 | Timestamp when template was created |
| G | last_modified | 11/18/2025 | Timestamp of last edit |
| H | active | TRUE | Whether template is visible in dashboard |

**Purpose**: Stores email campaign templates for flexible admin-managed communications.

**Token Support** - Use these placeholders in subject, html_body, and plain_body:
- **User tokens**: `[display_name]`, `[deployment_URL]`, `[lifetime_workouts]`
- **Challenge tokens**: `[challenge_name]`, `[challenge_start_date]`, `[challenge_end_date]`, `[days_remaining]`, `[total_workouts]`
- **Team tokens**: `[team_name]`, `[team_total_workouts]`

**Integration**: Used by `EmailCampaigns.gs` for template-based email campaigns. Replaces hardcoded email system from `welcome_email.gs` and `update_email.gs`.

**Admin Access**: Managed via admin dashboard (`/admin/`) or directly in Google Sheets.

## Frontend Pages Overview

The app is a five-page SPA with mobile-first design and bottom navigation:

**Page 1: Today** (Default Landing)
- Challenge name and personal greeting
- Completion status indicator
- Current workout card with instructions and exercises
- Exercise alternatives displayed for accessibility
- Action buttons (Complete Workout / Log Other Workout)
- Recent Activity feed (newest first)

**Page 2: Team Progress**
- Total goal progress (number and percentage)
- Color-coded visual progress bar (green → blue → yellow → red)
- Team Totals: Agency-wide team aggregates
- My Team's Workouts: Individual team member breakdown (NEW - Nov 7, 2025)
  - Shows user's specific team members alphabetically
  - Displays challenge-specific workout counts per member
  - Includes all team members (even 0 workouts)
  - Only visible when user is assigned to team in active challenge

**Page 3: Me**
- Personal summary (name, team, lifetime workout count, last workout date, user join date)
- Multi-month calendar with navigation (◀ ▶)
- Checkmarks on completed dates
- Past workout backfill form with date picker
- Shows all workouts across all challenges and year-round

**Page 4: Workout Library**
- Three sections: Past, Current (⭐), Upcoming
- Workout cards with names and date ranges
- Click to view full exercise details
- Dual back buttons for navigation

**Page 5: A8AI Workout Generator**
- Parameter selection: Time (10/15/20 min), Difficulty (Beginner/Intermediate/Hard), Equipment
- Claude Haiku 4.5 API integration
- Markdown-formatted workout display
- Actions: Refresh / Change Options / Log This Workout
- Logs as "AI Workout" with parameters stored

**Navigation**: Fixed bottom bar with svg icons for quick page switching.

See `Documentation/FRONTEND_PAGES.md` for detailed UI mockups.

## Backend API Reference

The backend is built with Google Apps Script and provides a RESTful API for the frontend. All backend functions, including core API functions, helper functions, and admin challenge management functions, are documented in detail in **[Documentation/BACKEND.md](Documentation/BACKEND.md)**.

**Quick Reference:**
- **Core Functions**: `getUserDashboardData()`, `getActiveChallenge()`, `markWorkoutComplete()`, `getGoalProgress()`, etc.
- **Helper Functions**: `getSettings()`, `getUserInfo()`, `updateUserStats()`, `getTeamTotals()`, etc.
- **Admin Functions**: `createNewChallenge()`, `setActiveChallenge()`, `setupChallengeTeams()`, `endCurrentChallenge()`

For complete function signatures, parameters, return values, and implementation details, see [BACKEND.md](Documentation/BACKEND.md).

## User Experience Flow

### First Time User
1. Receives personalized URL from admin (e.g., `?user=megan`)
2. Bookmarks URL or saves to home screen
3. Sees welcome message and today's workout
4. Completes workout and sees success animation

### Daily User Flow
1. Opens bookmarked URL
2. Lands on Workout page
3. Sees completion status (✅ or ⏳)
4. If not completed:
   - Reviews today's workout
   - Chooses "Complete Workout" or "Log External Workout"
   - Sees success feedback
5. Navigates to Goal page to check progress
6. Sees team contribution and overall progress

### Workout Rotation
- Workouts automatically change based on date ranges
- Users always see the current active workout
- If no workout is active, shows "Rest Day" message
- Admin can pre-schedule entire month of workouts

## Features
- User authentication via URL parameters (?user=username)
- Date-based workout display with instructions
- Header-based column mapping for flexible sheet structure
- Both prescribed and external workout logging with text descriptions
- Text input field for describing "other workouts" with 100 character limit
- **5-page navigation system** - Today, Team, Me, Library, A8AI
  - Compact mobile-optimized tabs
  - Clear iconography for each section
  - Smooth page transitions
- **Past workout backfill feature** (on Me page)
  - Mobile-optimized date picker with full-width tap target
  - Duplicate prevention per date
  - Validates no future dates
  - Sets timestamps to 6 PM (18:00) for consistent date handling
  - Challenge date boundary enforcement
- **Upcoming Challenges Display** (on Me page)
  - Shows all challenges with status='upcoming' for sign-up awareness
  - Visible to ALL users regardless of participation or team status
  - Displays challenge name, start date, and end date
  - Yellow card styling with "Upcoming" badge
  - Appears at top of "My Challenges" section
  - Sorted by start date (earliest first)
  - No sign-up integration yet (awareness only)
- **Personal calendar with multi-month navigation** (on Me page)
  - Visual grid showing all days of the month
  - Month navigation with prev/next buttons (◀ ▶)
  - Navigate through any month/year to view workout history
  - Year rollover support (Dec ↔ Jan transitions)
  - Shows ALL workouts across all challenges and year-round
  - Checkmarks on completed workout dates
  - Defaults to current month (no longer stuck on challenge start month)
  - Hybrid lazy loading: ±3 months loaded initially, more loaded as needed
  - Auto-updates after logging workouts
  - Mobile-optimized 44px touch target navigation buttons
- **Workout Library** (dedicated page)
  - View all past, current, and upcoming workouts
  - Click to see full workout details with exercises
  - Current workout highlighted with ⭐
  - Dual back buttons for easy navigation
  - Skips workouts with invalid dates
- **AI Workout Generator** (A8AI page)
  - Button-based parameter selection (time, difficulty, equipment)
  - Claude Haiku 4.5 API integration for workout generation
  - Rotating fitness tips during loading (8 tips, 3-second rotation)
  - Markdown-formatted workout display with styled headers, lists, and emphasis
  - Refresh workout with same parameters
  - Change options to generate different workout
  - Logs as "AI Workout" (distinct from "Other Workout")
  - Stores parameters in other_workout_details column
- **Challenge Signup System** (signup_challenge.html - added Nov 2025)
  - Dedicated signup page for specific challenges via URL parameter (?challenge=dd_dec2025)
  - Two-step flow: email entry → full form
  - Automatic user detection via email
  - Existing users: Pre-filled preferences, username field hidden
  - New users: All fields shown, auto-approved (active_user=TRUE)
  - Challenge details displayed (name, dates, goal, signup deadline)
  - Signup deadline enforcement with friendly error messages
  - Duplicate signup prevention
  - Adds signups to Challenge_Teams table for admin team assignment
- **Placeholder Team Assignment** (TeamPlaceholders.gs - added Nov 2025)
  - Menu-driven random team distribution for challenge signups
  - Scans Challenge_Teams for users with empty team_name
  - Shows team configuration suggestions (2-10 teams range)
  - Fisher-Yates shuffle algorithm for fair randomization
  - Alphabetical placeholder naming (Team A, Team B, Team C...)
  - Handles uneven team sizes by creating smaller remainder team
  - Leaves team_color empty for admin to fill manually
  - Accessible via "A8 Custom Menu" → "Set Placeholder Teams"
- Goal progress tracking with color-coded progress bar
- **Agency-Wide Activity Feed** (on Today page)
  - Shows recent completions from ALL users across ALL challenges
  - Works year-round regardless of active challenge or user team status
  - Displays last 15 workouts with user names, workout descriptions, and timestamps
  - Maintains social/community engagement even during off-season
  - Automatically shows descriptive workout names for prescribed workouts
- Team totals aggregation on Team page
- Mobile-responsive design with touch-optimized UI
- Instructions display in workout cards
- Hyperlinked movements for video tutorials
- Form response migration to Users table (FormMigration.gs)
- Welcome email system with emoji handling (welcome_email.gs)
- Simplified Slack integration with manual progress updates and coaching tips (Slack.gs)
- Administrative menu system with migration, email, and Slack functions
- PWA capabilities for "Add to Home Screen" functionality

### 🔍 Next Testing Focus
- **Multi-month calendar navigation** (recent addition - November 4, 2025)
  - Test prev/next month buttons on desktop and mobile
  - Verify year rollover (Dec 2025 → Jan 2026)
  - Check lazy loading triggers when navigating 4+ months
  - Validate checkmarks persist when returning to previously viewed months
  - Test with users who have 100+ completions across multiple challenges
  - Verify navigation button touch targets on mobile (44px minimum)
- **Mobile device testing** for 5-page navigation
- Test calendar grid display on various screen sizes
- Verify library navigation flow on touch devices
- Test Me page past workout logging on mobile
- Verify completion state persistence across sessions
- Test multiple users simultaneously
- Validate date boundary conditions
- Check team color display on Team page
- Test with full month of scheduled workouts
- Verify hyperlink extraction across different movement columns
- Test progress bar color transitions at threshold points
- Ensure 5-tab navigation is readable on small screens

## Administrative Features Summary

The app includes several administrative systems for managing users, challenges, and communications. Admin functions are accessible via:
1. **Admin Dashboard** (web interface): `https://martinapt8.github.io/a8-workout-app/admin/` (NEW - Nov 2025)
2. **A8 Custom Menu** in Google Sheets (traditional workflow)

| Feature | Files | Key Functions | Purpose |
|---------|-------|---------------|---------|
| **Email Campaign System** (NEW) | EmailCampaigns.gs, admin/email-campaigns.html | getEmailTemplates(), sendEmailCampaign() | Create, preview, and send personalized email campaigns via web dashboard |
| **Admin Dashboard** (NEW) | admin/index.html, admin-api.js | Live stats, navigation | Central hub for admin tasks with real-time data |
| **Form Migration** | FormMigration.gs | migrateFormResponses() | Import users from Google Form responses |
| **User Signup** | Signup.gs, signup.html | createSignupRequest() | Self-service registration with preferences |
| **Welcome Emails** (Deprecated) | welcome_email.gs | sendWelcomeEmail() | Onboard new users (replaced by Email Campaign System) |
| **Update Emails** (Deprecated) | update_email.gs | sendUpdateEmail() | Send updates (replaced by Email Campaign System) |
| **Slack Integration** | Slack.gs | sendDailyProgressSummary() | Manual progress updates and reminders |
| **Challenge Management** | AdminChallenges.gs | createNewChallenge(), setActiveChallenge() | Create and switch challenges |
| **Placeholder Teams** | TeamPlaceholders.gs | promptSetPlaceholderTeams(), setPlaceholderTeams() | Randomly assign signups to balanced teams |
| **Custom Menu** | menu.gs | Various prompts, openAdminDashboard() | UI for admin functions + dashboard launcher |

### Quick Admin Workflows

**Onboard New User:**
1. User submits `/signup.html` form OR admin adds to Users sheet
2. Admin sets `active_user = TRUE`
3. Admin runs "Send Welcome Email"

**Create New Challenge:**
1. "A8 Custom Menu" → "Create New Challenge"
2. Users sign up via `/signup_challenge.html?challenge=dd_dec2025`
3. "A8 Custom Menu" → "Set Placeholder Teams" (random balanced assignment)
4. Admin manually adds team_color values in Challenge_Teams sheet
5. Add workouts to Workouts sheet with matching `challenge_id`

**Send Email Campaign:** (NEW - Nov 2025)
1. Open Admin Dashboard: `https://martinapt8.github.io/a8-workout-app/admin/`
2. Navigate to "Email Campaigns"
3. Select existing template OR create new template with tokens
4. Preview email with real user data
5. Choose targeting mode (All Active, Challenge-Based, or Custom List)
6. Preview recipients to verify targeting
7. Optional: Add tracking flag to prevent duplicate sends
8. Click "Send Email Campaign" and confirm

**Send Progress Update:**
1. Add coaching tip to Coaching sheet (optional)
2. "A8 Custom Menu" → "Send Slack Progress Update"

See `Documentation/ADMIN_GUIDE.md` for detailed procedures, validation rules, and configuration steps.

## Configuration Overview

### Initial Setup (One-Time)
- Configure Settings sheet: `company_name`, `timezone`, `deployed_URL`
- Add users via `/signup.html` or manually to Users sheet
- Deploy backend (Google Apps Script as Web App)
- Deploy frontend (GitHub Pages)
- Optional: Configure Claude API key for AI workouts

### Challenge Management
- **Create**: "A8 Custom Menu" → "Create New Challenge"
- **Signups**: Share `/signup_challenge.html?challenge=challenge_id` URL with users
- **Teams**: "A8 Custom Menu" → "Set Placeholder Teams" for random balanced assignment
- **Team Colors**: Manually add hex colors to Challenge_Teams sheet after placeholder assignment
- **Workouts**: Add to Workouts sheet with matching `challenge_id`
- **Switch**: Use menu to set active challenge
- **End**: Use menu to gracefully end challenge

### Year-Round Operation
- Users can log workouts anytime (NULL `challenge_id` for off-season)
- Year-round workouts: Set `challenge_id` to NULL in Workouts sheet
- All historical data preserved in Completions sheet

See `Documentation/ADMIN_GUIDE.md` and `Documentation/DEPLOYMENT_AND_WORKFLOW.md` for detailed setup and configuration procedures.

## API Endpoints

### REST API (GitHub Pages deployment)

**Base URL**: Configured in `config.js`

All API requests use **form-encoded POST** to avoid CORS preflight:
```javascript
const formData = new URLSearchParams();
formData.append('payload', JSON.stringify({
  action: 'markWorkoutComplete',
  userId: 'username',
  workoutType: 'prescribed',
  workoutDetails: '',
  completionDate: null
}));

fetch(API_URL, {
  method: 'POST',
  body: formData
});
```

**Available Actions**:
- `getDashboard` - Get user dashboard data
- `getGoalProgress` - Get team progress
- `getAllWorkouts` - Get workout library
- `getUserCompletionHistory` - Get user's completion dates for active challenge
- `getUserAllCompletions` - Get all completion dates across all challenges (with optional date range filtering)
- `getUserAllChallengeStats` - Get user's past challenge history AND upcoming challenges (for Me page)
- `getRecentCompletionsAll` - Get recent completions across all users/challenges for activity feed (works year-round)
- `generateAIWorkout` - Generate AI workout
- `markWorkoutComplete` - Log a workout (POST only)
- `createSignup` - Create new user signup (POST only)

**Why form-encoded?** Google Apps Script has CORS restrictions that prevent JSON POST requests from triggering preflight OPTIONS requests. Using URLSearchParams bypasses this limitation.

## Common Tasks Quick Reference

### Add a New User
1. User submits form at `/signup.html` OR manually add row to Users sheet
2. Review signup details in Users sheet
3. Admin sets `active_user = TRUE` to approve
4. Run "A8 Custom Menu" → "Send Welcome Email"
5. User receives personalized app link via email

### Create a New Challenge
1. "A8 Custom Menu" → "Create New Challenge"
2. Enter challenge_id, name, dates, and total goal
3. Setup teams via `bulkAssignTeams()` in Script Editor or manually in Challenge_Teams sheet
4. Add workouts to Workouts sheet with matching `challenge_id`
5. Notify users via email or Slack

### Switch Active Challenge
1. "A8 Custom Menu" → "Set Active Challenge"
2. Enter the challenge_id to activate
3. Users see new challenge on next page load

### Check API Logs
1. Open Apps Script Editor (Extensions → Apps Script)
2. Click "Executions" in left sidebar
3. Filter by status/date to find specific requests
4. Click on execution to view detailed logs

### Test Backend Functions
1. Open Apps Script Editor
2. Select function from dropdown (e.g., `testUserDashboard`)
3. Click Run button
4. Check Execution log for results
5. See `TESTING_FUNCTIONS_GUIDE.md` for complete test suite

### View Challenge Analytics
1. Open Completions sheet
2. Use Data → Filter to filter by `challenge_id` column
3. Create pivot table or download as CSV for analysis

### Send Progress Updates
1. "A8 Custom Menu" → "Send Slack Progress Update"
2. Manually trigger daily progress summary
3. Add coaching tips to Coaching sheet (date in Column A, tip in Column B)

### Add Video Links to Workouts
1. Open Workouts sheet
2. Select movement cell (e.g., `movement_1`)
3. Insert → Link (or Ctrl/Cmd+K)
4. Paste video URL
5. Link appears with yellow underline in app

## Design System

### Colors
- **Primary**: Black (#000000)
- **Accent**: Yellow (#FFC107)
- **Success**: Green (#10B981)
- **Background**: White (#FFFFFF)
- **Text**: Dark Gray (#111827)
- **Muted**: Gray (#6B7280)

### Typography
- **Font Family**: Roobert (external WOFF2 files) with system font fallbacks
- **Font Weights**: 400 (Regular), 600 (SemiBold), 700 (Bold)
- **Format**: WOFF2 with Brotli compression (96KB total, 72% faster than previous Base64 implementation)
- **Loading Strategy**: `font-display: swap` for immediate text visibility with fallback fonts
- **Sizes**: Mobile-optimized (16px base)

### Components
- **Cards**: White background, subtle shadow, rounded corners
- **Buttons**:
  - Primary: Yellow gradient background
  - Secondary: White with border
- **Progress Bar**: Yellow fill on light gray background
- **Navigation Tabs**: Fixed bottom, clear active state

### Animations
- **Completion**: Confetti or checkmark animation
- **Progress Update**: Smooth fill animation
- **Page Transition**: Slide or fade between pages

## Performance Optimizations

### Simplified from V1
- **No Streak Calculations**: Removed complex date math
- **No Caching Layer**: Direct sheet reads (simpler, fast enough)
- **Fewer Sheet Operations**: Optimized queries
- **Client-Side Navigation**: No page reloads between tabs

### Mobile Optimization
- **Viewport Meta**: Proper mobile scaling
- **Touch Targets**: Minimum 44px for buttons
- **Reduced Animations**: Respect prefers-reduced-motion
- **Offline Handling**: Graceful degradation

## Monitoring & Analytics

### Key Metrics
- **Participation Rate**: Daily active users / Total users
- **Goal Progress**: Total completions / Goal
- **Team Balance**: Completions per team
- **Workout Type Split**: Prescribed vs External

### Data Export
- Filter Completions sheet by `challenge_id` for challenge-specific analytics
- Download as CSV for external analysis
- Create pivot tables for custom reports

## Troubleshooting

### Common Issues
1. **"User not found"**: Check user_id in URL matches Users sheet exactly
2. **No workout showing**: Verify date ranges in Workouts sheet
3. **Completion not saving**: Check script permissions and execution
4. **Slow loading**: Consider reducing Recent Activity items

### Debug Mode
Add `?debug=true` to URL for console logging (implement in Code.gs)

## Project Information
**Name**: Daily Dose - A8 Workout Challenge App V3.1
**Version**: 3.1 (Email Campaign System + Admin Dashboard)
**Deployment**: GitHub Pages frontend + Google Apps Script backend
**Status**: Production
**Key Features**: Year-round workout logging, multi-challenge support, flexible teams, AI workouts, admin dashboard, email campaigns
**Last Major Update**: November 2025 (Email Campaign System with Admin Dashboard)

---

## See Also

### Technical Reference
- **[BACKEND.md](Documentation/BACKEND.md)** - Complete backend API reference with all Google Apps Script functions
- **[FRONTEND_PAGES.md](Documentation/FRONTEND_PAGES.md)** - Detailed UI mockups for all 5 pages
- **[ADMIN_GUIDE.md](Documentation/ADMIN_GUIDE.md)** - Complete admin procedures, email systems, Slack integration, challenge setup

### Testing & Validation
- **[TESTING_CHECKLIST.md](Documentation/TESTING_CHECKLIST.md)** - Feature testing and edge case validation
- **[TESTING_FUNCTIONS_GUIDE.md](Documentation/TESTING_FUNCTIONS_GUIDE.md)** - Backend testing suite and procedures

### Development Guides
- **[README.md](Documentation/README.md)** - Architecture overview and deployment instructions
- **[DEPLOYMENT_AND_WORKFLOW.md](Documentation/DEPLOYMENT_AND_WORKFLOW.md)** - Complete deployment, git workflow, troubleshooting, and rollback procedures
- **[FILE_ORGANIZATION.md](Documentation/FILE_ORGANIZATION.md)** - What to commit vs exclude, folder structure guidelines

### Planning & Roadmap
- **[ROADMAP.md](Documentation/ROADMAP.md)** - Future features, enhancement ideas, version planning
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes

### Quick Reference
This document (CLAUDE.md) provides:
- Core architecture and philosophy
- Database schema (Google Sheets structure)
- High-level backend overview (detailed functions in BACKEND.md)
- API contracts and endpoints
- Common task shortcuts