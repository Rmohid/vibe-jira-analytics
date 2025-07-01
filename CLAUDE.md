# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Jira Analytics Dashboard - A minimal 3-file local web application that provides analytics and visualizations for Jira tickets. The project uses Express.js backend with a React-based frontend served from a single HTML file.

## Common Development Commands

### Development
- `npm run dev` - Run server with auto-restart (nodemon)
- `npm start` - Run server in production mode
- `npm run demo` - Run demo mode without connecting to Jira API

### Testing & Validation
The dashboard includes comprehensive testing tools:

#### Enhanced Demo Data
- **Test Scenarios**: 6 predefined scenarios (Normal, Empty, High Activity, Low Activity, Error State, Loading State, Edge Cases)
- **Scenario Selector**: UI dropdown to switch between test scenarios in demo mode
- **Edge Case Testing**: Includes unusual data patterns, long strings, special characters, null values

#### Debugging Tools
- **Integrated Logging**: Comprehensive logging system with categories (INIT, API, STATE, PERFORMANCE, ERROR)
- **Debug Logs Panel**: Real-time log viewer with filtering and export capabilities
- **Developer Panel**: Quick actions for testing error states, clearing data, triggering loading states
- **Performance Monitoring**: API call timing and component render performance tracking

#### Manual Testing Process
1. Use scenario selector to test different data conditions
2. Monitor debug logs panel for errors or performance issues
3. Use developer panel to trigger edge cases
4. Export logs for Claude debugging when issues arise
5. Verify data persistence by checking files in `/data` directory
6. Test both demo mode and production mode

## Architecture & Code Patterns

### Backend (server.js)
The Express server implements several key patterns:

1. **Smart Data Caching**: Always check existing data timestamps before saving new data to avoid overwriting newer information
2. **Data Merging**: When fetching tickets, preserve historical tickets not in current results by merging datasets
3. **Error Handling**: All API endpoints should fallback to cached data when Jira API is unavailable
4. **Batch Processing**: Use the existing batched JQL query pattern (100 tickets per request) for large datasets

### Frontend (index.html)
Single-file React application using CDN libraries with configuration-driven architecture:

1. **Configuration-Driven Dashboard**: Uses `DASHBOARD_CONFIG` object to define all dashboard sections, charts, and components
2. **Component Architecture**: Modular panel components (OverviewPanel, TrendsPanel, SourcesPanel, TicketsPanel, TransitionsPanel)
3. **Dynamic Rendering**: `DashboardRenderer` component dynamically renders sections based on configuration
4. **State Management**: Uses React hooks (useState, useEffect) for all state
5. **Data Fetching**: All API calls go through the `/api` prefix to the Express backend
6. **Visualization**: Uses Recharts library with chart configurations defined in `DASHBOARD_CONFIG.charts`
7. **Demo Mode**: Demo data uses configuration-defined source labels and colors

### API Endpoints
When adding new endpoints, follow these patterns:
- POST endpoints for Jira operations that require credentials
- GET endpoints for cached data retrieval
- Always return appropriate error messages and status codes
- Save configuration changes using the `saveConfig` helper

### Data Persistence
- All data stored in JSON files under `/data` directory
- Use `loadSavedData` and `saveDataSmart` helpers for file operations
- Never expose full API tokens in responses or logs

## Important Configuration

### Jira Integration
- Base URL: `https://komutel.atlassian.net` (configurable)
- API Version: REST API v3
- Custom Fields: `customfield_11129` for Priority Level
- Authentication: Basic auth with email + API token

### Priority Categorization
- High: Priority Level < 10
- Medium: Priority Level < 100
- Low: Priority Level >= 100
- Unknown: No Priority Level set

### Source Labels
Only labels prefixed with "src-" are considered source labels for analytics.

## Working with This Codebase

### Dashboard Content Management
The dashboard uses a configuration-driven approach for easy content modification:

1. **Adding/Removing Sections**: Modify `DASHBOARD_CONFIG.sections` array to enable/disable dashboard panels
2. **Changing Chart Colors**: Update colors in `DASHBOARD_CONFIG.charts` for consistent theming
3. **Modifying Source Labels**: Edit `DASHBOARD_CONFIG.labels.sourceLabels` for label definitions
4. **Creating New Panels**: Add new panel components and register them in `DashboardRenderer`

### Testing and Debugging

#### Using Test Scenarios
```javascript
// Add new test scenario
TEST_SCENARIOS.myScenario = {
    name: "My Test Case",
    description: "Testing specific conditions",
    currentCounts: { high: 5, medium: 10, low: 15, total: 30 },
    tickets: [...]
};
```

#### Logging for Claude Debugging
```javascript
// Use structured logging
Logger.debug('COMPONENT', 'Component action', { data: relevantData });
Logger.error('API', 'Failed to fetch', errorObject);
Logger.performance('render', durationMs, { componentName });
Logger.state('COMPONENT', newState, 'ACTION_TYPE');
```

#### Developer Tools Usage
1. **Toggle Dev Panel**: Click "🔧 Dev" button to access quick testing actions
2. **View Logs**: Click "📋 Logs" button to see real-time debug information
3. **Export Data**: Use dev panel to export configuration, data, or logs for analysis
4. **Test Error States**: Use dev panel buttons to simulate various error conditions

### Development Workflow
1. **Adding New Features**: Implement in both demo mode (hardcoded data) and production mode (API calls)
2. **Modifying API**: Update both server.js endpoint and corresponding frontend fetch call
3. **Changing Visualizations**: Use `DASHBOARD_CONFIG.charts` for consistent styling and configuration
4. **Error States**: Always provide user-friendly error messages and fallback to cached data

### Configuration Structure
```javascript
DASHBOARD_CONFIG = {
  sections: [{ id, title, component, enabled }],
  charts: { chartType: { type, height, colors } },
  cards: { cardType: { color, icon } },
  labels: { sourceLabels: [{ name, label, color }] }
}

TEST_SCENARIOS = {
  scenarioName: {
    name: "Display Name",
    description: "Scenario description",
    currentCounts: { high, medium, low, total },
    tickets: [{ key, summary, status, priorityLevel, ageInDays, ... }],
    error: "Error message" (optional),
    loading: true (optional)
  }
}

Logger = {
  debug(category, message, data),
  error(category, message, error),
  performance(operation, duration, metadata),
  state(component, state, action),
  getLogs(), clearLogs(), exportLogs()
}
```

## Security Considerations
- API tokens stored locally in `data/config.json` - never commit this file
- Frontend masks tokens in UI display
- No tokens in server logs or error messages