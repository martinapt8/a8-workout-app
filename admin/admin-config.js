// Admin Dashboard API Configuration
// Last updated: 2025-11-18 - Email Campaign System (Session 2)

const ADMIN_CONFIG = {
  // Uses same backend deployment as main app
  // This URL should match the CONFIG.API_URL from the main app's config.js
  API_URL: 'https://script.google.com/macros/s/AKfycbx85_VQ-xn0BIU4VXItr4er140MUc0ikTmmHN6VMuEdOIMyzdkDQGUCZ1C7NrYWQKU6-Q/exec',

  // Base URL for main app (used for links in dashboard)
  APP_URL: 'https://martinapt8.github.io/a8-workout-app/',

  // Optional: Add API key for basic security
  // Set the same key in Google Apps Script Script Properties
  // API_KEY: 'your-secret-key-here'
};

// Note: The backend Code.gs handles both main app and admin dashboard requests
// via the same Web App deployment. Admin-specific actions (getEmailTemplates,
// saveEmailTemplate, etc.) are routed through the existing doPost() handler.
