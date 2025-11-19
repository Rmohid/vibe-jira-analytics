import React from 'react'

export const SourceLabelsContent = ({ dateLabel, payload, realData, jiraConfig, isModal = false }) => {
    const baseUrl = jiraConfig?.baseUrl || 'https://komutel.atlassian.net'
    
    // Get tickets for a specific source label and date
    const getTicketsForLabel = (dateLabel, sourceLabel) => {
        if (!realData?.sourceLabelsTimeSeries) {
            return []
        }
        
        // Find the data point for this date
        const dataPoint = realData.sourceLabelsTimeSeries.find(d => d.date === dateLabel)
        if (!dataPoint) {
            return []
        }
        
        // Get the ticket keys for this label
        const ticketKeysField = `${sourceLabel}_tickets`
        return dataPoint[ticketKeysField] || []
    }
    
    const containerClass = isModal 
        ? "space-y-4" 
        : "bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-md"
    
    return (
        <div 
            className={containerClass}
            style={isModal ? {} : { pointerEvents: 'auto' }}
        >
            {!isModal && <p className="font-semibold mb-2">{`Date: ${dateLabel}`}</p>}
            {payload.map((entry, index) => {
                if (entry.value <= 0) return null
                
                const ticketKeys = getTicketsForLabel(dateLabel, entry.dataKey)
                
                return (
                    <div key={index} className={isModal ? "border-b border-gray-200 pb-4 last:border-b-0" : "mb-2"}>
                        <div className="flex items-center mb-1">
                            <div 
                                className="w-3 h-3 rounded mr-2" 
                                style={{ backgroundColor: entry.color }}
                            ></div>
                            <span className={isModal ? "text-lg font-semibold" : "text-sm font-medium"}>
                                {entry.name}: {entry.value} tickets
                            </span>
                        </div>
                        {ticketKeys.length > 0 && (
                            <div className={isModal ? "space-y-2 mt-2" : "ml-5 text-xs text-gray-600"}>
                                {!isModal && <span className="font-medium">Tickets: </span>}
                                {isModal ? (
                                    <div className="space-y-1">
                                        {ticketKeys.map((key, keyIndex) => (
                                            <div key={keyIndex} className="p-2 bg-gray-50 rounded hover:bg-gray-100">
                                                <a 
                                                    href={`${baseUrl}/browse/${key}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                                                >
                                                    {key}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    ticketKeys.map((key, keyIndex) => (
                                        <span key={keyIndex}>
                                            <a 
                                                href={`${baseUrl}/browse/${key}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                style={{ pointerEvents: 'auto' }}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    e.preventDefault()
                                                    window.open(`${baseUrl}/browse/${key}`, '_blank', 'noopener,noreferrer')
                                                }}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onMouseUp={(e) => e.stopPropagation()}
                                            >
                                                {key}
                                            </a>
                                            {keyIndex < ticketKeys.length - 1 ? ', ' : ''}
                                        </span>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )
            }).filter(Boolean)}
            {isModal && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        Total: {payload.reduce((sum, entry) => sum + (entry.value || 0), 0)} tickets on {dateLabel}
                    </p>
                </div>
            )}
        </div>
    )
}
