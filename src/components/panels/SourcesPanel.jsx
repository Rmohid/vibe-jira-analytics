import React from 'react'
import { BarChart, LineChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SourceLabelsTooltip } from '../tooltips/SourceLabelsTooltip'
import { CustomAgeTooltip } from '../tooltips/CustomAgeTooltip'
import { DASHBOARD_CONFIG } from '../../config/dashboardConfig'

export const SourcesPanel = ({ realData, timePeriod, customDays }) => {
    if (!realData) return null
    const sourceLabelsConfig = DASHBOARD_CONFIG.charts.sourceLabels
    const ageConfig = DASHBOARD_CONFIG.charts.averageAge
    
    return (
        <div className="chart-container p-6">
            <h3 className="text-lg font-semibold mb-4">Source Label Analysis Over Time</h3>
            <p className="text-sm text-gray-600 mb-4">Charts show the number of source label occurrences per time period. Multiple labels per ticket are counted separately.</p>
            
            {realData.sourceLabelsTimeSeries && (
                <div className="mb-6">
                    <h4 className="font-medium mb-3">Source Label Occurrences Over Time (Stacked)</h4>
                    <ResponsiveContainer width="100%" height={sourceLabelsConfig.height}>
                        <BarChart data={realData.sourceLabelsTimeSeries}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis label={{ value: 'Label Count', angle: -90, position: 'insideLeft' }} />
                            <Tooltip content={<SourceLabelsTooltip />} />
                            <Legend />
                            {realData.sourceLabels?.map((source, index) => (
                                <Bar 
                                    key={source.label} 
                                    dataKey={source.label} 
                                    stackId={sourceLabelsConfig.stackId} 
                                    fill={source.color} 
                                    name={source.name} 
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {realData.averageAgeTimeSeries && (
                    <div>
                        <h4 className="font-medium mb-3">Average Ticket Age Trends</h4>
                        <ResponsiveContainer width="100%" height={ageConfig.height}>
                            <LineChart data={realData.averageAgeTimeSeries}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip content={<CustomAgeTooltip />} />
                                <Legend />
                                <Line type="monotone" dataKey="highAvgAge" stroke={ageConfig.colors.highAvgAge} strokeWidth={2} name="High Priority" />
                                <Line type="monotone" dataKey="mediumAvgAge" stroke={ageConfig.colors.mediumAvgAge} strokeWidth={2} name="Medium Priority" />
                                <Line type="monotone" dataKey="lowAvgAge" stroke={ageConfig.colors.lowAvgAge} strokeWidth={2} name="Low Priority" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
                
                {/* Incoming vs Outgoing Rate Analysis */}
                <div className="mt-6">
                    <h4 className="font-medium mb-3">Incoming vs Outgoing Ticket Rate</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={(() => {
                            // Calculate incoming vs outgoing rates by date for selected time period
                            const dateMap = {}
                            const today = new Date()
                            
                            // Calculate number of days based on time period selection
                            const days = timePeriod === 'custom' ? customDays : parseInt(timePeriod.replace('d', ''))
                            
                            // Initialize selected time period with zero values
                            for (let i = days - 1; i >= 0; i--) {
                                const date = new Date(today)
                                date.setDate(today.getDate() - i)
                                const dateStr = date.toISOString().split('T')[0]
                                dateMap[dateStr] = {
                                    date: dateStr,
                                    incoming: 0,
                                    outgoing: 0,
                                    net: 0
                                }
                            }
                            
                            // Count incoming tickets using pre-calculated flags
                            if (realData.historicalTrend) {
                                realData.historicalTrend.forEach(dayData => {
                                    if (dayData.tickets) {
                                        dayData.tickets.forEach(ticket => {
                                            if (ticket.isIncoming && ticket.incomingDate) {
                                                const incomingDate = ticket.incomingDate.split('T')[0]
                                                if (dateMap[incomingDate]) {
                                                    dateMap[incomingDate].incoming++
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                            
                            // Count outgoing tickets using pre-calculated flags
                            if (realData.historicalTrend) {
                                realData.historicalTrend.forEach(dayData => {
                                    if (dayData.tickets) {
                                        dayData.tickets.forEach(ticket => {
                                            if (ticket.isOutgoing && ticket.outgoingDate) {
                                                const outgoingDate = ticket.outgoingDate.split('T')[0]
                                                if (dateMap[outgoingDate]) {
                                                    dateMap[outgoingDate].outgoing++
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                            
                            // Calculate net flow and format for chart
                            return Object.values(dateMap).map(day => ({
                                ...day,
                                net: day.incoming - day.outgoing,
                                displayDate: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            }))
                        })()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="displayDate" 
                                tick={{ fontSize: 10 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis label={{ value: 'Tickets', angle: -90, position: 'insideLeft' }} />
                            <Tooltip 
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload
                                        return (
                                            <div className="bg-white p-3 border border-gray-300 rounded shadow">
                                                <p className="font-semibold">{label}</p>
                                                <p className="text-green-600">Incoming (PL Assigned): {data.incoming}</p>
                                                <p className="text-red-600">Outgoing (PL &gt; 99): {data.outgoing}</p>
                                                <p className={`font-semibold ${data.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                                    Net: {data.net >= 0 ? '+' : ''}{data.net}
                                                </p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="incoming" 
                                stroke="#22c55e" 
                                strokeWidth={2}
                                name="Incoming (PL Assigned)" 
                                dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="outgoing" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                name="Outgoing (PL &gt; 99)" 
                                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="net" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Net Flow" 
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    
                    {/* Summary Statistics */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {(() => {
                            // Calculate number of days based on current time period selection
                            const days = timePeriod === 'custom' ? customDays : parseInt(timePeriod.replace('d', ''))
                            
                            const currentPeriodStats = (() => {
                                let totalIncoming = 0
                                let totalOutgoing = 0
                                const today = new Date()
                                
                                // Create date range for the selected period
                                const periodDates = new Set()
                                for (let i = days - 1; i >= 0; i--) {
                                    const date = new Date(today)
                                    date.setDate(today.getDate() - i)
                                    const dateStr = date.toISOString().split('T')[0]
                                    periodDates.add(dateStr)
                                }
                                
                                // Count incoming tickets using pre-calculated flags (same as chart)
                                if (realData.historicalTrend) {
                                    realData.historicalTrend.forEach(dayData => {
                                        if (dayData.tickets) {
                                            dayData.tickets.forEach(ticket => {
                                                if (ticket.isIncoming && ticket.incomingDate) {
                                                    const incomingDate = ticket.incomingDate.split('T')[0]
                                                    if (periodDates.has(incomingDate)) {
                                                        totalIncoming++
                                                    }
                                                }
                                                
                                                if (ticket.isOutgoing && ticket.outgoingDate) {
                                                    const outgoingDate = ticket.outgoingDate.split('T')[0]
                                                    if (periodDates.has(outgoingDate)) {
                                                        totalOutgoing++
                                                    }
                                                }
                                            })
                                        }
                                    })
                                }
                                
                                return { totalIncoming, totalOutgoing }
                            })()
                            
                            const netFlow = currentPeriodStats.totalIncoming - currentPeriodStats.totalOutgoing
                            const avgDaily = {
                                incoming: (currentPeriodStats.totalIncoming / days).toFixed(1),
                                outgoing: (currentPeriodStats.totalOutgoing / days).toFixed(1),
                                net: (netFlow / days).toFixed(1)
                            }
                            
                            return (
                                <>
                                    <div className="bg-green-50 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">{currentPeriodStats.totalIncoming}</div>
                                        <div className="text-sm text-green-700">Total Incoming</div>
                                        <div className="text-xs text-green-600">{avgDaily.incoming}/day avg</div>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-red-600">{currentPeriodStats.totalOutgoing}</div>
                                        <div className="text-sm text-red-700">Total Outgoing</div>
                                        <div className="text-xs text-red-600">{avgDaily.outgoing}/day avg</div>
                                    </div>
                                    <div className={`p-3 rounded-lg text-center ${netFlow >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                        <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {netFlow >= 0 ? '+' : ''}{netFlow}
                                        </div>
                                        <div className={`text-sm ${netFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Flow</div>
                                        <div className={`text-xs ${netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {avgDaily.net >= 0 ? '+' : ''}{avgDaily.net}/day avg
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-600">
                                            {currentPeriodStats.totalOutgoing > 0 ? ((currentPeriodStats.totalIncoming / currentPeriodStats.totalOutgoing) * 100).toFixed(0) : '∞'}%
                                        </div>
                                        <div className="text-sm text-gray-700">In/Out Ratio</div>
                                        <div className="text-xs text-gray-600">
                                            {currentPeriodStats.totalOutgoing > 0 ? 
                                                (currentPeriodStats.totalIncoming / currentPeriodStats.totalOutgoing > 1 ? 'Growing' : 'Shrinking') : 
                                                'No outgoing'
                                            }
                                        </div>
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                </div>
            </div>
            
            <div className="mt-6">
                <h4 className="font-medium mb-3">Source Label Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {realData.sourceLabels?.map((source, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg text-center">
                            <div 
                                className="w-4 h-4 rounded mx-auto mb-2" 
                                style={{ backgroundColor: source.color }}
                            ></div>
                            <div className="font-medium text-sm">{source.name}</div>
                            <div className="font-bold text-lg">{source.count}</div>
                            <div className="text-xs text-gray-500">{source.percentage}%</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}