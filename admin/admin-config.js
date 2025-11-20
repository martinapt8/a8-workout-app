// Admin Dashboard API Configuration
// Last updated: 2025-11-20 - Fresh deployment to fix 403 error

const ADMIN_CONFIG = {
  // Uses same backend deployment as main app
  // This URL should match the CONFIG.API_URL from the main app's config.js
  API_URL: 'https://script.google.com/macros/s/AKfycbzhgQzBQn3xdaZYGe4EbWQiaBeE_csRLG29azzUbgN2vZOvmpKrM-xf-ytfsWeS5iWkJg/exec',

  // Base URL for main app (used for links in dashboard)
  APP_URL: 'https://martinapt8.github.io/a8-workout-app/',

  // Optional: Add API key for basic security
  // Set the same key in Google Apps Script Script Properties
  // API_KEY: 'your-secret-key-here'
};

// Note: The backend Code.gs handles both main app and admin dashboard requests
// via the same Web App deployment. Admin-specific actions (getEmailTemplates,
// saveEmailTemplate, etc.) are routed through the existing doPost() handler.
