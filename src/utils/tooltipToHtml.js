/**
 * Utility to convert tooltip data into a formatted HTML page that opens in a new tab
 */

/**
 * Generates a formatted HTML page for Source Labels tooltip data
 * @param {string} dateLabel - The date label from the chart
 * @param {Array} payload - The chart payload data
 * @param {Object} realData - The real data object containing ticket information
 * @param {Object} jiraConfig - Jira configuration with baseUrl
 * @returns {string} HTML string for the new tab
 */
export const generateSourceLabelsHtml = (dateLabel, payload, realData, jiraConfig) => {
    const baseUrl = jiraConfig?.baseUrl || 'https://komutel.atlassian.net'
    
    // Get tickets for a specific source label and date
    const getTicketsForLabel = (dateLabel, sourceLabel) => {
        if (!realData?.sourceLabelsTimeSeries) {
            return []
        }
        
        const dataPoint = realData.sourceLabelsTimeSeries.find(d => d.date === dateLabel)
        if (!dataPoint) {
            return []
        }
        
        const ticketKeysField = `${sourceLabel}_tickets`
        return dataPoint[ticketKeysField] || []
    }
    
    // Build HTML sections for each source label
    const sections = payload
        .filter(entry => entry.value > 0)
        .map(entry => {
            const ticketKeys = getTicketsForLabel(dateLabel, entry.dataKey)
            const ticketLinks = ticketKeys
                .map(key => `<li><a href="${baseUrl}/browse/${key}" target="_blank" style="color: #2563eb; text-decoration: none;">${key}</a></li>`)
                .join('\n')
            
            return `
                <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 2px; background-color: ${entry.color}; margin-right: 8px;"></div>
                        <span style="font-size: 18px; font-weight: 600;">${entry.name}: ${entry.value} tickets</span>
                    </div>
                    ${ticketKeys.length > 0 ? `
                        <ul style="list-style: none; padding-left: 20px; margin: 8px 0;">
                            ${ticketLinks}
                        </ul>
                    ` : '<p style="padding-left: 20px; color: #6b7280; font-style: italic;">No ticket details available</p>'}
                </div>
            `
        })
        .join('\n')
    
    const totalTickets = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Source Label Occurrences - ${dateLabel}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 32px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #111827;
        }
        .date {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 24px;
        }
        a:hover {
            text-decoration: underline !important;
        }
        .summary {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            color: #4b5563;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Source Label Occurrences</h1>
        <div class="date">Date: ${dateLabel}</div>
        ${sections}
        <div class="summary">
            <strong>Total: ${totalTickets} tickets on ${dateLabel}</strong>
        </div>
    </div>
</body>
</html>
    `.trim()
}

/**
 * Generates a formatted HTML page for Fixed Tickets tooltip data
 * @param {string} dateLabel - The date label from the chart
 * @param {Array} payload - The chart payload data
 * @param {Object} realData - The real data object containing ticket information
 * @param {Object} jiraConfig - Jira configuration with baseUrl
 * @returns {string} HTML string for the new tab
 */
export const generateFixedTicketsHtml = (dateLabel, payload, realData, jiraConfig) => {
    const baseUrl = jiraConfig?.baseUrl || ''
    
    // Find the tickets that were fixed on this date
    const getFixedTickets = (dateLabel, sourceLabel) => {
        if (!realData?.tickets) {
            return []
        }
        
        // Enhanced date parsing
        let targetDate
        
        if (dateLabel.includes('/')) {
            const parts = dateLabel.split('/')
            if (parts.length === 2) {
                const month = parseInt(parts[0])
                const day = parseInt(parts[1])
                const year = new Date().getFullYear()
                targetDate = new Date(year, month - 1, day, 0, 0, 0, 0)
            } else if (parts.length === 3) {
                const month = parseInt(parts[0])
                const day = parseInt(parts[1])
                const year = parseInt(parts[2])
                targetDate = new Date(year, month - 1, day, 0, 0, 0, 0)
            }
        } else if (dateLabel.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateLabel.split('-').map(n => parseInt(n))
            targetDate = new Date(year, month - 1, day, 0, 0, 0, 0)
        } else if (dateLabel.match(/^\d{4}-\d{2}$/)) {
            const [year, month] = dateLabel.split('-').map(n => parseInt(n))
            targetDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
        } else {
            targetDate = new Date(dateLabel)
            if (isNaN(targetDate.getTime())) {
                return []
            }
            targetDate.setHours(0, 0, 0, 0)
        }
        
        const nextDate = new Date(targetDate)
        const timeInterval = realData.timeInterval || 'daily'
        if (timeInterval === 'daily') {
            nextDate.setDate(nextDate.getDate() + 1)
        } else if (timeInterval === 'weekly') {
            nextDate.setDate(nextDate.getDate() + 7)
        } else if (timeInterval === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + 1)
        }
        
        const fixedTickets = realData.tickets.filter(ticket => {
            if (!ticket.isOutgoing || !ticket.outgoingDate) {
                return false
            }
            
            const outgoingDate = new Date(ticket.outgoingDate)
            const outgoingDay = new Date(outgoingDate.getFullYear(), outgoingDate.getMonth(), outgoingDate.getDate(), 0, 0, 0, 0)
            const isInPeriod = outgoingDay >= targetDate && outgoingDay < nextDate
            
            if (!isInPeriod) {
                return false
            }
            
            let sourceMatches = false
            if (sourceLabel === 'other') {
                const knownLabels = ['src-bug-fix', 'src-new-feature', 'src-golive-critical', 
                                    'src-integration', 'src-tech-debt', 'src-maintenance', 
                                    'src-enhancement', 'src-research']
                sourceMatches = !ticket.sourceLabels || ticket.sourceLabels.length === 0 || 
                               !ticket.sourceLabels.some(label => knownLabels.includes(label))
            } else {
                sourceMatches = ticket.sourceLabels && ticket.sourceLabels.includes(sourceLabel)
            }
            
            return sourceMatches
        })
        
        return fixedTickets
    }
    
    const labelDisplayNames = {
        'src-bug-fix': 'Bug Fix',
        'src-new-feature': 'New Feature',
        'src-golive-critical': 'Go-Live Critical',
        'src-integration': 'Integration',
        'src-tech-debt': 'Tech Debt',
        'src-maintenance': 'Maintenance',
        'src-enhancement': 'Enhancement',
        'src-research': 'Research',
        'other': 'Other/No Label'
    }
    
    // Build HTML sections for each source label
    const sections = payload
        .filter(entry => entry.value > 0)
        .map(entry => {
            const sourceLabel = entry.dataKey
            const displayName = labelDisplayNames[sourceLabel] || entry.name
            const tickets = getFixedTickets(dateLabel, sourceLabel)
            
            const ticketRows = tickets
                .map(ticket => `
                    <li style="margin-bottom: 12px; padding: 8px; background-color: #f9fafb; border-radius: 4px;">
                        <a href="${baseUrl}/browse/${ticket.key}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 600;">
                            ${ticket.key}
                        </a>
                        <span style="color: #4b5563; margin-left: 8px;">- ${ticket.summary?.substring(0, 200)}${ticket.summary?.length > 200 ? '...' : ''}</span>
                    </li>
                `)
                .join('\n')
            
            return `
                <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
                    <p style="color: ${entry.color}; font-size: 18px; font-weight: 600; margin-bottom: 8px;">
                        ${displayName}: ${entry.value} ticket${entry.value > 1 ? 's' : ''}
                    </p>
                    ${tickets.length > 0 ? `
                        <ul style="list-style: none; padding-left: 16px; margin: 8px 0;">
                            ${ticketRows}
                        </ul>
                    ` : '<p style="padding-left: 16px; color: #6b7280; font-style: italic;">No ticket details available</p>'}
                </div>
            `
        })
        .join('\n')
    
    const totalTickets = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fixed Tickets - ${dateLabel}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 32px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #111827;
        }
        .date {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 24px;
        }
        a:hover {
            text-decoration: underline !important;
        }
        .summary {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            color: #4b5563;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Fixed Tickets</h1>
        <div class="date">Date: ${dateLabel}</div>
        ${sections}
        <div class="summary">
            <strong>Total: ${totalTickets} tickets left Top 7 on ${dateLabel}</strong>
        </div>
    </div>
</body>
</html>
    `.trim()
}

/**
 * Opens HTML content in a new tab
 * @param {string} htmlContent - The HTML string to display
 */
export const openHtmlInNewTab = (htmlContent) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
    }
}
