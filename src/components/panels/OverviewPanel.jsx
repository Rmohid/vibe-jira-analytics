import React from 'react'
import { AlertIcon, TrendingIcon, ClockIcon, DatabaseIcon } from '../icons/Icons'

export const OverviewPanel = ({ realData }) => {
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
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {cardData.map(card => {
                const colors = getCardColor(card.key)
                return (
                    <div key={card.key} className={`${colors.bg} ${colors.border} border rounded-lg p-4`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`${colors.text} text-sm font-medium`}>{card.label}</p>
                                <p className={`text-3xl font-bold ${colors.value}`}>{card.value}</p>
                            </div>
                            {getCardIcon(card.key)}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}