# Jira Analytics Dashboard

A minimal 3-file local web application that provides analytics and visualizations for Jira tickets. Built with Express.js backend and React frontend served from a single HTML file.

## Features

- **Configuration-Driven Dashboard**: Easy content modification through JavaScript configuration objects
- **Modular Components**: Reusable panel components for different types of analysis
- **Dynamic Rendering**: Sections can be enabled/disabled without code changes
- **Time Period Controls**: View data for 7d, 30d, 90d, 180d, 365d, or custom periods
- **Time Interval Options**: Aggregate data daily, weekly, or monthly
- **Priority Analytics**: Visualize tickets by priority levels (High <10, Medium <100, Low ≥100)
- **Source Label Tracking**: Monitor tickets by source labels (src-bug-fix, src-golive-critical, etc.)
- **Interactive Tooltips**: Hover over charts to see detailed ticket information with clickable Jira links
- **Transition History**: Complete tracking of status changes, priority updates, and label modifications
- **Persistent Credentials**: API tokens saved locally for convenience
- **Smart Data Caching**: Preserves historical data and merges new information intelligently
- **Centralized Styling**: Consistent colors and chart configurations

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Get Jira API Token

To connect to your Jira instance, you'll need an API token:

1. **Log into Jira** at your organization's Jira URL (e.g., `https://yourcompany.atlassian.net`)

2. **Go to Account Settings**:
   - Click your profile picture in top-right corner
   - Select "Account settings" or "Manage account"

3. **Create API Token**:
   - Navigate to the "Security" tab
   - Click "Create and manage API tokens"
   - Click "Create API token"
   - Give it a descriptive name (e.g., "Jira Analytics Dashboard")
   - **Copy the token immediately** - you won't be able to see it again

4. **Note Your Details**:
   - Your Jira base URL (e.g., `https://yourcompany.atlassian.net`)
   - Your email address (used as username)
   - The API token you just created

### 3. Run the Application

```bash
npm start
```
Open http://localhost:3001 and:
1. Enter your Jira base URL
2. Enter your email address
3. Enter your API token
4. Select your project key
5. Click "Fetch Tickets"

### 4. Development Mode

For development with auto-restart:
```bash
npm run dev
```

## Configuration

The app automatically detects and uses these Jira configurations:

- **Custom Field**: `customfield_11129` for Priority Level
- **Priority Categories**:
  - High: Priority Level < 10
  - Medium: Priority Level < 100  
  - Low: Priority Level ≥ 100
  - Unknown: No Priority Level set
- **Source Labels**: Only labels prefixed with "src-" are analyzed

## Data Storage

All data is stored locally in the `/data` directory:

- `config.json` - Your Jira connection settings
- `tickets.json` - Current ticket data with full transition history
- `historical.json` - Time series data for charts

## Troubleshooting

### Common Issues

**"EADDRINUSE: address already in use"**
```bash
# Kill existing server
lsof -ti:3001 | xargs kill -9
npm start
```

**"401 Unauthorized"**
- Verify your email and API token are correct
- Ensure your API token has permission to access the project
- Check that your Jira base URL is correct

**"No tickets found"**
- Verify the project key exists and you have access
- Check that tickets have the Priority Level custom field set
- Try adjusting the time period (some projects may have older tickets)

### API Token Permissions

Your API token needs:
- Read access to Jira projects
- Permission to view issue details and history
- Access to custom fields (specifically Priority Level field)

## Architecture

### Configuration-Driven Dashboard

The dashboard now uses a configuration-driven approach for easy content management:

```javascript
DASHBOARD_CONFIG = {
  sections: [{ id, title, component, enabled }],
  charts: { chartType: { type, height, colors } },
  cards: { cardType: { color, icon } },
  labels: { sourceLabels: [{ name, label, color }] }
}
```

### Components
- **Backend**: Express.js server with Jira REST API v3 integration
- **Frontend**: Single-file React application with modular panel components
- **DashboardRenderer**: Dynamic component that renders sections based on configuration
- **Panel Components**: OverviewPanel, TrendsPanel, SourcesPanel, TicketsPanel, TransitionsPanel
- **Tooltip Components**: Specialized tooltips showing ticket details with clickable Jira links
- **Charts**: Recharts library with centralized configuration
- **Styling**: Tailwind CSS for responsive design

## Interactive Features

### Enhanced Tooltips

The dashboard provides rich, interactive tooltips throughout the interface:

#### Source Label Chart Tooltips
When hovering over bars in the "Source Label Analysis Over Time" chart:
- **Ticket Count**: Shows the number of tickets for each source label
- **Individual Tickets**: Lists all ticket keys for that label and time period
- **Clickable Links**: Each ticket key is a link that opens the Jira issue in a new tab
- **Color Coding**: Visual indicators matching the chart colors

Example tooltip content:
```
Date: 2025-04-28

🟩 Bug Fix: 2 tickets
Tickets: KSD-11690, KSD-11652

🟥 Golive Critical: 2 tickets  
Tickets: KSD-11668, KSD-11652
```

#### Other Chart Tooltips
- **Priority Trends**: Show counts by priority level
- **Average Age Charts**: Display age in days with trend information
- **Standard Tooltips**: Count-based information for overview charts

### Quick Access to Jira
All ticket references throughout the dashboard are clickable links that:
- Open the corresponding Jira issue in a new browser tab
- Use your configured Jira base URL automatically
- Maintain the same user session (if logged into Jira)

## Customizing the Dashboard

### Adding/Removing Sections

Edit `DASHBOARD_CONFIG.sections` in `index.html`:
```javascript
// Disable a section
{ id: 'transitions', component: 'TransitionsPanel', enabled: false }

// Enable a section
{ id: 'overview', component: 'OverviewPanel', enabled: true }
```

### Changing Chart Colors

Update `DASHBOARD_CONFIG.charts`:
```javascript
charts: {
  historical: {
    colors: {
      high: '#ff0000',    // Change to red
      medium: '#ffaa00',  // Change to orange
      low: '#0088ff'      // Change to blue
    }
  }
}
```

### Modifying Source Labels

Edit `DASHBOARD_CONFIG.labels.sourceLabels`:
```javascript
sourceLabels: [
  { name: 'Bug Fix', label: 'src-bug-fix', color: '#ef4444' },
  { name: 'Feature', label: 'src-feature', color: '#3b82f6' },
  // Add, remove, or modify labels as needed
]
```

### Creating Custom Panels

1. **Create the component** in `index.html`:
```javascript
const CustomPanel = ({ realData, jiraConfig }) => {
  if (!realData) return null;
  return (
    <div className="chart-container p-6">
      <h3 className="text-lg font-semibold mb-4">Custom Analysis</h3>
      {/* Your custom content */}
    </div>
  );
};
```

2. **Register in DashboardRenderer**:
```javascript
case 'CustomPanel':
  return <CustomPanel key={section.id} {...commonProps} />;
```

3. **Add to configuration**:
```javascript
{ id: 'custom', title: 'Custom Analysis', component: 'CustomPanel', enabled: true }
```

## Security

- API tokens are stored locally only
- Tokens are masked in the UI
- No credentials are logged or transmitted to external services
- All data remains on your local machine

## Testing and Debugging

### Developer Panel Features

Access via the **🔧 Dev** button:

- **Quick Actions**: Clear data, trigger errors, test loading states
- **Data Export**: Download configuration, current data, or debug logs
- **System Info**: Real-time status of React, charts, data, and errors

### Debug Logging

Access via the **📋 Logs** button:

- **Categorized Logs**: INIT, API, STATE, PERFORMANCE, ERROR
- **Real-time Streaming**: Live updates as actions occur
- **Export Capability**: Download logs for analysis
- **Session Persistence**: Logs stored in browser session

### For Claude Debugging

When reporting issues:

1. **Open Debug Logs** panel to capture relevant information
2. **Export logs** using the developer panel
3. **Include error details** and steps to reproduce

## Support

For issues or questions:
1. **Check the debug logs panel** for error details
2. **Export logs** and include them when reporting issues
3. Verify your Jira API token and permissions
4. Ensure your Jira instance is accessible