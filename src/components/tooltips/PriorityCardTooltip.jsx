import React from 'react'

export const PriorityCardTooltip = ({ priority, tickets, averageAge, jiraConfig }) => {
    if (!tickets || tickets.length === 0) return null
    
    // Get the 5 most recent tickets for this priority
    const recentTickets = tickets
        .filter(ticket => {
            const pl = ticket.priorityLevel || ticket.currentPriorityLevel?.value
            if (priority === 'high') return pl < 10
            if (priority === 'medium') return pl >= 10 && pl < 100
            if (priority === 'low') return pl >= 100
            return true // total
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .slice(0, 5)
    
    return (
        <div className="absolute z-50 bg-white p-3 border border-gray-300 rounded-lg shadow-lg min-w-[250px] pointer-events-none">
            <div className="mb-2">
                <p className="font-semibold text-sm">Average Age: {averageAge} days</p>
            </div>
            {recentTickets.length > 0 && (
                <>
                    <p className="font-semibold text-sm mb-1">Recent Tickets:</p>
                    <div className="space-y-1">
                        {recentTickets.map(ticket => (
                            <div key={ticket.key} className="text-xs">
                                <a 
                                    href={`${jiraConfig.baseUrl}/browse/${ticket.key}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline pointer-events-auto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {ticket.key}
                                </a>
                                <span className="text-gray-600 ml-1">
                                    - {ticket.summary.length > 40 ? ticket.summary.substring(0, 40) + '...' : ticket.summary}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}