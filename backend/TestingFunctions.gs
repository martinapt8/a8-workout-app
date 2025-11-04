/**
 * Testing Functions for Multi-Challenge Architecture
 * Created: October 30, 2025
 * Purpose: Test backend functions after migration
 *
 * USAGE:
 * 1. Copy these functions to your Code.gs file (at the end)
 *    OR keep as separate file in Apps Script project
 * 2. Update test user IDs to match your Users sheet
 * 3. Run functions from dropdown in Apps Script Editor
 * 4. Check View → Logs for results
 */

/**
 * Test getUserDashboardData with active challenge
 * UPDATE: Change 'martin' to your actual user_id
 */
function testGetUserDashboard() {
  const TEST_USER_ID = 'martin'; // ← CHANGE THIS to your user_id

  Logger.log('==========================================');
  Logger.log('Testing getUserDashboardData()');
  Logger.log('==========================================');
  Logger.log('User ID: ' + TEST_USER_ID);

  try {
    const result = getUserDashboardData(TEST_USER_ID);

    Logger.log('\n📊 RESULT:');
    Logger.log(JSON.stringify(result, null, 2));

    // Verify critical fields
    Logger.log('\n✅ VERIFICATION:');

    if (result.error) {
      Logger.log('❌ Error returned: ' + result.error);
      if (result.message) {
        Logger.log('   Message: ' + result.message);
      }
      return;
    }

    // Check for "challenge" object (not "settings")
    if (result.challenge) {
      Logger.log('✅ Has "challenge" object (correct API structure)');
      Logger.log('   Challenge ID: ' + result.challenge.challenge_id);
      Logger.log('   Challenge Name: ' + result.challenge.challenge_name);
      Logger.log('   Status: ' + result.challenge.status);
    } else if (result.settings) {
      Logger.log('❌ Has "settings" object - WRONG! Should be "challenge"');
      Logger.log('   Phase 3 backend changes not applied correctly');
    } else {
      Logger.log('❌ No challenge or settings object found');
    }

    if (result.user) {
      Logger.log('✅ User object present');
      Logger.log('   User ID: ' + result.user.user_id);
      Logger.log('   Display Name: ' + result.user.display_name);
      Logger.log('   Team: ' + result.user.team_name);
    } else {
      Logger.log('❌ No user object');
    }

    if (result.activeWorkout !== undefined) {
      Logger.log('✅ Active workout field present');
      if (result.activeWorkout) {
        Logger.log('   Workout: ' + result.activeWorkout.workout_name);
      } else {
        Logger.log('   (No active workout scheduled)');
      }
    }

    if (result.completedToday !== undefined) {
      Logger.log('✅ completedToday field present: ' + result.completedToday);
    }

    if (result.goalProgress) {
      Logger.log('✅ Goal progress present');
      Logger.log('   Total: ' + result.goalProgress.total_completions + '/' + result.goalProgress.total_goal);
    }

    Logger.log('\n==========================================');
    Logger.log('TEST COMPLETE');
    Logger.log('==========================================');

  } catch (error) {
    Logger.log('\n❌ ERROR:');
    Logger.log(error.toString());
    Logger.log('\nStack trace:');
    Logger.log(error.stack);
  }
}

/**
 * Test off-season mode (set all challenges to is_active = FALSE first)
 */
function testOffSeasonMode() {
  Logger.log('==========================================');
  Logger.log('Testing Off-Season Mode');
  Logger.log('==========================================');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const activeChallenge = getActiveChallenge(ss);

    if (activeChallenge) {
      Logger.log('⚠️  ACTIVE CHALLENGE FOUND');
      Logger.log('Challenge: ' + activeChallenge.challenge_name + ' (' + activeChallenge.challenge_id + ')');
      Logger.log('\nTo test off-season mode:');
      Logger.log('1. Go to Challenges sheet');
      Logger.log('2. Set status to "completed" or "upcoming" for all challenges');
      Logger.log('3. Run this test again');
    } else {
      Logger.log('✅ OFF-SEASON MODE ACTIVE (no active challenge)');
      Logger.log('\nTesting getUserDashboardData in off-season...');

      const TEST_USER_ID = 'martin'; // ← CHANGE THIS
      const result = getUserDashboardData(TEST_USER_ID);

      Logger.log('\n📊 RESULT:');
      Logger.log(JSON.stringify(result, null, 2));

      Logger.log('\n✅ VERIFICATION:');
      if (result.error === 'No active challenge') {
        Logger.log('✅ Correct error message returned');
      } else {
        Logger.log('❌ Expected error: "No active challenge"');
      }

      if (result.message) {
        Logger.log('✅ Off-season message present: ' + result.message);
      }

      if (result.challenge === null) {
        Logger.log('✅ challenge is null (correct)');
      }
    }

    Logger.log('\n==========================================');
    Logger.log('TEST COMPLETE');
    Logger.log('==========================================');

  } catch (error) {
    Logger.log('\n❌ ERROR:');
    Logger.log(error.toString());
  }
}

/**
 * Test getUserAllChallengeStats (past challenges)
 */
function testGetUserAllChallengeStats() {
  const TEST_USER_ID = 'martin'; // ← CHANGE THIS

  Logger.log('==========================================');
  Logger.log('Testing getUserAllChallengeStats()');
  Logger.log('==========================================');
  Logger.log('User ID: ' + TEST_USER_ID);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = getUserAllChallengeStats(ss, TEST_USER_ID);

    Logger.log('\n📊 PAST CHALLENGE STATS:');

    if (result.length === 0) {
      Logger.log('(No past challenges found - this is normal if user has no completions yet)');
    } else {
      result.forEach((challenge, index) => {
        Logger.log(`\n${index + 1}. ${challenge.challenge_name}`);
        Logger.log(`   Challenge ID: ${challenge.challenge_id}`);
        Logger.log(`   Workouts: ${challenge.workout_count}`);
        Logger.log(`   Team: ${challenge.team_name || 'N/A'}`);
        if (challenge.start_date) {
          Logger.log(`   Dates: ${challenge.start_date} to ${challenge.end_date}`);
        }
      });
    }

    Logger.log('\n==========================================');
    Logger.log('TEST COMPLETE');
    Logger.log('==========================================');

  } catch (error) {
    Logger.log('\n❌ ERROR:');
    Logger.log(error.toString());
    Logger.log('\nStack trace:');
    Logger.log(error.stack);
  }
}

/**
 * Test challenge_id filtering (verify migration worked)
 */
function testChallengeIdFiltering() {
  Logger.log('==========================================');
  Logger.log('Testing challenge_id Filtering');
  Logger.log('==========================================');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Test Completions sheet
    const completionsSheet = ss.getSheetByName('Completions');
    const completionsData = completionsSheet.getDataRange().getValues();
    const completionsHeaders = completionsData[0];
    const challengeIdCol = completionsHeaders.indexOf('challenge_id');

    if (challengeIdCol === -1) {
      Logger.log('❌ challenge_id column not found in Completions sheet');
      return;
    }

    Logger.log('✅ challenge_id column found in Completions (column ' + (challengeIdCol + 1) + ')');

    // Count by challenge
    const challengeCounts = {};
    let nullCount = 0;

    for (let i = 1; i < completionsData.length; i++) {
      const challengeId = completionsData[i][challengeIdCol];
      if (!challengeId) {
        nullCount++;
      } else {
        challengeCounts[challengeId] = (challengeCounts[challengeId] || 0) + 1;
      }
    }

    Logger.log('\n📊 COMPLETIONS BY CHALLENGE:');
    for (const challengeId in challengeCounts) {
      Logger.log(`   ${challengeId}: ${challengeCounts[challengeId]} workouts`);
    }

    if (nullCount > 0) {
      Logger.log(`\n⚠️  WARNING: ${nullCount} completions have NULL challenge_id`);
      Logger.log('   Migration may not have completed correctly');
    } else {
      Logger.log('\n✅ All completions have challenge_id assigned');
    }

    // Test Workouts sheet
    const workoutsSheet = ss.getSheetByName('Workouts');
    const workoutsData = workoutsSheet.getDataRange().getValues();
    const workoutsHeaders = workoutsData[0];
    const workoutChallengeIdCol = workoutsHeaders.indexOf('challenge_id');

    if (workoutChallengeIdCol === -1) {
      Logger.log('\n❌ challenge_id column not found in Workouts sheet');
    } else {
      Logger.log('\n✅ challenge_id column found in Workouts (column ' + (workoutChallengeIdCol + 1) + ')');

      let workoutNullCount = 0;
      for (let i = 1; i < workoutsData.length; i++) {
        if (workoutsData[i][0] && !workoutsData[i][workoutChallengeIdCol]) {
          workoutNullCount++;
        }
      }

      if (workoutNullCount > 0) {
        Logger.log(`   ⚠️  ${workoutNullCount} workouts have NULL challenge_id`);
      } else {
        Logger.log('   ✅ All workouts have challenge_id assigned');
      }
    }

    Logger.log('\n==========================================');
    Logger.log('TEST COMPLETE');
    Logger.log('==========================================');

  } catch (error) {
    Logger.log('\n❌ ERROR:');
    Logger.log(error.toString());
  }
}

/**
 * Test getGoalProgress with challenge filtering
 */
function testGetGoalProgress() {
  Logger.log('==========================================');
  Logger.log('Testing getGoalProgress()');
  Logger.log('==========================================');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const activeChallenge = getActiveChallenge(ss);

    if (!activeChallenge) {
      Logger.log('⚠️  No active challenge - testing year-round mode');
      const result = getGoalProgress(ss, null);
      Logger.log('\n📊 YEAR-ROUND RESULT:');
      Logger.log(JSON.stringify(result, null, 2));
    } else {
      Logger.log('Active Challenge: ' + activeChallenge.challenge_name);
      Logger.log('Challenge ID: ' + activeChallenge.challenge_id);

      const result = getGoalProgress(ss, activeChallenge.challenge_id);

      Logger.log('\n📊 GOAL PROGRESS:');
      Logger.log('Total Completions: ' + result.total_completions);
      Logger.log('Goal: ' + result.total_goal);
      Logger.log('Percentage: ' + result.percentage + '%');

      Logger.log('\n👥 TEAM TOTALS:');
      for (const team in result.team_totals) {
        Logger.log(`   ${team}: ${result.team_totals[team]}`);
      }

      Logger.log('\n📝 RECENT ACTIVITY:');
      result.recent_completions.forEach((completion, index) => {
        Logger.log(`   ${index + 1}. ${completion.user} ${completion.workout} - ${completion.timestamp}`);
      });
    }

    Logger.log('\n==========================================');
    Logger.log('TEST COMPLETE');
    Logger.log('==========================================');

  } catch (error) {
    Logger.log('\n❌ ERROR:');
    Logger.log(error.toString());
    Logger.log('\nStack trace:');
    Logger.log(error.stack);
  }
}

/**
 * Quick test all critical functions
 */
function testAll() {
  Logger.log('\n\n');
  Logger.log('╔══════════════════════════════════════════╗');
  Logger.log('║   MULTI-CHALLENGE COMPREHENSIVE TEST     ║');
  Logger.log('╚══════════════════════════════════════════╝');
  Logger.log('\n');

  testChallengeIdFiltering();
  Logger.log('\n\n');

  testGetUserDashboard();
  Logger.log('\n\n');

  testGetGoalProgress();
  Logger.log('\n\n');

  testGetUserAllChallengeStats();
  Logger.log('\n\n');

  Logger.log('╔══════════════════════════════════════════╗');
  Logger.log('║         ALL TESTS COMPLETE               ║');
  Logger.log('╚══════════════════════════════════════════╝');
}
