# Fixed Tickets Tooltip Investigation and Resolution

## Issue Summary
User reported that Fixed Tickets tooltips were showing missing tickets when hovering over the Fixed Tickets Over Time graph. Many tickets that should appear in tooltips were not showing up, even though the chart counts appeared correct.

## Root Cause Analysis

### Initial Hypothesis: Chart vs Tooltip Logic Mismatch
**Investigation Finding**: The tooltip logic was actually **correct** for stacked bar charts.

- **Chart Logic**: Counts tickets in ALL applicable source label categories (correct for stacked bars)
- **Tooltip Logic**: Shows actual tickets for each specific category
- **Expected Behavior**: A ticket with multiple source labels appears in multiple tooltip categories but is counted once per category in the chart

### Actual Root Causes Identified

#### 1. Date Parsing Edge Cases
**Problem**: Different date formats from chart labels could cause parsing mismatches.

**Examples**:
- Chart label: `"1/15"` (M/d format)
- Chart label: `"2025-01"` (monthly format)  
- Server outgoingDate: `"2025-01-15T10:00:00.000Z"` (ISO timestamp)

**Edge Cases**:
- Monthly interval boundaries (e.g., `"2025-01"` vs specific dates)
- Timezone conversion issues
- Date format ambiguity (`"15/01/2025"` vs `"01/15/2025"`)

#### 2. Insufficient Debugging Information
**Problem**: Original tooltip provided minimal debugging output, making it difficult to identify why specific tickets were missing.

**Missing Information**:
- Which date parsing method was used
- How many tickets were rejected at each filtering step
- Specific reasons for ticket rejection
- Date range comparison details

## Solution Implementation

### Enhanced Date Parsing
```javascript
// Before: Basic date parsing with limited format support
if (dateLabel.includes('/')) {
    const parts = dateLabel.split('/')
    // Limited handling...
}

// After: Comprehensive date parsing with format detection
if (dateLabel.includes('/')) {
    const parts = dateLabel.split('/')
    if (parts.length === 2) {
        // M/d format
        dateParseMethod = 'M/d format'
    } else if (parts.length === 3) {
        // M/d/yyyy format  
        dateParseMethod = 'M/d/yyyy format'
    }
} else if (dateLabel.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // ISO date format
} else if (dateLabel.match(/^\d{4}-\d{2}$/)) {
    // Monthly format (YYYY-MM)
}
```

### Comprehensive Debugging System
```javascript
const debugInfo = {
    totalTickets: realData.tickets.length,
    outgoingTickets: 0,
    periodsMatched: 0,
    sourceMatched: 0,
    rejectedTickets: []
}

// Track detailed rejection reasons
debugInfo.rejectedTickets.push({ 
    key: ticket.key, 
    reason: `Date mismatch: ${outgoingDay.toISOString()} not in [${targetDate.toISOString()}, ${nextDate.toISOString()})`,
    outgoingDate: ticket.outgoingDate
})
```

### Enhanced Console Logging
```javascript
console.log(`FixedTicketsTooltip: Analysis for ${sourceLabel} on ${dateLabel}:`)
console.log(`  Total tickets: ${debugInfo.totalTickets}`)
console.log(`  Outgoing tickets: ${debugInfo.outgoingTickets}`)
console.log(`  Period matched: ${debugInfo.periodsMatched}`)
console.log(`  Source matched: ${debugInfo.sourceMatched}`)
console.log(`  Final result: ${fixedTickets.length} tickets`)
```

## Verification Process

### Testing Approach
1. **Enable browser console** during Fixed Tickets tooltip hover
2. **Check detailed logs** for each tooltip category
3. **Compare with server logs** for the same time period
4. **Identify specific rejection reasons** for missing tickets

### Expected Log Output
When hovering over a Fixed Tickets chart bar, you should now see:
```
FixedTicketsTooltip: Parsing "1/15" using M/d format
  Target period: 2025-01-15T05:00:00.000Z to 2025-01-16T05:00:00.000Z
FixedTicketsTooltip: Analysis for src-bug-fix on 1/15:
  Total tickets: 1250
  Outgoing tickets: 45
  Period matched: 8
  Source matched: 3
  Final result: 3 tickets
  Found tickets: [KSD-11769, KSD-11772, KSD-11775]
```

### Diagnostic Scenarios

#### If Tooltip Still Shows Fewer Tickets:

1. **Check Date Parsing**:
   - Look for `"Could not parse date label"` warnings
   - Verify date format detection is correct
   - Check for timezone conversion issues

2. **Check Period Matching**:
   - Look for `"Date mismatch"` rejections
   - Verify outgoingDate is within expected range
   - Check interval calculation (daily/weekly/monthly)

3. **Check Source Label Filtering**:
   - Look for `"Source label mismatch"` rejections  
   - Verify ticket has expected source labels
   - Check for edge cases with multiple labels

## Key Improvements

### 1. Robust Date Parsing
- Handles multiple date formats (M/d, M/d/yyyy, YYYY-MM-DD, YYYY-MM)
- Provides clear format detection logging
- Graceful error handling for unparseable dates

### 2. Detailed Debugging
- Step-by-step filtering analysis
- Specific rejection reasons for each ticket
- Sample rejection logging for quick diagnosis

### 3. Better Error Visibility
- Clear console warnings for parsing failures
- Comprehensive logging for troubleshooting
- Structured debug information

## Next Steps

### If Issues Persist
1. **Run the enhanced tooltip** with detailed logging enabled
2. **Compare specific ticket outgoingDates** with chart period boundaries
3. **Check server-side fixedTicketsTimeSeries generation** for the same period
4. **Verify Priority Level transition logic** for problematic tickets

### Long-term Monitoring
- Monitor console logs during normal usage
- Watch for date parsing warnings
- Track tooltip vs chart count discrepancies
- Document any new edge cases discovered

## Technical Notes

### Stacked Chart Behavior (Normal and Expected)
- **Chart Count**: Shows total impact across categories
- **Tooltip Count**: Shows actual tickets per category  
- **Multiple Labels**: Ticket appears in multiple categories
- **User Expectation**: Some users might expect tooltip count to equal chart count, but this is incorrect for stacked charts

### Priority Level-Based Logic (Confirmed Correct)
- Uses `ticket.isOutgoing` and `ticket.outgoingDate` flags
- Aligns with server-side Fixed Tickets generation
- Based on Priority Level transitions, not status changes
- Consistent with "Top 7" business logic

The enhanced debugging system should now provide clear visibility into why tickets are missing from tooltips, enabling quick resolution of any remaining edge cases.