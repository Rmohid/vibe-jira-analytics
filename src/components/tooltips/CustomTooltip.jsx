// Custom Tooltip Components (used by charts)
export const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
                <p className="font-semibold mb-2">{`Date: ${label}`}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center mb-1">
                        <div 
                            className="w-3 h-3 rounded mr-2" 
                            style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="text-sm">{entry.name}: {entry.value} tickets</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};