import React from 'react'
import { OverviewPanel } from './panels/OverviewPanel'
import { TrendsPanel } from './panels/TrendsPanel'
import { SourcesPanel } from './panels/SourcesPanel'
import { TicketsPanel } from './panels/TicketsPanel'

// Dynamic Dashboard Renderer
export const DashboardRenderer = ({ sections, realData, jiraConfig, timePeriod, customDays, timeInterval }) => {
    const renderSection = (section) => {
        if (!section.enabled) return null
        
        const commonProps = { realData, jiraConfig, timePeriod, customDays, timeInterval }
        
        switch(section.component) {
            case 'OverviewPanel':
                return <OverviewPanel key={section.id} {...commonProps} />
            case 'TrendsPanel':
                return <TrendsPanel key={section.id} {...commonProps} />
            case 'SourcesPanel':
                return <SourcesPanel key={section.id} {...commonProps} />
            case 'TicketsPanel':
                return <TicketsPanel key={section.id} {...commonProps} />
            default:
                return null
        }
    }
    
    return (
        <div className="space-y-6">
            {sections.map(renderSection)}
        </div>
    )
}