# A8 Workout Challenge App

## Current Status (Latest Update - October 29, 2025)

### 🎨 Navigation & UI Improvements (October 29, 2025)

**Team Page Enhancements**:
- Added challenge name and dates to Team page header
  - Challenge name displayed with h2 styling (24px, bold, centered)
  - Date range shown in MM/DD/YYYY format (e.g., "10/1/2025 - 11/5/2025")
  - Thin gray text styling for dates (matches summary-last class)
  - All data pulled from Settings table (challenge_name, start_date, end_date)

**Custom SVG Navigation Icons**:
- Replaced emoji icons with professional SVG icons from Noun Project
  - Today: Flexed bicep/phone icon (by Icon Market)
  - Team: Group/people icon (by Royyan Razka)
  - Me: Infinity/connection icon (by Shmidt Sergey)
  - Library: Books icon (by Ngiconan)
  - AI: Robot face icon (by Muhammad Mukhlis)
- Removed attribution text from SVG files for clean display
- Implemented CSS filter-based color system for consistency:
  - Inactive state: uniform gray (#6B7280)
  - Active state: rich black (#000000)
  - Smooth transitions between states
- Responsive sizing for all screen sizes (24px → 18px → 16px on mobile)

**Cache-Busting Updates**:
- Added version parameters to CSS and JS file references
- Current version: 20251029-4
- Forces fresh file loads on saved iPhone web apps
- Prevents cached versions from displaying outdated styles

**Technical Changes**:
- index.html: Updated navigation HTML structure with SVG img tags
- styles.css: Added .nav-icon-svg styling with CSS filters
- assets/: Added 5 new SVG icon files (today, team, me, library, ai)

## Previous Updates (October 28, 2025 and earlier)

### 🎨 Major UI Overhaul (October 28, 2025)

**Simplified Page Headers**:
- Removed all redundant page titles (challenge-title, goal-challenge-title, "My Summary", "Workout Library", "A8AI Workout Generator")
- Clean headers now show only the Daily Dose logo and essential content
- Today page: Logo + user greeting/status
- All other pages: Logo only → straight to content

**Logo Enhancement**:
- Increased logo size by 50%: 60px → 90px height (max-width 200px → 300px)
- Better visibility and stronger brand presence across all pages

**Layout Improvements**:
- Centered workout dates under workout titles for better visual hierarchy
- Added "Log Other Workout" section headers for clarity
- Centered all content in Me page summary section for balanced design

**Branded Loading Screen** ⭐:
- Full-screen black background with centered yellow Daily Dose logo
- Smooth 0.5s cross-fade transition (loading out → app in)
- Pulsing logo animation (2s loop) for polish
- Loading screen visible instantly while data fetches asynchronously
- Zero added load time - professional UX without performance cost

**App Icon & Favicon**:
- Dynamic generation: Yellow Daily Dose logo on black background
- Black theme color for browser chrome (matches loading screen)
- Works for browser tabs, iOS "Add to Home Screen", and Android
- Consistent branding across all touchpoints

### 🎨 UI Improvements (October 27, 2025)
- **Daily Dose Logo Integration**: Black logo added to all 5 page headers
  - SVG logo centered at top of each page header card
  - Logo file: `assets/daily_dose_logo.svg`

### 🚀 Test Deployment Active
- **Initial deployment successful** - App is running on Google Apps Script
- **Workout page rendering correctly** - Users can see their assigned workouts with video links
- **Completion logging functional** - Workouts are being recorded to Sheets successfully
- **SetupSheets.gs created** - Automated sheet setup with proper structure and validation
- **Hyperlink support added** - Movement cells can contain YouTube/instructional video links

### 🎨 Recent UI Enhancements
- **Other Workout Input Field**: Replaced button with text input for logging external workouts
  - Text input field with 100 character limit for workout descriptions
  - Validation ensures non-empty submissions
  - Taller input field (double height) for better visibility
  - Workout details stored in new `other_workout_details` column in Completions sheet
  - Input field disabled after workout completion for the day
- **Movement Video Links**: Exercises can now link to instructional videos
  - Movement cells in Sheets can contain hyperlinks
  - Links display with underline and external icon (↗) for mobile visibility
  - Uses getRichTextValue() to extract URLs from Google Sheets cells
- **Dynamic Progress Bar Colors**:
  - 0-25%: Green (#10B981) - Early progress
  - 26-75%: Blue (#3B82F6) - Steady progress
  - 76-100%: Yellow (#FFC107) - Nearing goal (A8 brand color)
  - >100%: Red (#EF4444) - Exceeded goal
- **App Icon (Deprecated - see October 28 updates above)**: Old yellow background with black "A8" text
  - Replaced with branded Daily Dose logo on black background

### 🤖 AI Workout Generator (October 24, 2025)

**New 5th Page: A8AI Workout Generator**
- **AI-Powered Workout Creation**: Users can generate custom workouts on-demand using Claude API
- **Three Selection Categories**:
  - **Time**: 10, 15, or 20 minutes
  - **Difficulty**: Beginner, Intermediate, or Hard
  - **Equipment**: Bodyweight, Kettlebell, Dumbbell, Bands, or Full Gym
- **Button-Based UX**: Large, tappable CTA buttons instead of dropdowns for better mobile experience
- **Visual Dividers**: Clear separation between categories so users know to select from each
- **Loading Animation**: Spinning robot emoji with rotating fitness tips (8 tips, changes every 3 seconds)
- **Markdown Formatting**: AI responses rendered with proper HTML formatting
  - Headers with yellow underline (H2) for sections
  - Bold text for emphasis
  - Bulleted and numbered lists
  - Italic text for notes
- **Workout Actions**:
  - **🔄 Refresh**: Generate new workout with same parameters
  - **⚙️ Change Options**: Return to selector form
  - **Log This Workout**: Logs as "AI Workout" with parameters stored
- **Smart Logging**:
  - Stores as "AI Workout" in `workout_id` column (distinct from "Other Workout")
  - Parameters stored in `other_workout_details`: "15min, Intermediate, Bodyweight"
  - Respects same-day completion rules
- **Error Handling**: Graceful error display with retry option
- **API Configuration**: Uses Claude Haiku 4.5 model, requires `CLAUDE_API_KEY` in Script Properties

**Technical Implementation:**
- New file: `ClaudeAPI.gs` with API integration
- Markdown-to-HTML converter function in frontend
- Styled markdown elements for readability
- Mobile-optimized button grid layouts
- 5-tab navigation (compressed labels for mobile)

### 🐛 Known Issues
- **Google Apps Script banner**: Cannot be removed (Google security requirement)
  - This is by design and cannot be suppressed

### ⚡ Major Update: 5-Page Navigation (October 17-24, 2025)

**New Page Structure:**
The app has been redesigned from 2 pages to 5 pages for better user experience:

1. **💪 Today** (formerly "Workout")
   - Today's workout with instructions and movements
   - Log Other Workout input field
   - Recent Activity feed (moved from Team page)

2. **📈 Team** (formerly "Progress")
   - Total goal progress with color-coded bar
   - Team breakdown totals
   - Activity feed removed (now on Today page)

3. **👤 Me** (NEW)
   - Personal summary (name, team, total workouts, last workout)
   - Calendar grid showing completed workout dates with checkmarks
   - Log Past Workout form (moved from Today page)

4. **📚 Library**
   - Chronological list of all workouts (Past, Current, Upcoming)
   - Click any workout to view full details
   - Current workout marked with ⭐
   - Back buttons at top and bottom for easy navigation

5. **🤖 A8AI** (NEW - October 24, 2025)
   - AI-powered workout generator
   - Button-based parameter selection (time, difficulty, equipment)
   - Claude API integration for dynamic workout creation
   - Markdown-formatted workout display
   - Refresh and change options functionality

**Backend Enhancements:**
- Added `getUserCompletionHistory(userId)` - Returns dates user completed workouts for calendar
- Added `getAllWorkouts()` - Returns all workouts with exercises for library
- Date serialization fix: Convert Date objects to timestamps for `google.script.run` compatibility
- Invalid date handling: Skips workouts with missing/malformed dates

**Frontend Improvements:**
- 4-column navigation grid (compressed tabs for mobile)
- Calendar grid component with visual checkmarks on completion dates
- Library list/detail views with smooth transitions
- Dual back buttons in library for improved UX
- Activity feed repositioned to Today page for immediate visibility
- Me page with personal progress tracking

**Navigation Labels:**
- "Today" (previously "Workout")
- "Team" (previously "Progress")
- "Me" (new)
- "Library" (new)

### ⚡ Previous Fixes & Improvements (October 15, 2025)

**Past Workout Backfill Feature:**
- Added dedicated "Log Past Workout" card below today's workout
- Mobile-optimized date picker with full input area as tap target (not just calendar icon)
- Desktop keyboard input supported
- Duplicate prevention: checks if user already logged for selected date
- Date validation: prevents future dates, respects challenge boundaries
- Timestamps set to 6 PM (18:00) to avoid timezone edge cases
- Input validation for workout description (required, 100 char max)
- Success/error messaging inline with color-coded feedback
- Auto-clears form after successful submission
- Defaults to yesterday for quick access

**Recent Activity Feed Fixed:**
- Corrected iteration order to show newest workouts first (was showing oldest)
- Now filters by challenge date range (was pulling all-time data)
- Properly displays last 10 workouts within current challenge
- Fixed issue where October 1 workouts were stuck due to forward iteration

**UI/UX Improvements:**
- Changed navigation from "Goal" (🎯) to "Progress" (📈) for clarity
- Date input styled for better mobile accessibility (56px min-height, full-width clickable)
- Calendar picker indicator made invisible but expanded to cover entire input
- Success messages show green background, error messages show red

**Backend Enhancements:**
- Added `hasCompletedOnDate()` function for duplicate checking
- Modified `markWorkoutComplete()` to accept optional `completionDate` parameter
- Date parsing now handles YYYY-MM-DD format with proper timezone handling
- Two-pass iteration in `getGoalProgress()`: totals first, then recent completions backwards
- Removed unnecessary `.reverse()` call since data already in correct order

**Previous Fixes:**
- **Timezone Handling Fixed**: All date operations now use configurable timezone from Settings sheet
  - Prevents workout completion issues across different user timezones
  - Ensures consistent "day" boundaries for all users globally
  - Add `timezone` setting with value like `America/New_York` to Settings sheet
- **Team Display Updated**: Removed colon after team names in goal page for cleaner appearance
- **Performance Optimization**: Added timezone caching to reduce Settings sheet reads

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
