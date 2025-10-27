/**
 * ClaudeAPI.gs
 * Handles integration with Claude API for AI-generated workouts
 */

/**
 * Generates an AI workout using Claude API
 * @param {string} timeMinutes - Workout duration (10, 15, or 20)
 * @param {string} difficulty - Difficulty level (Beginner, Intermediate, or Hard)
 * @param {string} equipment - Equipment available (Bodyweight, Kettlebell, Dumbbell, Bands, or Full Gym)
 * @returns {Object} {success: boolean, workout: string, error: string}
 */
function generateAIWorkout(timeMinutes, difficulty, equipment) {
  try {
    // Get API key from Script Properties
    const apiKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');

    if (!apiKey) {
      return {
        success: false,
        error: 'API key not configured. Please add CLAUDE_API_KEY to Script Properties.'
      };
    }

    // Construct the prompt
    const prompt = buildWorkoutPrompt(timeMinutes, difficulty, equipment);

    // Call Claude API
    const response = callClaudeAPI(apiKey, prompt);

    if (response.success) {
      return {
        success: true,
        workout: response.content
      };
    } else {
      return {
        success: false,
        error: response.error || 'Failed to generate workout'
      };
    }

  } catch (error) {
    Logger.log('Error in generateAIWorkout: ' + error.toString());
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Builds the workout generation prompt for Claude
 * @param {string} timeMinutes - Workout duration
 * @param {string} difficulty - Difficulty level
 * @param {string} equipment - Equipment available
 * @returns {string} The formatted prompt
 */
function buildWorkoutPrompt(timeMinutes, difficulty, equipment) {
  return `You are a professional fitness trainer creating a workout for the A8 team's Daily Dose challenge.

Generate a ${timeMinutes}-minute workout with these parameters:
- Duration: ${timeMinutes} minutes
- Difficulty: ${difficulty}
- Equipment: ${equipment}

Requirements:
- Design a complete, balanced workout that fits exactly within ${timeMinutes} minutes
- Match the ${difficulty} difficulty level appropriately (Beginner = accessible modifications, Intermediate = moderate challenge, Hard = advanced movements)
- Use only ${equipment} equipment
- Include a brief warm-up (1-2 min) and cool-down/stretch (1-2 min)
- Provide specific exercises with sets/reps OR time duration
- Format clearly with sections: Warm-up, Main Workout, Cool-down
- Use simple, motivating language
- Make it fun and engaging for a team fitness challenge

Format the workout as plain text with clear sections and bullet points. Keep it concise and action-oriented.`;
}

/**
 * Makes the actual API call to Claude
 * @param {string} apiKey - Claude API key
 * @param {string} prompt - The workout generation prompt
 * @returns {Object} {success: boolean, content: string, error: string}
 */
function callClaudeAPI(apiKey, prompt) {
  const url = 'https://api.anthropic.com/v1/messages';

  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode === 200) {
      const data = JSON.parse(responseText);

      // Extract text content from Claude's response
      if (data.content && data.content.length > 0) {
        const workoutText = data.content[0].text;
        return {
          success: true,
          content: workoutText
        };
      } else {
        return {
          success: false,
          error: 'No content received from API'
        };
      }
    } else {
      Logger.log('API Error: ' + statusCode + ' - ' + responseText);

      // Parse error message if available
      let errorMessage = 'API request failed';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // Use default error message
      }

      return {
        success: false,
        error: errorMessage + ' (Status: ' + statusCode + ')'
      };
    }

  } catch (error) {
    Logger.log('API Call Error: ' + error.toString());
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.'
    };
  }
}

/**
 * Test function to verify API integration
 * Run this from Script Editor to test your API key
 */
function testClaudeAPI() {
  const result = generateAIWorkout('15', 'Intermediate', 'Bodyweight');
  Logger.log('Test Result:');
  Logger.log(JSON.stringify(result, null, 2));

  if (result.success) {
    Logger.log('\n=== Generated Workout ===');
    Logger.log(result.workout);
  } else {
    Logger.log('\n=== Error ===');
    Logger.log(result.error);
  }
}
