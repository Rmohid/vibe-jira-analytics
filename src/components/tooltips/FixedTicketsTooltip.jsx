import React from 'react'
import { FixedTicketsContent } from './FixedTicketsContent'

export const FixedTicketsTooltip = ({ active, payload, label, realData, jiraConfig }) => {
    if (!active || !payload || !payload.length) return null
    
    return <FixedTicketsContent dateLabel={label} payload={payload} realData={realData} jiraConfig={jiraConfig} isModal={false} />
}