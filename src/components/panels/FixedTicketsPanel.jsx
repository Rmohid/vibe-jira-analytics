import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FixedTicketsTooltip } from '../tooltips/FixedTicketsTooltip'
import { DASHBOARD_CONFIG } from '../../config/dashboardConfig'

export const FixedTicketsPanel = ({ realData, jiraConfig, timePeriod, customDays, timeInterval, startDate, endDate }) => {
    if (!realData || !realData.fixedTicketsTimeSeries) return null
    
    // Get colors from sourceLabels data to ensure consistency with Source Label Occurrences chart
    const getLabelColors = () => {
        const colors = {
            'other': '#6b7280'  // Default for other/no label
        }
        
        // Use colors from the sourceLabels data if available
        if (realData.sourceLabels) {
            realData.sourceLabels.forEach(source => {
                colors[source.label] = source.color
            })
        }
        
        return colors
    }
    
    const labelColors = getLabelColors()
    
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
    
    const title = `Fixed Tickets Over Time by Source Label - ${getPeriodLabel()} (${timeInterval === 'daily' ? 'Daily' : timeInterval === 'weekly' ? 'Weekly' : 'Monthly'})`
    
    // Get display names from sourceLabels data
    const getLabelDisplayName = (label) => {
        if (label === 'other') return 'Other/No Label'
        
        const sourceLabel = realData.sourceLabels?.find(s => s.label === label)
        return sourceLabel ? sourceLabel.name : label.replace('src-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    
    // Get all available source labels to render
    const availableLabels = [
        'src-bug-fix',
        'src-new-feature',
        'src-golive-critical',
        'src-integration',
        'src-tech-debt',
        'src-maintenance',
        'src-enhancement',
        'src-research',
        'other'
    ]
    
    return (
        <div className="chart-container p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <p className="text-sm text-gray-600 mb-4">Shows tickets that left the Top 7 prioritized backlog (Priority Level &gt; 99 or cleared) categorized by source labels. Tickets with multiple labels are counted in all applicable categories.</p>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={realData.fixedTicketsTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="date" 
                        angle={timeInterval === 'monthly' ? -45 : 0}
                        textAnchor={timeInterval === 'monthly' ? 'end' : 'middle'}
                        height={timeInterval === 'monthly' ? 60 : 30}
                    />
                    <YAxis 
                        allowDecimals={false}
                        tickFormatter={(value) => Math.floor(value).toString()}
                    />
                    <Tooltip content={<FixedTicketsTooltip realData={realData} jiraConfig={jiraConfig} />} />
                    <Legend />
                    {availableLabels.map(label => (
                        <Bar 
                            key={label}
                            dataKey={label} 
                            stackId="label" 
                            fill={labelColors[label] || '#6b7280'} 
                            name={getLabelDisplayName(label)} 
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}