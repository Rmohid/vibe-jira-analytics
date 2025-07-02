import React, { useState, useEffect } from 'react'
import { Logger } from './utils/logger'
import { loadSavedConfig, generateJQL } from './utils/helpers'
import { DASHBOARD_CONFIG } from './config/dashboardConfig'
import { useJiraData } from './hooks/useJiraData'

// Component imports
import { DashboardRenderer } from './components/DashboardRenderer'
import { ConnectionStatus } from './components/ui/ConnectionStatus'
import { ConfigPanel } from './components/ui/ConfigPanel'
import { DevPanel } from './components/ui/DevPanel'
import { LogsPanel } from './components/ui/LogsPanel'
import { DatabaseIcon, RefreshIcon, SettingsIcon } from './components/icons/Icons'

import './styles/styles.css'

const JiraAnalyticsApp = () => {
    const [showConfig, setShowConfig] = useState(false)
    const [showDevPanel, setShowDevPanel] = useState(false)
    const [showLogs, setShowLogs] = useState(false)
    
    // Always use production mode
    const isProductionMode = true
    
    // Jira configuration
    const [jiraConfig, setJiraConfig] = useState(loadSavedConfig())
    
    // Time period and interval settings
    const [timePeriod, setTimePeriod] = useState('30d') // 7d, 30d, 90d, 180d, 365d, custom
    const [timeInterval, setTimeInterval] = useState('daily') // daily, weekly, monthly
    const [customDays, setCustomDays] = useState(30)
    
    // Use custom hook for data management
    const {
        loading,
        connectionStatus,
        lastSync,
        realData,
        error,
        fetchData,
        setRealData,
        setError,
        setLoading
    } = useJiraData(jiraConfig, timePeriod, timeInterval, customDays)
    
    // Charts are now available via npm imports
    
    // Log component initialization
    useEffect(() => {
        try {
            Logger.debug('INIT', 'JiraAnalyticsApp component mounted', {
                reactVersion: React.version,
                userAgent: navigator.userAgent,
                viewport: { width: window.innerWidth, height: window.innerHeight }
            })
            Logger.state('APP', { isProductionMode }, 'INIT')
        } catch (error) {
            console.error('Error in init useEffect:', error)
        }
    }, [])
    
    // Log state changes
    useEffect(() => {
        try {
            Logger.state('APP', { loading, connectionStatus, error: !!error }, 'STATE_UPDATE')
        } catch (error) {
            console.error('Error in state logging useEffect:', error)
        }
    }, [loading, connectionStatus, error])
    
    // Update JQL when time period changes
    useEffect(() => {
        const newJQL = generateJQL(jiraConfig.project, timePeriod, customDays)
        setJiraConfig(prev => ({ ...prev, jqlQuery: newJQL }))
    }, [timePeriod, customDays, jiraConfig.project])
    
    // Save config to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('jiraConfig', JSON.stringify(jiraConfig))
        } catch (e) {
            console.error('Error saving config:', e)
        }
    }, [jiraConfig])
    
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex items-center">
                            <DatabaseIcon />
                            <div className="ml-3">
                                <h1 className="text-2xl font-bold text-gray-900">Jira Analytics Dashboard</h1>
                                <ConnectionStatus connectionStatus={connectionStatus} lastSync={lastSync} />
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            {/* Developer Tools */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowDevPanel(!showDevPanel)}
                                    className="flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                                    title="Toggle developer panel"
                                >
                                    🔧 Dev
                                </button>
                                <button
                                    onClick={() => setShowLogs(!showLogs)}
                                    className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                    title="Toggle logs panel"
                                >
                                    📋 Logs
                                </button>
                            </div>

                            {/* Time Period Selector */}
                            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Period:</span>
                                <select
                                    value={timePeriod}
                                    onChange={(e) => setTimePeriod(e.target.value)}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value="7d">Last 7 days</option>
                                    <option value="30d">Last 30 days</option>
                                    <option value="90d">Last 90 days</option>
                                    <option value="180d">Last 180 days</option>
                                    <option value="365d">Last year</option>
                                    <option value="custom">Custom</option>
                                </select>
                                {timePeriod === 'custom' && (
                                    <input
                                        type="number"
                                        value={customDays}
                                        onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                                        min="1"
                                        max="730"
                                    />
                                )}
                            </div>

                            {/* Time Interval Selector */}
                            <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Interval:</span>
                                <select
                                    value={timeInterval}
                                    onChange={(e) => setTimeInterval(e.target.value)}
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            
                            <button
                                onClick={() => setShowConfig(!showConfig)}
                                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                <SettingsIcon />
                                <span className="ml-2">{showConfig ? 'Hide Config' : 'Show Config'}</span>
                            </button>
                            
                            <button
                                onClick={fetchData}
                                disabled={loading || !jiraConfig.apiToken}
                                className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                            >
                                <RefreshIcon spinning={loading} />
                                <span className="ml-2">{loading ? 'Fetching...' : 'Fetch Data'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Mode Information */}
                    <div className="mt-4 p-3 rounded-lg border bg-green-50 border-green-200">
                        <div className="flex items-start">
                            <DatabaseIcon />
                            <div className="ml-3 text-sm text-green-800">
                                <p className="font-medium mb-1">Production Mode - Live Jira Connection</p>
                                <p>Connected to real Jira API endpoints. Requires valid API token and backend server running on localhost:3001.</p>
                            </div>
                        </div>
                    </div>

                    {/* Configuration Panel */}
                    <ConfigPanel 
                        showConfig={showConfig}
                        jiraConfig={jiraConfig}
                        setJiraConfig={setJiraConfig}
                        timePeriod={timePeriod}
                        customDays={customDays}
                    />

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>

                {/* Dynamic Dashboard Content */}
                <DashboardRenderer 
                    sections={DASHBOARD_CONFIG.sections}
                    realData={realData}
                    jiraConfig={jiraConfig}
                    timePeriod={timePeriod}
                    customDays={customDays}
                    timeInterval={timeInterval}
                />

                {/* No Data State */}
                {!realData && !loading && (
                    <div className="chart-container p-12 text-center">
                        <DatabaseIcon />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Loaded</h3>
                        <p className="text-gray-500 mb-6">
                            {!jiraConfig.apiToken 
                                ? 'Configure your Jira API token and click "Fetch Data" to load live ticket information.'
                                : 'Click "Fetch Data" to load your Jira tickets and analytics.'
                            }
                        </p>
                        <button
                            onClick={fetchData}
                            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                        >
                            Load Live Data
                        </button>
                    </div>
                )}

                {/* Developer Panel */}
                <DevPanel 
                    showDevPanel={showDevPanel}
                    setShowDevPanel={setShowDevPanel}
                    setRealData={setRealData}
                    setError={setError}
                    setLoading={setLoading}
                    realData={realData}
                    error={error}
                />

                {/* Logs Panel */}
                <LogsPanel 
                    showLogs={showLogs}
                    setShowLogs={setShowLogs}
                />
            </div>
        </div>
    )
}

export default JiraAnalyticsApp