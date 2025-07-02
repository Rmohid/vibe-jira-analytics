import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CustomTooltip } from '../tooltips/CustomTooltip'
import { DASHBOARD_CONFIG } from '../../config/dashboardConfig'

export const TrendsPanel = ({ realData, jiraConfig, timePeriod, customDays, timeInterval }) => {
    if (!realData || !realData.historicalTrend) return null
    const chartConfig = DASHBOARD_CONFIG.charts.historical
    
    const title = `Historical Ticket Trends (${jiraConfig.project} Project) - ${
        timePeriod === 'custom' ? `Last ${customDays} days` : 
        timePeriod === '7d' ? 'Last 7 days' :
        timePeriod === '30d' ? 'Last 30 days' :
        timePeriod === '90d' ? 'Last 90 days' :
        timePeriod === '180d' ? 'Last 180 days' :
        timePeriod === '365d' ? 'Last year' : ''
    } (${timeInterval === 'daily' ? 'Daily' : timeInterval === 'weekly' ? 'Weekly' : 'Monthly'})`
    
    return (
        <div className="chart-container p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={chartConfig.height}>
                <LineChart data={realData.historicalTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="date" 
                        angle={timeInterval === 'monthly' ? -45 : 0}
                        textAnchor={timeInterval === 'monthly' ? 'end' : 'middle'}
                        height={timeInterval === 'monthly' ? 60 : 30}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="high" stroke={chartConfig.colors.high} strokeWidth={2} name="High Priority" />
                    <Line type="monotone" dataKey="medium" stroke={chartConfig.colors.medium} strokeWidth={2} name="Medium Priority" />
                    <Line type="monotone" dataKey="low" stroke={chartConfig.colors.low} strokeWidth={2} name="Low Priority" />
                    <Line type="monotone" dataKey="total" stroke={chartConfig.colors.total} strokeWidth={2} name="Total" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}