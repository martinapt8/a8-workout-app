# Admin Guide: Challenge Analytics Dashboard

**Last Updated**: November 21, 2025
**Page URL**: `https://martinapt8.github.io/a8-workout-app/admin/challenges.html`

---

## Overview

The Challenge Analytics Dashboard provides comprehensive historical tracking, real-time analytics, and visual reporting for all workout challenges. This page enables admins to:

- View all past, active, and upcoming challenges in a single sortable table
- Analyze individual challenge performance with detailed metrics
- Generate visual reports (trend lines and team comparisons) for sharing with participants
- Track progress toward goals and identify team performance gaps

---

## Page Structure

The Challenges page consists of **4 main sections**:

### Section 1: Challenge Summary Table
- **Purpose**: Historical overview of all challenges
- **Data Source**: Challenges sheet + Completions sheet (via `getChallengeAnalytics` API)
- **Features**: Sortable columns, color-coded status badges, auto-calculated metrics

### Section 2: Challenge Analytics (Selector + Stat Cards)
- **Purpose**: Deep dive into a specific challenge
- **Data Source**: Challenge stats + time series data
- **Features**: Dropdown selector, 4 stat cards with live metrics

### Section 3: Workouts Over Time (Chart.js Line Chart)
- **Purpose**: Visualize cumulative workout progression vs. goal
- **Data Source**: `getChallengeTimeSeriesData` API
- **Features**: Trend line, goal line, hover tooltips, screenshot-ready

### Section 4: Workouts by Team (Chart.js Bar Chart)
- **Purpose**: Compare team performance side-by-side
- **Data Source**: `getChallengeAnalytics` API (team_totals)
- **Features**: Color-coded bars, hover tooltips, alphabetical sorting

---

## Section 1: Challenge Summary Table

### What It Shows

| Column | Description | Data Source | Calculation |
|--------|-------------|-------------|-------------|
| **Challenge Name** | Display name | Challenges sheet | Direct from `challenge_name` |
| **Status** | Challenge state | Challenges sheet | Direct from `status` column (active/upcoming/completed) |
| **Start Date** | Challenge start | Challenges sheet | Formatted from `start_date` |
| **End Date** | Challenge end | Challenges sheet | Formatted from `end_date` |
| **Goal** | Target workouts | Challenges sheet | Direct from `total_goal` |
| **Participants** | Unique users | Completions sheet | Count of unique `user_id` per `challenge_id` |
| **Total Workouts** | Completions | Completions sheet | Count of rows matching `challenge_id` |
| **Completion %** | Progress | Calculated | `(Total Workouts / Goal) × 100` |

### How It Works

1. **Page Load**: Calls `getAllChallenges()` to fetch all challenge records
2. **Parallel Loading**: Fetches analytics for ALL challenges simultaneously using `Promise.all()`
3. **Table Population**: Builds table rows with data + status badges
4. **Auto-Sort**: Defaults to sorting by status (active → upcoming → completed)

### Status Badges

- **🟢 Active** (Green badge): `status = 'active'`
- **🔵 Upcoming** (Blue badge): `status = 'upcoming'`
- **⚪ Completed** (Gray badge): `status = 'completed'`

### Sorting Behavior

- **Click any column header** to sort by that column
- **Click again** to reverse sort direction (ascending ↔ descending)
- **Status sorting** uses custom order: Active (1) → Upcoming (2) → Completed (3)
- **Date sorting** uses actual Date objects for accuracy
- **Numeric columns** (Goal, Participants, Workouts, %) use integer comparison

### Data Attributes

Each table row stores data in `dataset` attributes for efficient client-side sorting:
```javascript
row.dataset.status = challenge.status;
row.dataset.startDate = challenge.start_date;
row.dataset.endDate = challenge.end_date;
row.dataset.goal = goal;
row.dataset.participants = participants;
row.dataset.totalWorkouts = totalWorkouts;
row.dataset.completionPct = completionPct;
```

---

## Section 2: Challenge Analytics (Selector + Stat Cards)

### Challenge Selector

**Dropdown Behavior**:
- Auto-populates with all challenges on page load
- Shows format: `Challenge Name (status)`
- **Auto-selects active challenge** if one exists
- Changing selection triggers `loadChallengeAnalytics()`

**Data Flow**:
```
1. User selects challenge from dropdown
2. Frontend fetches two APIs in parallel:
   - getChallengeAnalytics(challengeId)
   - getChallengeTimeSeriesData(challengeId)
3. Update stat cards with analytics data
4. Render both Chart.js visualizations
5. Show sections (hidden until challenge selected)
```

### Stat Card 1: Total Workouts

**Display**: Large number (e.g., "247")
**Source**: `analytics.total_completions`
**Calculation**: Count of all rows in Completions sheet where `challenge_id` matches
**Meta Text**: "Logged by all participants"

### Stat Card 2: Participants

**Display**: Large number (e.g., "18")
**Source**: `analytics.unique_participants`
**Calculation**: Count of unique `user_id` values in Completions for this challenge
**Meta Text**: "Unique users on teams"

### Stat Card 3: Goal Progress

**Display**: Percentage (e.g., "82%")
**Source**: Calculated from `analytics.total_completions` and `timeSeriesData.goal`
**Calculation**: `Math.round((completions / goal) × 100)`
**Meta Text**: Shows fraction (e.g., "247 / 300 workouts")

### Stat Card 4: Days Remaining

**Display**: Number or status text
**Source**: Calculated from `timeSeriesData.end_date` and current date
**Calculation**: `Math.ceil((endDate - today) / (1000 × 60 × 60 × 24))`
**Dynamic Display**:
- **Positive number**: "15" with meta "15 days until Dec 31, 2025"
- **Zero**: "Today!" with meta "Challenge ends today"
- **Negative**: "Ended" with meta "Ended 5 days ago"

---

## Section 3: Workouts Over Time (Trend Line Chart)

### Chart Configuration

**Chart Type**: Line chart (Chart.js)
**Canvas ID**: `trendChart`
**Height**: 300px
**Instance Variable**: `trendChartInstance` (destroyed and recreated on challenge change)

### Data Structure

**API Endpoint**: `getChallengeTimeSeriesData(challengeId)`

**Response Format**:
```javascript
{
  challenge_id: "dd_dec2025",
  start_date: "2025-12-01",
  end_date: "2025-12-31",
  goal: 300,
  time_series: [
    { date: "2025-12-01", daily_count: 12, cumulative_count: 12 },
    { date: "2025-12-02", daily_count: 8, cumulative_count: 20 },
    { date: "2025-12-03", daily_count: 0, cumulative_count: 20 },
    // ... entry for EVERY day in challenge date range
  ]
}
```

**Key Feature**: Time series includes entry for every day from `start_date` to `end_date`, even days with 0 workouts. This ensures:
- Continuous line chart with no gaps
- Accurate cumulative progression
- Correct X-axis date labels

### Chart Elements

**Dataset 1: Cumulative Workouts** (Blue Line)
- **Data**: `cumulative_count` from each time series entry
- **Color**: `#3B82F6` (blue)
- **Style**: 3px solid line, filled area with 0.1 opacity
- **Tension**: 0.1 (slight curve for visual appeal)

**Dataset 2: Goal Line** (Red Dashed Line)
- **Data**: Array of same goal value repeated for all dates
- **Color**: `#EF4444` (red)
- **Style**: 2px dashed line (5px dash, 5px gap)
- **Points**: Hidden (`pointRadius: 0`)

### Axes Configuration

**X-Axis (Dates)**:
- **Labels**: Formatted dates (e.g., "Dec 1, 2025")
- **Rotation**: 45° for readability
- **Auto-skip**: Chart.js automatically limits to ~15 labels
- **Max Ticks**: 15 (prevents overcrowding on long challenges)

**Y-Axis (Workout Count)**:
- **Starting Point**: 0 (always shows baseline)
- **Precision**: 0 (no decimal places)
- **Auto-scale**: Chart.js determines max based on higher of goal or actual

### Interactive Features

- **Hover tooltips**: Show date and exact cumulative count
- **Responsive**: Maintains aspect ratio on window resize
- **Legend**: Top position, shows both datasets

### Use Cases

1. **Progress Monitoring**: See if team is on pace to hit goal (compare blue line to red line)
2. **Screenshot Sharing**: Take screenshot to share in Slack/email for motivation
3. **Trend Analysis**: Identify slow periods or acceleration points
4. **Post-Challenge Review**: Analyze completion patterns for future planning

---

## Section 4: Workouts by Team (Bar Chart)

### Chart Configuration

**Chart Type**: Vertical bar chart (Chart.js)
**Canvas ID**: `teamChart`
**Height**: 300px
**Instance Variable**: `teamChartInstance` (destroyed and recreated on challenge change)

### Data Structure

**API Endpoint**: `getChallengeAnalytics(challengeId)`

**Relevant Response Field**:
```javascript
{
  challenge_id: "dd_dec2025",
  team_totals: {
    "Team A": 85,
    "Team B": 72,
    "Team C": 90
  }
  // ... other analytics data
}
```

### Chart Elements

**X-Axis**: Team names (extracted from `Object.keys(team_totals)`)
**Y-Axis**: Workout counts (extracted from `Object.values(team_totals)`)
**Bars**: Color-coded using default palette (see below)

### Color Palette

Currently uses **default 8-color palette** (future enhancement: fetch actual team colors from Challenge_Teams sheet):

```javascript
const baseColors = [
  'rgba(239, 68, 68, 0.8)',   // Red
  'rgba(59, 130, 246, 0.8)',  // Blue
  'rgba(34, 197, 94, 0.8)',   // Green
  'rgba(251, 191, 36, 0.8)',  // Yellow
  'rgba(168, 85, 247, 0.8)',  // Purple
  'rgba(249, 115, 22, 0.8)',  // Orange
  'rgba(236, 72, 153, 0.8)',  // Pink
  'rgba(20, 184, 166, 0.8)'   // Teal
];
```

Colors assigned in order of `Object.keys(team_totals)` array.

### Axes Configuration

**X-Axis (Team Names)**:
- Team names displayed as labels
- Sorted alphabetically (determined by object key order)

**Y-Axis (Workout Counts)**:
- **Starting Point**: 0 (always shows baseline)
- **Precision**: 0 (no decimal places)
- **Auto-scale**: Chart.js determines max based on highest team total

### Interactive Features

- **Hover tooltips**: Show team name and exact workout count
- **Responsive**: Maintains aspect ratio on window resize
- **No legend**: Team names on X-axis make legend redundant

### Use Cases

1. **Team Comparison**: Quickly identify high/low performing teams
2. **Encouragement**: See which teams need motivation
3. **Balance Check**: Verify team sizes are relatively equal (if using team member count)
4. **Celebration**: Recognize top-performing teams

---

## Backend API Reference

### Endpoint 1: `getChallengeAnalytics`

**Location**: `backend/Code.gs` (lines 142-149)
**Method**: GET
**Function Called**: `getChallengeStats(challengeId)` from `AdminChallenges.gs`

**Request**:
```javascript
GET API_URL?action=getChallengeAnalytics&challengeId=dd_dec2025
```

**Response**:
```javascript
{
  challenge_id: "dd_dec2025",
  total_completions: 247,
  unique_participants: 18,
  team_totals: {
    "Team A": 85,
    "Team B": 72,
    "Team C": 90
  },
  workout_types: {
    prescribed: 180,
    other: 45,
    ai: 22
  },
  daily_breakdown: {
    "2025-12-01": 12,
    "2025-12-02": 8,
    "2025-12-03": 15
    // ... sparse object (only days with completions)
  }
}
```

**Data Sources**:
- Completions sheet (filtered by `challenge_id`)
- All calculations done server-side

**Performance**: ~1-2 seconds for challenges with 500+ completions

### Endpoint 2: `getChallengeTimeSeriesData`

**Location**: `backend/Code.gs` (lines 151-158)
**Function**: `getChallengeTimeSeriesData(challengeId)` from `AdminChallenges.gs` (lines 388-463)

**Request**:
```javascript
GET API_URL?action=getChallengeTimeSeriesData&challengeId=dd_dec2025
```

**Response**:
```javascript
{
  challenge_id: "dd_dec2025",
  start_date: "2025-12-01",
  end_date: "2025-12-31",
  goal: 300,
  time_series: [
    { date: "2025-12-01", daily_count: 12, cumulative_count: 12 },
    { date: "2025-12-02", daily_count: 8, cumulative_count: 20 },
    { date: "2025-12-03", daily_count: 0, cumulative_count: 20 },
    // ... entry for ALL days (including 0-count days)
  ]
}
```

**Key Algorithm**:
1. Fetch challenge date range from Challenges sheet
2. Count workouts by date from Completions sheet (sparse)
3. Build complete time series for every day in range
4. Calculate cumulative total running forward

**Data Sources**:
- Challenges sheet (for date range and goal)
- Completions sheet (for daily workout counts)

**Performance**: ~2-3 seconds for 30-day challenges with 500+ completions

---

## Frontend API Wrappers

**Location**: `admin/admin-api.js` (lines 204-223)

### Wrapper 1: `getChallengeAnalytics(challengeId)`

```javascript
async getChallengeAnalytics(challengeId) {
  return this.get('getChallengeAnalytics', { challengeId });
}
```

**Usage**:
```javascript
const analytics = await ADMIN_API.getChallengeAnalytics('dd_dec2025');
console.log(analytics.total_completions); // 247
console.log(analytics.team_totals); // { "Team A": 85, ... }
```

### Wrapper 2: `getChallengeTimeSeriesData(challengeId)`

```javascript
async getChallengeTimeSeriesData(challengeId) {
  return this.get('getChallengeTimeSeriesData', { challengeId });
}
```

**Usage**:
```javascript
const timeSeriesData = await ADMIN_API.getChallengeTimeSeriesData('dd_dec2025');
console.log(timeSeriesData.goal); // 300
console.log(timeSeriesData.time_series.length); // 31 (for December)
```

---

## JavaScript Functions Reference

### Page Initialization

**Function**: `DOMContentLoaded` event listener
**Location**: `challenges.html` (lines ~190)

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    await loadAllChallenges();
    await populateChallengeSelector();
});
```

**Flow**:
1. Wait for DOM to be ready
2. Load all challenges and populate summary table
3. Populate dropdown selector (auto-select active challenge)
4. If active challenge selected, auto-load analytics

### Core Functions

#### `loadAllChallenges()`

**Purpose**: Fetch all challenges and populate summary table
**API Calls**: `getAllChallenges()`, then `getChallengeAnalytics()` for each
**Performance**: Parallel loading with `Promise.all()`

**Steps**:
1. Fetch all challenges from Challenges sheet
2. Fetch analytics for each challenge in parallel
3. Build table row for each challenge
4. Append rows to table body
5. Sort by status (active first)

#### `buildChallengeTableRow(challenge, analytics)`

**Purpose**: Generate table row HTML for a single challenge
**Parameters**:
- `challenge`: Challenge object from Challenges sheet
- `analytics`: Analytics object from getChallengeAnalytics

**Returns**: HTMLTableRowElement with data attributes set

#### `populateChallengeSelector()`

**Purpose**: Populate dropdown with all challenges
**Auto-Select Logic**: Sets `option.selected = true` if `challenge.status === 'active'`

#### `loadChallengeAnalytics()`

**Purpose**: Fetch analytics and render charts for selected challenge
**Triggered By**: Dropdown `onchange` event

**Steps**:
1. Get selected challengeId from dropdown
2. If empty, hide all sections and return
3. Fetch analytics and time series in parallel
4. Update stat cards
5. Render both charts
6. Show sections

#### `updateStatCards(analytics, timeSeriesData)`

**Purpose**: Update 4 stat card values and meta text
**Parameters**: Analytics and time series objects

#### `renderTrendChart(timeSeriesData)`

**Purpose**: Create/update Chart.js line chart
**Steps**:
1. Destroy existing chart instance if exists
2. Extract dates and cumulative counts from time series
3. Create goal line array (flat line at goal value)
4. Configure Chart.js with 2 datasets
5. Render chart

#### `renderTeamChart(analytics)`

**Purpose**: Create/update Chart.js bar chart
**Steps**:
1. Destroy existing chart instance if exists
2. Extract team names and workout counts from team_totals
3. Generate color palette
4. Configure Chart.js with 1 dataset
5. Render chart

#### `sortTable(columnIndex)`

**Purpose**: Sort table by clicked column
**Logic**:
- Toggle sort direction if same column clicked twice
- Custom sorting for status column (active → upcoming → completed)
- Date sorting uses actual Date objects
- Numeric sorting for goal, participants, workouts, percentage

#### `generateTeamColors(count)`

**Purpose**: Return array of colors for team bars
**Returns**: First `count` colors from base palette

#### `formatDate(dateStr)`

**Purpose**: Format date string for display
**Format**: "Dec 1, 2025" (using `toLocaleDateString`)

#### `showAlert(message, type)`

**Purpose**: Display temporary alert message
**Types**: `info`, `success`, `error`
**Duration**: Auto-dismiss after 5 seconds

---

## Chart.js Integration

### CDN Link

**Location**: `challenges.html` `<head>` section
**Version**: 4.4.0
**URL**: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js`

### Chart Lifecycle

1. **Initialization**: Chart instance created when challenge selected
2. **Destruction**: Previous instance destroyed before creating new one (prevents memory leaks)
3. **Update**: Charts recreate on challenge selection change

### Memory Management

```javascript
// Destroy existing chart before creating new one
if (trendChartInstance) {
    trendChartInstance.destroy();
}

// Create new chart
trendChartInstance = new Chart(ctx, config);
```

### Responsive Behavior

- **`responsive: true`**: Chart resizes with window
- **`maintainAspectRatio: false`**: Uses canvas height (300px)
- **Mobile**: Charts stack vertically on small screens (CSS handles layout)

---

## Common Tasks

### View All Challenge History

1. Navigate to `/admin/challenges.html`
2. Summary table automatically loads all challenges
3. Click column headers to sort by any metric
4. Review completion percentages to assess challenge difficulty

### Analyze Active Challenge

1. Navigate to `/admin/challenges.html`
2. Dropdown auto-selects active challenge
3. Review 4 stat cards for quick overview
4. Check "Days Remaining" to assess urgency
5. Scroll to trend chart to see if on pace for goal

### Generate Report for Team Chat

1. Navigate to `/admin/challenges.html`
2. Select challenge from dropdown
3. Scroll to "Workouts Over Time" chart
4. Take screenshot (Cmd+Shift+4 on Mac)
5. Share screenshot in Slack/email with motivational message

### Compare Team Performance

1. Navigate to `/admin/challenges.html`
2. Select challenge from dropdown
3. Scroll to "Workouts by Team" chart
4. Identify low-performing teams
5. Consider sending encouragement emails or Slack messages

### Review Past Challenge

1. Navigate to `/admin/challenges.html`
2. Select completed challenge from dropdown
3. Review completion percentage (did we hit goal?)
4. Check team distribution (were teams balanced?)
5. Use insights to inform next challenge planning

---

## Troubleshooting

### Table Shows "Loading challenges..." Forever

**Cause**: API request failing
**Check**:
1. Open browser console (F12)
2. Look for network errors
3. Verify `config.js` has correct API_URL
4. Check Apps Script deployment is active

**Fix**: Update API_URL in both `config.js` and `admin/admin-config.js`

### Charts Not Rendering (Blank Canvas)

**Cause**: Chart.js not loading or API data malformed
**Check**:
1. Browser console for Chart.js errors
2. Network tab - verify getChallengeTimeSeriesData returns data
3. Verify time_series array has entries

**Fix**:
- Check internet connection (Chart.js CDN must load)
- Verify challenge has completions data

### Dropdown Empty

**Cause**: getAllChallenges returning no data
**Check**:
1. Verify Challenges sheet has rows
2. Check API response in network tab

**Fix**: Add challenges to Challenges sheet via "A8 Custom Menu" → "Create New Challenge"

### Stat Cards Show "0" or "--"

**Cause**: Selected challenge has no completions yet
**Expected Behavior**: New/upcoming challenges naturally show 0 workouts

**Fix**: Not an error - cards will populate as users log workouts

### Sort Not Working

**Cause**: Data attributes not set on table rows
**Check**: Inspect table row HTML, verify `data-*` attributes exist

**Fix**: Ensure `buildChallengeTableRow()` sets all dataset properties

### Teams Not Showing in Bar Chart

**Cause**: Challenge has no team assignments
**Check**: Challenge_Teams sheet for matching `challenge_id` entries

**Fix**: Assign users to teams using "A8 Custom Menu" → "Set Placeholder Teams"

---

## Future Enhancements

### Planned Features

1. **CSV Export**: Download challenge summary table as spreadsheet
2. **Team Color Integration**: Fetch actual team colors from Challenge_Teams sheet
3. **Participant Breakdown Table**: Show individual user workout counts per challenge
4. **Screenshot Button**: Auto-generate PNG of charts without manual screenshot
5. **Comparison Mode**: Select 2 challenges to view side-by-side
6. **Team Drill-Down**: Click team bar to see individual member performance
7. **Date Range Filter**: Filter summary table by date ranges
8. **Print-Friendly View**: CSS media queries for clean printed reports

### API Enhancements

1. **`getChallengeParticipants(challengeId)`**: Return array of users with workout counts
2. **`getTeamColors(challengeId)`**: Fetch team colors from Challenge_Teams sheet
3. **`exportChallengeSummary()`**: Generate CSV file server-side

### UI Enhancements

1. **Loading Spinners**: Show animated loading state during API calls
2. **Empty State Messages**: Friendly messages for challenges with 0 data
3. **Mobile Optimizations**: Better chart sizing on phones
4. **Dark Mode**: Optional dark theme for late-night admin work

---

## Related Documentation

- **[CHANGELOG.md](../CHANGELOG.md)**: Version history including Challenge Analytics feature (Nov 21, 2025)
- **[CLAUDE.md](../CLAUDE.md)**: Main project documentation with API reference
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)**: Complete admin procedures including challenge creation
- **[BACKEND.md](BACKEND.md)**: Detailed backend function documentation
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)**: Testing procedures for new features

---

## Maintenance Notes

### When Adding New Challenges

No changes needed to the Challenges page - it automatically:
- Fetches new challenges from Challenges sheet
- Includes them in summary table
- Adds them to dropdown selector

### When Modifying Challenge Data

The page uses **live data** - no caching:
- Refresh browser to see updated data
- Summary table recalculates on each page load
- Charts regenerate on each selection

### When Updating Backend

If backend API changes:
1. Update API wrappers in `admin/admin-api.js`
2. Update function calls in `challenges.html`
3. Test with browser console open
4. Update this documentation

### Cache-Busting

When deploying frontend changes:
1. Update version in `challenges.html` script tags:
   ```html
   <script src="admin-config.js?v=20251121-X"></script>
   <script src="admin-api.js?v=20251121-X"></script>
   ```
2. Match version across all admin HTML files
3. Deploy via `./deploy.sh`

---

**End of Guide**
