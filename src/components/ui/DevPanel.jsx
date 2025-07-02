import React from 'react'
import { Logger } from '../../utils/logger'
import { DASHBOARD_CONFIG } from '../../config/dashboardConfig'

export const DevPanel = ({ 
    showDevPanel, 
    setShowDevPanel, 
    setRealData, 
    setError, 
    setLoading, 
    realData, 
    error 
}) => {
    if (!showDevPanel) return null

    // Charts now available via npm imports
    const ChartsAvailable = true

    const exportConfig = () => {
        const config = JSON.stringify(DASHBOARD_CONFIG, null, 2)
        const blob = new Blob([config], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'dashboard-config.json'
        a.click()
        URL.revokeObjectURL(url)
        Logger.debug('DEV', 'Exported dashboard config')
    }

    const exportData = () => {
        const data = JSON.stringify(realData, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'dashboard-data.json'
        a.click()
        URL.revokeObjectURL(url)
        Logger.debug('DEV', 'Exported dashboard data')
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-purple-900 text-white p-4 max-h-64 overflow-auto z-50 border-t-4 border-purple-500">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">🔧 Developer Panel</h3>
                <button 
                    onClick={() => setShowDevPanel(false)}
                    className="text-purple-300 hover:text-white"
                >
                    ✕
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <h4 className="font-medium mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                        <button 
                            onClick={() => { 
                                setRealData(null) 
                                Logger.debug('DEV', 'Cleared all data') 
                            }}
                            className="block w-full text-left px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm"
                        >
                            Clear Data
                        </button>
                        <button 
                            onClick={() => { 
                                setError('Test error message from dev panel') 
                                Logger.debug('DEV', 'Triggered test error') 
                            }}
                            className="block w-full text-left px-3 py-1 bg-orange-600 rounded hover:bg-orange-700 text-sm"
                        >
                            Trigger Error
                        </button>
                        <button 
                            onClick={() => { 
                                setLoading(true) 
                                setTimeout(() => setLoading(false), 3000) 
                                Logger.debug('DEV', 'Triggered loading state') 
                            }}
                            className="block w-full text-left px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                        >
                            Test Loading (3s)
                        </button>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-medium mb-2">Data Export</h4>
                    <div className="space-y-2">
                        <button 
                            onClick={exportConfig}
                            className="block w-full text-left px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm"
                        >
                            Export Config
                        </button>
                        <button 
                            onClick={exportData}
                            className="block w-full text-left px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm"
                        >
                            Export Data
                        </button>
                        <button 
                            onClick={Logger.exportLogs}
                            className="block w-full text-left px-3 py-1 bg-green-600 rounded hover:bg-green-700 text-sm"
                        >
                            Export Logs
                        </button>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-medium mb-2">System Info</h4>
                    <div className="text-xs space-y-1">
                        <div>React: {React.version}</div>
                        <div>Charts: {ChartsAvailable ? '✅ Loaded' : '❌ Failed'}</div>
                        <div>Mode: Production</div>
                        <div>Data: {realData ? '✅ Loaded' : '❌ None'}</div>
                        <div>Error: {error ? '❌ Yes' : '✅ None'}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}