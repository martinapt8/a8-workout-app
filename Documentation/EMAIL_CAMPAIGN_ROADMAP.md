# Email Campaign System - Implementation Roadmap

**Goal**: Replace hardcoded email system with flexible admin dashboard for composing, previewing, and sending personalized email campaigns.

**Architecture**: Standalone web dashboard (admin/) + Google Apps Script backend + Email_Templates sheet

**⚠️ Note (November 2025)**: The `[total_workouts]` token mentioned in this document was deprecated. Use `[lifetime_workouts]` instead for total workout counts.

---

## Session 1: Backend Foundation ⚙️
**Estimated Time**: 1-2 hours
**Status**: Not Started

### Objectives
- Create data storage for email templates
- Build core email campaign engine
- Implement token replacement system
- Add API endpoints for frontend

### Tasks

#### 1.1 Create Email_Templates Sheet
**Location**: Google Sheets (new sheet tab)

**Columns**:
```
template_id (text, unique)      - e.g., "welcome_v1", "update_dec2025"
template_name (text)            - e.g., "Welcome Email", "December Update"
subject (text)                  - Subject line with token support
html_body (text, long)          - HTML email content
plain_body (text, long)         - Plain text fallback
created_date (date)             - Auto-populated timestamp
last_modified (date)            - Updated on each save
active (boolean)                - TRUE/FALSE for template visibility
```

**Initial Data**: Migrate existing welcome_email.gs and update_email.gs templates

**File to Create**: None (manual Google Sheets setup)
**Documentation Update**: Add to CLAUDE.md under "Google Sheets Structure"

---

#### 1.2 Create EmailCampaigns.gs
**Location**: `backend/EmailCampaigns.gs` (new file ~15KB)

**Core Functions to Implement**:

```javascript
// Template Management
function getEmailTemplates()
  → Returns: [{template_id, template_name, subject, html_body, plain_body, ...}]
  → Filters: Only active templates

function getTemplateById(templateId)
  → Returns: Single template object or null

function saveEmailTemplate(templateData)
  → Creates new or updates existing template
  → Auto-sets created_date and last_modified
  → Returns: {success: true/false, message: string}

// Token Replacement Engine
function replaceTokens(templateText, userId, challengeId)
  → Fetches user data, challenge data, team data
  → Replaces all [token_name] instances
  → Supported tokens:
    - [display_name] - User's display name (emoji-cleaned)
    - [deployment_URL] - User's personalized app link
    - [challenge_name] - Active/specified challenge name
    - [challenge_start_date] - Challenge start date
    - [challenge_end_date] - Challenge end date
    - [total_workouts] - User's workouts in specified challenge
    - [lifetime_workouts] - User's all-time workout count
    - [team_name] - User's team in specified challenge
    - [team_total_workouts] - Team's total workouts
    - [days_remaining] - Days left in challenge
  → Returns: Processed string with tokens replaced

function getTokenDataForUser(userId, challengeId)
  → Helper function that gathers all token data
  → Returns: {display_name, deployment_URL, challenge_name, ...}

// User Targeting
function getTargetedUsers(targetingOptions)
  → targetingOptions: {
      mode: 'all_active' | 'challenge' | 'custom',
      challengeId: string (if mode='challenge'),
      includeNoChallenge: boolean (if mode='challenge'),
      userIds: [string] (if mode='custom')
    }
  → Returns: [{user_id, email, display_name, active_user, ...}]
  → Filters: active_user=TRUE, valid email

// Email Preview
function previewEmailForUser(templateId, userId, challengeId)
  → Loads template, replaces tokens with user's real data
  → Returns: {subject, html_body, plain_body, user: {user_id, display_name, email}}

// Campaign Sending
function sendEmailCampaign(templateId, targetingOptions, trackingFlag)
  → Gets targeted users via getTargetedUsers()
  → For each user:
    - Replaces tokens via replaceTokens()
    - Sends email via GmailApp.sendEmail()
    - Updates tracking flag if provided (e.g., 'welcome_email_sent')
    - Logs success/failure
  → Returns: {sent: number, skipped: number, errors: number, details: []}

// Helper Functions
function cleanDisplayNameForEmail(displayName)
  → Strips emojis/non-ASCII (reuse existing pattern)
  → Returns: ASCII-safe string or 'Team Member'

function getDeployedUrlForEmail()
  → Fetches deployed_URL from Settings sheet
  → Returns: Base URL string
```

**Dependencies**:
- Reads from: Email_Templates sheet, Users sheet, Settings sheet, Challenges sheet, Challenge_Teams sheet, Completions sheet
- External API: GmailApp.sendEmail()

**Testing Functions**:
```javascript
function testTokenReplacement()
  → Tests token engine with sample user

function testEmailPreview()
  → Previews template for test user

function testTargeting()
  → Tests each targeting mode
```

---

#### 1.3 Update Code.gs (API Endpoints)
**Location**: `backend/Code.gs`
**Modification**: Add new actions to `doPost()` switch statement

**New API Actions**:

```javascript
case 'getEmailTemplates':
  → Calls getEmailTemplates()
  → Returns template list

case 'getTemplateById':
  → Requires: templateId
  → Returns single template

case 'saveEmailTemplate':
  → Requires: templateData object
  → Calls saveEmailTemplate()
  → Returns success/error

case 'previewEmail':
  → Requires: templateId, userId, challengeId (optional)
  → Calls previewEmailForUser()
  → Returns preview data

case 'getTargetedUsers':
  → Requires: targetingOptions object
  → Calls getTargetedUsers()
  → Returns user list for preview

case 'sendEmailCampaign':
  → Requires: templateId, targetingOptions, trackingFlag (optional)
  → Calls sendEmailCampaign()
  → Returns send results
```

**Error Handling**:
- Validate required parameters
- Catch exceptions and return meaningful errors
- Log all campaign sends for audit trail

---

#### 1.4 Update menu.gs (Dashboard Access)
**Location**: `backend/menu.gs`
**Modification**: Add menu item to launch admin dashboard

**New Menu Item**:
```javascript
.addItem('📧 Open Admin Dashboard', 'openAdminDashboard')

function openAdminDashboard() {
  const deployedUrl = getDeployedUrlForMenu(); // Reuse existing helper
  const adminUrl = deployedUrl + '/admin/';

  const html = HtmlService.createHtmlOutput(
    '<p>Opening Admin Dashboard...</p>' +
    '<p><a href="' + adminUrl + '" target="_blank">Click here if not redirected</a></p>' +
    '<script>window.open("' + adminUrl + '", "_blank"); google.script.host.close();</script>'
  ).setWidth(400).setHeight(150);

  SpreadsheetApp.getUi().showModalDialog(html, 'Admin Dashboard');
}
```

---

### Session 1 Deliverables
- ✅ Email_Templates sheet created with sample templates
- ✅ EmailCampaigns.gs with 10+ functions implemented
- ✅ Code.gs updated with 6 new API endpoints
- ✅ menu.gs updated with dashboard launcher
- ✅ Token replacement working for all specified tokens
- ✅ User targeting working for all modes
- ✅ Backend testing functions confirm functionality

### Session 1 Testing Checklist
- [ ] Run `testTokenReplacement()` - confirms all tokens work
- [ ] Run `testEmailPreview()` - confirms preview generates correctly
- [ ] Run `testTargeting()` - confirms all targeting modes work
- [ ] Manually test API endpoints via Apps Script debugger
- [ ] Verify Email_Templates sheet has migrated welcome/update templates

### Files Created/Modified (Session 1)
**New**:
- `backend/EmailCampaigns.gs` (~15KB)

**Modified**:
- `backend/Code.gs` (add ~100 lines for API endpoints)
- `backend/menu.gs` (add ~20 lines for dashboard launcher)

**Google Sheets**:
- New sheet tab: `Email_Templates`

---

## Session 2: Admin Dashboard Frontend 🎨
**Estimated Time**: 2-3 hours
**Status**: Not Started
**Prerequisites**: Session 1 complete

### Objectives
- Create admin dashboard UI structure
- Build email campaign composer interface
- Implement live preview and token helper
- Connect frontend to backend API

### Tasks

#### 2.1 Create Admin Config Files
**Files**:
- `admin/admin-config.js` (~1KB)
- `admin/admin-api.js` (~3KB)

**admin-config.js**:
```javascript
// Mirror pattern from config.js
const ADMIN_API_URL = 'https://script.google.com/macros/s/.../exec';
```

**admin-api.js**:
```javascript
// Reusable API helper functions
async function adminApiCall(action, payload = {}) {
  // Form-encoded POST pattern (same as api.js)
}

// Specific helpers
async function getEmailTemplates() { ... }
async function saveEmailTemplate(templateData) { ... }
async function previewEmail(templateId, userId, challengeId) { ... }
async function getTargetedUsers(targetingOptions) { ... }
async function sendEmailCampaign(templateId, targetingOptions, trackingFlag) { ... }
```

---

#### 2.2 Create Admin Styles
**File**: `admin/admin-styles.css` (~5KB)

**Design System** (consistent with main app):
- Colors: A8 Black (#000000), Yellow (#FFC107), White (#FFFFFF)
- Font: Roobert (with fallbacks)
- Mobile-responsive grid layout
- Card-based sections
- Yellow accent buttons
- Form styling: textareas, inputs, dropdowns, radio buttons

**Key Components**:
- Navigation header
- Three-column email editor layout
- Template selector dropdown
- Token helper sidebar (collapsible on mobile)
- Preview pane (split-screen or modal)
- Targeting form with conditional fields
- Send button (yellow, prominent)
- Results modal/toast notifications

---

#### 2.3 Create Dashboard Home
**File**: `admin/index.html` (~10KB)

**Purpose**: Landing page for admin dashboard (foundation for future features)

**Sections**:

**Header**:
- A8 logo
- Title: "Daily Dose Admin Dashboard"
- Navigation: Email Campaigns | User Management (future) | Analytics (future)

**Quick Stats Cards**:
- Total Active Users (fetched from API)
- Active Challenge Name & Dates
- Total Workouts This Challenge
- Last Email Sent (timestamp)

**Main Menu**:
- Large card: "📧 Email Campaigns" → links to email-campaigns.html
- Placeholder cards: "👥 User Management" (coming soon), "📊 Analytics" (coming soon)

**Footer**:
- Link to main app
- Link to Google Sheets
- Version info

---

#### 2.4 Create Email Campaign Interface
**File**: `admin/email-campaigns.html` (~20KB - most complex)

**Layout**: Three-section vertical layout (mobile-first)

---

**Section 1: Template Management**

**Components**:
- Dropdown: "Select Template" (populated via getEmailTemplates())
- Button: "+ Create New Template"
- If template selected:
  - Text input: Template Name (editable)
  - Text input: Template ID (auto-generated from name, locked after creation)
  - Button: "Save Template" | "Delete Template"

**Behavior**:
- On load: Fetch templates, populate dropdown
- On select: Load template into editor
- On create new: Clear editor, show new template form
- On save: Call saveEmailTemplate(), refresh dropdown

---

**Section 2: Email Editor**

**Left Panel: Editor**
- Text input: Subject Line (with token support)
- Textarea: HTML Body (600px height, monospace font)
- Textarea: Plain Text Body (400px height)
- Token insert buttons above each field

**Right Panel: Token Helper**
- Grouped by category:
  - **User Tokens**: [display_name], [deployment_URL], [lifetime_workouts]
  - **Challenge Tokens**: [challenge_name], [challenge_start_date], [challenge_end_date], [days_remaining]
  - **Team Tokens**: [team_name], [team_total_workouts]
  - **Stats Tokens**: [total_workouts]

**Each Token Button**:
- Click to copy to clipboard
- Shows tooltip with example value
- Inserts at cursor position in focused field

**Preview Button**:
- "Preview as User" → opens modal
- User selector dropdown (fetches active users)
- Challenge selector dropdown (optional, for challenge tokens)
- Shows rendered HTML and plain text side-by-side

---

**Section 3: Targeting & Send**

**Targeting Form**:

**Radio Options**:
1. "All Active Users"
   - No additional fields

2. "Challenge-Based"
   - Dropdown: Select Challenge (fetches from Challenges sheet)
   - Checkbox: "Include users not in any challenge"

3. "Custom User List"
   - Textarea: Comma-separated user_ids
   - Example: "megan, alex, jordan"

**Preview Recipients**:
- Button: "Preview Recipients" → calls getTargetedUsers()
- Shows modal with:
  - Total count
  - User list table: user_id, display_name, email, team
  - "Confirm" button to proceed

**Tracking Flag** (optional):
- Checkbox: "Update tracking flag after send"
- Text input: Flag name (e.g., "welcome_email_sent", "update_dec2025_sent")
- Info tooltip: "Prevents duplicate sends"

**Send Campaign**:
- Button: "Send Email Campaign" (yellow, large)
- Confirmation modal:
  - "You are about to send [TEMPLATE NAME] to [X] users"
  - Preview: Subject line
  - "Cancel" | "Confirm Send"
- On send: Show loading spinner
- On complete: Show results modal
  - "✅ Sent to X users"
  - "⏭️ Skipped X users"
  - "❌ Errors: X"
  - Details table (if errors)

---

**Section 4: Send History** (bottom of page)

**Table**:
- Columns: Timestamp, Template Name, Recipients, Status
- Pagination: Show last 20 sends
- Data source: Email_Campaign_History sheet (if implemented) or client-side log

---

### Session 2 Deliverables
- ✅ Admin dashboard home page (index.html) accessible
- ✅ Email campaign interface (email-campaigns.html) functional
- ✅ Token helper working (copy to clipboard)
- ✅ Live preview rendering correctly
- ✅ Template save/load working
- ✅ Targeting UI complete with all three modes
- ✅ Send campaign flow working end-to-end
- ✅ Mobile-responsive design

### Session 2 Testing Checklist
- [ ] Test template CRUD: Create, load, edit, save, delete
- [ ] Test token insertion in all fields (subject, html, plain text)
- [ ] Test preview with multiple users and challenges
- [ ] Test all targeting modes: all active, challenge-based, custom list
- [ ] Test recipient preview shows correct user list
- [ ] Test send confirmation modal and results display
- [ ] Test mobile layout on phone screen size
- [ ] Test cross-browser (Chrome, Safari, Firefox)

### Files Created (Session 2)
**New**:
- `admin/admin-config.js` (~1KB)
- `admin/admin-api.js` (~3KB)
- `admin/admin-styles.css` (~5KB)
- `admin/index.html` (~10KB)
- `admin/email-campaigns.html` (~20KB)

**Total**: 5 new files, ~39KB

---

## Session 3: Testing & Migration 🧪
**Estimated Time**: 1-2 hours
**Status**: Not Started
**Prerequisites**: Sessions 1 & 2 complete

### Objectives
- Migrate existing email templates
- Test entire email campaign workflow
- Validate token replacement accuracy
- Test targeting filters with real data
- Send test campaigns
- Update documentation

### Tasks

#### 3.1 Template Migration
**Goal**: Convert existing hardcoded emails to Email_Templates sheet

**Templates to Migrate**:

**Template 1: Welcome Email**
- Source: `backend/welcome_email.gs` lines 205-257
- template_id: `welcome_v1`
- template_name: `Welcome Email`
- Subject: `Welcome to the A8 Fitness Challenge: The Daily Dose™!`
- html_body: Copy HTML from lines 220-249, replace hardcoded values with tokens
- plain_body: Copy plain text from lines 207-217, replace hardcoded values with tokens
- Tokens to replace:
  - User name → `[display_name]`
  - Personalized link → `[deployment_URL]`

**Template 2: Update Email**
- Source: `backend/update_email.gs` lines 205-258
- template_id: `update_v1`
- template_name: `Challenge Update Email`
- Subject: Update from existing code
- html_body: Copy HTML, replace with tokens
- plain_body: Copy plain text, replace with tokens
- Tokens to replace:
  - User name → `[display_name]`
  - Personalized link → `[deployment_URL]`

**Process**:
1. Manually copy content from .gs files
2. Replace hardcoded values with tokens
3. Add rows to Email_Templates sheet
4. Set active=TRUE for both

---

#### 3.2 End-to-End Testing

**Test Scenario 1: Send Welcome Email to New User**
1. Create test user in Users sheet (active_user=TRUE, welcome_email_sent=FALSE)
2. Load `welcome_v1` template in dashboard
3. Preview email for test user
4. Verify tokens replaced correctly
5. Target "All Active Users" with tracking flag `welcome_email_sent`
6. Send campaign
7. Check test user's inbox
8. Verify welcome_email_sent flag updated to TRUE
9. Attempt resend → should skip (already sent)

**Test Scenario 2: Send Challenge Update to Active Challenge Users**
1. Load `update_v1` template
2. Preview for user in active challenge
3. Verify challenge tokens ([challenge_name], [days_remaining]) show correct data
4. Target "Challenge-Based" → select active challenge
5. Preview recipients → verify correct user list
6. Send to 2-3 test users
7. Check inboxes for personalization accuracy

**Test Scenario 3: Send Custom Email to Specific Users**
1. Create new template: "Test Custom Email"
2. Add custom content with all token types
3. Preview for multiple users (different teams, workout counts)
4. Target "Custom User List" → enter 3 user_ids
5. Preview recipients → verify only those 3 users
6. Send campaign
7. Verify only targeted users received email

**Test Scenario 4: Token Replacement Edge Cases**
- User with no team (NULL team_name) → token shows "Not Assigned"
- User with 0 workouts → [total_workouts] shows "0"
- User with emoji in display_name → cleaned correctly
- Challenge with no end date → [days_remaining] shows "Ongoing"
- Empty/NULL tokens → graceful handling (show placeholder or empty string)

---

#### 3.3 Performance & Scale Testing

**Test 1: Large Recipient List**
- Target all active users (assuming 20-50 users)
- Monitor send time
- Check for timeouts (Apps Script 6-minute limit)
- Verify all users receive email

**Test 2: Template with Complex HTML**
- Create template with images, tables, styled lists
- Preview renders correctly
- Email clients display correctly (Gmail, Outlook)

**Test 3: Concurrent Access**
- Have 2 admins access dashboard simultaneously
- Verify no conflicts when editing/saving templates

---

#### 3.4 Error Handling & Edge Cases

**Test Invalid Data**:
- Missing required template fields → error message
- Invalid user_id in custom list → skipped gracefully
- Invalid challenge_id in targeting → error message
- Empty recipient list → prevent send, show warning
- Invalid token syntax in template → show as-is or error?

**Test Network Issues**:
- API timeout handling
- Failed email send (invalid email address) → logged in errors
- Partial campaign failure → continue sending to others

---

#### 3.5 Documentation Updates

**Files to Update**:

**CLAUDE.md**:
- Add Email_Templates sheet to "Google Sheets Structure" section
- Update "Administrative Features Summary" table
- Add admin dashboard to "Technical Architecture" section
- Update "Common Tasks Quick Reference" → "Send Email Campaign"

**Documentation/ADMIN_GUIDE.md**:
- Add new section: "Email Campaign System"
- Document template creation process
- Document token usage with examples
- Document targeting modes
- Add screenshots/mockups of dashboard

**Documentation/BACKEND.md**:
- Document EmailCampaigns.gs functions
- Document new API endpoints in Code.gs
- Add token reference table

**NEW: Documentation/EMAIL_CAMPAIGN_GUIDE.md**:
- Complete admin guide for email campaigns
- Token reference with examples
- Targeting strategies
- Best practices
- Troubleshooting common issues

**CHANGELOG.md**:
- Add entry for Email Campaign System (version bump to 3.1?)

---

### Session 3 Deliverables
- ✅ Welcome and update templates migrated to Email_Templates sheet
- ✅ All test scenarios pass successfully
- ✅ Edge cases handled gracefully
- ✅ Performance acceptable for expected user base
- ✅ Documentation updated across all files
- ✅ System ready for production use

### Session 3 Testing Checklist
**Template Migration**:
- [ ] Welcome template migrated with all tokens
- [ ] Update template migrated with all tokens
- [ ] Templates load correctly in dashboard
- [ ] Preview shows correct personalization

**End-to-End Tests**:
- [ ] Welcome email sends to new user
- [ ] Tracking flag prevents duplicate send
- [ ] Challenge update targets correct users
- [ ] Custom list targets only specified users
- [ ] All token types replace correctly

**Edge Cases**:
- [ ] NULL team handled gracefully
- [ ] 0 workouts displays correctly
- [ ] Emoji in display_name cleaned
- [ ] Invalid user_id skipped
- [ ] Empty recipient list prevented

**Documentation**:
- [ ] CLAUDE.md updated
- [ ] ADMIN_GUIDE.md updated
- [ ] BACKEND.md updated
- [ ] EMAIL_CAMPAIGN_GUIDE.md created
- [ ] CHANGELOG.md updated

---

## Optional Future Enhancements 🚀
**Not in initial scope - for future sessions**

### Email Campaign History Tracking
- Create `Email_Campaign_History` sheet
- Track: campaign_id, template_id, user_id, sent_date, status
- View send history in dashboard
- Analytics: open rates (requires tracking pixels), click rates

### Advanced Token Features
- Conditional blocks: `[IF total_workouts > 10]You're crushing it![/IF]`
- Math operations: `[total_workouts + 1]` (next workout)
- Date formatting: `[challenge_start_date | format:MMMM D]`

### Template Versioning
- Save template versions on each edit
- Rollback to previous version
- Compare versions side-by-side

### Scheduled Sends
- Schedule campaign for future date/time
- Recurring campaigns (weekly updates)
- Time zone awareness

### Rich Text Editor
- WYSIWYG editor instead of raw HTML textarea
- Drag-and-drop components
- Pre-built email blocks (header, footer, CTA button)

### User Segmentation
- Save targeting criteria as segments
- Reuse segments across campaigns
- Dynamic segments (auto-update based on criteria)

### A/B Testing
- Send variant A to 50%, variant B to 50%
- Track performance metrics
- Declare winner

### Email Analytics Dashboard
- Open rate tracking (tracking pixel)
- Click tracking (link wrapping)
- Engagement heatmap
- Conversion tracking (workout logged after email)

---

## Risk Assessment & Mitigation 🛡️

### Risk 1: Apps Script Execution Time Limit
**Issue**: Apps Script has 6-minute timeout for Web App requests
**Impact**: Campaigns to 100+ users might timeout
**Mitigation**:
- Batch sends: Process 50 users, return progress, continue in next request
- Implement queue system for large campaigns
- Show progress bar in UI

### Risk 2: Gmail Send Quotas
**Issue**: Google limits daily email sends (varies by account type)
**Impact**: Campaign might fail partway through
**Mitigation**:
- Check quota before send: `MailApp.getRemainingDailyQuota()`
- Show quota warning in UI
- Implement resume/retry for failed campaigns

### Risk 3: Token Complexity
**Issue**: Non-technical admin might make token syntax errors
**Impact**: Emails sent with unreplaced tokens like `[dispaly_name]` (typo)
**Mitigation**:
- Token validation on save (check for unknown tokens)
- Token autocomplete in editor
- Preview before send (catches errors)

### Risk 4: Accidental Mass Send
**Issue**: Admin accidentally sends to all users instead of test group
**Impact**: Unwanted emails to entire user base
**Mitigation**:
- Always show recipient count before send
- Confirmation modal with explicit count
- "Test Mode" that only sends to admin email

### Risk 5: Mobile Usability
**Issue**: Email editing on phone might be difficult
**Impact**: Admin might avoid using dashboard on mobile
**Mitigation**:
- Responsive design with mobile breakpoints
- Simplified mobile layout (stack sections vertically)
- Template library for quick sends (no editing needed)

---

## Success Criteria ✅

**Session 1 (Backend)**: Complete when...
- [ ] EmailCampaigns.gs has all functions implemented and tested
- [ ] API endpoints in Code.gs respond correctly
- [ ] Token replacement works for all token types
- [ ] User targeting returns correct user lists for all modes
- [ ] Backend testing functions all pass

**Session 2 (Frontend)**: Complete when...
- [ ] Admin dashboard is accessible and styled
- [ ] Email editor allows template creation/editing
- [ ] Token helper inserts tokens correctly
- [ ] Preview shows personalized content accurately
- [ ] Targeting UI allows all three modes
- [ ] Send campaign completes and shows results

**Session 3 (Testing)**: Complete when...
- [ ] Existing templates migrated successfully
- [ ] All test scenarios pass
- [ ] Edge cases handled gracefully
- [ ] Documentation fully updated
- [ ] Admin can send email campaign without developer assistance

**Overall Project**: Success when...
- [ ] Admin no longer needs to edit .gs files to send emails
- [ ] Email content is editable via web interface
- [ ] Token system provides rich personalization
- [ ] Targeting allows flexible user selection
- [ ] System is foundation for future admin dashboard features

---

## Session Breakdown Summary

| Session | Focus | Time | Files | Testing |
|---------|-------|------|-------|---------|
| 1 | Backend Foundation | 1-2h | EmailCampaigns.gs, Code.gs, menu.gs | Backend unit tests |
| 2 | Admin Frontend | 2-3h | 5 admin HTML/CSS/JS files | UI/UX testing |
| 3 | Testing & Docs | 1-2h | Migration + documentation | End-to-end scenarios |

**Total Estimated Time**: 4-7 hours across 3 sessions

---

## Next Steps

**Ready to Start Session 1?**
1. Confirm Google Sheets access for Email_Templates sheet creation
2. Confirm Apps Script Editor access for new file creation
3. Review current welcome_email.gs and update_email.gs to understand migration
4. Begin with Email_Templates sheet setup
5. Proceed through Session 1 tasks in order

**Questions Before Starting?**
- Token naming conventions? (prefer `[snake_case]` or `[camelCase]`?)
- Should templates be versioned from the start? (template_id with _v1, _v2 suffix)
- Email sender name/address? (defaults to script owner's Gmail)
- Should we add "Send Test Email to Me" feature for admin safety?

---

**Document Version**: 1.0
**Created**: November 18, 2025
**Last Updated**: November 18, 2025
**Status**: Ready for Session 1
