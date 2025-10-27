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
   */
  async post(action, data = {}) {
    try {
      const requestBody = {
        action: action,
        ...data
      };

      console.log(`API POST request to ${action}:`, requestBody);

      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`API POST response status:`, response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`API POST result:`, result);

      // Check if backend returned an error
      if (result.success === false) {
        throw new Error(result.message || 'Backend returned an error');
      }

      return result;
    } catch (error) {
      console.error(`API POST Error (${action}):`, error);
      console.error('Full error details:', error);
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
   * Generate AI workout using Claude API
   */
  async generateAIWorkout(time, difficulty, equipment) {
    return this.get('generateAIWorkout', { time, difficulty, equipment });
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
  }
};
