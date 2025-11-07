# Phase 5: Past Challenge History Feature

**Purpose**: Add "Past Challenges" section to Me page showing user's historical performance
**File**: index.html
**Estimated Time**: 1 hour
**Status**: Implementation Guide

---

## Overview

Users can view their workout counts and team assignments from previous challenges on the Me page.

**Features**:
- Lists all challenges user participated in
- Shows workout count per challenge
- Shows team name and challenge dates
- Sorted by most recent first
- Year-round workouts shown separately

---

## SECTION 1: Add HTML Structure

**Location**: Find the Me page HTML section (search for `<div id="me-page"`)

**ADD AFTER** the calendar section and before backfill section:

```html
<!-- Past Challenges Section -->
<div style="margin-top: 30px; padding-top: 30px; border-top: 2px solid #E5E7EB;">
    <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #111827;">
        📊 Past Challenges
    </h3>

    <div id="past-challenges-container">
        <!-- Will be populated by JavaScript -->
        <p style="color: #9CA3AF; text-align: center;">Loading...</p>
    </div>
</div>
```

---

## SECTION 2: Add CSS Styles

**Location**: Find the `<style>` section in index.html

**ADD** these styles:

```css
/* Past Challenges Styles */
.past-challenge-card {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    transition: background 0.2s;
}

.past-challenge-card:hover {
    background: #F3F4F6;
}

.past-challenge-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.past-challenge-name {
    font-weight: 600;
    color: #111827;
    font-size: 16px;
}

.past-challenge-count {
    background: #FFC107;
    color: #000;
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
}

.past-challenge-details {
    display: flex;
    gap: 16px;
    font-size: 14px;
    color: #6B7280;
    flex-wrap: wrap;
}

.past-challenge-detail-item {
    display: flex;
    align-items: center;
    gap: 6px;
}

.year-round-badge {
    background: #E0F2FE;
    color: #0369A1;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

.empty-past-challenges {
    text-align: center;
    padding: 40px 20px;
    color: #9CA3AF;
}

.empty-past-challenges-icon {
    font-size: 48px;
    margin-bottom: 16px;
}
```

---

## SECTION 3: Add JavaScript Function to Fetch Data

**Location**: Add this function in the JavaScript section, after `updateMePage()` function

```javascript
/**
 * Load and display past challenge history
 */
function loadPastChallengeHistory() {
    const container = document.getElementById('past-challenges-container');

    if (!container) return;

    // Show loading state
    container.innerHTML = '<p style="color: #9CA3AF; text-align: center;">Loading past challenges...</p>';

    // Fetch past challenge stats from backend
    google.script.run
        .withSuccessHandler(function(challenges) {
            if (!challenges || challenges.length === 0) {
                container.innerHTML = `
                    <div class="empty-past-challenges">
                        <div class="empty-past-challenges-icon">📭</div>
                        <p><strong>No Past Challenges Yet</strong></p>
                        <p style="font-size: 14px;">Your challenge history will appear here</p>
                    </div>
                `;
                return;
            }

            // Build HTML for past challenges
            let html = '';

            challenges.forEach(challenge => {
                const isYearRound = challenge.challenge_id === 'year_round';

                html += `
                    <div class="past-challenge-card">
                        <div class="past-challenge-header">
                            <div class="past-challenge-name">
                                ${challenge.challenge_name}
                                ${isYearRound ? '<span class="year-round-badge">Year-Round</span>' : ''}
                            </div>
                            <div class="past-challenge-count">
                                ${challenge.workout_count} workout${challenge.workout_count !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div class="past-challenge-details">
                            ${challenge.team_name ? `
                                <div class="past-challenge-detail-item">
                                    <span>👥</span>
                                    <span>${challenge.team_name}</span>
                                </div>
                            ` : ''}
                            ${challenge.start_date && challenge.end_date ? `
                                <div class="past-challenge-detail-item">
                                    <span>📅</span>
                                    <span>${formatDateShort(challenge.start_date)} - ${formatDateShort(challenge.end_date)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        })
        .withFailureHandler(function(error) {
            console.error('Error loading past challenges:', error);
            container.innerHTML = `
                <div class="empty-past-challenges">
                    <p style="color: #EF4444;"><strong>Error loading past challenges</strong></p>
                    <p style="font-size: 14px;">${error.message || 'Please try refreshing the page'}</p>
                </div>
            `;
        })
        .getUserAllChallengeStats(currentUserId);
}

/**
 * Format date for display (MM/DD/YYYY)
 */
function formatDateShort(dateInput) {
    const date = new Date(dateInput);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}
```

---

## SECTION 4: Call Function on Page Load

**Location**: Find the `updateMePage()` function

**ADD** at the END of the function:

```javascript
function updateMePage() {
    if (!userData || !userData.user) return;

    // ... existing code for summary and calendar ...

    // ADDED: Load past challenge history
    loadPastChallengeHistory();
}
```

---

## SECTION 5: Update Navigation Handler

**Location**: Find the `showPage()` function or navigation handler

**VERIFY** that when Me page is shown, `updateMePage()` is called:

```javascript
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(pageName + '-page').classList.add('active');

    // Update navigation
    updateNavigation(pageName);

    // Update page content
    if (pageName === 'today') {
        updateTodayPage();
    } else if (pageName === 'team') {
        updateTeamPage();
    } else if (pageName === 'me') {
        updateMePage(); // This will call loadPastChallengeHistory()
    } else if (pageName === 'library') {
        updateLibraryPage();
    } else if (pageName === 'a8ai') {
        updateA8AIPage();
    }
}
```

---

## SECTION 6: Backend API Verification

**Verify** that Phase 3 backend changes include the `getUserAllChallengeStats()` function and it's accessible via API.

**Check Code.gs** has:
```javascript
function getUserAllChallengeStats(ss, userId) {
    // ... implementation ...
}
```

**Check doGet()** has the new API endpoint:
```javascript
case 'getUserAllChallengeStats':
    const statsUserId = e.parameter.userId;
    if (!statsUserId) {
        result = { error: 'Missing userId parameter' };
    } else {
        const ss2 = SpreadsheetApp.getActiveSpreadsheet();
        result = getUserAllChallengeStats(ss2, statsUserId);
    }
    break;
```

---

## SECTION 7: Testing

### Test Cases:

1. **User with Multiple Challenges**:
   - [ ] Navigate to Me page
   - [ ] Verify "Past Challenges" section loads
   - [ ] Verify challenges are sorted (most recent first)
   - [ ] Verify workout counts are accurate
   - [ ] Verify team names display
   - [ ] Verify dates display correctly

2. **User with One Challenge**:
   - [ ] Verify single challenge displays
   - [ ] No errors in console

3. **New User (No Past Challenges)**:
   - [ ] Verify empty state displays
   - [ ] Shows "No Past Challenges Yet" message
   - [ ] No errors in console

4. **User with Year-Round Workouts**:
   - [ ] Verify "Year-Round Workouts" card appears
   - [ ] Shows year-round badge
   - [ ] No team or date info (as expected)

5. **Loading States**:
   - [ ] Shows "Loading..." initially
   - [ ] Transitions to content smoothly

6. **Error Handling**:
   - [ ] If backend fails, shows error message
   - [ ] Error message is user-friendly

---

## SECTION 8: Mobile Responsiveness

Add responsive styles if needed:

```css
@media (max-width: 480px) {
    .past-challenge-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .past-challenge-details {
        flex-direction: column;
        gap: 8px;
    }

    .past-challenge-card {
        padding: 12px;
    }
}
```

---

## SECTION 9: Optional Enhancements

### Enhancement 1: Expand/Collapse Details

```javascript
// Add click handler to show/hide additional details
const card = document.createElement('div');
card.className = 'past-challenge-card';
card.onclick = function() {
    const details = this.querySelector('.past-challenge-details');
    details.style.display = details.style.display === 'none' ? 'flex' : 'none';
};
```

### Enhancement 2: Challenge Progress Bar

```javascript
// Add a mini progress bar showing percentage of goal achieved
if (challenge.total_goal) {
    const percentage = Math.round((challenge.workout_count / challenge.total_goal) * 100);
    html += `
        <div class="past-challenge-progress">
            <div class="progress-bar-mini" style="width: ${percentage}%"></div>
        </div>
    `;
}
```

### Enhancement 3: Ranking Badge

```javascript
// Show badge for top performers
if (challenge.rank === 1) {
    html += '<span class="rank-badge">🥇 Top Performer</span>';
}
```

---

## Implementation Checklist

- [ ] Add HTML structure to Me page (Section 1)
- [ ] Add CSS styles (Section 2)
- [ ] Add `loadPastChallengeHistory()` function (Section 3)
- [ ] Add `formatDateShort()` helper function (Section 3)
- [ ] Update `updateMePage()` to call new function (Section 4)
- [ ] Verify navigation handler (Section 5)
- [ ] Verify backend API endpoint exists (Section 6)
- [ ] Add mobile responsive styles (Section 8)
- [ ] Test all test cases (Section 7)
- [ ] Save index.html
- [ ] Deploy and test in production

---

## Rollback

If feature causes issues:

1. **Remove HTML section** added in Section 1
2. **Remove CSS styles** added in Section 2
3. **Remove** `loadPastChallengeHistory()` function
4. **Remove** function call from `updateMePage()`

---

*Last Updated: October 30, 2025*
