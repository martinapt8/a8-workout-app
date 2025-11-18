// Admin API Helper Module
// Centralized functions for admin dashboard API calls to Google Apps Script backend
// Mirrors pattern from main app's api.js

const ADMIN_API = {
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

      const url = `${ADMIN_CONFIG.API_URL}?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        mode: 'cors',
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
      console.error(`Admin API GET Error (${action}):`, error);
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

      const response = await fetch(ADMIN_CONFIG.API_URL, {
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
      console.error(`Admin API POST Error (${action}):`, error);
      throw error;
    }
  },

  // ===== Email Campaign API Methods =====

  /**
   * Get all active email templates
   * @returns {Promise<Array>} Array of template objects
   */
  async getEmailTemplates() {
    return this.get('getEmailTemplates');
  },

  /**
   * Get a specific template by ID
   * @param {string} templateId - Template ID to fetch
   * @returns {Promise<Object>} Template object or null
   */
  async getTemplateById(templateId) {
    return this.get('getTemplateById', { templateId });
  },

  /**
   * Save email template (create new or update existing)
   * @param {Object} templateData - Template object with id, name, subject, html_body, plain_body
   * @returns {Promise<Object>} Result with success status and message
   */
  async saveEmailTemplate(templateData) {
    return this.post('saveEmailTemplate', { templateData });
  },

  /**
   * Delete an email template
   * @param {string} templateId - Template ID to delete
   * @returns {Promise<Object>} Result with success status and message
   */
  async deleteEmailTemplate(templateId) {
    return this.post('deleteEmailTemplate', { templateId });
  },

  /**
   * Preview email for a specific user
   * @param {string} templateId - Template ID to preview
   * @param {string} userId - User ID to preview for
   * @param {string} challengeId - Optional challenge ID for challenge tokens
   * @returns {Promise<Object>} Preview data with subject, html_body, plain_body, user info
   */
  async previewEmail(templateId, userId, challengeId = null) {
    const params = { templateId, userId };
    if (challengeId) params.challengeId = challengeId;
    return this.get('previewEmail', params);
  },

  /**
   * Get list of users matching targeting criteria
   * @param {Object} targetingOptions - Targeting configuration
   *   - mode: 'all_active' | 'challenge' | 'custom'
   *   - challengeId: string (if mode='challenge')
   *   - includeNoChallenge: boolean (if mode='challenge')
   *   - userIds: array of strings (if mode='custom')
   * @returns {Promise<Array>} Array of user objects
   */
  async getTargetedUsers(targetingOptions) {
    return this.post('getTargetedUsers', { targetingOptions });
  },

  /**
   * Send email campaign to targeted users
   * @param {string} templateId - Template ID to send
   * @param {Object} targetingOptions - Targeting configuration (same as getTargetedUsers)
   * @param {string} trackingFlag - Optional tracking flag to update (e.g., 'welcome_email_sent')
   * @returns {Promise<Object>} Send results with counts and details
   */
  async sendEmailCampaign(templateId, targetingOptions, trackingFlag = null) {
    const payload = { templateId, targetingOptions };
    if (trackingFlag) payload.trackingFlag = trackingFlag;
    return this.post('sendEmailCampaign', payload);
  },

  // ===== Dashboard Helper Methods =====

  /**
   * Get active users count
   * @returns {Promise<number>} Count of active users
   */
  async getActiveUsersCount() {
    const result = await this.get('getActiveUsersCount');
    return result.count || 0;
  },

  /**
   * Get active challenge info
   * @returns {Promise<Object>} Active challenge object or null
   */
  async getActiveChallenge() {
    return this.get('getActiveChallenge');
  },

  /**
   * Get all challenges (for targeting dropdown)
   * @returns {Promise<Array>} Array of challenge objects
   */
  async getAllChallenges() {
    return this.get('getAllChallenges');
  },

  /**
   * Get all active users (for preview dropdown)
   * @returns {Promise<Array>} Array of user objects
   */
  async getActiveUsers() {
    return this.get('getActiveUsers');
  },

  /**
   * Get total workouts for active challenge
   * @returns {Promise<number>} Total workout count
   */
  async getTotalWorkouts() {
    const result = await this.get('getGoalProgress');
    return result.totalWorkouts || 0;
  }
};
