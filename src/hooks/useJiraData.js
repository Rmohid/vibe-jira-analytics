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
            console.log('[useJiraData] Starting API calls...');
            
            const [currentData, historicalData] = await Promise.all([
                productionJiraAPI('current-tickets', { ...jiraConfig, timePeriod, timeInterval, customDays, startDate, endDate }),
                productionJiraAPI('historical-data', { ...jiraConfig, timePeriod, timeInterval, startDate, endDate })
            ])

            console.log('[useJiraData] API responses received:', {
                currentDataTickets: currentData.tickets?.length || 0,
                historicalDataTickets: historicalData.tickets?.length || 0,
                firstCurrentTicket: currentData.tickets?.[0] ? {
                    key: currentData.tickets[0].key,
                    timeInTop7Days: currentData.tickets[0].timeInTop7Days,
                    ageInDays: currentData.tickets[0].ageInDays
                } : 'no tickets',
                firstHistoricalTicket: historicalData.tickets?.[0] ? {
                    key: historicalData.tickets[0].key,
                    timeInTop7Days: historicalData.tickets[0].timeInTop7Days,
                    ageInDays: historicalData.tickets[0].ageInDays
                } : 'no tickets'
            });

            const finalTickets = historicalData.tickets || currentData.tickets;
            console.log('[useJiraData] Using tickets from:', historicalData.tickets ? 'historical' : 'current', 'count:', finalTickets?.length || 0);
            
            if (finalTickets && finalTickets.length > 0) {
                console.log('[useJiraData] First 3 tickets timeInTop7Days:', finalTickets.slice(0, 3).map(t => ({
                    key: t.key,
                    timeInTop7Days: t.timeInTop7Days,
                    ageInDays: t.ageInDays,
                    allProps: Object.keys(t)
                })));
                
                console.log('[useJiraData] Raw first ticket from API:', finalTickets[0]);
            }

            setRealData({
                currentCounts: currentData.counts,
                tickets: currentData.tickets, // Always use current tickets for display (they have timeInTop7Days)
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