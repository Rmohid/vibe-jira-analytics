# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Jira Analytics Dashboard - A modular React application that provides analytics and visualizations for Jira tickets using the "Top 7" prioritization system. The project uses Express.js backend with a modern React frontend built with Vite.

### Business Context: The Top 7 System
**Important**: Before modifying code, understand the business logic documented in [TOP7_BUSINESS_LOGIC.md](TOP7_BUSINESS_LOGIC.md).

The "Top 7" represents the active prioritized backlog - tickets with Priority Level < 100 that teams should focus on. Key concepts:
- **Priority Level (PL)**: Custom field (`customfield_11129`) driving prioritization
- **Top 7 Entry**: When PL is first assigned or changed to < 100
- **Top 7 Exit**: When PL is cleared (completed) or set > 99 (deprioritized)
- **Time in Top 7**: Days since entering the prioritized backlog (not total ticket age)

### Key Feature: Time in Top 7 Tracking
The dashboard tracks how long tickets have been in the "Top 7" (prioritized state) rather than their total age since creation. This provides more meaningful insights into how long high-priority work has been pending.

**Implementation Details:**
- Uses `incomingDate` (when Priority Level first assigned) instead of creation date
- Calculates `timeInTop7Days` for each ticket
- Falls back to creation date if no Priority Level transition exists
- All UI displays "Time in Top 7" instead of generic "Age"

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

## Comprehensive Function Map

### Backend (server.js)
**Core Time in Top 7 Functions:**
- `calculateTimeInTop7(incomingDate, createdDate)` - Calculates days since Priority Level assignment
- `calculatePriorityFlags(transitions, currentPL, createdDate, ticketKey)` - Determines incoming/outgoing dates
- `extractTransitionHistory(changelog)` - Parses Jira changelog for Priority Level transitions
- `categorizePriority(priorityLevel)` - Categorizes priority levels (high/medium/low/unknown)

**Data Processing:**
- `batchJQLQuery(jira, jql, fields, batchSize, expand)` - Handles large dataset fetching
- `getPriorityLevel(issue)` - Extracts Priority Level from issue fields
- `extractSourceLabels(labels)` - Filters source labels (src-* prefixed)
- `calculateAge(createdDate)` - Legacy age calculation (still used for fallback)

**Fixed Tickets Processing (Priority Level-Based):**
- Fixed tickets identified when `ticket.isOutgoing` is true and `ticket.outgoingDate` is set
- Time series generation checks if `outgoingDate` falls within each period
- Counts tickets that left Top 7 (PL > 99 or PL cleared) during the time period
- **NOT based on status transitions** - uses existing Priority Level transition logic

**API Endpoints:**
- `POST /api/jira/data` - Main data fetching and processing endpoint
- `GET /api/jira/test` - API connectivity test
- `POST /api/jira/config` - Configuration save/load

**Time Series Generation:**
- Average age calculation by priority category over time periods
- Historical data aggregation with configurable intervals

### Frontend Components

#### Panel Components (`src/components/panels/`)
**OverviewPanel.jsx:**
- `calculateMaximumAge(priority)` - Finds max Time in Top 7 for priority category
- Priority card rendering with hover tooltips
- Real-time maximum time display

**TicketsPanel.jsx:**
- Ticket sorting by `timeInTop7Days` (descending)
- "Time in Top 7" column header display
- Formatted time display with "d" suffix
- Priority Level color coding

**SourcesPanel.jsx:**
- "Average Time in Top 7 Trends" chart rendering
- Incoming vs outgoing ticket flow analysis
- Source label distribution and time series

**TrendsPanel.jsx:**
- Historical trend visualization
- Time period selection handling

**FixedTicketsPanel.jsx:**
- Displays tickets that left Top 7 prioritized backlog over time
- Groups by source labels in stacked bar chart format
- Shows Priority Level-based fixed tickets (PL > 99 or PL cleared)
- **NOT based on Jira status changes** - uses outgoing Priority Level transitions

#### Tooltip Components (`src/components/tooltips/`)
**PriorityCardTooltip.jsx:**
- "Maximum Time in Top 7" display
- Top 3 oldest tickets by Time in Top 7
- Color-coded time indicators (green ≤14d, orange ≤30d, red >30d)

**CustomAgeTooltip.jsx:**
- Generic chart tooltip for average time trends
- Multi-priority display with color coding

**SourceLabelsTooltip.jsx:**
- Source label chart tooltips with ticket links
- Clickable Jira issue links

**CustomTooltip.jsx:**
- General-purpose chart tooltip component

#### UI Components (`src/components/ui/`)
**ConfigPanel.jsx:**
- Jira configuration form and validation
- JQL query generation and testing
- API token management

**DevPanel.jsx:**
- Developer debugging tools
- Data export functionality
- System status indicators

**LogsPanel.jsx:**
- Real-time logging display
- Log categorization and filtering
- Session persistence

**ConnectionStatus.jsx:**
- API connection status indicator
- Real-time connectivity monitoring

#### Core Components
**DashboardRenderer.jsx:**
- Dynamic component rendering based on configuration
- Props passing to panel components
- Section enable/disable logic

**App.jsx:**
- Main application state management
- Time period and interval controls
- Data fetching orchestration
- Error boundary integration

### Configuration and Utils

#### Config (`src/config/`)
**dashboardConfig.js:**
- Dashboard section definitions and enable/disable flags
- Chart color schemes and dimensions
- Card styling configurations
- Source label definitions and colors

#### Utils (`src/utils/`)
**api.js:**
- `productionJiraAPI(endpoint, config, data)` - Production API calls
- Error handling and fallback logic
- Response data validation

**helpers.js:**
- `generateJQL(project, timePeriod, customDays)` - JQL query generation
- `loadConfig()` - Configuration loading from localStorage
- `checkChartsAvailable()` - Recharts availability verification

**logger.js:**
- `Logger.debug(category, message, data)` - Categorized logging
- `Logger.error(category, message, error)` - Error logging with stack traces
- `Logger.performance(operation, duration, metadata)` - Performance tracking
- `Logger.state(component, state, action)` - State change logging
- Session storage persistence and export functionality

#### Hooks (`src/hooks/`)
**useJiraData.js:**
- Custom React hook for data management
- API call orchestration and state management
- Loading states and error handling
- Data caching and synchronization

### Testing (`tests/`)

#### Frontend Tests (`tests/frontend/`)
- **TicketsPanel.test.jsx** - Time in Top 7 UI testing, sorting, and display
- **SourcesPanel.test.jsx** - Chart title updates and component rendering
- **UILabels.test.jsx** - Comprehensive UI label verification

#### Backend Tests (`tests/backend/`)
- **timeInTop7.test.js** - Core calculation logic and priority categorization

#### Integration Tests (`tests/integration/`)
- **e2e.test.js** - End-to-end data flow verification
- **simple-e2e.test.js** - Simplified integration testing

### Key Function Locations for Time in Top 7

| Function | File | Purpose |
|----------|------|---------|
| `calculateTimeInTop7` | server.js | Core time calculation |
| `calculatePriorityFlags` | server.js | Incoming/outgoing date detection |
| Maximum time display | OverviewPanel.jsx | UI maximum time |
| Time column header | TicketsPanel.jsx | "Time in Top 7" label |
| Chart title | SourcesPanel.jsx | "Average Time in Top 7 Trends" |
| Tooltip display | PriorityCardTooltip.jsx | "Maximum Time in Top 7" |
| Test coverage | tests/ | Comprehensive validation |

### Key Function Locations for Fixed Tickets (Priority Level-Based)

| Function | File | Purpose |
|----------|------|---------|
| `calculatePriorityFlags` | server.js | Sets `isOutgoing` and `outgoingDate` flags |
| Fixed Tickets time series | server.js | Uses `isOutgoing` and `outgoingDate` for counting |
| FixedTicketsPanel | FixedTicketsPanel.jsx | Displays PL-based fixed tickets chart |
| Fixed Tickets description | FixedTicketsPanel.jsx | "Left Top 7 prioritized backlog" |
| Debug logging | server.js | Shows PL reasons (cleared vs >99) |

**CRITICAL**: Fixed Tickets logic is **Priority Level-based**, not status-based. Use `ticket.isOutgoing` and `ticket.outgoingDate`, never status transitions.

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
- `npm test` - Run all tests (36 tests covering Time in Top 7 functionality)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- Tests cover frontend components, backend logic, and end-to-end integration
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

### Time in Top 7 Calculation
The dashboard tracks when tickets first receive a Priority Level (enter the "Top 7"):
- **Incoming Date**: Timestamp when Priority Level is first assigned (transition from null to any value)
- **Time Calculation**: Days from incoming date to current date
- **Fallback Logic**: Uses creation date if ticket was created with a Priority Level
- **UI Display**: Shows as "Time in Top 7" with "d" suffix (e.g., "15d")

### Fixed Tickets Logic (Priority Level-Based)
**IMPORTANT**: Tickets are considered "fixed" when they **leave the Top 7 prioritized backlog**, NOT when they change to "Done" or "Closed" status.

#### How Fixed Tickets Are Determined:
A ticket is "fixed" when its Priority Level changes such that it leaves the Top 7:
1. **Priority Level > 99** (deprioritized - moved out of active backlog)
2. **Priority Level cleared/null** (completed - work finished)

#### Implementation Details:
- **Uses existing `isOutgoing` and `outgoingDate` flags** from `calculatePriorityFlags()`
- **NOT based on Jira status transitions** (Done, Closed, Resolved, etc.)
- **Aligns with Top 7 business logic**: Active backlog management via Priority Level
- **Two valid "fixed" scenarios**:
  - **Completed work**: PL cleared (null) - ticket truly finished
  - **Deprioritized work**: PL > 99 - ticket moved out of active scope

#### Why This Logic Is Correct:
- Tickets can be "Done" in Jira but still have active Priority Levels (not fixed in business terms)
- Tickets can be resolved via other means (cancelled, moved, etc.) without status changes
- The business question is: "When does work leave our active prioritized backlog?"
- Answer: When Priority Level > 99 or Priority Level is cleared

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
- Data directory excluded from git via .gitignore

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