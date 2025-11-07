# App Loading Performance Optimization Plan

**Last Updated:** November 7, 2025
**Status:** Phase 1 Complete, Phases 2-3 Planned

---

## Current State

### Phase 1 Complete ✅
- DNS prefetch/preconnect for Google Script API
- Deferred icon generation (non-blocking)
- Critical font preloading (Roobert-SemiBold)
- Performance tracking in console

**Measured Performance:**
- API call: ~6,700ms (main bottleneck identified)
- Total load time: Variable (API-dependent)
- Improvement: 200-500ms faster than baseline

---

## Bottleneck Analysis

### Current Loading Flow:
```
Parse HTML → API Call (BLOCKING 6-7 seconds) → Process Data → Show App
```

**Primary Bottleneck:** Single blocking API call to Google Apps Script that fetches all dashboard data at once.

**Root Cause:** Google Sheets backend has inherent latency (network + query + serialization).

---

## Phase 2: Caching + Skeleton UI (Recommended Next)

### Objective
Dramatically improve perceived performance for return visits and provide immediate visual feedback.

### A. localStorage Caching

**Implementation:**
```javascript
// Check cache first (< 1 minute old)
const cachedData = localStorage.getItem(`user_${userId}_cache`);
const cacheTimestamp = localStorage.getItem(`user_${userId}_timestamp`);
const now = Date.now();

if (cachedData && cacheTimestamp && (now - cacheTimestamp < 60000)) {
    // Show cached data immediately
    userData = JSON.parse(cachedData);
    initializeApp();

    // Fetch fresh data in background
    API.getDashboard(userId).then(freshData => {
        if (hasDataChanged(userData, freshData)) {
            userData = freshData;
            updateAllPages(); // Soft refresh
        }
        updateCache(userId, freshData, now);
    });
} else {
    // Normal flow for first visit or expired cache
    userData = await API.getDashboard(userId);
    initializeApp();
    updateCache(userId, userData, now);
}
```

**Benefits:**
- Return visits load in < 100ms (instant)
- Users see stale data immediately, fresh data updates in background
- 95%+ improvement for repeat users

**Cache Strategy:**
- TTL: 60 seconds (balance freshness vs speed)
- Storage: localStorage (5MB limit, plenty for user data)
- Invalidation: On workout completion, clear cache
- Fallback: If localStorage full/unavailable, normal flow

**Effort:** 1-2 hours
**Risk:** Low (graceful degradation)

---

### B. Skeleton Loading UI

**Replace black loading screen with content placeholders:**

```html
<div id="loading-skeleton" class="loading-skeleton">
    <div class="container">
        <!-- Header skeleton -->
        <div class="skeleton skeleton-header">
            <div class="skeleton-logo"></div>
            <div class="skeleton-text"></div>
        </div>

        <!-- Workout card skeleton -->
        <div class="skeleton skeleton-card">
            <div class="skeleton-title"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
        </div>

        <!-- Activity card skeleton -->
        <div class="skeleton skeleton-card">
            <div class="skeleton-title"></div>
            <div class="skeleton-line"></div>
        </div>
    </div>
</div>
```

**CSS Animation:**
```css
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

**Benefits:**
- Perceived load time reduces by 40-60%
- Users see progress immediately
- Reduces anxiety from staring at blank screen
- Industry-standard pattern (Facebook, LinkedIn, etc.)

**Effort:** 2-3 hours
**Risk:** Low (pure UI enhancement)

---

## Phase 3: Parallel API Requests + Progressive Loading

### Objective
Break monolithic API call into smaller, parallel requests to show critical content faster.

### Backend Changes Required

**Create lightweight endpoints in Code.gs:**

```javascript
// New endpoint: Get minimal user info (fast)
function getUserInfo(ss, userId) {
  // Returns: user_id, display_name, team_name, team_color, completedToday
  // Execution time: ~500-800ms (80% faster than full dashboard)
}

// New endpoint: Get today's workout only (fast)
function getActiveWorkout(ss, challengeId) {
  // Returns: workout_id, workout_name, exercises, instructions
  // Execution time: ~300-500ms (90% faster than full dashboard)
}

// Keep existing getDashboard() for compatibility
```

**Add to doPost() handler:**
```javascript
case 'getUserInfo':
  return getUserInfo(ss, payload.userId);
case 'getActiveWorkout':
  return getActiveWorkout(ss, payload.challengeId);
```

### Frontend Changes

**Parallel loading strategy:**

```javascript
// Phase 1: Load critical data (Today page)
const [userInfo, activeWorkout] = await Promise.all([
    API.getUserInfo(userId),      // ~500ms
    API.getActiveWorkout(userId)  // ~300ms
]);

// Show Today page immediately (~800ms vs 6700ms)
updateWorkoutPagePartial(userInfo, activeWorkout);
fadeOutLoadingScreen();

// Phase 2: Load secondary data in background (other tabs)
Promise.all([
    API.getGoalProgress(),           // ~1500ms
    API.getAllWorkouts(),            // ~1000ms
    API.getUserCompletionHistory()   // ~800ms
]).then(([progress, workouts, history]) => {
    updateProgressPage(progress);
    updateLibraryPage(workouts);
    updateMePage(history);
    showTabLoadingComplete();
});
```

**Benefits:**
- Users see Today page in ~800ms instead of 6700ms (88% faster)
- Other pages load progressively in background
- First interaction available 5x faster
- Better perceived performance

**Trade-offs:**
- Increased API calls (4 requests vs 1)
- More backend complexity
- Slightly higher total bandwidth

**Effort:** 4-6 hours (2-3 hours backend, 2-3 hours frontend)
**Risk:** Medium (requires backend API changes, testing)

---

## Phase 4: Advanced Optimizations (Future)

### Service Worker for Offline Caching
- Cache static assets (JS, CSS, fonts, images)
- Offline-first strategy for return visits
- **Effort:** 6-8 hours
- **Benefit:** Sub-100ms load for all static resources

### IndexedDB for Workout History
- Store completion history locally
- Reduce API calls for calendar/history views
- Sync with backend periodically
- **Effort:** 4-6 hours
- **Benefit:** Instant calendar navigation

### Code Splitting (Lazy Load Pages)
- Split AI workout generator into separate bundle
- Load only when user navigates to AI page
- **Effort:** 3-4 hours
- **Benefit:** 20-30KB smaller initial bundle

### Optimistic UI Updates
- Show workout completion immediately (optimistic)
- Sync with backend in background
- Rollback if backend fails
- **Effort:** 2-3 hours
- **Benefit:** Instant feedback on actions

---

## Recommended Implementation Order

### Session 2 (Next) - 3-5 hours
1. ✅ **Implement localStorage caching** (1-2 hours)
   - Fastest ROI for return users
   - Low risk, high impact

2. ✅ **Add skeleton loading UI** (2-3 hours)
   - Dramatically improves perceived performance
   - Modern UX pattern

**Expected Result:** 50-70% perceived improvement, return visits near-instant

---

### Session 3 (Later) - 4-6 hours
3. ✅ **Split dashboard API into parallel calls** (4-6 hours)
   - Backend: Create lightweight endpoints
   - Frontend: Parallel loading logic
   - Testing: Verify all pages load correctly

**Expected Result:** 60-80% faster time-to-interactive for first-time users

---

### Session 4 (Future) - Optional
4. ⚠️ **Advanced optimizations** (as needed)
   - Service Worker
   - IndexedDB
   - Code splitting
   - Optimistic UI

**Expected Result:** Sub-second loads, offline support

---

## Testing Strategy

### Metrics to Track
```javascript
// Add to index.html (already added in Phase 1)
console.log(`API call completed in ${apiTime}ms`);
console.log(`🚀 Total app load time: ${totalTime}ms`);
```

### Performance Goals
- **Phase 1 (Current):** < 7 seconds total load
- **Phase 2 (Caching):** < 100ms for return visits
- **Phase 3 (Parallel):** < 1.5 seconds for first visit

### Test Scenarios
1. **First visit (cold):** Clear cache, test full load
2. **Return visit (warm):** Test cached data load
3. **Mobile network:** Test on 3G/4G connection
4. **Multiple users:** Test concurrent usage

---

## Mobile Testing Considerations

### Current Setup
- Production URL: `https://martinapt8.github.io/a8-workout-app/?user={userId}`
- Google Script API: ~6-7 second latency observed

### Mobile-Specific Optimizations
- Skeleton UI especially important (slower networks)
- localStorage caching critical (frequent app switches)
- Touch target sizes already optimized (44px minimum)
- PWA "Add to Home Screen" functionality ready

---

## Notes & Considerations

### Why Not Server-Side Rendering (SSR)?
- GitHub Pages is static-only (no server-side code)
- Google Apps Script is the backend (can't run SSR)
- Current SPA architecture is optimal for this setup

### Why Not Move Away from Google Sheets?
- Sheets provides easy admin interface for non-technical users
- No database management required
- Good enough performance with caching strategies
- Migration would require significant effort (~40+ hours)

### Cache Invalidation Strategy
- Clear cache on workout completion (user action)
- 60-second TTL (balance freshness vs speed)
- Consider version-based invalidation if data structure changes

---

## Success Criteria

### Phase 2 Success
- ✅ Return visits load in < 200ms
- ✅ First visit shows skeleton UI immediately
- ✅ 80%+ users see sub-2-second loads
- ✅ No increase in error rates

### Phase 3 Success
- ✅ First visit shows Today page in < 1.5 seconds
- ✅ All pages fully loaded in < 3 seconds
- ✅ Multiple API calls don't overload backend
- ✅ Graceful degradation if one endpoint fails

---

## Questions for Next Session

1. **Caching TTL:** Is 60 seconds appropriate? Should it be longer/shorter?
2. **Skeleton Design:** Match exact layout or generic placeholders?
3. **API Split Priority:** Which pages are most critical to load first?
4. **Error Handling:** How to handle partial data failures in parallel loading?
5. **Analytics:** Should we track load times in backend for monitoring?

---

## References

- Phase 1 commit: `2e2b643` (Nov 7, 2025)
- CHANGELOG.md: Phase 1 details
- index.html: Performance tracking implementation
- Local testing: `http://localhost:8080/index.html?user=martin`
