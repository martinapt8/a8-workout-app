# A8 Workout Challenge App

## Current Status (Latest Update - November 20, 2025)

### 🐛 Fix: Hide Signup Button When Deadline Passed (November 20, 2025)

**Fixed signups viewer to hide signup button when challenge deadline has passed**:

- **User Report**: The signups viewer page (`signups.html`) was showing the "Join This Challenge" button even after the signup deadline had passed, misleading users into starting the signup process only to be rejected.
- **Root Cause #1**: The `getChallengeById()` helper function in `backend/Code.gs` (lines 1426-1452) was missing the `signup_deadline` field in its return object, causing the API to return `null` for deadlines.
- **Root Cause #2**: Frontend had no logic to check deadline and conditionally show/hide signup button.
- **The Fix**:
  - **Backend** (`backend/Code.gs:1447`):
    - Added `signup_deadline: data[i][headerMap['signup_deadline']]` to `getChallengeById()` return object
    - Now properly exposes deadline via `getChallengeSignups` API endpoint
  - **Frontend** (`signups.html:414-448`):
    - Added `checkSignupDeadlinePassed()` function that parses deadline (MM/DD/YYYY format)
    - Creates deadline timestamp at 23:59:59 (end of day) matching backend validation
    - Compares current time to deadline to determine if signups are closed
    - Safely handles missing deadlines (returns `false` = always open)
  - **UI Updates** (`signups.html:365-381, 498-516`):
    - Added "Signups for this challenge have closed" message with gray styling
    - Conditionally shows signup button (open) OR closed message (past deadline)
    - Button hidden completely when deadline passed, not just disabled
- **User Impact**:
  - ✅ Users see "Signups closed" message after deadline instead of being able to click button
  - ✅ Prevents confusion and wasted clicks on expired signup links
  - ✅ Matches backend validation behavior (23:59:59 end-of-day logic)
  - ✅ No deadline = signup button always shows (graceful fallback)

**Files Changed**:
- `backend/Code.gs`: Added `signup_deadline` field to `getChallengeById()` function (1 line)
- `signups.html`: Added deadline check logic, closed message UI, and conditional rendering (68 lines)

---

### 🐛 Fix: Signup Deadline Date Comparison (November 19, 2025)

**Fixed signup deadline logic to allow signups through the entire deadline date**:

- **User Report**: Setting `signup_deadline = 11/19/2025` was blocking signups on Nov 19 itself, requiring admins to set the deadline to Nov 20 to allow signups on Nov 19 (unintuitive).
- **Root Cause**: The `getChallengeInfo()` function in `backend/Signup.gs` (lines 561-571) was comparing datetime objects (`nowInAppTz > deadlineDate`), but the deadline date defaulted to midnight (00:00:00), so any time after midnight on the deadline date was considered "past deadline."
- **The Fix** (`backend/Signup.gs:561-576`):
  - Changed from datetime comparison to date-only comparison
  - Format both current date and deadline date as `'yyyy-MM-dd'` strings
  - Compare strings: `if (nowDateString > deadlineDateString)`
  - Added explanatory comment about date-only comparison
- **User Impact**:
  - ✅ `signup_deadline = 11/19/2025` now allows signups all day on Nov 19 (12:00 AM - 11:59 PM)
  - ✅ Starting Nov 20, signups are correctly blocked
  - ✅ Intuitive behavior matches how deadline date displays to users
  - ✅ No need to set deadline "one day later" anymore

**Files Changed**:
- `backend/Signup.gs`: Updated date comparison logic in `getChallengeInfo()` (lines 561-576)

---

### 🧹 Remove `last_completed` Update Code (November 19, 2025)

**Cleaned up redundant field initialization after implementing formula-based calculation**:

- **Background**: The `last_completed` column in the Users sheet now uses a formula (`=MAXIFS(Completions!A:A, Completions!B:B, A2)`) to automatically calculate the most recent workout date from the Completions table. This eliminates the need for manual updates during workout logging.
- **Problem**: Code was still initializing this field to an empty string when creating new users, which could interfere with formula execution.
- **The Fix** (`backend/Signup.gs`):
  - Removed `last_completed` initialization in `createSignupRequest()` function (lines 140-142)
  - Removed `last_completed` initialization in `createChallengeSignup()` function (lines 855-857)
  - Left column index lookup code intact (harmless, may be used for reading)
- **User Impact**:
  - ✅ New user signups no longer write to `last_completed` column
  - ✅ Formula automatically populates field when users log their first workout
  - ✅ No risk of overwriting formula-calculated values
  - ✅ Existing read code in `Code.gs` continues to work correctly
- **Note**: The `FormMigration.gs` file also initializes `last_completed` but was not modified as it will eventually be sunset.

**Files Changed**:
- `backend/Signup.gs`: Removed two instances of `last_completed = ''` initialization (6 lines removed)

---

### 🐛 Critical Fix: Challenge Attribution & Backfill Logic (November 19, 2025)

**Fixed TWO critical bugs in workout logging that caused incorrect challenge_id assignment**:

#### Bug #1: Non-Challenge Users Getting Challenge_ID
- **User Report**: A user who had NOT signed up for the active challenge logged a workout, and it incorrectly received the active challenge_id in the Completions sheet, making it count toward the challenge goal.
- **Root Cause**: The `markWorkoutComplete()` function (backend/Code.gs:926-1035) was assigning the active challenge_id to ALL users who logged workouts, without checking if they were registered in the Challenge_Teams sheet.
- **The Fix** (`backend/Code.gs:969-982`):
  - Added Challenge_Teams membership check before assigning challenge_id
  - Only users found in Challenge_Teams for a challenge get that challenge's ID
  - Non-participants get `challenge_id = null` (year-round workouts)
  - Applies to ALL workout types (prescribed, AI, Other)
- **User Impact**:
  - ✅ Non-challenge users can log workouts year-round without affecting challenge goals
  - ✅ Challenge goals now only count actual participants' workouts
  - ✅ Team progress calculations are accurate
  - ✅ Data integrity maintained for challenge analytics

#### Bug #2: Backfilled Workouts Using Wrong Challenge
- **Discovery**: When investigating Bug #1, discovered that backfilled workouts were assigned to the CURRENT active challenge instead of the challenge that was active on the TARGET DATE.
- **Example Scenario**:
  - December Challenge ends (status='completed')
  - January Challenge starts (status='active')
  - User tries to backfill a Dec 15 workout
  - **BUG**: Workout gets `challenge_id = jan_2026` instead of `dec_2025`
- **Root Cause**: `markWorkoutComplete()` only called `getActiveChallenge()` (returns current active challenge), not checking which challenge was active on the completion date.
- **The Fix**:
  - **NEW function** `getChallengeActiveOnDate(ss, targetDate)` (backend/Code.gs:1361-1403)
    - Searches Challenges sheet for challenge where `start_date <= targetDate <= end_date`
    - Returns the historical challenge regardless of current status
  - **Updated** `markWorkoutComplete()` (backend/Code.gs:957-967)
    - Backfills: Use `getChallengeActiveOnDate()` to find challenge active on target date
    - Current day: Use `getActiveChallenge()` for currently active challenge
    - Check Challenge_Teams membership for the RELEVANT challenge (not always current)
  - **Fixed** duplicate detection logic (backend/Code.gs:984-996)
    - Moved duplicate checks AFTER challenge determination
    - Uses correct challenge_id for validation
- **User Impact**:
  - ✅ Backfilled workouts correctly attributed to historical challenges
  - ✅ Team assignments use correct challenge's teams
  - ✅ Challenge analytics remain accurate across challenge transitions
  - ✅ Duplicate detection works correctly for past challenges

#### Bug #3: Non-Challenge Users Couldn't Log Prescribed Workouts
- **Discovery**: After fixing Bug #1, non-challenge users got "No active workout today" error when trying to log prescribed workouts.
- **Root Cause**: `getActiveWorkout(ss, challengeId)` returns `null` when `challengeId = null`, blocking non-participants from accessing prescribed workouts.
- **The Fix** (`backend/Code.gs:1011-1019`):
  - Separated "lookup challenge" (for finding workout) from "storage challenge" (for attribution)
  - Use `relevantChallenge.challenge_id` to find prescribed workout
  - Still store with user's actual `challengeId` (null for non-participants)
- **User Impact**:
  - ✅ Non-challenge users can complete prescribed workouts
  - ✅ Their workouts don't count toward challenge goals (`challenge_id = null`)
  - ✅ Year-round engagement maintained for all users
  - ✅ Consistent UX - everyone sees same "Today's Workout"

**Technical Details**:
- Challenge participants: `challengeId = active_challenge_id`, counts toward goal
- Non-participants: `challengeId = null`, doesn't count toward goal
- Backfills: `challengeId` determined by target date's challenge, not current challenge
- Prescribed workouts accessible to all users during active challenges

**Files Changed**:
- `backend/Code.gs`:
  - NEW: `getChallengeActiveOnDate()` function (lines 1361-1403)
  - UPDATED: `markWorkoutComplete()` - date-aware challenge lookup, Challenge_Teams validation, fixed workout lookup (lines 926-1035)
- `Documentation/BACKEND.md`: Documented new function and updated `markWorkoutComplete()` logic
- `CHANGELOG.md`: Added this entry

---

### 🐛 Fix: Registered Challenges Not Showing Without Workouts (November 19, 2025)

**Fixed bug where user's registered challenges wouldn't appear in "My Challenges" until they logged their first workout**:

- **User Report**: User carolina signed up for the October Challenge, showing up correctly in Challenge_Teams with Team Curl Power, but the challenge didn't appear on her "Me" page until after logging a workout.
- **Root Cause**: The `getUserAllChallengeStats()` function (backend/Code.gs:1560-1659) was only checking the Completions sheet to build the list of user's challenges. If a user signed up but hadn't completed any workouts yet, their challenge wouldn't appear in the list.
- **The Fix** (`backend/Code.gs`):
  - Added secondary lookup to Challenge_Teams sheet (lines 1589-1614)
  - Now checks both Completions (for workout counts) AND Challenge_Teams (for registrations)
  - If user is in Challenge_Teams but has 0 workouts, challenge now appears with `workout_count: 0`
  - Team name and color still correctly pulled from `getUserTeamForChallenge()`
- **User Impact**:
  - ✅ Registered challenges now appear on "Me" page immediately after signup
  - ✅ Users can see they're part of a team even before logging first workout
  - ✅ Workout count displays as "0 workouts" until they complete their first one
  - ✅ Maintains correct team assignments and challenge details

**Files Changed**:
- `backend/Code.gs`: Modified `getUserAllChallengeStats()` to include Challenge_Teams lookup
- `Documentation/BACKEND.md`: Updated function documentation with new data sources
- `CHANGELOG.md`: Added this entry

---

### 🗑️ Remove Redundant `total_workouts` Column (November 19, 2025)

**Simplified backend by removing unused `total_workouts` column from Users table**:
- **Root Cause**: The `total_workouts` column in the Users sheet was being calculated and stored but **never displayed anywhere** in the frontend. All workout counts are calculated on-demand from the Completions sheet, making this column redundant.
- **Analysis**:
  - Frontend "Me" page displays `lifetime_workouts` (calculated from Completions)
  - Team totals use Completions sheet directly
  - Past challenges use Completions sheet directly via `getUserAllChallengeStats()`
  - The `total_workouts` column was only meant to cache "active challenge workout count" but was never used
- **The Fix**:
  - ✅ Removed `total_workouts` field from API responses in `getUserDashboardData()`
  - ✅ Removed `updateUserStats()` function (67 lines) that calculated and stored `total_workouts`
  - ✅ Removed call to `updateUserStats()` in `markWorkoutComplete()`
  - ✅ Removed `resetAllUserStats()` admin function (14 lines)
  - ✅ Removed `total_workouts` from `getUserInfo()` return object
  - ✅ Updated CLAUDE.md documentation to reflect changes
- **Benefits**:
  - **Simpler codebase**: Removed 80+ lines of unnecessary code
  - **Fewer bugs**: No more potential sync issues between cached and calculated counts
  - **Single source of truth**: All workout counts come from Completions sheet
  - **Better performance**: No extra writes to Users sheet on every workout completion
  - **Future-proof**: If Completions table grows large, we can add back strategic caching with proper indexing
- **Note**: The `total_workouts` column can remain in the Users sheet without causing issues (it will just be ignored). Admins can delete the column manually if desired, or leave it for historical reference.

**Files Changed**:
- `backend/Code.gs`: Removed `updateUserStats()`, `resetAllUserStats()`, removed `total_workouts` from API responses
- `CLAUDE.md`: Updated Users table schema, removed `total_workouts` references, updated email token documentation

---

### 🐛 Critical Duplicate Function Bugs Fix (November 18, 2025)

**Fixed TWO critical bugs caused by duplicate function definitions in EmailCampaigns.gs**:

#### Bug #1: Team Display Bug (Fixed Earlier Today)
- **Root Cause**: A duplicate, incomplete version of the `getUserTeamForChallenge()` function existed in `backend/EmailCampaigns.gs`. This conflicted with the correct version in `backend/Code.gs`, causing the Google Apps Script runtime to execute the wrong function and return `null` for team data, even when the data was correct in the `Challenge_Teams` sheet.
- **The Fix** (`backend/EmailCampaigns.gs`):
  - Removed the entire duplicate `getUserTeamForChallenge()` function block from `backend/EmailCampaigns.gs`.
  - This eliminates the function name collision, ensuring the correct, fully-featured function from `Code.gs` is always executed.
- **User Impact**:
  - ✅ Team Progress page is now visible for all users assigned to a team.
  - ✅ User's team name and color now correctly appear on the "Me" page and in the API response.
  - ✅ "My Team's Workouts" section now correctly displays team members and their stats.

#### Bug #2: Workout Count Bug (NEWLY DISCOVERED & FIXED)
- **Root Cause**: A duplicate `getLifetimeWorkoutCount()` function existed in `backend/EmailCampaigns.gs` with a DIFFERENT function signature than the correct version in `backend/Code.gs`:
  - **Code.gs** (correct): `getLifetimeWorkoutCount(ss, userId)` - takes TWO parameters
  - **EmailCampaigns.gs** (duplicate): `getLifetimeWorkoutCount(userId)` - takes ONE parameter
  - When Code.gs called `getLifetimeWorkoutCount(ss, userId)`, Google Apps Script was unpredictably executing the EmailCampaigns.gs version, causing `ss` to be treated as `userId` and `userId` to be undefined, resulting in zero workout counts for all users.
- **The Fix** (`backend/EmailCampaigns.gs`):
  - Removed the entire duplicate `getLifetimeWorkoutCount()` function block (lines 379-407).
  - Updated the ONE remaining call to `getLifetimeWorkoutCount()` in EmailCampaigns.gs (line 250) to pass the `ss` parameter correctly.
  - This eliminates the function signature conflict, ensuring the correct version from Code.gs is always executed.
- **User Impact**:
  - ✅ `total_workouts` in Users sheet now updates correctly when logging workouts (was incorrectly showing 1 or 0).
  - ✅ Lifetime workout counts now display correctly on the "Me" page (was showing zero for all users).
  - ✅ Challenge-specific workout counts now calculate correctly.
  - ✅ All existing data is intact - this was a calculation bug, not a data corruption issue.

**Files Changed**:
- `backend/EmailCampaigns.gs`: Removed TWO conflicting duplicate functions (`getUserTeamForChallenge`, `getLifetimeWorkoutCount`), updated function call to use correct signature.

---

### 🎨 Admin Dashboard Sidebar Navigation (November 18, 2025)

**Session 5 Complete: Redesigned Admin Interface with Fixed Sidebar**:
- **Purpose**: Replace top navigation with professional sidebar layout for better scalability and desktop UX
- **Design Changes** (`admin/admin-styles.css`):
  - **Fixed Left Sidebar** (250px width):
    - Black background (#000000) matching A8 brand
    - Full-height with vertical scrolling for many menu items
    - Z-index 200 (above all content)
    - Daily Dose logo (48px) at top with yellow "Daily Dose" text
  - **Hierarchical Menu Structure**:
    - Parent items: Uppercase, 0.875rem, bold, non-clickable labels
    - Child items: Indented (2.5rem left padding), 0.875rem, clickable links
    - Yellow accent (#FFC107) on hover/active states
    - Smooth hover transition: 0.25rem left slide on child items
  - **Three Menu Sections**:
    - **Admin**: Admin Home, View Main App, User Management (WIP), Reporting (WIP)
    - **Comms**: Send Emails, Send Slack Updates (WIP)
    - **Google Admin**: Open Google Sheets, Open Apps Script Editor
  - **Disabled State Styling**:
    - Gray color (#6B7280), reduced opacity (0.6)
    - "(WIP)" suffix auto-added via CSS `::after`
    - `cursor: not-allowed` for clear feedback
  - **Main Container Adjustment**:
    - Added 250px left margin to account for sidebar
    - Content starts immediately below header (no gap)
- **Removed Sticky Header**:
  - Eliminated redundant header entirely from both admin pages
  - Removed all header CSS classes (`.admin-header`, `.header-content`, etc.)
  - Cleaner, more spacious layout with full vertical real estate
- **HTML Updates** (`admin/index.html`, `admin/email-campaigns.html`):
  - Added `<aside class="admin-sidebar">` with navigation menu
  - Sidebar brand with Daily Dose logo and text
  - Three `<ul>` sections with parent/child menu items
  - Active states on current page (index.html: "Admin Home" active, email-campaigns.html: "Send Emails" active)
  - Removed header section entirely
  - Removed "Quick Links" section (functionality moved to sidebar)
- **Logo Update**:
  - Switched from SVG to PNG (`daily_dose_logo_sm.png`) for better visibility
  - 108KB PNG with proper transparency for black background
  - Increased logo size from 32px to 48px for prominence
- **Navigation UX Improvements**:
  - Unified menu structure: ALL parent items non-clickable, ALL actions in children
  - Consistent pattern across all three sections
  - "Admin Home" child item links to dashboard (index.html)
  - "View Main App" opens user's personal app (`?user=mritty85`)
  - External links open in new tab (Google Sheets, Apps Script)

**Key Benefits**:
- **Desktop-Focused**: Better suited for admin workflows (mobile not a priority)
- **Scalable**: Easy to add new sections and tools as dashboard grows
- **Professional**: Matches SaaS admin interface conventions
- **Consistent**: All parent items work the same way (non-clickable labels)
- **Clear Hierarchy**: Visual distinction between sections and actions
- **Accessible**: Large click targets, clear hover states, keyboard navigable

**Files Changed** (4 commits):
- `admin/admin-styles.css`: Added sidebar styles, removed header styles (~150 lines changed)
- `admin/index.html`: Added sidebar, removed header and Quick Links (~50 lines changed)
- `admin/email-campaigns.html`: Added sidebar, removed header (~45 lines changed)

**Deployment**:
- GitHub Pages: `https://martinapt8.github.io/a8-workout-app/admin/`
- All changes live and functional on production
- No backend changes required

**Technical Notes**:
- Sidebar uses semantic HTML (`<aside>`, `<nav>`, `<ul>`, `<li>`)
- CSS custom properties for consistent colors and spacing
- Flexbox for brand section, list-style-none for clean menus
- Transition animations for smooth hover effects
- Fixed positioning ensures sidebar always visible while scrolling

---

### ✏️ WYSIWYG Email Editor Enhancement (November 18, 2025)

**Session 4 Complete: Rich Text Email Editor with Auto-Generated Plain Text**:
- **Purpose**: Replace dual HTML/plain text editing with single WYSIWYG editor for easier email template creation
- **Frontend Changes** (`admin/email-campaigns.html` - ENHANCED):
  - **Quill.js Integration** (v1.3.7 via CDN):
    - Added Quill Snow theme CSS and JavaScript
    - Replaced dual textareas with single rich text editor
    - Email-appropriate toolbar: headers, bold, italic, underline, lists, links
    - Mobile-responsive with 400px minimum height
  - **Custom Token System**:
    - Created `TokenBlot` class extending Quill's Inline blot
    - Tokens render as non-editable yellow chips (A8 brand color #FFC107)
    - `contenteditable="false"` prevents accidental token modification
    - Atomic deletion with single backspace
    - Visual hover effect (lighter yellow #FFD54F)
  - **Token Insertion UI**:
    - Changed token buttons from "copy to clipboard" → "insert into editor"
    - `insertToken(tokenName)` function inserts token at cursor position
    - Toast notification confirms insertion: "Inserted [token_name]"
    - Auto-focuses editor if no selection exists
  - **HTML-to-Plain-Text Converter**:
    - `convertHtmlToPlainText(html)` function with intelligent conversion
    - Preserves token bracket syntax: `<span class="token-chip">` → `[token_name]`
    - Converts links: `<a href="url">text</a>` → `text (url)`
    - Converts lists: `<li>` → `\n• `
    - Converts headings with extra line breaks for emphasis
    - Strips HTML tags, decodes entities, normalizes whitespace
    - Max 2 consecutive line breaks for clean output
  - **Auto-Update on Type**:
    - Quill `text-change` event listener auto-generates plain text
    - Hidden field stores plain text for API submission
    - Real-time synchronization between HTML and plain text
  - **Template Management Updates**:
    - `createNewTemplate()`: Clears Quill editor with `setContents([])`
    - `loadSelectedTemplate()`: Loads HTML with `dangerouslyPasteHTML()`
    - `saveTemplate()`: Gets HTML from `quill.root.innerHTML`
    - Validation: Checks for empty editor (`<p><br></p>`)
  - **Preview Function Updated**:
    - Gets current HTML from Quill instead of textarea
    - Auto-generates plain text for preview modal
    - Temp template creation for unsaved previews
- **Styling** (`admin/admin-styles.css` - ENHANCED):
  - `.token-chip` class: Yellow background, black text, 2px-8px padding
  - Non-editable styling: `user-select: none`, `cursor: pointer`
  - Hover effect for visual feedback
  - Inline-block display with 4px border radius
  - Matches A8 brand identity
- **Documentation** (`CLAUDE.md` - UPDATED):
  - Updated admin dashboard features to mention WYSIWYG editor
  - Enhanced "Send Email Campaign" workflow with rich text instructions
  - Updated file sizes: email-campaigns.html (36KB → 41KB), admin-styles.css (14KB → 15KB)
  - Version bump: 3.1 → 3.1.1
  - Added Quill.js to feature descriptions

**Key Benefits**:
- **80% Reduction in Admin Effort**: No more dual HTML/plain text editing
- **Zero HTML Knowledge Required**: Visual formatting with toolbar buttons
- **Improved Consistency**: Plain text always matches HTML content
- **Better UX**: Live formatting preview, non-editable tokens prevent errors
- **Email Deliverability**: Auto-generated plain text ensures proper fallback
- **Backward Compatible**: Existing templates load perfectly into Quill editor

**Technical Implementation**:
- **No Backend Changes**: `EmailCampaigns.gs` unchanged, Email_Templates sheet structure identical
- **Pure Client-Side**: Quill.js runs entirely in browser via CDN
- **GitHub Pages Compatible**: No build process, static files only
- **Token Preservation**: Regex-based conversion maintains all token syntax

**User Workflow (Before vs After)**:
- **Before**:
  - ❌ Type HTML: `<p>Hi <strong>[display_name]</strong>...</p>`
  - ❌ Type plain text: `Hi [display_name]...`
  - ❌ Manually keep both versions synchronized
  - ❌ Requires HTML expertise
- **After**:
  - ✅ Use toolbar: Bold, Italic, Lists, Links
  - ✅ Click "Insert Token" buttons for personalization
  - ✅ Plain text auto-generated on save
  - ✅ Visual token chips prevent accidental edits

**Testing**:
- ✅ Token insertion creates yellow chips
- ✅ HTML-to-plain-text converter preserves tokens
- ✅ Existing templates load correctly
- ✅ Preview shows formatted content with replaced tokens
- ✅ Save/load workflow maintains backward compatibility

**Deployment**:
- GitHub Pages: `https://martinapt8.github.io/a8-workout-app/admin/email-campaigns.html`
- CDN Dependencies: Quill.js 1.3.7 (CSS + JS)
- No Apps Script deployment needed

---

### 📊 Challenge Signup Dashboard (November 18, 2025)

**Session 3 Complete: Public Challenge Signup Viewer**:
- **Purpose**: Shareable page showing who's signed up for a challenge, with team assignments and signup link
- **Frontend** (`signups.html` - 1 NEW FILE):
  - Public page accessible via `?challenge=dd_dec2025` URL parameter
  - Mobile-responsive design matching main app styling (A8 black/yellow brand)
  - No authentication required - shareable with entire agency
- **Features**:
  - **Challenge Header**:
    - Challenge name, date range, total goal, signup deadline
    - Prominent "Join This Challenge" button with dynamic signup URL
    - Button automatically appends correct challenge ID
  - **Live Stats Cards**:
    - Total Signups count
    - Assigned to Teams count
    - Unassigned count
  - **Grouped Team Display**:
    - Teams shown alphabetically with color indicators
    - Member count badge per team
    - Team members displayed with display_name and full_name
    - "Unassigned" section for signups without team assignments
    - Yellow badge for unassigned users
  - **Future-Proof Design**:
    - Automatically handles unassigned → assigned transition
    - No code changes needed when teams are assigned via TeamPlaceholders.gs
    - Team colors appear automatically when populated
  - **Error Handling**:
    - Missing challenge parameter validation
    - Challenge not found handling
    - Empty state when no signups exist
    - Loading spinner during data fetch
- **Backend** (`backend/Code.gs`):
  - **New API Function**: `getChallengeSignups(ss, challengeId)`
    - Joins Challenge_Teams sheet with Users sheet
    - Returns challenge details + array of signups
    - Includes: user_id, display_name, full_name, team_name, team_color
    - Sorts by team (alphabetically), then display name
    - Unassigned users (null team_name) appear last
  - **New API Endpoint**: `getChallengeSignups` (GET)
    - URL: `?action=getChallengeSignups&challengeId=dd_dec2025`
    - Returns: `{ challenge: {...}, signups: [...] }`
- **Privacy Enhancement**:
  - Display full_name instead of user_id for better recognition
  - Fallback to "Name not provided" if full_name missing
  - User IDs kept private (not displayed on public page)

**Bug Fixes During Session 3**:
- ✅ **API_URL not defined**: Fixed reference from `API_URL` to `CONFIG.API_URL` in signups.html

**Use Cases**:
- Share signup dashboard with entire agency to see who's participating
- Users can verify their own signup status
- Admins can see signup counts before assigning teams
- One-click signup via "Join This Challenge" button
- Works for any challenge (past, present, future) via URL parameter

**Deployment**:
- GitHub Pages: `https://martinapt8.github.io/a8-workout-app/signups.html?challenge=dd_dec2025`
- Example URL: Replace `dd_dec2025` with any challenge_id from Challenges sheet

**Related Features**:
- Works with `signup_challenge.html` (users sign up)
- Works with `TeamPlaceholders.gs` (admin assigns teams)
- Works with `Challenge_Teams` sheet (tracks assignments)

---

### 🎨 Email Campaign System - Admin Dashboard Frontend (November 18, 2025)

**Session 2 Complete: Full-Featured Admin Dashboard for Email Campaign Management**:
- **Purpose**: Web-based interface for creating, previewing, and sending email campaigns
- **Frontend** (`admin/` directory - 5 NEW FILES):
  - `admin/index.html` (9.9KB): Dashboard home with live stats, navigation, quick links
  - `admin/email-campaigns.html` (36KB): Complete email campaign composer interface
  - `admin/admin-styles.css` (14KB): A8-branded design system (responsive, mobile-first)
  - `admin/admin-api.js` (5.8KB): API wrapper for all campaign endpoints
  - `admin/admin-config.js` (880B): API URL configuration
- **Dashboard Home Features**:
  - Live stats: Total active users, active challenge info, total workouts, last updated
  - Navigation: Dashboard, Email Campaigns, View App
  - Quick links to Google Sheets, Apps Script, main app, signup page
  - Placeholder cards for future features (User Management, Analytics)
- **Email Campaign Manager Features**:
  - **Template Management**:
    - Create, load, edit, save, delete email templates
    - Template dropdown populated from Email_Templates sheet
    - Template ID auto-validation (lowercase, no spaces)
    - Dual save/delete buttons with confirmation
  - **Email Editor**:
    - Three-field editor: Subject Line, HTML Body, Plain Text Body
    - Monospace font for code-friendly editing
    - Token helper panel with 10+ clickable tokens
    - Copy-to-clipboard functionality for all tokens
    - Organized by category: User, Challenge, Team tokens
  - **Live Preview System**:
    - Modal preview with user selection dropdown
    - Challenge selection for challenge-specific tokens
    - Shows rendered subject, HTML body, and plain text
    - Real data replacement for accurate preview
  - **Targeting & Send**:
    - Three targeting modes with radio buttons:
      1. All Active Users
      2. Challenge-Based (with dropdown + checkbox for non-participants)
      3. Custom User List (comma-separated IDs)
    - Preview Recipients button shows exact user list before sending
    - Recipient count and details table
    - Optional tracking flag (prevents duplicate sends)
    - Large "Send Email Campaign" button with confirmation modal
    - Send results display: Sent count, Skipped count, Error count
  - **Token Helper**:
    - User Tokens: [display_name], [deployment_URL], [lifetime_workouts]
    - Challenge Tokens: [challenge_name], [challenge_start_date], [challenge_end_date], [days_remaining], [total_workouts]
    - Team Tokens: [team_name], [team_total_workouts]
    - Tooltips with example values
    - One-click copy to clipboard
    - Sticky panel on desktop, stacks on mobile
- **Design System**:
  - A8 brand colors: Black (#000000), Yellow (#FFC107), White (#FFFFFF)
  - Roobert font family (Regular, SemiBold, Bold)
  - Mobile-responsive breakpoints
  - Cards, buttons, forms, modals, tables, alerts, toasts
  - Loading overlays and spinners
  - Smooth animations and transitions
- **Backend Enhancements** (`backend/Code.gs`):
  - Added missing GET endpoints for dashboard:
    - `getActiveUsersCount`: Returns count of active users
    - `getActiveChallenge`: Returns active challenge object
    - `getAllChallenges`: Returns all challenges for dropdowns
    - `getActiveUsers`: Returns all active users for preview
  - Fixed API response wrapping:
    - `getEmailTemplates`: Returns `{ templates: [...] }`
    - `getTemplateById`: Returns `{ template: {...} }`
    - `getTargetedUsers`: Returns `{ users: [...] }`
    - `sendEmailCampaign`: Returns `{ success: true, sent, skipped, errors, details }`
  - Resolved function name collision:
    - Renamed `getChallengeById` in EmailCampaigns.gs to `getEmailCampaignChallengeById`
    - Fixed main app loading issue caused by parameter mismatch

**Bug Fixes During Session 2**:
- ✅ **Empty template dropdown**: Wrapped `getEmailTemplates()` response in `{ templates: [] }`
- ✅ **Failed to load recipients**: Wrapped `getTargetedUsers()` response in `{ users: [] }`
- ✅ **Main app loading crash**: Resolved `getChallengeById` function name collision between Code.gs and EmailCampaigns.gs
- ✅ **Campaign send failed message**: Added `success: true` flag to `sendEmailCampaign` response
- ✅ **Rate limiting (429 errors)**: Documented Google Apps Script quota limits and best practices

**Testing Results**:
- ✅ Dashboard home page loads with live stats (41 active users, Year-End Challenge, 0 workouts)
- ✅ Template dropdown populates from Email_Templates sheet
- ✅ Token copy-to-clipboard working
- ✅ Preview functionality generates personalized emails
- ✅ All 3 targeting modes functional (tested with custom user list)
- ✅ Email send successful (test email received in inbox)
- ✅ Success message displays correctly: "✅ Campaign sent successfully! Sent: 1, Skipped: 0, Errors: 0"
- ✅ Main app still loads and functions correctly (no regressions)

**Deployment**:
- GitHub Pages: `https://martinapt8.github.io/a8-workout-app/admin/`
- Admin Dashboard Home: `https://martinapt8.github.io/a8-workout-app/admin/index.html`
- Email Campaign Manager: `https://martinapt8.github.io/a8-workout-app/admin/email-campaigns.html`
- New deployment URL: `https://script.google.com/macros/s/AKfycbxLTcWJSJ-OvlaxgbqTHHst3vID7x_rZ8OIEyBGyvoR4-s76Yl9S5Rpdg1n5dZ9jGpb/exec`

**Next Steps**:
- Session 3: Template migration (welcome/update emails to Email_Templates sheet)
- Session 3: End-to-end testing scenarios
- Session 3: Comprehensive documentation updates (CLAUDE.md, ADMIN_GUIDE.md, BACKEND.md)

**Files Created (Session 2)**:
- `admin/index.html`: Dashboard home page (9.9KB)
- `admin/email-campaigns.html`: Email campaign composer (36KB)
- `admin/admin-styles.css`: A8 design system (14KB)
- `admin/admin-api.js`: API wrapper functions (5.8KB)
- `admin/admin-config.js`: API configuration (880B)
- **Total**: 5 new files, 67KB

**Files Modified (Session 2)**:
- `backend/Code.gs`: Added 6 GET endpoints, fixed response wrapping (~100 lines added)
- `backend/EmailCampaigns.gs`: Renamed function to resolve collision (~3 lines changed)
- `config.js`: Updated API URL to new deployment
- `admin/admin-config.js`: Updated API URL to new deployment

---

### 📧 Email Campaign System - Backend Foundation (November 18, 2025)

**Session 1 Complete: Backend Infrastructure for Flexible Email Campaigns**:
- **Purpose**: Replace hardcoded email system with template-based campaign management
- **Backend** (`backend/EmailCampaigns.gs` - NEW FILE, ~920 lines):
  - Template management: `getEmailTemplates()`, `getTemplateById()`, `saveEmailTemplate()`
  - Token replacement engine: `replaceTokens()` with 10+ dynamic tokens
    - User tokens: `[display_name]`, `[deployment_URL]`, `[lifetime_workouts]`
    - Challenge tokens: `[challenge_name]`, `[challenge_start_date]`, `[challenge_end_date]`, `[days_remaining]`, `[total_workouts]`
    - Team tokens: `[team_name]`, `[team_total_workouts]`
  - User targeting: `getTargetedUsers()` with 3 modes (all active, challenge-based, custom list)
  - Email preview: `previewEmailForUser()` with real user data
  - Campaign sending: `sendEmailCampaign()` with tracking flag support
  - Testing suite: `testTokenReplacement()`, `testEmailPreview()`, `testTargeting()`
- **API Endpoints** (`backend/Code.gs` - 6 new endpoints):
  - `getEmailTemplates`, `getTemplateById`, `saveEmailTemplate`
  - `previewEmail`, `getTargetedUsers`, `sendEmailCampaign`
- **Menu Integration** (`backend/menu.gs`):
  - Added "📧 Open Admin Dashboard" menu item (launches web interface)
  - Helper function `openAdminDashboard()` with URL launcher
- **Google Sheets**:
  - New `Email_Templates` sheet with 8 columns
  - Stores template_id, template_name, subject, html_body, plain_body, timestamps, active flag
- **Key Features**:
  - ✅ Dynamic token replacement for personalized emails
  - ✅ Flexible user targeting (all users, challenge participants, custom lists)
  - ✅ Tracking flags prevent duplicate sends
  - ✅ Preview functionality for testing before sending
  - ✅ All tests passing (token replacement, preview, targeting)

**Testing Results**:
- ✅ Token replacement: All 10+ tokens working correctly
- ✅ Email preview: Generated personalized content for test user
- ✅ User targeting: All 3 modes tested (41 active users, 32 in challenge, 2 custom)

**Next Steps**:
- Session 2: Build admin dashboard frontend (HTML/CSS/JS)
- Session 3: End-to-end testing, template migration, comprehensive documentation

**Files Changed**:
- `backend/EmailCampaigns.gs`: New file (~920 lines) with complete email campaign engine
- `backend/Code.gs`: Added 6 API endpoints (~70 lines)
- `backend/menu.gs`: Added admin dashboard launcher (~60 lines)
- Google Sheets: New `Email_Templates` sheet

---

### 🎲 Placeholder Team Assignment System (November 18, 2025)

**New Admin Feature: Random Team Distribution for Challenge Signups**:
- **Purpose**: Efficiently assign users who signed up for a challenge to placeholder teams with random, balanced distribution
- **Backend** (`backend/TeamPlaceholders.gs` - NEW FILE):
  - Added `promptSetPlaceholderTeams()` - Multi-step dialog menu function
    - Step 1: Select challenge_id from list of all challenges
    - Step 2: Count users with empty team_name for that challenge
    - Step 3: Display team distribution options (2-10 teams range)
    - Step 4: Get admin input for number of teams and users per team
    - Step 5: Show confirmation dialog with assignment summary
    - Step 6: Execute randomized team assignment
  - Added `setPlaceholderTeams(challengeId, numTeams, usersPerTeam)` - Core assignment logic
    - Fisher-Yates shuffle algorithm for fair randomization
    - Alphabetical placeholder naming (Team A, Team B, Team C...)
    - Creates smaller remainder team if users don't divide evenly
    - Uses existing `bulkAssignTeams()` from AdminChallenges.gs for efficiency
    - Leaves team_color empty for admin to fill manually
  - Added `getUnassignedUserCount(challengeId)` - Helper function for manual checks
- **Menu Integration** (`backend/menu.gs`):
  - Added "Set Placeholder Teams" menu item in Challenge Management section
  - Appears between "Set Active Challenge" and "View Challenge Stats"
- **Key Features**:
  - ✅ Only operates on users with empty team_name (skips existing team assignments)
  - ✅ Filters by exact challenge_id match (ignores all other challenge data)
  - ✅ Shows all reasonable team configurations with uneven options
  - ✅ Handles remainders by creating smaller final team (e.g., 35 users → 8 teams of 4 + 1 team of 3)
  - ✅ Random distribution ensures fairness
  - ✅ Placeholder names make it easy to communicate team assignments to users
  - ✅ Graceful error handling with user-friendly messages

**Admin Workflow**:
1. Users sign up via `/signup_challenge.html` (creates Challenge_Teams rows with empty team_name)
2. Admin clicks "A8 Custom Menu" → "Set Placeholder Teams"
3. Selects challenge_id (e.g., `dd_dec2025`)
4. System shows: "Found 32 users needing team assignment"
5. Displays options: "4 teams of 8", "8 teams of 4", "16 teams of 2", etc.
6. Admin enters: 8 teams, 4 users per team
7. Confirms assignment → Teams A-H created with randomized members
8. Admin manually adds team_color values in Challenge_Teams sheet
9. Communicates team assignments to users (e.g., "You're on Team C!")

**Files Changed**:
- `backend/TeamPlaceholders.gs`: New file (~330 lines) with all placeholder assignment logic
- `backend/menu.gs`: Added menu item (1 line)

**Technical Details**:
- Integrates seamlessly with existing Challenge_Teams table structure
- Reuses `bulkAssignTeams()` function for batch updates
- Challenge_Teams table grows over time - script always filters on challenge_id
- ~150-200 lines of core logic + ~130 lines of UI/validation

**Benefits**:
- Eliminates manual team assignment for large signups
- Fair randomization prevents perceived favoritism
- Balanced team sizes for competitive fairness
- Admin maintains full control over final team colors
- Works with any number of signups (2-100+)

---

### 🐛 Backfill Duplicate Workout Bug Fix (November 18, 2025)

**Fixed Critical Bug: Users Could Log Today's Workout Twice After Backfilling**:
- **Root Cause**: `onMePastWorkoutComplete()` was calling `refreshData()` after backfilling a past workout
  - Full dashboard refresh recalculated `completedToday` flag based on TODAY's date
  - Since backfilled date ≠ today, `completedToday` reset to `false`
  - UI showed "Not Yet Completed" and re-enabled the "Complete Workout" button
  - Users thought today's workout was erased and could log it again
  - Backend duplicate prevention worked per-date, but frontend state was out of sync

- **The Fix** (`index.html` lines 1574-1590):
  - Removed `refreshData()` call from `onMePastWorkoutComplete()`
  - Now performs **targeted updates only**:
    - Clears calendar cache (`CalendarState` reset)
    - Reloads calendar data via `loadCompletionDateRange()`
    - Rebuilds calendar display with `buildCalendar()`
    - Updates activity feed via `updateActivityFeed()`
    - Refreshes challenge history via `loadPastChallengeHistory()`
  - **Preserves `userData.completedToday` state** - no dashboard refresh!

- **User Experience Impact**:
  - ✅ Today's completion status remains visible after backfilling
  - ✅ "Complete Workout" button stays disabled
  - ✅ Calendar shows both today's and backfilled workouts
  - ✅ Activity feed updates correctly
  - ✅ No duplicate entries possible via this workflow

- **Backend Validation** (Already Working):
  - `markWorkoutComplete()` has per-date duplicate prevention via `hasCompletedOnDate()`
  - Returns error: "You already logged a workout for [date]!"
  - This fix prevents the frontend from allowing a second attempt

**Files Changed**:
- `index.html`: Modified `onMePastWorkoutComplete()` function (18 insertions, 13 deletions)

**Testing Checklist**:
- [ ] Log today's workout → verify completed status
- [ ] Backfill a past workout → verify success
- [ ] Check Today page → status should still show "✅ Completed Today"
- [ ] Verify "Complete Workout" button remains disabled
- [ ] Confirm calendar shows both workouts
- [ ] Attempt to backfill today's date → should get duplicate error

**Deployment**:
- Commit: `b219237` - "fix: Prevent duplicate workouts when backfilling past dates"
- Pushed to GitHub Pages (auto-deploys)
- Backend unchanged (duplicate prevention already working)

---

## Previous Updates (November 14, 2025 and earlier)

### 🎯 Challenge-Specific Signup System (November 14, 2025 - Latest)

**New Feature: Dedicated Challenge Signup Flow for New and Existing Users**:
- **Purpose**: Enable users to self-register for specific challenges with automatic user detection and preference pre-filling
- **Backend Changes** (`backend/Signup.gs`):
  - Added `getChallengeInfo(challengeId)` function to fetch challenge details and validate signup deadline
  - Added `checkUserByEmail(email)` function to detect existing users and return their preferences
  - Added `createChallengeSignup(data)` function to handle both new and existing user signups
    - New users: Creates full account with auto-approval (`active_user=TRUE`)
    - Existing users: Updates only `preferred_duration` and `equipment_available`, preserves `user_id`
    - Both: Adds row to Challenge_Teams table for participation tracking
    - Validates signup deadline against Settings timezone
    - Prevents duplicate signups with friendly error messaging
- **Backend Changes** (`backend/Code.gs`):
  - Added `checkUserByEmail` API endpoint to doPost()
  - Added `getChallengeInfo` API endpoint to doPost()
  - Added `createChallengeSignup` API endpoint to doPost()
  - Updated error message to list all available actions
- **Frontend** (`signup_challenge.html`):
  - Created new standalone signup page (680+ lines)
  - Two-step signup flow: email entry → full form
  - Step 1: User enters email, clicks "Continue"
    - Fetches challenge info and user status in parallel (Promise.all)
    - Pre-loads challenge info in background on page load
    - Shows loading spinner during verification
  - Step 2: Shows appropriate form based on user status
    - Existing users: Welcome message, pre-filled preferences, username field hidden
    - New users: All fields (username, display name, full name, preferences)
  - Displays challenge details (name, dates, goal, signup deadline)
  - Prevents form submission before email verification
  - Success screen with registration confirmation
- **Database Changes**:
  - Added `signup_deadline` column to Challenges sheet (manual setup required)
  - Challenge_Teams table used for signup tracking (team assignment by admin later)
- **Configuration** (`config.js`):
  - Updated API_URL to new deployment endpoint (fresh deployment to resolve CORS)

**URL Pattern**: `signup_challenge.html?challenge=dd_dec2025`

**UX Improvements**:
- No race conditions - user cannot submit until email is verified
- Clear two-step progression with visual feedback
- Existing users never see username/display name/full name fields
- Pre-filled preferences (duration + equipment) for returning users
- Clean success screen without info boxes
- Type conversion fix for duration preference pre-selection

**Files Created**:
- `signup_challenge.html`: New challenge signup page

**Files Modified**:
- `backend/Signup.gs`: Added 3 new functions (getChallengeInfo, checkUserByEmail, createChallengeSignup)
- `backend/Code.gs`: Added 3 new API endpoints
- `config.js`: Updated API_URL to new deployment

**Deployment Requirements**:
- Add `signup_deadline` column to Challenges sheet
- Deploy backend with new API endpoints
- Share signup URL with challenge participants

---

### 📚 Documentation Reorganization (November 7, 2025)

**Context Window Optimization**:
- **Purpose**: Reduce CLAUDE.md file size to prevent context window issues while maintaining comprehensive documentation
- **New File Created**: `Documentation/BACKEND.md` (comprehensive backend API reference)
  - Complete documentation for all Google Apps Script functions
  - Backend Files Reference table (12 .gs files)
  - Core Functions section (~23 functions with full descriptions)
  - Helper Functions section (~6 utility functions)
  - Admin Challenge Management Functions section (~4 admin functions)
  - Cross-references to related documentation
- **CLAUDE.md Updated**:
  - Removed ~360 lines of detailed backend function documentation
  - Added new "Backend API Reference" section with brief overview and link to BACKEND.md
  - Kept critical elements: database schema, API endpoints, quick reference
  - Updated "See Also" section with reorganized categories
- **Documentation Structure Improved**:
  - "See Also" section now organized into clear categories:
    - Technical Reference (BACKEND.md, FRONTEND_PAGES.md, ADMIN_GUIDE.md)
    - Testing & Validation
    - Development Guides
    - Planning & Roadmap
  - BACKEND.md placed prominently as first item in Technical Reference
  - Follows FRONTEND_PAGES.md pattern (detailed specifics in separate file)

**File Size Reduction**:
- CLAUDE.md: Reduced from ~870 lines to ~510 lines (41% reduction)
- All content preserved, just reorganized for better accessibility
- Better context window management for Claude Code

**Files Changed**:
- `Documentation/BACKEND.md`: New comprehensive backend reference document
- `CLAUDE.md`: Streamlined with backend reference section and updated cross-links

**Benefits**:
- Improved maintainability with focused documentation files
- Better context management for AI-assisted development
- Clear separation of concerns (frontend vs backend documentation)
- Preserved all technical details with improved discoverability

---

### 📊 Me Page User Stats Redesign (November 7, 2025)

**UI Improvement: 3-Column Stats Grid Layout**:
- **Purpose**: Cleaner, more compact user stats display with improved visual hierarchy
- **Frontend** (`index.html`):
  - Restructured user stats from vertical list to 3-column grid (lines 174-187)
  - Split data into separate value and label elements for better styling control
  - Updated `updateMePage()` function to populate new structure (lines 860-878)
  - Simplified text content (e.g., "16" instead of "16 workouts completed")
- **Styling** (`styles.css`):
  - Added `.summary-stats-grid` with 3-column grid layout, 20px gap (lines 904-910)
  - Added `.stat-column` flexbox vertical alignment, 8px gap (lines 912-917)
  - Added `.stat-value` with font-weight: 700 (bold), 18px size (lines 919-923)
  - Added `.stat-label` with font-weight: 400 (regular), 12px size, line breaks (lines 925-931)
  - Increased `.my-summary` gap from 12px to 16px for better spacing

**Visual Design**:
- **Bold values**: Dynamic data (16, Oct 30, Sep 17) displayed prominently
- **Uniform labels**: All labels use consistent weight/size for clean appearance
- **Line breaks**: Labels split across two lines ("Total" / "Workouts")
- **Reduced height**: More compact card footprint while maintaining readability

**Files Changed**:
- `index.html`: New 3-column HTML structure + updated JavaScript
- `styles.css`: New grid layout styles with bold values and uniform labels

---

### 👥 My Team's Workouts Feature (November 7, 2025 - Late Night)

**New Feature: Individual Team Member Workout Tracking**:
- **Purpose**: Provide visibility into team-specific stats to encourage participation and friendly competition
- **Backend** (`backend/Code.gs`):
  - Added `getMyTeamBreakdown(ss, userId, challengeId)` function (lines 554-644)
  - Fetches user's team assignment from Challenge_Teams sheet
  - Retrieves all members on the same team
  - Counts workout completions per member (filtered by challenge_id)
  - Returns structured object with team_name, team_color, and members array
  - Members sorted alphabetically by display_name
  - Includes all team members (even those with 0 workouts)
  - Modified `getUserDashboardData()` to include `myTeamBreakdown` field (line 244)
- **Frontend** (`index.html`):
  - Added new "My Team's Workouts" card on Team Progress page (lines 144-157)
  - Card appears below "Team Totals" section
  - Updated `updateProgressPage()` function to populate team member list (lines 778-806)
  - Displays team name in team color with separator line
  - Shows each member's display name and workout count
  - Hidden when no active challenge or user not assigned to team
- **Styling** (`styles.css`):
  - Added `.my-team-header` class with bottom border separator (lines 496-502)
  - Added `.team-members-list` flexbox layout (lines 504-507)
  - Added `.team-member-item` for individual member rows (lines 510-517)
  - Added `.member-name` and `.member-count` styling (lines 519-529)
- **Header Updates**:
  - Renamed "Team Workouts" → "Team Totals" (clearer for agency-wide view)
  - Renamed "My Team Workouts" → "My Team's Workouts" (better grammar)

**Display Logic**:
- Shows only when active challenge exists AND user is assigned to a team
- Displays all team members alphabetically (regardless of workout count)
- Member counts are challenge-specific (not lifetime totals)
- Uses team color from Challenge_Teams sheet for visual consistency

**Files Changed**:
- `backend/Code.gs`: New getMyTeamBreakdown() function + getUserDashboardData() modification
- `index.html`: New HTML card + updateProgressPage() logic
- `styles.css`: New team member display styles

**Technical Notes**:
- Leverages existing Challenge_Teams and Completions sheet structure
- Filters by challenge_id for accurate per-challenge counts
- Single-pass through data for optimal performance
- Returns null when user has no team assignment (graceful handling)

---

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
