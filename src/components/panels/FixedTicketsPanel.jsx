import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FixedTicketsTooltip } from '../tooltips/FixedTicketsTooltip'
import { DASHBOARD_CONFIG } from '../../config/dashboardConfig'

export const FixedTicketsPanel = ({ realData, jiraConfig, timePeriod, customDays, timeInterval, startDate, endDate }) => {
    if (!realData || !realData.fixedTicketsTimeSeries) return null
    
    const chartConfig = DASHBOARD_CONFIG.charts.fixedTickets || DASHBOARD_CONFIG.charts.historical
    
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
    
    const title = `Fixed Tickets Over Time - ${getPeriodLabel()} (${timeInterval === 'daily' ? 'Daily' : timeInterval === 'weekly' ? 'Weekly' : 'Monthly'})`
    
    return (
        <div className="chart-container p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">Shows the number of tickets resolved/closed by priority level over time.</p>
            <ResponsiveContainer width="100%" height={chartConfig.height}>
                <BarChart data={realData.fixedTicketsTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="date" 
                        angle={timeInterval === 'monthly' ? -45 : 0}
                        textAnchor={timeInterval === 'monthly' ? 'end' : 'middle'}
                        height={timeInterval === 'monthly' ? 60 : 30}
                    />
                    <YAxis />
                    <Tooltip content={<FixedTicketsTooltip realData={realData} jiraConfig={jiraConfig} />} />
                    <Legend />
                    <Bar dataKey="high" stackId="priority" fill={chartConfig.colors.high} name="High Priority" />
                    <Bar dataKey="medium" stackId="priority" fill={chartConfig.colors.medium} name="Medium Priority" />
                    <Bar dataKey="low" stackId="priority" fill={chartConfig.colors.low} name="Low Priority" />
                    <Bar dataKey="unknown" stackId="priority" fill={chartConfig.colors.unknown || '#999999'} name="Unknown Priority" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}