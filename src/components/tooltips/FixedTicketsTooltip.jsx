import React from 'react'

export const FixedTicketsTooltip = ({ active, payload, label, realData, jiraConfig }) => {
    if (!active || !payload || !payload.length) return null
    
    // Find the tickets that were fixed on this date
    const getFixedTickets = (dateLabel, priority) => {
        if (!realData?.tickets) {
            console.log('FixedTicketsTooltip: No tickets data available')
            return []
        }
        
        // Parse the date label which could be in various formats
        let targetDate
        if (dateLabel.includes('/')) {
            // Format like "7/22" or "07/22"
            const [month, day] = dateLabel.split('/')
            const currentYear = new Date().getFullYear()
            targetDate = new Date(currentYear, parseInt(month) - 1, parseInt(day))
        } else {
            targetDate = new Date(dateLabel)
        }
        
        // Set time to start of day for consistent comparison
        targetDate.setHours(0, 0, 0, 0)
        
        const nextDate = new Date(targetDate)
        
        // Determine the interval based on the data
        const timeInterval = realData.timeInterval || 'daily'
        if (timeInterval === 'daily') {
            nextDate.setDate(nextDate.getDate() + 1)
        } else if (timeInterval === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7)
        } else if (timeInterval === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1)
        }
        
        const fixedTickets = realData.tickets.filter(ticket => {
            // Look for resolution transitions in this date range
            const resolutionTransition = ticket.statusTransitions?.find(transition => {
                const transitionDate = new Date(transition.timestamp)
                const isInPeriod = transitionDate >= targetDate && transitionDate < nextDate
                const isResolved = transition.toValue && (
                    transition.toValue.toLowerCase().includes('done') || 
                    transition.toValue.toLowerCase().includes('closed') ||
                    transition.toValue.toLowerCase().includes('resolved') ||
                    transition.toValue.toLowerCase().includes('complete')
                )
                return isInPeriod && isResolved
            })
            
            if (!resolutionTransition) return false
            
            // Use the priority category at resolution time if available, otherwise current
            const priorityToCheck = ticket.priorityCategoryAtResolution || ticket.priorityCategory
            return priorityToCheck === priority
        })
        
        // Enhanced debug logging
        if (fixedTickets.length === 0) {
            // Check if we have any transitions at all for this priority
            const priorityTickets = realData.tickets.filter(t => t.priorityCategory === priority)
            const dateStr = targetDate.toISOString().split('T')[0]
            
            const transitionsOnDate = priorityTickets.flatMap(ticket => 
                (ticket.statusTransitions || []).filter(t => {
                    const tDate = new Date(t.timestamp)
                    return tDate >= targetDate && tDate < nextDate
                }).map(t => ({
                    ticket: ticket.key,
                    timestamp: t.timestamp,
                    status: t.toValue
                }))
            )
            
            if (transitionsOnDate.length > 0) {
                console.log(`FixedTicketsTooltip: Found ${transitionsOnDate.length} transitions for ${priority} on ${dateStr}:`, transitionsOnDate)
            }
        } else {
            console.log(`FixedTicketsTooltip: Found ${fixedTickets.length} fixed tickets for ${priority} priority on ${dateLabel}:`, fixedTickets.map(t => t.key))
        }
        
        return fixedTickets
    }
    
    const baseUrl = jiraConfig?.baseUrl || ''
    
    return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg" style={{ minWidth: '300px' }}>
            <p className="font-semibold mb-2">{label}</p>
            {payload.map((entry, index) => {
                if (entry.value === 0) return null
                
                const priorityMap = {
                    high: 'high',
                    medium: 'medium',
                    low: 'low',
                    unknown: 'unknown'
                }
                
                const priority = priorityMap[entry.dataKey]
                const tickets = getFixedTickets(label, priority)
                
                return (
                    <div key={index} className="mb-3">
                        <p style={{ color: entry.color }} className="font-medium">
                            {entry.name}: {entry.value} ticket{entry.value > 1 ? 's' : ''}
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
                Total: {payload.reduce((sum, entry) => sum + (entry.value || 0), 0)} tickets resolved
            </p>
        </div>
    )
}