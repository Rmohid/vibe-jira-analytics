# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Jira Analytics Dashboard - A modular React application that provides analytics and visualizations for Jira tickets. The project uses Express.js backend with a modern React frontend built with Vite.

## Architecture

### Modular Component Structure
The application follows a clean, modular architecture optimized for Claude Code maintenance:

```
/src/
├── components/
│   ├── panels/               # Dashboard panel components (OverviewPanel, TrendsPanel, etc.)
│   ├── tooltips/             # Chart tooltip components with specialized functionality
│   ├── ui/                   # UI utility components (ConfigPanel, DevPanel, etc.)
│   ├── icons/                # SVG icon components
│   └── DashboardRenderer.jsx # Dynamic dashboard orchestrator
├── config/
│   └── dashboardConfig.js    # Centralized configuration for all dashboard elements
├── utils/
│   ├── logger.js             # Enhanced logging system for debugging
│   ├── api.js                # Production API utilities
│   └── helpers.js            # Helper functions (config loading, JQL generation)
├── hooks/
│   └── useJiraData.js        # Custom hook for data management and API calls
├── styles/
│   └── styles.css            # Global CSS styles
├── App.jsx                   # Main application component
├── main.jsx                  # React entry point with error boundary
└── index.html                # HTML template for Vite
```

### Benefits for Claude Code
- **Single Responsibility**: Each file has one clear, focused purpose
- **Semantic Naming**: File names clearly indicate their content and functionality
- **Logical Grouping**: Related components are organized in meaningful folders
- **Clear Dependencies**: Import/export statements make relationships obvious
- **Reduced Complexity**: No more 2000+ line files to understand and navigate

## Common Development Commands

### Development
- `npm run dev` - Start both server and client with hot reload (ports 3001 & 3000)
- `npm run client` - Start only the Vite development server (port 3000)
- `npm run server` - Start only the Express API server (port 3001)
- `npm start` - Start server in production mode (port 3001)

### Build & Deploy
- `npm run build` - Build the React client for production
- `npm run preview` - Preview the production build locally

### Testing & Validation
The dashboard includes comprehensive debugging tools:

#### Developer Panel (🔧 Dev button)
- **Quick Actions**: Clear data, trigger test errors, simulate loading states
- **Data Export**: Export configuration, current data, or debug logs
- **System Info**: Real-time status of React, charts, data, and error states

#### Debug Logs Panel (📋 Logs button)
- **Categorized Logging**: INIT, API, STATE, PERFORMANCE, ERROR categories
- **Real-time Streaming**: Live log updates as actions occur
- **Export Capability**: Download logs for Claude debugging
- **Session Persistence**: Logs stored in browser session storage

## Working with Components

### Adding New Panel Components

1. **Create the component**:
```jsx
// src/components/panels/NewPanel.jsx
import React from 'react'

export const NewPanel = ({ realData, jiraConfig, timePeriod }) => {
    if (!realData) return null
    
    return (
        <div className="chart-container p-6">
            <h3 className="text-lg font-semibold mb-4">New Panel Title</h3>
            {/* Panel content */}
        </div>
    )
}
```

2. **Register in DashboardRenderer**:
```jsx
// src/components/DashboardRenderer.jsx
import { NewPanel } from './panels/NewPanel'

case 'NewPanel':
    return <NewPanel key={section.id} {...commonProps} />
```

3. **Add to configuration**:
```jsx
// src/config/dashboardConfig.js
{ id: 'newpanel', title: 'New Panel', component: 'NewPanel', enabled: true }
```

### Modifying Existing Components

When editing components, follow these patterns:

#### Panel Components (`src/components/panels/`)
- Always check `if (!realData) return null` at the start
- Use consistent class names: `chart-container p-6` for containers
- Import required utilities from `../icons/Icons` or `../tooltips/`
- Use `DASHBOARD_CONFIG` for styling and configuration

#### UI Components (`src/components/ui/`)
- Follow conditional rendering patterns: `if (!showComponent) return null`
- Use semantic prop names that clearly indicate purpose
- Implement proper event handlers and state management

#### Tooltip Components (`src/components/tooltips/`)
- Always check `if (active && payload && payload.length)` for chart tooltips
- Use consistent styling: `bg-white p-3 border border-gray-300 rounded-lg shadow-lg`
- Include proper accessibility and interaction patterns

## Configuration Management

### Dashboard Configuration (`src/config/dashboardConfig.js`)
Central configuration for all dashboard elements:
```javascript
export const DASHBOARD_CONFIG = {
    sections: [/* Dashboard sections with enabled/disabled flags */],
    charts: {/* Chart configurations with colors and dimensions */},
    cards: {/* Card styling and icon mappings */},
    labels: {/* Source label definitions and colors */}
}
```

### Jira Integration Settings
- Base URL: Configurable Jira instance URL
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

## Data Management

### Custom Hook Pattern (`src/hooks/useJiraData.js`)
The application uses a custom hook for data management:
```javascript
const {
    loading, connectionStatus, lastSync, realData, error,
    fetchData, setRealData, setError, setLoading
} = useJiraData(jiraConfig, timePeriod, timeInterval, customDays)
```

### API Integration (`src/utils/api.js`)
- All API calls go through `productionJiraAPI` function
- Endpoints use `/api/jira/` prefix to Express backend
- Error handling includes fallback to cached data
- Smart data caching preserves historical information

### Logging System (`src/utils/logger.js`)
Structured logging for debugging:
```javascript
Logger.debug('COMPONENT', 'Action description', { data })
Logger.error('API', 'Error description', errorObject)
Logger.performance('operation', durationMs, metadata)
Logger.state('COMPONENT', newState, 'ACTION_TYPE')
```

## Chart Integration

### Recharts Integration
- Charts loaded globally via CDN for compatibility
- Chart availability checked with `checkChartsAvailable()` helper
- Fallback components provided when charts unavailable
- Tooltip components specialized for different chart types

### Chart Configuration
- Colors and dimensions defined in `DASHBOARD_CONFIG.charts`
- Consistent styling across all chart components
- Responsive containers for proper sizing

## Development Workflow for Claude Code

### When Adding Features
1. **Identify the appropriate component category** (panel, ui, tooltip, etc.)
2. **Create focused, single-purpose components**
3. **Use existing patterns and utilities**
4. **Update configuration if needed**
5. **Test with developer tools**

### When Debugging
1. **Use the Debug Logs panel** to understand application state
2. **Export logs** for analysis when issues occur
3. **Check component-specific files** rather than large monoliths
4. **Use developer panel quick actions** to test edge cases

### When Modifying Existing Code
1. **Focus on specific component files** based on the feature area
2. **Understand component dependencies** through import statements
3. **Test changes using built-in developer tools**
4. **Use the logging system** to track state changes

## Important Patterns

### Error Boundaries
- Main error boundary in `src/main.jsx`
- Graceful error handling with reload options
- Integration with logging system

### State Management
- React hooks for local component state
- Custom `useJiraData` hook for data management
- LocalStorage for configuration persistence

### Styling
- Tailwind CSS classes for consistency
- Custom CSS in `src/styles/styles.css` for specialized styling
- Chart-specific styling in configuration

## Security Considerations
- API tokens stored locally only in `/data/config.json`
- Tokens masked in UI display
- No credentials in logs or server responses
- All data remains on local machine

## Performance Optimization
- Vite for fast development builds
- Component code splitting
- Efficient re-rendering through proper dependency arrays
- Smart data caching to avoid unnecessary API calls

This modular architecture makes it significantly easier for Claude Code to:
- Understand specific functionality quickly
- Make targeted changes without side effects
- Add new features in the correct location
- Maintain consistent code patterns
- Debug issues effectively through focused components