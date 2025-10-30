# Phase 8: Comprehensive Testing Checklist

**Purpose**: Thorough testing of multi-challenge architecture
**Estimated Time**: 2-3 hours
**When to Run**: After Phase 7 migration is complete and stable for 24 hours
**Status**: Testing Protocol

---

## Testing Strategy

This checklist covers:
1. **Basic Functionality** - Core features work
2. **Challenge Switching** - Multiple challenges function correctly
3. **Year-Round Logging** - Off-season mode works
4. **Edge Cases** - Boundary conditions and error handling
5. **Performance** - App remains fast with growing data
6. **Admin Functions** - Challenge management tools work
7. **User Experience** - Real-world usage scenarios

---

## Section 1: Basic Functionality Tests

### 1.1 Dashboard Loading
- [ ] App loads without errors
- [ ] Challenge name displays on Today page
- [ ] User greeting shows correct display name
- [ ] Team name and color display correctly
- [ ] Today's workout displays (if scheduled)
- [ ] Completion status shows ("✅ Completed Today" or "⏳ Not yet completed")
- [ ] No console errors (F12 → Console)

### 1.2 Workout Logging - Prescribed Workout
- [ ] "Complete Workout" button visible (if workout active)
- [ ] Click button → Success message appears
- [ ] Check Completions sheet:
  - [ ] New row added with today's timestamp
  - [ ] challenge_id = "daily_dose_oct2025"
  - [ ] workout_id matches active workout
- [ ] Completion status updates to "✅ Completed Today"
- [ ] Cannot log duplicate (button disabled or shows already completed)

### 1.3 Workout Logging - Other Workout
- [ ] "Log Other Workout" button visible
- [ ] Click button → Modal opens
- [ ] Enter description → Success message
- [ ] Check Completions sheet:
  - [ ] New row added
  - [ ] challenge_id = "daily_dose_oct2025"
  - [ ] workout_id = "Other Workout"
  - [ ] other_workout_details has description

### 1.4 Workout Logging - AI Workout
- [ ] Navigate to A8AI page
- [ ] Select time, difficulty, equipment
- [ ] Click "Generate Workout" → Workout displays
- [ ] Click "Log This Workout" → Success message
- [ ] Check Completions sheet:
  - [ ] New row added
  - [ ] challenge_id = "daily_dose_oct2025"
  - [ ] workout_id = "AI Workout"
  - [ ] other_workout_details has parameters

### 1.5 Goal Progress (Team Page)
- [ ] Team page loads
- [ ] Total completions count is accurate
- [ ] Goal progress percentage is correct
- [ ] Progress bar displays correct width
- [ ] Team totals show for each team
- [ ] Team totals sum to total completions
- [ ] Recent activity shows last 10 workouts
- [ ] Recent activity is ordered newest first

### 1.6 Me Page - Calendar
- [ ] Calendar displays current month
- [ ] Days with completed workouts show checkmark (✓)
- [ ] Days without workouts are empty
- [ ] Days outside challenge range are grayed out
- [ ] Calendar updates after logging workout

### 1.7 Me Page - Past Workout Logging
- [ ] "📅 Log Past Workout" section visible
- [ ] Date picker opens
- [ ] Select past date (within challenge)
- [ ] Enter workout details → Success message
- [ ] Check Completions sheet:
  - [ ] Row added with selected date
  - [ ] Timestamp set to 6 PM on selected date
  - [ ] challenge_id correct
- [ ] Cannot log future dates (validation error)
- [ ] Cannot log duplicate dates (validation error)
- [ ] Calendar updates with checkmark on selected date

### 1.8 Me Page - Past Challenges
- [ ] "📊 Past Challenges" section visible
- [ ] Shows daily_dose_oct2025 challenge
- [ ] Workout count is accurate
- [ ] Team name displays
- [ ] Challenge dates display
- [ ] If multiple challenges, sorted by most recent first

### 1.9 Library Page
- [ ] All workouts for current challenge display
- [ ] Workouts sorted by start_date (oldest to newest)
- [ ] Current workout highlighted with ⭐
- [ ] Past workouts labeled as past
- [ ] Upcoming workouts labeled as upcoming
- [ ] Click workout → Detail view opens
- [ ] Workout details show exercises, reps, alternatives
- [ ] Video links open in new tab (if present)
- [ ] Back button returns to library list

---

## Section 2: Challenge Switching Tests

### 2.1 Create Test Challenge
- [ ] Open Google Sheets → A8 Custom Menu → Create New Challenge
- [ ] Enter test details:
  - ID: test_challenge_nov2025
  - Name: Test Challenge
  - Start: 11/6/2025
  - End: 11/30/2025
  - Goal: 100
- [ ] Challenge created successfully
- [ ] Verify in Challenges sheet (new row added)

### 2.2 Assign Teams for Test Challenge
- [ ] Run AdminChallenges.gs → `copyTeamAssignments('daily_dose_oct2025', 'test_challenge_nov2025')`
- [ ] Verify in Challenge_Teams sheet:
  - [ ] New rows added for test_challenge_nov2025
  - [ ] Each user assigned to same team as October challenge

### 2.3 Add Test Workout
- [ ] Manually add row to Workouts sheet:
  - workout_id: test_workout_1
  - start_date: 11/6/2025
  - end_date: 11/8/2025
  - challenge_id: test_challenge_nov2025
  - workout_name: Test Workout
  - Add 2-3 exercises

### 2.4 Switch to Test Challenge
- [ ] A8 Custom Menu → Set Active Challenge
- [ ] Enter: test_challenge_nov2025
- [ ] Verify in Challenges sheet:
  - [ ] daily_dose_oct2025: is_active = FALSE, status = "completed"
  - [ ] test_challenge_nov2025: is_active = TRUE, status = "active"

### 2.5 Verify Frontend Updates
- [ ] Reload app (hard refresh: Ctrl/Cmd+Shift+R)
- [ ] Challenge name shows "Test Challenge"
- [ ] Team page shows goal 0/100
- [ ] Library page shows test_workout_1
- [ ] No workouts in recent activity (fresh challenge)
- [ ] Calendar is empty (no completions yet)

### 2.6 Log Workout in New Challenge
- [ ] Log "Other Workout" with description "Test for new challenge"
- [ ] Check Completions sheet:
  - [ ] challenge_id = "test_challenge_nov2025"
- [ ] Team page updates: 1/100 workouts

### 2.7 Switch Back to October Challenge
- [ ] A8 Custom Menu → Set Active Challenge
- [ ] Enter: daily_dose_oct2025
- [ ] Reload app
- [ ] Challenge name shows "The Daily Dose"
- [ ] Goal progress shows original totals (304+ workouts)
- [ ] Recent activity shows October workouts
- [ ] Test workout NOT visible (filtered out)

### 2.8 Verify Data Isolation
- [ ] October challenge data intact
- [ ] Test challenge workout visible only when test challenge active
- [ ] Goal progress calculates per challenge
- [ ] Team totals isolated by challenge

---

## Section 3: Year-Round Logging (Off-Season Mode)

### 3.1 Activate Off-Season Mode
- [ ] Open Challenges sheet
- [ ] Set ALL challenges is_active = FALSE
- [ ] Save sheet

### 3.2 Verify Off-Season UI
- [ ] Reload app (hard refresh)
- [ ] Challenge title shows "Off-Season"
- [ ] Off-season message displays
- [ ] Workout card is hidden (no prescribed workout)
- [ ] "Log Workout (Year-Round)" button visible
- [ ] Team page shows "No Active Challenge" message
- [ ] Library page shows "No Workouts Available"

### 3.3 Log Year-Round Workout
- [ ] Click "Log Workout (Year-Round)"
- [ ] Enter description "Off-season workout"
- [ ] Success message appears
- [ ] Check Completions sheet:
  - [ ] New row added
  - [ ] challenge_id = "year_round"
  - [ ] workout_id = "Other Workout"

### 3.4 Verify Year-Round Data
- [ ] Me page calendar shows checkmark for today
- [ ] Past challenges section shows year-round workouts separately
- [ ] Year-round badge displays

### 3.5 Re-Activate Challenge
- [ ] A8 Custom Menu → Set Active Challenge
- [ ] Select daily_dose_oct2025
- [ ] Reload app
- [ ] Normal challenge UI returns
- [ ] Year-round workout NOT counted in challenge goal
- [ ] Year-round workout visible in past challenges section

---

## Section 4: Edge Cases & Boundary Conditions

### 4.1 Timezone Boundary Testing
- [ ] **Setup**: Find a completion near midnight in your timezone
- [ ] Check Completions sheet: timestamp should match app timezone (Settings.timezone)
- [ ] Check Me page calendar: checkmark on correct date
- [ ] Log workout at 11:59 PM → Verify correct date
- [ ] Log workout at 12:01 AM next day → Verify correct date

### 4.2 Challenge Date Boundaries
- [ ] Create challenge ending today
- [ ] Verify workout logging works on last day
- [ ] Set challenge end date to yesterday
- [ ] Verify no active workout shows (challenge ended)
- [ ] Verify can still log "Other Workout" (year-round mode)

### 4.3 Duplicate Prevention
- [ ] Log workout today
- [ ] Try to log same workout type again
- [ ] Verify: Prevented or appropriate message
- [ ] Try to log different workout type (Other vs Prescribed)
- [ ] Verify: Allowed or prevented based on logic

### 4.4 Invalid Data Handling
- [ ] Create workout with invalid date (e.g., end_date before start_date)
- [ ] Verify: Admin function rejects or app handles gracefully
- [ ] Create challenge with negative goal
- [ ] Verify: Validation error
- [ ] Try to activate non-existent challenge
- [ ] Verify: Error message

### 4.5 New User Mid-Challenge
- [ ] Add new user to Users sheet (active_user = TRUE)
- [ ] Do NOT add to Challenge_Teams
- [ ] Load app with new user
- [ ] Log workout
- [ ] Verify: Auto-assigned to team (fallback logic)
- [ ] Check Challenge_Teams sheet: New row added

### 4.6 Missing Team Assignment
- [ ] Delete a user's row from Challenge_Teams
- [ ] Load app with that user
- [ ] Verify: Fallback to Users sheet team
- [ ] No errors or crashes

### 4.7 Overlapping Challenges
- [ ] Create two challenges with overlapping dates
- [ ] Set both to active
- [ ] Verify: Only first one actually active (or last one, based on logic)
- [ ] App does not crash

---

## Section 5: Performance Tests

### 5.1 Load Time Testing
- [ ] **Test 1**: Clear browser cache → Time page load
  - **Target**: < 2 seconds
  - **Actual**: _____ seconds
- [ ] **Test 2**: Refresh page → Time page load
  - **Target**: < 1 second
  - **Actual**: _____ seconds

### 5.2 Large Data Set
- [ ] **Completions sheet**: ~1000+ rows
- [ ] Load Team page (goal progress)
  - **Target**: < 3 seconds
  - **Actual**: _____ seconds
- [ ] Verify: challenge_id filtering reduces query time

### 5.3 Multiple Challenges (Scalability)
- [ ] Create 5 test challenges
- [ ] Load Library page
- [ ] Verify: Only current challenge workouts show
- [ ] Switch challenges rapidly
- [ ] Verify: No lag or errors

### 5.4 Calendar Rendering
- [ ] Me page calendar with 30 days of completions
- [ ] Verify: Calendar renders quickly
- [ ] Checkmarks all visible
- [ ] No UI slowdown

---

## Section 6: Admin Function Tests

### 6.1 Create New Challenge (Menu)
- [ ] A8 Custom Menu → Create New Challenge
- [ ] Complete all 5 prompts with valid data
- [ ] Verify: Challenge created in Challenges sheet
- [ ] Verify: Success message appears

### 6.2 Create Challenge (Invalid Data)
- [ ] Try to create with blank ID
- [ ] Verify: Error message
- [ ] Try to create with start_date after end_date
- [ ] Verify: Validation error
- [ ] Try to create with duplicate ID
- [ ] Verify: Error message

### 6.3 Set Active Challenge (Menu)
- [ ] A8 Custom Menu → Set Active Challenge
- [ ] View list of challenges
- [ ] Enter valid challenge ID
- [ ] Verify: Challenge activated
- [ ] Verify: Previous challenge deactivated

### 6.4 View Challenge Stats (Menu)
- [ ] A8 Custom Menu → View Challenge Stats
- [ ] Enter daily_dose_oct2025
- [ ] Verify: Stats display correctly
  - [ ] Total completions
  - [ ] Unique participants
  - [ ] Workout types breakdown
  - [ ] Team totals

### 6.5 End Challenge (Menu)
- [ ] Create test challenge
- [ ] A8 Custom Menu → End Challenge
- [ ] Select test challenge
- [ ] Confirm
- [ ] Verify: is_active = FALSE, status = "completed"

### 6.6 Bulk Team Assignment (Script)
- [ ] Run `exampleCreateDecemberChallenge()` in AdminChallenges.gs
- [ ] Verify: Challenge created
- [ ] Verify: Teams copied from previous challenge
- [ ] Check Challenge_Teams: All users assigned

---

## Section 7: User Experience Scenarios

### 7.1 New User Onboarding
- [ ] Add new user to Users sheet
- [ ] User opens app for first time
- [ ] Challenge displays correctly
- [ ] User logs first workout
- [ ] Me page shows 1 workout
- [ ] Calendar shows checkmark

### 7.2 Daily Active User
- [ ] User opens app in morning
- [ ] Sees today's workout
- [ ] Completes workout
- [ ] Checks team progress
- [ ] Views personal stats on Me page
- [ ] Everything loads smoothly

### 7.3 Catch-Up User (Backfill)
- [ ] User missed 3 days
- [ ] Opens Me page
- [ ] Uses backfill to log past workouts for 3 days
- [ ] Calendar updates with 3 checkmarks
- [ ] Goal progress increases by 3

### 7.4 Challenge Switcher
- [ ] Admin switches challenges mid-day
- [ ] User had already completed today
- [ ] User reloads app
- [ ] Completion status carries over (or resets, based on design)
- [ ] User is not confused
- [ ] Clear messaging

### 7.5 Mobile User
- [ ] Test on actual mobile device (iPhone/Android)
- [ ] All pages responsive
- [ ] Buttons tappable (44px minimum)
- [ ] Text readable
- [ ] Navigation works smoothly
- [ ] No horizontal scroll

---

## Section 8: Data Integrity Checks

### 8.1 No Data Loss
- [ ] Compare Completions count before/after migration
- [ ] All original workouts still present
- [ ] All users still present
- [ ] All teams still assigned

### 8.2 challenge_id Consistency
- [ ] All Workouts have challenge_id
- [ ] All Completions have challenge_id
- [ ] All Users have active_challenge_id (if active)
- [ ] No NULL or empty challenge_id values

### 8.3 Referential Integrity
- [ ] All challenge_id values in Completions exist in Challenges sheet
- [ ] All challenge_id values in Workouts exist in Challenges sheet
- [ ] All challenge_id values in Challenge_Teams exist in Challenges sheet
- [ ] All user_id values in Challenge_Teams exist in Users sheet

### 8.4 Historical Data Preserved
- [ ] Can query all past challenges
- [ ] Past challenge stats accurate
- [ ] Past team assignments intact
- [ ] Past workouts accessible via getChallengeStats()

---

## Section 9: Error Handling

### 9.1 Network Errors
- [ ] Simulate slow network (Chrome DevTools → Network → Slow 3G)
- [ ] App shows loading state
- [ ] Graceful timeout after reasonable period
- [ ] Error message is user-friendly

### 9.2 API Errors
- [ ] Temporarily break backend function (syntax error)
- [ ] Try to load dashboard
- [ ] Verify: Error message displays (not blank page)
- [ ] Fix backend → Reload → Works again

### 9.3 Missing Challenge
- [ ] Delete active challenge from Challenges sheet
- [ ] Reload app
- [ ] Verify: Off-season mode activates (not crash)

### 9.4 Browser Compatibility
- [ ] Test on Chrome/Edge (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest, Mac/iOS)
- [ ] All core features work across browsers

---

## Section 10: Rollback Testing

### 10.1 Test Rollback Script
**Only run in test environment / backup sheet**

- [ ] Run `rollbackMigration()` in MigrationScripts.gs
- [ ] Verify: challenge_id columns cleared
- [ ] Verify: Challenge_Teams rows removed
- [ ] Verify: Challenges sheet intact
- [ ] Verify: Original data (Users, Completions) intact

---

## Testing Summary

### Pass Criteria
App is production-ready if:
- ✅ All Section 1 (Basic Functionality) tests pass
- ✅ All Section 2 (Challenge Switching) tests pass
- ✅ All Section 3 (Year-Round Logging) tests pass
- ✅ 90%+ of Section 4 (Edge Cases) tests pass
- ✅ Performance targets met (Section 5)
- ✅ All Section 6 (Admin Functions) tests pass
- ✅ Data integrity verified (Section 8)

### Known Issues Log

| Issue # | Description | Severity | Status | Notes |
|---------|-------------|----------|--------|-------|
| 1 | | | | |
| 2 | | | | |

**Severity Levels**:
- **Critical**: Blocks core functionality, data loss risk
- **High**: Major feature broken, workaround exists
- **Medium**: Minor feature issue, low user impact
- **Low**: Cosmetic, edge case only

---

## Post-Testing Actions

### If All Tests Pass:
1. Document any workarounds or limitations
2. Update CLAUDE.md with new features
3. Prepare user announcement
4. Schedule launch
5. Monitor for 48 hours post-launch

### If Tests Fail:
1. Document failures in Known Issues table
2. Prioritize by severity
3. Fix critical/high issues
4. Re-test
5. Do NOT launch until critical issues resolved

---

## Long-Term Monitoring

### Week 1:
- [ ] Daily check for new issues
- [ ] Monitor Completions for correct challenge_id
- [ ] Check for user feedback

### Month 1:
- [ ] Review performance metrics
- [ ] Check data growth (Completions sheet size)
- [ ] Plan archival strategy if needed
- [ ] Create next challenge

---

*Last Updated: October 30, 2025*
