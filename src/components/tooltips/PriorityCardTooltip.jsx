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
        .sort((a, b) => {
            // Sort all tickets by age (oldest first)
            return (b.ageInDays || 0) - (a.ageInDays || 0)
        })
    
    return (
        <div className="absolute z-50 bg-white p-3 border border-gray-300 rounded-lg shadow-lg min-w-[250px] pointer-events-none">
            <div className="mb-2">
                <p className="font-semibold text-sm">Maximum Age: {maximumAge} days</p>
                <p className="font-semibold text-sm">Total Count: {filteredTickets.length}</p>
            </div>
            {filteredTickets.length > 0 && (
                <>
                    <p className="font-semibold text-sm mb-1">
                        Top 3 Oldest Tickets:
                    </p>
                    <div className="space-y-1">
                        {filteredTickets.slice(0, 3).map(ticket => {
                            const ageInDays = ticket.ageInDays || 0
                            const ageColor = ageInDays > 30 ? 'text-red-600' : ageInDays > 14 ? 'text-orange-600' : 'text-green-600'
                            
                            return (
                                <div key={ticket.key} className="text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
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
                                                - {ticket.summary.length > 30 ? ticket.summary.substring(0, 30) + '...' : ticket.summary}
                                            </span>
                                        </div>
                                        <span className={`${ageColor} font-semibold ml-2 flex-shrink-0`}>
                                            {ageInDays}d
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {filteredTickets.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">
                            ...and {filteredTickets.length - 3} more tickets
                        </p>
                    )}
                </>
            )}
        </div>
    )
}