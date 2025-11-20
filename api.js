// API Helper Module
// Centralized functions for making API calls to Google Apps Script backend

const API = {
  /**
   * Make a GET request to the backend API
   */
  async get(action, params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams({
        action: action,
        ...params
      });

      const url = `${CONFIG.API_URL}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',  // Explicitly follow redirects
        mode: 'cors',        // Enable CORS
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Check for API-level errors
      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`API GET Error (${action}):`, error);
      console.error('Full error details:', error);
      throw error;
    }
  },

  /**
   * Make a POST request to the backend API
   * Using URL-encoded form data to avoid CORS preflight requests
   */
  async post(action, data = {}) {
    try {
      const requestBody = {
        action: action,
        ...data
      };

      // Convert to URL-encoded form data to avoid CORS preflight
      const formData = new URLSearchParams();
      formData.append('payload', JSON.stringify(requestBody));

      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check if backend returned an error
      if (result.success === false) {
        throw new Error(result.message || 'Backend returned an error');
      }

      return result;
    } catch (error) {
      console.error(`API POST Error (${action}):`, error);
      throw error;
    }
  },

  // ===== Specific API Methods =====

  /**
   * Get dashboard data for a user
   */
  async getDashboard(userId) {
    return this.get('getDashboard', { userId });
  },

  /**
   * Get goal progress and team totals
   */
  async getGoalProgress() {
    return this.get('getGoalProgress');
  },

  /**
   * Get all workouts for the library
   */
  async getAllWorkouts() {
    return this.get('getAllWorkouts');
  },

  /**
   * Get user's completion history (dates they completed workouts)
   */
  async getUserCompletionHistory(userId) {
    return this.get('getUserCompletionHistory', { userId });
  },

  /**
   * Get user's ALL completion dates across all challenges (for multi-month calendar)
   * @param {string} userId - User ID
   * @param {string} startDate - Optional start date filter (YYYY-MM-DD)
   * @param {string} endDate - Optional end date filter (YYYY-MM-DD)
   */
  async getUserAllCompletions(userId, startDate = null, endDate = null) {
    const params = { userId };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return this.get('getUserAllCompletions', params);
  },

  /**
   * Get user's stats for all past challenges
   */
  async getUserAllChallengeStats(userId) {
    return this.get('getUserAllChallengeStats', { userId });
  },

  /**
   * Generate AI workout using Claude API
   */
  async generateAIWorkout(time, difficulty, equipment) {
    return this.get('generateAIWorkout', { time, difficulty, equipment });
  },

  /**
   * Get recent completions across all users and challenges
   * Works year-round regardless of active challenge or user participation
   * @param {number} limit - Number of recent completions to fetch (default: 15)
   */
  async getRecentCompletionsAll(limit = 15) {
    return this.get('getRecentCompletionsAll', { limit });
  },

  /**
   * Mark a workout as complete
   */
  async markWorkoutComplete(userId, workoutType, workoutDetails = '', completionDate = null) {
    return this.post('markWorkoutComplete', {
      userId,
      workoutType,
      workoutDetails,
      completionDate
    });
  },

  /**
   * Update user profile preferences
   * @param {string} userId - User identifier
   * @param {string} displayName - New display name
   * @param {string} preferredDuration - Workout duration preference (10/20/30)
   * @param {Array|string} equipment - Equipment available (array or comma-separated string)
   */
  async updateUserProfile(userId, displayName, preferredDuration, equipment) {
    const equipmentString = Array.isArray(equipment) ? equipment.join(',') : equipment;

    return this.post('updateUserProfile', {
      userId: userId,
      displayName: displayName,
      preferredDuration: preferredDuration,
      equipment: equipmentString
    });
  }
};
