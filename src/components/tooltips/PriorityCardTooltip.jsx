import React from 'react'

export const PriorityCardTooltip = ({ priority, tickets, maximumAge, jiraConfig }) => {
    if (!tickets || tickets.length === 0) return null
    
    // Get all tickets for this priority, sorted by most recent
    // Use same categorization logic as backend
    const categorizePriority = (priorityLevel) => {
        if (priorityLevel === null || priorityLevel === undefined) return 'unknown'
        if (priorityLevel < 10) return 'high'
        if (priorityLevel < 100) return 'medium'
        return 'low'
    }
    
    const filteredTickets = tickets
        .filter(ticket => {
            // Use the same priority field as backend: customfield_11129
            const pl = ticket.fields?.customfield_11129 || ticket.priorityLevel || ticket.currentPriorityLevel?.value
            const category = categorizePriority(pl)
            
            if (priority === 'high') return category === 'high'
            if (priority === 'medium') return category === 'medium'
            if (priority === 'low') return category === 'low'
            if (priority === 'unknown') return category === 'unknown'
            return true // total - include all categories
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created))
    
    return (
        <div className="absolute z-50 bg-white p-3 border border-gray-300 rounded-lg shadow-lg min-w-[250px] pointer-events-none">
            <div className="mb-2">
                <p className="font-semibold text-sm">Maximum Age: {maximumAge} days</p>
                <p className="font-semibold text-sm">Total Count: {filteredTickets.length}</p>
            </div>
            {filteredTickets.length > 0 && (
                <>
                    <p className="font-semibold text-sm mb-1">All Tickets:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {filteredTickets.map(ticket => (
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