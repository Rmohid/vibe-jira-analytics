export const SourceLabelsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div 
                className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-md"
                style={{ pointerEvents: 'auto' }}
                onMouseLeave={(e) => e.stopPropagation()}
            >
                <p className="font-semibold mb-2">{`Date: ${label}`}</p>
                {payload.map((entry, index) => {
                    if (entry.value > 0) {
                        // Find the corresponding ticket keys from the payload data
                        const ticketKeysField = `${entry.dataKey}_tickets`;
                        const ticketKeys = entry.payload[ticketKeysField] || [];
                        
                        return (
                            <div key={index} className="mb-2">
                                <div className="flex items-center mb-1">
                                    <div 
                                        className="w-3 h-3 rounded mr-2" 
                                        style={{ backgroundColor: entry.color }}
                                    ></div>
                                    <span className="text-sm font-medium">{entry.name}: {entry.value} tickets</span>
                                </div>
                                {ticketKeys.length > 0 && (
                                    <div className="ml-5 text-xs text-gray-600">
                                        <span className="font-medium">Tickets: </span>
                                        {ticketKeys.map((key, keyIndex) => (
                                            <span key={keyIndex}>
                                                <a 
                                                    href={`https://komutel.atlassian.net/browse/${key}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                                    style={{ pointerEvents: 'auto' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        window.open(`https://komutel.atlassian.net/browse/${key}`, '_blank', 'noopener,noreferrer');
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onMouseUp={(e) => e.stopPropagation()}
                                                >
                                                    {key}
                                                </a>
                                                {keyIndex < ticketKeys.length - 1 ? ', ' : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return null;
                }).filter(Boolean)}
            </div>
        );
    }
    return null;
};