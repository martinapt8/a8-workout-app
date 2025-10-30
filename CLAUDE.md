# A8 Workout Challenge App V2

## Project Overview
A collective goal-oriented workout tracking web app for team building at A8. Features a single challenge period with rotating workouts and a shared company-wide goal. Teams and individuals contribute to one collective target (e.g., 200 workouts in October). Built as a lightweight Google Apps Script web app with personalized URL access.

## Core Philosophy
- **Collective Achievement**: Focus on group goal vs individual streaks
- **Workout Variety**: Multiple workouts scheduled throughout challenge period
- **Team Contribution**: Teams work together toward single company goal
- **Flexibility**: Users can log prescribed workouts or external workouts
- **Minimal Friction**: No passwords, no app downloads, bookmark your personal URL

## Technical Architecture

### Frontend
- **Two HTML Files**:
  - `index.html`: Core HTML structure and JavaScript logic
  - `styles.html`: Separated CSS with Base64 embedded Roobert fonts (5 weights)
- **Five-Page SPA**: Today, Team Progress, Me, Workout Library, and A8AI Generator
- **Mobile-First Design**: Optimized for quick phone access
- **A8 Brand Colors**: Black (#000000), Yellow (#FFC107), White (#FFFFFF)
- **AI Integration**: Claude API for dynamic workout generation

### Backend
- **Google Sheets Database**: 5 sheets for Users, Workouts, Completions, Settings, Coaching
- **Google Apps Script**: Server logic with simplified operations
- **No Authentication**: URL parameters identify users (`?user=martin`)
- **CORS Solution**: Uses form-encoded POST (URLSearchParams) instead of JSON to bypass CORS preflight restrictions

### User Access Pattern
```
https://script.google.com/[app-id]/exec?user=megan
https://script.google.com/[app-id]/exec?user=alex
```

## Google Sheets Structure

### Sheet 1: Users
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | user_id | meg | Unique identifier (lowercase) |
| B | display_name | 🎯 Megan | Display name with optional emoji |
| C | team_name | Red | Team assignment |
| D | team_color | #FF0000 | Team color in hex |
| E | total_workouts | 5 | Total for current challenge |
| F | last_completed | 10/3/2025 | Date of last workout |

### Sheet 2: Workouts
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | workout_id | oct_week1_a | Unique identifier |
| B | workout_name | Power Monday | Display name |
| C | instructions | Complete all exercises back-to-back | Workout instructions/notes |
| D | start_date | 10/1/2025 | When workout becomes active |
| E | end_date | 10/3/2025 | When workout expires |
| F | movement_1 | Push-ups | First exercise |
| G | reps_1 | 15 | Reps/duration for movement_1 |
| H | alt_1 | Knee push-ups | Alternative for movement_1 |
| I-K | movement_2... | (repeats for up to 5 movements) | Additional exercises |

### Sheet 3: Completions
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | timestamp | 10/3/2025 09:15:00 | When completed |
| B | user_id | meg | Who completed |
| C | workout_id | oct_week1_a | Which workout: prescribed ID, "AI Workout", or "Other Workout" |
| D | team_name | Red | User's team |
| E | other_workout_details | 15min, Intermediate, Bodyweight | Optional details (AI params or user description) |

### Sheet 4: Settings
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | key | challenge_name | Setting identifier |
| B | value | October Challenge | Setting value |

**Required Settings Keys**:
- `challenge_name`: Display name for the challenge
- `start_date`: Challenge start date (e.g., 10/1/2025)
- `end_date`: Challenge end date (e.g., 11/1/2025)
- `total_goal`: Target number of workouts (e.g., 200)
- `company_name`: Company name for branding (e.g., A8)
- `timezone`: Application timezone for consistent day boundaries (e.g., America/New_York)

### Sheet 5: Coaching
| Column | Field | Example | Description |
|--------|-------|---------|-------------|
| A | date | 10/16/2025 | Date for coaching tip |
| B | coaching_tip | Remember to focus on form over speed today! | Daily coaching message |

**Purpose**: Provides daily coaching tips that appear in Slack progress updates when triggered on matching dates.

## Frontend Structure

### Page 1: Today (Default Landing)
```
┌─────────────────────────┐
│  A8 October Challenge   │
│  Hey 🎯 Megan!          │
│  ✅ Completed Today     │
├─────────────────────────┤
│  Today's Workout        │
│  Power Monday           │
│  Oct 1-3                │
│                         │
│  Complete all exercises │
│  back-to-back, rest 60  │
│  seconds between rounds │
│                         │
│  • Push-ups: 15         │
│    (or knee push-ups)   │
│  • Squats: 20           │
│    (or wall sits)       │
│                         │
│  [Complete Workout]     │
│  [Log Other Workout]    │
├─────────────────────────┤
│  Recent Activity        │
│  • Megan completed...   │
│  • Martin completed...  │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library] │
└─────────────────────────┘
```

### Page 2: Team Progress
```
┌─────────────────────────┐
│  A8 October Challenge   │
├─────────────────────────┤
│  Total A8 Goal          │
│  60/200 workouts - 30%  │
│  ████████░░░░░░░░░░     │
│                         │
│  Team Breakdown:        │
│  Team Red: 20           │
│  Team Blue: 20          │
│  Team Green: 20         │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library] │
└─────────────────────────┘
```

### Page 3: Me (NEW)
```
┌─────────────────────────┐
│  My Summary             │
│  🎯 Megan - Team Red    │
│  15 workouts completed  │
│  Last Workout: Oct 16   │
├─────────────────────────┤
│  My Calendar            │
│  Oct 2025               │
│  Su Mo Tu We Th Fr Sa   │
│     1✓ 2✓ 3✓ 4  5       │
│   6✓ 7✓ 8  9✓10✓11✓     │
│  12✓13✓14✓15✓16✓        │
├─────────────────────────┤
│  📅 Log Past Workout    │
│  Date: [10/14 ▼]        │
│  Workout: [________]    │
│  [Log Past Workout]     │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library] │
└─────────────────────────┘
```

### Page 4: Workout Library
```
┌─────────────────────────┐
│  Workout Library        │
├─────────────────────────┤
│  Past Workouts:         │
│  • Power Monday         │
│    Oct 1-3              │
│  • Core Burner          │
│    Oct 4-6              │
│                         │
│  Current Workout:       │
│  • Full Body ⭐         │
│    Oct 14-16            │
│                         │
│  Upcoming Workouts:     │
│  • HIIT Mix             │
│    Oct 17-19            │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library|🤖A8AI] │
└─────────────────────────┘
```

### Page 5: A8AI Workout Generator
```
┌─────────────────────────┐
│  A8AI Workout Generator │
│  🤖                     │
├─────────────────────────┤
│  How much time do you   │
│  have?                  │
│  [10 min][15 min][20 min]│
│  ───────────            │
│  What difficulty level? │
│  [Beginner][Inter][Hard]│
│  ───────────            │
│  What equipment do you  │
│  have?                  │
│  [Bodyweight][Kettlebell]│
│  [Dumbbell][Bands]      │
│  [Full Gym]             │
│                         │
│  [Generate Workout 🤖]  │
├─────────────────────────┤
│  OR (after generation): │
├─────────────────────────┤
│  ## Warm-up (2 min)     │
│  • Arm circles          │
│  • Jumping jacks        │
│                         │
│  ## Main Workout        │
│  **Round 1:**           │
│  • Push-ups: 15 reps    │
│  • Squats: 20 reps      │
│                         │
│  [🔄 Refresh]           │
│  [⚙️ Change Options]    │
│  [Log This Workout]     │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library|🤖A8AI] │
└─────────────────────────┘
```

## Backend Functions

### Google Apps Script Files

The project includes several Google Apps Script files for different functionalities:

1. **Code.gs**: Core web app functions (main entry point)
2. **ClaudeAPI.gs**: AI workout generation via Claude API
3. **SetupSheets.gs**: Automated sheet creation and validation
4. **FormMigration.gs**: Migrates form responses to Users table
5. **welcome_email.gs**: Sends personalized welcome emails with app links
6. **update_email.gs**: Sends mid-challenge update emails with new deployment links
7. **Slack.gs**: Slack notifications and progress updates
8. **menu.gs**: Creates custom spreadsheet menu for admin functions

### Core Functions

#### `doGet(e)`
Main entry point for web app. Handles URL parameters and serves HTML.

#### `getUserDashboardData(userId)`
Returns all data needed for the user's dashboard:
- User info (name, team, completion status)
- Today's workout details
- Completion status for today
- Challenge metadata

#### `getActiveWorkout()`
Returns the current workout based on today's date:
- Uses header-based mapping for column access
- Checks date ranges in Workouts sheet
- Includes instructions field if available
- Returns newest if overlap exists
- Returns null if no active workout

#### `markWorkoutComplete(userId, workoutType, workoutDetails, completionDate)`
Records a workout completion:
- `workoutType`: "prescribed" (uses active workout_id) or "other" (logs as "Other Workout")
- `workoutDetails`: Optional text description for "other" workouts (e.g., "30 min run")
- `completionDate`: Optional date string (YYYY-MM-DD) for backfilling past workouts
- Updates user's total_workouts
- Updates last_completed date
- Adds entry to Completions sheet with optional details in column E
- Prevents duplicate logging for same date
- Validates dates are not in the future

#### `getGoalProgress()`
Returns collective progress data:
- Total workouts completed vs goal
- Percentage complete
- Team breakdowns
- Recent completions (last 10, from newest to oldest, filtered by challenge dates)

#### `hasCompletedOnDate(ss, userId, targetDate)`
Checks if user has already logged a workout on a specific date:
- Used by backfill feature to prevent duplicate logging
- Returns boolean

#### `getUserCompletionHistory(userId)`
Returns array of dates when user completed workouts:
- Used by Me page calendar to show checkmarks
- Filters by current challenge date range
- Returns dates in YYYY-MM-DD format

#### `getAllWorkouts()`
Returns all workouts for the library page:
- Fetches all workouts from Workouts sheet
- Includes exercises, instructions, and video links
- Converts dates to timestamps for serialization
- Skips workouts with invalid/missing dates
- Sorted by start_date (oldest to newest)

#### `generateAIWorkout(timeMinutes, difficulty, equipment)`
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

### Helper Functions

#### `getWorkoutsHeaderMapping(workoutsSheet)`
Creates dynamic mapping of column headers to indices for flexible column access

#### `getSettings(ss)`
Reads Settings sheet and returns object with all key-value pairs

#### `getUserInfo(ss, userId)`
Finds user by user_id (case-insensitive) and returns user data

#### `updateUserStats(ss, userId)`
Updates user's total_workouts and last_completed fields

#### `getTeamTotals(ss)`
Aggregates workout totals by team for current challenge

#### `formatDate(date)`
Consistent date formatting for display

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

## Development Phases

### Phase 1: Core Setup ✅
- [x] Create CLAUDE_V2.md documentation
- [x] Set up Google Sheets with 4 sheets (SetupSheets.gs created)
- [x] Create basic Code.gs backend
- [x] Build index.html structure
- [x] Create styles.html with branding

### Phase 2: Functionality ✅
- [x] Implement workout date-range logic
- [x] Build completion tracking system
- [x] Create goal progress calculations
- [x] Add two-page navigation
- [x] Implement both workout types (prescribed/external)

### Phase 3: Polish ✅
- [x] Add completion animations
- [x] Create progress visualizations
- [x] Optimize for mobile
- [x] Add Instructions column with header-based mapping
- [x] Update frontend to display workout instructions
- [x] Add error handling for edge cases
- [x] Test all user flows
- [x] Fix timezone handling for consistent day boundaries

### Phase 4: Launch
- [ ] Populate Users sheet with team
- [ ] Schedule October workouts
- [x] Deploy to Google Apps Script (test deployment active)
- [ ] Generate personalized URLs
- [ ] Team announcement and onboarding

### ✅ Working Features
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
- **Personal calendar** (on Me page)
  - Visual grid showing all days of the month
  - Checkmarks on completed workout dates
  - Grayed out dates outside challenge range
  - Auto-updates after logging workouts
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
- Goal progress tracking with color-coded progress bar
- Recent Activity feed on Today page (newest first, filtered by challenge dates)
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
- **Mobile device testing** for new 4-page navigation
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
- Ensure 4-tab navigation is readable on small screens

## Administrative Features

### Form Response Migration (FormMigration.gs)

Automatically migrates user data from Google Form responses to the Users table:

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

### Welcome Email System (welcome_email.gs)

Sends personalized welcome emails with app links:

**Key Features:**
- Emoji-safe display name handling (removes problematic characters)
- Personalized app links (?user=username)
- Tracks email sent status in Users table
- Accessible via "A8 Custom Menu" → "Send Welcome Email"

**Required Columns in Users Sheet:**
- email, display_name, user_id, active_user, welcome_email_sent

**Required Settings:**
- deployed_URL in Settings sheet

### Update Email System (update_email.gs)

Sends mid-challenge update emails with new deployment links:

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

### Slack Integration (Slack.gs)

Manual Slack progress updates focused on collective goal progress:

**Daily Progress Summary Features:**
- Overall progress toward total_goal (e.g., 150/200 workouts)
- Visual progress bar and percentage
- Two-column layout:
  - **Team Contributions** (left): Team totals (e.g., "Green: 15 workouts")
  - **Today's Completed Workouts** (right): List of users who completed workouts today with display names
- **Today's Coaching Tip**: Pulls from Coaching sheet based on current date
- Motivational messages based on progress percentage

**Daily Reminder Features:**
- Today's workout details with instructions and movements
- Rest day notifications
- App link for easy access

**Setup:**
1. Set webhook URL: `setSlackWebhookUrl('your-webhook-url')`
2. Manually trigger via "A8 Custom Menu" → "Send Slack Progress Update"
3. Test functions: `testDailyProgressSummary()` and `testDailyReminder()`

**Configuration:**
- Uses Script Properties for secure webhook storage (key: SLACK_WEBHOOK_URL)
- Manual triggering via custom menu (no automated triggers)
- Coaching tips pulled from Coaching sheet based on current date

### Custom Menu System (menu.gs)

Provides easy access to administrative functions:

**Menu Items:**
- "Migrate Form Responses" → `migrateFormResponses()`
- "Send Welcome Email" → `sendWelcomeEmail()`
- "Send Update Email" → `sendUpdateEmail()`
- "Send Slack Progress Update" → `sendDailyProgressSummary()`
- "Test Migration Preview" → `testMigrationPreview()`

## Configuration Guide

### Setting Up a New Challenge
1. **Update Settings Sheet**:
   - Set challenge_name (e.g., "October Challenge")
   - Set start_date and end_date
   - Set total_goal (e.g., 200)

2. **Add Users**:
   - Add each team member to Users sheet
   - Assign teams and colors
   - Set initial total_workouts to 0

3. **Schedule Workouts**:
   - Add workouts to Workouts sheet
   - Set date ranges (no overlaps)
   - Include 3-5 movements per workout
   - Add instructions in column C for workout guidance

4. **Configure AI Workout Generator (Optional)**:
   - Get Claude API key from https://console.anthropic.com/
   - In Google Apps Script: Project Settings → Script Properties
   - Add property: `CLAUDE_API_KEY` = your API key
   - Test with `testClaudeAPI()` function in Script Editor
   - AI page will work once API key is configured

5. **Deploy**:
   - Deploy as Web App in Google Apps Script
   - Set execute as "Me" and access "Anyone"
   - Share base URL with team

### Managing During Challenge
- **View Progress**: Check Completions sheet for real-time data
- **Update Workouts**: Can add/modify future workouts anytime
- **Track Engagement**: Monitor Settings sheet for participation
- **Export Data**: Download Completions sheet for analysis
- **User Management**: Use "A8 Custom Menu" → "Migrate Form Responses" to add new users
- **Email Communications**:
  - Use "A8 Custom Menu" → "Send Welcome Email" for initial onboarding
  - Use "A8 Custom Menu" → "Send Update Email" for mid-challenge updates with new deployment links
- **Slack Integration**: Use "A8 Custom Menu" → "Send Slack Progress Update" for manual progress updates
- **Coaching Tips**: Add daily tips to Coaching sheet (date in Column A, tip in Column B) for Slack integration
- **Timezone Note**: All times use the timezone configured in Settings sheet for consistency

### Adding Video Links to Movements
To add instructional video links to workout movements:
1. **Select the movement cell** in any `movement_X` column in the Workouts sheet
2. **Insert hyperlink**: Use Insert → Link (or Ctrl/Cmd+K)
3. **Enter the video URL**: Paste YouTube or other video link
4. **The cell will display** the exercise name as hyperlinked text
5. **Users will see** the movement as a clickable link with:
   - Yellow color and underline for visibility
   - External link icon (↗) indicating it opens in new tab
   - Videos open in new tab when clicked

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
- `getUserCompletionHistory` - Get user's completion dates
- `generateAIWorkout` - Generate AI workout
- `markWorkoutComplete` - Log a workout (POST only)

**Why form-encoded?** Google Apps Script has CORS restrictions that prevent JSON POST requests from triggering preflight OPTIONS requests. Using URLSearchParams bypasses this limitation.

## Design System

### Colors
- **Primary**: Black (#000000)
- **Accent**: Yellow (#FFC107)
- **Success**: Green (#10B981)
- **Background**: White (#FFFFFF)
- **Text**: Dark Gray (#111827)
- **Muted**: Gray (#6B7280)

### Typography
- **Font Family**: Roobert (Base64 embedded) with system font fallbacks
- **Font Weights**: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), 800 (Extra Bold)
- **Format**: OpenType fonts embedded as Base64 data URLs
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

## Testing Checklist

### Functionality Tests
- [ ] User can complete prescribed workout
- [ ] User can log external workout
- [ ] Completion updates immediately
- [ ] Team page shows accurate totals
- [ ] Team totals are correct
- [ ] Date-based workout selection works
- [ ] Navigation between all 4 pages works
- [ ] Me page calendar shows checkmarks correctly
- [ ] Library page displays all workouts
- [ ] Library workout detail view works
- [ ] Past workout logging from Me page works
- [ ] Activity feed appears on Today page

### Edge Cases
- [ ] Invalid user parameter handling
- [ ] No active workout handling
- [ ] Multiple completions per day prevention
- [ ] Date boundary testing (timezone handling)
- [ ] Empty team handling

### Device Testing
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad/Tablet
- [ ] Desktop browsers

## Pre-Launch QA Checklist

### Critical Items
- [ ] **Configure timezone in Settings sheet** (e.g., `timezone`: `America/New_York`)
- [ ] **Verify all user_ids are lowercase** in Users sheet to prevent lookup issues
- [ ] **Clear test data** from Completions sheet
- [ ] **Test with multiple simultaneous users** to check for race conditions
- [ ] **Populate at least one workout** for launch day with proper date ranges
- [ ] **Set correct challenge dates** in Settings (start_date, end_date)
- [ ] **Test on actual mobile devices**, not just browser dev tools

### Data Validation
- [ ] Check for duplicate user_ids in Users sheet
- [ ] Verify team colors are valid hex codes
- [ ] **Ensure all workouts have valid start_date and end_date** (invalid dates will be skipped in library)
- [ ] Ensure workout date ranges don't have gaps (unless intentional rest days)
- [ ] Test "Other Workout" with maximum length text (100 characters)

### Integration Testing
- [ ] If using Slack, verify SLACK_WEBHOOK_URL in Script Properties
- [ ] Test form migration if using Google Forms for signup
- [ ] Send test welcome email to verify email configuration
- [ ] Check that all admin menu functions work properly

## Deployment Steps

1. **Create Google Sheet**:
   - New Google Sheet with 5 tabs
   - Name tabs: Users, Workouts, Completions, Settings, Coaching

2. **Add Apps Script**:
   - Tools → Script Editor
   - Create Code.gs, index.html, styles.html
   - Copy code from this project

3. **Configure Settings**:
   - Add challenge configuration to Settings sheet
   - **IMPORTANT**: Add `timezone` setting (e.g., `America/New_York`)
   - Populate Users with team members (ensure user_ids are lowercase)
   - Add initial workouts

4. **Deploy Web App**:
   - Deploy → New Deployment
   - Type: Web App
   - Execute as: Me
   - Access: Anyone
   - Copy deployment URL

5. **Generate User URLs**:
   - Base URL + ?user=[user_id]
   - Share with each team member

## Monitoring & Analytics

### Key Metrics
- **Participation Rate**: Daily active users / Total users
- **Goal Progress**: Total completions / Goal
- **Team Balance**: Completions per team
- **Workout Type Split**: Prescribed vs External

### Data Export
- Download Completions sheet as CSV
- Analyze in Excel/Sheets
- Track week-over-week trends
- Identify engagement patterns

## Troubleshooting

### Common Issues
1. **"User not found"**: Check user_id in URL matches Users sheet exactly
2. **No workout showing**: Verify date ranges in Workouts sheet
3. **Completion not saving**: Check script permissions and execution
4. **Slow loading**: Consider reducing Recent Activity items

### Debug Mode
Add `?debug=true` to URL for console logging (implement in Code.gs)

## Future Enhancements

### AI Workout Generator Potential Improvements
- **Rate limiting**: Max AI workouts per user per day (prevent API abuse)
- **Workout storage**: Save AI workouts to separate sheet for analytics
- **User feedback**: Rating system for AI-generated workouts
- **Prompt refinement**: Iterate on workout generation prompt based on user feedback
- **Cost tracking**: Monitor Claude API usage and costs
- **Workout history**: View previously generated AI workouts
- **Favorite workouts**: Save AI workouts to repeat later

### General App Enhancements
- Photo uploads for workouts
- Achievement badges
- Historical challenge archives
- Personal records tracking
- Rest day scheduling
- Injury modifications

## Contact
Project: A8 Workout Challenge App V2
Purpose: October 2025 Challenge - Collective Goal
Target: 200 Total Workouts
Timeline: 10/1/2025 - 11/1/2025