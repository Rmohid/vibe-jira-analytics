import React from 'react'

export const FixedTicketsTooltip = ({ active, payload, label, realData, jiraConfig }) => {
    if (!active || !payload || !payload.length) return null
    
    // Find the tickets that were fixed on this date
    const getFixedTickets = (dateLabel, sourceLabel) => {
        if (!realData?.tickets) {
            console.log('FixedTicketsTooltip: No tickets data available')
            return []
        }
        
        // Enhanced date parsing with better format detection
        let targetDate
        let dateParseMethod = 'unknown'
        
        if (dateLabel.includes('/')) {
            const parts = dateLabel.split('/')
            if (parts.length === 2) {
                // Format like "5/28" or "05/28" - assume current year
                const month = parseInt(parts[0])
                const day = parseInt(parts[1])
                const year = new Date().getFullYear()
                targetDate = new Date(year, month - 1, day, 0, 0, 0, 0)
                dateParseMethod = 'M/d format'
            } else if (parts.length === 3) {
                // Could be "1/15/2025" or "15/1/2025" - assume first number is month for US format
                const month = parseInt(parts[0])
                const day = parseInt(parts[1])
                const year = parseInt(parts[2])
                targetDate = new Date(year, month - 1, day, 0, 0, 0, 0)
                dateParseMethod = 'M/d/yyyy format'
            }
        } else if (dateLabel.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Format like "2025-05-28" (ISO date)
            const [year, month, day] = dateLabel.split('-').map(n => parseInt(n))
            targetDate = new Date(year, month - 1, day, 0, 0, 0, 0)
            dateParseMethod = 'ISO date format'
        } else if (dateLabel.match(/^\d{4}-\d{2}$/)) {
            // Format like "2025-01" (monthly)
            const [year, month] = dateLabel.split('-').map(n => parseInt(n))
            targetDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
            dateParseMethod = 'YYYY-MM format'
        } else {
            // Try to parse as-is and normalize to start of day
            targetDate = new Date(dateLabel)
            if (isNaN(targetDate.getTime())) {
                console.warn(`FixedTicketsTooltip: Could not parse date label "${dateLabel}"`)
                return []
            }
            targetDate.setHours(0, 0, 0, 0)
            dateParseMethod = 'generic parsing'
        }
        
        const nextDate = new Date(targetDate)
        
        // Determine the interval based on the data and adjust period end
        const timeInterval = realData.timeInterval || 'daily'
        if (timeInterval === 'daily') {
            nextDate.setDate(nextDate.getDate() + 1)
        } else if (timeInterval === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7)
        } else if (timeInterval === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1)
        }
        
        console.log(`FixedTicketsTooltip: Parsing "${dateLabel}" using ${dateParseMethod}`)
        console.log(`  Target period: ${targetDate.toISOString()} to ${nextDate.toISOString()}`)
        
        // Track debugging info for detailed analysis
        const debugInfo = {
            totalTickets: realData.tickets.length,
            outgoingTickets: 0,
            periodsMatched: 0,
            sourceMatched: 0,
            rejectedTickets: []
        }
        
        const fixedTickets = realData.tickets.filter(ticket => {
            // Use Priority Level-based logic: ticket is fixed when it leaves Top 7 (PL > 99 or cleared)
            if (!ticket.isOutgoing || !ticket.outgoingDate) {
                debugInfo.rejectedTickets.push({ key: ticket.key, reason: 'Not outgoing or no outgoingDate' })
                return false
            }
            debugInfo.outgoingTickets++
            
            const outgoingDate = new Date(ticket.outgoingDate)
            // Ensure we're comparing dates at the same time (start of day)
            const outgoingDay = new Date(outgoingDate.getFullYear(), outgoingDate.getMonth(), outgoingDate.getDate(), 0, 0, 0, 0)
            const isInPeriod = outgoingDay >= targetDate && outgoingDay < nextDate
            
            if (!isInPeriod) {
                debugInfo.rejectedTickets.push({ 
                    key: ticket.key, 
                    reason: `Date mismatch: ${outgoingDay.toISOString()} not in [${targetDate.toISOString()}, ${nextDate.toISOString()})`,
                    outgoingDate: ticket.outgoingDate
                })
                return false
            }
            debugInfo.periodsMatched++
            
            // Filter by source label
            let sourceMatches = false
            if (sourceLabel === 'other') {
                // Tickets with no source labels or source labels not in our known list
                const knownLabels = ['src-bug-fix', 'src-new-feature', 'src-golive-critical', 
                                    'src-integration', 'src-tech-debt', 'src-maintenance', 
                                    'src-enhancement', 'src-research']
                sourceMatches = !ticket.sourceLabels || ticket.sourceLabels.length === 0 || 
                               !ticket.sourceLabels.some(label => knownLabels.includes(label))
            } else {
                // Check if ticket has the specific source label
                sourceMatches = ticket.sourceLabels && ticket.sourceLabels.includes(sourceLabel)
            }
            
            if (sourceMatches) {
                debugInfo.sourceMatched++
                return true
            } else {
                debugInfo.rejectedTickets.push({ 
                    key: ticket.key, 
                    reason: `Source label mismatch: looking for "${sourceLabel}", ticket has [${(ticket.sourceLabels || []).join(', ')}]`
                })
                return false
            }
        })
        
        console.log(`FixedTicketsTooltip: Analysis for ${sourceLabel} on ${dateLabel}:`)
        console.log(`  Total tickets: ${debugInfo.totalTickets}`)
        console.log(`  Outgoing tickets: ${debugInfo.outgoingTickets}`)
        console.log(`  Period matched: ${debugInfo.periodsMatched}`)
        console.log(`  Source matched: ${debugInfo.sourceMatched}`)
        console.log(`  Final result: ${fixedTickets.length} tickets`)
        
        if (fixedTickets.length > 0) {
            console.log(`  Found tickets: [${fixedTickets.map(t => t.key).join(', ')}]`)
        }
        
        if (debugInfo.rejectedTickets.length > 0 && debugInfo.rejectedTickets.length <= 5) {
            console.log(`  Sample rejections:`, debugInfo.rejectedTickets)
        }
        
        return fixedTickets
    }
    
    const baseUrl = jiraConfig?.baseUrl || ''
    
    // Label display names
    const labelDisplayNames = {
        'src-bug-fix': 'Bug Fix',
        'src-new-feature': 'New Feature',
        'src-golive-critical': 'Go-Live Critical',
        'src-integration': 'Integration',
        'src-tech-debt': 'Tech Debt',
        'src-maintenance': 'Maintenance',
        'src-enhancement': 'Enhancement',
        'src-research': 'Research',
        'other': 'Other/No Label'
    }
    
    return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg" style={{ minWidth: '300px' }}>
            <p className="font-semibold mb-2">{label}</p>
            {payload.map((entry, index) => {
                if (entry.value === 0) return null
                
                const sourceLabel = entry.dataKey
                const displayName = labelDisplayNames[sourceLabel] || entry.name
                const tickets = getFixedTickets(label, sourceLabel)
                
                return (
                    <div key={index} className="mb-3">
                        <p style={{ color: entry.color }} className="font-medium">
                            {displayName}: {entry.value} ticket{entry.value > 1 ? 's' : ''}
                        </p>
                        {tickets.length > 0 ? (
                            <div className="ml-4 mt-1 text-sm">
                                {tickets.slice(0, 5).map(ticket => (
                                    <div key={ticket.key} className="mb-1">
                                        <a 
                                            href={`${baseUrl}/browse/${ticket.key}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline font-semibold"
                                        >
                                            {ticket.key}
                                        </a>
                                        <span className="text-gray-600"> - {ticket.summary?.substring(0, 50)}{ticket.summary?.length > 50 ? '...' : ''}</span>
                                    </div>
                                ))}
                                {tickets.length > 5 && (
                                    <div className="text-gray-500 italic">
                                        ...and {tickets.length - 5} more
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="ml-4 mt-1 text-sm text-gray-500 italic">
                                No ticket details available
                            </div>
                        )}
                    </div>
                )
            })}
            <p className="text-sm text-gray-500 mt-2">
                Total: {payload.reduce((sum, entry) => sum + (entry.value || 0), 0)} tickets left Top 7
            </p>
        </div>
    )
}