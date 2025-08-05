import React from 'react'
import { Logger } from '../../utils/logger'

export const TicketsPanel = ({ realData, jiraConfig, timePeriod, customDays, startDate, endDate }) => {
    if (!realData || !realData.tickets) return null
    
    const getPeriodLabel = () => {
        if (timePeriod === 'dateRange' && startDate && endDate) {
            const start = new Date(startDate).toLocaleDateString()
            const end = new Date(endDate).toLocaleDateString()
            return `${start} to ${end}`
        }
        if (timePeriod === 'custom') return `Last ${customDays} days`
        if (timePeriod === '7d') return 'Last 7 days'
        if (timePeriod === '30d') return 'Last 30 days'
        if (timePeriod === '90d') return 'Last 90 days'
        if (timePeriod === '180d') return 'Last 180 days'
        if (timePeriod === '365d') return 'Last year'
        return ''
    }
    
    // Sort tickets by PL groups (high < 10, then by value), then by age (oldest first)
    const sortedTickets = [...realData.tickets].sort((a, b) => {
        // Get PL value from various possible locations
        const plA = a.currentPriorityLevel?.value ?? a.priorityLevel ?? a.fields?.customfield_11129 ?? null
        const plB = b.currentPriorityLevel?.value ?? b.priorityLevel ?? b.fields?.customfield_11129 ?? null
        
        // Convert to numbers, treating null/undefined/"N/A" as highest priority (to sort last)
        const numPlA = (plA === null || plA === 'N/A' || plA === undefined) ? Number.MAX_VALUE : Number(plA)
        const numPlB = (plB === null || plB === 'N/A' || plB === undefined) ? Number.MAX_VALUE : Number(plB)
        
        // Group PL values: < 10 are all treated as equivalent high priority
        const groupA = numPlA < 10 ? 0 : numPlA
        const groupB = numPlB < 10 ? 0 : numPlB
        
        // First sort by PL group
        if (groupA !== groupB) {
            return groupA - groupB
        }
        
        // If in the same PL group, sort by time in top 7 (oldest first - higher time number first)
        return (b.timeInTop7Days || 0) - (a.timeInTop7Days || 0)
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
                            <th className="text-left py-2">Time in Top 7</th>
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
                                <td className="py-2">
                                    {(() => {
                                        const timeInTop7 = ticket.timeInTop7Days;
                                        const ageInDays = ticket.ageInDays;
                                        const displayValue = timeInTop7 || ageInDays;
                                        
                                        // Debug logging
                                        if (index === 0) { // Only log for first ticket to avoid spam
                                            console.log(`[TicketsPanel] First ticket ${ticket.key}:`, {
                                                timeInTop7Days: timeInTop7,
                                                ageInDays: ageInDays,
                                                displayValue: displayValue,
                                                ticketKeys: Object.keys(ticket)
                                            });
                                        }
                                        
                                        return `${displayValue}d`;
                                    })()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}