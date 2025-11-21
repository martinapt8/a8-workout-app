// API Configuration
// Replace with your Google Apps Script Web App URL after deployment
// Last updated: 2025-11-21 - New deployment with challenge analytics endpoints
const CONFIG = {
  // IMPORTANT: After deploying Code.gs as a Web App, replace this URL
  // with your stable deployment URL: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
  API_URL: 'https://script.google.com/macros/s/AKfycbyWo_jYqm2zGUaBMgvVAVVk5_E2bxMoVPP-yoDTxcH-VUHxUEcd7nsOMBKaGxlnNOmCKg/exec',

  // Optional: Add API key for basic security
  // Set the same key in Google Apps Script Script Properties
  // API_KEY: 'your-secret-key-here'
};

// Instructions for deployment:
// 1. Open your Google Apps Script project
// 2. Click "Deploy" → "New deployment"
// 3. Type: Web app
// 4. Execute as: Me
// 5. Who has access: Anyone
// 6. Copy the Web app URL and paste it above as API_URL
// 7. This URL will remain stable - you only deploy the backend once!
