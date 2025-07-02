import React, { useState } from 'react'
import { AlertIcon, TrendingIcon, ClockIcon, DatabaseIcon } from '../icons/Icons'
import { PriorityCardTooltip } from '../tooltips/PriorityCardTooltip'

export const OverviewPanel = ({ realData, jiraConfig }) => {
    const [hoveredCard, setHoveredCard] = useState(null)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    
    if (!realData) return null
    
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
    
    const calculateAverageAge = (priority) => {
        if (!realData.tickets || realData.tickets.length === 0) return 0
        
        const filteredTickets = realData.tickets.filter(ticket => {
            const pl = ticket.priorityLevel || ticket.currentPriorityLevel?.value
            if (priority === 'high') return pl < 10
            if (priority === 'medium') return pl >= 10 && pl < 100
            if (priority === 'low') return pl >= 100
            return true // total
        })
        
        if (filteredTickets.length === 0) return 0
        
        const totalAge = filteredTickets.reduce((sum, ticket) => {
            const age = ticket.ageInDays || 0
            return sum + age
        }, 0)
        
        return Math.round(totalAge / filteredTickets.length)
    }
    
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        })
    }
    
    return (
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
                                    averageAge={calculateAverageAge(card.key)}
                                    jiraConfig={jiraConfig}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}