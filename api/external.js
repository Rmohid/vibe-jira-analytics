const express = require('express')
const router = express.Router()
const fs = require('fs').promises
const path = require('path')

// Helper function to load cached data
async function loadCachedData() {
    try {
        const ticketsPath = path.join(__dirname, '..', 'data', 'tickets.json')
        const historicalPath = path.join(__dirname, '..', 'data', 'historical.json')
        
        const [ticketsData, historicalData] = await Promise.all([
            fs.readFile(ticketsPath, 'utf8').catch(() => '{}'),
            fs.readFile(historicalPath, 'utf8').catch(() => '{}')
        ])
        
        return {
            tickets: JSON.parse(ticketsData),
            historical: JSON.parse(historicalData)
        }
    } catch (error) {
        console.error('Error loading cached data:', error)
        return { tickets: {}, historical: {} }
    }
}

// Helper function to calculate metrics
function calculateMetrics(tickets) {
    if (!tickets || !Array.isArray(tickets)) return {}
    
    const metrics = {
        total: tickets.length,
        byPriority: {
            high: 0,
            medium: 0,
            low: 0,
            unknown: 0
        },
        byStatus: {},
        bySource: {},
        avgTimeInTop7: {
            overall: 0,
            high: 0,
            medium: 0,
            low: 0
        },
        top7Count: 0,
        fixedToday: 0,
        incomingToday: 0
    }
    
    let timeInTop7Sum = { overall: 0, high: 0, medium: 0, low: 0 }
    let timeInTop7Count = { overall: 0, high: 0, medium: 0, low: 0 }
    const today = new Date().toISOString().split('T')[0]
    
    tickets.forEach(ticket => {
        // Priority metrics
        const priority = ticket.priorityCategory || 'unknown'
        metrics.byPriority[priority]++
        
        // Status metrics
        const status = ticket.status || 'Unknown'
        metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1
        
        // Source label metrics
        if (ticket.sourceLabels && Array.isArray(ticket.sourceLabels)) {
            ticket.sourceLabels.forEach(label => {
                metrics.bySource[label] = (metrics.bySource[label] || 0) + 1
            })
        }
        
        // Time in Top 7 metrics
        if (ticket.timeInTop7Days !== undefined && ticket.timeInTop7Days !== null) {
            timeInTop7Sum.overall += ticket.timeInTop7Days
            timeInTop7Count.overall++
            
            if (priority !== 'unknown') {
                timeInTop7Sum[priority] += ticket.timeInTop7Days
                timeInTop7Count[priority]++
            }
        }
        
        // Top 7 count (Priority Level < 100)
        if (ticket.priorityLevel && ticket.priorityLevel < 100) {
            metrics.top7Count++
        }
        
        // Fixed today
        if (ticket.outgoingDate && ticket.outgoingDate.startsWith(today)) {
            metrics.fixedToday++
        }
        
        // Incoming today
        if (ticket.incomingDate && ticket.incomingDate.startsWith(today)) {
            metrics.incomingToday++
        }
    })
    
    // Calculate averages
    Object.keys(timeInTop7Sum).forEach(key => {
        if (timeInTop7Count[key] > 0) {
            metrics.avgTimeInTop7[key] = Math.round(timeInTop7Sum[key] / timeInTop7Count[key] * 10) / 10
        }
    })
    
    return metrics
}

// ======================
// GRAFANA-COMPATIBLE ENDPOINTS
// ======================

// Health check endpoint for Grafana
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Metrics endpoint (Prometheus-style for Grafana)
router.get('/metrics', async (req, res) => {
    try {
        const { tickets } = await loadCachedData()
        const metrics = calculateMetrics(tickets.tickets || [])
        
        // Format as Prometheus metrics for Grafana
        let prometheusMetrics = []
        
        // Total tickets
        prometheusMetrics.push(`jira_tickets_total ${metrics.total}`)
        
        // By priority
        Object.entries(metrics.byPriority).forEach(([priority, count]) => {
            prometheusMetrics.push(`jira_tickets_by_priority{priority="${priority}"} ${count}`)
        })
        
        // By status
        Object.entries(metrics.byStatus).forEach(([status, count]) => {
            prometheusMetrics.push(`jira_tickets_by_status{status="${status}"} ${count}`)
        })
        
        // By source
        Object.entries(metrics.bySource).forEach(([source, count]) => {
            prometheusMetrics.push(`jira_tickets_by_source{source="${source}"} ${count}`)
        })
        
        // Average time in Top 7
        Object.entries(metrics.avgTimeInTop7).forEach(([category, avg]) => {
            prometheusMetrics.push(`jira_avg_time_in_top7_days{category="${category}"} ${avg}`)
        })
        
        // Current metrics
        prometheusMetrics.push(`jira_top7_current_count ${metrics.top7Count}`)
        prometheusMetrics.push(`jira_fixed_today_count ${metrics.fixedToday}`)
        prometheusMetrics.push(`jira_incoming_today_count ${metrics.incomingToday}`)
        
        res.set('Content-Type', 'text/plain')
        res.send(prometheusMetrics.join('\n'))
    } catch (error) {
        console.error('Error generating metrics:', error)
        res.status(500).json({ error: 'Failed to generate metrics' })
    }
})

// JSON metrics endpoint (alternative format)
router.get('/metrics/json', async (req, res) => {
    try {
        const { tickets } = await loadCachedData()
        const metrics = calculateMetrics(tickets.tickets || [])
        res.json(metrics)
    } catch (error) {
        console.error('Error generating JSON metrics:', error)
        res.status(500).json({ error: 'Failed to generate metrics' })
    }
})

// ======================
// TIME SERIES ENDPOINTS
// ======================

// Time series data for Grafana
router.get('/timeseries/:metric', async (req, res) => {
    try {
        const { metric } = req.params
        const { from, to, interval = 'daily' } = req.query
        const { historical } = await loadCachedData()
        
        if (!historical.timeSeries) {
            return res.json([])
        }
        
        let data = []
        
        switch (metric) {
            case 'average-time':
                // Average time in Top 7 over time
                if (historical.averageAgeTimeSeries) {
                    data = historical.averageAgeTimeSeries.map(point => ({
                        time: new Date(point.date).getTime(),
                        high: point.high || 0,
                        medium: point.medium || 0,
                        low: point.low || 0
                    }))
                }
                break
                
            case 'fixed-tickets':
                // Fixed tickets over time
                if (historical.fixedTicketsTimeSeries) {
                    data = historical.fixedTicketsTimeSeries.map(point => ({
                        time: new Date(point.date).getTime(),
                        ...point.sources
                    }))
                }
                break
                
            case 'incoming-outgoing':
                // Incoming vs outgoing tickets
                if (historical.sourceLabelsTimeSeries) {
                    data = historical.sourceLabelsTimeSeries.map(point => ({
                        time: new Date(point.date).getTime(),
                        incoming: point.incoming || {},
                        outgoing: point.outgoing || {}
                    }))
                }
                break
                
            default:
                return res.status(400).json({ error: 'Invalid metric type' })
        }
        
        // Filter by date range if provided
        if (from || to) {
            const fromTime = from ? new Date(from).getTime() : 0
            const toTime = to ? new Date(to).getTime() : Date.now()
            data = data.filter(point => point.time >= fromTime && point.time <= toTime)
        }
        
        res.json(data)
    } catch (error) {
        console.error('Error generating time series:', error)
        res.status(500).json({ error: 'Failed to generate time series' })
    }
})

// Grafana-compatible query endpoint
router.post('/query', async (req, res) => {
    try {
        const { targets, range } = req.body
        const { tickets, historical } = await loadCachedData()
        
        const results = []
        
        for (const target of targets) {
            const { target: metricName, type = 'timeserie' } = target
            
            if (type === 'table') {
                // Return table data for Grafana
                const tableData = {
                    columns: [
                        { text: 'Key', type: 'string' },
                        { text: 'Summary', type: 'string' },
                        { text: 'Priority Level', type: 'number' },
                        { text: 'Time in Top 7', type: 'number' },
                        { text: 'Status', type: 'string' }
                    ],
                    rows: [],
                    type: 'table'
                }
                
                if (tickets.tickets) {
                    tableData.rows = tickets.tickets
                        .filter(t => t.priorityLevel && t.priorityLevel < 100)
                        .slice(0, 100)
                        .map(t => [
                            t.key,
                            t.summary,
                            t.priorityLevel,
                            t.timeInTop7Days,
                            t.status
                        ])
                }
                
                results.push(tableData)
            } else {
                // Return time series data
                const datapoints = []
                
                switch (metricName) {
                    case 'top7_count':
                        // Current Top 7 count over time
                        if (historical.timeSeries) {
                            historical.timeSeries.forEach(point => {
                                const timestamp = new Date(point.date).getTime()
                                const count = (point.high || 0) + (point.medium || 0)
                                datapoints.push([count, timestamp])
                            })
                        }
                        break
                        
                    case 'avg_time_high':
                        // Average time for high priority
                        if (historical.averageAgeTimeSeries) {
                            historical.averageAgeTimeSeries.forEach(point => {
                                const timestamp = new Date(point.date).getTime()
                                datapoints.push([point.high || 0, timestamp])
                            })
                        }
                        break
                        
                    case 'avg_time_medium':
                        // Average time for medium priority
                        if (historical.averageAgeTimeSeries) {
                            historical.averageAgeTimeSeries.forEach(point => {
                                const timestamp = new Date(point.date).getTime()
                                datapoints.push([point.medium || 0, timestamp])
                            })
                        }
                        break
                        
                    case 'fixed_daily':
                        // Fixed tickets per day
                        if (historical.fixedTicketsTimeSeries) {
                            historical.fixedTicketsTimeSeries.forEach(point => {
                                const timestamp = new Date(point.date).getTime()
                                const total = Object.values(point.sources || {}).reduce((a, b) => a + b, 0)
                                datapoints.push([total, timestamp])
                            })
                        }
                        break
                }
                
                results.push({
                    target: metricName,
                    datapoints: datapoints
                })
            }
        }
        
        res.json(results)
    } catch (error) {
        console.error('Error processing query:', error)
        res.status(500).json({ error: 'Failed to process query' })
    }
})

// ======================
// TICKET DATA ENDPOINTS
// ======================

// Get all tickets (with pagination)
router.get('/tickets', async (req, res) => {
    try {
        const { page = 1, limit = 100, priority, status, inTop7 } = req.query
        const { tickets } = await loadCachedData()
        
        if (!tickets.tickets) {
            return res.json({ tickets: [], total: 0, page: 1, limit: 100 })
        }
        
        let filteredTickets = [...tickets.tickets]
        
        // Apply filters
        if (priority) {
            filteredTickets = filteredTickets.filter(t => t.priorityCategory === priority)
        }
        
        if (status) {
            filteredTickets = filteredTickets.filter(t => t.status === status)
        }
        
        if (inTop7 === 'true') {
            filteredTickets = filteredTickets.filter(t => t.priorityLevel && t.priorityLevel < 100)
        }
        
        // Pagination
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + parseInt(limit)
        const paginatedTickets = filteredTickets.slice(startIndex, endIndex)
        
        res.json({
            tickets: paginatedTickets,
            total: filteredTickets.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(filteredTickets.length / limit)
        })
    } catch (error) {
        console.error('Error fetching tickets:', error)
        res.status(500).json({ error: 'Failed to fetch tickets' })
    }
})

// Get ticket by key
router.get('/tickets/:key', async (req, res) => {
    try {
        const { key } = req.params
        const { tickets } = await loadCachedData()
        
        if (!tickets.tickets) {
            return res.status(404).json({ error: 'Ticket not found' })
        }
        
        const ticket = tickets.tickets.find(t => t.key === key)
        
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' })
        }
        
        res.json(ticket)
    } catch (error) {
        console.error('Error fetching ticket:', error)
        res.status(500).json({ error: 'Failed to fetch ticket' })
    }
})

// Get aggregated statistics
router.get('/stats', async (req, res) => {
    try {
        const { tickets, historical } = await loadCachedData()
        const metrics = calculateMetrics(tickets.tickets || [])
        
        const stats = {
            current: metrics,
            trends: {
                last7Days: {},
                last30Days: {},
                last90Days: {}
            },
            topTicketsByTime: [],
            recentlyFixed: [],
            recentlyAdded: []
        }
        
        if (tickets.tickets) {
            // Top tickets by time in Top 7
            stats.topTicketsByTime = tickets.tickets
                .filter(t => t.priorityLevel && t.priorityLevel < 100)
                .sort((a, b) => (b.timeInTop7Days || 0) - (a.timeInTop7Days || 0))
                .slice(0, 10)
                .map(t => ({
                    key: t.key,
                    summary: t.summary,
                    timeInTop7Days: t.timeInTop7Days,
                    priorityLevel: t.priorityLevel,
                    status: t.status
                }))
            
            // Recently fixed tickets
            stats.recentlyFixed = tickets.tickets
                .filter(t => t.outgoingDate)
                .sort((a, b) => new Date(b.outgoingDate) - new Date(a.outgoingDate))
                .slice(0, 10)
                .map(t => ({
                    key: t.key,
                    summary: t.summary,
                    outgoingDate: t.outgoingDate,
                    timeInTop7Days: t.timeInTop7Days
                }))
            
            // Recently added to Top 7
            stats.recentlyAdded = tickets.tickets
                .filter(t => t.incomingDate)
                .sort((a, b) => new Date(b.incomingDate) - new Date(a.incomingDate))
                .slice(0, 10)
                .map(t => ({
                    key: t.key,
                    summary: t.summary,
                    incomingDate: t.incomingDate,
                    priorityLevel: t.priorityLevel
                }))
        }
        
        res.json(stats)
    } catch (error) {
        console.error('Error generating stats:', error)
        res.status(500).json({ error: 'Failed to generate statistics' })
    }
})

// Get source labels
router.get('/sources', async (req, res) => {
    try {
        const { tickets } = await loadCachedData()
        const sources = new Set()
        
        if (tickets.tickets) {
            tickets.tickets.forEach(ticket => {
                if (ticket.sourceLabels && Array.isArray(ticket.sourceLabels)) {
                    ticket.sourceLabels.forEach(label => sources.add(label))
                }
            })
        }
        
        res.json(Array.from(sources).sort())
    } catch (error) {
        console.error('Error fetching sources:', error)
        res.status(500).json({ error: 'Failed to fetch sources' })
    }
})

// ======================
// GRAFANA ANNOTATIONS
// ======================

// Annotations endpoint for Grafana
router.post('/annotations', async (req, res) => {
    try {
        const { range, annotation } = req.body
        const { tickets } = await loadCachedData()
        
        const annotations = []
        
        if (!tickets.tickets) {
            return res.json(annotations)
        }
        
        const fromTime = new Date(range.from).getTime()
        const toTime = new Date(range.to).getTime()
        
        // Find significant events in the time range
        tickets.tickets.forEach(ticket => {
            // Ticket entered Top 7
            if (ticket.incomingDate) {
                const time = new Date(ticket.incomingDate).getTime()
                if (time >= fromTime && time <= toTime) {
                    annotations.push({
                        time: time,
                        title: 'Entered Top 7',
                        tags: ['incoming', ticket.priorityCategory],
                        text: `${ticket.key}: ${ticket.summary}`
                    })
                }
            }
            
            // Ticket left Top 7
            if (ticket.outgoingDate) {
                const time = new Date(ticket.outgoingDate).getTime()
                if (time >= fromTime && time <= toTime) {
                    annotations.push({
                        time: time,
                        title: 'Left Top 7',
                        tags: ['outgoing', ticket.priorityCategory],
                        text: `${ticket.key}: ${ticket.summary}`
                    })
                }
            }
        })
        
        res.json(annotations)
    } catch (error) {
        console.error('Error generating annotations:', error)
        res.status(500).json({ error: 'Failed to generate annotations' })
    }
})

module.exports = router