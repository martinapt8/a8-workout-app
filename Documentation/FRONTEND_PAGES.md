# Frontend Pages Detailed UI Reference

This document provides detailed ASCII mockups of all five pages in the Daily Dose web app. These visual representations show the layout and components of each page.

## Overview

The app is a five-page SPA (Single Page Application) with mobile-first design:

1. **Today** - Default landing page with current workout
2. **Team** - Collective progress tracking
3. **Me** - Personal stats and calendar
4. **Library** - All workouts (past/current/future)
5. **A8AI** - AI workout generator

All pages feature bottom navigation with icons for quick switching between views.

---

## Page 1: Today (Default Landing)

```
┌─────────────────────────┐
│  A8 October Challenge   │
│  Hey 🎯 Megan!          │
│  ✅ Completed Today     │
├─────────────────────────┤
│  Today's Workout        │
│  Power Monday           │
│  Oct 1-3                │
│                         │
│  Complete all exercises │
│  back-to-back, rest 60  │
│  seconds between rounds │
│                         │
│  • Push-ups: 15         │
│    (or knee push-ups)   │
│  • Squats: 20           │
│    (or wall sits)       │
│                         │
│  [Complete Workout]     │
│  [Log Other Workout]    │
├─────────────────────────┤
│  Recent Activity        │
│  • Megan completed...   │
│  • Martin completed...  │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library] │
└─────────────────────────┘
```

**Key Components:**
- Challenge name and personal greeting (or "Off-Season Mode" during off-season)
- Completion status indicator (hidden during off-season)
- Current workout card with instructions (or off-season message card with "Log Workout (Year-Round)" button)
- Exercise list with alternatives
- Action buttons (Complete/Log Other)
- **Recent Activity feed** - Agency-wide workout feed that works year-round
  - Shows last 15 completions from ALL users across ALL challenges
  - Displays user names, workout descriptions, and timestamps
  - Works regardless of active challenge or user team status
  - Maintains community engagement even during off-season
- Bottom navigation bar (Team and Library hidden during off-season)

---

## Page 2: Team Progress

```
┌─────────────────────────┐
│  A8 October Challenge   │
├─────────────────────────┤
│  Total A8 Goal          │
│  60/200 workouts - 30%  │
│  ████████░░░░░░░░░░     │
├─────────────────────────┤
│  Team Totals:           │
│  Team Red: 20           │
│  Team Blue: 20          │
│  Team Green: 20         │
├─────────────────────────┤
│  My Team's Workouts     │
│  Team Red               │
│  ──────────────────     │
│  🎯 Megan          15   │
│  Alex              12   │
│  Jordan             8   │
│  Taylor             5   │
│  Sam                0   │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library] │
└─────────────────────────┘
```

**Key Components:**
- Challenge name and date range
- Total goal progress (number and percentage)
- Color-coded progress bar (green → blue → yellow → red based on % complete)
- **Team Totals** - Agency-wide team aggregates
- **My Team's Workouts** (NEW) - Individual team member breakdown
  - Shows user's specific team name (in team color)
  - Lists all team members alphabetically
  - Displays workout count per member (challenge-specific)
  - Includes members with 0 workouts
  - Only visible when user is assigned to a team in active challenge
- Bottom navigation bar

---

## Page 3: Me

```
┌─────────────────────────┐
│  My Summary             │
│  🎯 Megan - Team Red    │
│                         │
│    16      Oct 30  Sep 17│
│   Total     Last   Member│
│  Workouts Workout  Since │
├─────────────────────────┤
│  My Calendar            │
│  Oct 2025               │
│  Su Mo Tu We Th Fr Sa   │
│     1✓ 2✓ 3✓ 4  5       │
│   6✓ 7✓ 8  9✓10✓11✓     │
│  12✓13✓14✓15✓16✓        │
├─────────────────────────┤
│  📅 Log Past Workout    │
│  Date: [10/14 ▼]        │
│  Workout: [________]    │
│  [Log Past Workout]     │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library] │
└─────────────────────────┘
```

**Key Components:**
- Personal summary (name, team)
- **3-column stats grid** (NEW DESIGN - Nov 7, 2025):
  - **Bold values**: Dynamic data displayed prominently (16, Oct 30, Sep 17)
  - **Uniform labels**: Consistent weight/size with line breaks
  - **Compact layout**: Reduced vertical height while maintaining readability
  - Three metrics: Total Workouts, Last Workout, Member Since
- Multi-month calendar with navigation
- Checkmarks on completed dates
- Past workout backfill form
- Date picker and workout description input
- Bottom navigation bar

**Features:**
- Calendar navigation (prev/next month)
- Year rollover support (Dec ↔ Jan)
- Shows all workouts across all challenges
- Hybrid lazy loading (±3 months)
- Duplicate prevention per date
- Future date validation

---

## Page 4: Workout Library

```
┌─────────────────────────┐
│  Workout Library        │
├─────────────────────────┤
│  Past Workouts:         │
│  • Power Monday         │
│    Oct 1-3              │
│  • Core Burner          │
│    Oct 4-6              │
│                         │
│  Current Workout:       │
│  • Full Body ⭐         │
│    Oct 14-16            │
│                         │
│  Upcoming Workouts:     │
│  • HIIT Mix             │
│    Oct 17-19            │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library|🤖A8AI] │
└─────────────────────────┘
```

**Key Components:**
- Library title
- Three sections: Past, Current, Upcoming
- Workout names with date ranges
- Star indicator (⭐) for current workout
- Clickable workout cards (show full details)
- Dual back buttons for navigation
- Bottom navigation bar (5 tabs)

**Features:**
- Click workout to see full exercise list
- Skips workouts with invalid dates
- Sorted by start_date (oldest to newest)

---

## Page 5: A8AI Workout Generator

```
┌─────────────────────────┐
│  A8AI Workout Generator │
│  🤖                     │
├─────────────────────────┤
│  How much time do you   │
│  have?                  │
│  [10 min][15 min][20 min]│
│  ───────────            │
│  What difficulty level? │
│  [Beginner][Inter][Hard]│
│  ───────────            │
│  What equipment do you  │
│  have?                  │
│  [Bodyweight][Kettlebell]│
│  [Dumbbell][Bands]      │
│  [Full Gym]             │
│                         │
│  [Generate Workout 🤖]  │
├─────────────────────────┤
│  OR (after generation): │
├─────────────────────────┤
│  ## Warm-up (2 min)     │
│  • Arm circles          │
│  • Jumping jacks        │
│                         │
│  ## Main Workout        │
│  **Round 1:**           │
│  • Push-ups: 15 reps    │
│  • Squats: 20 reps      │
│                         │
│  [🔄 Refresh]           │
│  [⚙️ Change Options]    │
│  [Log This Workout]     │
├─────────────────────────┤
│  [💪Today|📈Team|👤Me|📚Library|🤖A8AI] │
└─────────────────────────┘
```

**Key Components:**
- Generator title and icon
- Parameter selection (button-based):
  - Time: 10/15/20 minutes
  - Difficulty: Beginner/Intermediate/Hard
  - Equipment: Bodyweight/Kettlebell/Dumbbell/Bands/Full Gym
- Generate button
- Generated workout display (markdown-formatted)
- Action buttons (Refresh/Change Options/Log)
- Bottom navigation bar (5 tabs)

**Features:**
- Claude Haiku 4.5 API integration
- Rotating fitness tips during loading (8 tips, 3-second rotation)
- Markdown rendering with styled headers, lists, emphasis
- Refresh with same parameters
- Change options to generate different workout
- Logs as "AI Workout" (distinct from "Other Workout")
- Stores parameters in `other_workout_details` column

---

## Navigation System

All pages include a fixed bottom navigation bar:

```
[💪Today | 📈Team | 👤Me | 📚Library | 🤖A8AI]
```

- **Today (💪)**: Default landing, current workout
- **Team (📈)**: Progress tracking and team totals
- **Me (👤)**: Personal stats and calendar
- **Library (📚)**: All workouts (past/current/future)
- **A8AI (🤖)**: AI workout generator

**Design:**
- Mobile-optimized with 44px touch targets
- Clear active state indication
- Smooth page transitions
- No page reloads between tabs

---

## Design Principles

- **Mobile-First**: Optimized for quick phone access
- **PWA-Capable**: Can be added to home screen
- **Minimal Friction**: No passwords, bookmark personal URL
- **A8 Branding**: Black (#000000), Yellow (#FFC107), White (#FFFFFF)
- **Touch-Optimized**: 44px minimum touch targets

---

See `CLAUDE.md` for complete technical documentation.
