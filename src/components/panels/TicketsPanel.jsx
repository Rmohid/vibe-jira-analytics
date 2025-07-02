import React from 'react'

export const TicketsPanel = ({ realData, jiraConfig }) => {
    if (!realData || !realData.tickets) return null
    
    return (
        <div className="chart-container p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Tickets from {jiraConfig.project}</h3>
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
                        {realData.tickets.slice(0, 10).map((ticket, index) => (
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