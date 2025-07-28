import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CustomTooltip } from '../tooltips/CustomTooltip'
import { DASHBOARD_CONFIG } from '../../config/dashboardConfig'

export const TrendsPanel = ({ realData, jiraConfig, timePeriod, customDays, timeInterval, startDate, endDate }) => {
    if (!realData || !realData.historicalTrend) return null
    const chartConfig = DASHBOARD_CONFIG.charts.historical
    
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
    
    const title = `Ticket Backlog Size Over Time (${jiraConfig.project} Project) - ${getPeriodLabel()} (${timeInterval === 'daily' ? 'Daily' : timeInterval === 'weekly' ? 'Weekly' : 'Monthly'})`
    
    return (
        <div className="chart-container p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">Shows the cumulative backlog size over time by priority level (High &lt; 10, Medium &lt; 100, Low ≥ 100).</p>
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