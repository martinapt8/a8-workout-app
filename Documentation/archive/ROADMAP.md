# A8 Workout Challenge App - Product Roadmap

**Last Updated:** November 1, 2025
**Current Version:** 3.0 (Multi-Challenge Architecture)
**Status:** Active Development

This roadmap outlines planned enhancements for the Daily Dose workout app, prioritized by implementation complexity and user value.

---

## Current State (V3)

The app is in production with multi-challenge support and the following features:
- 5-page navigation (Today, Team, Me, Library, A8AI)
- Prescribed and custom workout logging
- AI-powered workout generator (Claude API)
- Team progress tracking with collective goals
- Calendar-based completion history
- Past workout backfilling
- Branded loading screen and app icon

---

## Low-Hanging Fruit Enhancements

### Priority 1: Maintain Screen On (Wake Lock) ⭐ EASIEST

**Complexity:** Very Low
**Estimated Effort:** 15-30 minutes
**User Value:** High
**Status:** Planned

**Description:**
Prevent mobile screen from sleeping during active workouts using the Web Wake Lock API.

**Implementation Details:**
- Add "Keep Screen On" toggle button on Today page
- Use `navigator.wakeLock.request('screen')` API
- Auto-release wake lock when workout completes or user navigates away
- Graceful fallback for unsupported browsers
- ~30 lines of code total

**Technical Notes:**
- Requires HTTPS (already met via Google Apps Script deployment)
- User gesture required to activate (button click)
- Excellent mobile browser support (95%+)
- No backend changes needed

**Code Location:** `index.html` JavaScript section, workout completion flow

---

### Priority 2: Timer Function ⭐ VERY EASY

**Complexity:** Low
**Estimated Effort:** 45-60 minutes
**User Value:** High
**Status:** Planned

**Description:**
Add a workout timer that users can start during exercises with preset durations and custom input.

**Implementation Details:**
- Timer modal overlay (similar to existing library detail view pattern)
- Preset buttons: 30s, 1min, 2min, 5min, 10min
- Custom duration input field
- Start/pause/reset controls
- Sound/vibration notification when timer completes
- ~150 lines of code total

**Enhancement Options:**
- HIIT interval timer with work/rest cycles
- Save last-used timer preset
- Multiple simultaneous timers for complex workouts
- Visual pulse animation during final 10 seconds

**Technical Notes:**
- Leverages existing modal/overlay patterns
- Interval management pattern exists (AI loading tips)
- Browser tab inactive behavior consideration
- Sound notifications require user interaction first
- No backend changes needed

**Code Location:**
- HTML: Add timer modal to `index.html`
- JavaScript: Add timer controller with state management

---

### Priority 3: Log from Library ⭐⭐ MODERATE

**Complexity:** Moderate
**Estimated Effort:** 60-90 minutes
**User Value:** Medium-High
**Status:** Under Consideration

**Description:**
Allow users to log workouts directly from the Library page, not just view them.

**Implementation Details:**
- Add "Log This Workout" button in library detail view
- Pass specific `workout_id` to existing completion handler
- Reuse success/error feedback from Today page
- Prevent duplicate logging for same day
- Show clear confirmation of which workout will be logged
- ~80 lines of new/modified code

**User Flow:**
```
Library → Select Workout → View Details → "Log This Workout" Button
→ Completion Validation → Success Animation → Update UI
```

**Technical Notes:**
- Backend already supports via `markWorkoutComplete(workoutId)` parameter
- Requires passing workout context through UI layers
- Edge case handling: already completed today, workout date validation
- More testing needed for various scenarios

**Code Location:**
- Frontend: `index.html` library detail view (lines 888-937)
- Backend: `Code.gs` markWorkoutComplete() (already supports optional workoutId)

**Implementation Decision:** Hold until user demand is validated

---

## Quick Win Ideas (未实施)

These are additional simple enhancements identified during analysis:

| Enhancement | Effort | Value | Notes |
|------------|--------|-------|-------|
| **Workout completion confirmation** | 10 min | Medium | "Are you sure?" dialog to prevent accidental taps |
| **Manual refresh button** | 15 min | Low | Refresh data without page reload |
| **Workout notes field** | 30 min | Medium | Optional text note when completing workouts |
| **Sound on completion** | 20 min | Low | Brief sound effect for successful logging |
| **Progress % on Today page** | 15 min | Medium | Show "30% to goal" at top of Today page |
| **Dark mode toggle** | 60 min | Medium | User preference for dark theme |

---

## Recommended Implementation Sequence

If implementing all Priority 1-2 features:

### Phase 1: Immediate (Week 1)
1. **Wake Lock** (30 min) - Quick win, instant user satisfaction
2. **Timer** (60 min) - Natural complement to workouts

**Combined effort:** ~90 minutes for both features

### Phase 2: Validation (Week 2-3)
3. **Log from Library** (90 min) - Only if user feedback indicates demand
4. Selected **Quick Win Ideas** based on usage analytics

---

## Future Considerations (Ideas in Development)

This section is reserved for additional enhancement ideas currently under consideration:

- _Placeholder for future brainstorming_
- _Space for user feedback and requests_
- _Analytics-driven feature priorities_

### AI Workout Generator Enhancements

Potential improvements to the A8AI feature (from CLAUDE.md):
- Rate limiting (max AI workouts per user per day)
- Workout storage for analytics
- User feedback/rating system
- Prompt refinement based on usage patterns
- Cost tracking and monitoring
- Workout history view
- Favorite workouts feature

### General App Enhancements

Long-term ideas (from CLAUDE.md):
- Photo uploads for workouts
- Achievement badges
- Historical challenge archives
- Personal records tracking
- Rest day scheduling
- Injury modifications library

---

## Technical Debt & Maintenance

### Known Issues
- Google Apps Script banner cannot be removed (Google security requirement)
- Mobile browser variations in wake lock support

### Performance Optimizations
- Current caching strategy is sufficient
- Direct sheet reads are fast enough for current scale
- Client-side navigation minimizes page reloads

### Browser Compatibility
- Target: Modern mobile browsers (Chrome, Safari)
- Minimum support: iOS 14+, Android Chrome 80+
- Progressive enhancement for newer APIs

---

## Success Metrics

### Feature Success Criteria

**Wake Lock:**
- >70% of users activate wake lock during workouts
- Reduced mid-workout dropout rate

**Timer:**
- >50% of users utilize timer at least once per week
- Average 2-3 timer activations per workout session

**Log from Library:**
- >30% of workout logs come from library (not just Today page)
- Increased workout variety in user logs

### Overall App Health
- Daily active user rate: >60% of registered users
- Workout logging completion time: <30 seconds
- Mobile page load time: <2 seconds
- Zero critical bugs in production

---

## Version History

### Current Version: 3.0 (November 1, 2025)
**Major Release: Multi-Challenge Architecture**
- Multiple challenges with different teams and goals
- Year-round workout logging (off-challenge periods)
- Flexible team assignments per challenge
- Challenge management via admin menu
- 10-20x faster queries with challenge_id filtering
- Historical challenge data preservation
- Backward compatible with V2 data

### Version 2.0 (October 28, 2025)
- 5-page navigation system
- AI workout generator
- Branded loading screen and app icon
- Calendar-based completion history
- Past workout backfilling

### Previous Updates (V1-V2)
- **October 27, 2025:** Daily Dose logo integration
- **October 24, 2025:** A8AI Workout Generator added
- **October 17-24, 2025:** Expanded to 5-page navigation
- **October 15, 2025:** Past workout backfill feature

---

## Contributing Ideas

Have an enhancement idea? Consider:
1. **User Impact:** How many users benefit?
2. **Implementation Complexity:** How much effort required?
3. **Technical Feasibility:** Does it work within our stack?
4. **Maintenance Cost:** Will it require ongoing updates?

Document ideas in this ROADMAP.md under "Future Considerations" section.

---

## Contact & Feedback

Project Owner: A8 Team
Last Review: November 1, 2025 (V3 Multi-Challenge Release)
Next Review: TBD based on implementation progress
