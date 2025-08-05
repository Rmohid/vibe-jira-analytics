import { useState, useEffect, useCallback } from 'react'
import { productionJiraAPI } from '../utils/api'
import { Logger } from '../utils/logger'

export const useJiraData = (jiraConfig, timePeriod, timeInterval, customDays, startDate, endDate) => {
    const [loading, setLoading] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState('disconnected')
    const [lastSync, setLastSync] = useState(null)
    const [realData, setRealData] = useState(null)
    const [error, setError] = useState(null)
    
    // Fetch data function
    const fetchData = useCallback(async () => {
        if (!jiraConfig.apiToken) {
            setError('API Token is required')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const [currentData, historicalData] = await Promise.all([
                productionJiraAPI('current-tickets', { ...jiraConfig, timePeriod, timeInterval, customDays, startDate, endDate }),
                productionJiraAPI('historical-data', { ...jiraConfig, timePeriod, timeInterval, startDate, endDate })
            ])

            setRealData({
                currentCounts: currentData.counts,
                tickets: historicalData.tickets || currentData.tickets, // Use historical tickets if available
                historicalTrend: historicalData.timeSeries,
                sourceLabelsTimeSeries: historicalData.sourceLabelsTimeSeries,
                averageAgeTimeSeries: historicalData.averageAgeTimeSeries,
                fixedTicketsTimeSeries: historicalData.fixedTicketsTimeSeries,
                sourceLabels: historicalData.sourceLabels,
                timeInterval: historicalData.timeInterval || 'daily', // Pass timeInterval for tooltip
                lastUpdated: new Date().toISOString()
            })

            setConnectionStatus('connected')
            setLastSync(new Date().toISOString())

        } catch (err) {
            setError(err.message)
            setConnectionStatus('error')
        } finally {
            setLoading(false)
        }
    }, [jiraConfig, timePeriod, timeInterval, customDays, startDate, endDate])
    
    // Auto-refresh when time period or interval changes
    useEffect(() => {
        try {
            // Only refresh if we have data and are connected
            if (realData && connectionStatus === 'connected') {
                Logger.debug('AUTO-REFRESH', 'Auto-refreshing data due to parameter change')
                fetchData()
            }
        } catch (error) {
            console.error('Error in auto-refresh useEffect:', error)
            Logger.error('AUTO-REFRESH', 'Failed to auto-refresh', error)
        }
    }, [timePeriod, timeInterval, customDays, fetchData])
    
    return {
        loading,
        connectionStatus,
        lastSync,
        realData,
        error,
        fetchData,
        setRealData,
        setError,
        setLoading
    }
}