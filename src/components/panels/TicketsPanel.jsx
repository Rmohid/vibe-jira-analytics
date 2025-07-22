import React from 'react'

export const TicketsPanel = ({ realData, jiraConfig, timePeriod, customDays }) => {
    if (!realData || !realData.tickets) return null
    
    const getPeriodLabel = () => {
        if (timePeriod === 'custom') return `Last ${customDays} days`
        if (timePeriod === '7d') return 'Last 7 days'
        if (timePeriod === '30d') return 'Last 30 days'
        if (timePeriod === '90d') return 'Last 90 days'
        if (timePeriod === '180d') return 'Last 180 days'
        if (timePeriod === '365d') return 'Last year'
        return ''
    }
    
    // Sort tickets by PL (lowest first, null/undefined treated as highest), then by age (oldest first)
    const sortedTickets = [...realData.tickets].sort((a, b) => {
        // Get PL value from various possible locations
        const plA = a.currentPriorityLevel?.value ?? a.priorityLevel ?? a.fields?.customfield_11129 ?? Number.MAX_VALUE
        const plB = b.currentPriorityLevel?.value ?? b.priorityLevel ?? b.fields?.customfield_11129 ?? Number.MAX_VALUE
        
        // Convert to numbers to ensure proper comparison
        const numPlA = Number(plA)
        const numPlB = Number(plB)
        
        // First sort by PL (lowest first)
        if (numPlA !== numPlB) {
            return numPlA - numPlB
        }
        
        // If PL is the same, sort by age (oldest first)
        return (b.ageInDays || 0) - (a.ageInDays || 0)
    })
    
    return (
        <div className="chart-container p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Tickets from {jiraConfig.project} - {getPeriodLabel()}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-2">Key</th>
                            <th className="text-left py-2">Summary</th>
                            <th className="text-left py-2">Current Status</th>
                            <th className="text-left py-2">Current PL</th>
                            <th className="text-left py-2">Age (Days)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTickets.slice(0, 10).map((ticket, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="py-2 font-medium">
                                    <a 
                                        href={`${jiraConfig.baseUrl}/browse/${ticket.key}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {ticket.key}
                                    </a>
                                </td>
                                <td className="py-2 max-w-xs truncate" title={ticket.summary}>{ticket.summary}</td>
                                <td className="py-2">
                                    <div className="flex flex-col">
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mb-1">
                                            {ticket.currentStatus?.value || ticket.status}
                                        </span>
                                        {ticket.currentStatus?.lastChangedBy && (
                                            <span className="text-xs text-gray-500">
                                                by {ticket.currentStatus.lastChangedBy}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-2">
                                    <div className="flex flex-col">
                                        <span className={`px-2 py-1 rounded text-xs mb-1 ${
                                            (ticket.currentPriorityLevel?.value || ticket.priorityLevel) < 10 
                                                ? 'bg-red-100 text-red-800' 
                                                : (ticket.currentPriorityLevel?.value || ticket.priorityLevel) < 100 
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {ticket.currentPriorityLevel?.value || ticket.priorityLevel || 'N/A'}
                                        </span>
                                        {ticket.currentPriorityLevel?.lastChangedBy && (
                                            <span className="text-xs text-gray-500">
                                                by {ticket.currentPriorityLevel.lastChangedBy}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-2">{ticket.ageInDays}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}