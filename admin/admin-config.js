// Admin Dashboard API Configuration
// Last updated: 2025-11-21 - New deployment with challenge analytics endpoints

const ADMIN_CONFIG = {
  // Uses same backend deployment as main app
  // This URL should match the CONFIG.API_URL from the main app's config.js
  API_URL: 'https://script.google.com/macros/s/AKfycbyWo_jYqm2zGUaBMgvVAVVk5_E2bxMoVPP-yoDTxcH-VUHxUEcd7nsOMBKaGxlnNOmCKg/exec',

  // Base URL for main app (used for links in dashboard)
  APP_URL: 'https://martinapt8.github.io/a8-workout-app/',

  // Optional: Add API key for basic security
  // Set the same key in Google Apps Script Script Properties
  // API_KEY: 'your-secret-key-here'
};

// Google Sheets Configuration (for embed page)
// Full edit URL (for external link in new tab)
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1IVFs2QmrevDV6pNuuuOLXtsZls8HcChnJn_qK8IHV7M/edit?gid=272721508#gid=272721508';

// Embed URL (uses full /edit URL to preserve custom Apps Script menus)
// No rm parameter = full Google Sheets UI including custom menus
const GOOGLE_SHEETS_EMBED_URL = 'https://docs.google.com/spreadsheets/d/1IVFs2QmrevDV6pNuuuOLXtsZls8HcChnJn_qK8IHV7M/edit?gid=272721508';

// Note: The backend Code.gs handles both main app and admin dashboard requests
// via the same Web App deployment. Admin-specific actions (getEmailTemplates,
// saveEmailTemplate, etc.) are routed through the existing doPost() handler.
