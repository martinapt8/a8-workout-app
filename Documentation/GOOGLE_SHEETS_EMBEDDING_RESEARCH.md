# Google Sheets Embedding Research: Full Functionality with Custom Menus

**Research Date:** November 20, 2025
**Goal:** Find ways to embed Google Sheets with full functionality including custom Apps Script menus

---

## Executive Summary

**KEY FINDING:** There is no official way to preserve custom Apps Script menus when embedding Google Sheets in an iframe with minimal UI (`rm=minimal`). Custom menus are part of the UI that gets stripped away.

**RECOMMENDED SOLUTIONS:**
1. **Use `rm=embedded`** - Shows menu bar (but NOT custom Apps Script menus)
2. **Build Custom Web App UI** - Create HTML interface with buttons that trigger server functions
3. **Provide "Open in Full Editor" button** - Let users open the sheet in a new tab when they need menu access
4. **Direct Function Calls** - Bypass menu UI by calling underlying functions programmatically

---

## 1. Google Sheets URL Parameters

### Available `rm=` (Render Mode) Parameters

| Parameter | Description | Menu Visibility | Custom Menu Support | Status (2024-2025) |
|-----------|-------------|-----------------|---------------------|-------------------|
| `rm=minimal` | No titlebar, menubar, toolbar, formulabar | Hidden | No | Working |
| `rm=embedded` | No titlebar, but shows menubar + toolbar | Visible | No | Working |
| `rm=demo` | Edit with toolbar only | Partial | No | May not work |
| `rm=full` | Full interface with file icon, toolbar, outline | Visible | **Maybe** | Working |

**Important Notes:**
- As of 2020, only `rm=full` and `rm=embedded` are confirmed working
- `rm=minimal` breaks `onOpen()` triggers (but `onEdit()` still works)
- Custom Apps Script menus created via `onOpen()` do NOT appear in embedded modes
- There is NO official Google documentation for these parameters

### Other URL Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `gid=` | `gid=1234567890` | Select which sheet tab to display |
| `widget=` | `widget=false` | Hide sheet selector bar |
| `chrome=` | `chrome=false` | Hide title bar (read-only embeds) |
| `headers=` | `headers=false` | Hide column/row headers |
| `single=` | `single=true` | Display only one sheet |
| `range=` | `range=A1:C26` | Show specific cell range |

**URL Path Modifiers:**
- `/edit` - Editable mode
- `/edit?rm=minimal` - Minimal editor
- `/edit?rm=embedded` - Embedded editor
- `/preview` - Preview without grid numbers

---

## 2. Custom Apps Script Menus in Embedded Contexts

### How Custom Menus Work

Custom menus are created via Apps Script using:
```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('A8 Custom Menu')
    .addItem('Create New Challenge', 'createNewChallenge')
    .addItem('Set Active Challenge', 'setActiveChallenge')
    .addToUi();
}
```

**Requirements:**
- Script must be container-bound to the spreadsheet
- `onOpen()` trigger fires when user opens the file
- Each menu item is associated with a function name

### Limitations in Embedded/Minimal Modes

**Critical Issue:** When using `rm=minimal`:
1. `onOpen()` triggers do NOT fire
2. Custom menus are NOT displayed (part of the hidden menubar)
3. Image-attached scripts stop working
4. Only `onEdit()` triggers continue to work

**When using `rm=embedded`:**
1. Standard Google menus ARE visible
2. Custom Apps Script menus are still NOT visible
3. `onOpen()` may fire, but menu won't be accessible

**When using `rm=full`:**
- This is your best chance for custom menu visibility
- However, it defeats the purpose of minimal embedding

---

## 3. Alternative Approaches

### Option A: Build Custom HTML Web App

**Approach:** Create an Apps Script Web App with custom HTML UI that replicates menu functionality.

**Implementation:**
```javascript
// Code.gs
function doGet() {
  return HtmlService.createHtmlOutputFromFile('AdminUI')
    .setTitle('Admin Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function createNewChallenge(data) {
  // Your existing challenge creation logic
}
```

```html
<!-- AdminUI.html -->
<button onclick="google.script.run.createNewChallenge(data)">
  Create New Challenge
</button>
```

**Advantages:**
- Full control over UI/UX
- Can be embedded in iframe alongside sheet
- Uses `google.script.run` API for server communication
- No URL parameter restrictions

**Disadvantages:**
- Requires rebuilding menu functionality as HTML UI
- Separate from the actual spreadsheet interface
- More development work

**Resources:**
- [HTML Service Documentation](https://developers.google.com/apps-script/guides/html)
- [google.script.run API](https://developers.google.com/apps-script/guides/html/reference/run)

---

### Option B: Call Functions Directly (Bypass Menu)

**Approach:** Menu items are just triggers for underlying functions. Call those functions programmatically.

**How It Works:**
```javascript
// Instead of clicking menu: A8 Custom Menu → Create New Challenge
// Just call the function directly:
createNewChallenge();

// Or from a separate script:
function adminPanel() {
  // Call menu functions directly
  const result = createNewChallenge();
}
```

**Advantages:**
- No UI dependency
- Works in any mode
- Can be triggered from other scripts or Web Apps

**Disadvantages:**
- No visual menu for users to click
- Requires alternative interface for user interaction

---

### Option C: Provide "Open in Full Editor" Button

**Approach:** Embed sheet with `rm=minimal` but provide a button to open full editor in new tab.

**Implementation:**
```html
<iframe src="https://docs.google.com/spreadsheets/d/SHEET_ID/edit?rm=minimal"></iframe>
<button onclick="openFullEditor()">Open Full Admin Menu</button>

<script>
function openFullEditor() {
  const sheetId = 'YOUR_SHEET_ID';
  const fullUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
  window.open(fullUrl, '_blank');
}
</script>
```

**Advantages:**
- Simple to implement
- Users get full functionality when needed
- Embedded view stays clean for regular use

**Disadvantages:**
- Requires opening new tab/window
- Two-step process for admin actions

**Sandbox Considerations:**
- If iframe is sandboxed, add `allow-popups` to enable `target="_blank"`

---

### Option D: Use Sidebars Instead of Menus

**Approach:** Replace custom menus with sidebar UI that can be triggered programmatically.

**Implementation:**
```javascript
function showAdminSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Admin Panel')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function onOpen() {
  // Auto-show sidebar for admins
  const user = Session.getActiveUser().getEmail();
  if (isAdmin(user)) {
    showAdminSidebar();
  }
}
```

**Advantages:**
- Sidebar stays visible while editing
- More space for complex admin interfaces
- Can include forms, buttons, and custom controls

**Disadvantages:**
- Still requires `onOpen()` which may not fire in embedded mode
- Takes up screen space in the editor

**Resources:**
- [Dialogs and Sidebars Documentation](https://developers.google.com/apps-script/guides/dialogs)

---

## 4. iframe Communication Strategies

### postMessage API

If you need to communicate between your parent page and the embedded sheet:

**Challenge:** Google Apps Script double-iframes your content, so direct communication is difficult.

**Workaround Pattern:**
```javascript
// From iframe to parent
window.parent.parent.parent.postMessage(data, '*');

// Parent listening
window.addEventListener('message', function(event) {
  console.log('Received:', event.data);
});
```

**Limitations:**
- Google's wrapper iframe filters messages by origin
- Cross-origin messages may be blocked
- Not reliable for triggering Apps Script functions

---

## 5. Google Sheets API Approach

### Programmatic Access Without Embedding

Instead of embedding the sheet UI, build a custom interface that uses Google Sheets API.

**Approach:**
1. Create HTML admin dashboard
2. Use Google Sheets API to read/write data
3. Call Apps Script functions via Web App endpoints
4. Users never see the raw spreadsheet

**Implementation Pattern:**
```javascript
// Apps Script Web App endpoint
function doPost(e) {
  const action = e.parameter.action;
  switch(action) {
    case 'createChallenge':
      return createNewChallenge(e.parameter.data);
    case 'setActive':
      return setActiveChallenge(e.parameter.challengeId);
  }
}

// Frontend fetch call
fetch(WEBAPP_URL, {
  method: 'POST',
  body: new URLSearchParams({
    action: 'createChallenge',
    data: JSON.stringify(challengeData)
  })
});
```

**Advantages:**
- Complete control over admin experience
- No dependency on Google Sheets UI
- Can embed spreadsheet separately as read-only view

**Disadvantages:**
- More development work
- Maintains two interfaces (admin UI + sheet view)

---

## 6. Practical Recommendations

### For Your A8 Admin Dashboard

Based on your current setup with admin dashboard at `/admin/` and Google Sheets backend:

**RECOMMENDED APPROACH: Hybrid Solution**

1. **Keep existing admin dashboard** (`/admin/index.html`) for most admin functions
2. **Add sheet embed for data viewing** with `rm=minimal` for clean look
3. **Provide "Open in Google Sheets" button** for functions that need the full sheet:
   - Manual data edits
   - Advanced filtering/sorting
   - Formula verification
   - Accessing custom menu functions

**Implementation:**

```html
<!-- admin/index.html -->
<div class="admin-section">
  <h2>Data Management</h2>

  <!-- Quick view embed -->
  <iframe
    src="https://docs.google.com/spreadsheets/d/SHEET_ID/edit?rm=minimal"
    width="100%"
    height="600px">
  </iframe>

  <!-- Full access button -->
  <button onclick="openFullSheet()" class="btn-primary">
    Open Full Spreadsheet (Advanced Features)
  </button>
</div>

<script>
function openFullSheet() {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/SHEET_ID/edit';
  window.open(sheetUrl, '_blank', 'width=1200,height=800');
}
</script>
```

**When to use each interface:**

| Task | Use Admin Dashboard | Use Full Sheet |
|------|---------------------|----------------|
| Email campaigns | ✓ Dashboard | |
| View stats | ✓ Dashboard | |
| Create challenges | ✓ Dashboard | Alternative: Menu |
| Assign teams | ✓ Dashboard | Alternative: Menu |
| Quick data view | ✓ Embedded sheet | |
| Complex data editing | | ✓ Full sheet |
| Custom menu functions | | ✓ Full sheet |
| Formula debugging | | ✓ Full sheet |
| Bulk operations | | ✓ Full sheet |

---

## 7. Specific Code Examples

### Example 1: Admin Dashboard with Sheet Access

```html
<!-- admin/sheets-access.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Sheet Management</title>
  <style>
    .sheet-container {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      height: 100vh;
    }
    .sheet-embed {
      border: 1px solid #ddd;
    }
    .controls {
      padding: 20px;
      background: #f5f5f5;
    }
    .control-btn {
      width: 100%;
      margin-bottom: 10px;
      padding: 12px;
      background: #FFC107;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="sheet-container">
    <!-- Embedded sheet for viewing -->
    <iframe
      id="sheetEmbed"
      class="sheet-embed"
      src="https://docs.google.com/spreadsheets/d/SHEET_ID/edit?rm=minimal">
    </iframe>

    <!-- Control panel -->
    <div class="controls">
      <h3>Quick Actions</h3>

      <button class="control-btn" onclick="openFullSheet()">
        🔓 Open Full Editor
      </button>

      <button class="control-btn" onclick="refreshSheet()">
        🔄 Refresh Data
      </button>

      <button class="control-btn" onclick="openAdminMenu()">
        ⚙️ Run Menu Functions
      </button>

      <hr>

      <h3>Direct Function Calls</h3>
      <button class="control-btn" onclick="callScriptFunction('createChallenge')">
        Create Challenge
      </button>

      <button class="control-btn" onclick="callScriptFunction('setTeams')">
        Set Placeholder Teams
      </button>
    </div>
  </div>

  <script>
    const SHEET_ID = 'YOUR_SHEET_ID';
    const WEBAPP_URL = 'YOUR_WEBAPP_URL';

    function openFullSheet() {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
      window.open(url, '_blank', 'width=1400,height=900');
    }

    function refreshSheet() {
      const iframe = document.getElementById('sheetEmbed');
      iframe.src = iframe.src; // Force reload
    }

    function openAdminMenu() {
      alert('Opening full sheet with menu access...');
      openFullSheet();
    }

    async function callScriptFunction(functionName) {
      const formData = new URLSearchParams();
      formData.append('payload', JSON.stringify({
        action: functionName
      }));

      try {
        const response = await fetch(WEBAPP_URL, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        alert(`Success: ${result.message}`);
        refreshSheet();
      } catch (error) {
        console.error('Error:', error);
        alert('Error calling function. See console.');
      }
    }
  </script>
</body>
</html>
```

---

### Example 2: Backend Function to Trigger Menu Actions

```javascript
// Code.gs - Add this to your existing backend

/**
 * Expose menu functions through Web App endpoint
 * This allows calling menu functions programmatically
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.parameter.payload);
    const action = payload.action;

    // Route to appropriate menu function
    switch(action) {
      case 'createChallenge':
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: 'Challenge creation wizard requires user input. Opening full sheet...'
          }))
          .setMimeType(ContentService.MimeType.JSON);

      case 'setTeams':
        // If your function doesn't need user input, call it directly
        const result = setPlaceholderTeams(payload.challengeId);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: result,
            data: result
          }))
          .setMimeType(ContentService.MimeType.JSON);

      default:
        throw new Error('Unknown action: ' + action);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 8. Security Considerations

### iframe Sandbox Attributes

If you need to restrict iframe capabilities:

```html
<iframe
  src="..."
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms">
</iframe>
```

**Sandbox Values:**
- `allow-scripts` - Required for Apps Script to function
- `allow-same-origin` - Required for Google Sheets editing
- `allow-popups` - Required if using "Open Full Sheet" button
- `allow-forms` - Required for form submissions

### X-Frame-Options

When embedding Apps Script Web Apps, you must set:

```javascript
function doGet() {
  return HtmlService.createHtmlOutput('<h1>Admin Panel</h1>')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

**Options:**
- `DEFAULT` - Prevents embedding
- `ALLOWALL` - Allows embedding in any domain

---

## 9. Testing Checklist

When implementing embedded sheets with admin functions:

- [ ] Test `rm=minimal` vs `rm=embedded` vs `rm=full`
- [ ] Verify custom menu visibility in each mode
- [ ] Test `onOpen()` trigger firing in embedded context
- [ ] Test "Open Full Sheet" button with popup blockers
- [ ] Verify iframe sandbox attributes don't block functionality
- [ ] Test direct function calls from admin dashboard
- [ ] Verify postMessage communication (if used)
- [ ] Test with different user permission levels
- [ ] Check mobile/tablet responsiveness
- [ ] Verify CORS settings for API calls

---

## 10. Known Limitations & Workarounds

### Limitation 1: Custom Menus Not Visible in Embedded Mode

**Impact:** High - Core admin functions inaccessible
**Workaround:** Provide "Open Full Sheet" button or build custom HTML UI

### Limitation 2: onOpen() Triggers Don't Fire with rm=minimal

**Impact:** Medium - Menu initialization fails
**Workaround:** Use `rm=embedded` or trigger functions via Web App

### Limitation 3: postMessage Blocked by Google's iframe Wrapper

**Impact:** Low - Can't communicate directly with embedded sheet
**Workaround:** Use server-side function calls via `google.script.run` or Web App endpoints

### Limitation 4: No Official Documentation for URL Parameters

**Impact:** Low - Parameters may change without notice
**Workaround:** Test regularly, have fallback to full sheet

---

## 11. Further Reading

### Official Documentation
- [Apps Script HTML Service](https://developers.google.com/apps-script/guides/html)
- [Custom Menus in Google Workspace](https://developers.google.com/apps-script/guides/menus)
- [Dialogs and Sidebars](https://developers.google.com/apps-script/guides/dialogs)
- [google.script.run API](https://developers.google.com/apps-script/guides/html/reference/run)
- [Google Sheets API](https://developers.google.com/sheets/api)

### Community Resources
- [Stack Overflow: Google Sheets Embed URL Parameters](https://stackoverflow.com/questions/23446449/google-sheet-embed-url-documentation)
- [Comprehensive Google Sheets URL Parameters Guide](https://youneedawiki.com/blog/posts/google-sheets-url-parameters.html)
- [Apps Script Community Forum](https://groups.google.com/g/google-apps-script-community)

---

## 12. Conclusion

**Bottom Line:** You cannot preserve custom Apps Script menus in an embedded iframe with minimal UI. Your best options are:

1. **Option A (Recommended):** Keep admin dashboard for most functions, provide "Open Full Sheet" button for menu access
2. **Option B:** Build custom HTML UI that replicates menu functionality
3. **Option C:** Use `rm=full` and accept the full Google Sheets interface
4. **Option D:** Call menu functions programmatically from your admin dashboard

For the A8 Workout Challenge App, **Option A is ideal** because:
- Maintains clean embedded view for data display
- Preserves existing admin dashboard functionality
- Allows full sheet access when needed
- Minimal code changes required
- Users can choose their preferred interface

---

**Document prepared by:** Claude Code
**Research sources:** Google official documentation, Stack Overflow, community forums, technical blogs
**Status:** Complete - Ready for implementation
