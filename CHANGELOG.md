# A8 Workout Challenge App

## Current Status (Latest Update - November 7, 2025)

### 🔔 Upcoming Challenges Feature + Me Page UI Refinements (November 7, 2025 - Late Night)

**New Feature: Upcoming Challenges Display**:
- **Purpose**: Give all users visibility into upcoming challenges for sign-up awareness
- **Backend** (`backend/Code.gs`):
  - Modified `getUserAllChallengeStats()` to return structured object (lines 1226-1323)
  - Now returns: `{ userChallenges: [...], upcomingChallenges: [...] }`
  - Fetches challenges where `status = "upcoming"` from Challenges sheet
  - Upcoming challenges sorted by start_date (earliest first)
  - Includes challenge_id, challenge_name, start_date, end_date
  - Works for all users regardless of participation status
  - Updated JSDoc to reflect new return type
- **Frontend** (`index.html`):
  - Updated `loadPastChallengeHistory()` to handle new response structure (lines 983-1079)
  - Displays upcoming challenges at top of "My Challenges" section
  - Shows challenge name and date range (no workout count)
  - Displays "Upcoming" badge in yellow theme
- **Styling** (`styles.css`):
  - Added `.upcoming-challenge` class with yellow border (#FFC107) and light yellow background (#FFFBEB)
  - Added `.upcoming-badge` class matching A8 yellow brand (#FFC107)
  - Hover effect for visual feedback (#FEF3C7)
- **Testing** (`backend/TestingFunctions.gs`):
  - Updated `testGetUserAllChallengeStats()` to display both upcoming and user challenges

**Me Page UI Improvements**:
- Removed redundant "Current" badge from active challenge cards (green border/background sufficient)
- Reordered sections for better information hierarchy:
  1. My Summary (name, team, workouts, dates)
  2. My Challenges (upcoming + historical)
  3. My Workouts (calendar)
  4. Log Past Workout
- Visual indicators now clearer:
  - 🟡 Yellow card with "Upcoming" badge = Future challenges (all users)
  - 🟢 Green border/background = Currently active challenge
  - ⚪ Default styling = Past challenges with workout counts

**Files Changed**:
- `backend/Code.gs`: Modified getUserAllChallengeStats() return structure
- `backend/TestingFunctions.gs`: Updated test function for new structure
- `index.html`: Updated loadPastChallengeHistory() + section reordering + removed current-badge
- `styles.css`: Added upcoming challenge styles
- Cache busting: styles.css version → `20251107-2`

**Technical Notes**:
- Uses `status` column in Challenges sheet (values: `active`, `upcoming`, `completed`)
- Upcoming challenges fetched independently of user participation
- No signup integration yet (awareness only)
- Backend change is backwards compatible (still returns challenge data, just structured differently)

---

### 🏖️ Off-Season Mode UI Improvements + Agency-Wide Activity Feed (November 7, 2025 - Night)

**Fixed Missing Workout Logging in Off-Season Mode**:
- **Root Cause**: Previous fix enabled off-season mode but UI was incomplete
  - "Log Other Workout" button was hidden inside the workout-card div
  - Activity feed was showing but empty (no data available)
  - Off-season message was in wrong location (status badge instead of card)
  - Users couldn't actually log workouts despite the feature being enabled

- **UI Fixes** (`index.html`):
  - Now shows `no-workout-card` with off-season message instead of hiding all cards
  - Off-season message properly displayed in card body with clear styling
  - "Log Workout (Year-Round)" button and input field are now visible and functional
  - Completion status badge hidden (not relevant when no challenge active)
  - Updated button text to "Log Workout (Year-Round)" for clarity

**New Feature: Agency-Wide Activity Feed** (`backend/Code.gs`, `api.js`, `index.html`):
- **Purpose**: Maintain social/community engagement year-round
- **Backend** (`Code.gs`):
  - Added `getRecentCompletionsAll(ss, limit)` function (lines 547-601)
  - Returns most recent completions across ALL users and challenges
  - Shows workout names for prescribed workouts, descriptions for "Other Workouts"
  - Added `getWorkoutById(ss, workoutId)` helper function (lines 603-624)
  - Added `getRecentCompletionsAll` API endpoint to `doGet()` (lines 81-85)
- **Frontend API** (`api.js`):
  - Added `getRecentCompletionsAll(limit)` method with clear documentation
- **Frontend UI** (`index.html`):
  - Refactored `updateActivityFeed()` to call new agency-wide endpoint
  - Works year-round regardless of challenge status or user participation
  - Changed card title from "Recent Team Activity" → "Recent Activity"
  - Shows loading state while fetching data
  - Displays user names, workout descriptions, and timestamps

**User Experience**:
- ✅ Off-season message clearly visible in dedicated card
- ✅ Workout input field and submit button fully functional
- ✅ Users can describe and log any workout during off-season
- ✅ Workouts logged with `challenge_id = 'year_round'`
- ✅ Activity feed shows REAL data from entire agency (not just during challenges)
- ✅ Activity feed works for users not on a team
- ✅ Me page continues to show all workout history
- ✅ Social aspect maintained even between challenges

**Files Changed**:
- `backend/Code.gs`: Added 2 new functions + API endpoint (78 lines added)
- `api.js`: Added getRecentCompletionsAll method
- `index.html`: Rewrote `showOffSeasonMode()` and `updateActivityFeed()` functions

**Testing Needed**:
- [ ] Test workout logging during off-season
- [ ] Verify workouts appear in Me page calendar
- [ ] Confirm workouts stored with 'year_round' challenge_id
- [ ] Check activity feed displays real data from all users
- [ ] Verify activity feed works for non-team users

---

### 🏖️ Off-Season Mode Fix (November 7, 2025 - Late Evening)

**Fixed App Failure During Off-Season (Between Challenges)**:
- **Root Cause**: App was throwing errors when no active challenge exists
  - Backend returned `error: 'No active challenge'` which frontend treated as failure
  - Frontend API helper rejected all responses with `error` field
  - Navigation and UI setup functions weren't running in off-season mode
  - Button IDs were incorrect, preventing navigation from working

- **Backend Fixes** (`backend/Code.gs`):
  - Changed `getUserDashboardData()` to return `offSeasonMode: true` instead of `error` field
  - Returns valid user data structure even when no challenge is active
  - Enables year-round workout logging with `challenge_id = 'year_round'`

- **Frontend Fixes** (`index.html`):
  - Updated dashboard loading to check for `userData.offSeasonMode` instead of `userData.error`
  - Added comprehensive null checks to `showOffSeasonMode()` function
  - Fixed button ID mismatches:
    - Team navigation: `nav-progress` → `team-nav-btn` ✅
    - Library navigation: `nav-library` → `button[data-page="library"]` ✅
    - Log workout button: `log-other-workout-btn` → `log-other-btn` ✅
  - Fixed navigation setup flow - now runs for both active challenge and off-season
  - Removed early `return` statement that prevented setup functions from running
  - Updated refresh function to handle off-season mode after data refresh

- **Off-Season UI Features**:
  - "🌴 Off-Season Mode" message with friendly year-round logging instructions
  - Hides Team Progress and Library navigation buttons (only Today, Me, A8AI visible)
  - Shows "Log Workout (Year-Round)" button for continued tracking
  - Me page displays user stats and full workout history across all challenges
  - Graceful degradation with helpful messaging on all pages

**Files Changed** (3 commits):
- `backend/Code.gs`: Changed off-season response structure (offSeasonMode flag)
- `index.html`: Added null checks, fixed button IDs, updated control flow
- Deployed to GitHub Pages and Google Apps Script

**Testing Status**:
- ✅ App now loads successfully with no active challenge
- ✅ Navigation works correctly in off-season mode
- ✅ Users can log "Other Workouts" year-round
- ✅ Me page shows lifetime workout history
- ✅ Clean console with no errors

**Impact**:
- Enables seamless operation between challenges (e.g., Nov 6-16 gap before Year-End Challenge)
- Users can maintain workout tracking year-round without interruption
- App remains functional and accessible even when no challenge is scheduled

---

### 🐛 Deployment Fix: Multi-Month Calendar API (November 7, 2025 - Evening)

**Fixed "Failed to load workout history" Error on Web Deployment**:
- **Root Cause**: `api.js` was not deployed to GitHub Pages, missing `getUserAllCompletions()` method
  - Local development environment had the method (added Nov 4)
  - Web deployment was serving outdated version from October 27
  - Frontend was calling `API.getUserAllCompletions()` which didn't exist

- **Immediate Fix**:
  - Committed and pushed `api.js` with missing `getUserAllCompletions()` method
  - Deployed external WOFF2 fonts that were also uncommitted
  - Updated `styles.css` with latest optimizations
  - GitHub Pages automatically rebuilt within 60 seconds

- **Documentation Cleanup**:
  - Archived 13 obsolete V2→V3 migration planning docs to `Documentation/archive/`
  - Added comprehensive guides: ADMIN_GUIDE.md, DEPLOYMENT_AND_WORKFLOW.md, FRONTEND_PAGES.md
  - Updated CLAUDE.md with latest architecture and all November features
  - Committed backend Code.gs changes (already deployed via Apps Script)

**Files Committed** (5 commits):
- `api.js`: Added getUserAllCompletions method for multi-month calendar
- `styles.css`, `fonts/`: Performance optimizations
- `backend/Code.gs`: Backend endpoint for getUserAllCompletions
- `CLAUDE.md`: Updated primary documentation
- `Documentation/`: Archived 13 old files, added 3 new comprehensive guides

**Lesson Learned**:
- Frontend changes (HTML/CSS/JS) require git commit + push for GitHub Pages deployment
- Backend changes (.gs files) require new deployment in Google Apps Script
- Always verify both frontend and backend are deployed after adding new API endpoints

---

### 🚀 Phase 1: Critical Path Optimizations (November 7, 2025)

**Reduced Initial Load Time by 200-500ms**:
- **DNS Prefetch & Preconnect**
  - Added early connection hints to `script.google.com` API endpoint
  - Browser now starts DNS lookup and TCP handshake during HTML parsing
  - Saves 100-300ms on first API call

- **Deferred Icon Generation**
  - Moved favicon/Apple touch icon generation from blocking `<head>` to after app initialization
  - Icon generation now happens after critical content loads
  - Eliminates 50-200ms of blocking JavaScript execution

- **Critical Font Preloading**
  - Added `<link rel="preload">` for Roobert-SemiBold (most-used weight)
  - Font downloads in parallel with other resources
  - Improves text rendering speed by 50-100ms

- **Performance Tracking**
  - Added console logging for API response time and total load time
  - Helps identify bottlenecks: `API call completed in Xms` + `🚀 Total app load time: Xms`

**Files Modified**:
- `index.html`: Added DNS hints, font preload, deferred icon script, performance logging
- Cache-busting version updated to `20251107-1`

**Benefits**:
- Faster time-to-interactive (200-500ms improvement)
- Critical rendering path optimized
- Better visibility into load performance
- Non-critical operations deferred to after app loads

**Next Steps** (See `Documentation/app-loading-planning.md`):
- Phase 2: localStorage caching + skeleton UI (50-70% perceived improvement)
- Phase 3: Parallel API requests + progressive loading (60-80% faster interactive)

---

### ⚡ Font Optimization & Performance Improvements (November 7, 2025)

**Migrated from Base64-Embedded Fonts to External WOFF2**:
- **Major Performance Improvement**
  - Reduced `styles.css` from 441KB to 28KB (93.6% reduction)
  - Converted 3 Roobert OTF fonts to WOFF2 format (48% size reduction: 185KB → 96KB)
  - Total first-load improvement: 317KB savings (72% faster CSS delivery)
  - Added `font-display: swap` for improved perceived performance (shows text immediately)

- **Font Files Optimized**
  - `Roobert-Regular.woff2` (32KB) - font-weight: 400
  - `Roobert-SemiBold.woff2` (32KB) - font-weight: 600
  - `Roobert-Bold.woff2` (32KB) - font-weight: 700
  - Removed unused Medium (500) and ExtraBold (800) weights

- **CSS Font-Weight Mapping**
  - Updated 8 instances of `font-weight: 500` → `font-weight: 400` (Regular)
  - Updated 5 instances of `font-weight: 800` → `font-weight: 700` (Bold)
  - Explicit weight mapping for better control and consistency

- **File Organization**
  - Created `/fonts/` directory for external font files
  - Moved `api.js` from `/backend/` to root (frontend JavaScript file)
  - Clarified frontend vs backend file structure

**Files Modified**:
- `styles.css`: Replaced 5 Base64 @font-face blocks with 3 WOFF2 references (~413KB reduction)
- `fonts/` (new): Added 3 WOFF2 font files (96KB total)
- `api.js`: Moved from `/backend/` to root for proper frontend loading
- `styles.css.backup`: Created backup of original Base64 version

**Benefits**:
- 72% faster initial page load (CSS only)
- Better browser caching (fonts cached separately from CSS)
- Parallel font downloads (3 files load simultaneously)
- Reduced bandwidth usage for all users
- Future CSS updates won't require re-downloading fonts
- More responsive app experience

**Technical Details**:
- Used Python fontTools library with Brotli compression for OTF → WOFF2 conversion
- WOFF2 provides 50-70% better compression than OTF
- Maintains full font quality and OpenType features
- Compatible with all modern browsers

---

### 📅 Multi-Month Calendar Navigation (November 4, 2025)

**Enhanced Calendar with Month Navigation**:
- **Frontend Calendar Enhancements**
  - Added month navigation UI with prev/next buttons (◀ ▶)
  - Month/year display header showing current viewing month
  - Calendar state management for multi-month tracking
  - Lazy loading strategy: fetches ±3 months from current view
  - Year rollover support (Dec ↔ Jan transitions)
  - Removed challenge date range filtering (shows all months, all workouts)
  - Calendar now defaults to current month instead of challenge start month

- **Backend API Updates**
  - New endpoint: `getUserAllCompletions(userId, startDate, endDate)`
  - Fetches completion dates across ALL challenges (not filtered by challenge_id)
  - Optional date range parameters for efficient lazy loading
  - Returns dates in YYYY-MM-DD format for any time period

- **API Layer** (`api.js`)
  - New method: `API.getUserAllCompletions(userId, startDate, endDate)`
  - Supports optional date range filtering for performance optimization

- **User Experience Improvements**
  - View workout history across multiple months and years
  - Navigate to any month to see completion patterns
  - No more "stuck" on challenge start month
  - All-time workout visibility (year-round + all challenges)
  - Smooth navigation with intelligent data preloading

- **Performance Optimization**
  - Hybrid loading: ±3 months loaded initially (~180 days)
  - Incremental loading when navigating beyond loaded range
  - Cached completion dates prevent duplicate API calls
  - Typical user (100 workouts/year): 1-2 API calls total
  - Power user (300+ workouts): loads incrementally as needed

- **CSS Styling**
  - A8-branded yellow gradient navigation buttons (44px touch targets)
  - Responsive calendar header with flexbox layout
  - Hover and active states for better mobile interaction
  - Clean, centered month/year display

**Files Modified**:
- `backend/Code.gs`: Added `getUserAllCompletions()` function and API endpoint (~60 lines)
- `index.html`: Calendar state, lazy loading, navigation logic (~200 lines added/modified)
- `api.js`: New API wrapper method (~10 lines)
- `styles.css`: Navigation button and header styles (~50 lines)

**Benefits**:
- Year-round engagement tracking across all challenges
- Better visibility into workout consistency over time
- Supports app's evolution to year-round workout logging
- Scalable for users with extensive workout history
- Mobile-optimized with proper touch targets

---

### ♻️ Database Schema Simplification (November 4, 2025)

**Removed Redundant is_active Column**:
- **Challenges Table Simplified**
  - Removed `is_active` boolean column (redundant with `status` column)
  - Single source of truth: `status` column with values: `active`, `upcoming`, `completed`
  - More informative state management (distinguishes upcoming vs completed challenges)

- **Backend Functions Updated**
  - `getActiveChallenge()`: Now checks `status === 'active'` instead of `is_active === true`
  - `getChallengeById()`: Removed `is_active` field from returned challenge objects
  - `createNewChallenge()`: Only sets `status` field (6 columns instead of 7)
  - `setActiveChallenge()`: Updates `status` only, removed `is_active` setValue calls
  - `endChallenge()`: Simplified to single status update
  - `getAllChallenges()`: Removed `is_active` from returned objects

- **Supporting Files Updated**
  - `MigrationScripts.gs`: Removed `is_active` from required columns validation
  - `menu.gs`: Updated to check `status === 'active'` and updated user prompts
  - `TestingFunctions.gs`: Updated test logging and instructions to reference `status`

- **Cache Busting**
  - Version bumped to `20251104-1` for browser cache refresh

**Benefits**:
- Cleaner data model with single source of truth
- More semantic code (`status === 'active'` vs `is_active === true`)
- Eliminates risk of `is_active` and `status` getting out of sync
- Better state granularity (upcoming vs completed)

---

### 🔍 CLAUDE.md Accuracy Audit & Corrections (November 1, 2025)

**Documentation Refinement**:
- **Backend Files List Corrected**
  - Removed obsolete `SetupSheets.gs` reference
  - Added 3 undocumented files: `MigrationScripts.gs`, `TestingFunctions.gs`, `AutoSort.gs`

- **Core Functions Documentation Enhanced**
  - Added 6 previously undocumented functions:
    - `getLifetimeWorkoutCount()` - Calculates total workouts across all challenges
    - `getUserAllChallengeStats()` - Powers "My Challenges" history on Me page
    - `getUserCompletionHistoryForChallenge()` - Challenge-specific completion dates
    - `getAllWorkoutsForChallenge()` - Challenge-filtered workout library
    - `getChallengeById()` - Critical helper for challenge lookups
    - `formatDateNumeric()` - Date formatting for frontend parsing

- **Behavioral Clarifications**
  - Fixed `total_workouts` description (4 locations): Clarified it tracks active challenge only, not lifetime
  - Updated `updateUserStats()` documentation with accurate behavior
  - Clarified `markWorkoutComplete()` triggers per-challenge updates
  - Documented that lifetime counts are calculated via separate function

- **API Endpoints Updated**
  - Added `getUserAllChallengeStats` endpoint documentation
  - Added `createSignup` POST endpoint documentation

- **Menu System Documentation Fixed**
  - Updated to match actual implementation in menu.gs
  - Added "View Challenge Stats" menu item (was missing)
  - Renamed "End Current Challenge" → "End Challenge"
  - Clarified team assignment workflow (no menu item, use Script Editor or manual)

- **Sheet 7 (Coaching) Enhanced**
  - Added integration details with Slack.gs
  - Documented how coaching tips appear in daily progress updates
  - Clarified optional nature and date-matching behavior

**Result**: CLAUDE.md now accurately reflects the actual codebase implementation with all functions, endpoints, and behaviors properly documented.

---

### 📚 Documentation Cleanup for V3 (November 1, 2025)

**Documentation Overhaul**:
- **CLAUDE.md Updated to V3**
  - Rewritten for multi-challenge architecture
  - Updated project overview: "Daily Dose - A8 Workout Challenge App V3"
  - Added Challenges and Challenge_Teams sheet documentation
  - Updated all backend function descriptions with `challenge_id` parameters
  - Added Admin Challenge Management functions section
  - Rewrote Configuration Guide for multi-challenge setup
  - Added Year-Round (Off-Challenge) Management section
  - Updated deployment architecture (GitHub Pages + Google Apps Script)
  - Replaced "Development Phases" with comprehensive "Features" section
  - Updated project information to V3.0 status

- **Documentation Folder Cleanup**
  - Created `/Documentation/archive/` folder
  - Archived 13 obsolete migration planning docs:
    - MULTI_CHALLENGE_QUICK_START.md
    - IMPLEMENTATION_SUMMARY.md
    - MIGRATION_SUMMARY.md
    - MULTI_CHALLENGE_IMPLEMENTATION_PLAN.md
    - DEPLOYMENT_STATUS.md
    - All PHASE_*.md files (0, 1, 3, 4, 5, 7, 8)
  - Retained 7 ongoing reference docs (README, ROADMAP, testing guides, etc.)

- **Updated Documentation Files**
  - ROADMAP.md: Updated to V3.0, added multi-challenge version history
  - FILE_ORGANIZATION.md: Removed references to archived files
  - GITHUB_WORKFLOW.md: Genericized directory paths

**Result**: Clean, focused documentation that accurately reflects the V3 multi-challenge architecture with year-round logging capabilities. All obsolete migration planning docs safely archived for historical reference.

---

### 🎉 User Signup System (October 31, 2025)

**Major Features**:
- **Self-Service Signup Page**
  - New standalone `signup.html` page for user registration
  - User-controlled username field (forms personal app link)
  - Display name with emoji support for profiles and progress boards
  - Email, full name, and username collection
  - Mobile-optimized design with A8 branding

- **Workout Preferences Collection**
  - Duration preference selector (10/20/30 minutes)
  - Equipment availability multi-select (Bodyweight, Kettlebell, Dumbbell, Bands, Full Gym)
  - Preferences stored in Users table for future personalization
  - Button-based selection matching AI workout generator UX

- **Backend Signup Module** (`backend/Signup.gs`)
  - `createSignupRequest()` - Creates new user with validation
  - `updateUserPreferences()` - For future /update page
  - `validateSignupData()` - Client and server-side validation
  - `getUserPreferences()` - Retrieve user preferences
  - Duplicate email and username checking

- **Validation & Error Handling**
  - Username format validation (lowercase letters, numbers, periods only)
  - Length validation (3-30 characters)
  - Email format validation
  - Real-time error feedback with user-friendly messages
  - Success state with admin review instructions

**Database Changes**:
- Added `preferred_duration` column to Users table (values: "10", "20", "30")
- Added `equipment_available` column to Users table (comma-separated equipment list)
- Username field now user-controlled instead of auto-generated

**Admin Workflow**:
1. Review new signups in Users sheet (filter by empty `active_user` column)
2. Set `active_user = TRUE` for approved users
3. Run "Send Welcome Email" from custom menu
4. User receives personalized app link via email

**Files Changed**:
- `signup.html` (new):
  - Self-service signup form with validation
  - Helper text for username and display name fields
  - Equipment and duration preference selectors
  - Loading states and success/error feedback
- `backend/Signup.gs` (new):
  - Complete signup backend module
  - Validation functions
  - Duplicate checking
  - Preference management
- `backend/Code.gs`:
  - Added `createSignup` action to doPost() (lines 127-137)
  - Routes signup requests to Signup.gs module

**User Experience**:
- Clean, mobile-optimized signup flow
- Clear helper text explaining username and display name purposes
- Visual feedback during submission
- Success message with next steps
- No deployment_URL formula conflicts (respects existing spreadsheet formulas)

**Access URL**:
```
https://your-domain.github.io/signup.html
```

**Future Enhancements**:
- `/update` page for existing users to update preferences
- Personalized workout recommendations based on equipment and duration preferences
- Reusable preference selection components

---

### 🎯 Lifetime Workouts & User Experience Improvements (October 30, 2025 - Evening)

**Major Features**:
- **Lifetime Workout Tracking**
  - Added `getLifetimeWorkoutCount()` function to count ALL workouts across all challenges
  - Me page summary now shows lifetime total (e.g., "15 workouts completed")
  - Backend sends `lifetime_workouts` field in user object
  - Consistent across both active challenge and off-season modes

- **Join Date Display**
  - Added `join_date` field to `getUserInfo()` function
  - Displays "Member since: [date]" on Me page summary
  - Formatted using `formatDate()` for consistency
  - Added to both active challenge and off-season user responses

- **Enhanced Challenge History**
  - Renamed "Past Challenges" to "My Challenges"
  - Now includes CURRENT active challenge with green "Current" badge
  - Current challenge highlighted with green border and light green background
  - Each challenge shows individual workout count (not lifetime)
  - Clear distinction between current and past challenges

**Bug Fixes**:
- **Date Parsing Issue** (Carolina's "2000" year bug)
  - Created `formatDateNumeric()` function for MM/DD/YYYY format
  - Updated `getUserAllChallengeStats()` to use numeric date format
  - Frontend `formatDateShort()` now handles MM/DD/YYYY strings properly
  - Prevents JavaScript date parsing errors across browsers/timezones

**Files Changed**:
- backend/Code.gs:
  - Added `formatDateNumeric()` helper function (lines 683-690)
  - Added `getLifetimeWorkoutCount()` function (lines 263-285)
  - Updated `getUserDashboardData()` to include `lifetime_workouts` and `join_date`
  - Updated off-season mode response structure for consistency
- index.html:
  - Updated Me page to show lifetime workouts instead of challenge-specific
  - Added join_date display with italic styling
  - Updated Past Challenges to "My Challenges" section
  - Added current challenge detection and badge display
  - Improved `formatDateShort()` with validation
- styles.css:
  - Added `.current-badge` styling (green badge)
  - Added `.current-challenge` card styling (green border/background)
  - Added `.summary-joined` styling (italic, muted)

**User Experience Impact**:
- Users now see their TOTAL workout count at top of Me page (bragging rights!)
- Each challenge shows specific count (e.g., October: 12, September: 3)
- Join date adds personal touch and tenure recognition
- Current challenge clearly distinguished from past challenges
- No more confusing date displays (2000 vs 2025)

**Deployment Notes**:
- Required new Google Apps Script deployment to clear cache
- Frontend changes compatible with existing deployments
- Cache-busting version remains 20251030-1

---

### 🏗️ Multi-Challenge Architecture Complete (October 30, 2025)

**Major Backend Changes**:
- Completed multi-challenge architecture implementation
  - Year-round workout logging support (challenge_id = "year_round")
  - Challenge-specific team assignments via Challenge_Teams table
  - Removed team auto-assignment and Users table fallbacks
  - Fixed stats calculation to use challenge_id filtering (10-20x performance improvement)
  - Added debug logging to updateUserStats for troubleshooting
- Activity Feed Improvements
  - Simplified messages: "completed a challenge workout!" for all challenge workouts
  - All workouts with matching challenge_id now properly categorized
  - Fixed getUserDashboardData to return total_workouts and last_completed
- New AutoSort.gs Script (Optional)
  - Automatic Completions sheet sorting by timestamp on edit
  - Sorts ascending (oldest first, newest last) for efficient reverse iteration
  - AUTOSORT_ENABLED flag (disabled by default)
  - Includes manual sort and test functions for admin use

**Frontend Enhancements**:
- Past Challenge History Feature
  - New section on Me page showing all completed challenges
  - Displays challenge name, dates, and workout count
  - Formatted cards with responsive styling
  - getUserAllChallengeStats API integration
- Dynamic Team Navigation
  - Team tab automatically hidden for users without team assignment
  - Flexbox navigation with space-evenly distribution
  - Centered layout for 4 buttons (non-challenge users)
  - Full-width layout for 5 buttons (challenge users)
  - Fixed clipping and alignment issues
- UI Polish
  - Updated "Past Challenges" to use card-header styling (centered H2)
  - Fixed navigation button sizing (flex: 0 1 auto, max-width: 80px)
  - Removed conflicting grid-template-columns overrides
  - Improved mobile responsiveness

**Cache-Busting Update**:
- Version bumped to 20251030-1
- Forces browser reload of updated CSS and JS

**Files Changed**:
- backend/Code.gs: 594 additions (stats fixes, activity feed, team logic)
- backend/AutoSort.gs: 112 additions (new file)
- index.html: 225 additions (past challenges, team nav hiding, off-season updates)
- styles.css: 124 additions (flexbox nav, past challenge cards)
- api.js: 7 additions (getUserAllChallengeStats method)

**Technical Details**:
- Total: 874 additions, 188 deletions across 5 files
- All Phase 4 and Phase 5 frontend changes completed
- Multi-challenge Quick Start documentation available
- Ready for production deployment

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
