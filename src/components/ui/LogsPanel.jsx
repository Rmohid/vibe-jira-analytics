import React from 'react'
import { Logger } from '../../utils/logger'

export const LogsPanel = ({ showLogs, setShowLogs }) => {
    if (!showLogs) return null

    const logs = Logger.getLogs()

    return (
        <div className="fixed top-16 right-4 w-96 max-h-96 bg-gray-900 text-white p-4 overflow-auto z-50 rounded-lg shadow-xl">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">📋 Debug Logs</h3>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => {
                            Logger.clearLogs()
                            alert('Logs cleared')
                        }}
                        className="text-gray-400 hover:text-white text-sm"
                    >
                        Clear
                    </button>
                    <button 
                        onClick={() => setShowLogs(false)}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            </div>
            
            <div className="space-y-1 text-xs font-mono">
                {logs.slice(-20).map((log, index) => (
                    <div key={index} className={`p-1 rounded ${
                        log.category.startsWith('ERROR') ? 'bg-red-900 text-red-200' :
                        log.category === 'PERFORMANCE' ? 'bg-blue-900 text-blue-200' :
                        log.category === 'STATE' ? 'bg-green-900 text-green-200' :
                        'bg-gray-800 text-gray-300'
                    }`}>
                        <div className="font-bold">[{log.category}] {log.message}</div>
                        {log.data && (
                            <div className="ml-2 text-gray-400">
                                {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                            </div>
                        )}
                        <div className="text-gray-500 text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>
            
            {logs.length === 0 && (
                <div className="text-gray-500 text-center py-4">No logs yet</div>
            )}
        </div>
    )
}