# Bar Chart Click Interaction Feature

## Overview
This feature enhances the user experience by allowing users to click on bars in two specific charts to view detailed ticket information in a modal dialog.

## Affected Charts

### 1. Fixed Tickets Over Time by Source Label
- **Location**: FixedTicketsPanel component
- **Description**: Shows tickets that left the Top 7 prioritized backlog over time
- **Click Behavior**: Opens a modal showing all tickets that left Top 7 on that date, grouped by source label

### 2. Source Label Analysis Over Time
- **Location**: SourcesPanel component  
- **Chart Name**: "Source Label Occurrences Over Time (Stacked)"
- **Description**: Shows the count of tickets with each source label over time
- **Click Behavior**: Opens a modal showing all tickets for each source label on that date

## User Interface

### Visual Indicators
Both charts display a blue instruction text:
- **Fixed Tickets Panel**: "Click on a bar to see full details."
- **Source Labels Panel**: "Click on a bar to see full details"

### Cursor
When hovering over bars, the cursor changes to a pointer to indicate clickability (via `cursor: 'pointer'` style).

## Modal Dialog

### Features
- **Title**: Shows the chart name and selected date (e.g., "Fixed Tickets - 2024-01-15")
- **Close Options**: 
  - Click the X button in the top right
  - Press ESC key
  - Click outside the modal (on the overlay)
- **Content**: 
  - Displays all tickets for that date/source label combination
  - Shows full ticket summaries (up to 200 characters vs 50 in tooltip)
  - All Jira ticket links are clickable and open in new tabs
- **Scrolling**: Modal content is scrollable if there are many tickets

### Differences from Tooltip
- **Tooltip**: Shows up to 5 tickets, brief summaries (50 chars)
- **Modal**: Shows ALL tickets, longer summaries (200 chars), better formatted

## Technical Implementation

### New Components
1. **TicketDetailsModal** (`src/components/ui/TicketDetailsModal.jsx`)
   - Reusable modal component
   - Handles ESC key, overlay click, and close button
   - Prevents body scroll when open

2. **FixedTicketsContent** (`src/components/tooltips/FixedTicketsContent.jsx`)
   - Shared content component for Fixed Tickets
   - Works in both tooltip and modal modes
   - Handles date parsing and ticket filtering

3. **SourceLabelsContent** (`src/components/tooltips/SourceLabelsContent.jsx`)
   - Shared content component for Source Labels
   - Works in both tooltip and modal modes
   - Retrieves ticket keys from time series data

### Updated Components
1. **FixedTicketsPanel** - Added click handler and modal integration
2. **SourcesPanel** - Added click handler and modal integration
3. **FixedTicketsTooltip** - Refactored to use shared content component
4. **SourceLabelsTooltip** - Refactored to use shared content component

### Event Handling
- Uses Recharts' `onClick` prop on `BarChart` component
- Captures `activePayload` (data for clicked bar) and `activeLabel` (date)
- Stores clicked data in component state to control modal visibility

## Usage Example

1. Navigate to the dashboard with loaded data
2. Locate the "Fixed Tickets Over Time by Source Label" chart
3. Click on any bar in the chart
4. A modal appears showing all tickets that left Top 7 on that date
5. Click ticket keys to open them in Jira
6. Close the modal using X button, ESC key, or clicking outside

## Testing

### Unit Tests
- 6 new tests in `tests/frontend/BarChartClick.test.jsx`
- Tests cover:
  - Modal opens when bar is clicked
  - Modal closes when close button is clicked
  - Instruction text is displayed
  - Both FixedTicketsPanel and SourcesPanel

### Manual Testing
1. Load data into the dashboard
2. Click bars in both affected charts
3. Verify modal appears with correct data
4. Test all close mechanisms (X, ESC, overlay click)
5. Verify all Jira links work correctly

## Browser Compatibility
- Works in all modern browsers that support:
  - React 18+
  - CSS Flexbox
  - DOM Events (keyboard, mouse)
  - CSS fixed positioning

## Future Enhancements
Potential improvements for future versions:
- Add export functionality to modal (CSV/JSON)
- Add filtering/sorting within modal
- Add search capability for tickets in modal
- Show additional ticket metadata (assignee, priority, etc.)
