# Administrator Guide

This guide covers all administrative functions for managing the Daily Dose app, including the admin dashboard, user management, challenge setup, email campaign system, and Slack integration.

**Last Updated**: November 18, 2025 (Admin Sidebar Navigation)

---

## Table of Contents

1. [Admin Dashboard](#admin-dashboard) ⭐ **NEW**
2. [Email Campaign System](#email-campaign-system) ⭐ **NEW**
3. [User Management](#user-management)
4. [Challenge Management](#challenge-management)
5. [Legacy Email Systems](#legacy-email-systems) ⚠️ **DEPRECATED**
6. [Slack Integration](#slack-integration)
7. [Custom Menu System](#custom-menu-system)
8. [Managing During Challenge](#managing-during-challenge)
9. [Year-Round Management](#year-round-management)

---

## Admin Dashboard

**NEW - November 2025**: Web-based admin interface for managing email campaigns, viewing stats, and accessing admin tools.

### Overview

The Admin Dashboard is a modern web interface that replaces manual Google Sheets operations for common admin tasks. It provides a user-friendly way to manage email campaigns, view real-time stats, and access administrative functions.

**Access URL:**
```
https://martinapt8.github.io/a8-workout-app/admin/
```

**Quick Access from Google Sheets:**
- "A8 Custom Menu" → "📧 Open Admin Dashboard"

### UI Design (Updated November 18, 2025)

**Fixed Sidebar Navigation (250px width)**:
- **Black background** (#000000) matching A8 brand
- **Daily Dose logo** at top with yellow text
- **Three menu sections**:
  - **Admin**: Admin Home, View Main App, User Management (WIP), Reporting (WIP)
  - **Comms**: Send Emails, Send Slack Updates (WIP)
  - **Google Admin**: View Sheets (NEW - embedded viewer), Open Google Sheets (external), Open Apps Script Editor (external)
- **Hierarchical structure**: Non-clickable parent labels, indented child links
- **Yellow accent colors** (#FFC107) on hover and active states
- **Desktop-focused**: Optimized for admin workflows (mobile not a priority)

### Dashboard Home Page

**Location**: `admin/index.html`

**Features:**
- **Live Statistics Cards**:
  - Total Active Users (count of users with active_user = TRUE)
  - Active Challenge (name, dates)
  - Total Workouts (for active challenge)
  - Last Updated (dashboard data refresh timestamp)
- **Admin Tools Cards**:
  - Email Campaigns (functional - launches campaign composer)
  - User Management (coming soon)
  - Analytics & Reports (coming soon)

**Technology:**
- Fetches real-time data from Google Apps Script API
- Auto-refreshes stats on page load
- Mobile-responsive design
- A8 brand colors (Black, Yellow, White)

### Email Campaigns Page

**Location**: `admin/email-campaigns.html`

Full-featured email campaign composer. See [Email Campaign System](#email-campaign-system) section below for complete documentation.

### Google Sheets Embed Page

**NEW - November 20, 2025**: Embedded Google Sheets viewer within the admin dashboard.

**Location**: `admin/sheets.html`

**Purpose:**
Allows admins to view and edit the Google Sheets database directly within the admin dashboard, reducing the need to switch between browser tabs/windows.

**Features:**
- **Full-screen embed**: Maximizes iframe size within dashboard layout (uses `calc(100vh - 140px)` height)
- **Seamless navigation**: Access via sidebar "View Sheets" link
- **External link option**: "Open Google Sheets" link in sidebar still available for native Sheets experience
- **Auto-configured**: Sheet URL and tab selection managed via `admin-config.js`
- **Error handling**: Displays friendly error messages if embed fails to load

**Access:**
- **Via Admin Dashboard**: Click "View Sheets" in the Google Admin sidebar section
- **Direct URL**: `https://martinapt8.github.io/a8-workout-app/admin/sheets.html`

**Configuration:**
Google Sheets URLs are stored in `admin/admin-config.js`:
```javascript
// Full edit URL (for external link in new tab)
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/SHEET_ID/edit?gid=SHEET_TAB_ID#gid=SHEET_TAB_ID';

// Embed URL (uses /preview instead of /edit for iframe embedding)
const GOOGLE_SHEETS_EMBED_URL = 'https://docs.google.com/spreadsheets/d/SHEET_ID/preview?gid=SHEET_TAB_ID';
```

**Key Differences: `/edit` vs `/preview`:**
- **`/edit` URL**: Full editing capabilities, used for external "Open Google Sheets" link
- **`/preview` URL**: Optimized for iframe embedding, prevents some permission issues
- **`gid` parameter**: Specifies which sheet tab to display (e.g., `272721508` = Users sheet)

**Navigation Flow:**
```
Admin Dashboard Sidebar
├─ View Sheets → admin/sheets.html (embedded viewer)
├─ Open Google Sheets → External tab (native Sheets)
└─ Open Apps Script Editor → External tab (Apps Script IDE)
```

**Technical Notes:**
- Iframe loads Google Sheets in preview mode for optimal embedding
- Loading state displays while iframe initializes
- Error fallback provides external link if embed fails
- No additional API calls required (direct Google Sheets embed)
- Respects existing Google Sheets permissions (admin must have edit access)

**Layout:**
- Sidebar: 250px fixed width (shared with all admin pages)
- Embed container: Full remaining width with rounded corners and shadow
- Header: Minimal (just "Google Sheets Database" title)
- No max-width constraint for maximum embed space

**When to Use:**
- ✅ Quick edits to user data, team assignments, or settings
- ✅ Viewing workout schedules or completion logs
- ✅ Checking email templates or challenge details
- ❌ Complex multi-sheet operations (use native Sheets via "Open Google Sheets")
- ❌ Apps Script editing (use "Open Apps Script Editor" link)

**Updating Sheet URL:**
If the Google Sheets ID or default tab changes, update `admin-config.js` and redeploy:
1. Edit `GOOGLE_SHEETS_URL` and `GOOGLE_SHEETS_EMBED_URL` in `admin/admin-config.js`
2. Increment cache-busting version in all admin HTML files
3. Deploy changes via `./deploy.sh`

### Design System

**Files:**
- `admin/admin-styles.css` (14KB)
- Roobert font family (shared with main app)

**Components:**
- Cards, buttons, forms, modals, tables, alerts, toasts
- Loading overlays and spinners
- Responsive grid layouts
- Mobile-first breakpoints

**Colors:**
- Primary: Black (#000000)
- Accent: Yellow (#FFC107)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Background: White (#FFFFFF)

---

## Email Campaign System

**NEW - November 2025**: Template-based email campaign system with token personalization, flexible targeting, and live preview.

Replaces hardcoded `welcome_email.gs` and `update_email.gs` with a flexible web-based campaign manager.

### Quick Start

1. **Access Admin Dashboard**: Navigate to `https://martinapt8.github.io/a8-workout-app/admin/`
2. **Click "Email Campaigns"** in the navigation or home page
3. **Create or select a template**
4. **Preview** with real user data
5. **Target** your audience (All Active, Challenge-Based, or Custom List)
6. **Send** campaign with optional tracking

### Template Management

**Creating a New Template:**

1. Click **"+ New Template"** button
2. Enter **Template Name** (e.g., "Welcome Email")
3. Enter **Template ID** (lowercase, no spaces, e.g., "welcome_v1")
4. Compose email content using the **WYSIWYG editor** ⭐ **NEW**
   - Use formatting toolbar: Bold, Italic, Underline, Headers, Lists, Links
   - Click token buttons to insert personalization fields as yellow chips
   - Plain text version auto-generates as you type
5. Click **"💾 Save Template"**

**Loading an Existing Template:**

1. Select template from **"Select Template"** dropdown
2. Template content loads into WYSIWYG editor automatically
3. Edit using toolbar or token buttons
4. Click **"💾 Save Template"** to update

**Deleting a Template:**

1. Load template from dropdown
2. Click **"🗑️ Delete Template"** button
3. Confirm deletion (cannot be undone)

**Template Fields:**
- **Template Name**: Display name shown in dropdown (can contain spaces, special characters)
- **Template ID**: Unique identifier (lowercase, numbers, underscores only - cannot change after creation)
- **Subject Line**: Email subject with token support
- **Email Content** ⭐ **NEW WYSIWYG Editor**:
  - Rich text formatting with visual toolbar
  - HTML generated automatically from formatted content
  - Plain text version auto-generated (no manual editing needed)
  - Token chips appear as yellow badges (non-editable, A8 branded)

### Token System

Tokens are placeholders that get replaced with real user data when emails are sent.

**Syntax**: `[token_name]`

**User Tokens:**
- `[display_name]` - User's display name (emoji-safe, cleaned for email)
- `[deployment_URL]` - User's personalized app link (e.g., `?user=megan`)
- `[lifetime_workouts]` - User's all-time workout count

**Challenge Tokens:**
- `[challenge_name]` - Active or specified challenge name
- `[challenge_start_date]` - Challenge start date (formatted)
- `[challenge_end_date]` - Challenge end date (formatted)
- `[days_remaining]` - Days left in challenge

**Team Tokens:**
- `[team_name]` - User's team name in challenge
- `[team_total_workouts]` - Team's total workouts in challenge

**Note**: The `[total_workouts]` token was deprecated in November 2025. Use `[lifetime_workouts]` for total counts or calculate challenge-specific counts programmatically if needed.

**Using Tokens:** ⭐ **UPDATED - Now with Direct Insertion**

1. **Click in the WYSIWYG editor** where you want to insert a token
2. **Click any token button** in the Token Helper panel (right side)
3. Token is **inserted directly** as a yellow chip in the editor
4. Tokens appear as non-editable yellow badges: `[display_name]`
5. Delete a token with single backspace (atomic deletion)
6. When email is sent, `[display_name]` → actual user's name

**Token Appearance:**
- **In Editor**: Yellow chip badges with A8 brand color (#FFC107)
- **In HTML**: `<span class="token-chip" data-token="display_name">[display_name]</span>`
- **In Plain Text**: `[display_name]` (auto-converted)
- **In Sent Email**: Replaced with actual user data

**Example Template with WYSIWYG Editor:**

**Subject Line:**
```
Welcome to [challenge_name], [display_name]!
```

**Email Content (as you compose it in WYSIWYG editor):**
```
[Heading 2] Hi [display_name],

Welcome to the Daily Dose! You're all set to join [bold]challenge_name[/bold].

Your personalized app link: [deployment_URL] (click to insert as link)

Challenge runs from [challenge_start_date] to [challenge_end_date].

You're on Team [team_name] - let's go!
```

**What Gets Saved Automatically:**

**HTML Body** (auto-generated):
```html
<h2>Hi <span class="token-chip">[display_name]</span>,</h2>
<p>Welcome to the Daily Dose! You're all set to join <strong><span class="token-chip">[challenge_name]</span></strong>.</p>
<p>Your personalized app link: <a href="[deployment_URL]"><span class="token-chip">[deployment_URL]</span></a></p>
<p>Challenge runs from <span class="token-chip">[challenge_start_date]</span> to <span class="token-chip">[challenge_end_date]</span>.</p>
<p>You're on Team <span class="token-chip">[team_name]</span> - let's go!</p>
```

**Plain Text Body** (auto-generated):
```
Hi [display_name],

Welcome to the Daily Dose! You're all set to join [challenge_name].

Your personalized app link: [deployment_URL]

Challenge runs from [challenge_start_date] to [challenge_end_date].

You're on Team [team_name] - let's go!
```

**Key Difference:** You only edit in the WYSIWYG editor - both HTML and plain text are generated automatically! ✨

**Token Replacement Logic:**
- Tokens replaced per user (personalized for each recipient)
- Missing data shows as empty string or default value (e.g., "Not Assigned" for missing team)
- Challenge tokens require challenge context (either active challenge or specified in preview)

### WYSIWYG Editor ⭐ **NEW - November 2025**

The email content editor now uses **Quill.js** for rich text editing with automatic HTML and plain text generation.

**Toolbar Features:**
- **Headers**: H1, H2, H3 for section titles
- **Bold**: Make text stand out
- **Italic**: Emphasis
- **Underline**: Additional emphasis
- **Ordered Lists**: Numbered lists (1, 2, 3...)
- **Bullet Lists**: Unordered lists with bullets
- **Links**: Insert hyperlinks (auto-formats in plain text as "text (URL)")
- **Clean**: Remove all formatting from selected text

**How to Use:**

1. **Type naturally** - Start typing your email content
2. **Select text** to format - Highlight text you want to format
3. **Click toolbar buttons** - Apply formatting (bold, italic, etc.)
4. **Insert tokens** - Click token buttons on the right panel
5. **Watch auto-update** - Plain text version updates automatically as you type

**Token Chips:**
- Tokens appear as **yellow badges** in the editor
- **Non-editable** - Can't accidentally modify token syntax
- **Atomic deletion** - Delete entire token with one backspace
- **Hover effect** - Visual feedback when hovering
- **A8 Branded** - Matches app color scheme (#FFC107)

**Auto-Generated Plain Text:**
- **Links**: `<a href="url">text</a>` → `text (url)`
- **Lists**: `<li>item</li>` → `• item`
- **Headings**: Extra line breaks for visual separation
- **Paragraphs**: Double line breaks between paragraphs
- **HTML Entities**: Decoded (e.g., `&nbsp;` → space)
- **Token Preservation**: All `[token_name]` syntax maintained

**Benefits:**
- ✅ **No HTML Knowledge Required** - Visual formatting only
- ✅ **80% Faster** - No dual editing (HTML + plain text)
- ✅ **Perfect Consistency** - Plain text always matches HTML
- ✅ **Error Prevention** - Can't break token syntax
- ✅ **Email-Safe** - Toolbar limited to email-appropriate formatting

**Example Workflow:**

1. Type: "Hi" → Click `[display_name]` token button → Type: ","
2. Select "Daily Dose" → Click **Bold**
3. Click **Link** button → Enter URL
4. Click **Bullet List** → Type list items
5. Click **Save Template** → Both HTML and plain text saved automatically!

**Backward Compatibility:**
- ✅ Existing templates load perfectly
- ✅ HTML is parsed and displayed with formatting
- ✅ No migration needed

### Live Preview

**Purpose**: See exactly how your email will look with real user data before sending.

**How to Preview:**

1. Click **"👁️ Preview"** button (top right of Email Editor)
2. **Select a user** from "Preview as User" dropdown
3. *Optional*: Select a challenge (for challenge-specific tokens)
4. Click **"Generate Preview"**
5. View rendered email:
   - **Subject**: With tokens replaced
   - **HTML Body**: Rendered with real data
   - **Plain Text Body**: With tokens replaced

**Preview Modal Sections:**
- **User Selector**: Choose any active user to preview as
- **Challenge Selector**: Choose challenge for challenge tokens (defaults to active challenge)
- **Subject Preview**: Shows final subject line
- **HTML Preview**: Shows rendered HTML (as it will appear in email)
- **Plain Text Preview**: Shows plain text version

**Use Cases:**
- Test token replacement accuracy
- Check formatting with different user names (short, long, with emojis)
- Verify links work correctly
- Ensure mobile-friendly rendering

### Targeting Modes

**Three ways to target recipients:**

#### 1. All Active Users

**What it does**: Sends to every user with `active_user = TRUE`

**When to use**:
- Company-wide announcements
- App updates affecting all users
- General communications

**How to use**:
1. Select radio button: **"All Active Users"**
2. Click **"👥 Preview Recipients"** to see list
3. Confirm user count matches expectation
4. Send

**Example**: Welcome email to all 41 active users

---

#### 2. Challenge-Based

**What it does**: Sends to users in a specific challenge

**When to use**:
- Challenge kickoff emails
- Mid-challenge updates
- Challenge-specific announcements

**How to use**:
1. Select radio button: **"Challenge-Based"**
2. **Select Challenge** from dropdown
3. *Optional*: Check **"Include users not in any challenge"** (sends to users not assigned to ANY challenge)
4. Click **"👥 Preview Recipients"** to verify
5. Send

**Example**: Mid-challenge update to all users in "Year-End Challenge"

**Advanced**: "Include users not in challenge" option useful for:
- Recruiting non-participants to join
- Sending year-round updates to users between challenges

---

#### 3. Custom User List

**What it does**: Sends to specific users by user_id

**When to use**:
- Testing emails with yourself
- Sending to specific team or group
- Targeted communications

**How to use**:
1. Select radio button: **"Custom User List"**
2. Enter **user IDs** in textarea (comma-separated)
   - Example: `megan, alex, jordan`
   - Whitespace around commas is ignored
3. Click **"👥 Preview Recipients"** to verify
4. Send

**Example**: Test email to yourself before sending to everyone
```
mritty85
```

**Example**: Send to specific team leads
```
megan, alex, jordan, sam
```

---

### Preview Recipients

**Before sending ANY campaign**, always preview recipients to verify targeting.

**How to Preview Recipients:**

1. Choose targeting mode (All Active, Challenge-Based, or Custom)
2. Click **"👥 Preview Recipients"** button
3. **Recipients Preview** section expands showing:
   - **Total count** (e.g., "Recipients: 41")
   - **User list table** with:
     - user_id
     - display_name
     - email address
     - team (if applicable)

**What to Check:**
- ✅ Count matches expectation
- ✅ Correct users in list
- ✅ No unexpected users included
- ✅ All intended users present

**Red Flags:**
- ❌ Count is 0 (no one will receive email)
- ❌ Wrong challenge selected
- ❌ Typo in custom user_id
- ❌ Inactive users showing (they shouldn't)

### Tracking Flags

**Purpose**: Prevent duplicate emails to the same user.

**How it works:**
1. Check **"Update tracking flag after send"**
2. Enter **flag name** (e.g., `welcome_email_sent`, `update_dec2025_sent`)
3. When campaign sends successfully:
   - Flag column in Users sheet is set to `TRUE` for each recipient
   - If user already has flag = `TRUE`, they are **skipped** (not sent duplicate)

**Use Cases:**

**Welcome Emails:**
- Flag: `welcome_email_sent`
- Ensures new users only get welcome email once
- Safe to run multiple times (skips users already welcomed)

**Challenge Updates:**
- Flag: `update_dec2025_sent`
- Ensures mid-challenge update sent only once
- Can use different flags for different updates

**Best Practices:**
- Use descriptive flag names: `{purpose}_{date/version}_sent`
- Include challenge ID for challenge-specific emails
- Check Users sheet to verify column exists (will be created if missing)

**Skipping Behavior:**
- Users with flag = `TRUE` are skipped
- Skipped users appear in **"Skipped"** count in results
- Details show reason: "Already sent (tracking flag: welcome_email_sent)"

### Sending a Campaign

**Step-by-Step Workflow:**

1. **Create/Select Template**
   - Choose existing template OR
   - Create new template with tokens

2. **Preview Email**
   - Click "Preview" button
   - Select test user
   - Verify tokens replaced correctly
   - Check formatting and links

3. **Choose Targeting**
   - Select: All Active, Challenge-Based, or Custom List
   - Configure targeting options

4. **Preview Recipients**
   - Click "Preview Recipients"
   - Verify user list and count
   - Ensure correct audience

5. **Set Tracking Flag** (Optional)
   - Check "Update tracking flag"
   - Enter flag name
   - Prevents duplicate sends

6. **Send Campaign**
   - Click **"📧 Send Email Campaign"** (large yellow button)
   - **Confirmation modal** appears:
     - Shows template name
     - Shows recipient count
     - Shows subject line preview
   - Click **"Confirm Send"** or **"Cancel"**

7. **View Results**
   - **Success screen** shows:
     - ✅ Sent: X users
     - ⏭️ Skipped: X users (if using tracking flag)
     - ❌ Errors: X users (if any failures)
   - Click details to see individual user results

**What Happens When You Click Send:**

1. Backend fetches targeted users
2. For each user:
   - Checks tracking flag (skips if already sent)
   - Replaces tokens with user's real data
   - Sends email via Gmail
   - Updates tracking flag (if enabled)
   - Logs success/failure
3. Returns summary: sent count, skipped count, error count

**Confirmation Safety:**
- Campaign **cannot be undone** after sending
- Always shows recipient count before confirming
- Requires explicit "Confirm Send" click

### Backend Architecture

**Files:**
- `backend/EmailCampaigns.gs` (920 lines) - Core email campaign engine
- `backend/Code.gs` - API endpoints (GET and POST)
- Google Sheets: `Email_Templates` sheet

**Key Functions** (EmailCampaigns.gs):

**Template Management:**
- `getEmailTemplates()` - Returns all active templates
- `getTemplateById(templateId)` - Returns single template
- `saveEmailTemplate(templateData)` - Creates/updates template

**Token Replacement:**
- `replaceTokens(templateText, userId, challengeId)` - Replaces all tokens
- `getTokenDataForUser(userId, challengeId)` - Gathers token data
- `cleanDisplayNameForEmail(displayName)` - Strips emojis for email safety

**User Targeting:**
- `getTargetedUsers(targetingOptions)` - Returns users based on mode
- Modes: `all_active`, `challenge`, `custom`
- Filters: active_user = TRUE, valid email

**Email Preview:**
- `previewEmailForUser(templateId, userId, challengeId)` - Generates preview with real data

**Campaign Sending:**
- `sendEmailCampaign(templateId, targetingOptions, trackingFlag)` - Sends to all targeted users
- Uses `GmailApp.sendEmail()` for actual sending
- Updates tracking flags in Users sheet
- Returns results object: `{sent, skipped, errors, details}`

**Helper Functions:**
- `getEmailCampaignChallengeById(challengeId)` - Fetches challenge data for tokens
- `getUserTeamForChallenge(userId, challengeId)` - Gets team assignment
- `updateUserTrackingFlag(userId, flagName, value)` - Updates tracking column

**API Endpoints** (Code.gs):

**GET Endpoints:**
- `getEmailTemplates` - Fetch all active templates
- `getTemplateById` - Fetch single template
- `getActiveUsers` - Get active users for preview dropdown
- `getAllChallenges` - Get challenges for targeting dropdown
- `getActiveChallenge` - Get active challenge for dashboard stats

**POST Endpoints:**
- `saveEmailTemplate` - Save/update template
- `deleteEmailTemplate` - Delete template (sets active=FALSE)
- `previewEmail` - Generate email preview for user
- `getTargetedUsers` - Get user list for targeting
- `sendEmailCampaign` - Send campaign to users

### Email_Templates Sheet

**Location**: Google Sheets (new sheet tab added in Session 1)

**Columns:**
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| template_id | Text (unique) | Unique identifier | "welcome_v1" |
| template_name | Text | Display name | "Welcome Email" |
| subject | Text | Subject line with tokens | "Welcome to [challenge_name]!" |
| html_body | Text (long) | HTML email content | `<div>Hi [display_name]...</div>` |
| plain_body | Text (long) | Plain text fallback | "Hi [display_name]..." |
| created_date | Date | Auto-populated timestamp | 11/18/2025 |
| last_modified | Date | Updated on each save | 11/18/2025 |
| active | Boolean | Template visibility | TRUE/FALSE |

**Template Lifecycle:**
1. Created via admin dashboard (or manually in sheet)
2. `created_date` set automatically
3. Edit via dashboard → `last_modified` updated
4. Delete via dashboard → `active` set to FALSE (soft delete)
5. Inactive templates hidden from dropdown

**Direct Sheet Editing:**
- ✅ Can edit templates directly in Google Sheets
- ✅ Changes appear immediately in dashboard (on refresh)
- ⚠️ Be careful with `template_id` (used as lookup key)
- ⚠️ Use `active = FALSE` to hide instead of deleting rows

### Troubleshooting

**Template Dropdown is Empty:**

**Cause**: No templates in Email_Templates sheet OR all templates have `active = FALSE`

**Solution**:
1. Check Email_Templates sheet exists
2. Check at least one template has `active = TRUE`
3. Verify template_id and template_name are not empty
4. Hard refresh dashboard (Cmd+Shift+R / Ctrl+Shift+R)

---

**"Failed to Load Recipients" Error:**

**Cause**: API response format mismatch or targeting parameters invalid

**Solution**:
1. Check browser console for detailed error
2. Verify challenge exists (if using Challenge-Based)
3. Verify user_ids are correct (if using Custom List)
4. Hard refresh and try again
5. Check Code.gs deployment is latest version

---

**"Campaign Send Failed" but Email Was Sent:**

**Cause**: Backend sends successfully but frontend doesn't recognize success response

**Solution**:
1. Check your inbox - email likely sent successfully
2. Verify latest Code.gs deployed (should include `success: true` flag)
3. Issue fixed in Session 2 - redeploy backend if seeing this

---

**Preview Shows "[token_name]" Instead of Real Data:**

**Cause**: Token not recognized or data not available for user

**Solutions**:
- **Check token spelling**: Must match exactly (e.g., `[display_name]` not `[displayName]`)
- **User data missing**: User might not have value for that field
- **Challenge tokens**: Ensure user is in selected challenge
- **Team tokens**: Ensure user has team assignment in Challenge_Teams

---

**Email Sent to Wrong Users:**

**Cause**: Targeting mode misconfigured

**Prevention**:
1. ALWAYS click "Preview Recipients" before sending
2. Verify user count and list match expectation
3. Use Custom List mode for testing (send to yourself first)
4. Double-check challenge selection if using Challenge-Based

---

**Rate Limiting (429 Too Many Requests):**

**Cause**: Google Apps Script quotas exceeded (too many API calls too quickly)

**Solution**:
1. Wait 1-2 minutes for quota to reset
2. Avoid rapid page refreshes
3. Don't spam API calls during testing
4. Use Preview Recipients sparingly
5. Google Apps Script limits:
   - URL Fetch calls: 20,000/day
   - Simultaneous executions: Limited by account type

**Prevention**:
- Space out test runs by 30-60 seconds
- Don't refresh dashboard repeatedly
- Batch operations when possible

---

**Emojis Breaking Email:**

**Cause**: Some email clients don't support emojis properly

**Solution**:
- Backend automatically cleans display_name with `cleanDisplayNameForEmail()`
- Emojis stripped from display_name in email body
- Fallback: "Team Member" if name is empty after cleaning
- To test: Preview email for user with emoji in display_name

---

**Tracking Flag Not Working:**

**Cause**: Column doesn't exist in Users sheet OR value not updating

**Solution**:
1. Check Users sheet has column matching flag name (e.g., `welcome_email_sent`)
2. If missing, add column manually
3. After sending, check column values updated to TRUE
4. Users with TRUE should be skipped on next send
5. Verify flag name spelling matches exactly

---

### Best Practices

**Template Naming:**
- Use version numbers: `welcome_v1`, `welcome_v2`
- Include purpose: `kickoff_dec2025`, `midchallenge_update`
- Lowercase IDs, friendly display names

**Token Usage:**
- Always test with Preview before sending
- Use fallback text for optional fields
- Test with users who have missing data (no team, 0 workouts, etc.)

**Targeting Strategy:**
- **Test first**: Always send to yourself (Custom List) before mass send
- **Preview recipients**: NEVER skip this step
- **Use tracking flags**: Prevent embarrassing duplicate sends

**Email Content:**
- Keep HTML simple (many email clients strip complex CSS)
- Always provide plain text version
- Test links before sending
- Keep subject lines under 50 characters
- Mobile-friendly formatting (short paragraphs, large buttons)

**Campaign Workflow:**
1. Draft template in dashboard
2. Preview with 2-3 different users
3. Send test to yourself (Custom List: your user_id)
4. Check test email in inbox
5. If good, target real audience and send
6. Use tracking flag to prevent duplicates

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

## Legacy Email Systems

⚠️ **DEPRECATED - November 2025**: These hardcoded email systems are replaced by the [Email Campaign System](#email-campaign-system). They remain documented for reference but should not be used for new campaigns.

**Migration Path**: Use the [Admin Dashboard](https://martinapt8.github.io/a8-workout-app/admin/) Email Campaign System instead.

---

### Welcome Email System (welcome_email.gs) ⚠️ DEPRECATED

**Status**: Replaced by Email Campaign System with `welcome_v1` template

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

**Why Deprecated:**
- Hardcoded email content (cannot edit without changing code)
- No live preview functionality
- Limited to all active users (no flexible targeting)
- No token-based personalization
- Harder to maintain and update

**Replacement**: Create a "Welcome Email" template in Email Campaign System with tokens for full flexibility.

---

### Update Email System (update_email.gs) ⚠️ DEPRECATED

**Status**: Replaced by Email Campaign System with flexible templates

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

**Why Deprecated:**
- Hardcoded email content specific to one update
- No reusability for future updates
- Cannot preview before sending
- Limited targeting options

**Replacement**: Create update templates in Email Campaign System with challenge-specific tokens and flexible targeting.

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

**Admin Dashboard:** ⭐ **NEW**
- "📧 Open Admin Dashboard" → `openAdminDashboard()` - Launches web-based admin dashboard in new tab

**Challenge Management:**
- "Create New Challenge" → `promptCreateChallenge()` - Interactive prompt to create new challenge
- "Set Active Challenge" → `promptSetActiveChallenge()` - Switch which challenge is active
- "Set Placeholder Teams" → `promptSetPlaceholderTeams()` - Randomly assign signups to balanced teams (NEW - Nov 2025)
- "View Challenge Stats" → `promptViewChallengeStats()` - View statistics for any challenge
- "End Challenge" → `promptEndChallenge()` - End active challenge gracefully

**Note**: Team assignment functions (`bulkAssignTeams()`, `copyTeamAssignments()`) exist in AdminChallenges.gs but must be called via Script Editor (no menu item currently).

**User Management:**
- "Migrate Form Responses" → `migrateFormResponses()`
- "Send Welcome Email" → `sendWelcomeEmail()` ⚠️ DEPRECATED - Use Email Campaign System instead
- "Send Update Email" → `sendUpdateEmail()` ⚠️ DEPRECATED - Use Email Campaign System instead

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
- **Lifetime Stats**: All workout counts calculated on-demand from Completions sheet
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
