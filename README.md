# Jira Analytics Dashboard

A minimal 3-file local web application that provides analytics and visualizations for Jira tickets. Built with Express.js backend and React frontend served from a single HTML file.

## Features

- **Time Period Controls**: View data for 7d, 30d, 90d, 180d, 365d, or custom periods
- **Time Interval Options**: Aggregate data daily, weekly, or monthly
- **Priority Analytics**: Visualize tickets by priority levels (High <10, Medium <100, Low ≥100)
- **Source Label Tracking**: Monitor tickets by source labels (src-bug-fix, src-golive-critical, etc.)
- **Transition History**: Complete tracking of status changes, priority updates, and label modifications
- **Persistent Credentials**: API tokens saved locally for convenience
- **Smart Data Caching**: Preserves historical data and merges new information intelligently

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

**Demo Mode** (uses sample data):
```bash
npm run demo
```
Open http://localhost:3001 and toggle "Demo Mode" ON

**Production Mode** (connects to real Jira):
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

- **Backend**: Express.js server with Jira REST API v3 integration
- **Frontend**: Single-file React application using CDN libraries
- **Charts**: Recharts library for all visualizations
- **Styling**: Tailwind CSS for responsive design

## Security

- API tokens are stored locally only
- Tokens are masked in the UI
- No credentials are logged or transmitted to external services
- All data remains on your local machine

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your Jira API token and permissions
3. Check browser console for error messages
4. Ensure your Jira instance is accessible