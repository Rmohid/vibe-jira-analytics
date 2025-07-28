import React, { useState } from 'react'
import { AlertIcon, TrendingIcon, ClockIcon, DatabaseIcon } from '../icons/Icons'
import { PriorityCardTooltip } from '../tooltips/PriorityCardTooltip'

export const OverviewPanel = ({ realData, jiraConfig, timePeriod, customDays, startDate, endDate }) => {
    const [hoveredCard, setHoveredCard] = useState(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    
    if (!realData) return null
    
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
    
    const cardData = [
        { key: 'high', label: 'High Priority', value: realData.currentCounts?.high || 0 },
        { key: 'medium', label: 'Medium Priority', value: realData.currentCounts?.medium || 0 },
        { key: 'low', label: 'Low Priority', value: realData.currentCounts?.low || 0 },
        { key: 'total', label: 'Total Active', value: realData.currentCounts?.total || 0 }
    ]
    
    const getCardIcon = (key) => {
        switch(key) {
            case 'high': return <AlertIcon />
            case 'medium': return <TrendingIcon />
            case 'low': return <ClockIcon />
            default: return <DatabaseIcon />
        }
    }
    
    const getCardColor = (key) => {
        const colors = {
            high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', value: 'text-red-700' },
            medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', value: 'text-yellow-700' },
            low: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', value: 'text-blue-700' },
            total: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', value: 'text-gray-700' }
        }
        return colors[key] || colors.total
    }
    
    const calculateMaximumAge = (priority) => {
        if (!realData.tickets || realData.tickets.length === 0) return 0
        
        // Use same categorization logic as backend
        const categorizePriority = (priorityLevel) => {
            if (priorityLevel === null || priorityLevel === undefined) return 'unknown'
            if (priorityLevel < 10) return 'high'
            if (priorityLevel < 100) return 'medium'
            return 'low'
        }
        
        const filteredTickets = realData.tickets.filter(ticket => {
            // Use the same priority field as backend: customfield_11129
            const pl = ticket.fields?.customfield_11129 || ticket.priorityLevel || ticket.currentPriorityLevel?.value
            const category = categorizePriority(pl)
            
            if (priority === 'high') return category === 'high'
            if (priority === 'medium') return category === 'medium'
            if (priority === 'low') return category === 'low'
            if (priority === 'unknown') return category === 'unknown'
            return true // total - include all categories
        })
        
        if (filteredTickets.length === 0) return 0
        
        const maxAge = filteredTickets.reduce((max, ticket) => {
            const age = ticket.timeInTop7Days || ticket.ageInDays || 0
            return Math.max(max, age)
        }, 0)
        
        return maxAge
    }
    
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
    }
    
    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Current Overview: Top 7 - {getPeriodLabel()}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {cardData.map(card => {
                const colors = getCardColor(card.key)
                const shouldShowTooltip = card.key !== 'total' && card.value > 0
                
                return (
                    <div 
                        key={card.key} 
                        className={`${colors.bg} ${colors.border} border rounded-lg p-4 relative cursor-pointer transition-all hover:shadow-lg`}
                        onMouseEnter={() => shouldShowTooltip && setHoveredCard(card.key)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onMouseMove={handleMouseMove}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`${colors.text} text-sm font-medium`}>{card.label}</p>
                                <p className={`text-3xl font-bold ${colors.value}`}>{card.value}</p>
                            </div>
                            {getCardIcon(card.key)}
                        </div>
                        {hoveredCard === card.key && shouldShowTooltip && (
                            <div style={{ 
                                position: 'absolute',
                                left: mousePosition.x + 10,
                                top: mousePosition.y + 10,
                                zIndex: 50
                            }}>
                                <PriorityCardTooltip
                                    priority={card.key}
                                    tickets={realData.tickets}
                                    maximumAge={calculateMaximumAge(card.key)}
                                    jiraConfig={jiraConfig}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
            </div>
        </div>
    )
}